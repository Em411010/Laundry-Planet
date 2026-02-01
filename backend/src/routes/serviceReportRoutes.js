import express from 'express';
import * as serviceReportController from '../controllers/serviceReportController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Get comprehensive service report
router.get('/report', serviceReportController.getServiceReport);

// Get detailed service performance
router.get('/performance/:serviceId', serviceReportController.getServicePerformance);

export default router;
