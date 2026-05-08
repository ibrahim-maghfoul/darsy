import { useState, useEffect } from 'react';
import { Flag, Loader2, CheckCircle2, XCircle, Clock, Trash2, RefreshCw, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_COLORS = {
    pending:   { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    resolved:  { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    dismissed: { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
};

const STATUS_ICONS = {
    pending:   <Clock size={13} />,
    resolved:  <CheckCircle2 size={13} />,
    dismissed: <XCircle size={13} />,
};

function ReportCard({ report, onStatusChange, onDelete }) {
    const [updating, setUpdating] = useState(false);

    const reporter  = report.reporterId  || {};
    const reported  = report.reportedUserId || {};
    const colors    = STATUS_COLORS[report.status] || STATUS_COLORS.pending;

    const handleStatus = async (status) => {
        setUpdating(true);
        await onStatusChange(report._id, status);
        setUpdating(false);
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid var(--border)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
        }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                        <Flag size={16} />
                    </div>
                    <div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--dark)' }}>
                            {report.reason?.replace(/_/g, ' ')}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {new Date(report.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
                <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                }}>
                    {STATUS_ICONS[report.status]} {report.status}
                </span>
            </div>

            {/* Reporter → Reported */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
                <div style={{ background: 'var(--green-50)', borderRadius: 12, padding: '10px 12px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Reporter</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={13} color="var(--text-secondary)" />
                        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {reporter.displayName || reporter.email || 'Unknown'}
                        </p>
                    </div>
                </div>
                <div style={{ fontSize: 18, color: 'var(--text-secondary)' }}>→</div>
                <div style={{ background: '#fef2f2', borderRadius: 12, padding: '10px 12px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Reported</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={13} color="#ef4444" />
                        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {reported.displayName || reported.email || 'Unknown'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Details */}
            {report.details && (
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Details</p>
                    <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.5 }}>{report.details}</p>
                </div>
            )}

            {/* Reported message preview */}
            {report.messageId?.text && (
                <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 12px', border: '1px solid #fde68a' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Reported Message</p>
                    <p style={{ fontSize: 13, color: '#78350f', fontStyle: 'italic' }}>"{report.messageId.text}"</p>
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {report.status !== 'resolved' && (
                    <button
                        onClick={() => handleStatus('resolved')}
                        disabled={updating}
                        style={{
                            flex: 1, padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: 'var(--green)', color: 'white', fontWeight: 700, fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            opacity: updating ? 0.6 : 1,
                        }}
                    >
                        <CheckCircle2 size={13} /> Resolve
                    </button>
                )}
                {report.status !== 'dismissed' && (
                    <button
                        onClick={() => handleStatus('dismissed')}
                        disabled={updating}
                        style={{
                            flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer',
                            background: 'white', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            opacity: updating ? 0.6 : 1,
                        }}
                    >
                        <XCircle size={13} /> Dismiss
                    </button>
                )}
                {report.status === 'pending' && (
                    <button
                        onClick={() => handleStatus('pending')}
                        disabled={updating}
                        style={{
                            flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer',
                            background: 'white', color: 'var(--text-secondary)', fontWeight: 700, fontSize: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 0,
                        }}
                    >
                        <Clock size={13} /> Keep Pending
                    </button>
                )}
                <button
                    onClick={() => onDelete(report._id)}
                    style={{
                        padding: '8px 12px', borderRadius: 10, border: '1px solid #fecaca', cursor: 'pointer',
                        background: '#fef2f2', color: '#ef4444', fontWeight: 700, fontSize: 12,
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </div>
    );
}

export default function UserReportsPage() {
    const { token } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const headers = { Authorization: `Bearer ${token}` };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const url = filter === 'all' ? `${API}/chat/reports` : `${API}/chat/reports?status=${filter}`;
            const res = await fetch(url, { headers });
            const data = await res.json();
            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReports(); }, [filter]);

    const handleStatusChange = async (id, status) => {
        try {
            const res = await fetch(`${API}/chat/reports/${id}/status`, {
                method: 'PATCH',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                setReports(prev => prev.map(r => r._id === id ? { ...r, status } : r));
            }
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this report permanently?')) return;
        try {
            const res = await fetch(`${API}/chat/reports/${id}`, { method: 'DELETE', headers });
            if (res.ok) setReports(prev => prev.filter(r => r._id !== id));
        } catch (err) { console.error(err); }
    };

    const counts = {
        all: reports.length,
        pending: reports.filter(r => r.status === 'pending').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        dismissed: reports.filter(r => r.status === 'dismissed').length,
    };

    const FILTERS = [
        { key: 'all',       label: 'All' },
        { key: 'pending',   label: 'Pending' },
        { key: 'resolved',  label: 'Resolved' },
        { key: 'dismissed', label: 'Dismissed' },
    ];

    return (
        <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Flag size={20} color="#ef4444" /> User Reports
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                        {counts.pending} pending · {counts.resolved} resolved · {counts.dismissed} dismissed
                    </p>
                </div>
                <button
                    onClick={fetchReports}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)',
                        background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 13,
                        color: 'var(--text-secondary)',
                    }}
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        style={{
                            padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            border: filter === f.key ? 'none' : '1px solid var(--border)',
                            background: filter === f.key ? 'var(--green)' : 'white',
                            color: filter === f.key ? 'white' : 'var(--text-secondary)',
                            transition: 'all 0.15s',
                        }}
                    >
                        {f.label} {f.key === 'all' ? `(${counts.all})` : `(${counts[f.key]})`}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p>Loading reports…</p>
                </div>
            ) : reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                    <Flag size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontWeight: 700 }}>No reports found</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {reports.map(report => (
                        <ReportCard
                            key={report._id}
                            report={report}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
