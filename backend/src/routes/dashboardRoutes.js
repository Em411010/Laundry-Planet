import express from 'express';
import { getAdminDashboardStats } from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Admin dashboard stats
router.get('/admin/stats', authenticate, authorize(['admin']), getAdminDashboardStats);

export default router;
