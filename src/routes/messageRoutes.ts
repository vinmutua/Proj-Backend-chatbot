import { Router } from 'express';
import { messageController } from '../controllers/messageController';

const router = Router();

// Public route - no authentication required
router.post('/', messageController.handleMessage);

export default router;
