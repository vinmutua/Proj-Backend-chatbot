import { Request, Response, NextFunction } from 'express';
import { verifyJwtToken } from '../utils/jwt';  // Updated import name

declare global {
    namespace Express {
        interface Request {
            user?: any;  // Consider using a more specific type
        }
    }
}

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new Error('No token provided');
        }

        const token = authHeader.split(' ')[1];
        const decoded = await verifyJwtToken(token);  // Updated function name
        req.user = decoded;
        next();
    } catch (error: any) {
        res.status(401).json({
            message: error.message || 'Authentication failed'
        });
    }
};