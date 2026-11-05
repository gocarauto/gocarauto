import express from 'express';
import customerPortalController from '../controllers/customerPortalController.js';
import { verifyToken, isCustomer } from '../middleware/auth.js';

const router = express.Router();

/**
 * Access individual customer dashboard
 */
router.get('/dashboard', verifyToken, isCustomer, customerPortalController.getDashboard);

/**
 * Secure access to the maintenance vault
 */
router.get('/service-history', verifyToken, isCustomer, customerPortalController.getServiceHistory);

/**
 * Financial audits for the customer
 */
router.get('/invoices', verifyToken, isCustomer, customerPortalController.getInvoices);

/**
 * Access the comprehensive vehicle garage
 */
router.get('/vehicles', verifyToken, isCustomer, customerPortalController.getVehicles);

/**
 * Upcoming service appointments for the customer
 */
router.get('/appointments', verifyToken, isCustomer, customerPortalController.getAppointments);

/**
 * Active service reminders for customer's vehicles
 */
router.get('/reminders', verifyToken, isCustomer, customerPortalController.getReminders);

/**
 * Intelligence updates for the customer profile
 */
router.put('/profile', verifyToken, isCustomer, customerPortalController.updateProfile);

/**
 * Submit and retrieve Used Car Consignment / Sell requests
 */
router.post('/sell-requests', verifyToken, isCustomer, customerPortalController.createSellRequest);
router.get('/sell-requests', verifyToken, isCustomer, customerPortalController.getSellRequests);

export default router;
