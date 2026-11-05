import express from 'express';
import clientController from '../controllers/clientController.js';
import { verifyToken, isStaff } from '../middleware/auth.js';

const router = express.Router();

/**
 * Access all clients (Search/Sort)
 */
router.get('/', verifyToken, isStaff, clientController.getAllClients);

/**
 * Get detailed client profile
 */
router.get('/:id', verifyToken, isStaff, clientController.getClientById);

/**
 * Register new customer
 */
router.post('/', verifyToken, isStaff, clientController.createClient);

/**
 * Modify customer profile
 */
router.put('/:id', verifyToken, isStaff, clientController.updateClient);

/**
 * Remove customer record
 */
router.delete('/:id', verifyToken, isStaff, clientController.deleteClient);

/**
 * Aggregated customer analytics
 */
router.get('/:id/stats', verifyToken, isStaff, clientController.getClientStats);

/**
 * Localized magic login generation
 */
router.get('/:id/magic-link', verifyToken, isStaff, clientController.generateMagicLink);

/**
 * Administratively reset customer password
 */
router.post('/:id/reset-password', verifyToken, isStaff, clientController.resetPassword);

export default router;
