import express from 'express';
import userController from '../controllers/userController.js';
import { verifyToken, isAdmin, isStaff } from '../middleware/auth.js';

const router = express.Router();

/**
 * Staff Discovery and Management
 * Restrict all access to Admin users for maximum security.
 */

/**
 * Get staff list (accessible to all staff for technician assignment)
 */
router.get('/', verifyToken, isStaff, userController.getAllUsers);

/**
 * Create staff account
 */
router.post('/', verifyToken, isAdmin, userController.createUser);

/**
 * Update staff account (including password)
 */
router.put('/:id', verifyToken, isAdmin, userController.updateUser);

/**
 * Delete staff account
 */
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);

export default router;
