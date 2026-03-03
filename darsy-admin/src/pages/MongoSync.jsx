import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import axios from 'axios';
import './MongoSync.css';

// Configure axios base URL - update this to your actual backend URL
const API_URL = 'http://localhost:5000/api/data';

const COLLECTIONS = [
    { id: 'schools', name: 'Schools', endpoint: 'schools' },
    { id: 'levels', name: 'Levels', endpoint: 'levels' },
    { id: 'guidances', name: 'Guidances', endpoint: 'guidances' },
    { id: 'subjects', name: 'Subjects', endpoint: 'subjects' },
    { id: 'lessons', name: 'Lessons', endpoint: 'lessons' },
    { id: 'guidance_stats', name: 'Guidance Stats', endpoint: 'guidance-stats' },
];

const MongoSync = () => {
    const { isAuthenticated } = useAuth();
    const [syncing, setSyncing] = useState(false);
    const [selectedCollections, setSelectedCollections] = useState(
        COLLECTIONS.reduce((acc, c) => ({ ...acc, [c.id]: true }), {})
    );
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState({});

    const addLog = (message, type = 'info') => {
        setLogs(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
    };

    const toggleCollection = (id) => {
        setSelectedCollections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const selectAll = (val) => {
        setSelectedCollections(
            COLLECTIONS.reduce((acc, c) => ({ ...acc, [c.id]: val }), {})
        );
    };

    const fetchFirebaseCollection = async (collectionName) => {
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            addLog(`Error fetching ${collectionName} from Firebase: ${error.message}`, 'error');
            return [];
        }
    };

    const syncCollection = async (collectionName, endpoint, transformFn = null) => {
        addLog(`Starting sync for ${collectionName}...`);

        // Debug: Check if Firebase has data
        const data = await fetchFirebaseCollection(collectionName);
        console.log(`[Sync Debug] Fetched ${data.length} items from Firebase collection: ${collectionName}`);

        if (data.length === 0) {
            addLog(`⚠️ No data found in Firebase collection: ${collectionName}. Skipping.`, 'warning');
            return;
        }

        addLog(`Found ${data.length} items in ${collectionName}. Pushing to MongoDB...`);
        let successCount = 0;
        let failCount = 0;

        setProgress(prev => ({ ...prev, [collectionName]: { total: data.length, current: 0 } }));

        for (const item of data) {
            try {
                // Transform data if needed for MongoDB schema
                const payload = transformFn ? transformFn(item) : item;

                // Debug: Log payload for first item
                if (successCount === 0 && failCount === 0) {
                    console.log(`[Sync Debug] Sending payload to ${endpoint}:`, payload);
                }

                await axios.post(`${API_URL}/${endpoint}`, payload);
                successCount++;
            } catch (error) {
                console.error(`Failed to push item ${item.id || 'unknown'} to ${endpoint}:`, error.response?.data || error.message);
                addLog(`Error pushing item: ${error.response?.data?.error || error.message}`, 'error');
                failCount++;
            }

            setProgress(prev => ({
                ...prev,
                [collectionName]: { total: data.length, current: successCount + failCount }
            }));
        }

        addLog(`Completed ${collectionName}: ${successCount} succeeded, ${failCount} failed.`, successCount > 0 ? 'success' : 'error');
    };

    const handleSync = async () => {
        if (!isAuthenticated) {
            addLog("Error: You must be logged in as admin to sync data.", "error");
            return;
        }

        const collectionsToSync = COLLECTIONS.filter(c => selectedCollections[c.id]);
        if (collectionsToSync.length === 0) {
            addLog("Error: Please select at least one collection to sync.", "warning");
            return;
        }

        setSyncing(true);
        setLogs([]);
        setProgress({});

        try {
            // 1. Sync Schools
            if (selectedCollections.schools) {
                await syncCollection('schools', 'schools', (data) => ({
                    _id: data.id, // Use Firestore ID as MongoDB _id
                    title: data.name || data.title,
                    image: data.image,
                    category: data.category || 'Secondary' // Changed from level to category to match schema
                }));
            }

            // 2. Sync Levels
            if (selectedCollections.levels) {
                await syncCollection('levels', 'levels', (data) => ({
                    _id: data.id,
                    title: data.name || data.title,
                    schoolId: data.schoolId,
                    image: data.image
                }));
            }

            // 3. Sync Guidances
            if (selectedCollections.guidances) {
                await syncCollection('guidances', 'guidances', (data) => ({
                    _id: data.id,
                    title: data.title,
                    levelId: data.levelId,
                    image: data.image
                }));
            }

            // 4. Sync Subjects
            if (selectedCollections.subjects) {
                await syncCollection('subjects', 'subjects', (data) => ({
                    _id: data.id,
                    title: data.title,
                    guidanceId: data.guidanceId,
                    imageUrl: data.image
                }));
            }

            // 5. Sync Lessons
            if (selectedCollections.lessons) {
                await syncCollection('lessons', 'lessons', (data) => ({
                    _id: data.id,
                    title: data.title,
                    subjectId: data.subjectId,
                    type: data.type || 'lesson',
                    order: data.order || 0,
                    coursesPdf: data.coursesPdf || [],
                    videos: data.videos || [],
                    exercices: data.exercices || [],
                    exams: data.exams || [],
                    resourses: data.resourses || []
                }));
            }

            // 6. Sync Guidance Stats
            if (selectedCollections.guidance_stats) {
                addLog("Checking for guidance stats to sync...");
                try {
                    await syncCollection('guidance_stats', 'guidance-stats', (data) => ({
                        guidanceId: data.guidanceId || data.id,
                        totalPdfs: data.totalPdfs || 0,
                        totalVideos: data.totalVideos || 0,
                        totalExercises: data.totalExercises || 0,
                        totalExams: data.totalExams || 0,
                        totalLessons: data.totalLessons || 0,
                        totalSubjects: data.totalSubjects || 0,
                        totalResources: data.totalResources || 0,
                        totalItems: data.totalItems || 0
                    }));
                } catch (err) {
                    addLog("Note: guidance_stats collection might be missing or empty.", "warning");
                }
            }

            addLog("🎉 Selective synchronization complete!", "success");

        } catch (error) {
            addLog(`Critical Sync Error: ${error.message}`, 'error');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="mongo-sync-container">
            <div className="sync-header">
                <h2>MongoDB Synchronization</h2>
                <p>Push educational content from Firebase/JSON to the new MongoDB backend.</p>
            </div>

            <div className="selection-container">
                <h3>Select Collections to Sync</h3>
                <div className="collection-grid">
                    {COLLECTIONS.map(c => (
                        <label key={c.id} className="collection-item">
                            <input
                                type="checkbox"
                                checked={selectedCollections[c.id]}
                                onChange={() => toggleCollection(c.id)}
                                disabled={syncing}
                            />
                            <span>{c.name}</span>
                        </label>
                    ))}
                </div>
                <div className="selection-actions">
                    <button className="text-button" onClick={() => selectAll(true)} disabled={syncing}>Select All</button>
                    <button className="text-button" onClick={() => selectAll(false)} disabled={syncing}>Deselect All</button>
                </div>
            </div>

            <div className="sync-controls">
                <button
                    className={`sync-button ${syncing || Object.values(selectedCollections).every(v => !v) ? 'disabled' : ''}`}
                    onClick={handleSync}
                    disabled={syncing || Object.values(selectedCollections).every(v => !v)}
                >
                    {syncing ? 'Syncing Selected...' : 'Push Selected to MongoDB'}
                </button>

                {!isAuthenticated && <p className="auth-warning">⚠️ Authentication required. Please log in.</p>}
            </div>

            <div className="sync-progress-grid">
                {Object.entries(progress).map(([name, stats]) => (
                    <div key={name} className="progress-card">
                        <h4>{name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')}</h4>
                        <div className="progress-bar-container">
                            <div
                                className="progress-fill"
                                style={{ width: `${(stats.current / stats.total) * 100}%` }}
                            ></div>
                        </div>
                        <span>{stats.current} / {stats.total}</span>
                    </div>
                ))}
            </div>

            <div className="logs-console">
                <h3>Sync Logs</h3>
                <div className="logs-output">
                    {logs.length === 0 ? <span className="empty-logs">Logs will appear here...</span> :
                        logs.map((log, idx) => (
                            <div key={idx} className={`log-entry ${log.type}`}>
                                <span className="log-time">[{log.time}]</span>
                                <span className="log-message">{log.message}</span>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
};

export default MongoSync;
