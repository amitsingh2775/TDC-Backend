
import { Router } from 'express';
import { login, getMe } from '../controllers/authController';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.post('/login', login);

router.get('/me', authGuard, getMe);

export default router;
