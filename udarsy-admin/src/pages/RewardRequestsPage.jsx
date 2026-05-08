import { useState, useEffect } from 'react';
import { Star, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_COLORS = {
    pending: 'badge-amber',
    approved: 'badge-green',
    rejected: 'badge-red',
};

function RewardRequestsPage() {
    const { token } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [selected, setSelected] = useState(null);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/user/admin/reward-requests`, { headers });
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching reward requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const review = async (id, status) => {
        setActionLoading(id + status);
        try {
            const res = await fetch(`${API}/user/admin/reward-requests/${id}/review`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status, reviewNotes }),
            });
            if (res.ok) {
                setRequests(prev => prev.map(r => r._id === id ? { ...r, status, reviewNotes } : r));
                if (selected?._id === id) setSelected(prev => ({ ...prev, status }));
                setReviewNotes('');
            }
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter);
    const pending = requests.filter(r => r.status === 'pending').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Star className="text-amber-500" size={24} />
                    <h1 className="text-2xl font-bold">Reward Requests</h1>
                    {pending > 0 && (
                        <span className="badge badge-amber">{pending} pending</span>
                    )}
                </div>
                <button onClick={fetchRequests} className="btn btn-ghost btn-sm">Refresh</button>
            </div>

            <div className="flex gap-2 flex-wrap">
                {['all', 'pending', 'approved', 'rejected'].map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                    >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                        {s !== 'all' && <span className="ml-1.5 opacity-60">({requests.filter(r => r.status === s).length})</span>}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={32} /></div>
            ) : filtered.length === 0 ? (
                <div className="card text-center py-16 text-gray-400">
                    <Star size={40} className="mx-auto mb-3 opacity-30" />
                    <p>No reward requests found.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(r => (
                        <div
                            key={r._id}
                            className={`card cursor-pointer transition-all hover:shadow-md ${selected?._id === r._id ? 'ring-2 ring-green-500' : ''}`}
                            onClick={() => setSelected(selected?._id === r._id ? null : r)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                                        <Star size={18} className="text-amber-500 fill-amber-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{r.userDisplayName}</p>
                                        <p className="text-xs text-gray-400">{r.userEmail} · {r.userPoints?.toLocaleString()} pts</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                                    <span className={`badge ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                                </div>
                            </div>

                            {selected?._id === r._id && r.status === 'pending' && (
                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3" onClick={e => e.stopPropagation()}>
                                    <textarea
                                        placeholder="Review notes (optional)..."
                                        value={reviewNotes}
                                        onChange={e => setReviewNotes(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-green-400"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => review(r._id, 'approved')}
                                            disabled={actionLoading === r._id + 'approved'}
                                            className="btn btn-primary flex-1 gap-2"
                                        >
                                            {actionLoading === r._id + 'approved' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                            Approve (Grant 1 Month Pro)
                                        </button>
                                        <button
                                            onClick={() => review(r._id, 'rejected')}
                                            disabled={actionLoading === r._id + 'rejected'}
                                            className="btn btn-danger flex-1 gap-2"
                                        >
                                            {actionLoading === r._id + 'rejected' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            )}

                            {selected?._id === r._id && r.status !== 'pending' && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs text-gray-400">
                                        Reviewed: {r.reviewedAt ? new Date(r.reviewedAt).toLocaleString() : '—'}
                                        {r.reviewNotes && ` · Notes: ${r.reviewNotes}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default RewardRequestsPage;
