import { Request, Response } from 'express';
import { messageService } from '../services/messageService';
import { AppError } from '../utils/AppError';

class MessageController {
    public async processMessage(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new AppError(401, 'User not authenticated');
            }

            const { message, sessionId } = req.body;
            if (!message || typeof message !== 'string') {
                throw new AppError(400, 'Message is required');
            }

            const response = await messageService.handleMessage(
                message,
                userId,
                sessionId
            );

            res.status(200).json(response);
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Internal server error'
            });
        }
    }
}

export const messageController = new MessageController();
