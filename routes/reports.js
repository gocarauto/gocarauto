import express from 'express';
import reportController from '../controllers/reportController.js';
import { verifyToken, isStaff } from '../middleware/auth.js';

const router = express.Router();

/**
 * Fiscal Analytics
 */
router.get('/revenue', verifyToken, isStaff, reportController.getRevenueReport);

/**
 * Fiscal Export
 */
router.get('/revenue/export', verifyToken, isStaff, reportController.exportRevenueCSV);

/**
 * Customer Relationship Analytics
 */
router.get('/customers', verifyToken, isStaff, reportController.getCustomerInsights);

/**
 * Service Mix Analytics
 */
router.get('/services', verifyToken, isStaff, reportController.getServicesReport);

/**
 * Vehicle Performance Analytics
 */
router.get('/vehicles', verifyToken, isStaff, reportController.getVehiclesReport);

/**
 * System-Wide Summary Dashboard
 */
router.get('/dashboard', verifyToken, isStaff, reportController.getDashboardSummary);

/**
 * Revenue Forecast
 */
router.get('/forecast', verifyToken, isStaff, reportController.getRevenueForecast);

export default router;
