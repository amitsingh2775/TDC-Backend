

import { Router } from 'express';
import { getPool } from '../controllers/poolController';
import { authGuard } from '../middleware/authGuard';

const router = Router();

// Secure route - Only logged in matchmakers can view the pool
router.get('/', authGuard, getPool);

export default router;