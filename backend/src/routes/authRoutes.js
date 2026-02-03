import express from 'express';
import { register, login, getCurrentUser, verifyOTP, resendOTP, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';
import { rateLimit } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/register', rateLimit('register'), register);
router.post('/login', rateLimit('auth'), login);
router.post('/verify-otp', rateLimit('verifyOTP'), verifyOTP);
router.post('/resend-otp', rateLimit('resendOTP'), resendOTP);
router.post('/forgot-password', rateLimit('forgotPassword'), forgotPassword);
router.post('/reset-password', rateLimit('resetPassword'), resetPassword);

// Protected routes
router.get('/me', authenticate, getCurrentUser);

export default router;
