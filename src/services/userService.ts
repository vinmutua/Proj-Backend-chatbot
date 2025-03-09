import { IAuthRequest, IAuthResponse, IGoogleAuthRequest, IDecodedToken } from '../interfaces/userInterface';
import { hashPassword, comparePasswords } from '../utils/bcrypt';
import { generateTokens, verifyJwtToken, verifyRefreshToken } from '../utils/jwt';
import { verifyGoogleToken } from '../utils/oauth';
import prisma from '../lib/prisma';
import crypto from 'crypto';
import { AppError } from '../types/errors';
import { User } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { authConfig } from '../config/config';

export class UserService {
    async signup(userData: IAuthRequest): Promise<IAuthResponse> {
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email }
        });
        
        if (existingUser) {
            throw new AppError(400, 'Email already exists');
        }

        const hashedPassword = await hashPassword(userData.password);

        // No need to generate a custom id – Prisma auto-generates it.
        const user = await prisma.user.create({
            data: {
                email: userData.email,
                password: hashedPassword
            }
        });

        const tokens = await generateTokens(user.id);
        
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken }
        });

        return {
            user: this.sanitizeUser(user),
            tokens
        };
    }

    async login(email: string, password: string, remember?: boolean): Promise<IAuthResponse> {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user || !await comparePasswords(password, user.password)) {
            throw new AppError(401, 'Invalid credentials');
        }

        const tokens = await generateTokens(user.id, remember ? '30d' : undefined);

        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken }
        });

        return {
            user: this.sanitizeUser(user),
            tokens
        };
    }

    async refreshToken(refreshToken: string) {
        try {
            // Verify the refresh token
            const decoded = await verifyRefreshToken(refreshToken);
            
            // Find user with valid refresh token
            const user = await prisma.user.findFirst({
                where: {
                    id: decoded.userId,
                    refreshToken: refreshToken
                }
            });

            if (!user) {
                throw new AppError(401, 'Invalid refresh token');
            }

            // Generate new tokens
            const tokens = generateTokens(user.id);

            // Update refresh token in database
            await prisma.user.update({
                where: { id: user.id },
                data: { refreshToken: tokens.refreshToken }
            });

            return {
                user: {
                    id: user.id,
                    email: user.email
                },
                tokens
            };
        } catch (error) {
            throw new AppError(401, 'Invalid refresh token');
        }
    }

    async googleLogin(authData: IGoogleAuthRequest): Promise<IAuthResponse> {
        const googleUser = await verifyGoogleToken(authData.idToken);
        
        if (!googleUser || googleUser.email !== authData.email) {
            throw new AppError(401, 'Invalid Google token');
        }

        let user = await prisma.user.findUnique({
            where: { email: authData.email }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: authData.email,
                    googleId: authData.googleId,
                    password: await hashPassword(crypto.randomBytes(32).toString('hex'))
                }
            });
        }

        const tokens = await generateTokens(user.id);
        
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken }
        });

        return {
            user: this.sanitizeUser(user),
            tokens
        };
    }

    async logout(userId: string): Promise<void> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                throw new AppError(404, 'User not found');
            }

            await prisma.user.update({
                where: { id: userId },
                data: { 
                    refreshToken: null
                }
            });
        } catch (error) {
            throw new AppError(500, 'Error during logout');
        }
    }

    async findUserById(userId: string) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                throw new AppError(404, 'User not found');
            }

            return user;
        } catch (error) {
            throw error;
        }
    }

    private sanitizeUser(user: User): Omit<User, 'password' | 'refreshToken'> {
        const { password, refreshToken, ...sanitizedUser } = user;
        return sanitizedUser;
    }
}

export const userService = new UserService();
export default userService;