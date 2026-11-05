import express from 'express';
import serviceRecordController from '../controllers/serviceRecordController.js';
import { verifyToken, isStaff } from '../middleware/auth.js';

const router = express.Router();

/**
 * Access all individual maintenance entries
 */
router.get('/', verifyToken, isStaff, serviceRecordController.getAllRecords);

/**
 * Log single service item/part
 */
router.post('/', verifyToken, isStaff, serviceRecordController.createRecord);

/**
 * Log multiple service items/parts in one go
 */
router.post('/bulk', verifyToken, isStaff, serviceRecordController.bulkCreateRecords);

/**
 * Modify maintenance record
 */
router.put('/:id', verifyToken, isStaff, serviceRecordController.updateRecord);

/**
 * Remove maintenance record
 */
router.delete('/:id', verifyToken, isStaff, serviceRecordController.deleteRecord);

export default router;
