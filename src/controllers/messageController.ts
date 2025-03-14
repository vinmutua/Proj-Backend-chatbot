import { Request, Response } from 'express';
import { messageService } from '../services/messageService';
import { AppError } from '../utils/AppError';

export const messageController = {
    handleMessage: async (req: Request, res: Response): Promise<void> => {
        try {
            const { message, sessionId } = req.body;
            if (!message || typeof message !== 'string') {
                throw new AppError(400, 'Message is required');
            }

            // Use the correct method from your messageService
            const response = await messageService.handleMessage(
                message,
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
};
