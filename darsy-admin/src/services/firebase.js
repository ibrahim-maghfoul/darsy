import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, orderBy, limit, startAfter, doc, getDoc, addDoc, deleteDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAD_H2pBx_vGOjHxJlW1Wy3DduUMcIP6t4",
    authDomain: "darsy-3f275.firebaseapp.com",
    projectId: "darsy-3f275",
    storageBucket: "darsy-3f275.firebasestorage.app",
    messagingSenderId: "650738111418",
    appId: "1:650738111418:web:d0052c1113b67d0e3a4383",
    measurementId: "G-BKFT77YF4D"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Cache for metadata
const metadataCache = {
    schools: null,
    levels: null,
    guidances: null,
    subjects: null
};

/**
 * Fetch all schools
 */
export async function fetchSchools() {
    if (metadataCache.schools) {
        return metadataCache.schools;
    }

    const schoolsRef = collection(db, 'schools');
    const snapshot = await getDocs(schoolsRef);
    const schools = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    metadataCache.schools = schools;
    return schools;
}

/**
 * Fetch levels for a specific school
 */
export async function fetchLevels(schoolId = null) {
    const levelsRef = collection(db, 'levels');
    let q = levelsRef;

    if (schoolId) {
        q = query(levelsRef, where('schoolId', '==', schoolId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Fetch guidances for a specific level
 */
export async function fetchGuidances(levelId = null) {
    const guidancesRef = collection(db, 'guidances');
    let q = guidancesRef;

    if (levelId) {
        q = query(guidancesRef, where('levelId', '==', levelId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Fetch subjects for a specific guidance
 */
export async function fetchSubjects(guidanceId = null) {
    const subjectsRef = collection(db, 'subjects');
    let q = subjectsRef;

    if (guidanceId) {
        q = query(subjectsRef, where('guidanceId', '==', guidanceId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Fetch lessons with pagination and filtering
 * @param {Object} filters - Filter options { subjectId, guidanceId, levelId, schoolId }
 * @param {number} pageSize - Number of lessons per page
 * @param {DocumentSnapshot} lastDoc - Last document from previous page
 */
export async function fetchLessons(filters = {}, pageSize = 20, lastDoc = null) {
    const lessonsRef = collection(db, 'lessons');
    let constraints = [orderBy('title'), limit(pageSize)];

    // Add filters
    if (filters.subjectId) {
        constraints.unshift(where('subjectId', '==', filters.subjectId));
    }

    // If we have a last document, start after it for pagination
    if (lastDoc) {
        constraints.push(startAfter(lastDoc));
    }

    const q = query(lessonsRef, ...constraints);
    const snapshot = await getDocs(q);

    return {
        lessons: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
    };
}

/**
 * Fetch a single lesson by ID
 */
export async function fetchLessonById(lessonId) {
    const lessonRef = doc(db, 'lessons', lessonId);
    const snapshot = await getDoc(lessonRef);

    if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
    }
    return null;
}

/**
 * Fetch exams with pagination and filtering
 */
export async function fetchExams(filters = {}, pageSize = 20, lastDoc = null) {
    const examsRef = collection(db, 'exams');
    let constraints = [orderBy('title'), limit(pageSize)];

    if (filters.subjectId) {
        constraints.unshift(where('subjectId', '==', filters.subjectId));
    }

    if (lastDoc) {
        constraints.push(startAfter(lastDoc));
    }

    const q = query(examsRef, ...constraints);
    const snapshot = await getDocs(q);

    return {
        exams: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
    };
}

/**
 * Fetch news sorted by creation date
 */
export async function fetchNews() {
    const newsRef = collection(db, 'news');
    const q = query(newsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Create a new news item
 */
export async function createNews(newsData) {
    const newsRef = collection(db, 'news');
    return await addDoc(newsRef, {
        ...newsData,
        createdAt: new Date().toISOString()
    });
}

/**
 * Delete a news item
 */
export async function deleteNews(newsId) {
    const newsRef = doc(db, 'news', newsId);
    return await deleteDoc(newsRef);
}

/**
 * Clear all educational collections in Firestore
 * @param {Function} onProgress - Optional callback for progress updates (name, status)
 */
export async function clearAllCollections(onProgress = null) {
    const { writeBatch } = await import("firebase/firestore");
    const collectionNames = ['schools', 'levels', 'guidances', 'subjects', 'lessons', 'exams', 'content_stats', 'news'];

    for (const name of collectionNames) {
        if (onProgress) onProgress(name, 'clearing');

        try {
            let deleted = 0;
            while (true) {
                const q = query(collection(db, name), limit(500));
                const snapshot = await getDocs(q);
                if (snapshot.empty) break;

                const batch = writeBatch(db);
                snapshot.docs.forEach((d) => {
                    batch.delete(d.ref);
                    deleted++;
                });
                await batch.commit();
            }
            if (onProgress) onProgress(name, 'complete');
        } catch (error) {
            console.error(`Error clearing ${name}:`, error);
            if (onProgress) onProgress(name, 'error');
            throw error;
        }
    }
    clearCache();
}

/**
 * Clear metadata cache (useful when data is updated)
 */
export function clearCache() {
    metadataCache.schools = null;
    metadataCache.levels = null;
    metadataCache.guidances = null;
    metadataCache.subjects = null;
}

export default app;

