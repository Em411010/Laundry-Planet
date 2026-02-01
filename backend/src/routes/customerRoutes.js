import express from 'express';
import * as customerController from '../controllers/customerController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Get comprehensive customer report
router.get('/report', customerController.getCustomerReport);

// Get customer segmentation data
router.get('/segmentation', customerController.getCustomerSegmentation);

export default router;
