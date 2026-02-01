import express from 'express';
import {
  getAllServices,
  getServiceById,
  createService,
  deleteService,
  updateServicePrice,
  toggleServiceStatus,
  bulkUpdatePrices
} from '../controllers/serviceController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// Public route - get all active services
router.get('/public', getAllServices);

// Admin routes - require authentication and admin role
router.use(authenticate, requireAdmin);

router.get('/', getAllServices);
router.get('/:id', getServiceById);
router.post('/', createService);
router.delete('/:id', deleteService);
router.patch('/:id/price', updateServicePrice);
router.patch('/:id/toggle-status', toggleServiceStatus);
router.post('/bulk-update-prices', bulkUpdatePrices);

export default router;
