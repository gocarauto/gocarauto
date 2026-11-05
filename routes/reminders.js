import express from 'express';
import reminderController from '../controllers/reminderController.js';
import { verifyToken, isStaff } from '../middleware/auth.js';

const router = express.Router();

/**
 * Access all pending reminders globally
 */
router.get('/all', verifyToken, isStaff, reminderController.getAllReminders);

/**
 * Check if an active reminder exists (duplicate guard)
 */
router.get('/check', verifyToken, isStaff, reminderController.checkDuplicate);

/**
 * Access all reminders for a specific client
 */
router.get('/client/:clientId', verifyToken, isStaff, reminderController.getClientReminders);

/**
 * Register new service reminder
 */
router.post('/', verifyToken, isStaff, reminderController.createReminder);

/**
 * Update existing reminder details
 */
router.put('/:id', verifyToken, isStaff, reminderController.updateReminder);

/**
 * Remove reminder record
 */
router.delete('/:id', verifyToken, isStaff, reminderController.deleteReminder);

/**
 * Smart Scan — auto-generate/update reminders from service history
 */
router.post('/smart-scan', verifyToken, isStaff, reminderController.runSmartScan);

export default router;
