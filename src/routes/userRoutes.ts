import { Router } from 'express';
import userController from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { signupSchema, loginSchema, googleAuthSchema } from '../schemas/auth.schema';

const router = Router();

router.post('/signup', validate({ body: signupSchema }), userController.signup);
router.post('/login', validate({ body: loginSchema }), userController.login);
router.post('/google', validate({ body: googleAuthSchema }), userController.googleLogin);
router.post('/refresh-token', userController.refreshToken);
router.post('/logout', authMiddleware, userController.logout);

export default router;