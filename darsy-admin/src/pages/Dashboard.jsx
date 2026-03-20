import { useState, useEffect, useCallback } from 'react';
import {
    Users, BookOpen, Video, FileText, Newspaper, Heart, MessageSquare,
    GraduationCap, ShieldCheck, TrendingUp, RefreshCw, ChevronRight,
    Clock, CheckCircle, XCircle, AlertCircle, Star, BarChart2,
    Loader2, Eye, Calendar, Layers, School, Search, Edit3, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const COLLECTIONS = [
    { id: 'schools', label: 'Schools', icon: School, endpoint: '/data/schools' },
    { id: 'levels', label: 'Levels', icon: Layers, endpoint: null },
    { id: 'guidances', label: 'Guidances', icon: TrendingUp, endpoint: null },
    { id: 'subjects', label: 'Subjects', icon: BookOpen, endpoint: null },
    { id: 'lessons', label: 'Lessons', icon: FileText, endpoint: null },
    { id: 'exams', label: 'Exams', icon: Calendar, endpoint: null },
];

const StatCard = ({ icon: Icon, label, value, color, sub, onClick, active }) => (
    <div
        className="card animate-fade"
        onClick={onClick}
        style={{
            cursor: onClick ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '1.25rem 1.5rem',
            transition: 'all 0.2s ease',
            borderColor: active ? 'var(--green)' : undefined,
            background: active ? 'var(--green-50)' : undefined,
        }}
        onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = 'var(--green)'; }}
        onMouseLeave={e => { if (onClick && !active) e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
        <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: color || 'var(--green-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
        }}>
            <Icon size={22} style={{ color: color ? 'white' : 'var(--green)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark)', lineHeight: 1.1 }}>
                {value ?? <Loader2 size={20} className="spin" />}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
                {label}
            </div>
            {sub && (
                <div style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 600, marginTop: 2 }}>
                    {sub}
                </div>
            )}
        </div>
    </div>
);

const SectionTitle = ({ icon: Icon, title, action }) => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, marginTop: 32,
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'var(--green-100)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={16} style={{ color: 'var(--green)' }} />
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark)' }}>{title}</h3>
        </div>
        {action}
    </div>
);

const StatusBadge = ({ status }) => {
    const map = {
        pending: { cls: 'badge-amber', icon: Clock },
        approved: { cls: 'badge-green', icon: CheckCircle },
        rejected: { cls: 'badge-red', icon: XCircle },
    };
    const s = map[status] || { cls: 'badge-gray', icon: AlertCircle };
    const SIcon = s.icon;
    return (
        <span className={`badge ${s.cls}`}>
            <SIcon size={11} /> {status}
        </span>
    );
};

