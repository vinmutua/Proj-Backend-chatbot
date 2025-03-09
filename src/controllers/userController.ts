import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { AppError } from '../types/errors';
import { IAuthRequest, IGoogleAuthRequest } from '../interfaces/userInterface';
import { authConfig } from '../config/config';

export class UserController {
    // Bind methods in constructor to preserve 'this' context
    constructor() {
        this.signup = this.signup.bind(this);
        this.login = this.login.bind(this);
        this.refreshToken = this.refreshToken.bind(this);
        this.logout = this.logout.bind(this);
        this.googleLogin = this.googleLogin.bind(this);
        this.getProfile = this.getProfile.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    private handleError(error: unknown, res: Response, defaultMessage: string): void {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
        } else {
            console.error('Error:', error);
            res.status(500).json({ message: defaultMessage });
        }
    }

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
            const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
            
            if (!refreshToken) {
                throw new AppError(401, 'Refresh token is required');
            }

            const result = await userService.refreshToken(refreshToken);
            
            // Set cookies if using cookie-based auth
            if (req.cookies) {
                res.cookie('accessToken', result.tokens.accessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: authConfig.token_refresh_interval
                });
            }

            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            this.handleError(error, res, 'Error refreshing token');
        }
    }

    public async logout(req: Request, res: Response): Promise<void> {
        try {
            // Do not convert to Number - use the string directly.
            const userId = req.user?.id;
            if (!userId || typeof userId !== 'string') {
                throw new AppError(400, 'Invalid user ID');
            }

            await userService.logout(userId);

            // Clear cookies if you're using them
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
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

    public async getProfile(req: Request, res: Response): Promise<void> {
        try {
            // Use the string ID from the request
            const userId = req.user?.id;
            if (!userId || typeof userId !== 'string') {
                throw new AppError(400, 'Invalid user ID');
            }

            const user = await userService.findUserById(userId);
            if (!user) {
                throw new AppError(404, 'User not found');
            }

            // Remove sensitive data
            const { password, refreshToken, ...safeUser } = user;
            res.status(200).json(safeUser);
        } catch (error) {
            this.handleError(error, res, 'Error fetching user profile');
        }
    }
}

export const userController = new UserController();
export default userController;