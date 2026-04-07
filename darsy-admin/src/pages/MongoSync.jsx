import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './MongoSync.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const COLLECTIONS = [
    { id: 'schools', name: 'Schools', endpoint: 'data/schools', file: 'school.json' },
    { id: 'levels', name: 'Levels', endpoint: 'data/levels', file: 'levels.json' },
    { id: 'guidances', name: 'Guidances', endpoint: 'data/guidances', file: 'guidances.json' },
    { id: 'subjects', name: 'Subjects', endpoint: 'data/subjects', file: 'subjects.json' },
    { id: 'lessons', name: 'Lessons', endpoint: 'data/lessons', file: 'lessons.json' },
    { id: 'guidance_stats', name: 'Guidance Stats', endpoint: 'data/guidance-stats', file: null },
];

const MongoSync = () => {
    const { token, isAuthenticated } = useAuth();
    const [syncing, setSyncing] = useState(false);
    const [selectedCollections, setSelectedCollections] = useState(
        COLLECTIONS.reduce((acc, c) => ({ ...acc, [c.id]: true }), {})
    );
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState({});
    const headers = { Authorization: `Bearer ${token}` };

    const addLog = (message, type = 'info') => {
        setLogs(prev => [...prev, { message, type, time: new Date().toLocaleTimeString() }]);
    };

    const toggleCollection = (id) => {
        setSelectedCollections(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const selectAll = (val) => {
        setSelectedCollections(COLLECTIONS.reduce((acc, c) => ({ ...acc, [c.id]: val }), {}));
    };

    const loadJsonFile = async (filename) => {
        const response = await fetch(`/firebase_data/metadata/${filename}`);
        if (!response.ok) throw new Error(`Failed to load ${filename}`);
        return response.json();
    };

    const pushCollection = async (collectionId, endpoint, transformFn) => {
        const col = COLLECTIONS.find(c => c.id === collectionId);
        if (!col?.file) {
            addLog(`Skipping ${collectionId} (no JSON file).`, 'warning');
            return;
        }

        addLog(`Loading ${col.name} from JSON...`);
        let data;
        try {
            data = await loadJsonFile(col.file);
        } catch (err) {
            addLog(`Could not load ${col.file}: ${err.message}`, 'error');
            return;
        }

        if (!data || data.length === 0) {
            addLog(`No data in ${col.file}. Skipping.`, 'warning');
            return;
        }

        addLog(`Found ${data.length} items. Pushing to MongoDB...`);
        let ok = 0, fail = 0;
        setProgress(prev => ({ ...prev, [collectionId]: { total: data.length, current: 0 } }));

        for (const item of data) {
            try {
                const payload = transformFn ? transformFn(item) : item;
                await axios.post(`${API_URL}/${endpoint}`, payload, { headers });
                ok++;
            } catch (error) {
                fail++;
                if (ok + fail <= 3) addLog(`Error: ${error.response?.data?.error || error.message}`, 'error');
            }
            setProgress(prev => ({ ...prev, [collectionId]: { total: data.length, current: ok + fail } }));
        }

        addLog(`${col.name}: ${ok} succeeded, ${fail} failed.`, ok > 0 ? 'success' : 'error');
    };

    const handleSync = async () => {
        if (!isAuthenticated) { addLog('Please log in first.', 'error'); return; }
        setSyncing(true);
        setLogs([]);
        setProgress({});

        try {
            if (selectedCollections.schools) {
                await pushCollection('schools', 'data/schools', d => ({
                    _id: d.id, title: d.name || d.title, image: d.image, category: d.category || 'Secondary'
                }));
            }
            if (selectedCollections.levels) {
                await pushCollection('levels', 'data/levels', d => ({
                    _id: d.id, title: d.name || d.title, schoolId: d.schoolId, image: d.image
                }));
            }
            if (selectedCollections.guidances) {
                await pushCollection('guidances', 'data/guidances', d => ({
                    _id: d.id, title: d.title, levelId: d.levelId, image: d.image
                }));
            }
            if (selectedCollections.subjects) {
                await pushCollection('subjects', 'data/subjects', d => ({
                    _id: d.id, title: d.title, guidanceId: d.guidanceId, imageUrl: d.image
                }));
            }
            if (selectedCollections.lessons) {
                await pushCollection('lessons', 'data/lessons', d => ({
                    _id: d.id, title: d.title, subjectId: d.subjectId, type: d.type || 'lesson',
                    order: d.order || 0, coursesPdf: d.coursesPdf || [], videos: d.videos || [],
                    exercices: d.exercices || [], exams: d.exams || [], resourses: d.resourses || []
                }));
            }
            if (selectedCollections.guidance_stats) {
                addLog('Triggering stats recalculation...');
                try {
                    await axios.post(`${API_URL}/data/stats/recalculate`, {}, { headers });
                    addLog('Stats recalculated successfully!', 'success');
                } catch (err) {
                    addLog(`Stats recalc failed: ${err.message}`, 'error');
                }
            }
            addLog('Synchronization complete!', 'success');
        } catch (error) {
            addLog(`Critical Error: ${error.message}`, 'error');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="mongo-sync-container">
            <div className="sync-header">
                <h2>MongoDB Import</h2>
                <p>Push educational content from JSON files to MongoDB.</p>
            </div>

            <div className="selection-container">
                <h3>Select Collections to Import</h3>
                <div className="collection-grid">
                    {COLLECTIONS.map(c => (
                        <label key={c.id} className="collection-item">
                            <input type="checkbox" checked={selectedCollections[c.id]} onChange={() => toggleCollection(c.id)} disabled={syncing} />
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
                    {syncing ? 'Importing...' : 'Push to MongoDB'}
                </button>
                {!isAuthenticated && <p className="auth-warning">Authentication required. Please log in.</p>}
            </div>

            <div className="sync-progress-grid">
                {Object.entries(progress).map(([name, stats]) => (
                    <div key={name} className="progress-card">
                        <h4>{name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' ')}</h4>
                        <div className="progress-bar-container">
                            <div className="progress-fill" style={{ width: `${(stats.current / stats.total) * 100}%` }} />
                        </div>
                        <span>{stats.current} / {stats.total}</span>
                    </div>
                ))}
            </div>

            <div className="logs-console">
                <h3>Import Logs</h3>
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
