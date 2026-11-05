import database from '../database/db.js';

/**
 * Consignment Controller
 * Manages used car consignment leads, inspections, and sale workflows.
 */
const consignmentController = {
    /**
     * Get all consignment requests for staff command desk.
     */
    getAllRequests: async (req, res) => {
        try {
            const { status } = req.query;
            let query = `
                SELECT cr.*, 
                       c.full_name as client_name, c.phone as client_phone, c.email as client_email,
                       v.make, v.model, v.year, v.license_plate, v.vin, v.current_mileage as vehicle_current_mileage
                FROM consignment_requests cr
                JOIN clients c ON cr.client_id = c.id
                JOIN vehicles v ON cr.vehicle_id = v.id
            `;
            const params = [];
            if (status && status !== 'all') {
                query += ' WHERE cr.status = ?';
                params.push(status);
            }
            query += ' ORDER BY cr.created_at DESC';

            const requests = await database.query(query, params);
            res.json({ success: true, data: requests });
        } catch (error) {
            console.error('SERVER_CONSIGNMENT_ERROR:', error);
            res.status(500).json({ success: false, error: 'Failed to retrieve consignment requests' });
        }
    },

    /**
     * Get single consignment request by ID with vehicle service history summary.
     */
    getRequestById: async (req, res) => {
        try {
            const { id } = req.params;
            const request = await database.get(
                `SELECT cr.*, 
                        c.full_name as client_name, c.phone as client_phone, c.email as client_email,
                        v.make, v.model, v.year, v.license_plate, v.vin, v.current_mileage as vehicle_current_mileage
                 FROM consignment_requests cr
                 JOIN clients c ON cr.client_id = c.id
                 JOIN vehicles v ON cr.vehicle_id = v.id
                 WHERE cr.id = ?`,
                [id]
            );

            if (!request) {
                return res.status(404).json({ success: false, error: 'Consignment request not found' });
            }

            // Also attach service record count and total spent from GoCar history
            const serviceSummary = await database.get(
                `SELECT COUNT(DISTINCT sr.id) as service_count, 
                        COALESCE(SUM(rec.total_price), 0) as total_spent
                 FROM service_requests sr
                 LEFT JOIN service_records rec ON sr.id = rec.request_id
                 WHERE sr.vehicle_id = ?`,
                [request.vehicle_id]
            );

            res.json({
                success: true,
                data: {
                    ...request,
                    service_history_summary: serviceSummary
                }
            });
        } catch (error) {
            console.error('SERVER_CONSIGNMENT_ERROR:', error);
            res.status(500).json({ success: false, error: 'Failed to retrieve consignment request details' });
        }
    },

    /**
     * Update status or notes for a consignment lead.
     */
    updateRequestStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, notes, askingPrice } = req.body;

            const validStatuses = ['New', 'Contacted', 'Inspected', 'Listed', 'Sold', 'Cancelled'];
            if (status && !validStatuses.includes(status)) {
                return res.status(400).json({ success: false, error: `Invalid status. Valid values: ${validStatuses.join(', ')}` });
            }

            const current = await database.get('SELECT * FROM consignment_requests WHERE id = ?', [id]);
            if (!current) {
                return res.status(404).json({ success: false, error: 'Consignment request not found' });
            }

            const updatedStatus = status || current.status;
            const updatedNotes = notes !== undefined ? notes : current.notes;
            const updatedPrice = askingPrice !== undefined ? parseFloat(askingPrice) : current.asking_price;

            await database.run(
                `UPDATE consignment_requests 
                 SET status = ?, notes = ?, asking_price = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [updatedStatus, updatedNotes, updatedPrice, id]
            );

            res.json({
                success: true,
                message: 'Consignment request updated successfully',
                data: { id, status: updatedStatus, notes: updatedNotes, asking_price: updatedPrice }
            });
        } catch (error) {
            console.error('SERVER_CONSIGNMENT_ERROR:', error);
            res.status(500).json({ success: false, error: 'Failed to update consignment request' });
        }
    },

    /**
     * Consignment metrics summary for dashboard badges.
     */
    getSummaryStats: async (req, res) => {
        try {
            const stats = await database.query(
                `SELECT status, COUNT(*) as count 
                 FROM consignment_requests 
                 GROUP BY status`
            );

            const summary = {
                total: 0,
                new: 0,
                contacted: 0,
                inspected: 0,
                listed: 0,
                sold: 0,
                cancelled: 0
            };

            for (const row of stats) {
                summary.total += row.count;
                const key = row.status.toLowerCase();
                if (summary[key] !== undefined) {
                    summary[key] = row.count;
                }
            }

            res.json({ success: true, data: summary });
        } catch (error) {
            console.error('SERVER_CONSIGNMENT_ERROR:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch consignment stats' });
        }
    },

    /**
     * Get all active & archived consignment listings for staff hub.
     */
    getAllListings: async (req, res) => {
        try {
            const { status, search } = req.query;
            let query = `
                SELECT cl.*,
                       v.make, v.model, v.year, v.license_plate, v.vin, v.current_mileage, v.color,
                       c.full_name as client_name, c.phone as client_phone, c.email as client_email,
                       (SELECT COUNT(*) FROM service_requests sr WHERE sr.vehicle_id = cl.vehicle_id) as service_count,
                       (SELECT COALESCE(SUM(rec.total_price), 0) 
                        FROM service_records rec 
                        JOIN service_requests sreq ON rec.request_id = sreq.id 
                        WHERE sreq.vehicle_id = cl.vehicle_id) as total_service_spent
                FROM consignment_listings cl
                JOIN vehicles v ON cl.vehicle_id = v.id
                JOIN clients c ON cl.client_id = c.id
            `;
            const conditions = [];
            const params = [];

            if (status && status !== 'all') {
                conditions.push('cl.listing_status = ?');
                params.push(status);
            }

            if (search) {
                conditions.push('(v.make LIKE ? OR v.model LIKE ? OR v.license_plate LIKE ? OR c.full_name LIKE ?)');
                const searchParam = `%${search}%`;
                params.push(searchParam, searchParam, searchParam, searchParam);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY cl.created_at DESC';

            const listings = await database.query(query, params);
            res.json({ success: true, data: listings });
        } catch (error) {
            console.error('SERVER_CONSIGNMENT_ERROR:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch consignment listings' });
        }
    },

    /**
     * Get single consignment listing with full vehicle & service history details.
     */
    getListingById: async (req, res) => {
        try {
            const { id } = req.params;
            const listing = await database.get(
                `SELECT cl.*,
                        v.make, v.model, v.year, v.license_plate, v.vin, v.current_mileage, v.color,
                        c.full_name as client_name, c.phone as client_phone, c.email as client_email,
                        cr.notes as request_notes
                 FROM consignment_listings cl
                 JOIN vehicles v ON cl.vehicle_id = v.id
                 JOIN clients c ON cl.client_id = c.id
                 LEFT JOIN consignment_requests cr ON cl.request_id = cr.id
                 WHERE cl.id = ?`,
                [id]
            );

            if (!listing) {
                return res.status(404).json({ success: false, error: 'Consignment listing not found' });
            }

            // Fetch service history summary
            const serviceHistory = await database.query(
                `SELECT sr.id as request_id, sr.service_type, sr.completion_date, sr.status,
                        COALESCE(SUM(rec.total_price), 0) as total_cost,
                        GROUP_CONCAT(rec.service_description, ' | ') as services_rendered
                 FROM service_requests sr
                 LEFT JOIN service_records rec ON sr.id = rec.request_id
                 WHERE sr.vehicle_id = ?
                 GROUP BY sr.id
                 ORDER BY sr.created_at DESC`,
                [listing.vehicle_id]
            );

            res.json({
                success: true,
                data: {
                    ...listing,
                    public_passport_id: listing.vin || listing.license_plate || `V-${listing.vehicle_id}`,
                    service_history: serviceHistory
                }
            });
        } catch (error) {
            console.error('SERVER_CONSIGNMENT_ERROR:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch consignment listing details' });
        }
    },

    /**
     * Create a new consignment listing (standalone or converted from a customer request).
     */
    createListing: async (req, res) => {
        try {
            const {
                requestId,
                vehicleId,
                clientId,
                askingPrice,
                commissionType = 'Percentage',
                commissionRate = 2.50,
                commissionAmount,
                listingStatus = 'Intake',
                fbMarketplaceUrl,
                notes
            } = req.body;

            if (!vehicleId || !clientId || !askingPrice) {
                return res.status(400).json({
                    success: false,
                    error: 'Vehicle ID, Client ID, and Asking Price are required'
                });
            }

            const numPrice = parseFloat(askingPrice);
            const numRate = parseFloat(commissionRate || 2.50);
            let calculatedCommission = 0;
            if (commissionType === 'Percentage') {
                calculatedCommission = Math.round((numPrice * numRate) / 100);
            } else {
                calculatedCommission = parseFloat(commissionAmount || 0);
            }

            const result = await database.run(
                `INSERT INTO consignment_listings (
                    request_id, vehicle_id, client_id, asking_price,
                    commission_type, commission_rate, commission_amount,
                    listing_status, fb_marketplace_url, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    requestId || null,
                    vehicleId,
                    clientId,
                    numPrice,
                    commissionType,
                    numRate,
                    calculatedCommission,
                    listingStatus,
                    fbMarketplaceUrl || null,
                    notes || null
                ]
            );

            // If linked to an inbound request, update request status to 'Listed'
            if (requestId) {
                await database.run(
                    `UPDATE consignment_requests 
                     SET status = 'Listed', updated_at = CURRENT_TIMESTAMP 
                     WHERE id = ?`,
                    [requestId]
                );
            }

            res.status(201).json({
                success: true,
                message: 'Consignment listing created successfully',
                data: {
                    id: result.id || result.lastID,
                    vehicle_id: vehicleId,
                    client_id: clientId,
                    asking_price: numPrice,
                    listing_status: listingStatus,
                    estimated_commission: calculatedCommission
                }
            });
        } catch (error) {
            console.error('SERVER_CONSIGNMENT_ERROR:', error);
            res.status(500).json({ success: false, error: 'Failed to create consignment listing' });
        }
    },

    /**
     * Update listing details, staging progress, or pricing.
     */
    updateListing: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                askingPrice,
                soldPrice,
                commissionType,
                commissionRate,
                commissionAmount,
                listingStatus,
                fbMarketplaceUrl,
                notes
            } = req.body;

            const current = await database.get('SELECT * FROM consignment_listings WHERE id = ?', [id]);
            if (!current) {
                return res.status(404).json({ success: false, error: 'Consignment listing not found' });
            }

            // GOCAR-SEC-06: Prevent re-settling an already sold listing (State machine idempotency)
            if (current.listing_status === 'Sold') {
                return res.status(409).json({ success: false, error: 'Listing has already been settled and marked as Sold' });
            }

            const validStatuses = ['Intake', 'Staged', 'Listed', 'Buyer Viewing', 'Sold', 'Withdrawn'];
            if (listingStatus && !validStatuses.includes(listingStatus)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid listing status. Valid options: ${validStatuses.join(', ')}`
                });
            }

            const newPrice = askingPrice !== undefined ? parseFloat(askingPrice) : current.asking_price;
            const newSoldPrice = soldPrice !== undefined ? parseFloat(soldPrice) : current.sold_price;
            const newCommType = commissionType || current.commission_type;
            const newCommRate = commissionRate !== undefined ? parseFloat(commissionRate) : current.commission_rate;
            let newCommAmount = current.commission_amount;

            if (commissionAmount !== undefined) {
                newCommAmount = parseFloat(commissionAmount);
            } else if (newCommType === 'Percentage') {
                const basePrice = newSoldPrice || newPrice;
                newCommAmount = Math.round((basePrice * newCommRate) / 100);
            }

            const newStatus = listingStatus || current.listing_status;
            const newUrl = fbMarketplaceUrl !== undefined ? fbMarketplaceUrl : current.fb_marketplace_url;
            const newNotes = notes !== undefined ? notes : current.notes;

            await database.run(
                `UPDATE consignment_listings
                 SET asking_price = ?, sold_price = ?, commission_type = ?,
                     commission_rate = ?, commission_amount = ?, listing_status = ?,
                     fb_marketplace_url = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
                    newPrice,
                    newSoldPrice,
                    newCommType,
                    newCommRate,
                    newCommAmount,
                    newStatus,
                    newUrl,
                    newNotes,
                    id
                ]
            );

            // If changed to Sold and has request_id, update request status too
            if (newStatus === 'Sold' && current.request_id) {
                await database.run(
                    `UPDATE consignment_requests 
                     SET status = 'Sold', updated_at = CURRENT_TIMESTAMP 
                     WHERE id = ?`,
                    [current.request_id]
                );
            }

            res.json({
                success: true,
                message: 'Consignment listing updated successfully',
                data: {
                    id,
                    asking_price: newPrice,
                    sold_price: newSoldPrice,
                    listing_status: newStatus,
                    commission_amount: newCommAmount
                }
            });
        } catch (error) {
            console.error('SERVER_CONSIGNMENT_ERROR:', error);
            res.status(500).json({ success: false, error: 'Failed to update consignment listing' });
        }
    },

    /**
     * Settle a closed consignment deal: compute final GoCar cut and mark Sold.
     */
    settleListing: async (req, res) => {
        try {
            const { id } = req.params;
            const { soldPrice, commissionType, commissionRate, commissionAmount, notes } = req.body;

            if (!soldPrice || isNaN(soldPrice) || parseFloat(soldPrice) <= 0) {
                return res.status(400).json({ success: false, error: 'Valid sold price is required to settle listing' });
            }

            const current = await database.get('SELECT * FROM consignment_listings WHERE id = ?', [id]);
            if (!current) {
                return res.status(404).json({ success: false, error: 'Consignment listing not found' });
            }

            // GOCAR-SEC-06: Prevent re-settling an already sold listing (State machine idempotency)
            if (current.listing_status === 'Sold') {
                return res.status(409).json({ success: false, error: 'Listing has already been settled and marked as Sold' });
            }

            const numSoldPrice = parseFloat(soldPrice);
            const finalType = commissionType || current.commission_type || 'Percentage';
            const finalRate = commissionRate !== undefined ? parseFloat(commissionRate) : (current.commission_rate || 2.50);

            let finalCommission = 0;
            if (finalType === 'Percentage') {
                finalCommission = Math.round((numSoldPrice * finalRate) / 100);
            } else {
                finalCommission = parseFloat(commissionAmount || current.commission_amount || 0);
            }

            const closingNotes = notes || (current.notes ? `${current.notes} | Settled deal at ${numSoldPrice} EGP` : `Settled deal at ${numSoldPrice} EGP`);

            await database.run(
                `UPDATE consignment_listings
                 SET sold_price = ?, commission_type = ?, commission_rate = ?,
                     commission_amount = ?, listing_status = 'Sold', notes = ?,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [numSoldPrice, finalType, finalRate, finalCommission, closingNotes, id]
            );

            // Sync parent request
            if (current.request_id) {
                await database.run(
                    `UPDATE consignment_requests 
                     SET status = 'Sold', updated_at = CURRENT_TIMESTAMP 
                     WHERE id = ?`,
                    [current.request_id]
                );
            }

            res.json({
                success: true,
                message: 'Consignment deal settled successfully! Commission earned.',
                data: {
                    id,
                    sold_price: numSoldPrice,
                    commission_type: finalType,
                    commission_rate: finalRate,
                    commission_earned: finalCommission,
                    status: 'Sold'
                }
            });
        } catch (error) {
            console.error('SERVER_CONSIGNMENT_ERROR:', error);
            res.status(500).json({ success: false, error: 'Failed to settle consignment deal' });
        }
    },

    /**
     * Pipeline summary analytics across all pipeline stages.
     */
    getPipelineSummary: async (req, res) => {
        try {
            const listings = await database.query(`
                SELECT listing_status, 
                       COUNT(*) as count, 
                       COALESCE(SUM(asking_price), 0) as total_asking,
                       COALESCE(SUM(sold_price), 0) as total_sold,
                       COALESCE(SUM(commission_amount), 0) as total_commission
                FROM consignment_listings
                GROUP BY listing_status
            `);

            const pipeline = {
                intake: 0,
                staged: 0,
                listed: 0,
                buyerViewing: 0,
                sold: 0,
                withdrawn: 0,
                totalActiveValue: 0,
                totalEarnedCommission: 0,
                soldCount: 0
            };

            for (const row of listings) {
                const status = row.listing_status;
                if (status === 'Intake') pipeline.intake = row.count;
                else if (status === 'Staged') pipeline.staged = row.count;
                else if (status === 'Listed') pipeline.listed = row.count;
                else if (status === 'Buyer Viewing') pipeline.buyerViewing = row.count;
                else if (status === 'Sold') {
                    pipeline.sold = row.count;
                    pipeline.soldCount = row.count;
                    pipeline.totalEarnedCommission += row.total_commission;
                } else if (status === 'Withdrawn') {
                    pipeline.withdrawn = row.count;
                }

                if (['Intake', 'Staged', 'Listed', 'Buyer Viewing'].includes(status)) {
                    pipeline.totalActiveValue += row.total_asking;
                }
            }

            res.json({ success: true, data: pipeline });
        } catch (error) {
            console.error('SERVER_CONSIGNMENT_ERROR:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch consignment pipeline summary' });
        }
    }
};

export default consignmentController;
