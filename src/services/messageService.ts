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
        userId: string,
        sessionId?: string
    ): Promise<IMessageResponse> {
        try {
            const finalSessionId = sessionId || uuidv4();
            const dialogflowResponse = await this.getDialogflowResponse(message, finalSessionId);
            
            await this.storeConversation(
                userId,
                finalSessionId,
                message,
                dialogflowResponse.fulfillmentText
            );

            return {
                success: true,
                sessionId: finalSessionId,
                response: dialogflowResponse.fulfillmentText,
                timestamp: new Date(),  // Add timestamp
                metadata: {
                    intent: dialogflowResponse.intent?.displayName,
                    confidence: dialogflowResponse.intent?.confidence,
                    parameters: dialogflowResponse.parameters
                }
            };
        } catch (error: any) {
            throw new AppError(500, `Dialogflow error: ${error.message}`);
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
        } catch (error: any) {
            console.error('Dialogflow API error:', error);
            throw new AppError(500, `Dialogflow API error: ${error.message}`);
        }
    }

    private async storeConversation(
        userId: string,
        sessionId: string,
        message: string,
        response: string
    ): Promise<void> {
        try {
            await prisma.conversation.create({
                data: {
                    userId,
                    sessionId,
                    message,
                    response
                }
            });
        } catch (error) {
            throw new AppError(500, 'Failed to store conversation');
        }
    }
}

export const messageService = new MessageService();
