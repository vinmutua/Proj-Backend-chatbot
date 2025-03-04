import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { AppError } from '../types/errors';
import { IAuthRequest, IGoogleAuthRequest, IUserParams } from '../interfaces/userInterface';

export class UserController {
    public async signup(req: Request<{}, {}, IAuthRequest>, res: Response): Promise<void> {
        try {
            const result = await userService.signup(req.body);
            res.status(201).json(result);
        } catch (error) {
            this.handleError(error, res, 'Error during signup');
        }
    }

    public async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, remember } = req.body;
            const result = await userService.login(email, password, remember);
            res.status(200).json(result);
        } catch (error) {
            this.handleError(error, res, 'Authentication failed');
        }
    }

    public async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;
            const tokens = await userService.refreshToken(refreshToken);
            res.status(200).json(tokens);
        } catch (error) {
            res.status(401).json({ message: 'Invalid refresh token' });
        }
    }

    public async logout(req: Request, res: Response): Promise<void> {
        try {
            const userId = Number(req.user?.id);
            if (isNaN(userId)) {
                throw new AppError(400, 'Invalid user ID');
            }
            await userService.logout(userId);
            res.status(200).json({ message: 'Logged out successfully' });
        } catch (error) {
            this.handleError(error, res, 'Error during logout');
        }
    }

    public async googleLogin(req: Request<{}, {}, IGoogleAuthRequest>, res: Response): Promise<void> {
        try {
            const result = await userService.googleLogin(req.body);
            res.status(200).json(result);
        } catch (error) {
            this.handleError(error, res, 'Google authentication failed');
        }
    }

    private handleError(error: unknown, res: Response, defaultMessage: string): void {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            res.status(500).json({ message: defaultMessage });
        }
    }
}

export const userController = new UserController();
export default userController;