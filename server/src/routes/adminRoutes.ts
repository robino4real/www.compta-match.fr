import { Router } from 'express';
import { listUsers } from '../controllers/adminController';

const router = Router();

// GET /admin/users
router.get('/users', listUsers);

export default router;
