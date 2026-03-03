import { useState } from 'react';
import { db, clearAllCollections } from '../services/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import './FirebaseUpload.css';

function FirebaseUpload() {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState({
        schools: { total: 0, uploaded: 0, status: 'pending' },
        levels: { total: 0, uploaded: 0, status: 'pending' },
        guidances: { total: 0, uploaded: 0, status: 'pending' },
        subjects: { total: 0, uploaded: 0, status: 'pending' },
        lessons: { total: 0, uploaded: 0, status: 'pending' },
        exams: { total: 0, uploaded: 0, status: 'pending' },
        content_stats: { total: 0, uploaded: 0, status: 'pending' },
        news: { total: 0, uploaded: 0, status: 'pending' },
    });
    const [errors, setErrors] = useState([]);

    const loadJsonFile = async (filename) => {
        try {
            const response = await fetch(`/firebase_data/metadata/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            throw error;
        }
    };

    const uploadCollection = async (collectionName, documents) => {
        const BATCH_SIZE = 500;
        const total = documents.length;

        setProgress(prev => ({
            ...prev,
            [collectionName]: { total, uploaded: 0, status: 'uploading' }
        }));

        try {
            for (let i = 0; i < total; i += BATCH_SIZE) {
                const batch = writeBatch(db);
                const chunk = documents.slice(i, Math.min(i + BATCH_SIZE, total));

                chunk.forEach(document => {
                    if (!document.id) return;
                    const docRef = doc(db, collectionName, document.id);
                    batch.set(docRef, document);
                });

                await batch.commit();
                const uploaded = Math.min(i + BATCH_SIZE, total);
                setProgress(prev => ({
                    ...prev,
                    [collectionName]: { total, uploaded, status: 'uploading' }
                }));
            }

            setProgress(prev => ({
                ...prev,
                [collectionName]: { total, uploaded: total, status: 'complete' }
            }));
        } catch (error) {
            setProgress(prev => ({
                ...prev,
                [collectionName]: { ...prev[collectionName], status: 'error' }
            }));
            throw error;
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('⚠️ WARNING: This will PERMANENTLY DELETE all educational data from Firebase. Are you sure?')) {
            return;
        }

        setUploading(true);
        setErrors([]);

        try {
            await clearAllCollections((name, status) => {
                setProgress(prev => {
                    const current = prev[name] || { total: 0, uploaded: 0 };
                    return {
                        ...prev,
                        [name]: {
                            ...current,
                            status: status === 'clearing' ? 'uploading' : 'complete'
                        }
                    };
                });
            });
        } catch (error) {
            setErrors(prev => [...prev, `Global Clean: ${error.message}`]);
        } finally {
            setUploading(false);
        }
    };

    const handleUpload = async () => {
        setUploading(true);
        setErrors([]);

        const collections = [
            { name: 'schools', file: 'school.json' },
            { name: 'levels', file: 'levels.json' },
            { name: 'guidances', file: 'guidances.json' },
            { name: 'subjects', file: 'subjects.json' },
            { name: 'lessons', file: 'lessons.json' },
            { name: 'exams', file: 'exams.json' },
            { name: 'content_stats', file: 'content_stats.json' },
            { name: 'news', file: 'news.json' },
        ];

        try {
            for (const { name, file } of collections) {
                try {
                    const documents = await loadJsonFile(file);
                    if (documents && documents.length > 0) {
                        await uploadCollection(name, documents);
                    } else {
                        setProgress(prev => ({
                            ...prev,
                            [name]: { total: 0, uploaded: 0, status: 'skipped' }
                        }));
                    }
                } catch (error) {
                    setErrors(prev => [...prev, `${name}: ${error.message}`]);
                    setProgress(prev => ({
                        ...prev,
                        [name]: { ...prev[name], status: 'error' }
                    }));
                }
            }
        } finally {
            setUploading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'uploading': return '🔄';
            case 'complete': return '✅';
            case 'error': return '❌';
            case 'skipped': return '⊝';
            default: return '⏳';
        }
    };

    const totalDocuments = Object.values(progress).reduce((sum, item) => sum + item.total, 0);
    const uploadedDocuments = Object.values(progress).reduce((sum, item) => sum + item.uploaded, 0);

    return (
        <div className="firebase-upload">
            <h1>Firebase Data Upload</h1>
            <p className="description">
                Upload all organized educational data to Firebase Firestore.
                This will create collections for schools, levels, guidances, subjects, lessons, and exams.
            </p>

            <div className="upload-section">
                <button
                    className="upload-btn"
                    onClick={handleUpload}
                    disabled={uploading}
                >
                    {uploading ? '⏳ Processing...' : '🚀 Start Upload'}
                </button>

                <button
                    className="delete-all-btn"
                    onClick={handleDeleteAll}
                    disabled={uploading}
                >
                    {uploading ? '⏳ Processing...' : '🗑️ Clear All Data'}
                </button>

                {uploading && totalDocuments > 0 && (
                    <div className="overall-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${(uploadedDocuments / totalDocuments) * 100}%` }}
                            />
                        </div>
                        <div className="progress-text">
                            {uploadedDocuments} / {totalDocuments} documents
                        </div>
                    </div>
                )}
            </div>

            <div className="collections-grid">
                {Object.entries(progress).map(([name, { total, uploaded, status }]) => (
                    <div key={name} className={`collection-card ${status}`}>
                        <div className="collection-header">
                            <span className="status-icon">{getStatusIcon(status)}</span>
                            <h3>{name}</h3>
                        </div>
                        <div className="collection-stats">
                            {status === 'uploading' || status === 'complete' ? (
                                <div className="progress-info">
                                    <div className="mini-progress-bar">
                                        <div
                                            className="mini-progress-fill"
                                            style={{ width: total > 0 ? `${(uploaded / total) * 100}%` : '0%' }}
                                        />
                                    </div>
                                    <span className="count">{uploaded} / {total}</span>
                                </div>
                            ) : (
                                <span className="status-text">
                                    {status === 'pending' && 'Waiting...'}
                                    {status === 'error' && 'Upload failed'}
                                    {status === 'skipped' && 'No data'}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {errors.length > 0 && (
                <div className="errors-section">
                    <h3>⚠️ Errors</h3>
                    <ul>
                        {errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {!uploading && Object.values(progress).every(p => p.status === 'complete' || p.status === 'skipped') && uploadedDocuments > 0 && (
                <div className="success-message">
                    <h3>✅ Upload Complete!</h3>
                    <p>Successfully uploaded {uploadedDocuments} documents to Firebase.</p>
                </div>
            )}
        </div>
    );
}

export default FirebaseUpload;
