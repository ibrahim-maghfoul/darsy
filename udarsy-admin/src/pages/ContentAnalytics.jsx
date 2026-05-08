import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Image as ImageIcon, Share2, Instagram, RefreshCw, AlertCircle } from 'lucide-react';
import { adminFetch } from '../utils/adminFetch';
import './ContentCreator.css';

const PLATFORMS = [
    { id: 'all', label: 'All Platforms' },
    { id: 'instagram', label: 'Instagram', color: '#e1306c' },
    { id: 'facebook', label: 'Facebook', color: '#1877f2' },
    { id: 'tiktok', label: 'TikTok', color: '#010101' },
];

const RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days'];

// Mock analytics data — replace with real API calls once platforms are connected
const generateMockData = (platform, range) => {
    const multiplier = { 'Last 7 days': 1, 'Last 30 days': 4, 'Last 90 days': 12 }[range] || 1;
    const base = platform === 'instagram' ? 1200 : platform === 'facebook' ? 900 : platform === 'tiktok' ? 2100 : 4200;
    return {
        impressions: Math.round(base * multiplier * (0.9 + Math.random() * 0.2)),
        reach: Math.round(base * 0.7 * multiplier * (0.9 + Math.random() * 0.2)),
        engagement: +(3.2 + Math.random() * 2).toFixed(1),
        followers: Math.round(base * 0.05 * multiplier),
        postsCount: Math.round(2 * multiplier),
    };
};

const StatCard = ({ label, value, icon: Icon, color, suffix = '' }) => (
    <div style={{
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
    }}>
        <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: color ? `${color}18` : 'var(--green-50)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
            <Icon size={22} color={color || 'var(--green)'} />
        </div>
        <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark)', lineHeight: 1 }}>
                {typeof value === 'number' && value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}{suffix}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
        </div>
    </div>
);

const AnalyticsBadge = ({ platform }) => {
    const p = PLATFORMS.find(x => x.id === platform);
    if (!p || !p.color) return null;
    return (
        <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 20,
            background: `${p.color}18`, color: p.color, fontSize: '0.72rem', fontWeight: 700,
        }}>
            {p.label}
        </span>
    );
};

const ContentAnalytics = () => {
    const [platform, setPlatform] = useState('all');
    const [range, setRange] = useState('Last 30 days');
    const [stats, setStats] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const refreshStats = () => {
        setLoading(true);
        setTimeout(() => {
            setStats(generateMockData(platform, range));
            setLoading(false);
        }, 600);
    };

    const loadSessions = async () => {
        try {
            const res = await adminFetch('/poster/sessions');
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch { /* non-fatal */ }
    };

    useEffect(() => { refreshStats(); }, [platform, range]);
    useEffect(() => { loadSessions(); }, []);

    return (
        <div className="content-creator">
            {/* Header */}
            <div className="pg-header">
                <div className="pg-header-icon"><BarChart2 size={22} color="white" /></div>
                <div className="pg-header-text">
                    <h1>Content Analytics</h1>
                    <p>Track your post performance across platforms</p>
                </div>
            </div>

            {/* Filters */}
            <div className="pg-card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                        <label className="pg-label">Platform</label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {PLATFORMS.map(p => (
                                <button
                                    key={p.id}
                                    className={`pg-btn ${platform === p.id ? 'pg-btn-primary' : 'pg-btn-ghost'}`}
                                    style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                                    onClick={() => setPlatform(p.id)}
                                >
                                    {p.id !== 'all' && <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: p.color, marginRight: 5 }} />}
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <label className="pg-label">Date Range</label>
                        <select className="pg-input" value={range} onChange={e => setRange(e.target.value)} style={{ minWidth: 150 }}>
                            {RANGES.map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    <button className="pg-btn pg-btn-ghost" onClick={refreshStats} disabled={loading} style={{ padding: '7px 14px', fontSize: '0.8rem', alignSelf: 'flex-end' }}>
                        <RefreshCw size={13} /> Refresh
                    </button>
                </div>
            </div>

            {/* Notice banner */}
            <div style={{
                background: 'rgba(58,170,106,0.08)', border: '1px solid rgba(58,170,106,0.25)',
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                fontSize: '0.82rem', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <AlertCircle size={15} color="var(--green)" />
                Analytics are currently based on simulated data. Connect your platform accounts in Settings to get real metrics.
                {platform !== 'all' && <AnalyticsBadge platform={platform} />}
            </div>

            {/* Stats grid */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                    <StatCard label="Impressions" value={stats.impressions} icon={TrendingUp} />
                    <StatCard label="Reach" value={stats.reach} icon={Share2} />
                    <StatCard label="Engagement Rate" value={stats.engagement} icon={BarChart2} suffix="%" />
                    <StatCard label="New Followers" value={stats.followers} icon={TrendingUp} color="#8b5cf6" />
                    <StatCard label="Posts Published" value={stats.postsCount} icon={ImageIcon} color="#f59e0b" />
                </div>
            )}

            {/* Recent sessions table */}
            <div className="pg-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                    <p className="pg-card-title" style={{ margin: 0 }}><ImageIcon size={15} color="var(--green)" /> Recent Content Pieces ({sessions.length})</p>
                </div>
                {sessions.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        No sessions found. Generate and save posters first.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--green-50)' }}>
                                {['Preview', 'Topic', 'Headline', 'Date', 'Images', 'Theme'].map(h => (
                                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((s, i) => (
                                <tr key={s.topicId} style={{ borderTop: '1px solid var(--border-light)', background: i % 2 === 0 ? 'white' : 'var(--green-50)' }}>
                                    <td style={{ padding: '10px 14px' }}>
                                        {s.images?.[0]?.filename ? (
                                            <img
                                                src={`/data/content-sessions/${s.topicId}/${s.images[0].filename}`}
                                                alt="thumb"
                                                style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                                            />
                                        ) : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                                    </td>
                                    <td style={{ padding: '10px 14px', color: 'var(--dark)' }}>{s.topic}</td>
                                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--dark)' }}>{s.headline || '—'}</td>
                                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{s.images?.length || 0}</td>
                                    <td style={{ padding: '10px 14px' }}>
                                        {s.images?.[0]?.theme && (
                                            <span style={{
                                                display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                                                background: s.images[0].theme === 'green' ? '#3aaa6a' : '#e5e7eb',
                                                color: s.images[0].theme === 'green' ? 'white' : '#374151',
                                            }}>{s.images[0].theme}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ContentAnalytics;
