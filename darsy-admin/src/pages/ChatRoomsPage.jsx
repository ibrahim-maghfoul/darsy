import { useState, useEffect } from 'react';
import { MessageSquare, Loader2, Users, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ChatRoomsPage() {
    const { token } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchRooms(); }, []);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/chat/rooms`, { headers });
            const data = await res.json();
            setRooms(Array.isArray(data) ? data : data.rooms || []);
        } catch (err) {
            console.error('Error fetching chat rooms:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteRoom = async (id) => {
        if (!window.confirm('Delete this chat room and all its messages?')) return;
        try {
            const res = await fetch(`${API}/chat/rooms/${id}`, { method: 'DELETE', headers });
            if (res.ok) setRooms(prev => prev.filter(r => r._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark)' }}>Chat Rooms</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Monitor and manage teacher chat rooms
                    </p>
                </div>
                <button onClick={fetchRooms} className="btn btn-outline btn-sm">
                    <Loader2 size={14} className={loading ? 'spin' : ''} /> Refresh
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Loader2 size={24} className="spin" style={{ color: 'var(--green)' }} />
                        <div style={{ marginTop: 8, fontSize: '0.85rem' }}>Loading rooms...</div>
                    </div>
                ) : rooms.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <MessageSquare size={32} style={{ color: 'var(--border)', marginBottom: 8 }} />
                        <div>No chat rooms created yet</div>
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
                            {rooms.map((room) => (
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
                                        <button
                                            className="btn-icon-only"
                                            title="Delete room"
                                            style={{ color: '#dc2626' }}
                                            onClick={() => deleteRoom(room._id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default ChatRoomsPage;
