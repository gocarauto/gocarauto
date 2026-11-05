import bcrypt from 'bcrypt';
import database from '../database/db.js';

/**
 * User Controller (Staff Management)
 * Handles administrative actions for staff accounts and access control.
 */
const userController = {
    /**
     * Fetch all staff members.
     */
    getAllUsers: async (req, res) => {
        try {
            const users = await database.query(
                'SELECT id, name, email, mobile, role, updated_at FROM users ORDER BY role ASC, name ASC'
            );
            res.json({ success: true, data: users });
        } catch (error) {
            console.error('SERVER_USER_ERROR:', error);
            res.status(500).json({ error: 'Failed to fetch staff directory' });
        }
    },

    /**
     * Create a new staff account.
     */
    createUser: async (req, res) => {
        try {
            const { name, email, role, mobile, password } = req.body;

            if (!name || !email || !role || !password) {
                return res.status(400).json({ error: 'All primary fields are required (Name, Email, Role, Password)' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const result = await database.run(
                'INSERT INTO users (name, email, role, mobile, password_hash) VALUES (?, ?, ?, ?, ?)',
                [name, email, role, mobile, hashedPassword]
            );

            res.status(201).json({
                success: true,
                message: 'Staff account created successfully',
                data: { id: result.id }
            });
        } catch (error) {
            console.error('SERVER_USER_ERROR:', error);
            if (error.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            res.status(500).json({ error: 'Failed to create account' });
        }
    },

    /**
     * Update an existing staff account.
     */
    updateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, role, mobile, password } = req.body;

            // GOCAR-SEC-08: Fetch current record to prevent blind overwrite of omitted attributes
            const current = await database.get('SELECT * FROM users WHERE id = ?', [id]);
            if (!current) {
                return res.status(404).json({ error: 'Account not found' });
            }

            const updatedName = name !== undefined ? name : current.name;
            const updatedEmail = email !== undefined ? email : current.email;
            const updatedRole = role !== undefined ? role : current.role;
            const updatedMobile = mobile !== undefined ? mobile : current.mobile;

            let query = 'UPDATE users SET name = ?, email = ?, role = ?, mobile = ?, updated_at = CURRENT_TIMESTAMP';
            const params = [updatedName, updatedEmail, updatedRole, updatedMobile];

            if (password && password.trim() !== '') {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                query += ', password_hash = ?';
                params.push(hashedPassword);
            }

            query += ' WHERE id = ?';
            params.push(id);

            const result = await database.run(query, params);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Account not found' });
            }

            res.json({ success: true, message: 'Account updated successfully' });
        } catch (error) {
            console.error('SERVER_USER_ERROR:', error);
            res.status(500).json({ error: 'Failed to update account' });
        }
    },

    /**
     * Permanently remove a staff account.
     */
    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;

            // Prevent self-deletion if needed (handled by middleware usually, but good to check)
            if (req.user?.id === parseInt(id)) {
                return res.status(403).json({ error: 'Cannot delete current session account' });
            }

            const result = await database.run('DELETE FROM users WHERE id = ?', [id]);

            if (result.changes === 0) {
                return res.status(404).json({ error: 'Account not found' });
            }

            res.json({ success: true, message: 'Account permanently removed' });
        } catch (error) {
            console.error('SERVER_USER_ERROR:', error);
            res.status(500).json({ error: 'Failed to remove account' });
        }
    }
};

export default userController;
