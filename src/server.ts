import dotenv from 'dotenv';
// Load env variables first
dotenv.config();

import app from './app';
import prisma from './lib/prisma';

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log('Database Connected Successfully');

        // Start server
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        // Graceful shutdown handlers
        const shutdown = async () => {
            console.log('Shutting down server...');
            await prisma.$disconnect();
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        };

        // Handle different shutdown signals
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
        process.on('uncaughtException', async (error) => {
            console.error('Uncaught Exception:', error);
            await shutdown();
        });

    } catch (error) {
        console.error('Startup Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

startServer();

