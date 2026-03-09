const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/darsy';

async function checkDuplicates() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const Subject = mongoose.model('Subject', new mongoose.Schema({
            _id: String,
            title: String,
            guidanceId: String
        }, { collection: 'subjects', _id: false }));

        const subjects = await Subject.find();
        const seen = new Map();
        const duplicates = [];

        for (const s of subjects) {
            const key = `${s.guidanceId}_${s.title}`;
            if (seen.has(key)) {
                duplicates.push({
                    title: s.title,
                    guidanceId: s.guidanceId,
                    firstId: seen.get(key),
                    secondId: s._id
                });
            } else {
                seen.set(key, s._id);
            }
        }

        console.log(`Total subjects: ${subjects.length}`);
        console.log(`Duplicate subjects found: ${duplicates.length}`);

        if (duplicates.length > 0) {
            console.log('\nSample Duplicates:');
            duplicates.slice(0, 10).forEach(d => {
                console.log(`- "${d.title}" in guidance ${d.guidanceId} (IDs: ${d.firstId}, ${d.secondId})`);
            });
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDuplicates();
