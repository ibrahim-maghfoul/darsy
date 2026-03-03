const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Update with actual path

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deduplicateFirebaseSubjects() {
    console.log('--- STARTING FIREBASE DEDUPLICATION ---');

    try {
        // 1. Fetch all subjects from Firebase
        console.log('Fetching subjects from Firebase...');
        const subjectsSnapshot = await db.collection('subjects').get();
        const subjects = [];
        subjectsSnapshot.forEach(doc => {
            subjects.push({ id: doc.id, ...doc.data() });
        });

        console.log(`- Total subjects in Firebase: ${subjects.length}`);

        // 2. Identify duplicates
        const seenSubjects = new Map(); // guidanceId_title -> primaryID
        const duplicates = [];
        const uniqueSubjects = [];

        subjects.forEach(s => {
            const key = `${s.guidanceId}_${(s.title || '').trim()}`;
            if (seenSubjects.has(key)) {
                duplicates.push({ id: s.id, primaryId: seenSubjects.get(key) });
            } else {
                seenSubjects.set(key, s.id);
                uniqueSubjects.push(s);
            }
        });

        console.log(`- Unique subjects: ${uniqueSubjects.length}`);
        console.log(`- Duplicates to remove: ${duplicates.length}`);

        if (duplicates.length === 0) {
            console.log('✓ No duplicates found in Firebase!');
            process.exit(0);
        }

        // 3. Update lessons and exams to use correct subject IDs
        console.log('Updating lesson references...');
        const lessonsSnapshot = await db.collection('lessons').get();
        let lessonsUpdated = 0;

        const batch = db.batch();
        let batchCount = 0;

        lessonsSnapshot.forEach(doc => {
            const lesson = doc.data();
            const duplicate = duplicates.find(d => d.id === lesson.subjectId);
            if (duplicate) {
                batch.update(doc.ref, { subjectId: duplicate.primaryId });
                lessonsUpdated++;
                batchCount++;
            }
        });

        if (batchCount > 0) {
            await batch.commit();
            console.log(`- Updated ${lessonsUpdated} lessons`);
        }

        // 4. Update exams to use correct subject IDs
        console.log('Updating exam references...');
        const examsSnapshot = await db.collection('exams').get();
        let examsUpdated = 0;

        const examBatch = db.batch();
        let examBatchCount = 0;

        examsSnapshot.forEach(doc => {
            const exam = doc.data();
            const duplicate = duplicates.find(d => d.id === exam.subjectId);
            if (duplicate) {
                examBatch.update(doc.ref, { subjectId: duplicate.primaryId });
                examsUpdated++;
                examBatchCount++;
            }
        });

        if (examBatchCount > 0) {
            await examBatch.commit();
            console.log(`- Updated ${examsUpdated} exams`);
        }

        // 5. Delete duplicate subjects
        console.log('Deleting duplicate subjects...');
        const deleteBatch = db.batch();
        duplicates.forEach(dup => {
            const docRef = db.collection('subjects').doc(dup.id);
            deleteBatch.delete(docRef);
        });

        await deleteBatch.commit();
        console.log(`- Deleted ${duplicates.length} duplicate subjects`);

        console.log('--- FIREBASE DEDUPLICATION COMPLETE ---');
        console.log(`Final subject count: ${uniqueSubjects.length}`);

    } catch (error) {
        console.error('Error during Firebase deduplication:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

deduplicateFirebaseSubjects();
