import { useState, useEffect } from 'react';
import { Video, CheckCircle, XCircle, Clock, Eye, Loader2, ExternalLink, Edit3, Trash2, X, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS = {
    pending:  { cls: 'badge-amber', icon: Clock },
    approved: { cls: 'badge-green', icon: CheckCircle },
    rejected: { cls: 'badge-red',   icon: XCircle },
};

function InstructorCourses() {
    const { token } = useAuth();
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const [viewCourse, setViewCourse] = useState(null);
    const [reviewNote, setReviewNote] = useState('');
    const [processing, setProcessing] = useState(false);

    const [editCourse, setEditCourse] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/instructor/admin/courses`, { headers });
            const data = await res.json();
            setCourses(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching courses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (courseId, status) => {
        setProcessing(true);
        try {
            await fetch(`${API}/instructor/admin/courses/${courseId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ status, reviewNotes: reviewNote }),
            });
            setCourses(prev => prev.map(c => c._id === courseId ? { ...c, status } : c));
            setViewCourse(null);
            setReviewNote('');
        } catch (err) {
            console.error('Review error:', err);
        } finally {
            setProcessing(false);
        }
    };

    const openEdit = (e, course) => {
        e.stopPropagation();
        setEditTitle(course.title);
        setEditCourse(course);
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API}/instructor/admin/courses/${editCourse._id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ title: editTitle }),
            });
            if (res.ok) {
                const updated = await res.json();
                setCourses(prev => prev.map(c => c._id === updated._id ? { ...c, title: updated.title } : c));
                setEditCourse(null);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Delete this course permanently?')) return;
        const res = await fetch(`${API}/instructor/admin/courses/${id}`, { method: 'DELETE', headers });
        if (res.ok) setCourses(prev => prev.filter(c => c._id !== id));
    };

    const filtered = filter === 'all' ? courses : courses.filter(c => c.status === filter);

    return (
        <div className="animate-fade">
            <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark)' }}>Instructor Courses</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Review, edit, and manage courses uploaded by instructors
                </p>
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {['all', 'pending', 'approved', 'rejected'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className="btn btn-sm"
                        style={{
                            background: filter === f ? 'var(--green)' : 'var(--surface)',
                            color: filter === f ? 'white' : 'var(--text-secondary)',
                            border: `1px solid ${filter === f ? 'var(--green)' : 'var(--border)'}`,
                            textTransform: 'capitalize',
                        }}
                    >
                        {f} ({f === 'all' ? courses.length : courses.filter(c => c.status === f).length})
                    </button>
                ))}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Loader2 size={24} className="spin" style={{ color: 'var(--green)' }} />
                        <div style={{ marginTop: 8, fontSize: '0.85rem' }}>Loading courses...</div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        No courses found
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Instructor</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((course) => {
                                const st = STATUS[course.status] || STATUS.pending;
                                const StIcon = st.icon;
                                return (
                                    <tr key={course._id}>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{course.title || 'Untitled'}</div>
                                            {course.description && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {course.description}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.82rem' }}>
                                            <div style={{ fontWeight: 600 }}>{course.instructorId?.displayName || '—'}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{course.instructorId?.email || ''}</div>
                                        </td>
                                        <td>
                                            {course.videoUrl && <span className="badge badge-blue"><Video size={11} /> Video</span>}
                                            {course.pdfUrl && <span className="badge badge-red" style={{ marginLeft: 4 }}>PDF</span>}
                                            {!course.videoUrl && !course.pdfUrl && <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>—</span>}
                                        </td>
                                        <td>
                                            <span className={`badge ${st.cls}`}><StIcon size={11} /> {course.status || 'pending'}</span>
                                        </td>
                                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            {course.createdAt ? new Date(course.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn-icon-only" title="View / Review" onClick={() => { setViewCourse(course); setReviewNote(''); }}>
                                                    <Eye size={14} />
                                                </button>
                                                <button className="btn-icon-only" title="Edit title" onClick={(e) => openEdit(e, course)}>
                                                    <Edit3 size={14} />
                                                </button>
                                                <button className="btn-icon-only" title="Delete" style={{ color: '#dc2626' }} onClick={(e) => handleDelete(e, course._id)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* View / Review Modal */}
            {viewCourse && (
                <div className="modal-overlay" onClick={() => setViewCourse(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Course Review</h3>
                            <button className="btn-icon-only" onClick={() => setViewCourse(null)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{viewCourse.title}</h4>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                                by {viewCourse.instructorId?.displayName || '—'}
                            </p>

                            {viewCourse.description && (
                                <p style={{ fontSize: '0.85rem', marginBottom: 16, lineHeight: 1.6 }}>{viewCourse.description}</p>
                            )}

                            {(viewCourse.videoUrl || viewCourse.pdfUrl) && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>File</div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {viewCourse.videoUrl && (
                                            <a href={`${API.replace('/api', '')}/${viewCourse.videoUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                <Video size={13} /> Watch Video <ExternalLink size={11} />
                                            </a>
                                        )}
                                        {viewCourse.pdfUrl && (
                                            <a href={`${API.replace('/api', '')}/${viewCourse.pdfUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                                PDF <ExternalLink size={11} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 6 }}>Review Notes</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    placeholder="Add review notes (optional)..."
                                    value={reviewNote}
                                    onChange={e => setReviewNote(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn btn-sm btn-danger"
                                disabled={processing}
                                onClick={() => handleReview(viewCourse._id, 'rejected')}
                            >
                                <XCircle size={14} /> Reject
                            </button>
                            <button
                                className="btn btn-sm"
                                style={{ background: 'var(--green)', color: 'white', border: 'none' }}
                                disabled={processing}
                                onClick={() => handleReview(viewCourse._id, 'approved')}
                            >
                                <CheckCircle size={14} /> Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editCourse && (
                <div className="modal-overlay" onClick={() => setEditCourse(null)}>
                    <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Course Title</h3>
                            <button className="btn-icon-only" onClick={() => setEditCourse(null)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <label className="form-label">Title *</label>
                            <input
                                className="form-input"
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && !saving && editTitle.trim() && handleSaveEdit()}
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline btn-sm" onClick={() => setEditCourse(null)}>Cancel</button>
                            <button
                                className="btn btn-sm"
                                style={{ background: 'var(--green)', color: 'white', border: 'none' }}
                                onClick={handleSaveEdit}
                                disabled={saving || !editTitle.trim()}
                            >
                                {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default InstructorCourses;
