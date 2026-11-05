import express from 'express';
import externalServiceController from '../controllers/externalServiceController.js';
import { verifyToken, isStaff } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get external history for a vehicle
 */
router.get('/vehicle/:vehicleId', verifyToken, isStaff, externalServiceController.getVehicleExternalServices);

/**
 * Register external service record
 */
router.post('/', verifyToken, isStaff, externalServiceController.createExternalService);

/**
 * Remove external service record
 */
router.delete('/:id', verifyToken, isStaff, externalServiceController.deleteExternalService);

export default router;
