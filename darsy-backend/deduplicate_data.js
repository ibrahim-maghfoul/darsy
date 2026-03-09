const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const subjectsPath = path.join(__dirname, '..', 'firebase_data', 'metadata', 'subjects.json');
const lessonsPath = path.join(__dirname, '..', 'firebase_data', 'metadata', 'lessons.json');
const examsPath = path.join(__dirname, '..', 'firebase_data', 'metadata', 'exams.json');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/darsy';

async function deduplicate() {
    const client = new MongoClient(MONGODB_URI);
    try {
        console.log('--- STARTING DEDUPLICATION ---');

        // 1. Load JSON data
        console.log('Loading JSON files...');
        const subjects = JSON.parse(fs.readFileSync(subjectsPath, 'utf8'));
        const lessons = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
        const exams = JSON.parse(fs.readFileSync(examsPath, 'utf8'));

        // 2. Identify duplicate subjects and create mapping
        console.log('Identifying duplicate subjects...');
        const subjectMapping = {}; // secondaryID -> primaryID
        const uniqueSubjects = [];
        const seenSubjects = new Map(); // guidanceId_title -> primaryID

        subjects.forEach(s => {
            const key = `${s.guidanceId}_${s.title.trim()}`;
            if (seenSubjects.has(key)) {
                subjectMapping[s.id] = seenSubjects.get(key);
            } else {
                seenSubjects.set(key, s.id);
                uniqueSubjects.push(s);
            }
        });

        console.log(`- Original subjects: ${subjects.length}`);
        console.log(`- Unique subjects: ${uniqueSubjects.length}`);
        console.log(`- Duplicates to merge: ${Object.keys(subjectMapping).length}`);

        // 3. Update lesson references and deduplicate lessons
        console.log('Updating and deduplicating lessons...');
        const mappedLessons = lessons.map(l => ({
            ...l,
            subjectId: subjectMapping[l.subjectId] || l.subjectId
        }));

        const uniqueLessons = [];
        const seenLessons = new Set(); // subjectId_title

        mappedLessons.forEach(l => {
            const key = `${l.subjectId}_${l.title.trim()}`;
            if (!seenLessons.has(key)) {
                seenLessons.add(key);
                uniqueLessons.push(l);
            }
        });

        console.log(`- Original lessons: ${lessons.length}`);
        console.log(`- Mapped/Unique lessons: ${uniqueLessons.length}`);

        // 4. Update exam references
        console.log('Updating exam references...');
        const updatedExams = exams.map(e => ({
            ...e,
            subjectId: subjectMapping[e.subjectId] || e.subjectId
        }));

        // 5. Save updated JSON files
        console.log('Saving updated JSON files...');
        fs.writeFileSync(subjectsPath, JSON.stringify(uniqueSubjects, null, 2));
        fs.writeFileSync(lessonsPath, JSON.stringify(uniqueLessons, null, 2));
        fs.writeFileSync(examsPath, JSON.stringify(updatedExams, null, 2));

        // 6. Update MongoDB
        console.log('Connecting to MongoDB...');
        await client.connect();
        const db = client.db();

        const subjectColl = db.collection('subjects');
        const lessonColl = db.collection('lessons');
        const examColl = db.collection('exams');

        console.log('Syncing subjects to database (full replace to ensure consistency)...');
        await subjectColl.deleteMany({});
        const subjectsToInsert = uniqueSubjects.map(s => ({
            ...s,
            _id: s.id,
            createdAt: new Date(),
            updatedAt: new Date()
        }));
        await subjectColl.insertMany(subjectsToInsert);

        console.log('Syncing lessons to database (full replace to ensure deduplication)...');
        await lessonColl.deleteMany({});
        const lessonsToInsert = uniqueLessons.map(l => ({
            ...l,
            _id: l.id,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        const chunkSize = 500;
        for (let i = 0; i < lessonsToInsert.length; i += chunkSize) {
            await lessonColl.insertMany(lessonsToInsert.slice(i, i + chunkSize));
        }

        console.log('Syncing exams to database...');
        await examColl.deleteMany({});
        const examsToInsert = updatedExams.map(e => ({
            ...e,
            _id: e.id,
            createdAt: new Date(),
            updatedAt: new Date()
        }));
        for (let i = 0; i < examsToInsert.length; i += chunkSize) {
            await examColl.insertMany(examsToInsert.slice(i, i + chunkSize));
        }

        console.log('--- DEDUPLICATION COMPLETE ---');
    } catch (err) {
        console.error('Error during deduplication:', err);
        process.exit(1);
    } finally {
        await client.close();
        process.exit(0);
    }
}

deduplicate();
