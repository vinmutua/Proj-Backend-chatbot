import { SessionsClient } from '@google-cloud/dialogflow';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { IMessageResponse, IDialogflowResponse } from '../interfaces/messageInterface';

class MessageService {
    private sessionClient: SessionsClient;
    private projectId: string;
    private languageCode: string = 'en-US';

    constructor() {
        this.projectId = process.env.DIALOGFLOW_PROJECT_ID!;
        const privateKey = process.env.DIALOGFLOW_PRIVATE_KEY!.replace(/\\n/g, '\n');
        
        const credentials = {
            client_email: process.env.DIALOGFLOW_CLIENT_EMAIL!,
            private_key: privateKey
        };

        if (!this.projectId || !credentials.client_email || !credentials.private_key) {
            throw new Error('Missing Dialogflow credentials');
        }

        try {
            this.sessionClient = new SessionsClient({ credentials });
        } catch (error: any) {
            console.error('Dialogflow initialization error:', error);
            throw new Error('Failed to initialize Dialogflow client');
        }
    }

    public async handleMessage(
        message: string,
        sessionId?: string,
        userId?: string  // Make userId optional
    ): Promise<IMessageResponse> {
        try {
            // Generate a new session ID if none is provided
            const conversationId = sessionId || uuidv4();

            // Call Dialogflow
            const dialogflowResponse = await this.getDialogflowResponse(
                message,
                conversationId
            );
            
            // Save conversation to database
            await this.saveConversation(
                conversationId,
                message, 
                dialogflowResponse.fulfillmentText,
                userId || null  // Use null when no userId provided
            );
            
            // Return response
            return {
                success: true,
                sessionId: conversationId,
                response: dialogflowResponse.fulfillmentText,
                timestamp: new Date(),
                metadata: {
                    intent: dialogflowResponse.intent?.displayName,
                    confidence: dialogflowResponse.intent?.confidence,
                    parameters: dialogflowResponse.parameters
                }
            };
        } catch (error: unknown) {
            // Properly type check the error before accessing properties
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Unknown error';
            
            throw new AppError(500, `Dialogflow error: ${errorMessage}`);
        }
    }

    private async getDialogflowResponse(
        message: string,
        sessionId: string
    ): Promise<IDialogflowResponse> {
        try {
            const sessionPath = this.sessionClient.projectAgentSessionPath(
                this.projectId,
                sessionId
            );

            const request = {
                session: sessionPath,
                queryInput: {
                    text: {
                        text: message,
                        languageCode: this.languageCode,
                    },
                },
            };

            console.log('Sending request to Dialogflow:', {
                projectId: this.projectId,
                sessionId,
                message
            });

            const [response] = await this.sessionClient.detectIntent(request);
            
            if (!response.queryResult) {
                throw new Error('No response from Dialogflow');
            }

            return {
                fulfillmentText: response.queryResult.fulfillmentText || 'No response available',
                intent: response.queryResult.intent ? {
                    displayName: response.queryResult.intent.displayName || 'unknown',
                    confidence: response.queryResult.intentDetectionConfidence || 0
                } : undefined,
                parameters: response.queryResult.parameters?.fields || {}
            };
        } catch (error: unknown) {
            console.error('Dialogflow API error:', error);
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Unknown error';
            
            throw new AppError(500, `Dialogflow API error: ${errorMessage}`);
        }
    }

    private async saveConversation(
        sessionId: string,
        message: string,
        response: string,
        userId: string | null
    ): Promise<void> {
        try {
            await prisma.conversation.create({
                data: {
                    sessionId,
                    message,
                    response,
                    userId  // Will be null for anonymous users
                }
            });
        } catch (error: unknown) {
            console.error('Error saving conversation:', error);
            // Don't throw
        }
    }
}

export const messageService = new MessageService();
