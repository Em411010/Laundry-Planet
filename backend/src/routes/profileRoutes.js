import express from 'express';
import {
  getProfile,
  updateProfile,
  checkProfileComplete
} from '../controllers/profileController.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getProfile);
router.put('/', updateProfile);
router.get('/check-complete', checkProfileComplete);

export default router;
