import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, Eye, FileText, Filter, RefreshCw, MapPin, BookOpen, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './TeacherApplications.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function TeacherVerifications() {
    const { token } = useAuth();
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [reviewNote, setReviewNote] = useState('');
    const [reviewing, setReviewing] = useState(false);

    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchVerifications = async () => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/teacher/verifications`, {
                headers: { ...authHeader },
                credentials: 'include',
            });
            if (res.status === 401 || res.status === 403) {
                throw new Error('Session expired. Please log in again.');
            }
            if (!res.ok) throw new Error('Failed to fetch verifications');
            const data = await res.json();
            setVerifications(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchVerifications(); }, [token]);

    const handleReview = async (id, status) => {
        setReviewing(true);
        try {
            const res = await fetch(`${API}/teacher/verifications/${id}/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...authHeader },
                credentials: 'include',
                body: JSON.stringify({ status, reviewNote }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
            setVerifications(prev =>
                prev.map(v => v._id === id ? { ...v, status, reviewNote } : v)
            );
            setSelected(null);
            setReviewNote('');
        } catch (err) {
            alert(`Review failed: ${err.message}`);
        } finally {
            setReviewing(false);
        }
    };

    const filtered = statusFilter === 'all'
        ? verifications
        : verifications.filter(v => v.status === statusFilter);

    const counts = {
        all: verifications.length,
        pending: verifications.filter(v => v.status === 'pending').length,
        approved: verifications.filter(v => v.status === 'approved').length,
        rejected: verifications.filter(v => v.status === 'rejected').length,
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
                    <h2>Teacher Verifications</h2>
                    <p className="ta-subtitle">Review documents and approve school teachers</p>
                </div>
                <button className="btn-refresh" onClick={fetchVerifications}>
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
                    <p>Loading verifications...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="ta-empty">
                    <ShieldCheck size={40} />
                    <p>No verifications found</p>
                </div>
            ) : (
                <div className="ta-table-wrap">
                    <table className="ta-table">
                        <thead>
                            <tr>
                                <th>Teacher</th>
                                <th>School</th>
                                <th>City</th>
                                <th>Subject</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(v => (
                                <tr key={v._id}>
                                    <td>
                                        <div className="ta-applicant">
                                            <div className="ta-avatar">
                                                {(v.userId?.displayName || v.schoolName)?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="ta-name">{v.userId?.displayName || '—'}</p>
                                                <p className="ta-email">{v.userId?.email || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{v.schoolName}</td>
                                    <td>{v.city}</td>
                                    <td>{v.subject || v.position}</td>
                                    <td>{statusBadge(v.status)}</td>
                                    <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className="ta-actions">
                                            <button
                                                className="btn-icon btn-view"
                                                title="View details"
                                                onClick={() => { setSelected(v); setReviewNote(v.reviewNote || ''); }}
                                            >
                                                <Eye size={15} />
                                            </button>
                                            {v.documentUrl && (
                                                <button
                                                    className="btn-icon btn-video"
                                                    title="View document"
                                                    onClick={() => window.open(`${API.replace('/api', '')}/${v.documentUrl}`, '_blank')}
                                                >
                                                    <FileText size={15} />
                                                </button>
                                            )}
                                            {v.status === 'pending' && (
                                                <>
                                                    <button
                                                        className="btn-icon btn-approve"
                                                        title="Approve"
                                                        onClick={() => { setSelected(v); setReviewNote(''); }}
                                                    >
                                                        <Check size={15} />
                                                    </button>
                                                    <button
                                                        className="btn-icon btn-reject"
                                                        title="Reject"
                                                        onClick={() => { setSelected(v); setReviewNote(''); }}
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                </>
                                            )}
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
                            <h3>Verification — {selected.userId?.displayName || selected.schoolName}</h3>
                            <button className="btn-icon" onClick={() => setSelected(null)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="ta-modal-body">
                            <div className="ta-info-grid">
                                <div><label>Teacher Name</label><p>{selected.userId?.displayName || '—'}</p></div>
                                <div><label>Email</label><p>{selected.userId?.email || '—'}</p></div>
                                <div><label>School</label><p>{selected.schoolName}</p></div>
                                <div><label>City</label><p>{selected.city}</p></div>
                                <div><label>Class Level</label><p>{selected.classLevel}{selected.className ? ` — ${selected.className}` : ''}</p></div>
                                <div><label>Position</label><p>{selected.position}</p></div>
                                <div><label>Subject</label><p>{selected.subject}</p></div>
                                <div><label>Contact Info</label><p>{selected.contactInfo}</p></div>
                                <div><label>Document Type</label><p style={{ textTransform: 'capitalize' }}>{selected.documentType?.replace('_', ' ')}</p></div>
                                <div><label>Status</label><p>{statusBadge(selected.status)}</p></div>
                                <div><label>Submitted</label><p>{new Date(selected.createdAt).toLocaleString()}</p></div>
                            </div>

                            {selected.documentUrl && (
                                <button
                                    className="btn-new btn-video-preview"
                                    style={{ background: '#6366f1', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '0.5rem', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.875rem', marginBottom: '1.25rem' }}
                                    onClick={() => window.open(`${API.replace('/api', '')}/${selected.documentUrl}`, '_blank')}
                                >
                                    <FileText size={16} />
                                    View Uploaded Document
                                </button>
                            )}

                            {selected.reviewNote && selected.status !== 'pending' && (
                                <div className="ta-review-note-display">
                                    <label>Review Note</label>
                                    <p>{selected.reviewNote}</p>
                                </div>
                            )}

                            {selected.status === 'pending' && (
                                <div className="ta-review-section">
                                    <label>Review Note (optional)</label>
                                    <textarea
                                        value={reviewNote}
                                        onChange={e => setReviewNote(e.target.value)}
                                        placeholder="Add a note for the teacher..."
                                        rows={3}
                                    />
                                    <div className="ta-review-actions">
                                        <button
                                            className="btn-approve-full"
                                            disabled={reviewing}
                                            onClick={() => handleReview(selected._id, 'approved')}
                                        >
                                            <Check size={16} />
                                            {reviewing ? 'Processing...' : 'Approve Teacher'}
                                        </button>
                                        <button
                                            className="btn-reject-full"
                                            disabled={reviewing}
                                            onClick={() => handleReview(selected._id, 'rejected')}
                                        >
                                            <X size={16} />
                                            {reviewing ? 'Processing...' : 'Reject Teacher'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
