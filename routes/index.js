import express from 'express';
const router = express.Router();

// Feature-specific route imports
import authRoutes from './auth.js';
import clientRoutes from './clients.js';
import vehicleRoutes from './vehicles.js';
import serviceRequestRoutes from './service-requests.js';
import serviceRecordRoutes from './service-records.js';
import financialRoutes from './financial.js';
import notificationRoutes from './notifications.js';
import customerPortalRoutes from './customer-portal.js';
import reportRoutes from './reports.js';
import serviceItemRoutes from './service-items.js';
import uploadRoutes from './uploads.js';
import reminderRoutes from './reminders.js';
import externalServiceRoutes from './external-services.js';
import userRoutes from './users.js';
import customerDocumentRoutes from './customer-documents.js';
import consignmentRoutes from './consignment.js';
import vehicleController from '../controllers/vehicleController.js';

/**
 * API Health Check
 * Lightweight endpoint to verify system availability.
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'GoCar Auto SFMS API is running',
        timestamp: new Date().toISOString()
    });
});

/**
 * Public Vehicle Service Passport Verification
 */
router.get('/public/passport/:identifier', vehicleController.getPublicPassport);

// Route registration
router.use('/auth', authRoutes);
router.use('/clients', clientRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/service-requests', serviceRequestRoutes);
router.use('/service-records', serviceRecordRoutes);
router.use('/financial', financialRoutes);
router.use('/notifications', notificationRoutes);
router.use('/customer-portal', customerPortalRoutes);
router.use('/reports', reportRoutes);
router.use('/service-items', serviceItemRoutes);
router.use('/uploads', uploadRoutes);
router.use('/reminders', reminderRoutes);
router.use('/external-services', externalServiceRoutes);
router.use('/users', userRoutes);
router.use('/customer-documents', customerDocumentRoutes);
router.use('/consignment', consignmentRoutes);

export default router;
