import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions } from './config/config';
import userRoutes from './routes/userRoutes';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors(corsOptions));  // <- Uses the configured allowed origins
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(process.env.API_PREFIX + '/users', userRoutes);

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

