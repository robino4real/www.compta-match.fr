import { Router } from 'express';
import { adminListProducts, createProduct, deleteProduct, listProducts, updateProduct } from '../controllers/productController';
import { requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();
router.get('/', listProducts);
router.get('/admin', requireAuth, requireAdmin, adminListProducts);
router.post('/', requireAuth, requireAdmin, createProduct);
router.put('/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

export default router;
