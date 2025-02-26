import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { AppError } from '../types/errors';
import { IUserParams, ILoginRequest, ISignupRequest } from '../interfaces/userInterface';

class UserController {
    public async signup(req: Request<{}, {}, ISignupRequest>, res: Response): Promise<void> {
        try {
            const userData = req.body;
            const result = await userService.signup(userData);
            res.status(201).json(result);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ message: error.message });
            } else {
                res.status(400).json({ message: 'Error during signup' });
            }
        }
    }

    public async login(req: Request<{}, {}, ILoginRequest>, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const result = await userService.login(email, password);
            res.status(200).json(result);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ message: error.message });
            } else {
                res.status(401).json({ message: 'Authentication failed' });
            }
        }
    }

    public async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                throw new AppError(400, 'Refresh token is required');
            }
            const result = await userService.refreshToken(refreshToken);
            res.status(200).json(result);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ message: error.message });
            } else {
                res.status(401).json({ message: 'Token refresh failed' });
            }
        }
    }

    public async forgotPassword(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            await userService.forgotPassword(email);
            res.status(200).json({ 
                message: 'Password reset email sent'
            });
        } catch (error: any) {
            res.status(400).json({ 
                message: error.message || 'Password reset request failed'
            });
        }
    }

    public async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { token, newPassword } = req.body;
            await userService.resetPassword(token, newPassword);
            res.status(200).json({ 
                message: 'Password reset successful'
            });
        } catch (error: any) {
            res.status(400).json({ 
                message: error.message || 'Password reset failed'
            });
        }
    }

    public async verifyEmail(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.params;
            await userService.verifyEmail(token);
            res.status(200).json({ 
                message: 'Email verified successfully'
            });
        } catch (error: any) {
            res.status(400).json({ 
                message: error.message || 'Email verification failed'
            });
        }
    }

    public async logout(req: Request, res: Response): Promise<void> {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                throw new Error('No authorization token provided');
            }
            
            await userService.logout(authHeader);
            res.status(200).json({ 
                message: 'Logged out successfully'
            });
        } catch (error: any) {
            res.status(400).json({ 
                message: error.message || 'Logout failed'
            });
        }
    }

    public async googleLogin(req: Request, res: Response): Promise<void> {
        try {
            const { idToken } = req.body;
            const result = await userService.googleLogin(idToken);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(401).json({ 
                message: error.message || 'Google authentication failed'
            });
        }
    }

    public async getUserById(req: Request<IUserParams>, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) {
                throw new AppError(400, 'Invalid user ID');
            }
            const user = await userService.findUserById(id);
            if (!user) {
                throw new AppError(404, 'User not found');
            }
            res.status(200).json(user);
        } catch (error) {
            if (error instanceof AppError) {
                res.status(error.statusCode).json({ message: error.message });
            } else {
                res.status(500).json({ message: 'Internal server error' });
            }
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

export default new UserController();