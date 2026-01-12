import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { sendMessage, getOrderMessages, getUnreadCount } from '../controllers/messageController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Send a message
router.post('/', sendMessage);

// Get messages for an order
router.get('/order/:orderId', getOrderMessages);

// Get unread message count
router.get('/unread-count', getUnreadCount);

export default router;
