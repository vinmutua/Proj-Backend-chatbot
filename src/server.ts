import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import prisma from './lib/prisma';
import { serverConfig, corsOptions } from './config/config';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Routes
app.use(serverConfig.api_prefix + '/users', userRoutes);

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

const PORT = Number(serverConfig.port);

async function startServer() {
    try {
        await prisma.$connect();
        console.log('Database Connected Successfully');

        // Bind to 0.0.0.0 so the server is accessible on your network IP.
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });

        const shutdown = async () => {
            console.log('Shutting down server...');
            await prisma.$disconnect();
            server.close(() => {
                process.exit(0);
            });
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        console.error('Startup Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

startServer();

export default app;

