const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const metadataDir = path.join(__dirname, '..', 'firebase_data', 'metadata');
const files = {
    schools: path.join(metadataDir, 'school.json'),
    levels: path.join(metadataDir, 'levels.json'),
    guidances: path.join(metadataDir, 'guidances.json'),
    subjects: path.join(metadataDir, 'subjects.json'),
    lessons: path.join(metadataDir, 'lessons.json'),
    exams: path.join(metadataDir, 'exams.json')
};

const MONGODB_URI = process.env.MONGODB_URI;

async function syncAll() {
    const client = new MongoClient(MONGODB_URI);
    try {
        console.log('--- STARTING FULL CURRICULUM SYNC ---');

        // 1. Load and DEDUPLICATE data in memory first
        console.log('Loading and processing JSON files...');

        const subjects = JSON.parse(fs.readFileSync(files.subjects, 'utf8'));
        const lessons = JSON.parse(fs.readFileSync(files.lessons, 'utf8'));
        const exams = JSON.parse(fs.readFileSync(files.exams, 'utf8'));

        // Identify duplicate subjects
        const subjectMapping = {};
        const uniqueSubjects = [];
        const seenSubjects = new Map();

        subjects.forEach(s => {
            const key = `${s.guidanceId}_${s.title.trim()}`;
            if (seenSubjects.has(key)) {
                subjectMapping[s.id] = seenSubjects.get(key);
            } else {
                seenSubjects.set(key, s.id);
                uniqueSubjects.push(s);
            }
        });

        // Map lessons and deduplicate
        const mappedLessons = lessons.map(l => ({
            ...l,
            subjectId: subjectMapping[l.subjectId] || l.subjectId
        }));
        const uniqueLessons = [];
        const seenLessons = new Set();
        mappedLessons.forEach(l => {
            const key = `${l.subjectId}_${l.title.trim()}`;
            if (!seenLessons.has(key)) {
                seenLessons.add(key);
                uniqueLessons.push(l);
            }
        });

        // Map exams
        const updatedExams = exams.map(e => ({
            ...e,
            subjectId: subjectMapping[e.subjectId] || e.subjectId
        }));

        console.log(`- Subjects: ${subjects.length} -> ${uniqueSubjects.length}`);
        console.log(`- Lessons: ${lessons.length} -> ${uniqueLessons.length}`);

        // 2. Connect to DB
        console.log('Connecting to MongoDB...');
        await client.connect();
        const db = client.db();

        // 3. Sync each collection
        const syncCollection = async (collName, jsonPath, transform = (x) => ({ ...x, _id: x.id })) => {
            console.log(`Syncing ${collName}...`);
            const data = (collName === 'subjects') ? uniqueSubjects :
                (collName === 'lessons') ? uniqueLessons :
                    (collName === 'exams') ? updatedExams :
                        JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

            await db.collection(collName).deleteMany({});
            const docs = data.map(d => {
                const doc = transform(d);
                doc.createdAt = doc.createdAt || new Date();
                doc.updatedAt = new Date();
                return doc;
            });

            if (docs.length > 0) {
                const chunkSize = 500;
                for (let i = 0; i < docs.length; i += chunkSize) {
                    await db.collection(collName).insertMany(docs.slice(i, i + chunkSize));
                }
            }
            console.log(`- ${collName}: ${docs.length} items synced.`);
        };

        await syncCollection('schools', files.schools);
        await syncCollection('levels', files.levels);
        await syncCollection('guidances', files.guidances);
        await syncCollection('subjects', files.subjects);
        await syncCollection('lessons', files.lessons);
        await syncCollection('exams', files.exams);

        // 4. Update JSON files with deduplicated versions
        console.log('Updating JSON files with clean data...');
        fs.writeFileSync(files.subjects, JSON.stringify(uniqueSubjects, null, 2));
        fs.writeFileSync(files.lessons, JSON.stringify(uniqueLessons, null, 2));
        fs.writeFileSync(files.exams, JSON.stringify(updatedExams, null, 2));

        console.log('--- SYNC COMPLETE ---');
    } catch (err) {
        console.error('Error during sync:', err);
        process.exit(1);
    } finally {
        await client.close();
        process.exit(0);
    }
}

syncAll();
