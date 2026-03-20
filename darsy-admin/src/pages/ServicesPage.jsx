import { useState, useEffect } from 'react';
import { Star, Loader2, Plus, Edit3, Trash2, X, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EMPTY_FORM = { title: '', description: '', icon: 'school', category: 'other', externalUrl: '', isActive: true, order: 0 };

function ServicesPage() {
    const { token } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editService, setEditService] = useState(null); // null = closed, {} = new, {...} = editing
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    useEffect(() => { fetchServices(); }, []);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/data/school-services`, { headers });
            const data = await res.json();
            setServices(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching services:', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setEditService({});
    };

    const openEdit = (s) => {
        setForm({
            title: s.title || '',
            description: s.description || '',
            icon: s.icon || 'school',
            category: s.category || 'other',
            externalUrl: s.externalUrl || '',
            isActive: s.isActive !== false,
            order: s.order || 0,
        });
        setEditService(s);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const isNew = !editService._id;
            const url = isNew ? `${API}/data/school-services` : `${API}/data/school-services/${editService._id}`;
            const method = isNew ? 'POST' : 'PUT';
            const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
            if (res.ok) {
                const saved = await res.json();
                if (isNew) {
                    setServices(prev => [saved, ...prev]);
                } else {
                    setServices(prev => prev.map(s => s._id === saved._id ? saved : s));
                }
                setEditService(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this service?')) return;
        try {
            const res = await fetch(`${API}/data/school-services/${id}`, { method: 'DELETE', headers });
            if (res.ok) setServices(prev => prev.filter(s => s._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark)' }}>Services</h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        Manage platform services and features
                    </p>
                </div>
                <button className="btn btn-sm" style={{ background: 'var(--green)', color: 'white', border: 'none' }} onClick={openCreate}>
                    <Plus size={14} /> New Service
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Loader2 size={24} className="spin" style={{ color: 'var(--green)' }} />
                        <div style={{ marginTop: 8, fontSize: '0.85rem' }}>Loading services...</div>
                    </div>
                ) : services.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <Star size={32} style={{ color: 'var(--border)', marginBottom: 8 }} />
                        <div>No services found.</div>
                        <button className="btn btn-sm" style={{ marginTop: 12, background: 'var(--green)', color: 'white', border: 'none' }} onClick={openCreate}>
                            <Plus size={14} /> Create First Service
                        </button>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Service</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((s) => (
                                <tr key={s._id}>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: 50 }}>{s.order}</td>
                                    <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.title}</td>
                                    <td>
                                        <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>{s.category}</span>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {s.description || '—'}
                                    </td>
                                    <td>
                                        <span className={`badge ${s.isActive !== false ? 'badge-green' : 'badge-gray'}`}>
                                            {s.isActive !== false ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn-icon-only" title="Edit" onClick={() => openEdit(s)}>
                                                <Edit3 size={14} />
                                            </button>
                                            <button className="btn-icon-only" title="Delete" style={{ color: '#dc2626' }} onClick={() => handleDelete(s._id)}>
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

            {/* Create / Edit Modal */}
            {editService !== null && (
                <div className="modal-overlay" onClick={() => setEditService(null)}>
                    <div className="modal-content" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editService._id ? 'Edit Service' : 'New Service'}</h3>
                            <button className="btn-icon-only" onClick={() => setEditService(null)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gap: 14 }}>
                                <div>
                                    <label className="form-label">Title *</label>
                                    <input
                                        className="form-input"
                                        value={form.title}
                                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                        placeholder="Service title"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Description *</label>
                                    <textarea
                                        className="form-input"
                                        value={form.description}
                                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Short description"
                                        rows={3}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label className="form-label">Category</label>
                                        <select
                                            className="form-input"
                                            value={form.category}
                                            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                        >
                                            <option value="vacation">Vacation</option>
                                            <option value="registration">Registration</option>
                                            <option value="orientation">Orientation</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Order</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={form.order}
                                            onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="form-label">Icon (name or URL)</label>
                                    <input
                                        className="form-input"
                                        value={form.icon}
                                        onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                                        placeholder="school"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">External URL</label>
                                    <input
                                        className="form-input"
                                        value={form.externalUrl}
                                        onChange={e => setForm(p => ({ ...p, externalUrl: e.target.value }))}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={form.isActive}
                                        onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                                    />
                                    <label htmlFor="isActive" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Active (visible to users)</label>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline btn-sm" onClick={() => setEditService(null)}>Cancel</button>
                            <button
                                className="btn btn-sm"
                                style={{ background: 'var(--green)', color: 'white', border: 'none' }}
                                onClick={handleSave}
                                disabled={saving || !form.title || !form.description}
                            >
                                {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                                {saving ? 'Saving...' : 'Save Service'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ServicesPage;
