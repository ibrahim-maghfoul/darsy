import React, { useState, useEffect, useRef } from 'react';
import {
    Plus, Trash2, Link as LinkIcon, AlertCircle, Loader2,
    Upload, Edit2, X, CheckCircle2, Database, RefreshCw, Eye
} from 'lucide-react';
import './NewsManager.css';

const API = 'http://localhost:5000/api/news';

const EMPTY_FORM = {
    title: '',
    description: '',
    category: 'General',
    imageUrl: '',
    content_blocks: '[]', // Stringified JSON for editing
    links: [{ label: '', url: '' }]
};

const NewsManager = () => {
    const [tab, setTab] = useState('browse'); // 'browse' | 'create'
    const [news, setNews] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);

    const [uploadStatus, setUploadStatus] = useState(null); // null | 'uploading' | 'done' | 'error'
    const [uploadMsg, setUploadMsg] = useState('');
    const fileRef = useRef(null);

    const LIMIT = 12;
    const totalPages = Math.ceil(total / LIMIT);

    useEffect(() => { loadNews(); }, [page]);

    const loadNews = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}?page=${page}&limit=${LIMIT}`);
            const data = await res.json();
            setNews(data.news || []);
            setTotal(data.total || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // ── Form ──────────────────────────────────────────────────────────────────

    const openCreate = () => {
        setFormData(EMPTY_FORM);
        setEditId(null);
        setTab('create');
    };

    const openEdit = (item) => {
        setFormData({
            title: item.title || '',
            description: item.description || '',
            category: item.category || item.type || 'General',
            imageUrl: item.imageUrl || '',
            content_blocks: item.content_blocks ? JSON.stringify(item.content_blocks, null, 2) : '[]',
            links: item.links?.length ? item.links : [{ label: '', url: '' }]
        });
        setEditId(item._id);
        setTab('create');
    };

    const handleInput = (e) => {
        setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    };

    const addLink = () => setFormData(p => ({ ...p, links: [...p.links, { label: '', url: '' }] }));
    const removeLink = (i) => setFormData(p => ({ ...p, links: p.links.filter((_, idx) => idx !== i) }));
    const handleLink = (i, field, val) => {
        const links = [...formData.links];
        links[i][field] = val;
        setFormData(p => ({ ...p, links }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        let processedData = { ...formData };
        try {
            processedData.content_blocks = JSON.parse(formData.content_blocks);
        } catch (e) {
            alert('Invalid JSON in Content Blocks. Please check the JSON format.');
            setSaving(false);
            return;
        }

        try {
            const url = editId ? `${API}/${editId}` : API;
            const method = editId ? 'PUT' : 'POST';

            // Add date for new articles or update existing ones
            processedData.date = new Date();

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(processedData)
            });

            if (!res.ok) throw new Error(await res.text());

            setTab('browse');
            setPage(1);
            await loadNews();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this article permanently?')) return;
        try {
            await fetch(`${API}/${id}`, { method: 'DELETE' });
            await loadNews();
        } catch (e) {
            alert('Delete failed.');
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('🚨 WARNING: Are you sure you want to delete ALL news articles? This cannot be undone!')) return;
        try {
            setLoading(true);
            await fetch(`${API}/all`, { method: 'DELETE' });
            setPage(1);
            await loadNews();
            alert('All articles deleted successfully.');
        } catch (e) {
            alert('Failed to delete all articles.');
        } finally {
            setLoading(false);
        }
    };

    // ── Bulk Upload ───────────────────────────────────────────────────────────

    const handleBulkUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadStatus('uploading');
        setUploadMsg('Reading file...');

        try {
            const text = await file.text();
            const json = JSON.parse(text);
            const articles = json.articles || json;

            if (!Array.isArray(articles)) throw new Error('Expected an array or { articles: [] }');

            setUploadMsg(`Uploading ${articles.length} articles to MongoDB...`);

            // Send in batches of 50 to avoid payload size limits
            const BATCH = 50;
            let total_upserted = 0;
            let total_modified = 0;

            for (let i = 0; i < articles.length; i += BATCH) {
                const batch = articles.slice(i, i + BATCH);
                setUploadMsg(`Uploading articles ${i + 1}–${Math.min(i + BATCH, articles.length)} of ${articles.length}...`);

                const res = await fetch(`${API}/bulk-upsert`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ articles: batch }),
                });

                if (!res.ok) throw new Error(await res.text());
                const result = await res.json();
                total_upserted += result.upserted || 0;
                total_modified += result.modified || 0;
            }

            setUploadStatus('done');
            setUploadMsg(`✅ Done! ${total_upserted} new, ${total_modified} updated.`);
            setPage(1);
            await loadNews();
        } catch (err) {
            setUploadStatus('error');
            setUploadMsg('❌ Error: ' + err.message);
        } finally {
            fileRef.current.value = '';
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="news-manager animate-fade-in">
            {/* Header */}
            <div className="news-header">
                <div>
                    <h2>News Manager</h2>
                    <p className="news-subtitle">{total} articles in MongoDB</p>
                </div>
                <div className="news-header-actions">
                    {/* Bulk upload */}
                    <label className={`btn-bulk-upload ${uploadStatus === 'uploading' ? 'uploading' : ''}`} title="Upload tawjihnet_full.json">
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".json"
                            style={{ display: 'none' }}
                            onChange={handleBulkUpload}
                            disabled={uploadStatus === 'uploading'}
                        />
                        {uploadStatus === 'uploading' ? (
                            <><Loader2 size={16} className="spin" /> Uploading...</>
                        ) : (
                            <><Database size={16} /> Upload Scraped JSON</>
                        )}
                    </label>

                    <button className="btn-delete" onClick={handleDeleteAll} style={{ marginLeft: '0.5rem', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none' }}>
                        <Trash2 size={16} /> Delete All Data
                    </button>

                    <button className="btn-new" onClick={openCreate} style={{ marginLeft: '1rem' }}>
                        <Plus size={16} /> New Article
                    </button>
                </div>
            </div>

            {/* Upload status toast */}
            {uploadStatus && uploadStatus !== 'uploading' && (
                <div className={`upload-toast ${uploadStatus}`}>
                    {uploadStatus === 'done' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    {uploadMsg}
                    <button onClick={() => { setUploadStatus(null); setUploadMsg(''); }} className="toast-close">
                        <X size={14} />
                    </button>
                </div>
            )}

            {uploadStatus === 'uploading' && (
                <div className="upload-progress">
                    <Loader2 size={16} className="spin" /> {uploadMsg}
                </div>
            )}

            {/* Tabs */}
            <div className="nm-tabs">
                <button className={tab === 'browse' ? 'active' : ''} onClick={() => setTab('browse')}>
                    <Eye size={14} /> Browse ({total})
                </button>
                <button className={tab === 'create' ? 'active' : ''} onClick={openCreate}>
                    <Plus size={14} /> {editId ? 'Edit Article' : 'New Article'}
                </button>
            </div>

            {/* ── Browse Tab ── */}
            {tab === 'browse' && (
                <div>
                    <div className="nm-toolbar">
                        <button className="btn-refresh" onClick={() => { setPage(1); loadNews(); }}>
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-state"><Loader2 size={40} className="spin" /><p>Loading...</p></div>
                    ) : news.length === 0 ? (
                        <div className="empty-state">
                            <AlertCircle size={40} />
                            <p>No articles yet. Upload your scraped JSON to get started.</p>
                        </div>
                    ) : (
                        <>
                            <div className="news-list">
                                {news.map(item => (
                                    <div key={item._id} className="news-card">
                                        {item.imageUrl && (
                                            <img
                                                src={item.imageUrl}
                                                alt={item.title}
                                                className="news-card-img"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        )}
                                        <div className="news-card-content">
                                            <span className="news-card-category">{item.category || item.type}</span>
                                            <h4 className="news-card-title">{item.title}</h4>
                                            <p className="news-card-desc">{item.description?.substring(0, 120)}...</p>
                                            <div className="news-card-stats">
                                                <small>ID: {item._id}</small> •
                                                <small> {item.card_date || new Date(item.createdAt).toLocaleDateString()}</small>
                                            </div>
                                        </div>
                                        <div className="news-card-actions">
                                            <button onClick={() => openEdit(item)} className="btn-edit">
                                                <Edit2 size={14} /> Edit
                                            </button>
                                            <button onClick={() => handleDelete(item._id)} className="btn-delete">
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="nm-pagination">
                                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
                                    <span>Page {page} of {totalPages}</span>
                                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── Create / Edit Tab ── */}
            {tab === 'create' && (
                <div className="create-news-form">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>{editId ? '✏️ Edit Article' : '📝 New Article'}</h3>
                        <button className="btn-cancel" onClick={() => { setTab('browse'); setEditId(null); }}>
                            <X size={14} /> Cancel
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Title *</label>
                                <input name="title" value={formData.title} onChange={handleInput} required placeholder="Article title" />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select name="category" value={formData.category} onChange={handleInput}>
                                    {['Bac', 'Etudiant', 'College'].map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Cover Image URL</label>
                                <input name="imageUrl" value={formData.imageUrl} onChange={handleInput} placeholder="https://..." />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Description / Summary</label>
                                <textarea name="description" value={formData.description} onChange={handleInput} placeholder="Short description..." />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Full Content (JSON blocks) *</label>
                                <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Edit the raw JSON structure of content_blocks. Must be valid JSON.</p>
                                <textarea
                                    name="content_blocks"
                                    value={formData.content_blocks}
                                    onChange={handleInput}
                                    style={{ height: '300px', fontFamily: 'monospace', fontSize: '12px' }}
                                />
                            </div>
                        </div>

                        <div className="links-section">
                            <label className="section-label">Related Links</label>
                            {formData.links.map((lk, i) => (
                                <div key={i} className="link-row">
                                    <input placeholder="Label" value={lk.label} onChange={e => handleLink(i, 'label', e.target.value)} />
                                    <input placeholder="URL" value={lk.url} onChange={e => handleLink(i, 'url', e.target.value)} />
                                    <button type="button" onClick={() => removeLink(i)} className="btn-remove-link"><Trash2 size={14} /></button>
                                </div>
                            ))}
                            <button type="button" onClick={addLink} className="btn-add-link"><LinkIcon size={14} /> Add Link</button>
                        </div>

                        <div className="form-actions" style={{ marginTop: '2rem' }}>
                            <button type="submit" className="btn-submit" disabled={saving}>
                                {saving ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                                {saving ? 'Saving...' : editId ? 'Update Article' : 'Publish to MongoDB'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default NewsManager;
