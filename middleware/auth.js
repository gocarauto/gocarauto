import jwt from 'jsonwebtoken';

/**
 * Verify JWT token.
 * Validates the Authorization header or token query parameter.
 */
export const verifyToken = (req, res, next) => {
    let token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

    // GOCAR-SEC-04: Only permit query parameter ?token= for read-only GET asset/document downloads
    if (!token && req.method === 'GET' && req.query?.token) {
        const isSafeAssetRequest = req.path.includes('/pdf') ||
                                   req.path.includes('/view') ||
                                   req.path.includes('/service-passport') ||
                                   (req.originalUrl && req.originalUrl.includes('/uploads/'));
        if (isSafeAssetRequest) {
            token = req.query.token;
        }
    }

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    if (!process.env.JWT_SECRET) {
        console.error('SERVER_AUTH_ERROR: JWT_SECRET environment variable is missing');
        return res.status(500).json({ error: 'Authentication configuration error' });
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Unauthorized: Invalid token' });
            }
            req.user = decoded;
            next();
        });
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

/**
 * Middleware: Check if user is staff (Admin or Operator).
 */
export const isStaff = (req, res, next) => {
    if (!req.user || (req.user.userType !== 'staff' && !['Admin', 'Operator'].includes(req.user.role))) {
        return res.status(403).json({ error: 'Access denied: Staff only' });
    }
    next();
};

/**
 * Middleware: Check if user is Admin.
 */
export const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied: Admin only' });
    }
    next();
};

/**
 * Middleware: Check if user is customer.
 */
export const isCustomer = (req, res, next) => {
    if (!req.user || req.user.userType !== 'customer') {
        return res.status(403).json({ error: 'Access denied: Customer only' });
    }
    next();
};
