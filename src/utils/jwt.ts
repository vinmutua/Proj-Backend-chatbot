import jwt, { SignOptions, Secret, JwtPayload } from 'jsonwebtoken';
import { authConfig } from '../config/config';
import { AppError } from '../types/errors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface TokenPayload extends JwtPayload {
    userId: string;
}

interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}

export type ExpiryTime = string | number;

/**
 * Convert expiry time to seconds.
 * Expects format like "15m" or "7d".
 */
const normalizeExpiry = (expiry: ExpiryTime): number => {
    if (typeof expiry === 'number') return expiry;
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) throw new AppError(500, 'Invalid expiry format');
    const [, value, unit] = match;
    const multipliers: { [key: string]: number } = { s: 1, m: 60, h: 3600, d: 86400 };
    return parseInt(value) * multipliers[unit];
};

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your_jwt_secret';
const REFRESH_SECRET: Secret = process.env.REFRESH_SECRET || 'your_refresh_secret';

export const generateTokens = (userId: string, expiry?: string | number): TokenResponse => {
    try {
        // Use normalizeExpiry to convert the expiration strings into numbers (seconds)
        const accessExp: number = process.env.ACCESS_TOKEN_EXPIRY 
            ? normalizeExpiry(process.env.ACCESS_TOKEN_EXPIRY) 
            : 15 * 60;  // default 15 minutes

        const refreshExp: number = expiry 
            ? (typeof expiry === 'number' ? expiry : normalizeExpiry(expiry)) 
            : process.env.REFRESH_TOKEN_EXPIRY 
                ? normalizeExpiry(process.env.REFRESH_TOKEN_EXPIRY) 
                : 7 * 24 * 3600;  // default 7 days

        const accessTokenOptions: SignOptions = {
            expiresIn: accessExp
        };

        const refreshTokenOptions: SignOptions = {
            expiresIn: refreshExp
        };

        const accessToken = jwt.sign({ userId }, JWT_SECRET, accessTokenOptions);
        const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, refreshTokenOptions);

        return { accessToken, refreshToken };
    } catch (error) {
        throw new AppError(500, 'Error generating tokens');
    }
};

/**
 * Verify JWT token and extract payload
 */
export const verifyJwtToken = async (token: string): Promise<TokenPayload> => {
    if (!authConfig.jwt_secret) {
        throw new AppError(500, 'JWT secret not configured');
    }

    return new Promise((resolve, reject) => {
        jwt.verify(token, authConfig.jwt_secret as Secret, (err: any, decoded: any) => {
            if (err) reject(new AppError(401, 'Invalid token'));
            resolve(decoded as TokenPayload);
        });
    });
};

export const verifyRefreshToken = async (token: string): Promise<any> => {
    if (!authConfig.refresh_secret) {
        throw new AppError(500, 'Refresh token secret not configured');
    }

    return new Promise((resolve, reject) => {
        jwt.verify(token, authConfig.refresh_secret as Secret, (err: any, decoded: any) => {
            if (err) reject(new AppError(401, 'Invalid refresh token'));
            resolve(decoded);
        });
    });
};

// Add alias for verifyToken
export const verifyToken = verifyJwtToken;