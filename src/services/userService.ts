import { IAuthRequest, IAuthResponse, IDecodedToken } from '../interfaces/userInterface';
import { hashPassword, comparePasswords } from '../utils/bcrypt';
import { generateTokens, verifyJwtToken, verifyRefreshToken } from '../utils/jwt';
import prisma from '../lib/prisma';
import { AppError } from '../types/errors';
import { User } from '@prisma/client';


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

    async findUserById(userId: string): Promise<User> {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new AppError(404, 'User not found');
        }

        return user;
    }

    async refreshAccessToken(refreshToken: string) {
        try {
            const decoded = await verifyRefreshToken(refreshToken);
            const userId = decoded.userId;

            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user || user.refreshToken !== refreshToken) {
                throw new AppError(401, 'Invalid refresh token');
            }

            const tokens = await generateTokens(userId);

            await prisma.user.update({
                where: { id: userId },
                data: { refreshToken: tokens.refreshToken }
            });

            return tokens;
        } catch (error) {
            throw new AppError(401, 'Invalid refresh token');
        }
    }

    private sanitizeUser(user: User): Omit<User, 'password' | 'refreshToken'> {
        const { password, refreshToken, ...sanitizedUser } = user;
        return sanitizedUser;
    }
}

export const userService = new UserService();
export default userService;