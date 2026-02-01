import express from 'express';
import * as salesController from '../controllers/salesController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Get comprehensive sales report
router.get('/report', salesController.getSalesReport);

// Get revenue by date range
router.get('/revenue-by-date', salesController.getRevenueByDateRange);

// Get top performing services
router.get('/top-services', salesController.getTopServices);

export default router;
