import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/errors';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export const errorHandler = (
    error: Error | AppError | PrismaClientKnownRequestError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            status: 'error',
            message: error.message
        });
    }

    if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
            return res.status(409).json({
                status: 'error',
                message: 'Resource already exists'
            });
        }
    }

    console.error('Error:', error);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
};