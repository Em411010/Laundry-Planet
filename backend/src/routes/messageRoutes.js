import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { sendMessage, getOrderMessages, getUnreadCount, sendSupportMessage, getSupportMessages } from '../controllers/messageController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Send a message
router.post('/', sendMessage);

// Get messages for an order
router.get('/order/:orderId', getOrderMessages);

// Get unread message count
router.get('/unread-count', getUnreadCount);

// Support chat routes
router.post('/support', sendSupportMessage);
router.get('/support', getSupportMessages);

// Test route to check database
router.get('/test-support', async (req, res) => {
  try {
    const Message = (await import('../models/Message.js')).default;
    const count = await Message.countDocuments({ type: 'support' });
    const messages = await Message.find({ type: 'support' }).limit(5);
    res.json({ count, messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
