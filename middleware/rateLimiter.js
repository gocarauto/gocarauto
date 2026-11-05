const requestCounts = new Map();

// Clean up expired entries every 10 minutes to prevent memory growth (unref so it doesn't block process exit)
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
        if (now > record.resetTime) {
            requestCounts.delete(key);
        }
    }
}, 10 * 60 * 1000);
if (cleanupInterval.unref) {
    cleanupInterval.unref();
}

/**
 * Lightweight in-memory rate limiter middleware.
 * @param {Object} options - { windowMs, max, message }
 */
export const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests. Please try again later.' } = {}) => {
    return (req, res, next) => {
        // GOCAR-SEC-03: Use Express's validated req.ip or socket address to prevent client header spoofing
        const ip = req.ip || req.socket?.remoteAddress || 'unknown';
        const key = `${ip}:${req.baseUrl || req.path}`;
        const now = Date.now();

        let record = requestCounts.get(key);
        if (!record || now > record.resetTime) {
            record = { count: 0, resetTime: now + windowMs };
            requestCounts.set(key, record);
        }

        record.count++;
        if (record.count > max) {
            const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
            res.setHeader('Retry-After', retryAfterSec);
            return res.status(429).json({ success: false, error: message });
        }

        next();
    };
};
