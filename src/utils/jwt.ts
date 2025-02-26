import jwt, { SignOptions, Secret, JwtPayload } from 'jsonwebtoken';
import { IDecodedToken } from '../interfaces/userInterface';
import { AppError } from '../types/errors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as Secret;
const REFRESH_SECRET = process.env.REFRESH_SECRET as Secret;

type TokenExpiry = '15m' | '7d';

if (!JWT_SECRET || !REFRESH_SECRET) {
    throw new Error('JWT secrets must be defined in environment variables');
}

export const generateTokens = (userId: number) => {
    try {
        const accessTokenOptions: SignOptions = {
            expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || '15m') as TokenExpiry
        };

        const refreshTokenOptions: SignOptions = {
            expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || '7d') as TokenExpiry
        };

        const accessToken = jwt.sign(
            { userId },
            JWT_SECRET,
            accessTokenOptions
        );

        const refreshToken = jwt.sign(
            { userId },
            REFRESH_SECRET,
            refreshTokenOptions
        );

        return { accessToken, refreshToken };
    } catch (error) {
        throw new AppError(500, 'Error generating tokens');
    }
};

// Add both named exports for backward compatibility
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