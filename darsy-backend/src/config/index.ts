import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:5000',
    apiKey: process.env.APP_API_KEY || '',

    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/darsyschool',
    },

    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },

    cookie: {
        secret: process.env.COOKIE_SECRET || 'cookie-secret',
        maxAge: parseInt(process.env.COOKIE_MAX_AGE || '604800000'),
    },

    cors: {
        origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
        credentials: true,
    },

    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
        path: process.env.UPLOAD_PATH || './uploads',
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    },
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        from: process.env.EMAIL_FROM || '"Darsy" <hello@darsy.io>',
        adminEmail: process.env.ADMIN_EMAIL || 'ibratst1@gmail.com'
    }
};
