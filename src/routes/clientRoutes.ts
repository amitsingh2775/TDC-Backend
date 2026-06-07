

import { Router } from 'express';
import {
  getAllClients,
  getClientById,
  addNote,
  getNotes,
} from '../controllers/clientController';
import { getMatches } from '../controllers/matchController';
import { authGuard } from '../middleware/authGuard';

const router = Router();

// All client routes require authentication
router.use(authGuard);


router.get('/', getAllClients);


router.get('/:id', getClientById);


router.get('/:id/matches', getMatches);

router.get('/:id/notes', getNotes);

router.post('/:id/notes', addNote);

export default router;
