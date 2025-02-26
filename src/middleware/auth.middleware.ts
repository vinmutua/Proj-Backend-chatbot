import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: number;  // Changed from string to number for PostgreSQL
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // ...existing code...
};