function Dashboard() {
    const { token } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    // ── MongoDB data state ───────────────────────────────────────────────────
    const [globalStats, setGlobalStats] = useState(null);
    const [schools, setSchools] = useState([]);
    const [activeSchool, setActiveSchool] = useState(null);
    const [levels, setLevels] = useState([]);
    const [activeLevel, setActiveLevel] = useState(null);
    const [guidances, setGuidances] = useState([]);
    const [activeGuidance, setActiveGuidance] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [activeSubject, setActiveSubject] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [browseLoading, setBrowseLoading] = useState(false);

    // ── Backend API state ────────────────────────────────────────────────────
    const [pendingInstructors, setPendingInstructors] = useState([]);
    const [pendingTeachers, setPendingTeachers] = useState([]);
    const [recentNews, setRecentNews] = useState([]);
    const [recentContributions, setRecentContributions] = useState([]);
    const [totalUsers, setTotalUsers] = useState('—');

    const headers = { Authorization: `Bearer ${token}` };

    const apiFetch = async (url) => {
        const res = await fetch(`${API}${url}`, { headers });
        return res.json();
    };

    // ── Fetch global stats + platform data ───────────────────────────────────
    const fetchAll = async () => {
        try {
            const results = await Promise.allSettled([
                apiFetch('/data/guidance-stats/global'),
                apiFetch('/data/schools'),
                apiFetch('/teacher/applications?status=pending'),
                apiFetch('/teacher/verifications?status=pending'),
                fetch(`${API}/news?limit=5`).then(r => r.json()),
                apiFetch('/data/contributions/recent'),
                apiFetch('/user/all'),
            ]);

            const [stats, sch, instrApps, teacherVers, news, contribs, users] = results;

            if (stats.status === 'fulfilled') setGlobalStats(stats.value);
            if (sch.status === 'fulfilled') setSchools(Array.isArray(sch.value) ? sch.value : []);
            if (instrApps.status === 'fulfilled') setPendingInstructors(Array.isArray(instrApps.value) ? instrApps.value.slice(0, 5) : []);
            if (teacherVers.status === 'fulfilled') setPendingTeachers(Array.isArray(teacherVers.value) ? teacherVers.value.slice(0, 5) : []);
            if (news.status === 'fulfilled') {
                const newsArr = Array.isArray(news.value) ? news.value : news.value?.news || [];
                setRecentNews(newsArr.slice(0, 5));
            }
            if (contribs.status === 'fulfilled') setRecentContributions(Array.isArray(contribs.value) ? contribs.value.slice(0, 5) : []);
            if (users.status === 'fulfilled') {
                const usersArr = Array.isArray(users.value) ? users.value : users.value?.users || [];
                setTotalUsers(usersArr.length);
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchAll();
        setRefreshing(false);
    };

    // ── Curriculum browser ───────────────────────────────────────────────────
    const selectSchool = async (schoolId) => {
        setActiveSchool(schoolId);
        setActiveLevel(null);
        setActiveGuidance(null);
        setActiveSubject(null);
        setLevels([]);
        setGuidances([]);
        setSubjects([]);
        setLessons([]);
        setBrowseLoading(true);
        try {
            const data = await apiFetch(`/data/levels/${schoolId}`);
            setLevels(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        setBrowseLoading(false);
    };

    const selectLevel = async (levelId) => {
        setActiveLevel(levelId);
        setActiveGuidance(null);
        setActiveSubject(null);
        setGuidances([]);
        setSubjects([]);
        setLessons([]);
        setBrowseLoading(true);
        try {
            const data = await apiFetch(`/data/guidances/${levelId}`);
            setGuidances(Array.isArray(data) ? data : []);
            // Auto-select if only "General"
            if (data.length === 1 && data[0].title === 'General') {
                selectGuidance(data[0]._id);
                return;
            }
        } catch (e) { console.error(e); }
        setBrowseLoading(false);
    };

    const selectGuidance = async (guidanceId) => {
        setActiveGuidance(guidanceId);
        setActiveSubject(null);
        setSubjects([]);
        setLessons([]);
        setBrowseLoading(true);
        try {
            const data = await apiFetch(`/data/subjects/${guidanceId}`);
            setSubjects(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        setBrowseLoading(false);
    };

    const selectSubject = async (subjectId) => {
        setActiveSubject(subjectId);
        setLessons([]);
        setBrowseLoading(true);
        try {
            const data = await apiFetch(`/data/lessons/${subjectId}`);
            setLessons(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        setBrowseLoading(false);
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!confirm('Delete this lesson from MongoDB?')) return;
        try {
            await fetch(`${API}/data/lessons/${lessonId}`, { method: 'DELETE', headers });
            setLessons(prev => prev.filter(l => l._id !== lessonId));
        } catch (e) { console.error(e); alert('Error deleting lesson'); }
    };

    // ── Stat values from global stats ────────────────────────────────────────
    const gs = globalStats || {};
    const statValues = gs.levelsStat
        ? gs.levelsStat.reduce((acc, l) => ({
            lessons: acc.lessons + (l.totalLessons || 0),
            videos: acc.videos + (l.totalVideos || 0),
            pdfs: acc.pdfs + (l.totalPdfs || 0),
            subjects: acc.subjects + (l.totalSubjects || 0),
        }), { lessons: 0, videos: 0, pdfs: 0, subjects: 0 })
        : { lessons: gs.totalLessons ?? '—', videos: gs.totalVideos ?? '—', pdfs: gs.totalPdfs ?? '—', subjects: gs.totalSubjects ?? '—' };

    const getResourceCount = (d) => {
        return (d.coursesPdf?.length || 0) + (d.videos?.length || 0) + (d.exercices?.length || 0) + (d.resourses?.length || 0);
    };

    return (
        <div className="animate-fade">
            {/* ── Welcome Banner ──────────────────────────────────────────── */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, #3aaa6a 0%, #2d8a55 50%, #1a6b3d 100%)',
                color: 'white', border: 'none',
                padding: '2rem', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                <div style={{ position: 'absolute', bottom: -60, right: 80, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginBottom: 6 }}>
                        Welcome back, Admin
                    </h1>
                    <p style={{ fontSize: '0.85rem', opacity: 0.85, maxWidth: 500 }}>
                        Here's what's happening with Darsy today. You have{' '}
                        <strong>{pendingInstructors.length} instructor</strong> and{' '}
                        <strong>{pendingTeachers.length} teacher</strong> applications pending review.
                    </p>
                    <button onClick={handleRefresh} className="btn" style={{
                        marginTop: 16, background: 'rgba(255,255,255,0.15)',
                        color: 'white', backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                    }}>
                        <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
                        {refreshing ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>
            </div>

            {/* ── Platform Stats ───────────────────────────────────────────── */}
            <SectionTitle icon={BarChart2} title="Platform Overview" />
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 12,
            }}>
                <StatCard icon={Users} label="Total Users" value={totalUsers} />
                <StatCard icon={School} label="Schools" value={schools.length || '—'} />
                <StatCard icon={BookOpen} label="Subjects" value={statValues.subjects} />
                <StatCard icon={FileText} label="Lessons" value={statValues.lessons} />
                <StatCard icon={Video} label="Videos" value={statValues.videos} />
                <StatCard icon={Newspaper} label="PDFs" value={statValues.pdfs} />
                <StatCard
                    icon={GraduationCap} label="Pending Instructors"
                    value={pendingInstructors.length}
                    sub={pendingInstructors.length > 0 ? 'Needs review' : 'All clear'}
                />
                <StatCard
                    icon={ShieldCheck} label="Pending Teachers"
                    value={pendingTeachers.length}
                    sub={pendingTeachers.length > 0 ? 'Needs review' : 'All clear'}
                />
            </div>

            {/* ── Curriculum Browser (MongoDB) ────────────────────────────── */}
            <SectionTitle icon={BookOpen} title="Curriculum Browser" />

            {/* Schools */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {schools.map(s => (
                    <button
                        key={s._id}
                        onClick={() => selectSchool(s._id)}
                        className="btn btn-sm"
                        style={{
                            background: activeSchool === s._id ? 'var(--green)' : 'var(--surface)',
                            color: activeSchool === s._id ? 'white' : 'var(--text-secondary)',
                            border: `1px solid ${activeSchool === s._id ? 'var(--green)' : 'var(--border)'}`,
                        }}
                    >
                        {s.title || s.name}
                    </button>
                ))}
            </div>

            {/* Levels */}
            {levels.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {levels.map(l => (
                        <button
                            key={l._id}
                            onClick={() => selectLevel(l._id)}
                            className="btn btn-sm"
                            style={{
                                background: activeLevel === l._id ? 'var(--green)' : 'var(--surface)',
                                color: activeLevel === l._id ? 'white' : 'var(--text-secondary)',
                                border: `1px solid ${activeLevel === l._id ? 'var(--green)' : 'var(--border)'}`,
                            }}
                        >
                            {l.title}
                        </button>
                    ))}
                </div>
            )}

            {/* Guidances (hidden if auto-selected) */}
            {guidances.length > 1 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {guidances.map(g => (
                        <button
                            key={g._id}
                            onClick={() => selectGuidance(g._id)}
                            className="btn btn-sm"
                            style={{
                                background: activeGuidance === g._id ? 'var(--green)' : 'var(--surface)',
                                color: activeGuidance === g._id ? 'white' : 'var(--text-secondary)',
                                border: `1px solid ${activeGuidance === g._id ? 'var(--green)' : 'var(--border)'}`,
                            }}
                        >
                            {g.title}
                        </button>
                    ))}
                </div>
            )}

            {/* Subjects */}
            {subjects.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {subjects.map(s => (
                        <button
                            key={s._id}
                            onClick={() => selectSubject(s._id)}
                            className="btn btn-sm"
                            style={{
                                background: activeSubject === s._id ? 'var(--green)' : 'var(--surface)',
                                color: activeSubject === s._id ? 'white' : 'var(--text-secondary)',
                                border: `1px solid ${activeSubject === s._id ? 'var(--green)' : 'var(--border)'}`,
                            }}
                        >
                            {s.title}
                        </button>
                    ))}
                </div>
            )}

            {browseLoading && (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                    <Loader2 size={20} className="spin" style={{ color: 'var(--green)' }} />
                </div>
            )}

            {/* Lessons Table */}
            {lessons.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Resources</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lessons.map(l => (
                                <tr key={l._id}>
                                    <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>{l.title || 'Untitled'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {l.coursesPdf?.length > 0 && <span className="badge badge-blue">{l.coursesPdf.length} PDFs</span>}
                                            {l.videos?.length > 0 && <span className="badge badge-green">{l.videos.length} Videos</span>}
                                            {l.exercices?.length > 0 && <span className="badge badge-amber">{l.exercices.length} Exercises</span>}
                                            {getResourceCount(l) === 0 && <span className="badge badge-gray">No resources</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn-icon-only" onClick={() => setSelectedLesson(l)} title="View">
                                                <Eye size={14} />
                                            </button>
                                            <button className="btn-icon-only" onClick={() => handleDeleteLesson(l._id)} title="Delete"
                                                style={{ color: 'var(--error)' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeSubject && !browseLoading && lessons.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    No lessons found for this subject
                </div>
            )}

            {/* ── Pending Applications (Two columns) ──────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: 20, marginTop: 8,
            }}>
                <div>
                    <SectionTitle icon={GraduationCap} title="Pending Instructor Apps" />
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {pendingInstructors.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                <CheckCircle size={24} style={{ color: 'var(--green)', marginBottom: 8 }} />
                                <div>No pending instructor applications</div>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead><tr><th>Applicant</th><th>Course</th><th>Status</th></tr></thead>
                                <tbody>
                                    {pendingInstructors.map((app, i) => (
                                        <tr key={app._id || i}>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                                                    {app.userId?.displayName || app.fullName || 'Unknown'}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                    {app.userId?.email || app.email || ''}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.82rem' }}>{app.courseTitle || app.subject || '—'}</td>
                                            <td><StatusBadge status={app.status || 'pending'} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div>
                    <SectionTitle icon={ShieldCheck} title="Pending Teacher Verifs" />
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {pendingTeachers.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                <CheckCircle size={24} style={{ color: 'var(--green)', marginBottom: 8 }} />
                                <div>No pending teacher verifications</div>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead><tr><th>Teacher</th><th>School</th><th>Status</th></tr></thead>
                                <tbody>
                                    {pendingTeachers.map((v, i) => (
                                        <tr key={v._id || i}>
                                            <td>
                                                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                                                    {v.userId?.displayName || v.fullName || 'Unknown'}
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                    {v.city || ''} {v.city && v.school ? '·' : ''} {v.school || ''}
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.82rem' }}>{v.school || '—'}</td>
                                            <td><StatusBadge status={v.status || 'pending'} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Recent News ─────────────────────────────────────────────── */}
            {recentNews.length > 0 && (
                <>
                    <SectionTitle icon={Newspaper} title="Recent News" />
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table className="data-table">
                            <thead><tr><th>Title</th><th>Category</th><th>Date</th></tr></thead>
                            <tbody>
                                {recentNews.map((n, i) => (
                                    <tr key={n._id || i}>
                                        <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>{n.title || 'Untitled'}</td>
                                        <td><span className="badge badge-blue">{n.category || 'general'}</span></td>
                                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ── Recent Contributions ────────────────────────────────────── */}
            {recentContributions.length > 0 && (
                <>
                    <SectionTitle icon={Heart} title="Recent Contributions" />
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table className="data-table">
                            <thead><tr><th>User</th><th>Type</th><th>Subject</th><th>Date</th></tr></thead>
                            <tbody>
                                {recentContributions.map((c, i) => (
                                    <tr key={c._id || i}>
                                        <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                                            {c.userId?.displayName || c.userName || 'Anonymous'}
                                        </td>
                                        <td><span className="badge badge-green">{c.type || 'note'}</span></td>
                                        <td style={{ fontSize: '0.82rem' }}>{c.subjectName || c.lessonTitle || '—'}</td>
                                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ── Lesson Detail Modal ─────────────────────────────────────── */}
            {selectedLesson && (
                <div className="modal-overlay" onClick={() => setSelectedLesson(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{selectedLesson.title}</h3>
                            <button className="btn-icon-only" onClick={() => setSelectedLesson(null)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {['coursesPdf', 'videos', 'exercices', 'resourses'].map(field => {
                                const items = selectedLesson[field];
                                if (!items || items.length === 0) return null;
                                const labels = { coursesPdf: 'PDFs', videos: 'Videos', exercices: 'Exercises', resourses: 'Resources' };
                                return (
                                    <div key={field} style={{ marginBottom: 16 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 8 }}>
                                            {labels[field]} ({items.length})
                                        </div>
                                        {items.map((item, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '8px 12px', background: 'var(--background)', borderRadius: 8, marginBottom: 6,
                                            }}>
                                                <span style={{ fontSize: '0.82rem' }}>{item.title || `Item ${idx + 1}`}</span>
                                                {item.url && (
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline"
                                                        style={{ padding: '2px 10px', fontSize: '0.7rem' }}>
                                                        Open
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                            {getResourceCount(selectedLesson) === 0 && (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem', fontSize: '0.85rem' }}>
                                    No resources attached to this lesson
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
