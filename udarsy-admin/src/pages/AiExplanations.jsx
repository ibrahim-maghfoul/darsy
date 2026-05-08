import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Star, Trash2, RefreshCw, Search, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LANG_LABELS = { fr: '🇫🇷 FR', ar: '🇲🇦 AR', en: '🇬🇧 EN' };

function StarBar({ avg, count }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[1,2,3,4,5].map(s => (
                <Star
                    key={s}
                    size={14}
                    style={{ color: s <= Math.round(avg) ? '#f59e0b' : '#e5e7eb', fill: s <= Math.round(avg) ? '#f59e0b' : 'none' }}
                />
            ))}
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {avg > 0 ? `${avg.toFixed(1)} (${count})` : 'No ratings yet'}
            </span>
        </div>
    );
}

export default function AiExplanations() {
    const { token } = useAuth();
    const [answers, setAnswers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchData = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/ai/all?page=${p}&limit=20`, { headers });
            const data = await res.json();
            setAnswers(data.answers || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
            setPage(p);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchData(1); }, [fetchData]);

    const handleDelete = async (docId, lang) => {
        if (!confirm(`Delete the ${lang.toUpperCase()} explanation for "${docId}"?`)) return;
        setDeleting(docId + lang);
        try {
            await fetch(`${API}/ai/${encodeURIComponent(docId)}?lang=${lang}`, {
                method: 'DELETE', headers,
            });
            fetchData(page);
        } catch (err) {
            console.error(err);
        } finally {
            setDeleting(null);
        }
    };

    const filtered = search.trim()
        ? answers.filter(a =>
            a.documentTitle?.toLowerCase().includes(search.toLowerCase()) ||
            a.lessonTitle?.toLowerCase().includes(search.toLowerCase()) ||
            a.docId?.toLowerCase().includes(search.toLowerCase())
        )
        : answers;

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1100 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Sparkles size={20} color="white" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>AI Explanations</h2>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                            {total} cached explanations
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => fetchData(page)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 10,
                        background: 'var(--green-light)', color: 'var(--green)',
                        border: '1px solid var(--green)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    }}
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by document or lesson title…"
                    style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: '10px 14px 10px 40px',
                        borderRadius: 12, border: '1px solid var(--border)',
                        fontSize: 14, background: 'var(--bg-card)',
                        outline: 'none',
                    }}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <div className="spin" style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', margin: '0 auto 12px' }} />
                    Loading explanations…
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No AI explanations found.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filtered.map((answer) => {
                        const key = answer._id;
                        const isOpen = expanded === key;
                        return (
                            <div
                                key={key}
                                style={{
                                    background: 'white', borderRadius: 16,
                                    border: '1px solid var(--border)',
                                    overflow: 'hidden',
                                    boxShadow: isOpen ? '0 4px 24px rgba(58,170,106,0.08)' : 'none',
                                }}
                            >
                                {/* Row */}
                                <div
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        padding: '14px 18px', cursor: 'pointer',
                                    }}
                                    onClick={() => setExpanded(isOpen ? null : key)}
                                >
                                    {/* Lang badge */}
                                    <span style={{
                                        padding: '3px 10px', borderRadius: 8,
                                        background: 'var(--green-light)', color: 'var(--green)',
                                        fontSize: 11, fontWeight: 800, flexShrink: 0,
                                    }}>
                                        {LANG_LABELS[answer.language] || answer.language}
                                    </span>

                                    {/* Titles */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {answer.documentTitle}
                                        </p>
                                        {answer.lessonTitle && (
                                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {answer.lessonTitle}
                                            </p>
                                        )}
                                    </div>

                                    {/* Rating */}
                                    <div style={{ flexShrink: 0 }}>
                                        <StarBar avg={answer.avgRating || 0} count={answer.ratingCount || 0} />
                                    </div>

                                    {/* Date */}
                                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0 }}>
                                        {new Date(answer.createdAt).toLocaleDateString()}
                                    </span>

                                    {/* Delete */}
                                    <button
                                        onClick={e => { e.stopPropagation(); handleDelete(answer.docId, answer.language); }}
                                        disabled={deleting === answer.docId + answer.language}
                                        style={{
                                            padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                            background: '#fef2f2', color: '#ef4444', flexShrink: 0,
                                            opacity: deleting === answer.docId + answer.language ? 0.5 : 1,
                                        }}
                                        title="Delete this explanation"
                                    >
                                        <Trash2 size={14} />
                                    </button>

                                    {isOpen ? <ChevronUp size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />}
                                </div>

                                {/* Expanded content */}
                                {isOpen && (
                                    <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
                                        <div style={{ marginTop: 14 }}>
                                            {/* Doc ID */}
                                            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 10, wordBreak: 'break-all' }}>
                                                <strong>Doc ID:</strong> {answer.docId}
                                            </p>

                                            {/* Answer text */}
                                            <div style={{
                                                background: '#f8faf9', borderRadius: 12,
                                                padding: '14px 16px',
                                                border: '1px solid var(--border)',
                                                fontSize: 13, lineHeight: 1.7,
                                                color: '#374151', whiteSpace: 'pre-wrap',
                                                maxHeight: 400, overflowY: 'auto',
                                            }}>
                                                {answer.answer}
                                            </div>

                                            {/* Ratings breakdown */}
                                            {answer.ratingCount > 0 && (
                                                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Globe size={14} style={{ color: 'var(--text-secondary)' }} />
                                                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                                                        Average accuracy: <strong>{answer.avgRating?.toFixed(1)}/5</strong> from {answer.ratingCount} student{answer.ratingCount > 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '1.5rem' }}>
                    {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => fetchData(p)}
                            style={{
                                width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)',
                                background: p === page ? 'var(--green)' : 'white',
                                color: p === page ? 'white' : 'var(--text-primary)',
                                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
