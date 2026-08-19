import { Router } from 'express';
import { getSenders, createSender, deleteSender } from '../controllers/sender.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// All sender routes require authentication
router.use(requireAuth);

/** GET /senders — List all configured senders for user */
router.get('/', getSenders);

/** POST /senders — Create a new sender with Ethereal SMTP account */
router.post('/', createSender);

/** DELETE /senders/:id — Remove an existing sender */
router.delete('/:id', deleteSender);

export { router as senderRouter };
