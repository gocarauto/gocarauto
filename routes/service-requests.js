import express from 'express';
import serviceRequestController from '../controllers/serviceRequestController.js';
import commentsController from '../controllers/commentsController.js';
import { verifyToken, isStaff } from '../middleware/auth.js';

const router = express.Router();

/**
 * Fetch general statistics for Service Ops
 */
router.get('/stats', verifyToken, isStaff, serviceRequestController.getStats);

/**
 * Retrieve all service requests
 */
router.get('/', verifyToken, isStaff, serviceRequestController.getAllRequests);

/**
 * Detailed maintenance record
 */
router.get('/:id', verifyToken, isStaff, serviceRequestController.getRequestById);

/**
 * Open new maintenance job
 */
router.post('/', verifyToken, serviceRequestController.createRequest);

/**
 * Transition workflow stage status
 */
router.patch('/:id/status', verifyToken, isStaff, serviceRequestController.updateStatus);

/**
 * Update vehicle travel metrics
 */
router.patch('/:id/mileage', verifyToken, isStaff, serviceRequestController.updateMileage);

/**
 * Terminate maintenance record
 */
router.delete('/:id', verifyToken, isStaff, serviceRequestController.deleteRequest);

/**
 * Assign a technician
 */
router.patch('/:id/assign', verifyToken, isStaff, serviceRequestController.assignTechnician);

/**
 * Get internal comments
 */
router.get('/:id/comments', verifyToken, isStaff, commentsController.getComments);

/**
 * Add an internal comment
 */
router.post('/:id/comments', verifyToken, isStaff, commentsController.addComment);

export default router;
