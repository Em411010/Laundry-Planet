import express from 'express';
import {
  initiateGCashPayment,
  handlePaymentSuccess,
  handlePaymentFailed,
  getPaymentStatus,
  handlePayMongoWebhook,
  retryPayment
} from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { rateLimit } from '../middlewares/rateLimiter.js';

const router = express.Router();

// PayMongo Webhook - No authentication (called by PayMongo)
// IMPORTANT: Must be before authenticate middleware
router.post('/webhooks/paymongo', handlePayMongoWebhook);

// Public routes for payment callbacks (user may not have token in URL)
router.get('/success', handlePaymentSuccess);
router.get('/failed', handlePaymentFailed);

// Protected routes
router.use(authenticate);

// Initiate GCash payment for an order
router.post(
  '/gcash/:orderId',
  rateLimit('api'),
  initiateGCashPayment
);

// Get payment status
router.get(
  '/status/:orderId',
  getPaymentStatus
);

// Retry failed payment
router.post(
  '/retry/:orderId',
  rateLimit('api'),
  retryPayment
);

export default router;
