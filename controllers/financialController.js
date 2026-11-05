import database from '../database/db.js';
import { generateInvoicePDF } from '../utils/pdf-generator.js';
import { generateInvoiceHTML } from '../utils/invoice-viewer.js';
import { canonicalizeServiceType } from '../utils/maintenance-helper.js';

/**
 * Financial Controller
 * Handles invoicing, payment tracking, and document generation.
 */

const calculateServiceFee = (subtotal) => {
    if (subtotal <= 0) return 0;
    if (subtotal <= 10000) return subtotal * 0.15;
    if (subtotal <= 20000) return subtotal * 0.14;
    if (subtotal <= 30000) return subtotal * 0.13;
    if (subtotal <= 40000) return subtotal * 0.12;
    if (subtotal <= 50000) return subtotal * 0.11;
    return subtotal * 0.10;
};

const financialController = {
    /**
     * Retrieve all financial transactions with request details.
     */
    getAllTransactions: async (req, res) => {
        try {
            const { status, requestId } = req.query;

            let query = `
                SELECT ft.*, sr.client_name, sr.vehicle_info, c.phone as client_phone
                FROM financial_transactions ft
                JOIN service_requests sr ON ft.request_id = sr.id
                LEFT JOIN clients c ON sr.client_id = c.id
                WHERE 1=1
            `;
            const params = [];

            if (status) {
                query += ' AND ft.payment_status = ?';
                params.push(status);
            }

            if (requestId) {
                query += ' AND ft.request_id = ?';
                params.push(requestId);
            }

            query += ' ORDER BY ft.created_at DESC';

            const transactions = await database.query(query, params);
            res.json({ success: true, data: transactions });
        } catch (error) {
            console.error('SERVER_FINANCIAL_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch transactions' });
        }
    },

    /**
     * Get a specific transaction by ID.
     */
    getTransactionById: async (req, res) => {
        try {
            const transaction = await database.get(
                `SELECT ft.*, sr.client_name, sr.vehicle_info, sr.client_id, sr.vehicle_id
                 FROM financial_transactions ft
                 JOIN service_requests sr ON ft.request_id = sr.id
                 WHERE ft.id = ?`,
                [req.params.id]
            );

            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            res.json({ success: true, data: transaction });
        } catch (error) {
            console.error('SERVER_FINANCIAL_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch transaction' });
        }
    },

    /**
     * Generate a new invoice for a completed service request.
     */
    generateInvoice: async (req, res) => {
        try {
            const { requestId } = req.body;

            if (!requestId) {
                return res.status(400).json({ error: 'Request ID is required' });
            }

            const existing = await database.get(
                'SELECT * FROM financial_transactions WHERE request_id = ?',
                [requestId]
            );

            if (existing) {
                return res.status(400).json({ error: 'Invoice already exists' });
            }

            const total = await database.get(
                'SELECT COALESCE(SUM(total_price), 0) as total FROM service_records WHERE request_id = ?',
                [requestId]
            );

            if (total.total === 0) {
                return res.status(400).json({ error: 'No service records found' });
            }

            const lastInvoice = await database.get(
                'SELECT invoice_number FROM financial_transactions ORDER BY id DESC LIMIT 1'
            );

            // ── Fetch the service request's actual date (supports backdating) ──
            const serviceRequest = await database.get(
                'SELECT request_date FROM service_requests WHERE id = ?',
                [requestId]
            );
            const invoiceDate = serviceRequest?.request_date
                ? new Date(serviceRequest.request_date)
                : new Date();
            const invoiceYear = invoiceDate.getFullYear();
            const invoiceDateStr = invoiceDate.toISOString();

            // Now resolve the final invoice number using the correct year
            let invoiceNumber;
            if (lastInvoice) {
                const lastNumber = parseInt(lastInvoice.invoice_number.split('-').pop());
                invoiceNumber = `INV-${invoiceYear}-${String(lastNumber + 1).padStart(3, '0')}`;
            } else {
                invoiceNumber = `INV-${invoiceYear}-001`;
            }

            const currency = req.body.currency || 'EGP';
            const taxRate = req.body.taxRate !== undefined ? parseFloat(req.body.taxRate) : 0.00;
            const sparePartsMarkup = req.body.sparePartsMarkup !== undefined ? parseFloat(req.body.sparePartsMarkup) : 0;
            const subtotal = parseFloat(total.total);
            const serviceFee = req.body.serviceFee !== undefined ? parseFloat(req.body.serviceFee) : calculateServiceFee(subtotal);
            const grandTotal = subtotal + serviceFee + sparePartsMarkup;

            const result = await database.run(
                `INSERT INTO financial_transactions (request_id, invoice_number, total_amount_due, amount_paid, payment_status, currency, tax_rate, service_fee, spare_parts_markup, created_at, updated_at)
                 VALUES (?, ?, ?, 0, 'Pending', ?, ?, ?, ?, ?, ?)`,
                [requestId, invoiceNumber, grandTotal, currency, taxRate, serviceFee, sparePartsMarkup, invoiceDateStr, invoiceDateStr]
            );

            await database.run(
                'UPDATE service_requests SET status = ? WHERE id = ?',
                ['Invoiced', requestId]
            );

            const { updateMaintenanceLedger } = await import('../utils/maintenance-helper.js');
            await updateMaintenanceLedger(requestId);

            res.status(201).json({
                success: true,
                message: 'Invoice generated successfully',
                data: { id: result.id, invoiceNumber, totalAmountDue: grandTotal }
            });
        } catch (error) {
            console.error('SERVER_FINANCIAL_ERROR:', error);
            res.status(500).json({ error: 'Failed to generate invoice' });
        }
    },

    /**
     * Update an existing invoice for a completed/invoiced service request.
     */
    updateInvoice: async (req, res) => {
        try {
            const { requestId } = req.body;

            if (!requestId) {
                return res.status(400).json({ error: 'Request ID is required' });
            }

            const transaction = await database.get(
                'SELECT * FROM financial_transactions WHERE request_id = ?',
                [requestId]
            );

            if (!transaction) {
                return res.status(404).json({ error: 'Invoice not found' });
            }

            const total = await database.get(
                'SELECT COALESCE(SUM(total_price), 0) as total FROM service_records WHERE request_id = ?',
                [requestId]
            );

            const taxRate = req.body.taxRate !== undefined ? parseFloat(req.body.taxRate) : parseFloat(transaction.tax_rate);
            const sparePartsMarkup = req.body.sparePartsMarkup !== undefined ? parseFloat(req.body.sparePartsMarkup) : parseFloat(transaction.spare_parts_markup);
            const subtotal = parseFloat(total.total);
            const serviceFee = req.body.serviceFee !== undefined ? parseFloat(req.body.serviceFee) : calculateServiceFee(subtotal);
            const grandTotal = subtotal + serviceFee + sparePartsMarkup;

            await database.run(
                `UPDATE financial_transactions 
                 SET total_amount_due = ?, tax_rate = ?, service_fee = ?, spare_parts_markup = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [grandTotal, taxRate, serviceFee, sparePartsMarkup, transaction.id]
            );

            const { updateMaintenanceLedger } = await import('../utils/maintenance-helper.js');
            await updateMaintenanceLedger(requestId);

            res.json({
                success: true,
                message: 'Invoice updated successfully',
                data: { id: transaction.id, invoiceNumber: transaction.invoice_number, totalAmountDue: grandTotal }
            });
        } catch (error) {
            console.error('SERVER_FINANCIAL_ERROR:', error);
            res.status(500).json({ error: 'Failed to update invoice' });
        }
    },

    /**
     * Update the payment status for a transaction.
     */
    updatePayment: async (req, res) => {
        try {
            const { amountPaid, additionalAmount, paymentMethod } = req.body;

            if (amountPaid === undefined && additionalAmount === undefined) {
                return res.status(400).json({ error: 'Amount is required' });
            }

            const transaction = await database.get(
                'SELECT * FROM financial_transactions WHERE id = ?',
                [req.params.id]
            );

            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            // Feature 2: Partial Payments support
            const currentPaid = parseFloat(transaction.amount_paid || 0);
            const totalPaid = additionalAmount !== undefined 
                ? currentPaid + parseFloat(additionalAmount) 
                : parseFloat(amountPaid);
                
            const totalDue = parseFloat(transaction.total_amount_due);
            const paymentStatus = totalPaid >= totalDue ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Pending');

            await database.run(
                `UPDATE financial_transactions 
                 SET amount_paid = ?, payment_status = ?, payment_method = ?, payment_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [totalPaid, paymentStatus, paymentMethod, req.params.id]
            );

            if (paymentStatus === 'Paid') {
                await database.run(
                    'UPDATE service_requests SET status = ? WHERE id = ?',
                    ['Paid', transaction.request_id]
                );
                
                // Feature 7: Auto-Reminder on Payment
                // Look at actual service line items with tracking_point — not the broad service_type field
                const sr = await database.get(
                    'SELECT client_id, vehicle_id, service_type FROM service_requests WHERE id = ?',
                    [transaction.request_id]
                );
                
                if (sr) {
                    // Get all distinct tracking_point items from this invoice's records
                    const trackedItems = await database.query(
                        `SELECT DISTINCT si.tracking_point, si.km_interval, si.month_interval, si.item_name_ar
                         FROM service_records srec
                         JOIN service_items si ON srec.item_id = si.id
                         WHERE srec.request_id = ?
                           AND si.tracking_point IS NOT NULL
                           AND si.tracking_point != ''`,
                        [transaction.request_id]
                    );
                    
                    if (trackedItems.length > 0) {
                        // Create one precision reminder per unique tracking_point found
                        for (const item of trackedItems) {
                            const months = item.month_interval || 8;
                            const dueDate = new Date();
                            dueDate.setMonth(dueDate.getMonth() + months);
                            const dueDateStr = dueDate.toISOString().split('T')[0];
                            const canonicalType = canonicalizeServiceType(item.tracking_point || item.item_name_ar || item.item_name);
                            
                            // Duplicate guard per vehicle + canonical service type
                            const existing = await database.get(
                                `SELECT id FROM service_reminders 
                                 WHERE vehicle_id = ? AND (service_type = ? OR service_type = ?) AND status = 'Pending'`,
                                [sr.vehicle_id, canonicalType, item.tracking_point]
                            );
                            
                            if (!existing) {
                                await database.run(
                                    `INSERT INTO service_reminders 
                                     (client_id, vehicle_id, service_type, due_date, notes, status, interval_km, interval_months)
                                     VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?)`,
                                    [
                                        sr.client_id, sr.vehicle_id,
                                        canonicalType,
                                        dueDateStr,
                                        `Auto-detected from paid invoice — ${item.item_name_ar || item.item_name || canonicalType}`,
                                        item.km_interval || null,
                                        months
                                    ]
                                );
                            }
                        }
                    } else if (sr.service_type) {
                        // Fallback: no tracked items — create a generic reminder from service_type
                        const dueDate = new Date();
                        dueDate.setMonth(dueDate.getMonth() + 6);
                        const dueDateStr = dueDate.toISOString().split('T')[0];
                        const canonicalType = canonicalizeServiceType(sr.service_type);
                        
                        const existing = await database.get(
                            `SELECT id FROM service_reminders 
                             WHERE vehicle_id = ? AND (service_type = ? OR service_type = ?) AND status = 'Pending'`,
                            [sr.vehicle_id, canonicalType, sr.service_type]
                        );
                        
                        if (!existing) {
                            await database.run(
                                `INSERT INTO service_reminders (client_id, vehicle_id, service_type, due_date, notes, status, interval_months)
                                 VALUES (?, ?, ?, ?, 'Auto-scheduled from paid invoice', 'Pending', 6)`,
                                [sr.client_id, sr.vehicle_id, canonicalType, dueDateStr]
                            );
                        }
                    }
                }
            }

            res.json({ 
                success: true, 
                message: 'Payment updated', 
                data: { paymentStatus, amountPaid: totalPaid, amountDue: totalDue, outstanding: Math.max(0, totalDue - totalPaid) } 
            });
        } catch (error) {
            console.error('SERVER_FINANCIAL_ERROR:', error);
            res.status(500).json({ error: 'Failed to update payment' });
        }
    },

    /**
     * Generate and deliver a PDF invoice.
     */
    getInvoicePDF: async (req, res) => {
        try {
            const transaction = await database.get(
                `SELECT ft.*, sr.client_name, sr.vehicle_info, sr.client_id, sr.vehicle_id, sr.service_type, sr.mileage
                 FROM financial_transactions ft
                 JOIN service_requests sr ON ft.request_id = sr.id
                 WHERE ft.id = ?`,
                [req.params.id]
            );

            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            if (req.user && req.user.userType === 'customer' && transaction.client_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied: You do not own this invoice' });
            }

            const customer = await database.get('SELECT * FROM clients WHERE id = ?', [transaction.client_id]);
            const records = await database.query(
                `SELECT sr.*, si.item_name, si.item_name_ar, si.category
                 FROM service_records sr
                 JOIN service_items si ON sr.item_id = si.id
                 WHERE sr.request_id = ?`,
                [transaction.request_id]
            );

            const pdfBuffer = await generateInvoicePDF({ transaction, customer, records });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${transaction.invoice_number}.pdf"`);
            res.send(pdfBuffer);
        } catch (error) {
            console.error('SERVER_FINANCIAL_ERROR:', error);
            res.status(500).json({ error: 'Failed to generate PDF' });
        }
    },

    /**
     * Generate an HTML viewing mode for an invoice.
     */
    getInvoiceView: async (req, res) => {
        try {
            const transaction = await database.get(
                `SELECT ft.*, sr.client_name, sr.vehicle_info, sr.client_id, sr.vehicle_id, sr.service_type, sr.mileage
                 FROM financial_transactions ft
                 JOIN service_requests sr ON ft.request_id = sr.id
                 WHERE ft.id = ?`,
                [req.params.id]
            );

            if (!transaction) {
                return res.status(404).send('Transaction not found');
            }

            if (req.user && req.user.userType === 'customer' && transaction.client_id !== req.user.id) {
                return res.status(403).send('Access denied: You do not own this invoice');
            }

            const customer = await database.get('SELECT * FROM clients WHERE id = ?', [transaction.client_id]);
            const records = await database.query(
                `SELECT sr.*, si.item_name, si.item_name_ar, si.category
                 FROM service_records sr
                 JOIN service_items si ON sr.item_id = si.id
                 WHERE sr.request_id = ?`,
                [transaction.request_id]
            );

            const htmlContent = generateInvoiceHTML({ transaction, customer, records });
            res.setHeader('Content-Type', 'text/html');
            res.send(htmlContent);
        } catch (error) {
            console.error('SERVER_FINANCIAL_ERROR:', error);
            res.status(500).send('Failed to generate view');
        }
    },

    /**
     * Delete an invoice and rollback request state.
     */
    deleteInvoice: async (req, res) => {
        try {
            const transaction = await database.get(
                'SELECT request_id FROM financial_transactions WHERE id = ?',
                [req.params.id]
            );

            if (!transaction) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            await database.run('DELETE FROM financial_transactions WHERE id = ?', [req.params.id]);
            await database.run("UPDATE service_requests SET status = 'Complete' WHERE id = ?", [transaction.request_id]);

            res.json({ success: true, message: 'Invoice deleted. Request reset to Complete.' });
        } catch (error) {
            console.error('SERVER_FINANCIAL_ERROR:', error);
            res.status(500).json({ error: 'Failed to delete invoice' });
        }
    }
};

export default financialController;
