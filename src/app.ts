import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions, serverConfig } from './config/config';
import userRoutes from './routes/userRoutes';
import messageRoutes from './routes/messageRoutes';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Configure Helmet with custom CSP
app.use(
//     helmet({
//         contentSecurityPolicy: {
//             directives: {
//                 defaultSrc: ["'self'"],
//                 scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
//                 frameSrc: ["'self'"],
//                 connectSrc: ["'self'"],
//                 imgSrc: ["'self'", "data:"],
//                 styleSrc: ["'self'", "'unsafe-inline'"],
//                 fontSrc: ["'self'", "data:"]
//             }
//         }
//     })
);

app.use(cors(corsOptions));  // <- Uses the configured allowed origins
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(serverConfig.api_prefix + '/users', userRoutes);
app.use(serverConfig.api_prefix + '/messages', messageRoutes);  // Add this line

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
   
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

export default app;

