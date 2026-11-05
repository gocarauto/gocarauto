import express from 'express';
import consignmentController from '../controllers/consignmentController.js';
import { verifyToken, isStaff } from '../middleware/auth.js';

const router = express.Router();

// Staff endpoints for managing used car consignment leads
router.get('/requests', verifyToken, isStaff, consignmentController.getAllRequests);
router.get('/requests/:id', verifyToken, isStaff, consignmentController.getRequestById);
router.patch('/requests/:id', verifyToken, isStaff, consignmentController.updateRequestStatus);
router.get('/stats', verifyToken, isStaff, consignmentController.getSummaryStats);

// Staff endpoints for active consignment listings & sales hub
router.get('/listings', verifyToken, isStaff, consignmentController.getAllListings);
router.post('/listings', verifyToken, isStaff, consignmentController.createListing);
router.get('/listings/:id', verifyToken, isStaff, consignmentController.getListingById);
router.patch('/listings/:id', verifyToken, isStaff, consignmentController.updateListing);
router.post('/listings/:id/settle', verifyToken, isStaff, consignmentController.settleListing);
router.get('/pipeline/summary', verifyToken, isStaff, consignmentController.getPipelineSummary);

export default router;
