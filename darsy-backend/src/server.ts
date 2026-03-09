import express, { Application, Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';

import { config } from './config';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { sanitizeInputs, sanitizeStrings, authRateLimiter, generalRateLimiter } from './middleware/security';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import progressRoutes from './routes/progress';
import dataRoutes from './routes/data';
import newsRoutes from './routes/news';
import newsletterRoutes from './routes/newsletter';
import contactRoutes from './routes/contact';
import chatRoutes from './routes/chat';
import { handleChatConnection } from './sockets/chat';

const app: Application = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Setup sockets
io.on('connection', (socket) => {
    handleChatConnection(io, socket);
});

// Connect to database
connectDatabase();

// ----- SECURITY MIDDLEWARE -----

// Helmet: sets many secure HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow static resources
}));

// CORS
app.use(cors(config.cors));

// Body parsing (must come before sanitizers)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(config.cookie.secret));
app.use(compression());

// ----- INPUT SANITIZATION (apply globally after body parsing) -----
app.use(sanitizeInputs);    // Strip MongoDB operators from all inputs
app.use(sanitizeStrings);   // Strip HTML tags from string fields

// ----- RATE LIMITING -----
// Stricter rate limit for auth endpoints (brute-force protection)
app.use('/api/auth', authRateLimiter);
// General rate limit for all other API routes
app.use('/api/', generalRateLimiter);

// Logging middleware
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Static files
app.use('/data/images', express.static(path.join(process.cwd(), 'data/images')));
app.use('/data/resources', express.static(path.join(process.cwd(), 'data/resources')));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/chat', chatRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔒 Security middleware: NoSQL sanitizer, rate limiter, helmet enabled`);
    console.log(`💬 Socket.io real-time chat enabled`);
});

export default app;
