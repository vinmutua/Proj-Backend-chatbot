import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken } from '../utils/jwt';
import { AppError } from '../types/errors';

declare global {
    namespace Express {
        interface Request {
            user?: any;  // Consider using a more specific type
        }
    }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError(401, 'No token provided');
        }

        const token = authHeader.split(' ')[1];
        const decoded = await verifyJwtToken(token);
        
        // Attach user to request
        req.user = { id: decoded.userId };
        next();
    } catch (error) {
        res.status(401).json({ 
            success: false,
            message: 'Unauthorized access'
        });
    }
};