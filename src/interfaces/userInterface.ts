import { User } from '@prisma/client'
import { JwtPayload } from 'jsonwebtoken';

// Base User Type
export type IUser = User

// Authentication Interfaces
export interface ILoginCredentials {
    email: string;
    password: string;
}

export interface ISignupCredentials {
    email: string;
    password: string;
}

export interface ILoginResponse {
    user: Omit<User, 'password'>;
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}

// Token Related
export interface IDecodedToken extends JwtPayload {
    userId: number;
}

export type TokenExpiry = string | number;

// Google Authentication Interfaces
export interface IGoogleAuthCredentials {
    idToken: string;
}

export interface IGoogleUser {
    email: string;
    name: string;
    sub: string;
}

// Request Parameter Interfaces
export interface IUserParams {
    id: string;
}

// Auth Request Interfaces
export interface ISignupRequest {
    email: string;
    password: string;
}

export interface ILoginRequest {
    email: string;
    password: string;
    remember?: boolean;
}

export interface IGoogleAuthRequest {
    googleId: string;
    email: string;
    idToken: string;
}

// Password Reset Interfaces
export interface IPasswordReset {
    email: string;
    token: string;
    newPassword: string;
}

// Response Interfaces
export interface IAuthResponse {
    user: Omit<User, 'password' | 'refreshToken'>;
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}

// Error Interface
export interface IAppError {
    statusCode: number;
    message: string;
}

// Essential Auth Request Interfaces
export interface IAuthRequest {
    email: string;
    password: string;
}