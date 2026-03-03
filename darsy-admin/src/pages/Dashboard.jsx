import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { dualWriteService } from '../services/dualWrite';
import './Dashboard.css';

function Dashboard() {
    const [activeCollection, setActiveCollection] = useState('lessons');
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});
    const [stats, setStats] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    const collections = [
        { id: 'schools', label: 'Schools', icon: '🏫' },
        { id: 'levels', label: 'Levels', icon: '📚' },
        { id: 'guidances', label: 'Guidances', icon: '🎯' },
        { id: 'subjects', label: 'Subjects', icon: '📖' },
        { id: 'lessons', label: 'Lessons', icon: '📝' },
        { id: 'exams', label: 'Exams', icon: '📋' },
    ];

    // Fetch statistics
    const fetchStats = async () => {
        try {
            const statsData = {};
            for (const col of collections) {
                const snapshot = await getDocs(collection(db, col.id));
                statsData[col.id] = snapshot.size;
            }
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Fetch documents with pagination
    const fetchDocuments = async (reset = false) => {
        setLoading(true);
        try {
            let q = query(
                collection(db, activeCollection),
                orderBy('title'),
                limit(20)
            );

            if (!reset && lastDoc) {
                q = query(
                    collection(db, activeCollection),
                    orderBy('title'),
                    startAfter(lastDoc),
                    limit(20)
                );
            }

            const snapshot = await getDocs(q);
            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (reset) {
                setDocuments(docs);
            } else {
                setDocuments(prev => [...prev, ...docs]);
            }

            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === 20);
        } catch (error) {
            console.error('Error fetching documents:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle collection change
    useEffect(() => {
        setDocuments([]);
        setLastDoc(null);
        setHasMore(true);
        fetchDocuments(true);
    }, [activeCollection]);

    // Fetch stats on mount
    useEffect(() => {
        fetchStats();
    }, []);

    // Handle edit
    const handleEdit = (document) => {
        setSelectedDoc(document);
        setEditData(document);
        setEditMode(true);
    };

    // Handle save
    const handleSave = async () => {
        try {
            // Use dual-write service to update both Firebase and MongoDB
            await dualWriteService.update(activeCollection, selectedDoc.id, editData);

            // Update local state
            setDocuments(prev =>
                prev.map(d => (d.id === selectedDoc.id ? { ...d, ...editData } : d))
            );

            setEditMode(false);
            setSelectedDoc(null);
            alert('✅ Document updated successfully in both databases!');
        } catch (error) {
            console.error('Error updating document:', error);
            alert('❌ Error updating document: ' + error.message);
        }
    };

    // Handle delete
    const handleDelete = async (docId) => {
        if (!confirm('Are you sure you want to delete this document from both databases?')) return;

        try {
            // Use dual-write service to delete from both Firebase and MongoDB
            await dualWriteService.delete(activeCollection, docId);

            setDocuments(prev => prev.filter(d => d.id !== docId));
            fetchStats(); // Refresh stats
            alert('✅ Document deleted successfully from both databases!');
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('❌ Error deleting document: ' + error.message);
        }
    };

    // Filter documents based on search
    const filteredDocuments = documents.filter(doc =>
        JSON.stringify(doc).toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get resource count for lessons/exams
    const getResourceCount = (doc) => {
        if (activeCollection === 'lessons' || activeCollection === 'exams') {
            const pdfs = doc.coursesPdf?.length || doc.examPdfs?.length || 0;
            const videos = doc.videos?.length || 0;
            const exercises = doc.exercices?.length || 0;
            const resources = doc.resourses?.length || 0;
            return pdfs + videos + exercises + resources;
        }
        return 0;
    };

    return (
        <div className="dashboard">
            {/* Stats Overview */}
            <div className="stats-grid">
                {collections.map(col => (
                    <div
                        key={col.id}
                        className={`stat-card ${activeCollection === col.id ? 'active' : ''}`}
                        onClick={() => setActiveCollection(col.id)}
                    >
                        <div className="stat-icon">{col.icon}</div>
                        <div className="stat-info">
                            <h3>{stats[col.id] || 0}</h3>
                            <p>{col.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search Bar */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="🔍 Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Documents Table */}
            <div className="documents-section">
                <div className="section-header">
                    <h2>{collections.find(c => c.id === activeCollection)?.label || 'Documents'}</h2>
                    <button className="refresh-btn" onClick={() => fetchDocuments(true)}>
                        🔄 Refresh
                    </button>
                </div>

                <div className="documents-table-container">
                    <table className="documents-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                {activeCollection === 'levels' && <th>School ID</th>}
                                {activeCollection === 'guidances' && <th>Level ID</th>}
                                {activeCollection === 'subjects' && <th>Guidance ID</th>}
                                {(activeCollection === 'lessons' || activeCollection === 'exams') && <th>Subject ID</th>}
                                {(activeCollection === 'lessons' || activeCollection === 'exams') && <th>Resources</th>}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && documents.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="loading-cell">
                                        <div className="spinner"></div> Loading...
                                    </td>
                                </tr>
                            ) : filteredDocuments.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="empty-cell">
                                        No documents found
                                    </td>
                                </tr>
                            ) : (
                                filteredDocuments.map(doc => (
                                    <tr key={doc.id}>
                                        <td className="title-cell">{doc.title || 'Untitled'}</td>
                                        {activeCollection === 'levels' && <td className="id-cell">{doc.schoolId?.substring(0, 8)}...</td>}
                                        {activeCollection === 'guidances' && <td className="id-cell">{doc.levelId?.substring(0, 8)}...</td>}
                                        {activeCollection === 'subjects' && <td className="id-cell">{doc.guidanceId?.substring(0, 8)}...</td>}
                                        {(activeCollection === 'lessons' || activeCollection === 'exams') && (
                                            <td className="id-cell">{doc.subjectId?.substring(0, 8)}...</td>
                                        )}
                                        {(activeCollection === 'lessons' || activeCollection === 'exams') && (
                                            <td className="resources-cell">{getResourceCount(doc)} files</td>
                                        )}
                                        <td className="actions-cell">
                                            <button className="btn-view" onClick={() => setSelectedDoc(doc)}>👁️ View</button>
                                            <button className="btn-edit" onClick={() => handleEdit(doc)}>✏️ Edit</button>
                                            <button className="btn-delete" onClick={() => handleDelete(doc.id)}>🗑️ Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {hasMore && !loading && (
                    <button className="load-more-btn" onClick={() => fetchDocuments(false)}>
                        Load More
                    </button>
                )}

                {loading && documents.length > 0 && (
                    <div className="loading-more">Loading more...</div>
                )}
            </div>

            {/* View Modal */}
            {selectedDoc && !editMode && (
                <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📄 Document Details</h2>
                            <button className="close-btn" onClick={() => setSelectedDoc(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-item">
                                <strong>ID:</strong>
                                <code>{selectedDoc.id}</code>
                            </div>
                            <div className="detail-item">
                                <strong>Title:</strong>
                                <span>{selectedDoc.title}</span>
                            </div>

                            {/* Show all fields */}
                            {Object.entries(selectedDoc).map(([key, value]) => {
                                if (key === 'id' || key === 'title') return null;

                                // Handle array fields (resources)
                                if (Array.isArray(value)) {
                                    return (
                                        <div key={key} className="detail-item resources">
                                            <strong>{key}:</strong>
                                            <div className="resource-list">
                                                {value.map((item, idx) => (
                                                    <div key={idx} className="resource-item">
                                                        <span>{item.title || `Item ${idx + 1}`}</span>
                                                        {item.url && (
                                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="view-file-btn">
                                                                🔗 Open
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={key} className="detail-item">
                                        <strong>{key}:</strong>
                                        <span>{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editMode && selectedDoc && (
                <div className="modal-overlay" onClick={() => setEditMode(false)}>
                    <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>✏️ Edit Document</h2>
                            <button className="close-btn" onClick={() => setEditMode(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Title:</label>
                                <input
                                    type="text"
                                    value={editData.title || ''}
                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                />
                            </div>

                            {/* Show editable fields based on collection */}
                            {Object.entries(editData).map(([key, value]) => {
                                if (key === 'id' || key === 'title' || Array.isArray(value)) return null;

                                return (
                                    <div key={key} className="form-group">
                                        <label>{key}:</label>
                                        <input
                                            type="text"
                                            value={value || ''}
                                            onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setEditMode(false)}>Cancel</button>
                            <button className="btn-save" onClick={handleSave}>💾 Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
