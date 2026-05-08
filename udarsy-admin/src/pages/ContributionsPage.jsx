import { useState, useEffect } from 'react';
import { Heart, Loader2, Eye, CheckCircle, XCircle, Clock, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ContributionsPage() {
    const { token } = useAuth();
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => { fetchContributions(); }, []);

    const fetchContributions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/data/contributions?limit=200`, { headers });
            const data = await res.json();
            setContributions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching contributions:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        setActionLoading(id + status);
        try {
            const res = await fetch(`${API}/data/contributions/${id}/status`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                setContributions(prev => prev.map(c => c._id === id ? { ...c, status } : c));
                if (selected?._id === id) setSelected(prev => ({ ...prev, status }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const deleteContribution = async (id) => {
        if (!window.confirm('Delete this contribution?')) return;
        setActionLoading(id + 'del');
        try {
            const res = await fetch(`${API}/data/contributions/${id}`, { method: 'DELETE', headers });
            if (res.ok) {
                setContributions(prev => prev.filter(c => c._id !== id));
                if (selected?._id === id) setSelected(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = contributions.filter(c => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        return true;
    });

    const counts = {
        all: contributions.length,
        pending: contributions.filter(c => c.status === 'pending').length,
        approved: contributions.filter(c => c.status === 'approved').length,
        rejected: contributions.filter(c => c.status === 'rejected').length,
    };

    const statusBadgeClass = (s) => s === 'approved' ? 'badge-green' : s === 'rejected' ? 'badge-red' : 'badge-amber';

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark)' }}>Contributions</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Student notes, summaries, and community contributions
                    </p>
                </div>
                <button onClick={fetchContributions} className="btn btn-outline btn-sm">
                    <Loader2 size={14} className={loading ? 'spin' : ''} /> Refresh
                </button>
            </div>

            {/* Status filter pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                    { key: 'all', label: 'All', count: counts.all },
                    { key: 'pending', label: 'Pending', count: counts.pending },
                    { key: 'approved', label: 'Approved', count: counts.approved },
                    { key: 'rejected', label: 'Rejected', count: counts.rejected },
                ].map(({ key, label, count }) => (
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
                        {label} ({count})
                    </button>
                ))}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Loader2 size={24} className="spin" style={{ color: 'var(--green)' }} />
                        <div style={{ marginTop: 8, fontSize: '0.85rem' }}>Loading contributions...</div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <Heart size={32} style={{ color: 'var(--border)', marginBottom: 8 }} />
                        <div>No contributions found</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Resource</th>
                                <th>Subject / Lesson</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c._id}>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                                            {c.user?.displayName || 'Anonymous'}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                            {c.user?.email || ''}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.82rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {c.resourceTitle || '—'}
                                    </td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        <div>{c.subjectTitle || '—'}</div>
                                        <div style={{ fontSize: '0.7rem' }}>{c.lessonTitle || ''}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${statusBadgeClass(c.status)}`}>
                                            {c.status || 'pending'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button
                                                className="btn-icon-only"
                                                title="View details"
                                                onClick={() => setSelected(c)}
                                            >
                                                <Eye size={14} />
                                            </button>
                                            {c.status !== 'approved' && (
                                                <button
                                                    className="btn-icon-only"
                                                    title="Approve"
                                                    style={{ color: '#16a34a' }}
                                                    disabled={actionLoading === c._id + 'approved'}
                                                    onClick={() => updateStatus(c._id, 'approved')}
                                                >
                                                    <CheckCircle size={14} />
                                                </button>
                                            )}
                                            {c.status !== 'rejected' && (
                                                <button
                                                    className="btn-icon-only"
                                                    title="Reject"
                                                    style={{ color: '#dc2626' }}
                                                    disabled={actionLoading === c._id + 'rejected'}
                                                    onClick={() => updateStatus(c._id, 'rejected')}
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                            )}
                                            <button
                                                className="btn-icon-only"
                                                title="Delete"
                                                style={{ color: '#dc2626' }}
                                                disabled={actionLoading === c._id + 'del'}
                                                onClick={() => deleteContribution(c._id)}
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
                            <h3>Contribution Details</h3>
                            <button className="btn-icon-only" onClick={() => setSelected(null)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gap: 16, fontSize: '0.85rem' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>User</div>
                                    <div style={{ fontWeight: 600, marginTop: 2 }}>{selected.user?.displayName || 'Anonymous'}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{selected.user?.email || ''}</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Resource</div>
                                    <div style={{ marginTop: 2 }}>{selected.resourceTitle}</div>
                                    {selected.url && (
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', wordBreak: 'break-all', marginTop: 4 }}>
                                            {selected.url}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Subject</div>
                                        <div style={{ marginTop: 2 }}>{selected.subjectTitle || '—'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Lesson</div>
                                        <div style={{ marginTop: 2 }}>{selected.lessonTitle || '—'}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Status</div>
                                        <div style={{ marginTop: 4 }}>
                                            <span className={`badge ${statusBadgeClass(selected.status)}`}>{selected.status}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>Date</div>
                                        <div style={{ marginTop: 2 }}>{selected.createdAt ? new Date(selected.createdAt).toLocaleString() : '—'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            {selected.status !== 'approved' && (
                                <button
                                    className="btn btn-sm"
                                    style={{ background: 'var(--green)', color: 'white', border: 'none' }}
                                    onClick={() => updateStatus(selected._id, 'approved')}
                                >
                                    <CheckCircle size={14} /> Approve
                                </button>
                            )}
                            {selected.status !== 'rejected' && (
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => updateStatus(selected._id, 'rejected')}
                                >
                                    <XCircle size={14} /> Reject
                                </button>
                            )}
                            {selected.status !== 'pending' && (
                                <button
                                    className="btn btn-sm btn-outline"
                                    onClick={() => updateStatus(selected._id, 'pending')}
                                >
                                    <Clock size={14} /> Reset to Pending
                                </button>
                            )}
                            <button
                                className="btn btn-sm btn-danger"
                                onClick={() => deleteContribution(selected._id)}
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

export default ContributionsPage;
