import { useState, useEffect } from 'react';
import {
    Users, Search, Eye, Loader2, Crown, BookOpen,
    Video, Clock, Star, Trophy, ChevronDown, ChevronUp, RefreshCw,
    Edit3, Trash2, Shield, X, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ROLE_BADGE = {
    admin:      { cls: 'badge-red',   label: 'Admin' },
    instructor: { cls: 'badge-blue',  label: 'Instructor' },
    teacher:    { cls: 'badge-green', label: 'Teacher' },
    user:       { cls: 'badge-gray',  label: 'User' },
};

const PLAN_BADGE = {
    pro:     { cls: 'badge-red',   label: 'Pro' },
    premium: { cls: 'badge-amber', label: 'Premium' },
    free:    { cls: 'badge-gray',  label: 'Free' },
};

function UsersPage() {
    const { token } = useAuth();
    const [users, setUsers]             = useState([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [roleFilter, setRoleFilter]   = useState('all');
    const [planFilter, setPlanFilter]   = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [editUser, setEditUser]         = useState(null);
    const [editForm, setEditForm]         = useState({});
    const [saving, setSaving]             = useState(false);
    const [sortBy, setSortBy]             = useState('createdAt');
    const [sortDir, setSortDir]         = useState('desc');

    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/user/all?limit=200`, { headers });
            const data = await res.json();
            // Support both paginated { users, total } and legacy array response
            setUsers(Array.isArray(data) ? data : (data.users || []));
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (u) => {
        setEditUser(u);
        setEditForm({ role: u.role || 'user', plan: u.subscription?.plan || 'free', billingCycle: u.subscription?.billingCycle || 'none' });
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            const roleRes = await fetch(`${API}/user/admin/${editUser._id}/role`, {
                method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: editForm.role }),
            });
            if (!roleRes.ok) { const d = await roleRes.json(); throw new Error(d.error || 'Role update failed'); }

            const subRes = await fetch(`${API}/user/admin/${editUser._id}/subscription`, {
                method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: editForm.plan, billingCycle: editForm.billingCycle }),
            });
            if (!subRes.ok) { const d = await subRes.json(); throw new Error(d.error || 'Subscription update failed'); }

            setUsers(prev => prev.map(u => u._id === editUser._id ? {
                ...u, role: editForm.role,
                subscription: { ...u.subscription, plan: editForm.plan, billingCycle: editForm.billingCycle }
            } : u));
            setEditUser(null);
        } catch (err) { alert('Error saving: ' + err.message); }
        setSaving(false);
    };

    const handleDelete = async (u) => {
        if (!confirm(`Delete user "${u.displayName}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`${API}/user/admin/${u._id}`, { method: 'DELETE', headers });
            if (!res.ok) { const d = await res.json(); alert(d.error); return; }
            setUsers(prev => prev.filter(x => x._id !== u._id));
            if (selectedUser?._id === u._id) setSelectedUser(null);
        } catch (err) { alert('Error: ' + err.message); }
    };

    const handleSort = (field) => {
        if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(field); setSortDir('desc'); }
    };

    const filtered = users
        .filter(u => {
            if (roleFilter !== 'all' && (u.role || 'user') !== roleFilter) return false;
            if (planFilter !== 'all' && (u.subscription?.plan || 'free') !== planFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                return (u.displayName || '').toLowerCase().includes(q) ||
                    (u.email || '').toLowerCase().includes(q) ||
                    (u.city || '').toLowerCase().includes(q);
            }
            return true;
        })
        .sort((a, b) => {
            let av, bv;
            if (sortBy === 'createdAt') { av = new Date(a.createdAt); bv = new Date(b.createdAt); }
            else if (sortBy === 'points')  { av = a.points || 0; bv = b.points || 0; }
            else if (sortBy === 'lessons') { av = a.progress?.completedLessons || 0; bv = b.progress?.completedLessons || 0; }
            else if (sortBy === 'time')    { av = a.progress?.learningTime || 0; bv = b.progress?.learningTime || 0; }
            else return 0;
            return sortDir === 'asc' ? av - bv : bv - av;
        });

    const roleCounts = ['all', 'admin', 'instructor', 'teacher', 'user'].reduce((acc, r) => {
        acc[r] = r === 'all' ? users.length : users.filter(u => (u.role || 'user') === r).length;
        return acc;
    }, {});

    const SortIcon = ({ field }) => sortBy === field
        ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
        : null;

    const th = (label, field) => (
        <th onClick={() => handleSort(field)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
            {label} <SortIcon field={field} />
        </th>
    );

    return (
        <div className="animate-fade">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark)' }}>Users</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        {users.length} registered users
                    </p>
                </div>
                <button onClick={fetchUsers} className="btn btn-outline btn-sm">
                    <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                </button>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                    { label: 'Total', value: users.length, cls: 'badge-gray' },
                    { label: 'Premium', value: users.filter(u => u.subscription?.plan === 'premium' || u.subscription?.plan === 'pro').length, cls: 'badge-amber' },
                    { label: 'Instructors', value: users.filter(u => u.role === 'instructor').length, cls: 'badge-blue' },
                    { label: 'Teachers', value: users.filter(u => u.role === 'teacher').length, cls: 'badge-green' },
                ].map(({ label, value, cls }) => (
                    <div key={label} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--dark)' }}>{value}</div>
                        <span className={`badge ${cls}`} style={{ marginTop: 4 }}>{label}</span>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {Object.entries(roleCounts).map(([role, count]) => (
                    <button key={role} onClick={() => setRoleFilter(role)} className="btn btn-sm" style={{
                        background: roleFilter === role ? 'var(--green)' : 'var(--surface)',
                        color: roleFilter === role ? 'white' : 'var(--text-secondary)',
                        border: `1px solid ${roleFilter === role ? 'var(--green)' : 'var(--border)'}`,
                        textTransform: 'capitalize',
                    }}>
                        {role} ({count})
                    </button>
                ))}
                <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
                {['all', 'free', 'premium', 'pro'].map(plan => (
                    <button key={plan} onClick={() => setPlanFilter(plan)} className="btn btn-sm" style={{
                        background: planFilter === plan ? '#f59e0b' : 'var(--surface)',
                        color: planFilter === plan ? 'white' : 'var(--text-secondary)',
                        border: `1px solid ${planFilter === plan ? '#f59e0b' : 'var(--border)'}`,
                        textTransform: 'capitalize',
                    }}>
                        {plan}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input className="input" placeholder="Search by name, email or city..." value={search}
                    onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Loader2 size={24} className="spin" style={{ color: 'var(--green)' }} />
                        <div style={{ marginTop: 8, fontSize: '0.85rem' }}>Loading users...</div>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Plan</th>
                                    {th('Points', 'points')}
                                    {th('Lessons', 'lessons')}
                                    {th('Time (min)', 'time')}
                                    <th>Videos</th>
                                    <th>Docs</th>
                                    {th('Joined', 'createdAt')}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                            No users found
                                        </td>
                                    </tr>
                                ) : filtered.map(u => {
                                    const role = u.role || 'user';
                                    const plan = u.subscription?.plan || 'free';
                                    const rb = ROLE_BADGE[role] || ROLE_BADGE.user;
                                    const pb = PLAN_BADGE[plan] || PLAN_BADGE.free;
                                    return (
                                        <tr key={u._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 34, height: 34, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                                                        background: 'linear-gradient(135deg, #3aaa6a, #2d8a55)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: 'white', fontSize: '0.7rem', fontWeight: 800,
                                                    }}>
                                                        {u.photoURL
                                                            ? <img src={u.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            : (u.displayName || 'U')[0].toUpperCase()
                                                        }
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{u.displayName || 'Unnamed'}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className={`badge ${rb.cls}`}>{rb.label}</span></td>
                                            <td>
                                                <span className={`badge ${pb.cls}`}>
                                                    {plan !== 'free' && <Crown size={10} />} {pb.label}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--dark)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Trophy size={13} style={{ color: '#f59e0b' }} />{u.points || 0}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.82rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <BookOpen size={13} style={{ color: 'var(--green)' }} />
                                                    {u.progress?.completedLessons || 0}/{u.progress?.totalLessons || 0}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.82rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Clock size={13} style={{ color: 'var(--text-secondary)' }} />
                                                    {u.progress?.learningTime || 0}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.82rem' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Video size={13} style={{ color: '#6366f1' }} />
                                                    {u.progress?.videosWatched || 0}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                {u.progress?.documentsOpened || 0}
                                            </td>
                                            <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button className="btn-icon-only" onClick={() => setSelectedUser(u)} title="View">
                                                        <Eye size={14} />
                                                    </button>
                                                    <button className="btn-icon-only" onClick={() => openEdit(u)} title="Edit role/plan">
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button className="btn-icon-only" onClick={() => handleDelete(u)} title="Delete" style={{ color: 'var(--error)' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                Showing {filtered.length} of {users.length} users
            </div>

            {/* Edit Role/Plan Modal */}
            {editUser && (
                <div className="modal-overlay" onClick={() => setEditUser(null)}>
                    <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit: {editUser.displayName}</h3>
                            <button className="btn-icon-only" onClick={() => setEditUser(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Role</label>
                                    <select className="input" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                                        <option value="user">User</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="instructor">Instructor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Subscription Plan</label>
                                    <select className="input" value={editForm.plan} onChange={e => setEditForm(f => ({ ...f, plan: e.target.value }))}>
                                        <option value="free">Free</option>
                                        <option value="premium">Premium</option>
                                        <option value="pro">Pro</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Billing Cycle</label>
                                    <select className="input" value={editForm.billingCycle} onChange={e => setEditForm(f => ({ ...f, billingCycle: e.target.value }))}>
                                        <option value="none">None</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditUser(null)}>Cancel</button>
                                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving} onClick={handleSaveEdit}>
                                        {saving ? <><Loader2 size={14} className="spin" /> Saving...</> : <><Check size={14} /> Save</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="modal-content" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
                                    background: 'linear-gradient(135deg, #3aaa6a, #2d8a55)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: '1.2rem', fontWeight: 800,
                                }}>
                                    {selectedUser.photoURL
                                        ? <img src={selectedUser.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : (selectedUser.displayName || 'U')[0].toUpperCase()
                                    }
                                </div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{selectedUser.displayName}</h3>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedUser.email}</div>
                                </div>
                            </div>
                            <button className="btn-icon-only" onClick={() => setSelectedUser(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {/* Badges row */}
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                                <span className={`badge ${(ROLE_BADGE[selectedUser.role || 'user']).cls}`}>{selectedUser.role || 'user'}</span>
                                <span className={`badge ${(PLAN_BADGE[selectedUser.subscription?.plan || 'free']).cls}`}>
                                    {selectedUser.subscription?.plan || 'free'}
                                </span>
                                {selectedUser.city && <span className="badge badge-gray">{selectedUser.city}</span>}
                                {selectedUser.gender && <span className="badge badge-gray">{selectedUser.gender}</span>}
                                {selectedUser.age && <span className="badge badge-gray">{selectedUser.age} y/o</span>}
                            </div>

                            {/* Progress stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
                                {[
                                    { icon: Trophy, label: 'Points', value: selectedUser.points || 0, color: '#f59e0b' },
                                    { icon: BookOpen, label: 'Lessons Done', value: `${selectedUser.progress?.completedLessons || 0} / ${selectedUser.progress?.totalLessons || 0}`, color: 'var(--green)' },
                                    { icon: Clock, label: 'Learning Time', value: `${selectedUser.progress?.learningTime || 0} min`, color: '#6366f1' },
                                    { icon: Video, label: 'Videos Watched', value: selectedUser.progress?.videosWatched || 0, color: '#06b6d4' },
                                    { icon: Star, label: 'Docs Opened', value: selectedUser.progress?.documentsOpened || 0, color: '#f59e0b' },
                                    { icon: Clock, label: 'Usage Time', value: `${selectedUser.progress?.usageTime || 0} min`, color: '#8b5cf6' },
                                ].map(({ icon: Icon, label, value, color }) => (
                                    <div key={label} className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
                                        <Icon size={18} style={{ color, marginBottom: 4 }} />
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dark)' }}>{value}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Profile fields */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.82rem' }}>
                                {[
                                    ['Email', selectedUser.email],
                                    ['Phone', selectedUser.phone],
                                    ['Nickname', selectedUser.nickname],
                                    ['School', selectedUser.schoolName],
                                    ['Study Location', selectedUser.studyLocation],
                                    ['Birthday', selectedUser.birthday ? new Date(selectedUser.birthday).toLocaleDateString() : null],
                                    ['Subscription Plan', selectedUser.subscription?.plan],
                                    ['Billing Cycle', selectedUser.subscription?.billingCycle],
                                    ['Sub Expires', selectedUser.subscription?.expiresAt ? new Date(selectedUser.subscription.expiresAt).toLocaleDateString() : null],
                                    ['Affiliate Code', selectedUser.affiliateCode],
                                    ['Referred By', selectedUser.referredBy],
                                    ['Joined', selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : null],
                                    ['Contributions', selectedUser.contributionCount?.count],
                                    ['Saved News', selectedUser.progress?.savedNews?.length],
                                    ['Saved Lessons', selectedUser.progress?.lessons?.length],
                                    ['Notifications', selectedUser.settings?.notifications ? 'On' : 'Off'],
                                    ['Theme', selectedUser.settings?.theme],
                                ].filter(([, v]) => v != null && v !== '').map(([key, val]) => (
                                    <div key={key}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{key}</div>
                                        <div style={{ color: 'var(--dark)', marginTop: 2 }}>{String(val)}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Selected Path */}
                            {selectedUser.selectedPath && (
                                <div style={{ marginTop: 16 }}>
                                    <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Selected Learning Path</div>
                                    <div className="card" style={{ padding: '0.75rem', fontSize: '0.8rem', background: 'var(--green-50)', borderColor: 'var(--green)' }}>
                                        School: {selectedUser.selectedPath.schoolId} &nbsp;·&nbsp;
                                        Level: {selectedUser.selectedPath.levelId} &nbsp;·&nbsp;
                                        Guidance: {selectedUser.selectedPath.guidanceId}
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

export default UsersPage;
