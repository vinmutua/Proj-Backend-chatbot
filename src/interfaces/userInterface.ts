import { User } from '@prisma/client'

// Base User Type
export type IUser = User

// Authentication Interfaces
export interface ILoginCredentials {
    email: string;
    password: string;
}

export interface ISignupCredentials {
    firstName: string;
    email: string;
    password: string;
}

export interface ILoginResponse {
    user: Omit<IUser, 'password'>;
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}

// Token Related Interfaces
export interface IDecodedToken {
    userId: number;
    iat: number;
    exp: number;
}

export interface ITokens {
    accessToken: string;
    refreshToken: string;
}

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
    id: number;
}

// Request Body Interfaces
export interface ILoginRequest {
    email: string;
    password: string;
}

export interface ISignupRequest {
    firstName: string;
    email: string;
    password: string;
}

// Password Reset Interfaces
export interface IPasswordReset {
    email: string;
    token: string;
    newPassword: string;
}

// Response Interfaces
export interface IAuthResponse {
    success: boolean;
    message: string;
    data?: any;
}

// Error Interface
export interface IAppError {
    statusCode: number;
    message: string;
}