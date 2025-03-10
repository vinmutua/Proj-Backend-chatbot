// filepath: e:\Project\Backend\src\interfaces\messageInterface.ts

import { JwtPayload } from 'jsonwebtoken';

export interface IMessageRequest {
    message: string;
    sessionId?: string;  // Optional, will be generated if not provided
}

export interface IMessageResponse {
    success: boolean;
    sessionId: string;
    response: string;
    timestamp: Date;
    metadata?: {
        intent?: string;
        confidence?: number;
        parameters?: Record<string, any>;
    };
}

export interface IDialogflowConfig {
    projectId: string;
    sessionId: string;
    credentials: {
        client_email: string;
        private_key: string;
    };
}

export interface IDialogflowResponse {
    fulfillmentText: string;
    intent?: {
        displayName: string;  // Changed from possibly null/undefined
        confidence: number;
    };
    parameters?: Record<string, any>;
}
