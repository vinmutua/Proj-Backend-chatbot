import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { IAuthRequest, IAuthResponse } from '../interfaces/userInterface';
import { AppError } from '../utils/AppError';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    public signup = async (req: Request<{}, {}, IAuthRequest>, res: Response): Promise<void> => {
        try {
            const userData = await this.userService.signup(req.body);
            res.status(201).json(userData);
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message
            });
        }
    };

    public login = async (req: Request<{}, {}, IAuthRequest>, res: Response): Promise<void> => {
        try {
            const { email, password } = req.body; // Extract email and password from req.body
            const userData = await this.userService.login(email, password); // Pass email and password
            res.status(200).json(userData);
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message
            });
        }
    };

    public logout = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new AppError(401, 'User not authenticated');

            await this.userService.logout(userId);
            res.status(200).json({ success: true });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message
            });
        }
    };

    public getProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            if (!userId) throw new AppError(401, 'User not authenticated');

            const user = await this.userService.findUserById(userId);
            res.status(200).json({ 
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message
            });
        }
    };

    public refreshToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const refreshToken = req.body.refreshToken;
            if (!refreshToken) throw new AppError(400, 'Refresh token is required');

            const tokens = await this.userService.refreshAccessToken(refreshToken);
            res.status(200).json({
                success: true,
                ...tokens
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message
            });
        }
    };
}

export const userController = new UserController();
export default userController;
