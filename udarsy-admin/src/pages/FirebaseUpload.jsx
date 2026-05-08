import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './FirebaseUpload.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function FirebaseUpload() {
    const { token } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState({
        schools: { total: 0, uploaded: 0, status: 'pending' },
        levels: { total: 0, uploaded: 0, status: 'pending' },
        guidances: { total: 0, uploaded: 0, status: 'pending' },
        subjects: { total: 0, uploaded: 0, status: 'pending' },
        lessons: { total: 0, uploaded: 0, status: 'pending' },
        exams: { total: 0, uploaded: 0, status: 'pending' },
    });
    const [errors, setErrors] = useState([]);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const loadJsonFile = async (filename) => {
        const response = await fetch(`/firebase_data/metadata/${filename}`);
        if (!response.ok) throw new Error(`Failed to load ${filename}`);
        return response.json();
    };

    const uploadCollection = async (collectionName, endpoint, documents, transformFn) => {
        const total = documents.length;
        setProgress(prev => ({ ...prev, [collectionName]: { total, uploaded: 0, status: 'uploading' } }));

        let uploaded = 0;
        for (const doc of documents) {
            try {
                const payload = transformFn ? transformFn(doc) : doc;
                await fetch(`${API}/data/${endpoint}`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload),
                });
                uploaded++;
            } catch (err) {
                setErrors(prev => [...prev, `${collectionName}: ${err.message}`]);
            }
            setProgress(prev => ({ ...prev, [collectionName]: { total, uploaded, status: 'uploading' } }));
        }

        setProgress(prev => ({ ...prev, [collectionName]: { total, uploaded, status: 'complete' } }));
    };

    const handleUpload = async () => {
        setUploading(true);
        setErrors([]);

        const collections = [
            { name: 'schools', file: 'school.json', endpoint: 'schools', transform: d => ({ _id: d.id, title: d.name || d.title, image: d.image, category: d.category || 'Secondary' }) },
            { name: 'levels', file: 'levels.json', endpoint: 'levels', transform: d => ({ _id: d.id, title: d.name || d.title, schoolId: d.schoolId, image: d.image }) },
            { name: 'guidances', file: 'guidances.json', endpoint: 'guidances', transform: d => ({ _id: d.id, title: d.title, levelId: d.levelId, image: d.image }) },
            { name: 'subjects', file: 'subjects.json', endpoint: 'subjects', transform: d => ({ _id: d.id, title: d.title, guidanceId: d.guidanceId, imageUrl: d.image || d.imageUrl }) },
            { name: 'lessons', file: 'lessons.json', endpoint: 'lessons', transform: d => ({ _id: d.id, title: d.title, subjectId: d.subjectId, type: d.type || 'lesson', order: d.order || 0, coursesPdf: d.coursesPdf || [], videos: d.videos || [], exercices: d.exercices || [], exams: d.exams || [], resourses: d.resourses || [] }) },
            { name: 'exams', file: 'exams.json', endpoint: 'lessons', transform: d => ({ _id: d.id, title: d.title, subjectId: d.subjectId, type: 'exam', coursesPdf: d.examPdfs || d.coursesPdf || [], videos: d.videos || [], exercices: d.exercices || [], resourses: d.resourses || [] }) },
        ];

        for (const { name, file, endpoint, transform } of collections) {
            try {
                const documents = await loadJsonFile(file);
                if (documents && documents.length > 0) {
                    await uploadCollection(name, endpoint, documents, transform);
                } else {
                    setProgress(prev => ({ ...prev, [name]: { total: 0, uploaded: 0, status: 'skipped' } }));
                }
            } catch (error) {
                setErrors(prev => [...prev, `${name}: ${error.message}`]);
                setProgress(prev => ({ ...prev, [name]: { ...prev[name], status: 'error' } }));
            }
        }

        // Recalculate stats
        try {
            await fetch(`${API}/data/stats/recalculate`, { method: 'POST', headers });
        } catch (e) { console.error('Stats recalc failed:', e); }

        setUploading(false);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return '...';
            case 'uploading': return '...';
            case 'complete': return 'Done';
            case 'error': return 'Error';
            case 'skipped': return 'Skip';
            default: return '...';
        }
    };

    const totalDocuments = Object.values(progress).reduce((sum, item) => sum + item.total, 0);
    const uploadedDocuments = Object.values(progress).reduce((sum, item) => sum + item.uploaded, 0);

    return (
        <div className="firebase-upload">
            <h1>Batch Data Upload</h1>
            <p className="description">
                Upload organized educational data (JSON) to MongoDB.
                This will create records for schools, levels, guidances, subjects, lessons, and exams.
            </p>

            <div className="upload-section">
                <button className="upload-btn" onClick={handleUpload} disabled={uploading}>
                    {uploading ? 'Processing...' : 'Start Upload to MongoDB'}
                </button>

                {uploading && totalDocuments > 0 && (
                    <div className="overall-progress">
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${(uploadedDocuments / totalDocuments) * 100}%` }} />
                        </div>
                        <div className="progress-text">{uploadedDocuments} / {totalDocuments} documents</div>
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
                                        <div className="mini-progress-fill" style={{ width: total > 0 ? `${(uploaded / total) * 100}%` : '0%' }} />
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
                    <h3>Errors</h3>
                    <ul>{errors.map((error, idx) => <li key={idx}>{error}</li>)}</ul>
                </div>
            )}

            {!uploading && Object.values(progress).every(p => p.status === 'complete' || p.status === 'skipped') && uploadedDocuments > 0 && (
                <div className="success-message">
                    <h3>Upload Complete!</h3>
                    <p>Successfully uploaded {uploadedDocuments} documents to MongoDB.</p>
                </div>
            )}
        </div>
    );
}

export default FirebaseUpload;
