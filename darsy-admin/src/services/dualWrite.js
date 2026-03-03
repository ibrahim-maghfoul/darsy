import axios from 'axios';
import { db } from './firebase';
import { doc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';

// Configure axios base URL - changed to base /api instead of /api/data
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Dual-write service that writes to both Firebase and MongoDB
 */
class DualWriteService {
    /**
     * Create a new document in both Firebase and MongoDB
     * @param {string} collectionName - Collection name (schools, levels, guidances, subjects, lessons, exams)
     * @param {object} data - Document data
     * @returns {Promise<{firebaseId: string, mongoId: string}>}
     */
    async create(collectionName, data) {
        try {
            // 1. First, add to Firebase (to get Firebase ID)
            const firebaseRef = await addDoc(collection(db, collectionName), data);
            const firebaseId = firebaseRef.id;

            // 2. Then sync to MongoDB with the same ID
            const mongoEndpoint = this.getMongoEndpoint(collectionName);
            const mongoPayload = {
                _id: firebaseId,
                ...this.transformForMongo(collectionName, data)
            };

            try {
                // Endpoint now includes the full path relative to /api (e.g., data/subjects or news)
                await axios.post(`${API_URL}/${mongoEndpoint}`, mongoPayload);
            } catch (mongoError) {
                console.error('MongoDB sync failed, but Firebase succeeded:', mongoError);
                // Note: Firebase doc already created, MongoDB failed
                // You may want to implement compensation logic here
            }

            return { firebaseId, mongoId: firebaseId };
        } catch (error) {
            console.error('Error in dual create:', error);
            throw error;
        }
    }

    /**
     * Update a document in both Firebase and MongoDB
     * @param {string} collectionName - Collection name
     * @param {string} docId - Document ID
     * @param {object} data - Updated data
     */
    async update(collectionName, docId, data) {
        const errors = [];

        // 1. Update Firebase
        try {
            const firebaseRef = doc(db, collectionName, docId);
            await updateDoc(firebaseRef, data);
        } catch (firebaseError) {
            console.error('Firebase update failed:', firebaseError);
            errors.push({ database: 'Firebase', error: firebaseError });
        }

        // 2. Update MongoDB
        try {
            const mongoEndpoint = this.getMongoEndpoint(collectionName);
            const mongoPayload = this.transformForMongo(collectionName, data);

            // Assuming there's an update endpoint like PUT /subjects/:id
            await axios.put(`${API_URL}/${mongoEndpoint}/${docId}`, mongoPayload);
        } catch (mongoError) {
            console.error('MongoDB update failed:', mongoError);
            errors.push({ database: 'MongoDB', error: mongoError });
        }

        if (errors.length > 0) {
            throw new Error(`Update failed for: ${errors.map(e => e.database).join(', ')}`);
        }
    }

    /**
     * Delete a document from both Firebase and MongoDB
     * @param {string} collectionName - Collection name
     * @param {string} docId - Document ID
     */
    async delete(collectionName, docId) {
        const errors = [];

        // 1. Delete from Firebase
        try {
            await deleteDoc(doc(db, collectionName, docId));
        } catch (firebaseError) {
            console.error('Firebase delete failed:', firebaseError);
            errors.push({ database: 'Firebase', error: firebaseError });
        }

        // 2. Delete from MongoDB
        try {
            const mongoEndpoint = this.getMongoEndpoint(collectionName);
            await axios.delete(`${API_URL}/${mongoEndpoint}/${docId}`);
        } catch (mongoError) {
            console.error('MongoDB delete failed:', mongoError);
            errors.push({ database: 'MongoDB', error: mongoError });
        }

        if (errors.length > 0) {
            throw new Error(`Delete failed for: ${errors.map(e => e.database).join(', ')}`);
        }
    }

    /**
     * Get MongoDB API endpoint for collection
     */
    getMongoEndpoint(collectionName) {
        // Map collection names to API endpoints relative to /api
        const endpointMap = {
            'schools': 'data/schools',
            'levels': 'data/levels',
            'guidances': 'data/guidances',
            'subjects': 'data/subjects',
            'lessons': 'data/lessons',
            'exams': 'data/exams',
            'guidance_stats': 'data/guidance-stats',
            'news': 'news' // News is mounted at /api/news, not /api/data/news
        };
        return endpointMap[collectionName] || `data/${collectionName}`;
    }

    /**
     * Transform Firebase data to MongoDB schema
     */
    transformForMongo(collectionName, data) {
        // Remove Firebase-specific fields
        const { id, ...cleanData } = data;

        // Collection-specific transformations
        switch (collectionName) {
            case 'schools':
                return {
                    title: cleanData.name || cleanData.title,
                    image: cleanData.image,
                    category: cleanData.category || 'Secondary'
                };

            case 'levels':
                return {
                    title: cleanData.name || cleanData.title,
                    schoolId: cleanData.schoolId,
                    image: cleanData.image
                };

            case 'guidances':
                return {
                    title: cleanData.title,
                    levelId: cleanData.levelId,
                    image: cleanData.image
                };

            case 'subjects':
                return {
                    title: cleanData.title,
                    guidanceId: cleanData.guidanceId,
                    imageUrl: cleanData.image || cleanData.imageUrl
                };

            case 'lessons':
                return {
                    title: cleanData.title,
                    subjectId: cleanData.subjectId,
                    type: cleanData.type || 'lesson',
                    order: cleanData.order || 0,
                    coursesPdf: cleanData.coursesPdf || [],
                    videos: cleanData.videos || [],
                    exercices: cleanData.exercices || [],
                    exams: cleanData.exams || [],
                    resourses: cleanData.resourses || []
                };

            case 'news':
                return {
                    title: cleanData.title,
                    description: cleanData.description,
                    content: cleanData.description, // Use description as content fallback since Admin UI doesn't have content field yet
                    imageUrl: cleanData.imageUrl,
                    category: cleanData.category,
                    links: cleanData.links || [],
                    date: cleanData.createdAt ? new Date(cleanData.createdAt) : new Date()
                };

            default:
                return cleanData;
        }
    }
}

export const dualWriteService = new DualWriteService();
