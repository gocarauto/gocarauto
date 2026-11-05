import express from 'express';
import financialController from '../controllers/financialController.js';
import { verifyToken, isStaff } from '../middleware/auth.js';

const router = express.Router();

/**
 * Access all billing records
 */
router.get('/', verifyToken, isStaff, financialController.getAllTransactions);

/**
 * Single invoice details
 */
router.get('/:id', verifyToken, isStaff, financialController.getTransactionById);

/**
 * Create invoice for job
 */
router.post('/generate-invoice', verifyToken, isStaff, financialController.generateInvoice);

/**
 * Update existing invoice for job
 */
router.put('/update-invoice', verifyToken, isStaff, financialController.updateInvoice);

/**
 * Update billing status
 */
router.patch('/:id/payment', verifyToken, isStaff, financialController.updatePayment);

/**
 * Invoice PDF delivery
 */
router.get('/:id/pdf', verifyToken, financialController.getInvoicePDF);

/**
 * HTML browser-based viewer
 */
router.get('/:id/view', verifyToken, financialController.getInvoiceView);

/**
 * Void/Remove invoice
 */
router.delete('/:id', verifyToken, isStaff, financialController.deleteInvoice);

export default router;
