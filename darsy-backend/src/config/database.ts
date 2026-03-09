import mongoose from 'mongoose';
import { config } from '../config';

export const connectDatabase = async (): Promise<void> => {
    try {
        const uri = config.mongodb.uri;
        console.log(`🔌 Attempting to connect to MongoDB...`);
        // Log masked URI for debugging
        const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
        console.log(`📝 Connection String: ${maskedUri}`);

        const options = {
            autoIndex: true,
            serverSelectionTimeoutMS: 5000,
        };

        await mongoose.connect(uri, options);

        console.log('✅ MongoDB connected successfully');

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        // Don't exit process in dev mode so we can see the error
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
    }
};
