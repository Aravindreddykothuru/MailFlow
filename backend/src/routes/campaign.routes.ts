import { Router } from 'express';
import { scheduleCampaign } from '../controllers/campaign.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// All campaign routes require authentication.
router.use(requireAuth);

/** POST /campaigns/schedule — Create campaign, fan out rows, enqueue BullMQ jobs. */
router.post('/schedule', scheduleCampaign);

export { router as campaignRouter };
