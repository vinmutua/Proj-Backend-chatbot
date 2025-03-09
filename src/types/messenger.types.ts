export interface WebhookEvent {
    object: string;
    entry: Array<{
        id: string;
        time: number;
        messaging: MessagingEvent[];
    }>;
}

export interface MessagingEvent {
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
        mid: string;
        text?: string;
        attachments?: Array<{
            type: string;
            payload: {
                url: string;
            };
        }>;
    };
    postback?: {
        title: string;
        payload: string;
    };
}

export interface MessengerSession {
    userId: string;
    context: any;
    lastInteraction: Date;
}