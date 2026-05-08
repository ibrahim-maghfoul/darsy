import { useState, useEffect } from 'react';
import { Flag, Loader2, Eye, Trash2, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_COLORS = { pending: 'badge-amber', reviewed: 'badge-green', resolved: 'badge-gray' };
const TYPE_COLORS = { bug: 'badge-red', suggestion: 'badge-green', feedback: 'badge-amber' };

function FeedbackPage() {
    const { token } = useAuth();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => { fetchFeedbacks(); }, []);

    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/user/admin/feedback`, { headers });
            const data = await res.json();
            setFeedbacks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching feedback:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        setActionLoading(id + status);
        try {
            const res = await fetch(`${API}/user/admin/feedback/${id}/status`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                setFeedbacks(prev => prev.map(f => f._id === id ? { ...f, status } : f));
                if (selected?._id === id) setSelected(prev => ({ ...prev, status }));
            }
        } finally {
            setActionLoading(null);
        }
    };

    const deleteFeedback = async (id) => {
        if (!window.confirm('Delete this feedback?')) return;
        setActionLoading(id + 'del');
        try {
            const res = await fetch(`${API}/user/admin/feedback/${id}`, { method: 'DELETE', headers });
            if (res.ok) {
                setFeedbacks(prev => prev.filter(f => f._id !== id));
                if (selected?._id === id) setSelected(null);
            }
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = statusFilter === 'all' ? feedbacks : feedbacks.filter(f => f.status === statusFilter);
    const counts = {
        all: feedbacks.length,
        pending: feedbacks.filter(f => f.status === 'pending').length,
        reviewed: feedbacks.filter(f => f.status === 'reviewed').length,
        resolved: feedbacks.filter(f => f.status === 'resolved').length,
    };

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark)' }}>Reports & Feedback</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Bug reports, suggestions, and user feedback
                    </p>
                </div>
                <button onClick={fetchFeedbacks} className="btn btn-outline btn-sm">
                    <Loader2 size={14} className={loading ? 'spin' : ''} /> Refresh
                </button>
            </div>

            {/* Status filter pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                    { key: 'all', label: 'All' },
                    { key: 'pending', label: 'Pending' },
                    { key: 'reviewed', label: 'Reviewed' },
                    { key: 'resolved', label: 'Resolved' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className="btn btn-sm"
                        style={{
                            background: statusFilter === key ? 'var(--green)' : 'var(--surface)',
                            color: statusFilter === key ? 'white' : 'var(--text-secondary)',
                            border: `1px solid ${statusFilter === key ? 'var(--green)' : 'var(--border)'}`,
                        }}
                    >
                        {label} ({counts[key]})
                    </button>
                ))}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Loader2 size={24} className="spin" style={{ color: 'var(--green)' }} />
                        <div style={{ marginTop: 8, fontSize: '0.85rem' }}>Loading feedback...</div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <Flag size={32} style={{ color: 'var(--border)', marginBottom: 8 }} />
                        <div>No reports or feedback found</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>From</th>
                                <th>Type</th>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((f) => (
                                <tr key={f._id}>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                                            {f.user?.displayName || 'Anonymous'}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                            {f.user?.email || ''}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${TYPE_COLORS[f.type] || 'badge-amber'}`} style={{ textTransform: 'capitalize' }}>
                                            {f.type}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.82rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {f.title || '—'}
                                    </td>
                                    <td>
                                        <span className={`badge ${STATUS_COLORS[f.status] || 'badge-amber'}`} style={{ textTransform: 'capitalize' }}>
                                            {f.status}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn-icon-only" title="View" onClick={() => setSelected(f)}>
                                                <Eye size={14} />
                                            </button>
                                            {f.status === 'pending' && (
                                                <button
                                                    className="btn-icon-only"
                                                    title="Mark as reviewed"
                                                    style={{ color: '#16a34a' }}
                                                    disabled={!!actionLoading}
                                                    onClick={() => updateStatus(f._id, 'reviewed')}
                                                >
                                                    <CheckCircle size={14} />
                                                </button>
                                            )}
                                            <button
                                                className="btn-icon-only"
                                                title="Delete"
                                                style={{ color: '#dc2626' }}
                                                disabled={actionLoading === f._id + 'del'}
                                                onClick={() => deleteFeedback(f._id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail Modal */}
            {selected && (
                <div className="modal-overlay" onClick={() => setSelected(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Feedback Details</h3>
                            <button className="btn-icon-only" onClick={() => setSelected(null)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gap: 16 }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>From</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: 2 }}>{selected.user?.displayName || 'Anonymous'}</div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{selected.user?.email || '—'}</div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Type</div>
                                        <div style={{ marginTop: 4 }}>
                                            <span className={`badge ${TYPE_COLORS[selected.type] || 'badge-amber'}`} style={{ textTransform: 'capitalize' }}>{selected.type}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Status</div>
                                        <div style={{ marginTop: 4 }}>
                                            <span className={`badge ${STATUS_COLORS[selected.status] || 'badge-amber'}`} style={{ textTransform: 'capitalize' }}>{selected.status}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Title</div>
                                    <div style={{ fontSize: '0.9rem', marginTop: 2 }}>{selected.title || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Description</div>
                                    <div style={{ fontSize: '0.85rem', marginTop: 2, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                        {selected.description || 'No description'}
                                    </div>
                                </div>
                                {selected.createdAt && (
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Date</div>
                                        <div style={{ fontSize: '0.85rem', marginTop: 2 }}>{new Date(selected.createdAt).toLocaleString()}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            {selected.status === 'pending' && (
                                <button
                                    className="btn btn-sm"
                                    style={{ background: 'var(--green)', color: 'white', border: 'none' }}
                                    disabled={!!actionLoading}
                                    onClick={() => updateStatus(selected._id, 'reviewed')}
                                >
                                    <CheckCircle size={14} /> Mark Reviewed
                                </button>
                            )}
                            {selected.status === 'reviewed' && (
                                <button
                                    className="btn btn-sm"
                                    style={{ background: 'var(--green)', color: 'white', border: 'none' }}
                                    disabled={!!actionLoading}
                                    onClick={() => updateStatus(selected._id, 'resolved')}
                                >
                                    <CheckCircle size={14} /> Mark Resolved
                                </button>
                            )}
                            <button
                                className="btn btn-sm btn-danger"
                                disabled={actionLoading === selected._id + 'del'}
                                onClick={() => deleteFeedback(selected._id)}
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FeedbackPage;
