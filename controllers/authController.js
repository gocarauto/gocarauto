import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import database from '../database/db.js';

/**
 * Authentication Controller
 * Handles all identity and access management logic.
 */
const authController = {
    /**
     * Authenticate staff members.
     */
    staffLogin: async (req, res) => {
        try {
            const { email, username, identifier, password } = req.body;
            const userIdentifier = (email || username || identifier || '').trim();

            if (!userIdentifier || !password) {
                return res.status(400).json({ error: 'Username/Email and password are required' });
            }

            // Support exact email, case-insensitive email, name/username, or prefix (e.g. 'admin' -> 'admin@%')
            const staff = await database.get(
                `SELECT * FROM users 
                 WHERE LOWER(email) = LOWER(?) 
                    OR LOWER(name) = LOWER(?) 
                    OR email LIKE ? 
                 LIMIT 1`,
                [userIdentifier, userIdentifier, `${userIdentifier}@%`]
            );

            if (!staff) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const isValidPassword = await bcrypt.compare(password, staff.password_hash);

            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // WHY: Include staff name in JWT so refresh (/auth/verify) preserves user name in sidebar
            const token = jwt.sign(
                {
                    id: staff.id,
                    name: staff.name,
                    email: staff.email,
                    role: staff.role,
                    userType: 'staff'
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            // In production with cross-origin deployments (Cloudflare Pages -> Render), SameSite=None + Secure is mandatory
            const isProd = process.env.NODE_ENV === 'production';
            res.cookie('token', token, {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                success: true,
                token,
                user: {
                    id: staff.id,
                    name: staff.name,
                    email: staff.email,
                    role: staff.role,
                    userType: 'staff'
                }
            });
        } catch (error) {
            console.error('SERVER_AUTH_ERROR:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    },

    /**
     * Authenticate customers via email/mobile.
     */
    customerLogin: async (req, res) => {
        try {
            const { identifier, password } = req.body;

            if (!identifier || !password) {
                return res.status(400).json({ error: 'Identifier and password are required' });
            }

            const trimmedIdentifier = identifier.trim();
            const cleanDigits = trimmedIdentifier.replace(/\D/g, '');

            // Build candidate phone representations to match DB records (+20..., 20..., 01..., etc.)
            const candidates = [trimmedIdentifier];
            if (cleanDigits.length >= 10) {
                if (cleanDigits.startsWith('01') && cleanDigits.length === 11) {
                    candidates.push(`+20${cleanDigits.substring(1)}`);
                    candidates.push(`20${cleanDigits.substring(1)}`);
                    candidates.push(cleanDigits);
                } else if (cleanDigits.startsWith('201') && cleanDigits.length === 12) {
                    candidates.push(`+${cleanDigits}`);
                    candidates.push(cleanDigits);
                    candidates.push(`0${cleanDigits.substring(2)}`);
                } else if (cleanDigits.startsWith('1') && cleanDigits.length === 10) {
                    candidates.push(`+20${cleanDigits}`);
                    candidates.push(`0${cleanDigits}`);
                    candidates.push(`20${cleanDigits}`);
                }
            }

            const placeholders = candidates.map(() => '?').join(', ');
            const customer = await database.get(
                `SELECT * FROM clients WHERE email = ? OR phone IN (${placeholders})`,
                [trimmedIdentifier, ...candidates]
            );

            if (!customer) {
                return res.status(401).json({ error: 'Client not found' });
            }

            if (!customer.password_hash) {
                return res.status(401).json({ error: 'Account not activated. Please register your account or use a magic login link.' });
            }

            const isValid = await bcrypt.compare(password, customer.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid security key' });
            }

            // WHY: Include full_name, phone, mobile, and hasPassword in JWT and response body for consistent client hydration
            const hasPassword = !!customer.password_hash;
            const token = jwt.sign(
                {
                    id: customer.id,
                    name: customer.full_name,
                    email: customer.email,
                    mobile: customer.phone,
                    phone: customer.phone,
                    userType: 'customer',
                    hasPassword
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            const isProd = process.env.NODE_ENV === 'production';
            res.cookie('token', token, {
                httpOnly: true,
                secure: isProd,
                sameSite: isProd ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                success: true,
                token,
                user: {
                    id: customer.id,
                    name: customer.full_name,
                    email: customer.email,
                    mobile: customer.phone,
                    phone: customer.phone,
                    userType: 'customer',
                    hasPassword
                }
            });
        } catch (error) {
            console.error('SERVER_AUTH_ERROR:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    },

    /**
     * Register a new customer account based on vehicle ownership.
     */
    customerRegister: async (req, res) => {
        try {
            const { licensePlate, phone, password } = req.body;

            if (!licensePlate || !phone || !password) {
                return res.status(400).json({ error: 'License plate, phone, and password are required' });
            }

            const clientQuery = `
                SELECT c.* FROM clients c
                JOIN vehicles v ON c.id = v.client_id
                WHERE v.license_plate = ? AND c.phone = ?
                LIMIT 1
            `;
            const customer = await database.get(clientQuery, [licensePlate, phone]);

            if (!customer) {
                return res.status(404).json({ error: 'Verification failed. Credentials do not match our records.' });
            }

            if (customer.password_hash) {
                return res.status(409).json({ error: 'Account already registered.' });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await database.run(
                'UPDATE clients SET password_hash = ? WHERE id = ?',
                [hashedPassword, customer.id]
            );

            res.json({ success: true, message: 'Account successfully registered.' });
        } catch (error) {
            console.error('SERVER_AUTH_ERROR:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    },

    /**
     * Process magic link tokens for rapid customer access.
     */
    magicLogin: async (req, res) => {
        try {
            const { token } = req.params;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.type !== 'magic_link') {
                return res.status(401).json({ error: 'Invalid magic link' });
            }

            const customer = await database.get('SELECT * FROM clients WHERE id = ?', [decoded.id]);

            if (!customer) {
                return res.status(401).json({ error: 'Client not found' });
            }

            // WHY: Include full_name, phone, mobile, and hasPassword in magic session token for consistent client hydration
            const hasPassword = !!customer.password_hash;
            const sessionToken = jwt.sign(
                {
                    id: customer.id,
                    name: customer.full_name,
                    email: customer.email,
                    mobile: customer.phone,
                    phone: customer.phone,
                    userType: 'customer',
                    hasPassword
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            res.cookie('token', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                success: true,
                token: sessionToken,
                user: {
                    id: customer.id,
                    name: customer.full_name,
                    email: customer.email,
                    mobile: customer.phone,
                    phone: customer.phone,
                    userType: 'customer',
                    hasPassword
                }
            });
        } catch (error) {
            const msg = error.name === 'TokenExpiredError' ? 'Link expired' : 'Invalid link';
            res.status(401).json({ error: msg });
        }
    },

    /**
     * Validate an existing session token.
     */
    verifyToken: async (req, res) => {
        try {
            const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];
            if (!token) return res.status(401).json({ error: 'Invalid session' });
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.userType === 'customer') {
                const client = await database.get('SELECT password_hash FROM clients WHERE id = ?', [decoded.id]);
                decoded.hasPassword = !!(client && client.password_hash);
            }

            res.json({ success: true, user: decoded });
        } catch (error) {
            res.status(401).json({ error: 'Invalid session' });
        }
    },

    /**
     * Logout
     */
    logout: async (req, res) => {
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie('token', {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax'
        });
        res.json({ success: true });
    }
};

export default authController;
