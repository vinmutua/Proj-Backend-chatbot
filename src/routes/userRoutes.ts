import { Router } from 'express';
import userController from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { signupSchema, loginSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/signup', validate({ body: signupSchema }), userController.signup);
router.post('/login', validate({ body: loginSchema }), userController.login);
router.post('/refresh-token', userController.refreshToken);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.get('/verify-email/:token', userController.verifyEmail);
router.post('/logout', authMiddleware, userController.logout);
router.post('/google-login', userController.googleLogin);

export default router;