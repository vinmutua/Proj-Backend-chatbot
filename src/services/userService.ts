import { IUser, ILoginResponse, IGoogleUser, IDecodedToken } from '../interfaces/userInterface';
import { hashPassword, comparePasswords } from '../utils/bcrypt';
import { generateTokens, verifyJwtToken } from '../utils/jwt';
import { verifyGoogleToken } from '../utils/oauth';
import prisma from '../lib/prisma';
import crypto from 'crypto';
import { AppError } from '../types/errors';

export class UserService {
    async signup(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt' | 'isVerified' | 'googleId' | 'verificationToken' | 'resetPasswordToken' | 'resetPasswordExpires' | 'refreshToken'>): Promise<ILoginResponse> {
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email }
        });
        
        if (existingUser) {
            throw new AppError(400, 'Email already exists');
        }

        const hashedPassword = await hashPassword(userData.password);
        const user = await prisma.user.create({
            data: {
                ...userData,
                password: hashedPassword,
                isVerified: false
            }
        });

        // Fix: Await the token generation
        const tokens = await generateTokens(user.id);
        
        // Store refresh token in database
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken }
        });

        return {
            user: this.sanitizeUser(user),
            tokens
        };
    }

    async login(email: string, password: string): Promise<ILoginResponse> {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }

        // Fix: Await the token generation
        const tokens = await generateTokens(user.id);
        
        // Store refresh token in database
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken }
        });

        return {
            user: this.sanitizeUser(user),
            tokens
        };
    }

    async refreshToken(token: string) {
        const decoded = await verifyJwtToken(token) as IDecodedToken;
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });
        if (!user) {
            throw new Error('User not found');
        }

        return generateTokens(user.id);
    }

    async googleLogin(idToken: string): Promise<ILoginResponse> {
        const googleUser = await verifyGoogleToken(idToken) as IGoogleUser;
        if (!googleUser || !googleUser.email) {
            throw new Error('Invalid Google token');
        }

        let user = await prisma.user.findUnique({
            where: { email: googleUser.email }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: googleUser.email,
                    firstName: googleUser.name,
                    googleId: googleUser.sub,
                    isVerified: true,
                    password: await hashPassword(Math.random().toString(36))
                }
            });
        }

        // Fix: Await the token generation
        const tokens = await generateTokens(user.id);
        
        // Store refresh token in database
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: tokens.refreshToken }
        });

        return {
            user: this.sanitizeUser(user),
            tokens
        };
    }

    async forgotPassword(email: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            throw new AppError(404, 'User not found');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: new Date(Date.now() + 3600000) // 1 hour
            }
        });

        // TODO: Send email with reset token
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: { gt: new Date() }
            }
        });

        if (!user) {
            throw new Error('Invalid or expired reset token');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: await hashPassword(newPassword),
                resetPasswordToken: undefined,
                resetPasswordExpires: undefined
            }
        });
    }

    async verifyEmail(token: string): Promise<void> {
        const user = await prisma.user.findFirst({
            where: { verificationToken: token }
        });
        if (!user) {
            throw new Error('Invalid verification token');
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: undefined
            }
        });
    }

    async logout(token: string): Promise<void> {
        // TODO: Add token to blacklist or invalidate refresh token
        // This implementation depends on your token management strategy
    }

    async createUser(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
        return await prisma.user.create({
            data: userData
        })
    }

    async findUserByEmail(email: string): Promise<IUser | null> {
        return await prisma.user.findUnique({
            where: { email }
        })
    }

    async findUserById(id: number) {
        return prisma.user.findUnique({
            where: { id }
        });
    }

    private sanitizeUser(user: IUser): Omit<IUser, 'password'> {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }
}

export const userService = new UserService();
export default userService;