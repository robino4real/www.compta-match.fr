import { Router } from 'express';
import {
  adminListDiscounts,
  createDiscount,
  deleteDiscount,
  listActiveDiscounts,
  updateDiscount
} from '../controllers/discountController';
import { requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();
router.get('/', listActiveDiscounts);
router.get('/admin', requireAuth, requireAdmin, adminListDiscounts);
router.post('/', requireAuth, requireAdmin, createDiscount);
router.put('/:id', requireAuth, requireAdmin, updateDiscount);
router.delete('/:id', requireAuth, requireAdmin, deleteDiscount);

export default router;
