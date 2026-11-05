import express from 'express';
import authController from '../controllers/authController.js';
import { rateLimit } from '../middleware/rateLimiter.js';

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
});

/**
 * Staff Authentication
 */
router.post('/staff/login', authLimiter, authController.staffLogin);

/**
 * Customer Authentication
 */
router.post('/customer/login', authLimiter, authController.customerLogin);

/**
 * Customer Registration
 */
router.post('/customer/register', authLimiter, authController.customerRegister);

/**
 * Magic Login Token Processing (Rate-limited against token enumeration attacks)
 */
router.get('/customer/magic-login/:token', authLimiter, authController.magicLogin);

/**
 * Token Verification
 */
router.get('/verify', authController.verifyToken);

/**
 * Logout
 */
router.post('/logout', authController.logout);

export default router;
