import axios from 'axios';
import { messengerConfig } from '../config/messenger.config';
import { MessagingEvent, MessengerSession } from '../types/messenger.types';
import { AppError } from '../types/errors';
import prisma from '../lib/prisma';

export class MessengerService {
    private sessions: Map<string, MessengerSession> = new Map();

    async sendMessage(userId: string, message: string) {
        try {
            await axios.post(
                `https://graph.facebook.com/${messengerConfig.api_version}/me/messages`,
                {
                    recipient: { id: userId },
                    message: { text: message }
                },
                {
                    params: { access_token: messengerConfig.page_token }
                }
            );
        } catch (error) {
            throw new AppError(500, 'Failed to send message');
        }
    }

    async handleMessage(event: MessagingEvent) {
        const userId = event.sender.id;
        const session = this.getOrCreateSession(userId);

        if (event.message?.text) {
            await this.processTextMessage(event.message.text, session);
        } else if (event.message?.attachments) {
            await this.processAttachments(event.message.attachments, session);
        }
    }

    private getOrCreateSession(userId: string): MessengerSession {
        if (!this.sessions.has(userId)) {
            this.sessions.set(userId, {
                userId,
                context: {},
                lastInteraction: new Date()
            });
        }
        return this.sessions.get(userId)!;
    }

    private async processTextMessage(text: string, session: MessengerSession) {
        // Implement your chatbot logic here
        const response = await this.generateResponse(text, session.context);
        await this.sendMessage(session.userId, response);
    }

    private async processAttachments(attachments: any[], session: MessengerSession) {
        // Handle different attachment types
    }

    private async generateResponse(text: string, context: any): Promise<string> {
        // Implement your response generation logic
        return "Thanks for your message!";
    }
}

export const messengerService = new MessengerService();