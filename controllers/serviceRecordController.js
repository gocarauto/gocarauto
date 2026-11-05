import database from '../database/db.js';

/**
 * Service Record Controller
 * Manages the granular details of services performed (parts, labor, notes).
 */
const serviceRecordController = {
    /**
     * Retrieve all service records with optional request filtering.
     */
    getAllRecords: async (req, res) => {
        try {
            const { requestId } = req.query;

            let query = `
                SELECT sr.*, si.item_name, si.item_name_ar, si.category, u.name as staff_name
                FROM service_records sr
                JOIN service_items si ON sr.item_id = si.id
                LEFT JOIN users u ON sr.user_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (requestId) {
                query += ' AND sr.request_id = ?';
                params.push(requestId);
            }

            query += ' ORDER BY sr.service_date DESC';

            const records = await database.query(query, params);
            res.json({ success: true, data: records });
        } catch (error) {
            console.error('SERVER_RECORD_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch records' });
        }
    },

    /**
     * Log a single service entry.
     */
    createRecord: async (req, res) => {
        try {
            const { requestId, serviceDate, mileage, itemId, quantity, unitPrice, notes } = req.body;
            const userId = req.user.id;

            if (!requestId || !itemId || !quantity || !unitPrice) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const totalPrice = parseFloat(quantity) * parseFloat(unitPrice);

            const result = await database.run(
                `INSERT INTO service_records (request_id, service_date, mileage, user_id, item_id, quantity, unit_price, total_price, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [requestId, serviceDate || new Date().toISOString().split('T')[0], mileage, userId, itemId, quantity, unitPrice, totalPrice, notes]
            );

            res.status(201).json({ success: true, data: { id: result.id, totalPrice } });
        } catch (error) {
            console.error('SERVER_RECORD_ERROR:', error);
            res.status(500).json({ error: 'Failed to create record' });
        }
    },

    /**
     * Bulk log multiple service entries in a single transaction.
     */
    bulkCreateRecords: async (req, res) => {
        try {
            const { requestId, serviceDate, mileage, items } = req.body;
            const userId = req.user.id;

            if (!requestId || !items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Request ID and items array required' });
            }

            const tx = await database.beginTransaction();

            try {
                let grandTotal = 0;
                const recordIds = [];

                for (const item of items) {
                    const { itemId, quantity, unitPrice, notes } = item;
                    const totalPrice = parseFloat(quantity) * parseFloat(unitPrice);
                    grandTotal += totalPrice;

                    const result = await database.run(
                        `INSERT INTO service_records (request_id, service_date, mileage, user_id, item_id, quantity, unit_price, total_price, notes)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [requestId, serviceDate || new Date().toISOString().split('T')[0], mileage, userId, itemId, quantity, unitPrice, totalPrice, notes],
                        tx
                    );

                    recordIds.push(result.id);
                }

                await database.commit(tx);
                res.status(201).json({ success: true, data: { recordIds, grandTotal } });
            } catch (error) {
                await database.rollback(tx);
                throw error;
            }
        } catch (error) {
            console.error('SERVER_RECORD_ERROR:', error);
            res.status(500).json({ error: 'Failed to create records' });
        }
    },

    /**
     * Update an individual service record entry.
     */
    updateRecord: async (req, res) => {
        try {
            const { quantity, unitPrice, notes } = req.body;
            const totalPrice = parseFloat(quantity) * parseFloat(unitPrice);

            const result = await database.run(
                `UPDATE service_records 
                 SET quantity = ?, unit_price = ?, total_price = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [quantity, unitPrice, totalPrice, notes, req.params.id]
            );

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Record not found' });
            }

            res.json({ success: true, message: 'Record updated' });
        } catch (error) {
            console.error('SERVER_RECORD_ERROR:', error);
            res.status(500).json({ error: 'Failed to update record' });
        }
    },

    /**
     * Remove an individual service record entry.
     */
    deleteRecord: async (req, res) => {
        try {
            const result = await database.run('DELETE FROM service_records WHERE id = ?', [req.params.id]);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Record not found' });
            }

            res.json({ success: true, message: 'Record deleted' });
        } catch (error) {
            console.error('SERVER_RECORD_ERROR:', error);
            res.status(500).json({ error: 'Failed to delete record' });
        }
    }
};

export default serviceRecordController;
