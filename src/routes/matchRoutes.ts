
import { Router } from 'express';
import { sendMatch, getSentMatches } from '../controllers/matchController';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.use(authGuard);

router.post('/send', sendMatch);
router.get('/sent/:clientId', getSentMatches);

export default router;
