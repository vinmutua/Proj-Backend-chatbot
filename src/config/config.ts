import { config } from 'dotenv';

config();

export const serverConfig = {
    port: process.env.PORT || 3000,
    frontend_url: process.env.FRONTEND_URL || 'http://localhost:4200',
    node_env: process.env.NODE_ENV || 'development',
    api_prefix: process.env.API_PREFIX || '/api',
    cors_origin: process.env.CORS_ORIGIN || 'http://localhost:4200'
};

export const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || [],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
};

export interface AuthConfig {
    jwt_secret: string | undefined;
    refresh_secret: string | undefined;
    access_token_expiry: string;
    refresh_token_expiry: string;
    token_refresh_interval: number;
    session_timeout: number;
}

export const authConfig: AuthConfig = {
    jwt_secret: process.env.JWT_SECRET,
    refresh_secret: process.env.REFRESH_SECRET,
    access_token_expiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    refresh_token_expiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    token_refresh_interval: 840000,
    session_timeout: 3600000
};



