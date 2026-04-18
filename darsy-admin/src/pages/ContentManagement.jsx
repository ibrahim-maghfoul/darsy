import React, { useState, useEffect } from 'react';
import {
    FileText, RefreshCw, Trash2, Eye, Send, Sparkles,
    CheckCircle2, AlertCircle, Download, X
} from 'lucide-react';
import { makeLLMRequest } from '../utils/aiService';
import { adminFetch } from '../utils/adminFetch';
import './ContentCreator.css';

const PLATFORMS = [
    { id: 'instagram', label: 'Instagram', color: '#e1306c' },
    { id: 'facebook', label: 'Facebook', color: '#1877f2' },
    { id: 'tiktok', label: 'TikTok', color: '#010101' },
];

const ContentManagement = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [caption, setCaption] = useState('');
    const [captionLoading, setCaptionLoading] = useState(false);
    const [publishingPlatform, setPublishingPlatform] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const keys = {
        nebius: import.meta.env.VITE_NEBIUS_API_KEY,
        openrouter: import.meta.env.VITE_OPENROUTER_API_KEY,
    };

    // ── Load sessions ──────────────────────────────────────────────────────
    const loadSessions = async () => {
        setLoading(true); setError('');
        try {
            const res = await adminFetch('/poster/sessions');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load sessions');
            setSessions(data.sessions || []);
        } catch (err) {
            setError(`Could not load sessions: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSessions(); }, []);

    // ── Delete session ─────────────────────────────────────────────────────
    const deleteSession = async (topicId) => {
        setLoading(true);
        try {
            const res = await adminFetch(`/poster/sessions/${topicId}`, { method: 'DELETE' });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
            setSessions(prev => prev.filter(s => s.topicId !== topicId));
            if (selected?.topicId === topicId) setSelected(null);
            setDeleteConfirm(null);
            setStatus('Session deleted.');
        } catch (err) {
            setError(`Delete failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const saveCaption = async () => {
        if (!selected) return;
        setCaptionLoading(true); setError('');
        try {
            const res = await adminFetch(`/poster/sessions/${selected.topicId}`, {
                method: 'PATCH',
                body: JSON.stringify({ socialCaption: caption }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
            // Keep in-memory state in sync so badge shows immediately
            setSessions(prev => prev.map(s => s.topicId === selected.topicId ? { ...s, socialCaption: caption } : s));
            setSelected(prev => ({ ...prev, socialCaption: caption }));
            setStatus('Caption saved to session file!');
        } catch (err) {
            setError(`Save failed: ${err.message}`);
        } finally {
            setCaptionLoading(false);
        }
    };

    // ── Generate captions ──────────────────────────────────────────────────
    const generateCaption = async (session) => {
        setCaptionLoading(true); setError('');
        try {
            const response = await makeLLMRequest([
                {
                    role: 'system',
                    content: `You are a social media expert for Darsy, an educational platform for Moroccan students.
Write one engaging social media caption that works across all platforms.
- Use relevant emojis
- Include 3–5 relevant hashtags at the end
- Mention the Darsy team (e.g. "— Darsy Team 🌿" or "by the Darsy team")
- Write in the same language as the headline
- Return ONLY the caption text, no extra explanation`
                },
                {
                    role: 'user',
                    content: `Write a caption for this post:
Topic: ${session.topic}
Headline: ${session.headline}
Subline: ${session.subline || '(none)'}`
                }
            ], { keys, addLog: () => {} });

            const text = response?.choices?.[0]?.message?.content?.trim();
            if (!text) throw new Error('Empty response');
            setCaption(text);
            setStatus('Caption generated!');
        } catch (err) {
            setError(`Caption generation failed: ${err.message}`);
        } finally {
            setCaptionLoading(false);
        }
    };

    // ── Publish (placeholder) ─────────────────────────────────────────────
    const publishToplatform = async (platform) => {
        if (!caption) { setError('Generate a caption first.'); return; }
        setPublishingPlatform(platform);
        // Simulated delay — replace with real API call when platform credentials are set
        await new Promise(r => setTimeout(r, 1500));
        setStatus(`Posted to ${platform} successfully! (Simulated)`);
        setPublishingPlatform('');
    };

    const imageUrl = (session, filename) =>
        `/data/content-sessions/${session.topicId}/${filename}`;

    return (
        <div className="content-creator">
            {/* Header */}
            <div className="pg-header">
                <div className="pg-header-icon"><FileText size={22} color="white" /></div>
                <div className="pg-header-text">
                    <h1>Content Management</h1>
                    <p>Manage saved posts, generate captions and publish to social media</p>
                </div>
            </div>

            {error && <div className="pg-status-bar error" style={{ marginBottom: 16 }}><AlertCircle size={15} />{error}</div>}
            {status && !error && <div className="pg-status-bar" style={{ marginBottom: 16 }}><CheckCircle2 size={15} />{status}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.5fr' : '1fr', gap: 20 }}>
                {/* Sessions List */}
                <div className="pg-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <p className="pg-card-title" style={{ margin: 0 }}><FileText size={16} color="var(--green)" /> Saved Sessions ({sessions.length})</p>
                        <button className="pg-btn pg-btn-ghost" onClick={loadSessions} disabled={loading} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                            <RefreshCw size={13} /> {loading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    {sessions.length === 0 && !loading && (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            No saved sessions yet. Generate posters first.
                        </div>
                    )}

                    <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                        {sessions.map(s => (
                            <div
                                key={s.topicId}
                                onClick={() => { setSelected(s); setCaption(s.socialCaption || ''); setStatus(''); setPreviewImage(s.images?.[0]?.filename); }}
                                style={{
                                    padding: '14px 20px',
                                    borderBottom: '1px solid var(--border-light)',
                                    cursor: 'pointer',
                                    background: selected?.topicId === s.topicId ? 'var(--green-50)' : 'transparent',
                                    transition: 'background 0.15s',
                                    display: 'flex',
                                    gap: 12,
                                    alignItems: 'flex-start',
                                }}
                            >
                                {/* Thumbnail */}
                                {s.images?.[0]?.filename && (
                                    <img
                                        src={imageUrl(s, s.images[0].filename)}
                                        alt="thumb"
                                        style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid var(--border)' }}
                                    />
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {s.headline || s.title || s.topic}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                        {s.topic} · {s.images?.length || 0} image{s.images?.length !== 1 ? 's' : ''}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                        {new Date(s.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <button
                                    onClick={e => { e.stopPropagation(); setDeleteConfirm(s.topicId); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', flexShrink: 0, padding: 4 }}
                                    title="Delete"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detail panel */}
                {selected && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Images */}
                        <div className="pg-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <p className="pg-card-title" style={{ margin: 0 }}><Eye size={15} color="var(--green)" /> Images ({selected.images?.length || 0})</p>
                                <button className="pg-btn pg-btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => setSelected(null)}>
                                    <X size={13} /> Close
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                                {(selected.images || []).map((img, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setPreviewImage(img.filename)}
                                        style={{
                                            borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                                            border: previewImage === img.filename ? '2.5px solid var(--green)' : '2px solid var(--border)',
                                        }}
                                    >
                                        <img src={imageUrl(selected, img.filename)} alt={img.filename} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                ))}
                            </div>
                            {previewImage && (
                                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                    <a
                                        href={imageUrl(selected, previewImage)}
                                        download={previewImage}
                                        className="pg-btn pg-btn-ghost"
                                        style={{ textDecoration: 'none', padding: '7px 14px', fontSize: '0.8rem' }}
                                    >
                                        <Download size={13} /> Download Selected
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Caption Generator */}
                        <div className="pg-card">
                            <p className="pg-card-title"><Sparkles size={15} color="var(--green)" /> Caption</p>

                            <div className="pg-footer-btns" style={{ marginBottom: 14 }}>
                                <button
                                    className="pg-btn pg-btn-primary"
                                    onClick={() => generateCaption(selected)}
                                    disabled={captionLoading}
                                >
                                    {captionLoading
                                        ? <><div className="pg-spinner" /> Generating...</>
                                        : <><Sparkles size={14} /> {caption ? 'Regenerate' : 'Generate Caption'}</>}
                                </button>
                                {caption && (
                                    <button
                                        className="pg-btn pg-btn-ghost"
                                        onClick={saveCaption}
                                        disabled={captionLoading}
                                        title="Save caption to session file"
                                    >
                                        <CheckCircle2 size={14} /> Save
                                    </button>
                                )}
                            </div>

                            {caption && (
                                <>
                                    <textarea
                                        className="pg-textarea"
                                        rows={6}
                                        value={caption}
                                        onChange={e => setCaption(e.target.value)}
                                        style={{ marginBottom: 14 }}
                                    />
                                    {selected.socialCaption && (
                                        <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                                            <CheckCircle2 size={11} color="var(--green)" /> Caption saved in session file
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {PLATFORMS.map(p => (
                                            <button
                                                key={p.id}
                                                className="pg-btn pg-btn-ghost"
                                                style={{ fontSize: '0.78rem', padding: '6px 14px', color: p.color, borderColor: `${p.color}40` }}
                                                onClick={() => publishToplatform(p.id)}
                                                disabled={!!publishingPlatform}
                                            >
                                                {publishingPlatform === p.id
                                                    ? <><div className="pg-spinner pg-spinner-dark" /> Posting...</>
                                                    : <><Send size={12} /> {p.label}</>}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete confirmation modal */}
            {deleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="pg-card" style={{ maxWidth: 380, width: '90%' }}>
                        <p style={{ fontWeight: 700, marginBottom: 8 }}>Delete this session?</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>This will permanently remove all images and metadata for this session.</p>
                        <div className="pg-footer-btns">
                            <button className="pg-btn pg-btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button className="pg-btn pg-btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={() => deleteSession(deleteConfirm)}>
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentManagement;
