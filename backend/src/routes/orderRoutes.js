import express from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  assignStaff,
  cancelOrder,
  getOrderStats,
  acceptOrder,
  updateOrderWeight,
  addOrderImage,
  addOrderMessage,
  getStaffTasks
} from '../controllers/orderController.js';
import { authenticate, authorize } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Client routes
router.post('/', authorize(['client']), createOrder);
router.get('/', getAllOrders); // Role-based filtering in controller

// Staff routes - specific routes before parameterized routes
router.get('/staff/tasks', authorize(['staff', 'admin']), getStaffTasks);
router.get('/stats/overview', authorize(['admin']), getOrderStats);

router.get('/:id', getOrderById); // Role-based access in controller
router.patch('/:id/cancel', cancelOrder); // Clients can cancel own orders
router.patch('/:id/accept', authorize(['staff', 'admin']), acceptOrder);
router.patch('/:id/weight', authorize(['staff', 'admin']), updateOrderWeight);
router.patch('/:id/status', authorize(['admin', 'staff']), updateOrderStatus);
router.patch('/:id/assign', authorize(['admin']), assignStaff);
router.post('/:id/images', authorize(['staff', 'admin']), addOrderImage);
router.post('/:id/messages', addOrderMessage); // Staff and clients can message

export default router;

