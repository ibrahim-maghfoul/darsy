import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { User, IUser } from './src/models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
}

async function seedExistingUsers() {
    try {
        await mongoose.connect(MONGODB_URI!);
        console.log('Connected to MongoDB');

        const users = await User.find({
            $or: [
                { 'progress.timeSpentHistory': { $exists: false } },
                { 'progress.timeSpentHistory': { $size: 0 } }
            ]
        });

        console.log(`Found ${users.length} users to seed`);

        let updated = 0;
        for (const user of users) {
            const document = user as unknown as mongoose.Document & IUser & { _doc: any };
            
            // Generate mock data
            const history = [];
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const randomMinutes = Math.floor(Math.random() * (120 - 15 + 1) + 15);
                history.push({ date: dateStr, minutes: randomMinutes });
            }

            // Ensure progress object exists
            if (!document.progress) {
                document.progress = {
                    totalLessons: 0,
                    completedLessons: 0,
                    learningTime: 0,
                    documentsOpened: 0,
                    videosWatched: 0,
                    usageTime: 0,
                    savedNews: [],
                    lessons: [],
                    timeSpentHistory: history
                };
            } else {
                // Must use _doc for mixed/uninitialized nested properties in some setups, or markModified
                if (!document.progress.timeSpentHistory) {
                    document.progress.timeSpentHistory = [];
                }
                document.progress.timeSpentHistory = history;
                document.progress.learningTime = history.reduce((sum, entry) => sum + entry.minutes, 0);
                document.markModified('progress.timeSpentHistory');
                document.markModified('progress.learningTime');
            }

            await document.save();
            updated++;
        }

        console.log(`Successfully seeded ${updated} users`);
    } catch (error) {
        console.error('Error seeding users:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

seedExistingUsers();
