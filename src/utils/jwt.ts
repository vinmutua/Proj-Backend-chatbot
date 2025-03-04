import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import { IDecodedToken } from '../interfaces/userInterface';
import { AppError } from '../types/errors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'default_refresh_secret';

if (!JWT_SECRET || !REFRESH_SECRET) {
    throw new Error('JWT secrets must be defined in environment variables');
}

/**
 * Generate access and refresh tokens for a user
 */
export const generateTokens = (userId: number, expiry?: string | number) => {
    try {
        // Create options and use 'as any' to bypass TypeScript's type checking
        const accessToken = jwt.sign(
            { userId }, 
            JWT_SECRET, 
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' } as any
        );

        const refreshToken = jwt.sign(
            { userId },
            REFRESH_SECRET, 
            { expiresIn: expiry || process.env.REFRESH_TOKEN_EXPIRY || '7d' } as any
        );

        return { accessToken, refreshToken };
    } catch (error) {
        throw new AppError(500, 'Error generating tokens');
    }
};

/**
 * Verify JWT token and extract payload
 */
export const verifyJwtToken = async (token: string): Promise<IDecodedToken> => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        if (!decoded || typeof decoded.userId !== 'number') {
            throw new AppError(401, 'Invalid token payload');
        }
        return decoded as IDecodedToken;
    } catch (error) {
        throw new AppError(401, 'Invalid or expired token');
    }
};

// Add alias for verifyToken
export const verifyToken = verifyJwtToken;