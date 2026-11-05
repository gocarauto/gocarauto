import express from 'express';
import exampleRoutes from './example.js';

const router = express.Router();

/**
 * Hub: Add new features here.
 * router.use('/orders', orderRoutes);
 */
router.use('/example', exampleRoutes);

export default router;
