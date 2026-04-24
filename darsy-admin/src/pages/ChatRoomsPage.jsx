import { useState, useEffect } from 'react';
import { MessageSquare, Loader2, Users, Trash2, GraduationCap, RefreshCw, Hash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ChatRoomsPage() {
    const { token } = useAuth();
    const [tab, setTab] = useState('guidance'); // 'guidance' | 'teacher'

    // Guidance rooms (general chat)
    const [guidanceRooms, setGuidanceRooms] = useState([]);
    const [guidanceLoading, setGuidanceLoading] = useState(true);

    // Teacher-created rooms
    const [teacherRooms, setTeacherRooms] = useState([]);
    const [teacherLoading, setTeacherLoading] = useState(true);

    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => { fetchGuidanceRooms(); fetchTeacherRooms(); }, []);

    const fetchGuidanceRooms = async () => {
        setGuidanceLoading(true);
        try {
            const res = await fetch(`${API}/chat/rooms`, { headers });
            const data = await res.json();
            setGuidanceRooms(Array.isArray(data) ? data : data.rooms || []);
        } catch (err) { console.error(err); }
        finally { setGuidanceLoading(false); }
    };

    const fetchTeacherRooms = async () => {
        setTeacherLoading(true);
        try {
            const res = await fetch(`${API}/teacher/rooms/admin/all`, { headers });
            const data = await res.json();
            setTeacherRooms(Array.isArray(data) ? data : []);
        } catch (err) { console.error(err); }
        finally { setTeacherLoading(false); }
    };

    const deleteGuidanceRoom = async (id) => {
        if (!window.confirm('Delete this guidance chat room and all its messages?')) return;
        try {
            const res = await fetch(`${API}/chat/rooms/${id}`, { method: 'DELETE', headers });
            if (res.ok) setGuidanceRooms(prev => prev.filter(r => r._id !== id));
        } catch (err) { console.error(err); }
    };

    const deleteTeacherRoom = async (id) => {
        if (!window.confirm('Delete this teacher room and all its messages?')) return;
        try {
            const res = await fetch(`${API}/teacher/rooms/admin/${id}`, { method: 'DELETE', headers });
            if (res.ok) setTeacherRooms(prev => prev.filter(r => r._id !== id));
        } catch (err) { console.error(err); }
    };

    const loading = tab === 'guidance' ? guidanceLoading : teacherLoading;

    return (
        <div className="animate-fade">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark)' }}>Chat Rooms</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Monitor and manage all chat rooms
                    </p>
                </div>
                <button onClick={tab === 'guidance' ? fetchGuidanceRooms : fetchTeacherRooms} className="btn btn-outline btn-sm">
                    <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
                </button>
            </div>

            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                    onClick={() => setTab('guidance')}
                    className="btn btn-sm"
                    style={{
                        background: tab === 'guidance' ? 'var(--green)' : 'var(--surface)',
                        color: tab === 'guidance' ? 'white' : 'var(--text-secondary)',
                        border: `1px solid ${tab === 'guidance' ? 'var(--green)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <MessageSquare size={13} />
                    Guidance Rooms ({guidanceRooms.length})
                </button>
                <button
                    onClick={() => setTab('teacher')}
                    className="btn btn-sm"
                    style={{
                        background: tab === 'teacher' ? '#6366f1' : 'var(--surface)',
                        color: tab === 'teacher' ? 'white' : 'var(--text-secondary)',
                        border: `1px solid ${tab === 'teacher' ? '#6366f1' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    <GraduationCap size={13} />
                    Teacher Rooms ({teacherRooms.length})
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Loader2 size={24} className="spin" style={{ color: 'var(--green)' }} />
                        <div style={{ marginTop: 8, fontSize: '0.85rem' }}>Loading rooms...</div>
                    </div>
                ) : tab === 'guidance' ? (
                    guidanceRooms.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            <MessageSquare size={32} style={{ color: 'var(--border)', marginBottom: 8 }} />
                            <div>No guidance chat rooms created yet</div>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Room Key</th>
                                    <th>Guidance / Level</th>
                                    <th>Participants</th>
                                    <th>Messages</th>
                                    <th>Last Activity</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {guidanceRooms.map((room) => (
                                    <tr key={room._id}>
                                        <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>{room.roomKey}</td>
                                        <td style={{ fontSize: '0.82rem' }}>
                                            <div>{room.guidance}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{room.level}</div>
                                        </td>
                                        <td>
                                            <span className="badge badge-green">
                                                <Users size={11} /> {room.participants?.length || 0}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.82rem' }}>{room.messageCount || 0}</td>
                                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            {room.lastMessageAt
                                                ? new Date(room.lastMessageAt).toLocaleDateString()
                                                : room.createdAt ? new Date(room.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td>
                                            <button className="btn-icon-only" title="Delete room" style={{ color: '#dc2626' }} onClick={() => deleteGuidanceRoom(room._id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    teacherRooms.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            <GraduationCap size={32} style={{ color: 'var(--border)', marginBottom: 8 }} />
                            <div>No teacher rooms created yet</div>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Room Name</th>
                                    <th>Teacher</th>
                                    <th>Code</th>
                                    <th>Members</th>
                                    <th>Status</th>
                                    <th>Last Activity</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teacherRooms.map((room) => (
                                    <tr key={room._id}>
                                        <td>
                                            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{room.name}</div>
                                            {room.description && (
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                                    {room.description.slice(0, 50)}{room.description.length > 50 ? '…' : ''}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.82rem' }}>
                                            <div style={{ fontWeight: 600 }}>{room.teacherId?.displayName || '—'}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{room.teacherId?.email || ''}</div>
                                        </td>
                                        <td>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px' }}>
                                                <Hash size={11} />{room.roomCode}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge badge-green">
                                                <Users size={11} /> {room.members?.length || 0} / {room.maxMembers}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${room.isActive ? 'badge-green' : 'badge-gray'}`}>
                                                {room.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            {room.lastMessageAt
                                                ? new Date(room.lastMessageAt).toLocaleDateString()
                                                : room.createdAt ? new Date(room.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td>
                                            <button className="btn-icon-only" title="Delete room" style={{ color: '#dc2626' }} onClick={() => deleteTeacherRoom(room._id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </div>
        </div>
    );
}

export default ChatRoomsPage;
