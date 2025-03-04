import { IAuthRequest, IAuthResponse, IGoogleAuthRequest, IDecodedToken } from '../interfaces/userInterface';
import { hashPassword, comparePasswords } from '../utils/bcrypt';
import { generateTokens, verifyJwtToken } from '../utils/jwt';
import { verifyGoogleToken } from '../utils/oauth';
import prisma from '../lib/prisma';
import crypto from 'crypto';
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

        const tokens = remember ? 
            await generateTokens(user.id, '30d') : 
            await generateTokens(user.id);

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
            throw new AppError(404, 'User not found');
        }

        return generateTokens(user.id);
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

    async logout(userId: number): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null }
        });
    }

    async findUserById(id: number): Promise<User | null> {
        return prisma.user.findUnique({
            where: { id }
        });
    }

    private sanitizeUser(user: User): Omit<User, 'password' | 'refreshToken'> {
        const { password, refreshToken, ...sanitizedUser } = user;
        return sanitizedUser;
    }
}

export const userService = new UserService();
export default userService;