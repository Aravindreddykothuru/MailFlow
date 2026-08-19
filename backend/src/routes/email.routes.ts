import { Router } from 'express';
import {
  getScheduledEmails,
  getSentEmails,
  cancelScheduledEmail,
} from '../controllers/email.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// All email routes require authentication.
router.use(requireAuth);

/** GET /emails/scheduled — Paginated list of PENDING emails. */
router.get('/scheduled', getScheduledEmails);

/** GET /emails/sent — Paginated list of SENT and FAILED emails. */
router.get('/sent', getSentEmails);

/**
 * DELETE /emails/scheduled/:id — Cancel a pending email.
 * Updates DB status to FAILED and removes the BullMQ job.
 */
router.delete('/scheduled/:id', cancelScheduledEmail);

export { router as emailRouter };
