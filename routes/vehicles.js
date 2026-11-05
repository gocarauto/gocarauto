import express from 'express';
import vehicleController from '../controllers/vehicleController.js';
import { verifyToken, isStaff } from '../middleware/auth.js';

const router = express.Router();

/**
 * Access fleet (Filter: Client/VIN/License)
 */
router.get('/', verifyToken, isStaff, vehicleController.getAllVehicles);

/**
 * Service Reminders Queue
 */
router.get('/upcoming/service-due', verifyToken, isStaff, vehicleController.getUpcomingService);

/**
 * Single vehicle data
 */
router.get('/:id', verifyToken, isStaff, vehicleController.getVehicleById);

/**
 * Register new vehicle for client
 */
router.post('/', verifyToken, isStaff, vehicleController.createVehicle);

/**
 * Update vehicle metrics
 */
router.put('/:id', verifyToken, isStaff, vehicleController.updateVehicle);

/**
 * Transfer vehicle ownership to a different client
 */
router.patch('/:id/transfer', verifyToken, isStaff, vehicleController.transferVehicle);

/**
 * Remove vehicle asset
 */
router.delete('/:id', verifyToken, isStaff, vehicleController.deleteVehicle);

/**
 * Comprehensive service history
 */
router.get('/:id/service-history', verifyToken, vehicleController.getServiceHistory);

/**
 * Certified Vehicle Service Passport PDF (Redacted for resale proof)
 */
router.get('/:id/service-passport/pdf', verifyToken, vehicleController.getServicePassportPDF);

/**
 * Public vehicle pedigree verification
 */
router.get('/public-passport/:identifier', vehicleController.getPublicPassport);

export default router;

