import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    ChevronRight, Plus, Edit3, Trash2, Loader2, BookOpen, Save,
    X, FileText, Video, Dumbbell, GraduationCap, ArrowLeft, FolderOpen,
    ExternalLink, BookMarked, Eye
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Auto-generate a string ID from a title
const makeId = (title) =>
    title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/(^-|-$)/g, '')
    + '-' + Math.random().toString(36).slice(2, 7);

const RESOURCE_TABS = [
    { key: 'coursesPdf', label: 'PDFs', icon: FileText, color: '#e74c3c' },
    { key: 'videos', label: 'Videos', icon: Video, color: '#3498db' },
    { key: 'exercices', label: 'Exercises', icon: Dumbbell, color: '#f39c12' },
    { key: 'exams', label: 'Exams', icon: GraduationCap, color: '#9b59b6' },
];

function CurriculumPage() {
    const { token } = useAuth();
    const hdrs = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Drill-down path: each entry = { type, id, title }
    // types: school, level, guidance, subject
    const [path, setPath] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [editModal, setEditModal] = useState(null);   // { type, item }
    const [createModal, setCreateModal] = useState(null); // { type, parentId }
    const [lessonView, setLessonView] = useState(null);   // full lesson object (editing)
    const [saving, setSaving] = useState(false);

    // Fetch items for current path depth
    const fetchItems = async (p = path) => {
        setLoading(true);
        try {
            const depth = p.length;
            let url;
            if (depth === 0) url = '/data/schools';
            else if (depth === 1) url = `/data/levels/${p[0].id}`;
            else if (depth === 2) url = `/data/guidances/${p[1].id}`;
            else if (depth === 3) url = `/data/subjects/${p[2].id}`;
            else if (depth === 4) url = `/data/lessons/${p[3].id}`;
            const res = await fetch(`${API}${url}`, { headers: hdrs });
            const data = await res.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    const navigate = (item) => {
        if (path.length === 4) {
            // Clicking a lesson → open lesson editor
            openLessonView(item);
            return;
        }
        const types = ['school', 'level', 'guidance', 'subject'];
        const newPath = [...path, { type: types[path.length], id: item._id, title: item.title }];
        setPath(newPath);
        fetchItems(newPath);
    };

    const goTo = (idx) => {
        if (idx < 0) {
            setPath([]);
            fetchItems([]);
            return;
        }
        const newPath = path.slice(0, idx + 1);
        setPath(newPath);
        fetchItems(newPath);
    };

    // ─── Create ────────────────────────────────────────────────────────────────
    const typeAtDepth = () => ['school', 'level', 'guidance', 'subject', 'lesson'][path.length];

    const openCreate = () => {
        const parentId = path.length > 0 ? path[path.length - 1].id : null;
        setCreateModal({ type: typeAtDepth(), parentId, form: getEmptyForm(typeAtDepth()) });
    };

    const getEmptyForm = (type) => {
        if (type === 'school') return { title: '', category: '' };
        if (type === 'lesson') return { title: '', coursesPdf: [], videos: [], exercices: [], exams: [] };
        return { title: '' };
    };

    const handleCreate = async () => {
        setSaving(true);
        const { type, parentId, form } = createModal;
        try {
            const body = { ...form, _id: makeId(form.title) };
            if (type === 'level') body.schoolId = parentId;
            if (type === 'guidance') body.levelId = parentId;
            if (type === 'subject') body.guidanceId = parentId;
            if (type === 'lesson') body.subjectId = parentId;

            const endpoints = { school: '/data/schools', level: '/data/levels', guidance: '/data/guidances', subject: '/data/subjects', lesson: '/data/lessons' };
            const res = await fetch(`${API}${endpoints[type]}`, { method: 'POST', headers: hdrs, body: JSON.stringify(body) });
            if (res.ok) {
                setCreateModal(null);
                fetchItems();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create');
            }
        } catch (e) {
            alert('Error: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    // ─── Edit ──────────────────────────────────────────────────────────────────
    const openEdit = (e, item) => {
        e.stopPropagation();
        const type = typeAtDepth();
        let form;
        if (type === 'school') form = { title: item.title, category: item.category || '' };
        else if (type === 'subject') form = { title: item.title, imageUrl: item.imageUrl || '' };
        else form = { title: item.title };
        setEditModal({ type, item, form });
    };

    const handleEdit = async () => {
        setSaving(true);
        const { type, item, form } = editModal;
        const endpoints = { school: '/data/schools', level: '/data/levels', guidance: '/data/guidances', subject: '/data/subjects', lesson: '/data/lessons' };
        try {
            const res = await fetch(`${API}${endpoints[type]}/${item._id}`, {
                method: 'PUT', headers: hdrs, body: JSON.stringify(form)
            });
            if (res.ok) {
                setEditModal(null);
                fetchItems();
                // Also update breadcrumb if editing a parent
                const pathTypes = ['school', 'level', 'guidance', 'subject'];
                const idx = path.findIndex(p => p.id === item._id);
                if (idx !== -1) {
                    setPath(prev => prev.map((p, i) => i === idx ? { ...p, title: form.title } : p));
                }
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to update');
            }
        } catch (e) {
            alert('Error: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    // ─── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async (e, item) => {
        e.stopPropagation();
        const typeName = typeAtDepth();
        if (!window.confirm(`Delete "${item.title}"? This may also delete child items.`)) return;
        const endpoints = { school: '/data/schools', level: '/data/levels', guidance: '/data/guidances', subject: '/data/subjects', lesson: '/data/lessons' };
        try {
            const res = await fetch(`${API}${endpoints[typeName]}/${item._id}`, { method: 'DELETE', headers: hdrs });
            if (res.ok) {
                setItems(prev => prev.filter(i => i._id !== item._id));
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to delete');
            }
        } catch (e) {
            alert('Error: ' + e.message);
        }
    };

    // ─── Lesson Editor ─────────────────────────────────────────────────────────
    const openLessonView = async (lesson) => {
        setLessonTab('coursesPdf');
        try {
            const res = await fetch(`${API}/data/lesson/${lesson._id}`, { headers: hdrs });
            const full = await res.json();
            setLessonView(JSON.parse(JSON.stringify(full)));
        } catch {
            setLessonView({ ...lesson });
        }
    };

    const saveLessonView = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API}/data/lessons/${lessonView._id}`, {
                method: 'PUT',
                headers: hdrs,
                body: JSON.stringify({
                    title: lessonView.title,
                    coursesPdf: lessonView.coursesPdf || [],
                    videos: lessonView.videos || [],
                    exercices: lessonView.exercices || [],
                    exams: lessonView.exams || [],
                }),
            });
            if (res.ok) {
                setLessonView(null);
                fetchItems();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save');
            }
        } catch (e) {
            alert('Error: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const addResource = (tab) => {
        setLessonView(prev => ({
            ...prev,
            [tab]: [...(prev[tab] || []), { title: '', url: '' }]
        }));
    };

    const updateResource = (tab, idx, field, value) => {
        setLessonView(prev => {
            const arr = [...(prev[tab] || [])];
            arr[idx] = { ...arr[idx], [field]: value };
            return { ...prev, [tab]: arr };
        });
    };

    const removeResource = (tab, idx) => {
        setLessonView(prev => ({
            ...prev,
            [tab]: (prev[tab] || []).filter((_, i) => i !== idx)
        }));
    };

    // Lesson resource tab (must be top-level to comply with rules of hooks)
    const [lessonTab, setLessonTab] = useState('coursesPdf');

    // ─── Labels ────────────────────────────────────────────────────────────────
    const labelAt = (depth) => ['Schools', 'Levels', 'Guidances', 'Subjects', 'Lessons'][depth];
    const singularAt = (depth) => ['School', 'Level', 'Guidance', 'Subject', 'Lesson'][depth];

    const iconColor = ['#3aaa6a', '#3498db', '#9b59b6', '#f39c12', '#e74c3c'][path.length] || '#3aaa6a';

    // ─── Lesson Resource Editor View ───────────────────────────────────────────
    if (lessonView) {
        const activeTab = lessonTab;
        const setActiveTabLocal = setLessonTab;
        const tab = RESOURCE_TABS.find(t => t.key === activeTab);

        return (
            <div className="animate-fade">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setLessonView(null)}
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                    <div style={{ flex: 1 }}>
                        <input
                            value={lessonView.title}
                            onChange={e => setLessonView(p => ({ ...p, title: e.target.value }))}
                            style={{
                                fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark)',
                                border: 'none', background: 'transparent', outline: 'none',
                                borderBottom: '2px solid var(--green)', paddingBottom: 2, width: '100%'
                            }}
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                            ID: {lessonView._id}
                        </div>
                    </div>
                    <button
                        className="btn btn-sm"
                        style={{ background: 'var(--green)', color: 'white', border: 'none' }}
                        onClick={saveLessonView}
                        disabled={saving}
                    >
                        {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                        {saving ? 'Saving...' : 'Save Lesson'}
                    </button>
                </div>

                {/* Resource Tabs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                    {RESOURCE_TABS.map(t => {
                        const count = (lessonView[t.key] || []).length;
                        return (
                            <button
                                key={t.key}
                                onClick={() => setActiveTabLocal(t.key)}
                                className="btn btn-sm"
                                style={{
                                    background: activeTab === t.key ? t.color : 'var(--surface)',
                                    color: activeTab === t.key ? 'white' : 'var(--text-secondary)',
                                    border: `1px solid ${activeTab === t.key ? t.color : 'var(--border)'}`,
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}
                            >
                                <t.icon size={13} />
                                {t.label} ({count})
                            </button>
                        );
                    })}
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--dark)' }}>
                            {tab.label}
                        </div>
                        <button
                            className="btn btn-sm"
                            style={{ background: tab.color, color: 'white', border: 'none' }}
                            onClick={() => addResource(activeTab)}
                        >
                            <Plus size={13} /> Add {tab.label.slice(0, -1)}
                        </button>
                    </div>

                    {(lessonView[activeTab] || []).length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            No {tab.label.toLowerCase()} yet. Click "Add" to add one.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {(lessonView[activeTab] || []).map((res, idx) => (
                                <div key={idx} style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr auto',
                                    gap: 10, alignItems: 'center',
                                    padding: '10px 12px', background: 'var(--background)',
                                    borderRadius: 8, border: '1px solid var(--border)'
                                }}>
                                    <input
                                        className="form-input"
                                        placeholder="Title"
                                        value={res.title}
                                        onChange={e => updateResource(activeTab, idx, 'title', e.target.value)}
                                    />
                                    <input
                                        className="form-input"
                                        placeholder="URL"
                                        value={res.url}
                                        onChange={e => updateResource(activeTab, idx, 'url', e.target.value)}
                                    />
                                    <button
                                        className="btn-icon-only"
                                        style={{ color: '#dc2626', flexShrink: 0 }}
                                        onClick={() => removeResource(activeTab, idx)}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── Main Drill-Down View ──────────────────────────────────────────────────
    return (
        <div className="animate-fade">
            {/* Header + Breadcrumb */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--dark)' }}>
                        Curriculum
                    </h2>
                    <button
                        className="btn btn-sm"
                        style={{ background: 'var(--green)', color: 'white', border: 'none' }}
                        onClick={openCreate}
                    >
                        <Plus size={14} /> New {singularAt(path.length)}
                    </button>
                </div>

                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    <button
                        onClick={() => goTo(-1)}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: path.length === 0 ? 'var(--green)' : 'var(--text-secondary)',
                            fontWeight: path.length === 0 ? 700 : 500, fontSize: '0.82rem', padding: '2px 4px'
                        }}
                    >
                        Schools
                    </button>
                    {path.map((p, i) => (
                        <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ChevronRight size={12} style={{ color: 'var(--border)' }} />
                            <button
                                onClick={() => goTo(i)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: i === path.length - 1 ? 'var(--green)' : 'var(--text-secondary)',
                                    fontWeight: i === path.length - 1 ? 700 : 500, fontSize: '0.82rem', padding: '2px 4px',
                                    maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                }}
                            >
                                {p.title}
                            </button>
                        </span>
                    ))}
                </div>

                {/* Current level label */}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Showing {labelAt(path.length)}
                    {path.length > 0 && ` in "${path[path.length - 1].title}"`}
                </div>
            </div>

            {/* Items Grid */}
            {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Loader2 size={24} className="spin" style={{ color: 'var(--green)' }} />
                    <div style={{ marginTop: 8, fontSize: '0.85rem' }}>Loading {labelAt(path.length).toLowerCase()}...</div>
                </div>
            ) : items.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <FolderOpen size={40} style={{ color: 'var(--border)', marginBottom: 12 }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>No {labelAt(path.length).toLowerCase()} found</div>
                    <button
                        className="btn btn-sm"
                        style={{ marginTop: 12, background: 'var(--green)', color: 'white', border: 'none' }}
                        onClick={openCreate}
                    >
                        <Plus size={13} /> Create First {singularAt(path.length)}
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: path.length === 4
                        ? 'repeat(auto-fill, minmax(200px, 1fr))'
                        : 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 12
                }}>
                    {items.map(item => (
                        <ItemCard
                            key={item._id}
                            item={item}
                            depth={path.length}
                            iconColor={iconColor}
                            onNavigate={() => navigate(item)}
                            onEdit={(e) => openEdit(e, item)}
                            onDelete={(e) => handleDelete(e, item)}
                        />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {createModal && (
                <CrudModal
                    title={`New ${singularAt(path.length)}`}
                    type={createModal.type}
                    form={createModal.form}
                    setForm={(f) => setCreateModal(p => ({ ...p, form: typeof f === 'function' ? f(p.form) : f }))}
                    saving={saving}
                    onSave={handleCreate}
                    onClose={() => setCreateModal(null)}
                />
            )}

            {/* Edit Modal */}
            {editModal && (
                <CrudModal
                    title={`Edit ${singularAt(path.length)}`}
                    type={editModal.type}
                    form={editModal.form}
                    setForm={(f) => setEditModal(p => ({ ...p, form: typeof f === 'function' ? f(p.form) : f }))}
                    saving={saving}
                    onSave={handleEdit}
                    onClose={() => setEditModal(null)}
                    isEdit
                />
            )}
        </div>
    );
}

// ─── Item Card ─────────────────────────────────────────────────────────────────
function ItemCard({ item, depth, iconColor, onNavigate, onEdit, onDelete }) {
    const icons = [BookOpen, BookOpen, BookOpen, BookOpen, FileText];
    const Icon = icons[depth] || BookOpen;

    const resourceCount = depth === 4
        ? [
            (item.coursesPdf?.length || 0) + ' PDFs',
            (item.videos?.length || 0) + ' Videos',
            (item.exercices?.length || 0) + ' Exercises',
          ].filter(s => !s.startsWith('0')).join(' · ') || 'No resources'
        : null;

    return (
        <div
            onClick={onNavigate}
            style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                position: 'relative',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = iconColor; e.currentTarget.style.boxShadow = `0 2px 12px ${iconColor}22`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: iconColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Icon size={16} style={{ color: iconColor }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.title}
                        </div>
                        {item.category && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 1 }}>{item.category}</div>
                        )}
                        {resourceCount && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 1 }}>{resourceCount}</div>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button
                        className="btn-icon-only"
                        style={{ color: 'var(--text-secondary)', padding: 4 }}
                        onClick={onEdit}
                        title="Edit"
                    >
                        <Edit3 size={13} />
                    </button>
                    <button
                        className="btn-icon-only"
                        style={{ color: '#ef4444', padding: 4 }}
                        onClick={onDelete}
                        title="Delete"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 8, opacity: 0.6 }}>
                {item._id}
            </div>
        </div>
    );
}

// ─── Create / Edit Modal ───────────────────────────────────────────────────────
function CrudModal({ title, type, form, setForm, saving, onSave, onClose, isEdit }) {
    const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="btn-icon-only" onClick={onClose}><X size={16} /></button>
                </div>
                <div className="modal-body">
                    <div style={{ display: 'grid', gap: 14 }}>
                        <div>
                            <label className="form-label">Title *</label>
                            <input
                                className="form-input"
                                value={form.title}
                                onChange={e => set('title', e.target.value)}
                                placeholder={`${type.charAt(0).toUpperCase() + type.slice(1)} title`}
                                autoFocus
                            />
                        </div>
                        {type === 'school' && (
                            <div>
                                <label className="form-label">Category *</label>
                                <input
                                    className="form-input"
                                    value={form.category || ''}
                                    onChange={e => set('category', e.target.value)}
                                    placeholder="e.g. primary, secondary, college"
                                />
                            </div>
                        )}
                        {type === 'subject' && (
                            <div>
                                <label className="form-label">Image URL</label>
                                <input
                                    className="form-input"
                                    value={form.imageUrl || ''}
                                    onChange={e => set('imageUrl', e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                        )}
                        {!isEdit && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--background)', borderRadius: 6, padding: '8px 10px' }}>
                                A unique ID will be auto-generated from the title.
                            </div>
                        )}
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-sm"
                        style={{ background: 'var(--green)', color: 'white', border: 'none' }}
                        onClick={onSave}
                        disabled={saving || !form.title?.trim()}
                    >
                        {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                        {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Courses Tab ──────────────────────────────────────────────────────────────
function CoursesTab() {
    const { token } = useAuth();
    const hdrs = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const [guidances, setGuidances] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingGuidances, setLoadingGuidances] = useState(true);

    const [selGuidance, setSelGuidance] = useState('');
    const [selSubject, setSelSubject] = useState('');
    const [search, setSearch] = useState('');

    const [editModal, setEditModal] = useState(null); // course object
    const [editForm, setEditForm] = useState({ title: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [viewModal, setViewModal] = useState(null);

    // Load all guidances upfront for the filter
    useEffect(() => {
        const loadGuidances = async () => {
            setLoadingGuidances(true);
            try {
                const schoolsRes = await fetch(`${API}/data/schools`, { headers: hdrs });
                const schools = await schoolsRes.json();
                const allGuidances = [];
                for (const school of (Array.isArray(schools) ? schools : [])) {
                    const levelsRes = await fetch(`${API}/data/levels/${school._id}`, { headers: hdrs });
                    const levels = await levelsRes.json();
                    for (const level of (Array.isArray(levels) ? levels : [])) {
                        const guidRes = await fetch(`${API}/data/guidances/${level._id}`, { headers: hdrs });
                        const guids = await guidRes.json();
                        for (const g of (Array.isArray(guids) ? guids : [])) {
                            allGuidances.push({ ...g, schoolTitle: school.title, levelTitle: level.title });
                        }
                    }
                }
                setGuidances(allGuidances);
            } finally {
                setLoadingGuidances(false);
            }
        };
        loadGuidances();
    }, []);

    // Load subjects when guidance changes
    useEffect(() => {
        if (!selGuidance) { setSubjects([]); setSelSubject(''); return; }
        fetch(`${API}/data/subjects/${selGuidance}`, { headers: hdrs })
            .then(r => r.json())
            .then(d => { setSubjects(Array.isArray(d) ? d : []); setSelSubject(''); });
    }, [selGuidance]);

    // Load courses when filter changes
    useEffect(() => {
        const params = new URLSearchParams();
        if (selGuidance) params.set('guidanceId', selGuidance);
        if (selSubject) params.set('subjectId', selSubject);
        setLoading(true);
        fetch(`${API}/instructor/admin/courses?${params}`, { headers: hdrs })
            .then(r => r.json())
            .then(d => setCourses(Array.isArray(d) ? d : []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selGuidance, selSubject]);

    const openEdit = (course) => {
        setEditForm({ title: course.title, description: course.description || '' });
        setEditModal(course);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API}/instructor/admin/courses/${editModal._id}`, {
                method: 'PUT', headers: hdrs, body: JSON.stringify(editForm),
            });
            if (res.ok) {
                const updated = await res.json();
                setCourses(prev => prev.map(c => c._id === updated._id ? updated : c));
                setEditModal(null);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this course permanently?')) return;
        const res = await fetch(`${API}/instructor/admin/courses/${id}`, { method: 'DELETE', headers: hdrs });
        if (res.ok) setCourses(prev => prev.filter(c => c._id !== id));
    };

    const visible = courses.filter(c =>
        !search || c.title?.toLowerCase().includes(search.toLowerCase())
        || c.instructorId?.displayName?.toLowerCase().includes(search.toLowerCase())
    );

    const selGuidanceObj = guidances.find(g => g._id === selGuidance);

    return (
        <div>
            {/* Filters row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: '1 1 200px', minWidth: 160 }}>
                    <select
                        className="form-input"
                        value={selGuidance}
                        onChange={e => setSelGuidance(e.target.value)}
                        disabled={loadingGuidances}
                    >
                        <option value="">{loadingGuidances ? 'Loading guidances…' : 'All Guidances'}</option>
                        {guidances.map(g => (
                            <option key={g._id} value={g._id}>
                                {g.schoolTitle} › {g.levelTitle} › {g.title}
                            </option>
                        ))}
                    </select>
                </div>
                {selGuidance && (
                    <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                        <select
                            className="form-input"
                            value={selSubject}
                            onChange={e => setSelSubject(e.target.value)}
                        >
                            <option value="">All Subjects</option>
                            {subjects.map(s => (
                                <option key={s._id} value={s._id}>{s.title}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div style={{ flex: '2 1 200px' }}>
                    <input
                        className="form-input"
                        placeholder="Search by title or instructor…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {visible.length} course{visible.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Loader2 size={24} className="spin" style={{ color: 'var(--green)' }} />
                        <div style={{ marginTop: 8, fontSize: '0.85rem' }}>Loading courses…</div>
                    </div>
                ) : visible.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <BookMarked size={36} style={{ color: 'var(--border)', marginBottom: 10 }} />
                        <div>No courses found{selGuidance ? ' for this guidance' : ''}.</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>Instructor</th>
                                <th>Guidance / Subject</th>
                                <th>Type</th>
                                <th>Views</th>
                                <th>Downloads</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map(c => (
                                <tr key={c._id}>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: '0.82rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {c.title}
                                        </div>
                                        {c.description && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {c.description}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                                            {c.instructorId?.displayName || '—'}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                            {c.instructorId?.email || ''}
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        <div>{guidances.find(g => g._id === c.guidanceId)?.title || c.guidanceId}</div>
                                        <div style={{ fontSize: '0.7rem' }}>{subjects.find(s => s._id === c.subjectId)?.title || c.subjectId}</div>
                                    </td>
                                    <td>
                                        {c.videoUrl && <span className="badge badge-blue"><Video size={11} /> Video</span>}
                                        {c.pdfUrl && <span className="badge badge-red"><FileText size={11} /> PDF</span>}
                                        {!c.videoUrl && !c.pdfUrl && <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>—</span>}
                                    </td>
                                    <td style={{ fontSize: '0.82rem' }}>{c.viewCount || 0}</td>
                                    <td style={{ fontSize: '0.82rem' }}>{c.downloadCount || 0}</td>
                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn-icon-only" title="View" onClick={() => setViewModal(c)}>
                                                <Eye size={14} />
                                            </button>
                                            <button className="btn-icon-only" title="Edit" onClick={() => openEdit(c)}>
                                                <Edit3 size={14} />
                                            </button>
                                            <button className="btn-icon-only" title="Delete" style={{ color: '#dc2626' }} onClick={() => handleDelete(c._id)}>
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

            {/* View Modal */}
            {viewModal && (
                <div className="modal-overlay" onClick={() => setViewModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Course Details</h3>
                            <button className="btn-icon-only" onClick={() => setViewModal(null)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gap: 14, fontSize: '0.85rem' }}>
                                <div>
                                    <div className="form-label">Title</div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{viewModal.title}</div>
                                </div>
                                {viewModal.description && (
                                    <div>
                                        <div className="form-label">Description</div>
                                        <div style={{ lineHeight: 1.6 }}>{viewModal.description}</div>
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <div className="form-label">Instructor</div>
                                        <div style={{ fontWeight: 600 }}>{viewModal.instructorId?.displayName || '—'}</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{viewModal.instructorId?.email || ''}</div>
                                    </div>
                                    <div>
                                        <div className="form-label">Stats</div>
                                        <div>{viewModal.viewCount || 0} views · {viewModal.downloadCount || 0} downloads</div>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <div className="form-label">Guidance ID</div>
                                        <div style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>{viewModal.guidanceId}</div>
                                    </div>
                                    <div>
                                        <div className="form-label">Subject ID</div>
                                        <div style={{ fontSize: '0.78rem', wordBreak: 'break-all' }}>{viewModal.subjectId}</div>
                                    </div>
                                </div>
                                {(viewModal.videoUrl || viewModal.pdfUrl) && (
                                    <div>
                                        <div className="form-label">File</div>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                                            {viewModal.videoUrl && (
                                                <a
                                                    href={`${API.replace('/api', '')}/${viewModal.videoUrl}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="btn btn-sm btn-outline"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                                >
                                                    <Video size={13} /> Watch Video <ExternalLink size={11} />
                                                </a>
                                            )}
                                            {viewModal.pdfUrl && (
                                                <a
                                                    href={`${API.replace('/api', '')}/${viewModal.pdfUrl}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="btn btn-sm btn-outline"
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                                                >
                                                    <FileText size={13} /> Open PDF <ExternalLink size={11} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-sm btn-outline" onClick={() => { setViewModal(null); openEdit(viewModal); }}>
                                <Edit3 size={13} /> Edit
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => { handleDelete(viewModal._id); setViewModal(null); }}>
                                <Trash2 size={13} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModal && (
                <div className="modal-overlay" onClick={() => setEditModal(null)}>
                    <div className="modal-content" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Course</h3>
                            <button className="btn-icon-only" onClick={() => setEditModal(null)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gap: 14 }}>
                                <div>
                                    <label className="form-label">Title *</label>
                                    <input
                                        className="form-input"
                                        value={editForm.title}
                                        onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        value={editForm.description}
                                        onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline btn-sm" onClick={() => setEditModal(null)}>Cancel</button>
                            <button
                                className="btn btn-sm"
                                style={{ background: 'var(--green)', color: 'white', border: 'none' }}
                                onClick={handleSave}
                                disabled={saving || !editForm.title?.trim()}
                            >
                                {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />}
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CurriculumPage;
