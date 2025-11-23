import { Router } from 'express';
import { createOrder } from '../controllers/orderController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.post('/', requireAuth, createOrder);

export default router;
