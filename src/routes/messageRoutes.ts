import { Router } from 'express';
import { messageController } from '../controllers/messageController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Protected route - requires authentication
router.post('/', authMiddleware, messageController.processMessage);

export default router;
