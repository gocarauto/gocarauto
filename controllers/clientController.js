import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import database from '../database/db.js';

/**
 * Client Controller
 * Manages customer relationship data and client-specific interactions.
 */
const clientController = {
    /**
     * Retrieve all clients with optional search and sorting.
     */
    getAllClients: async (req, res) => {
        try {
            const { search, sortBy = 'full_name', order = 'ASC' } = req.query;

            const allowedSortColumns = ['full_name', 'email', 'phone', 'total_spent', 'join_date'];
            const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'full_name';
            const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

            let query = `
                SELECT c.*, ref.full_name as referred_by_name, ref.phone as referred_by_phone
                FROM clients c
                LEFT JOIN clients ref ON c.referred_by_client_id = ref.id
                WHERE 1=1
            `;
            const params = [];

            if (search) {
                query += ' AND (c.full_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR ref.full_name LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            query += ` ORDER BY c.${safeSortBy} ${safeOrder}`;

            const clients = await database.query(query, params);
            res.json({ success: true, data: clients });
        } catch (error) {
            console.error('SERVER_CLIENT_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch clients' });
        }
    },

    /**
     * Get a specific client by ID, including their vehicles and referral attribution.
     */
    getClientById: async (req, res) => {
        try {
            const client = await database.get(
                `SELECT c.*, ref.full_name as referred_by_name, ref.phone as referred_by_phone
                 FROM clients c
                 LEFT JOIN clients ref ON c.referred_by_client_id = ref.id
                 WHERE c.id = ?`,
                [req.params.id]
            );

            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }

            const vehicles = await database.query(
                'SELECT * FROM vehicles WHERE client_id = ?',
                [req.params.id]
            );

            // Fetch any clients referred by this client
            const referredClients = await database.query(
                `SELECT id, full_name, phone, total_spent, join_date 
                 FROM clients 
                 WHERE referred_by_client_id = ?
                 ORDER BY join_date DESC`,
                [req.params.id]
            );

            res.json({ success: true, data: { ...client, vehicles, referredClients } });
        } catch (error) {
            console.error('SERVER_CLIENT_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch client' });
        }
    },

    /**
     * Create a new client record.
     */
    createClient: async (req, res) => {
        try {
            const { fullName, email, phone, address, referralSource, referredByClientId, notes } = req.body;

            if (!fullName || !phone) {
                return res.status(400).json({ error: 'Full Name and Phone are required' });
            }

            const finalEmail = email && email.trim() !== '' ? email.trim() : null;
            let refClientId = referredByClientId ? parseInt(referredByClientId, 10) : null;
            let refSource = referralSource || null;

            // If referredByClientId is passed, ensure referralSource is updated with the referrer name if empty
            if (refClientId && !refSource) {
                const referrer = await database.get('SELECT full_name FROM clients WHERE id = ?', [refClientId]);
                if (referrer) refSource = referrer.full_name;
            }

            const result = await database.run(
                `INSERT INTO clients (full_name, email, phone, address, referral_source, referred_by_client_id, notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [fullName, finalEmail, phone, address, refSource, refClientId, notes]
            );

            res.status(201).json({
                success: true,
                message: 'Client created successfully',
                data: { id: result.id }
            });
        } catch (error) {
            console.error('SERVER_CLIENT_ERROR:', error);
            if (error.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Email or phone already exists' });
            }
            res.status(500).json({ error: 'Failed to create client' });
        }
    },

    /**
     * Update an existing client's information.
     */
    updateClient: async (req, res) => {
        try {
            const { fullName, email, phone, address, referralSource, referredByClientId, notes } = req.body;
            const finalEmail = email && email.trim() !== '' ? email.trim() : null;
            const refClientId = referredByClientId !== undefined ? (referredByClientId ? parseInt(referredByClientId, 10) : null) : undefined;

            let query = `
                UPDATE clients 
                SET full_name = ?, email = ?, phone = ?, address = ?, referral_source = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            `;
            const params = [fullName, finalEmail, phone, address, referralSource, notes];

            if (refClientId !== undefined) {
                query = `
                    UPDATE clients 
                    SET full_name = ?, email = ?, phone = ?, address = ?, referral_source = ?, referred_by_client_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
                `;
                params.splice(5, 0, refClientId);
            }

            query += ' WHERE id = ?';
            params.push(req.params.id);

            const result = await database.run(query, params);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Client not found' });
            }

            // Sync denormalized client_name on all vehicles owned by this client
            if (fullName) {
                await database.run(
                    'UPDATE vehicles SET client_name = ?, updated_at = CURRENT_TIMESTAMP WHERE client_id = ?',
                    [fullName, req.params.id]
                );
            }

            res.json({ success: true, message: 'Client updated successfully' });
        } catch (error) {
            console.error('SERVER_CLIENT_ERROR:', error);
            res.status(500).json({ error: 'Failed to update client' });
        }
    },

    /**
     * Delete a client record.
     */
    deleteClient: async (req, res) => {
        try {
            const result = await database.run('DELETE FROM clients WHERE id = ?', [req.params.id]);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Client not found' });
            }

            res.json({ success: true, message: 'Client deleted successfully' });
        } catch (error) {
            console.error('SERVER_CLIENT_ERROR:', error);
            res.status(500).json({ error: 'Failed to delete client' });
        }
    },

    /**
     * Get aggregated statistics for a specific client.
     */
    getClientStats: async (req, res) => {
        try {
            const stats = await database.get(
                `SELECT 
                    COUNT(DISTINCT v.id) as totalVehicles,
                    COUNT(DISTINCT sreq.id) as totalServiceRequests,
                    COALESCE(SUM(src.total_price), 0) as totalSpent,
                    MAX(src.service_date) as lastServiceDate
                 FROM clients c
                 LEFT JOIN vehicles v ON c.id = v.client_id
                 LEFT JOIN service_requests sreq ON v.id = sreq.vehicle_id
                 LEFT JOIN service_records src ON sreq.id = src.request_id
                 WHERE c.id = ?
                 GROUP BY c.id`,
                [req.params.id]
            );

            res.json({ success: true, data: stats || {} });
        } catch (error) {
            console.error('SERVER_CLIENT_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    },

    /**
     * Generate a 24-hour magic login link for a client.
     */
    generateMagicLink: async (req, res) => {
        try {
            const client = await database.get('SELECT * FROM clients WHERE id = ?', [req.params.id]);

            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }

            const magicToken = jwt.sign(
                { id: client.id, type: 'magic_link' },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            const portalUrl = process.env.CUSTOMER_PORTAL_URL || 'http://localhost:5174';
            const magicUrl = `${portalUrl}/magic/${magicToken}`;

            res.json({
                success: true,
                data: {
                    token: magicToken,
                    url: magicUrl,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                }
            });
        } catch (error) {
            console.error('SERVER_CLIENT_ERROR:', error);
            res.status(500).json({ error: 'Failed to generate link' });
        }
    },

    /**
     * Administratively reset a customer's portal password.
     */
    resetPassword: async (req, res) => {
        try {
            const { id } = req.params;
            const { newPassword } = req.body;

            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ error: 'Password must be at least 6 characters' });
            }

            const client = await database.get('SELECT id FROM clients WHERE id = ?', [id]);
            if (!client) {
                return res.status(404).json({ error: 'Client not found' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await database.run(
                'UPDATE clients SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedPassword, id]
            );

            res.json({ success: true, message: 'Password reset successfully' });
        } catch (error) {
            console.error('SERVER_CLIENT_ERROR:', error);
            res.status(500).json({ error: 'Failed to reset password' });
        }
    }
};

export default clientController;
