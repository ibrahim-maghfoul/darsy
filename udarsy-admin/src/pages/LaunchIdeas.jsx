import React, { useState, useRef } from 'react';
import {
    Rocket, Sparkles, Image as ImageIcon, CheckSquare, Square,
    Save, Download, RefreshCw, CheckCircle2, AlertCircle, Copy
} from 'lucide-react';
import { makeLLMRequest } from '../utils/aiService';
import { adminFetch } from '../utils/adminFetch';
import { buildImagePrompt } from '../utils/promptBuilder';
import launchIdeas from '../data/launchIdeas.json';
import './ContentCreator.css';

const API_BASE = 'http://localhost:5000/api';

const CORNERS = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-right', label: 'Bottom Right' },
];

const SVG_LOGO_PATH = '/assets/logo/logo.svg';

const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

// ── Tints an SVG source string by replacing fill="#000000" with the target color ──
const tintSvg = (svgText, color) => {
    // Replace fill on the <g> element and any explicit fill="#000000"
    return svgText
        .replace(/fill="#000000"/g, `fill="${color}"`)
        .replace(/fill="black"/gi, `fill="${color}"`);
};

// ── Loads an SVG as a colored Image, returns an HTMLImageElement ──
const loadColoredSvg = (svgText, color) => new Promise((resolve, reject) => {
    const tinted = tintSvg(svgText, color);
    const blob = new Blob([tinted], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
});



// ── Component ─────────────────────────────────────────────────────────────────
const LaunchIdeas = () => {
    const [selected, setSelected] = useState(new Set());
    const [theme, setTheme] = useState('random');
    const [imageModel, setImageModel] = useState('ghost');

    const [drafts, setDrafts] = useState(() => {
        const init = {};
        launchIdeas.forEach(idea => {
            init[idea.id] = {
                headline: idea.headline,
                subline: idea.subline,
                caption: '',
                language: 'en',
                logoCorner: 'top-left',
                udarsyCorner: 'top-right',
                showLogo: true,
                showUdarsy: true,
                logoColor: 'white',      // 'white' | 'black' | 'green'
                udarsyColor: 'auto',      // 'auto' | 'white' | 'black' | 'green'
            };
        });
        return init;
    });

    const [expandedEdits, setExpandedEdits] = useState(new Set());
    const [results, setResults] = useState({});
    const [bulkRunning, setBulkRunning] = useState(false);
    const [globalStatus, setGlobalStatus] = useState('');
    const [globalError, setGlobalError] = useState('');

    // Fetch and cache the raw SVG text once
    const svgTextRef = useRef(null);
    const getSvgText = async () => {
        if (svgTextRef.current) return svgTextRef.current;
        const res = await fetch(SVG_LOGO_PATH);
        svgTextRef.current = await res.text();
        return svgTextRef.current;
    };

    const keys = {
        nebius: import.meta.env.VITE_NEBIUS_API_KEY,
        openai: import.meta.env.VITE_OPENROUTER_API_KEY,
        openrouter: import.meta.env.VITE_OPENROUTER_API_KEY,
        gemini: import.meta.env.VITE_GEMINI_API_KEY,
    };

    const toggleIdea = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === launchIdeas.length) setSelected(new Set());
        else setSelected(new Set(launchIdeas.map(i => i.id)));
    };

    const setResult = (id, patch) =>
        setResults(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));

    const updateDraft = (id, patch) =>
        setDrafts(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

    // updateDraft with auto-recomposite when a poster is ready
    const updateDraftAndRecomposite = (idea, patch) => {
        setDrafts(prev => {
            const next = { ...prev, [idea.id]: { ...prev[idea.id], ...patch } };
            // Trigger reComposite after state flush using the merged draft
            const r = results[idea.id];
            if (r?.imageUrl) {
                const merged = next[idea.id];
                const activeTheme = r.theme || 'green';
                setTimeout(() => {
                    // applyOverlaysToUrl needs the updated draft — use merged directly
                    const src = r.imageUrl.startsWith('data:')
                        ? r.imageUrl
                        : `${API_BASE}/poster/proxy?url=${encodeURIComponent(r.imageUrl)}`;

                    const hexForC = (c) => c === 'white' ? '#ffffff' : c === 'green' ? '#3aaa6a' : '#111111';
                    const tint = (svgText, color) =>
                        svgText
                            .replace(/fill="#000000"/g, `fill="${color}"`)
                            .replace(/fill="black"/gi, `fill="${color}"`);

                    (async () => {
                        setResult(idea.id, { status: 'compositing' });
                        try {
                            const blob = await fetch(src).then(r2 => { if (!r2.ok) throw new Error('Proxy'); return r2.blob(); });
                            const posterObjUrl = URL.createObjectURL(blob);
                            const posterImg = await (new Promise((res2, rej2) => { const i = new Image(); i.onload = () => res2(i); i.onerror = rej2; i.src = posterObjUrl; }));
                            URL.revokeObjectURL(posterObjUrl);

                            const canvas = document.createElement('canvas');
                            canvas.width = posterImg.naturalWidth || posterImg.width;
                            canvas.height = posterImg.naturalHeight || posterImg.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(posterImg, 0, 0);

                            if (merged.showUdarsy) {
                                const pad = canvas.width * 0.03;
                                const sz = Math.round(canvas.width * 0.038);
                                ctx.font = `700 ${sz}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
                                const tw = ctx.measureText('UDARSY').width;
                                let dc;
                                if (merged.udarsyColor === 'auto') { dc = activeTheme === 'green' ? '#ffffff' : '#111111'; }
                                else { dc = hexForC(merged.udarsyColor); }
                                ctx.fillStyle = dc;
                                const dIsBottom = merged.udarsyCorner.startsWith('bottom');
                                const dIsRight = merged.udarsyCorner.endsWith('right');
                                ctx.textBaseline = dIsBottom ? 'bottom' : 'top';
                                ctx.fillText('UDARSY', dIsRight ? canvas.width - tw - pad : pad, dIsBottom ? canvas.height - pad : pad);
                            }

                            if (merged.showLogo) {
                                const svgRes = await fetch('/assets/logo/logo.svg');
                                const svgText = await svgRes.text();
                                const tinted = tint(svgText, hexForC(merged.logoColor));
                                const blob2 = new Blob([tinted], { type: 'image/svg+xml' });
                                const svgUrl = URL.createObjectURL(blob2);
                                const logoImg = await (new Promise((res2, rej2) => { const i = new Image(); i.onload = () => { URL.revokeObjectURL(svgUrl); res2(i); }; i.onerror = rej2; i.src = svgUrl; }));
                                const pad = canvas.width * 0.03;
                                const lw = 80;
                                const lh = 80;
                                let x = pad, y = pad;
                                if (merged.logoCorner === 'top-right')    { x = canvas.width - lw - pad; }
                                if (merged.logoCorner === 'bottom-left')  { y = canvas.height - lh - pad; }
                                if (merged.logoCorner === 'bottom-right') { x = canvas.width - lw - pad; y = canvas.height - lh - pad; }
                                ctx.drawImage(logoImg, x, y, lw, lh);
                            }

                            setResult(idea.id, { status: 'ready', compositedUrl: canvas.toDataURL('image/png') });
                        } catch (e) {
                            setResult(idea.id, { status: 'ready' }); // leave stale on error
                        }
                    })();
                }, 0);
            }
            return next;
        });
    };

    const toggleEdit = (id) => {
        setExpandedEdits(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // ── Color helpers ─────────────────────────────────────────────────────────
    const hexForColor = (colorName) => {
        if (colorName === 'white') return '#ffffff';
        if (colorName === 'green') return '#3aaa6a';
        return '#111111'; // black
    };

    // ── Composite canvas overlay with SVG logo + colored text ─────────────────
    const applyOverlaysToUrl = async (rawUrl, ideaTheme, draft) => {
        const src = rawUrl.startsWith('data:')
            ? rawUrl
            : `${API_BASE}/poster/proxy?url=${encodeURIComponent(rawUrl)}`;

        const blob = await fetch(src).then(r => { if (!r.ok) throw new Error('Proxy failed'); return r.blob(); });
        const posterObjUrl = URL.createObjectURL(blob);
        const posterImg = await loadImage(posterObjUrl);

        const canvas = document.createElement('canvas');
        canvas.width = posterImg.naturalWidth || posterImg.width;
        canvas.height = posterImg.naturalHeight || posterImg.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(posterImg, 0, 0);
        URL.revokeObjectURL(posterObjUrl);

        // ── UDARSY text overlay ────────────────────────────────────────────────
        if (draft.showUdarsy) {
            const pad = canvas.width * 0.03;
            const sz = Math.round(canvas.width * 0.038);
            ctx.font = `700 ${sz}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
            const tw = ctx.measureText('UDARSY').width;

            // determine color
            let dColor;
            if (draft.udarsyColor === 'auto') {
                dColor = ideaTheme === 'green' ? '#ffffff' : '#111111';
            } else {
                dColor = hexForColor(draft.udarsyColor);
            }
            ctx.fillStyle = dColor;

            const dIsBottom = draft.udarsyCorner.startsWith('bottom');
            const dIsRight = draft.udarsyCorner.endsWith('right');
            ctx.textBaseline = dIsBottom ? 'bottom' : 'top';
            const dx = dIsRight ? canvas.width - tw - pad : pad;
            const dy = dIsBottom ? canvas.height - pad : pad;
            ctx.fillText('UDARSY', dx, dy);
        }

        // ── SVG logo overlay ──────────────────────────────────────────────────
        if (draft.showLogo) {
            try {
                const svgText = await getSvgText();
                const logoColor = hexForColor(draft.logoColor);
                const logoImg = await loadColoredSvg(svgText, logoColor);

                const pad = canvas.width * 0.03;
                const lw = 80;
                const lh = 80;
                let x = pad, y = pad;
                if (draft.logoCorner === 'top-right')    { x = canvas.width - lw - pad; }
                if (draft.logoCorner === 'bottom-left')  { y = canvas.height - lh - pad; }
                if (draft.logoCorner === 'bottom-right') { x = canvas.width - lw - pad; y = canvas.height - lh - pad; }
                ctx.drawImage(logoImg, x, y, lw, lh);
            } catch (e) {
                console.warn('SVG logo render failed:', e);
            }
        }

        return canvas.toDataURL('image/png');
    };

    const reComposite = async (idea) => {
        const r = results[idea.id];
        if (!r?.imageUrl) return;
        setResult(idea.id, { status: 'compositing' });
        try {
            const draft = drafts[idea.id];
            const compositedUrl = await applyOverlaysToUrl(r.imageUrl, r.theme || theme, draft);
            setResult(idea.id, { status: 'ready', compositedUrl, theme: r.theme || theme });
        } catch (err) {
            setResult(idea.id, { status: 'error', error: err.message });
        }
    };

    // ── Generate for one idea ──────────────────────────────────────────────────
    const generateForIdea = async (idea) => {
        setResult(idea.id, { status: 'generating', error: null, saved: false });
        const draft = drafts[idea.id];
        const lang = draft.language === 'fr' ? 'French' : draft.language === 'ar' ? 'Arabic' : 'English';
        const activeTheme = theme === 'random' ? (Math.random() > 0.5 ? 'green' : 'white') : theme;

        try {
            // 1. LLM: get design parameters + caption
            const resp = await makeLLMRequest([
                {
                    role: 'system',
                    content: `You are a creative director for Udarsy, an educational platform for Moroccan students.
Return ONLY valid JSON. designPhrase and caption in ${lang}. Mood/density/placement MUST be exact enum values.

{
  "designPhrase": "Vivid 2-3 sentence scene description for image AI. Describe the figure, action, setting.",
  "mood": "MUST be exactly one of: calm and confident | energetic and dynamic | contemplative and still | bold and assertive | hopeful and aspirational",
  "geometricDensity": "MUST be exactly one of: sparse | balanced | layered",
  "figurePlacement": "MUST be exactly one of: lower-left third | right-of-center | lower-right bleeding edge | centered but asymmetrically cropped",
  "shapeStyle": "one geometric language sentence MUST be translated to ${lang} (e.g. bold overlapping circles | sharp angular polygons | thin concentric rings)",
  "bgTexture": "one subtle texture sentence MUST be translated to ${lang} (e.g. fine grain noise | soft linen weave | micro-dot halftone | smooth matte)",
  "caption": "Instagram caption in ${lang} with emojis + 5 hashtags"
}`
                },
                { role: 'user', content: `Topic: "${idea.topic}". Headline: "${draft.headline}". Subline: "${draft.subline}". Description: "${idea.description}". Return only JSON.` }
            ], { keys, addLog: () => {} });

            const raw = resp?.choices?.[0]?.message?.content?.trim();
            const parsed = JSON.parse(raw?.replace(/```json\n?/gi, '').replace(/```/g, '').trim());

            const designPhrase = parsed.designPhrase || idea.description;
            const mood = parsed.mood || '';
            const geometricDensity = parsed.geometricDensity || '';
            const figurePlacement = parsed.figurePlacement || '';
            const shapeStyle = parsed.shapeStyle || '';
            const bgTexture = parsed.bgTexture || '';
            const generatedCaption = parsed.caption || '';

            updateDraft(idea.id, { caption: generatedCaption });
            setResult(idea.id, { status: 'imaging', caption: generatedCaption, theme: activeTheme });

            // 2. Generate image with full prompt
            let prompt = buildImagePrompt({ designPhrase, theme: activeTheme, headline: draft.headline, subline: draft.subline, mood, geometricDensity, figurePlacement, shapeStyle, bgTexture, lang });

            const res = await adminFetch('/poster/generate-poster-image', {
                method: 'POST',
                body: JSON.stringify({ prompt, size: '1024x1024', n: 1, model: imageModel }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Generation failed');
            const rawUrl = data.data?.[0]?.url;
            if (!rawUrl) throw new Error('No image returned');

            setResult(idea.id, { status: 'compositing', imageUrl: rawUrl, theme: activeTheme });

            // 3. Apply SVG logo + UDARSY text overlays
            const compositedUrl = await applyOverlaysToUrl(rawUrl, activeTheme, draft);
            setResult(idea.id, { status: 'ready', imageUrl: rawUrl, compositedUrl, theme: activeTheme });
        } catch (err) {
            setResult(idea.id, { status: 'error', error: err.message });
        }
    };

    const generateAll = async () => {
        if (selected.size === 0) { setGlobalError('Select at least one idea first.'); return; }
        setBulkRunning(true); setGlobalError(''); setGlobalStatus('');
        const toGenerate = launchIdeas.filter(i => selected.has(i.id));
        for (const idea of toGenerate) {
            setGlobalStatus(`Generating ${idea.title}...`);
            await generateForIdea(idea);
        }
        setGlobalStatus(`Done! ${toGenerate.length} poster(s) generated.`);
        setBulkRunning(false);
    };

    const saveIdea = async (idea) => {
        const r = results[idea.id];
        const draft = drafts[idea.id];
        if (!r?.compositedUrl) return;
        setResult(idea.id, { saving: true });
        try {
            const slug = idea.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
            const topicId = `${slug}_${Date.now()}`;
            const langName = draft.language === 'fr' ? 'French' : draft.language === 'ar' ? 'Arabic' : 'English';
            const res = await adminFetch('/poster/save-session', {
                method: 'POST',
                body: JSON.stringify({
                    topicId, topic: idea.topic, title: idea.title,
                    headline: draft.headline, subline: draft.subline,
                    designPrompt: idea.description, socialCaption: draft.caption,
                    theme: r.theme || theme, model: imageModel, language: langName,
                    imageUrl: r.compositedUrl,
                }),
            });
            const data = await res.json();
            setResult(idea.id, { saved: true, savedTo: data.folder, saving: false });
        } catch (err) {
            setResult(idea.id, { saving: false, error: `Save failed: ${err.message}` });
        }
    };

    const download = (url, name) => {
        const a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const statusLabel = {
        generating: '🤖 Generating concept...',
        imaging: '🖼️ Creating image...',
        compositing: '✨ Applying overlays...',
        ready: '✅ Ready',
        error: '❌ Failed',
    };

    const ColorPicker = ({ label, value, onChange }) => (
        <div className="pg-input-group" style={{ marginBottom: 0 }}>
            <label className="pg-label" style={{ fontSize: '0.75rem' }}>{label}</label>
            <div style={{ display: 'flex', gap: 6 }}>
                {[
                    { id: 'white', hex: '#ffffff', border: '#d1d5db' },
                    { id: 'black', hex: '#111111', border: '#111111' },
                    { id: 'green', hex: '#3aaa6a', border: '#3aaa6a' },
                ].map(c => (
                    <button
                        key={c.id}
                        onClick={() => onChange(c.id)}
                        title={c.id}
                        style={{
                            width: 28, height: 28, borderRadius: 6,
                            background: c.hex,
                            border: `2.5px solid ${value === c.id ? '#3aaa6a' : c.border}`,
                            boxShadow: value === c.id ? '0 0 0 2px rgba(58,170,106,0.35)' : 'none',
                            cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
                        }}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="content-creator">
            {/* Header */}
            <div className="pg-header">
                <div className="pg-header-icon"><Rocket size={22} color="white" /></div>
                <div className="pg-header-text">
                    <h1>Launch Ideas</h1>
                    <p>10 curated post ideas to introduce Udarsy — generate posters and captions in bulk</p>
                </div>
            </div>

            {globalError && <div className="pg-status-bar error" style={{ marginBottom: 16 }}><AlertCircle size={15} />{globalError}</div>}
            {globalStatus && !globalError && <div className="pg-status-bar" style={{ marginBottom: 16 }}><CheckCircle2 size={15} />{globalStatus}</div>}

            {/* Controls */}
            <div className="pg-card" style={{ marginBottom: 20 }}>
                <p className="pg-card-title" style={{ marginBottom: 12 }}><Sparkles size={15} color="var(--green)" /> Generation Settings</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                    <div className="pg-input-group">
                        <label className="pg-label">Theme</label>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {['green', 'white', 'random'].map(t => (
                                <button key={t} className={`pg-btn ${theme === t ? 'pg-btn-primary' : 'pg-btn-ghost'}`}
                                    style={{ flex: 1, gap: 5, padding: '6px 8px', fontSize: '0.75rem' }} onClick={() => setTheme(t)}>
                                    <div style={{ width: 12, height: 12, borderRadius: 3, background: t === 'green' ? '#3aaa6a' : t === 'white' ? '#ffffff' : 'linear-gradient(45deg, #3aaa6a 50%, #ffffff 50%)', border: '1.5px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="pg-input-group">
                        <label className="pg-label">Image Model</label>
                        <select className="pg-input" value={imageModel} onChange={e => setImageModel(e.target.value)}>
                            <option value="ghost">Ghost API (Infip)</option>
                            <option value="dall-e-2">DALL-E 2</option>
                            <option value="dall-e-3">DALL-E 3</option>
                            <option value="gpt-image-1">GPT-Image-1 (best)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Idea list */}
            <div className="pg-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button className="pg-btn pg-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={toggleAll}>
                            {selected.size === launchIdeas.length ? <CheckSquare size={14} /> : <Square size={14} />}
                            {selected.size === launchIdeas.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selected.size} / {launchIdeas.length} selected</span>
                    </div>
                    <button className="pg-btn pg-btn-primary" onClick={generateAll} disabled={bulkRunning || selected.size === 0}>
                        {bulkRunning
                            ? <><div className="pg-spinner" /> Generating...</>
                            : <><ImageIcon size={15} /> Generate {selected.size > 0 ? `${selected.size} Selected` : 'Selected'}</>}
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {launchIdeas.map(idea => {
                        const r = results[idea.id] || {};
                        const d = drafts[idea.id] || {};
                        const isSelected = selected.has(idea.id);
                        const isExpanded = expandedEdits.has(idea.id);

                        return (
                            <div key={idea.id} style={{
                                border: isSelected ? '2px solid var(--green)' : '1.5px solid var(--border)',
                                borderRadius: 12, padding: 16,
                                background: isSelected ? 'var(--green-50)' : 'white',
                                transition: 'all 0.15s',
                            }}>
                                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                    {/* Checkbox */}
                                    <div onClick={() => toggleIdea(idea.id)} style={{ cursor: 'pointer', color: isSelected ? 'var(--green)' : 'var(--text-secondary)', flexShrink: 0, paddingTop: 2 }}>
                                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 4 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--dark)' }}>#{idea.id} {idea.title}</span>
                                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: 'var(--green)', fontWeight: 600 }}>
                                                    {idea.angle}
                                                </span>
                                                {r.status && (
                                                    <span style={{ fontSize: '0.75rem', color: r.status === 'error' ? '#ef4444' : r.status === 'ready' ? 'var(--green)' : 'var(--text-secondary)' }}>
                                                        {statusLabel[r.status] || r.status}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                className="pg-btn pg-btn-ghost"
                                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                onClick={(e) => { e.stopPropagation(); toggleEdit(idea.id); }}
                                            >
                                                ⚙️ Settings &amp; Edit
                                            </button>
                                        </div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                                            <strong style={{ color: 'var(--dark)' }}>"{d.headline}"</strong>
                                            {d.subline && <span style={{ marginLeft: 6, opacity: 0.7 }}>— {d.subline}</span>}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{idea.description}</div>

                                        {/* Per-post Editing Panel */}
                                        {isExpanded && (
                                            <div style={{ background: '#f8faf9', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginTop: 12 }}>
                                                {/* Text fields */}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                                    <div className="pg-input-group" style={{ marginBottom: 0 }}>
                                                        <label className="pg-label" style={{ fontSize: '0.75rem' }}>Headline</label>
                                                        <input className="pg-input" style={{ fontSize: '0.8rem', padding: '6px 10px' }} value={d.headline} onChange={e => updateDraft(idea.id, { headline: e.target.value })} />
                                                    </div>
                                                    <div className="pg-input-group" style={{ marginBottom: 0 }}>
                                                        <label className="pg-label" style={{ fontSize: '0.75rem' }}>Subline</label>
                                                        <input className="pg-input" style={{ fontSize: '0.8rem', padding: '6px 10px' }} value={d.subline} onChange={e => updateDraft(idea.id, { subline: e.target.value })} />
                                                    </div>
                                                </div>

                                                {/* Logo & UDARSY overlay controls */}
                                                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                                                    <p style={{ margin: '0 0 10px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--dark)' }}>🖼️ Overlay Settings</p>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                                                        {/* Logo section */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                                                                <input type="checkbox" checked={d.showLogo} onChange={e => updateDraftAndRecomposite(idea, { showLogo: e.target.checked })} />
                                                                Show SVG Logo
                                                            </label>
                                                            {d.showLogo && (
                                                                <>
                                                                    <ColorPicker label="Logo Color" value={d.logoColor} onChange={v => updateDraftAndRecomposite(idea, { logoColor: v })} />
                                                                    <div className="pg-input-group" style={{ marginBottom: 0 }}>
                                                                        <label className="pg-label" style={{ fontSize: '0.75rem' }}>Logo Corner</label>
                                                                        <select className="pg-input" style={{ fontSize: '0.8rem', padding: '6px 10px' }} value={d.logoCorner} onChange={e => updateDraftAndRecomposite(idea, { logoCorner: e.target.value })}>
                                                                            {CORNERS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                                                        </select>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* UDARSY text section */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                                                                <input type="checkbox" checked={d.showUdarsy} onChange={e => updateDraftAndRecomposite(idea, { showUdarsy: e.target.checked })} />
                                                                Show UDARSY Text
                                                            </label>
                                                            {d.showUdarsy && (
                                                                <>
                                                                    <div className="pg-input-group" style={{ marginBottom: 0 }}>
                                                                        <label className="pg-label" style={{ fontSize: '0.75rem' }}>Text Color</label>
                                                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                                            <button
                                                                                onClick={() => updateDraftAndRecomposite(idea, { udarsyColor: 'auto' })}
                                                                                style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: `2px solid ${d.udarsyColor === 'auto' ? '#3aaa6a' : 'var(--border)'}`, background: d.udarsyColor === 'auto' ? '#f0fdf4' : 'transparent', cursor: 'pointer', color: 'var(--dark)' }}
                                                                            >Auto</button>
                                                                            {[{ id: 'white', hex: '#ffffff' }, { id: 'black', hex: '#111111' }, { id: 'green', hex: '#3aaa6a' }].map(c => (
                                                                                <button key={c.id} onClick={() => updateDraftAndRecomposite(idea, { udarsyColor: c.id })} title={c.id}
                                                                                    style={{ width: 24, height: 24, borderRadius: 6, background: c.hex, border: `2.5px solid ${d.udarsyColor === c.id ? '#3aaa6a' : '#d1d5db'}`, boxShadow: d.udarsyColor === c.id ? '0 0 0 2px rgba(58,170,106,0.3)' : 'none', cursor: 'pointer', transition: 'all 0.15s' }}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="pg-input-group" style={{ marginBottom: 0 }}>
                                                                        <label className="pg-label" style={{ fontSize: '0.75rem' }}>Text Corner</label>
                                                                        <select className="pg-input" style={{ fontSize: '0.8rem', padding: '6px 10px' }} value={d.udarsyCorner} onChange={e => updateDraftAndRecomposite(idea, { udarsyCorner: e.target.value })}>
                                                                            {CORNERS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                                                        </select>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Language */}
                                                        <div className="pg-input-group" style={{ marginBottom: 0 }}>
                                                            <label className="pg-label" style={{ fontSize: '0.75rem' }}>Caption Language</label>
                                                            <select className="pg-input" style={{ fontSize: '0.8rem', padding: '6px 10px' }} value={d.language} onChange={e => updateDraft(idea.id, { language: e.target.value })}>
                                                                <option value="en">English</option>
                                                                <option value="fr">French</option>
                                                                <option value="ar">Arabic</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Caption */}
                                                <div className="pg-input-group" style={{ marginBottom: 12 }}>
                                                    <label className="pg-label" style={{ fontSize: '0.75rem' }}>Social Caption</label>
                                                    <textarea className="pg-textarea" rows={3} style={{ fontSize: '0.8rem', padding: '8px 10px' }} value={d.caption} onChange={e => updateDraft(idea.id, { caption: e.target.value })} placeholder="Caption will be generated here..." />
                                                </div>

                                                {/* Re-apply */}
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                                    {r.status === 'ready' && (
                                                        <button className="pg-btn pg-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => reComposite(idea)}>
                                                            <RefreshCw size={12} /> Apply New Overlays
                                                        </button>
                                                    )}
                                                    <button className="pg-btn pg-btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => generateForIdea(idea)} disabled={r.status === 'generating' || r.status === 'imaging' || r.status === 'compositing'}>
                                                        <ImageIcon size={12} /> Generate This
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Result output */}
                                        {r.status === 'ready' && (
                                            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16 }}>
                                                <div>
                                                    <img src={r.compositedUrl} alt={idea.title}
                                                        style={{ width: '100%', borderRadius: 10, border: '1px solid var(--border)', display: 'block' }} />
                                                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                                                        <button className="pg-btn pg-btn-primary" style={{ padding: '5px 10px', fontSize: '0.72rem', flex: 1 }}
                                                            onClick={() => saveIdea(idea)} disabled={r.saving}>
                                                            {r.saving ? <><div className="pg-spinner" /> Saving...</> : <><Save size={12} /> Save</>}
                                                        </button>
                                                        <button className="pg-btn pg-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.72rem', flex: 1 }}
                                                            onClick={() => download(r.compositedUrl, `udarsy-${idea.id}-${Date.now()}.png`)}>
                                                            <Download size={12} /> Download
                                                        </button>
                                                    </div>
                                                    {r.saved && <div style={{ fontSize: '0.7rem', color: 'var(--green)', marginTop: 6 }}>✅ Saved to {r.savedTo}</div>}
                                                </div>
                                                {d.caption && (
                                                    <div>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            Caption Preview
                                                        </div>
                                                        <div style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--dark)', whiteSpace: 'pre-wrap', background: '#f8faf9', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                                                            {d.caption}
                                                        </div>
                                                        <button className="pg-btn pg-btn-ghost" style={{ marginTop: 6, padding: '4px 10px', fontSize: '0.72rem' }}
                                                            onClick={() => navigator.clipboard.writeText(d.caption)}>
                                                            <Copy size={11} /> Copy Caption
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {r.error && <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#ef4444' }}>❌ {r.error}</div>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default LaunchIdeas;
