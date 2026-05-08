import React, { useState, useEffect } from 'react';
import { GraduationCap, Check, X, Eye, Video, Filter, RefreshCw, Trash2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './TeacherApplications.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function TeacherApplications() {
    const { token } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [videoModal, setVideoModal] = useState(null);
    const [reviewNote, setReviewNote] = useState('');
    const [reviewing, setReviewing] = useState(false);

    const [roleModal, setRoleModal] = useState(null); // { userId, currentRole, name }
    const [newRole, setNewRole] = useState('user');
    const [roleChanging, setRoleChanging] = useState(false);

    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    // ── Fetch applications ─────────────────────────────────────────────────────
    const fetchApplications = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/teacher/applications`, {
                headers: { ...authHeader },
                credentials: 'include',
            });
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('udarsy_backend_token');
                setToken('');
                throw new Error('Session expired. Please log in again.');
            }
            if (!res.ok) throw new Error('Failed to fetch applications');
            const data = await res.json();
            setApplications(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchApplications(); }, []);

    // ── Review (approve / reject) ──────────────────────────────────────────────
    const handleReview = async (id, status) => {
        setReviewing(true);
        try {
            const res = await fetch(`${API}/teacher/applications/${id}/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authHeader },
                credentials: 'include',
                body: JSON.stringify({ status, reviewNote }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
            setApplications(prev =>
                prev.map(app => app._id === id ? { ...app, status, reviewNote } : app)
            );
            setSelected(null);
            setReviewNote('');
        } catch (err) {
            alert(`Review failed: ${err.message}`);
        } finally {
            setReviewing(false);
        }
    };

    // ── Delete application ────────────────────────────────────────────────────
    const handleDelete = async (app) => {
        if (!confirm(`Delete application from "${app.fullName}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${API}/teacher/applications/${app._id}`, {
                method: 'DELETE',
                headers: { ...authHeader },
                credentials: 'include',
            });
            if (!res.ok) { const d = await res.json(); alert(d.error || 'Delete failed'); return; }
            setApplications(prev => prev.filter(a => a._id !== app._id));
            if (selected?._id === app._id) setSelected(null);
        } catch (err) { alert('Error: ' + err.message); }
    };

    // ── Change user role ──────────────────────────────────────────────────────
    const openRoleModal = (app) => {
        const userId = app.userId?._id || app.userId;
        setRoleModal({ applicationId: app._id, userId, name: app.fullName });
        setNewRole('instructor');
    };

    const handleRoleChange = async () => {
        if (!roleModal?.userId) { alert('No user linked to this application'); return; }
        setRoleChanging(true);
        try {
            const res = await fetch(`${API}/user/admin/${roleModal.userId}/role`, {
                method: 'PATCH',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ role: newRole }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Role change failed');
            alert(`✅ Role updated to "${newRole}" for ${roleModal.name}.\nThe change is saved — go to the Users page to confirm.`);
            setRoleModal(null);
        } catch (err) { alert('Error: ' + err.message); }
        finally { setRoleChanging(false); }
    };

    // ── Derived data ───────────────────────────────────────────────────────────
    const filtered = statusFilter === 'all'
        ? applications
        : applications.filter(a => a.status === statusFilter);

    const counts = {
        all: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    };

    const statusBadge = (status) => {
        const map = {
            pending: { label: 'Pending', cls: 'badge-pending' },
            approved: { label: 'Approved', cls: 'badge-approved' },
            rejected: { label: 'Rejected', cls: 'badge-rejected' },
        };
        const s = map[status] || map.pending;
        return <span className={`ta-badge ${s.cls}`}>{s.label}</span>;
    };

    return (
        <div className="ta-page">
            {/* Header */}
            <div className="ta-header">
                <div>
                    <h2>Instructor Applications</h2>
                    <p className="ta-subtitle">Review demo videos and approve new instructors</p>
                </div>
                <button className="btn-refresh" onClick={fetchApplications}>
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Stats row */}
            <div className="ta-stats">
                {[
                    { label: 'Total', value: counts.all, cls: '' },
                    { label: 'Pending', value: counts.pending, cls: 'stat-pending' },
                    { label: 'Approved', value: counts.approved, cls: 'stat-approved' },
                    { label: 'Rejected', value: counts.rejected, cls: 'stat-rejected' },
                ].map(s => (
                    <div key={s.label} className={`ta-stat-card ${s.cls}`}>
                        <span className="stat-value">{s.value}</span>
                        <span className="stat-label">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div className="ta-filters">
                <Filter size={16} />
                {['all', 'pending', 'approved', 'rejected'].map(f => (
                    <button
                        key={f}
                        className={statusFilter === f ? 'active' : ''}
                        onClick={() => setStatusFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f] ?? 0})
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && <div className="ta-error">{error}</div>}

            {/* Table */}
            {loading ? (
                <div className="ta-loading">
                    <RefreshCw size={24} className="spin" />
                    <p>Loading applications...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="ta-empty">
                    <GraduationCap size={40} />
                    <p>No applications found</p>
                </div>
            ) : (
                <div className="ta-table-wrap">
                    <table className="ta-table">
                        <thead>
                            <tr>
                                <th>Applicant</th>
                                <th>Specialist</th>
                                <th>Study Level</th>
                                <th>Target Course</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(app => (
                                <tr key={app._id}>
                                    <td>
                                        <div className="ta-applicant">
                                            <div className="ta-avatar">
                                                {app.fullName?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="ta-name">{app.fullName}</p>
                                                <p className="ta-email">{app.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{app.specialist}</td>
                                    <td>{app.studyLevel}</td>
                                    <td className="ta-subject-id">{app.targetSubjectId}</td>
                                    <td>{statusBadge(app.status)}</td>
                                    <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className="ta-actions">
                                            <button
                                                className="btn-icon btn-view"
                                                title="View details"
                                                onClick={() => { setSelected(app); setReviewNote(app.reviewNote || ''); }}
                                            >
                                                <Eye size={15} />
                                            </button>
                                            {app.videoUrl && (
                                                <button
                                                    className="btn-icon btn-video"
                                                    title="Watch video"
                                                    onClick={() => setVideoModal(app)}
                                                >
                                                    <Video size={15} />
                                                </button>
                                            )}
                                            {app.status === 'pending' && (
                                                <>
                                                    <button
                                                        className="btn-icon btn-approve"
                                                        title="Approve"
                                                        onClick={() => { setSelected(app); setReviewNote(''); }}
                                                    >
                                                        <Check size={15} />
                                                    </button>
                                                    <button
                                                        className="btn-icon btn-reject"
                                                        title="Reject"
                                                        onClick={() => { setSelected(app); setReviewNote(''); }}
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                className="btn-icon"
                                                title="Change user role"
                                                style={{ color: '#6366f1' }}
                                                onClick={() => openRoleModal(app)}
                                            >
                                                <Shield size={15} />
                                            </button>
                                            <button
                                                className="btn-icon btn-reject"
                                                title="Delete application"
                                                onClick={() => handleDelete(app)}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail / Review Modal */}
            {selected && (
                <div className="ta-modal-overlay" onClick={() => setSelected(null)}>
                    <div className="ta-modal" onClick={e => e.stopPropagation()}>
                        <div className="ta-modal-header">
                            <h3>Application — {selected.fullName}</h3>
                            <button className="btn-icon" onClick={() => setSelected(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="ta-modal-body">
                            <div className="ta-info-grid">
                                <div><label>Full Name</label><p>{selected.fullName}</p></div>
                                <div><label>Email</label><p>{selected.email}</p></div>
                                <div><label>Age</label><p>{selected.age}</p></div>
                                <div><label>Study Branch</label><p>{selected.studyBranch}</p></div>
                                <div><label>Study Level</label><p>{selected.studyLevel}</p></div>
                                <div><label>Specialist</label><p>{selected.specialist}</p></div>
                                <div><label>Current Stand</label><p>{selected.currentStand}</p></div>
                                <div><label>Target Level ID</label><p className="ta-id">{selected.targetLevelId}</p></div>
                                <div><label>Target Guidance ID</label><p className="ta-id">{selected.targetGuidanceId}</p></div>
                                <div><label>Target Subject ID</label><p className="ta-id">{selected.targetSubjectId}</p></div>
                                <div><label>Status</label><p>{statusBadge(selected.status)}</p></div>
                                <div><label>Applied</label><p>{new Date(selected.createdAt).toLocaleString()}</p></div>
                            </div>

                            {selected.reviewNote && (
                                <div className="ta-review-note-display">
                                    <label>Review Note</label>
                                    <p>{selected.reviewNote}</p>
                                </div>
                            )}

                            {selected.videoUrl && (
                                <button
                                    className="btn-new btn-video-preview"
                                    onClick={() => setVideoModal(selected)}
                                >
                                    <Video size={16} />
                                    Watch Demo Video
                                </button>
                            )}

                            {selected.status === 'pending' && (
                                <div className="ta-review-section">
                                    <label>Review Note (optional)</label>
                                    <textarea
                                        value={reviewNote}
                                        onChange={e => setReviewNote(e.target.value)}
                                        placeholder="Add a note for the applicant..."
                                        rows={3}
                                    />
                                    <div className="ta-review-actions">
                                        <button
                                            className="btn-approve-full"
                                            disabled={reviewing}
                                            onClick={() => handleReview(selected._id, 'approved')}
                                        >
                                            <Check size={16} />
                                            {reviewing ? 'Processing...' : 'Approve Application'}
                                        </button>
                                        <button
                                            className="btn-reject-full"
                                            disabled={reviewing}
                                            onClick={() => handleReview(selected._id, 'rejected')}
                                        >
                                            <X size={16} />
                                            {reviewing ? 'Processing...' : 'Reject Application'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Role Change Modal */}
            {roleModal && (
                <div className="ta-modal-overlay" onClick={() => setRoleModal(null)}>
                    <div className="ta-modal" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
                        <div className="ta-modal-header">
                            <h3>Change Role — {roleModal.name}</h3>
                            <button className="btn-icon" onClick={() => setRoleModal(null)}><X size={18} /></button>
                        </div>
                        <div className="ta-modal-body">
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.85rem' }}>New Role</label>
                            <select
                                value={newRole}
                                onChange={e => setNewRole(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: '0.9rem' }}
                            >
                                <option value="user">User</option>
                                <option value="teacher">Teacher</option>
                                <option value="instructor">Instructor</option>
                                <option value="admin">Admin</option>
                            </select>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn-icon btn-reject" style={{ flex: 1, padding: '0.6rem', borderRadius: 8, fontSize: '0.85rem' }} onClick={() => setRoleModal(null)}>Cancel</button>
                                <button
                                    className="btn-approve-full"
                                    style={{ flex: 1, padding: '0.6rem', borderRadius: 8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                    disabled={roleChanging}
                                    onClick={handleRoleChange}
                                >
                                    <Shield size={14} />
                                    {roleChanging ? 'Saving...' : 'Set Role'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {videoModal && (
                <div className="ta-modal-overlay" onClick={() => setVideoModal(null)}>
                    <div className="ta-video-modal" onClick={e => e.stopPropagation()}>
                        <div className="ta-modal-header">
                            <h3>Demo Video — {videoModal.fullName}</h3>
                            <button className="btn-icon" onClick={() => setVideoModal(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <video
                            src={`${API.replace('/api', '')}/${videoModal.videoUrl}`}
                            controls
                            autoPlay
                            className="ta-video-player"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
