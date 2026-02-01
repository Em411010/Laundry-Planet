import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  bulkToggleStatus,
  getUserAuditLogs,
  searchCustomers
} from '../controllers/userController.js';
import { authenticate, requireAdmin, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Customer search for walk-in orders (staff can access)
router.get('/search/customers', authenticate, authorize(['staff', 'admin']), searchCustomers);

// All routes below require authentication and admin role
router.use(authenticate, requireAdmin);

// User CRUD routes
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// Status management
router.patch('/:id/toggle-status', toggleUserStatus);
router.post('/bulk-toggle-status', bulkToggleStatus);

// Audit logs
router.get('/:id/audit-logs', getUserAuditLogs);

export default router;
