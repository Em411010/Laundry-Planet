import express from 'express';
import { authenticate } from '../middlewares/auth.js';
import { 
  getSetting, 
  getAllSettings, 
  getShippingSettings,
  updateSetting 
} from '../controllers/settingsController.js';

const router = express.Router();

// Public route - get shipping settings
router.get('/shipping', getShippingSettings);

// Protected routes
router.get('/', authenticate, getAllSettings);
router.get('/:key', authenticate, getSetting);
router.put('/:key', authenticate, updateSetting);

export default router;
