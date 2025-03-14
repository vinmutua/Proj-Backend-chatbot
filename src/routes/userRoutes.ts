import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/signup', userController.signup);
router.post('/login', userController.login);

// Protected routes
router.post('/logout', authMiddleware, userController.logout);
router.get('/profile', authMiddleware, userController.getProfile);
router.post('/refresh-token', userController.refreshToken);

export default router;