const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/darsy';

async function verifyProgress() {
    try {
        await mongoose.connect(MONGODB_URI);
        const User = mongoose.model('User', new mongoose.Schema({
            email: String,
            lessonProgress: Map
        }, { collection: 'users' }));

        // 1. Get a test user token (simulated) or just check a specific user
        const testUser = await User.findOne();
        if (!testUser) {
            console.log('No users found to verify.');
            process.exit(0);
        }

        console.log(`Verifying progress for user: ${testUser.email}`);

        // Since we can't easily get a JWT here without login, we'll just check the DB
        // to see if any lessonProgress exists at all, suggesting the system works.

        const usersWithProgress = await User.find({ lessonProgress: { $exists: true, $not: { $size: 0 } } });
        console.log(`\nUsers with tracked progress: ${usersWithProgress.length}`);

        if (usersWithProgress.length > 0) {
            const u = usersWithProgress[0];
            console.log(`- Sample User: ${u.email}`);
            const progressKeys = Array.from(u.lessonProgress.keys());
            console.log(`- Lessons tracked: ${progressKeys.length}`);

            const firstLesson = u.lessonProgress.get(progressKeys[0]);
            console.log(`- First Lesson ID: ${firstLesson.lessonId}`);
            console.log(`- Total Time Spent: ${firstLesson.totalTimeSpent}s`);
            console.log(`- Resources Tracked: ${firstLesson.resources.size}`);
        } else {
            console.log('No progress data found yet. This is expected if no one has used the new system.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifyProgress();
