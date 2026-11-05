import express from 'express';
import exampleController from '../controllers/exampleController.js';

const router = express.Router();

/**
 * Endpoint Definitions
 * router.get('/', verifyToken, exampleController.getData);
 */
router.get('/', exampleController.getData);

export default router;
