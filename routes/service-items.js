import express from 'express';
import serviceItemController from '../controllers/serviceItemController.js';
import { verifyToken, isStaff } from '../middleware/auth.js';

const router = express.Router();

/**
 * Access the full service/part catalog
 */
router.get('/', verifyToken, isStaff, serviceItemController.getAllItems);

/**
 * Register new catalog entry
 */
router.post('/', verifyToken, isStaff, serviceItemController.createItem);

/**
 * Bulk ensure or create catalog items (N -> 1 network call optimization)
 */
router.post('/bulk-ensure', verifyToken, isStaff, serviceItemController.bulkCreateOrEnsure);

/**
 * Get single catalog entry
 */
router.get('/:id', verifyToken, isStaff, serviceItemController.getItemById);

/**
 * Update existing catalog entry
 */
router.put('/:id', verifyToken, isStaff, serviceItemController.updateItem);

export default router;
