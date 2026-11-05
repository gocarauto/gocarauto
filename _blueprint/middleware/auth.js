import jwt from 'jsonwebtoken';

/**
 * Standard Token Validation
 */
export const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) return res.status(403).json({ error: 'TOKEN_REQUIRED' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'UNAUTHORIZED' });
        req.user = decoded;
        next();
    });
};
