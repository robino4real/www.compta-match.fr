import { Router } from 'express';
import {
  adminListArticles,
  createArticle,
  deleteArticle,
  listPublishedArticles,
  updateArticle
} from '../controllers/articleController';
import { requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();
router.get('/', listPublishedArticles);
router.get('/admin', requireAuth, requireAdmin, adminListArticles);
router.post('/', requireAuth, requireAdmin, createArticle);
router.put('/:id', requireAuth, requireAdmin, updateArticle);
router.delete('/:id', requireAuth, requireAdmin, deleteArticle);

export default router;
