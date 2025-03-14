import { User } from '@prisma/client'
import { JwtPayload } from 'jsonwebtoken';

// Base User Type
export type IUser = User

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

export interface IDecodedToken extends JwtPayload {
    userId: string;
    iat: number;
    exp: number;
}

export type TokenExpiry = string | number;

export interface IUserParams {
    id: string;
}

export interface IAuthRequest {
    email: string;
    password: string;
}

export interface IAuthResponse {
    user: Omit<User, 'password' | 'refreshToken'>;
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}

interface IUserService {
    signup(signupData: IAuthRequest): Promise<any>;
    login(loginData: IAuthRequest): Promise<any>;
}