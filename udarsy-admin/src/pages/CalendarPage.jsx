import { useState, useEffect } from 'react';
import { Calendar, Loader2, Plus, Edit3, Trash2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function CalendarPage() {
    const { token } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [form, setForm] = useState({ title: '', description: '', date: '', type: 'event' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchEvents(); }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/calendar/events`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setEvents(Array.isArray(data) ? data : data.events || []);
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const method = editingEvent ? 'PUT' : 'POST';
            const url = editingEvent
                ? `${API}/calendar/events/${editingEvent._id}`
                : `${API}/calendar/events`;
            await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            setShowForm(false);
            setEditingEvent(null);
            setForm({ title: '', description: '', date: '', type: 'event' });
            fetchEvents();
        } catch (err) {
            console.error('Save error:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this event?')) return;
        try {
            await fetch(`${API}/calendar/events/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            setEvents(prev => prev.filter(e => e._id !== id));
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const openEdit = (event) => {
        setEditingEvent(event);
        setForm({
            title: event.title || '',
            description: event.description || '',
            date: event.date ? event.date.split('T')[0] : '',
            type: event.type || 'event',
        });
        setShowForm(true);
    };

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark)' }}>Global Events</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Manage calendar events and announcements
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={async () => {
                        try {
                            const res = await fetch(`${API}/calendar/global/seed-holidays`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                            if (res.ok) { alert('Holidays seeded successfully!'); fetchEvents(); }
                            else { alert('Failed to seed holidays'); }
                        } catch (e) { alert('Error seeding holidays'); }
                    }} className="btn btn-sm" style={{ backgroundColor: 'var(--blue)', color: 'white' }}>
                        Seed Holidays
                    </button>
                    <button onClick={() => { setShowForm(true); setEditingEvent(null); setForm({ title: '', description: '', date: '', type: 'event' }); }}
                        className="btn btn-primary btn-sm">
                        <Plus size={15} /> Add Event
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Loader2 size={24} className="spin" style={{ color: 'var(--green)' }} />
                        <div style={{ marginTop: 8, fontSize: '0.85rem' }}>Loading events...</div>
                    </div>
                ) : events.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <Calendar size={32} style={{ color: 'var(--border)', marginBottom: 8 }} />
                        <div>No events scheduled</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event, i) => (
                                <tr key={event._id || i}>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{event.title || 'Untitled'}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {event.description || ''}
                                        </div>
                                    </td>
                                    <td><span className="badge badge-blue">{event.type || 'event'}</span></td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        <Clock size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                        {event.date ? new Date(event.date).toLocaleDateString() : '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn-icon-only" onClick={() => openEdit(event)} title="Edit">
                                                <Edit3 size={14} />
                                            </button>
                                            <button className="btn-icon-only" onClick={() => handleDelete(event._id)} title="Delete"
                                                style={{ color: 'var(--error)' }}>
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

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingEvent ? 'Edit Event' : 'New Event'}</h3>
                            <button className="btn-icon-only" onClick={() => setShowForm(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Title</label>
                                    <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Event title" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Description</label>
                                    <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Event description" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Date</label>
                                        <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Type</label>
                                        <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                            <option value="event">Event</option>
                                            <option value="holiday">Holiday</option>
                                            <option value="exam">Exam Period</option>
                                            <option value="announcement">Announcement</option>
                                        </select>
                                    </div>
                                </div>
                                <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.title} style={{ justifyContent: 'center' }}>
                                    {saving ? <><Loader2 size={15} className="spin" /> Saving...</> : editingEvent ? 'Update Event' : 'Create Event'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CalendarPage;
