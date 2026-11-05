import express from 'express';
import notificationController from '../controllers/notificationController.js';
import { verifyToken, isStaff } from '../middleware/auth.js';

const router = express.Router();

/**
 * Access communication logs 
 */
router.get('/logs', verifyToken, isStaff, notificationController.getLogs);

/**
 * Dispatch automated service reminders
 */
router.post('/send-service-reminders', verifyToken, isStaff, notificationController.sendServiceReminders);

/**
 * Notify customer that parts have arrived
 */
router.post('/send-part-arrival', verifyToken, isStaff, notificationController.sendPartArrival);

/**
 * Dispatch custom message to client
 */
router.post('/send-custom', verifyToken, isStaff, notificationController.sendCustom);

export default router;
