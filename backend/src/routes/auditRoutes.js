import express from 'express';
import {
  getAllAuditLogs,
  getAuditStats
} from '../controllers/auditController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

router.get('/', getAllAuditLogs);
router.get('/stats', getAuditStats);

export default router;
