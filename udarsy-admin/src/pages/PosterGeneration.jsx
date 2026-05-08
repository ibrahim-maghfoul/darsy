import React, { useState, useRef } from 'react';
import {
    Sparkles, Image as ImageIcon, Download, RefreshCw, CheckCircle2,
    AlertCircle, TrendingUp, Save, Copy
} from 'lucide-react';
import { makeLLMRequest } from '../utils/aiService';
import { adminFetch } from '../utils/adminFetch';
import { buildImagePrompt } from '../utils/promptBuilder';
import './ContentCreator.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const SVG_LOGO_PATH = '/assets/logo/logo.svg';

const THEMES = {
    white: { bgColor: '#ffffff', label: 'White' },
    green: { bgColor: '#3aaa6a', label: 'Green' },
    random: { bgColor: 'linear-gradient(45deg, #3aaa6a 50%, #ffffff 50%)', label: 'Randomize' },
};

const CORNERS = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-right', label: 'Bottom Right' },
];

const LANGUAGES = [
    { id: 'en', label: 'English' },
    { id: 'fr', label: 'French' },
    { id: 'ar', label: 'Arabic' },
];

const API_BASE = 'http://localhost:5000/api';

const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

const tintSvg = (svgText, color) =>
    svgText
        .replace(/fill="#000000"/g, `fill="${color}"`)
        .replace(/fill="black"/gi, `fill="${color}"`);

const loadColoredSvg = (svgText, color) => new Promise((resolve, reject) => {
    const tinted = tintSvg(svgText, color);
    const blob = new Blob([tinted], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
});

const hexForColor = (c) => c === 'white' ? '#ffffff' : c === 'green' ? '#3aaa6a' : '#111111';


// ── Component ─────────────────────────────────────────────────────────────────

const PosterGeneration = () => {
    // Step
    const [step, setStep] = useState(1); // 1=topic, 2=review, 3=poster

    // Topic / trends
    const [trendsFilter, setTrendsFilter] = useState('education');
    const [trends, setTrends] = useState([]);
    const [trendsLoading, setTrendsLoading] = useState(false);
    const [topic, setTopic] = useState('');
    const [topicId, setTopicId] = useState('');

    // Generated content
    const [title, setTitle] = useState('');
    const [headline, setHeadline] = useState('');
    const [subline, setSubline] = useState('');
    const [designPhrase, setDesignPhrase] = useState('');
    const [mood, setMood] = useState('');
    const [geometricDensity, setGeometricDensity] = useState('');
    const [figurePlacement, setFigurePlacement] = useState('');
    const [shapeStyle, setShapeStyle] = useState('');
    const [bgTexture, setBgTexture] = useState('');
    const [manualPromptOverride, setManualPromptOverride] = useState(null);

    // Poster
    const [theme, setTheme] = useState('random');
    const [imageModel, setImageModel] = useState('ghost');
    const [imagesPerGen, setImagesPerGen] = useState(1);
    const [posters, setPosters] = useState([]);
    const [selectedPoster, setSelectedPoster] = useState(null);
    const [compositedUrl, setCompositedUrl] = useState('');

    // Overlays
    const [logoCorner, setLogoCorner] = useState('top-left');
    const [showLogo, setShowLogo] = useState(true);
    const [showUdarsy, setShowUdarsy] = useState(true);
    const [logoColor, setLogoColor] = useState('white');    // 'white' | 'black' | 'green'
    const [udarsyColor, setUdarsyColor] = useState('auto');   // 'auto' | 'white' | 'black' | 'green'

    // SVG cache ref
    const svgTextRef = useRef(null);
    const getSvgText = async () => {
        if (svgTextRef.current) return svgTextRef.current;
        const res = await fetch(SVG_LOGO_PATH);
        svgTextRef.current = await res.text();
        return svgTextRef.current;
    };

    // UI
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const [savedCount, setSavedCount] = useState(0);
    const [currentProvider, setCurrentProvider] = useState('');
    const [captionLanguage, setCaptionLanguage] = useState('en');
    const [designLanguage, setDesignLanguage] = useState('en');
    const [udarsyCorner, setUdarsyCorner] = useState('top-right');
    const [regenDPLoading, setRegenDPLoading] = useState(false);
    const [socialCaption, setSocialCaption] = useState('');
    const [regenCaptionLoading, setRegenCaptionLoading] = useState(false);

    const keys = {
        nebius: import.meta.env.VITE_NEBIUS_API_KEY,
        openrouter: import.meta.env.VITE_OPENROUTER_API_KEY,
    };

    // ── Fetch trends ───────────────────────────────────────────────────────
    const fetchTrends = async () => {
        setTrendsLoading(true); setError('');
        try {
            const q = trendsFilter ? `?topic=${encodeURIComponent(trendsFilter)}` : '';
            const res = await adminFetch(`/poster/trends${q}`);
            const data = await res.json();
            const items = data.full?.length > 0
                ? data.full
                : (data.trends || []).map((t, i) => ({ rank: i + 1, title: t, source: '' }));
            setTrends(items);
        } catch {
            setError('Could not fetch trends. Enter a topic manually.');
        } finally {
            setTrendsLoading(false);
        }
    };

    // ── Generate content via Nebius ────────────────────────────────────────
    const generateContent = async () => {
        if (!topic.trim()) { setError('Enter or select a topic first.'); return; }
        const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
        setTopicId(`${slug}_${Date.now()}`);
        setError(''); setLoading(true); setProgress(20);
        setStatus('Generating creative concept via Nebius...');
        try {
            const captionLang = captionLanguage === 'fr' ? 'French' : captionLanguage === 'ar' ? 'Arabic' : 'English';
            const dpLang = designLanguage === 'fr' ? 'French' : designLanguage === 'ar' ? 'Arabic' : 'English';
            const response = await makeLLMRequest([
                {
                    role: 'system',
                    content: `You are a creative director for Udarsy, an educational platform for Moroccan students.
Return ONLY valid JSON, no markdown. title, headline, and subline must be in ${captionLang}. designPhrase must be in ${dpLang}.

IMPORTANT: mood, geometricDensity, figurePlacement, shapeStyle, and bgTexture MUST be chosen from EXACTLY the options listed — no variations, no freeform text.

{
  "title": "short captivating title (in ${captionLang})",
  "headline": "bold punchy poster headline (max 6 words, in ${captionLang})",
  "subline": "short supportive subtitle (optional, leave empty if not needed, in ${captionLang})",
  "designPhrase": "Vivid scene description for image AI: describe what the figure is doing, the setting, props, and action. In ${dpLang}. 2–3 sentences, very specific.",
  "mood": "MUST be exactly one of: calm and confident | energetic and dynamic | contemplative and still | bold and assertive | hopeful and aspirational",
  "geometricDensity": "MUST be exactly one of: sparse | balanced | layered",
  "figurePlacement": "MUST be exactly one of: lower-left third | right-of-center | lower-right bleeding edge | centered but asymmetrically cropped",
  "shapeStyle": "choose one geometric language that fits the mood, MUST be translated to ${dpLang}. e.g. 'bold overlapping circles and arcs' | 'sharp angular polygons and triangles' | 'floating squares and rectangles in perspective'",
  "bgTexture": "choose one subtle texture, MUST be translated to ${dpLang}. e.g. 'fine grain noise' | 'soft linen weave' | 'smooth matte' | 'subtle concrete grain'"
}`
                },
                {
                    role: 'user',
                    content: `Topic: "${topic}". Transform into a compelling educational Instagram poster concept. Return ONLY JSON.`
                }
            ], { keys, addLog: setStatus, setCurrentProvider });

            const raw = response?.choices?.[0]?.message?.content?.trim();
            const cleaned = raw?.replace(/```json\n?/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);

            setTitle(parsed.title || '');
            setHeadline(parsed.headline || '');
            setSubline(parsed.subline || '');
            setDesignPhrase(parsed.designPhrase || '');
            setMood(parsed.mood || '');
            setGeometricDensity(parsed.geometricDensity || '');
            setFigurePlacement(parsed.figurePlacement || '');
            setShapeStyle(parsed.shapeStyle || '');
            setBgTexture(parsed.bgTexture || '');
            setManualPromptOverride(null);
            setProgress(100); setStatus('Content ready!');
            setStep(2);
        } catch (err) {
            setError(`Content generation failed: ${err.message}`);
            setStatus('');
        } finally {
            setLoading(false); setProgress(0);
        }
    };

    // ── Regenerate Design Phrase only ──────────────────────────────────────
    const regenerateDesignPhrase = async () => {
        if (!topic.trim()) { setError('Topic is required to regenerate.'); return; }
        setRegenDPLoading(true); setError('');
        try {
            const dpLang = designLanguage === 'fr' ? 'French' : designLanguage === 'ar' ? 'Arabic' : 'English';
            const response = await makeLLMRequest([
                {
                    role: 'system',
                    content: `You are a creative director. Return ONLY valid JSON with fields: "designPhrase", "mood", "geometricDensity", "figurePlacement", "shapeStyle", "bgTexture". All constrained as follows:
- mood: exactly one of: calm and confident | energetic and dynamic | contemplative and still | bold and assertive | hopeful and aspirational
- geometricDensity: exactly one of: sparse | balanced | layered
- figurePlacement: exactly one of: lower-left third | right-of-center | lower-right bleeding edge | centered but asymmetrically cropped
- shapeStyle: one geometric visual language sentence (freeform, MUST be in ${dpLang})
- bgTexture: one subtle texture sentence (freeform, MUST be in ${dpLang})
- designPhrase: vivid 2-3 sentence scene, in ${dpLang}`
                },
                {
                    role: 'user',
                    content: `Topic: "${topic}". Headline: "${headline}". Generate a fresh design concept. Return ONLY JSON.`
                }
            ], { keys, addLog: () => { }, setCurrentProvider });
            const raw = response?.choices?.[0]?.message?.content?.trim();
            const cleaned = raw?.replace(/```json\n?/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            if (parsed.designPhrase) setDesignPhrase(parsed.designPhrase);
            if (parsed.mood) setMood(parsed.mood);
            if (parsed.geometricDensity) setGeometricDensity(parsed.geometricDensity);
            if (parsed.figurePlacement) setFigurePlacement(parsed.figurePlacement);
            if (parsed.shapeStyle) setShapeStyle(parsed.shapeStyle);
            if (parsed.bgTexture) setBgTexture(parsed.bgTexture);
            setManualPromptOverride(null);
        } catch (err) {
            setError(`Regeneration failed: ${err.message}`);
        } finally {
            setRegenDPLoading(false);
        }
    };

    // ── Generate social media caption ─────────────────────────────────────
    const generateSocialCaption = async () => {
        setRegenCaptionLoading(true);
        try {
            const captionLang = captionLanguage === 'fr' ? 'French' : captionLanguage === 'ar' ? 'Arabic' : 'English';
            const response = await makeLLMRequest([
                {
                    role: 'system',
                    content: `You are a social media expert for Udarsy, an educational platform for Moroccan students. Write a single social media caption in ${captionLang}. Include 3-5 relevant emojis and end with 5-8 hashtags. No JSON, no markdown — plain text only. Max 200 characters before the hashtags.`
                },
                {
                    role: 'user',
                    content: `Topic: "${topic}". Headline: "${headline}". Subline: "${subline}". Write a compelling Instagram/Facebook caption.`
                }
            ], { keys, addLog: () => { }, setCurrentProvider });
            const caption = response?.choices?.[0]?.message?.content?.trim() || '';
            if (caption) setSocialCaption(caption);
        } catch {
            // caption is optional — fail silently
        } finally {
            setRegenCaptionLoading(false);
        }
    };

    // ── Generate poster images ─────────────────────────────────────────────
    const generatePoster = async () => {
        if (!designPhrase) { setError('Generate content first.'); return; }
        setError(''); setLoading(true); setProgress(10);
        setStatus('Building image prompt...');
        setPosters([]); setCompositedUrl(''); setSelectedPoster(null);
        try {
            const n = Math.min(Math.max(parseInt(imagesPerGen) || 1, 1), 4);
            const activeTheme = theme === 'random' ? (Math.random() > 0.5 ? 'green' : 'white') : theme;
            const dpLang = designLanguage === 'fr' ? 'French' : designLanguage === 'ar' ? 'Arabic' : 'English';
            let prompt = manualPromptOverride !== null
                ? manualPromptOverride
                : buildImagePrompt({ designPhrase, theme: activeTheme, headline, subline, mood, geometricDensity, figurePlacement, shapeStyle, bgTexture, lang: dpLang });

            setProgress(30);
            setStatus(`Generating ${n} poster(s) via ${imageModel === 'ghost' ? 'Ghost API' : imageModel}...`);

            const res = await adminFetch('/poster/generate-poster-image', {
                method: 'POST',
                body: JSON.stringify({ prompt, size: '1024x1024', n, model: imageModel }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Generation failed');

            const all = (data.data?.map(img => img.url).filter(Boolean).map(url => ({ url, theme: activeTheme })) || []);
            if (all.length === 0) throw new Error('No images returned');

            setPosters(all);
            setSelectedPoster(all[0]);
            setProgress(100);
            setStatus(`${all.length} poster(s) generated. Style and save below.`);
            setStep(3);
            applyOverlays(all[0], showUdarsy, showLogo, logoCorner, udarsyCorner, logoColor, udarsyColor);
            generateSocialCaption();
        } catch (err) {
            setError(`Poster generation failed: ${err.message}`);
            setStatus('');
        } finally {
            setLoading(false);
            // Delay progress reset so user sees 100% bar before it clears
            setTimeout(() => setProgress(0), 600);
        }
    };

    // ── Canvas compositing ─────────────────────────────────────────────────
    const applyOverlays = async (
        entry = selectedPoster,
        udarsyOn = showUdarsy,
        logoOn = showLogo,
        corner = logoCorner,
        dCorner = udarsyCorner,
        lColor = logoColor,
        dColor = udarsyColor,
    ) => {
        const poster = entry || selectedPoster;
        if (!poster?.url) return;
        setLoading(true); setStatus('Compositing overlays...');
        try {
            const src = poster.url.startsWith('data:')
                ? poster.url
                : `${API_BASE}/poster/proxy?url=${encodeURIComponent(poster.url)}`;

            const blob = await fetch(src).then(r => { if (!r.ok) throw new Error('Proxy failed'); return r.blob(); });
            const posterObjUrl = URL.createObjectURL(blob);
            const posterImg = await loadImage(posterObjUrl);
            URL.revokeObjectURL(posterObjUrl);

            const canvas = document.createElement('canvas');
            canvas.width = posterImg.naturalWidth || posterImg.width;
            canvas.height = posterImg.naturalHeight || posterImg.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(posterImg, 0, 0);

            // UDARSY text
            if (udarsyOn) {
                const pad = canvas.width * 0.03;
                const sz = Math.round(canvas.width * 0.038);
                ctx.font = `700 ${sz}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
                const tw = ctx.measureText('UDARSY').width;
                let resolvedUdarsyColor;
                if (dColor === 'auto') {
                    resolvedUdarsyColor = poster.theme === 'green' ? '#ffffff' : '#111111';
                } else {
                    resolvedUdarsyColor = hexForColor(dColor);
                }
                ctx.fillStyle = resolvedUdarsyColor;
                const dIsBottom = dCorner.startsWith('bottom');
                const dIsRight = dCorner.endsWith('right');
                ctx.textBaseline = dIsBottom ? 'bottom' : 'top';
                const dx = dIsRight ? canvas.width - tw - pad : pad;
                const dy = dIsBottom ? canvas.height - pad : pad;
                ctx.fillText('UDARSY', dx, dy);
            }

            // SVG logo overlay
            if (logoOn) {
                try {
                    const svgText = await getSvgText();
                    const logoImg = await loadColoredSvg(svgText, hexForColor(lColor));
                    const pad = canvas.width * 0.03;
                    const lw = 80;
                    const lh = 80;
                    let x = pad, y = pad;
                    if (corner === 'top-right') { x = canvas.width - lw - pad; }
                    if (corner === 'bottom-left') { y = canvas.height - lh - pad; }
                    if (corner === 'bottom-right') { x = canvas.width - lw - pad; y = canvas.height - lh - pad; }
                    ctx.drawImage(logoImg, x, y, lw, lh);
                } catch (e) { console.warn('SVG logo render failed:', e); }
            }

            setCompositedUrl(canvas.toDataURL('image/png'));
            setStatus('Preview ready.');
        } catch (err) {
            setError(`Compositing failed: ${err.message}`);
            setStatus('');
        } finally {
            setLoading(false);
        }
    };

    // ── Save final image ───────────────────────────────────────────────────
    const saveFinal = async () => {
        if (!compositedUrl) return;
        setLoading(true); setStatus('Saving to server...');
        try {
            const res = await adminFetch('/poster/save-session', {
                method: 'POST',
                body: JSON.stringify({
                    topicId, topic, title, headline, subline,
                    designPrompt: designPhrase,
                    socialCaption,
                    theme: selectedPoster?.theme || theme,
                    model: imageModel, language: captionLanguage === 'fr' ? 'French' : captionLanguage === 'ar' ? 'Arabic' : 'English',
                    imageUrl: compositedUrl,
                }),
            });
            const data = await res.json();
            setSavedCount(c => c + 1);
            setStatus(`✅ Saved to ${data.folder}`);
        } catch (err) {
            setError(`Save failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const download = (url, name) => {
        const a = document.createElement('a');
        a.href = url; a.download = name;
        if (!url.startsWith('data:')) a.target = '_blank';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const reset = () => {
        setStep(1); setTopic(''); setTopicId(''); setTrends([]);
        setTitle(''); setHeadline(''); setSubline(''); setDesignPhrase(''); setSocialCaption('');
        setMood(''); setGeometricDensity(''); setFigurePlacement(''); setShapeStyle(''); setBgTexture('');
        setPosters([]); setSelectedPoster(null); setCompositedUrl('');
        setLogoColor('white'); setUdarsyColor('auto');
        setError(''); setStatus(''); setSavedCount(0);
        setManualPromptOverride(null);
    };

    const STEPS = [
        { n: 1, label: 'Topic' },
        { n: 2, label: 'Review' },
        { n: 3, label: 'Poster' },
    ];

    return (
        <div className="content-creator">
            {/* Header */}
            <div className="pg-header">
                <div className="pg-header-icon"><ImageIcon size={22} color="white" /></div>
                <div className="pg-header-text">
                    <h1>Poster Generation</h1>
                    <p>Trend → Nebius concept → AI poster → styled output</p>
                </div>
            </div>

            {/* Step indicators */}
            <div className="pg-steps">
                {STEPS.map((s, i) => (
                    <React.Fragment key={s.n}>
                        <div className={`pg-step ${step === s.n ? 'active' : step > s.n ? 'done' : ''}`}>
                            <div className="pg-step-num">{step > s.n ? '✓' : s.n}</div>
                            {s.label}
                        </div>
                        {i < STEPS.length - 1 && <div className="pg-step-sep" />}
                    </React.Fragment>
                ))}
            </div>

            {/* Status */}
            {error && <div className="pg-status-bar error" style={{ marginBottom: 16 }}><AlertCircle size={15} />{error}</div>}
            {status && !error && (
                <div className="pg-status-bar" style={{ marginBottom: 16 }}>
                    {loading ? <div className="pg-spinner pg-spinner-dark" /> : <CheckCircle2 size={15} />}
                    {status}
                </div>
            )}
            {loading && progress > 0 && (
                <div className="pg-progress-track" style={{ marginBottom: 16 }}>
                    <div className="pg-progress-fill" style={{ width: `${progress}%` }} />
                </div>
            )}

            {/* ── STEP 1: Trends & Topic ──────────────────────────────────── */}
            {step === 1 && (
                <div className="pg-card">
                    <p className="pg-card-title"><TrendingUp size={16} color="var(--green)" /> Morocco Trends &amp; Topic</p>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-end' }}>
                        <div className="pg-input-group" style={{ marginBottom: 0, flex: 1 }}>
                            <label className="pg-label">Filter (e.g. education, sport, tech)</label>
                            <input
                                className="pg-input"
                                placeholder="education"
                                value={trendsFilter}
                                onChange={e => setTrendsFilter(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchTrends()}
                            />
                        </div>
                        <button className="pg-btn pg-btn-ghost" onClick={fetchTrends} disabled={trendsLoading} style={{ flexShrink: 0 }}>
                            {trendsLoading ? <><div className="pg-spinner pg-spinner-dark" /> Fetching...</> : <><RefreshCw size={14} /> Fetch Morocco News</>}
                        </button>
                    </div>

                    {trends.length > 0 && (
                        <div className="pg-input-group">
                            <label className="pg-label">Trending now — click to select</label>
                            <div className="pg-keywords-wrap">
                                {trends.map((t, i) => (
                                    <button
                                        key={i}
                                        className={`pg-keyword-tag${topic === t.title ? ' active' : ''}`}
                                        onClick={() => setTopic(t.title)}
                                        title={t.source}
                                    >
                                        <span style={{ marginRight: t.source ? 4 : 0 }}>{t.rank}.</span>
                                        {t.title}
                                        {t.source && <span style={{ opacity: 0.6, fontSize: '0.7em', marginLeft: 4 }}>— {t.source}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pg-input-group">
                        <label className="pg-label">Topic / Custom Input</label>
                        <input
                            className="pg-input"
                            placeholder="e.g. BAC exam preparation, or click a trend above"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && generateContent()}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="pg-input-group">
                            <label className="pg-label">Image Model</label>
                            <select className="pg-input" value={imageModel} onChange={e => setImageModel(e.target.value)}>
                                <option value="ghost">Ghost API (Infip)</option>
                                <option value="dall-e-2">OpenAI DALL-E 2</option>
                                <option value="dall-e-3">OpenAI DALL-E 3</option>
                                <option value="gpt-image-1">OpenAI GPT-Image-1 (best)</option>
                            </select>
                        </div>
                        <div className="pg-input-group">
                            <label className="pg-label">Images per generation (1–4)</label>
                            <input
                                className="pg-input" type="number" min={1} max={4}
                                value={imagesPerGen}
                                onChange={e => setImagesPerGen(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 4))}
                            />
                        </div>
                        <div className="pg-input-group">
                            <label className="pg-label">Caption Language</label>
                            <select className="pg-input" value={captionLanguage} onChange={e => setCaptionLanguage(e.target.value)}>
                                {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                            </select>
                        </div>
                        <div className="pg-input-group">
                            <label className="pg-label">Design Phrase Language</label>
                            <select className="pg-input" value={designLanguage} onChange={e => setDesignLanguage(e.target.value)}>
                                {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="pg-footer-btns">
                        <button className="pg-btn pg-btn-primary" onClick={generateContent} disabled={loading}>
                            {loading ? <><div className="pg-spinner" /> Generating concept...</> : <><Sparkles size={15} /> Generate Concept via Nebius</>}
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 2: Review Content ──────────────────────────────────── */}
            {step === 2 && (
                <div className="pg-card">
                    <p className="pg-card-title"><CheckCircle2 size={16} color="var(--green)" /> Review &amp; Edit Concept</p>

                    <div className="pg-content-grid">
                        <div className="pg-input-group">
                            <label className="pg-label">Title</label>
                            <input className="pg-input" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                            <div className="pg-input-group">
                                <label className="pg-label">Poster Headline</label>
                                <input className="pg-input" value={headline} onChange={e => setHeadline(e.target.value)} />
                            </div>
                            <div className="pg-input-group">
                                <label className="pg-label">Subline (optional)</label>
                                <input className="pg-input" value={subline} onChange={e => setSubline(e.target.value)} placeholder="Leave empty if not needed" />
                            </div>
                        </div>
                        <div className="pg-input-group" style={{ marginBottom: 16 }}>
                            <label className="pg-label">Theme</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {Object.entries(THEMES).map(([k, v]) => (
                                    <button
                                        key={k}
                                        className={`pg-btn ${theme === k ? 'pg-btn-primary' : 'pg-btn-ghost'}`}
                                        style={{ flex: 1, padding: '8px 12px', gap: 8 }}
                                        onClick={() => setTheme(k)}
                                    >
                                        <div style={{ width: 12, height: 12, borderRadius: 3, background: v.bgColor, border: '1.5px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="pg-input-group">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <label className="pg-label" style={{ marginBottom: 0 }}><Sparkles size={13} color="var(--green)" style={{ marginRight: 5, display: 'inline', verticalAlign: 'middle' }} /> Design Phrase (for AI)</label>
                                <button
                                    className="pg-btn pg-btn-ghost"
                                    style={{ padding: '4px 10px', fontSize: '0.75rem', gap: 5 }}
                                    onClick={regenerateDesignPhrase}
                                    disabled={regenDPLoading}
                                >
                                    {regenDPLoading ? <><div className="pg-spinner pg-spinner-dark" /> Regenerating...</> : <><RefreshCw size={12} /> Regenerate</>}
                                </button>
                            </div>
                            <textarea className="pg-textarea" rows={4} value={designPhrase} onChange={e => setDesignPhrase(e.target.value)} />
                        </div>

                        {/* Constrained parameter badges */}
                        {(mood || geometricDensity || figurePlacement) && (
                            <div className="pg-input-group" style={{ marginBottom: 16 }}>
                                <label className="pg-label">Composition Parameters</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {mood && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 160, flex: 1 }}>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mood</span>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--dark)', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '5px 10px' }}>{mood}</span>
                                        </div>
                                    )}
                                    {geometricDensity && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 100, flex: 1 }}>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Density</span>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--dark)', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '5px 10px' }}>{geometricDensity}</span>
                                        </div>
                                    )}
                                    {figurePlacement && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 200, flex: 2 }}>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Figure Placement</span>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--dark)', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '5px 10px' }}>{figurePlacement}</span>
                                        </div>
                                    )}
                                </div>
                                {(shapeStyle || bgTexture) && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                        {shapeStyle && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 200 }}>
                                                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shape Style</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--dark)', background: '#fafafa', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px' }}>{shapeStyle}</span>
                                            </div>
                                        )}
                                        {bgTexture && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 160 }}>
                                                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Background Texture</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--dark)', background: '#fafafa', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px' }}>{bgTexture}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pg-input-group" style={{ marginTop: 4 }}>
                            <label className="pg-label" style={{ color: 'var(--text-secondary)' }}>
                                Full Image Generation Prompt
                            </label>
                            <textarea
                                className="pg-textarea"
                                rows={12}
                                value={manualPromptOverride !== null ? manualPromptOverride : buildImagePrompt({ designPhrase, theme: theme === 'random' ? 'green' : theme, headline, subline, mood, geometricDensity, figurePlacement, shapeStyle, bgTexture, lang: designLanguage === 'fr' ? 'French' : designLanguage === 'ar' ? 'Arabic' : 'English' })}
                                onChange={e => setManualPromptOverride(e.target.value)}
                                style={{ fontFamily: 'monospace', fontSize: '0.78rem', resize: 'vertical', background: '#fafafa', border: '1.5px solid var(--border)' }}
                            />
                            {manualPromptOverride !== null && (
                                <button
                                    onClick={() => setManualPromptOverride(null)}
                                    style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: '0.65rem', fontWeight: 700, padding: 0, marginTop: 6, cursor: 'pointer', textAlign: 'right', display: 'block', width: '100%' }}
                                >
                                    Reset to Auto-Generated Prompt
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="pg-footer-btns" style={{ marginTop: 20 }}>
                        <button className="pg-btn pg-btn-ghost" onClick={() => setStep(1)}>← Back</button>
                        <button className="pg-btn pg-btn-primary" onClick={generatePoster} disabled={loading}>
                            {loading ? <><div className="pg-spinner" /> Generating...</> : <><ImageIcon size={15} /> Generate Poster</>}
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 3: Poster + Overlays ───────────────────────────────── */}
            {step === 3 && (
                <div className="pg-card">
                    <p className="pg-card-title"><ImageIcon size={16} color="var(--green)" /> Style &amp; Save</p>

                    {posters.length > 1 && (
                        <div className="pg-input-group">
                            <label className="pg-label">Click a variation to select it</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                                {posters.map((entry, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            setSelectedPoster(entry);
                                            setCompositedUrl('');
                                            applyOverlays(entry, showUdarsy, showLogo, logoCorner, udarsyCorner);
                                        }}
                                        style={{
                                            borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                                            border: selectedPoster?.url === entry.url ? '2.5px solid var(--green)' : '2px solid var(--border)',
                                            boxShadow: selectedPoster?.url === entry.url ? '0 0 0 2px rgba(58,170,106,0.25)' : 'none',
                                            transition: 'border 0.15s',
                                        }}
                                    >
                                        <img src={entry.url} alt={`Var ${i + 1}`} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="cc-poster-layout">
                        {/* Preview */}
                        <div className="cc-poster-preview">
                            <img
                                src={compositedUrl || selectedPoster?.url}
                                alt="Poster preview"
                                style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)', display: 'block' }}
                            />
                            {savedCount > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--green)', marginTop: 10 }}>
                                    <CheckCircle2 size={13} /> {savedCount} image{savedCount > 1 ? 's' : ''} saved successfully
                                </div>
                            )}
                            <div className="pg-footer-btns" style={{ marginTop: 12 }}>
                                <button className="pg-btn pg-btn-primary" onClick={saveFinal} disabled={!compositedUrl || loading}>
                                    <Save size={14} /> Save Final Image
                                </button>
                                <button className="pg-btn pg-btn-ghost" onClick={() => download(compositedUrl || selectedPoster?.url, `udarsy-${Date.now()}.png`)} disabled={!compositedUrl && !selectedPoster}>
                                    <Download size={14} /> Download
                                </button>
                                <button className="pg-btn pg-btn-ghost" onClick={generatePoster} disabled={loading}>
                                    <RefreshCw size={14} /> Regenerate
                                </button>
                            </div>
                        </div>

                        {/* Overlay Controls */}
                        <div className="cc-logo-panel">
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 16 }}>Overlays</p>

                            {/* Toggles */}
                            <div className="pg-input-group" style={{ marginBottom: 14 }}>
                                <label className="pg-label">Show / Hide</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showLogo} onChange={e => {
                                            const v = e.target.checked; setShowLogo(v);
                                            applyOverlays(selectedPoster, showUdarsy, v, logoCorner, udarsyCorner, logoColor, udarsyColor);
                                        }} /> Show SVG Logo
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showUdarsy} onChange={e => {
                                            const v = e.target.checked; setShowUdarsy(v);
                                            applyOverlays(selectedPoster, v, showLogo, logoCorner, udarsyCorner, logoColor, udarsyColor);
                                        }} /> Show UDARSY Text
                                    </label>
                                </div>
                            </div>

                            {/* SVG Logo settings */}
                            {showLogo && (
                                <>
                                    <div className="pg-input-group">
                                        <label className="pg-label">Logo Color</label>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {[{ id: 'white', hex: '#ffffff', border: '#d1d5db' }, { id: 'black', hex: '#111111', border: '#111111' }, { id: 'green', hex: '#3aaa6a', border: '#3aaa6a' }].map(c => (
                                                <button key={c.id} title={c.id}
                                                    onClick={() => { setLogoColor(c.id); applyOverlays(selectedPoster, showUdarsy, showLogo, logoCorner, udarsyCorner, c.id, udarsyColor); }}
                                                    style={{ width: 30, height: 30, borderRadius: 8, background: c.hex, border: `2.5px solid ${logoColor === c.id ? '#3aaa6a' : c.border}`, boxShadow: logoColor === c.id ? '0 0 0 3px rgba(58,170,106,0.3)' : 'none', cursor: 'pointer', transition: 'all 0.15s' }}
                                                />
                                            ))}
                                        </div>
                                    </div>



                                    <div className="pg-input-group">
                                        <label className="pg-label">Logo Corner</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                            {CORNERS.map(c => (
                                                <button key={c.id}
                                                    className={`pg-btn ${logoCorner === c.id ? 'pg-btn-primary' : 'pg-btn-ghost'}`}
                                                    style={{ padding: '7px 10px', fontSize: '0.75rem' }}
                                                    onClick={() => { setLogoCorner(c.id); applyOverlays(selectedPoster, showUdarsy, showLogo, c.id, udarsyCorner, logoColor, udarsyColor); }}
                                                >
                                                    {c.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* UDARSY text settings */}
                            {showUdarsy && (
                                <>
                                    <div className="pg-input-group">
                                        <label className="pg-label">UDARSY Text Color</label>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => { setUdarsyColor('auto'); applyOverlays(selectedPoster, showUdarsy, showLogo, logoCorner, udarsyCorner, logoColor, 'auto'); }}
                                                style={{ fontSize: '0.65rem', fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: `2px solid ${udarsyColor === 'auto' ? '#3aaa6a' : 'var(--border)'}`, background: udarsyColor === 'auto' ? '#f0fdf4' : 'transparent', cursor: 'pointer', color: 'var(--dark)' }}
                                            >Auto</button>
                                            {[{ id: 'white', hex: '#ffffff' }, { id: 'black', hex: '#111111' }, { id: 'green', hex: '#3aaa6a' }].map(c => (
                                                <button key={c.id} title={c.id}
                                                    onClick={() => { setUdarsyColor(c.id); applyOverlays(selectedPoster, showUdarsy, showLogo, logoCorner, udarsyCorner, logoColor, c.id); }}
                                                    style={{ width: 28, height: 28, borderRadius: 6, background: c.hex, border: `2.5px solid ${udarsyColor === c.id ? '#3aaa6a' : '#d1d5db'}`, boxShadow: udarsyColor === c.id ? '0 0 0 2px rgba(58,170,106,0.3)' : 'none', cursor: 'pointer', transition: 'all 0.15s' }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pg-input-group">
                                        <label className="pg-label">UDARSY Text Corner</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                            {CORNERS.map(c => (
                                                <button key={c.id}
                                                    className={`pg-btn ${udarsyCorner === c.id ? 'pg-btn-primary' : 'pg-btn-ghost'}`}
                                                    style={{ padding: '7px 10px', fontSize: '0.75rem' }}
                                                    onClick={() => { setUdarsyCorner(c.id); applyOverlays(selectedPoster, showUdarsy, showLogo, logoCorner, c.id, logoColor, udarsyColor); }}
                                                >
                                                    {c.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Social Media Caption */}
                    <div className="pg-input-group" style={{ marginTop: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <label className="pg-label" style={{ marginBottom: 0 }}>
                                <Sparkles size={13} color="var(--green)" style={{ marginRight: 5, display: 'inline', verticalAlign: 'middle' }} />
                                Social Media Caption
                            </label>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    className="pg-btn pg-btn-ghost"
                                    style={{ padding: '4px 10px', fontSize: '0.75rem', gap: 5 }}
                                    onClick={generateSocialCaption}
                                    disabled={regenCaptionLoading}
                                >
                                    {regenCaptionLoading
                                        ? <><div className="pg-spinner pg-spinner-dark" /> Generating...</>
                                        : <><RefreshCw size={12} /> {socialCaption ? 'Regenerate' : 'Generate'}</>}
                                </button>
                                {socialCaption && (
                                    <button
                                        className="pg-btn pg-btn-ghost"
                                        style={{ padding: '4px 10px', fontSize: '0.75rem', gap: 5 }}
                                        onClick={() => navigator.clipboard.writeText(socialCaption)}
                                        title="Copy to clipboard"
                                    >
                                        <Copy size={12} /> Copy
                                    </button>
                                )}
                            </div>
                        </div>
                        {regenCaptionLoading && !socialCaption
                            ? <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', padding: '10px 0' }}>Generating caption...</div>
                            : <textarea
                                className="pg-textarea"
                                rows={4}
                                value={socialCaption}
                                onChange={e => setSocialCaption(e.target.value)}
                                placeholder="Caption will be generated automatically with the poster…"
                            />
                        }
                    </div>

                    <div className="pg-footer-btns" style={{ marginTop: 20 }}>
                        <button className="pg-btn pg-btn-ghost" onClick={reset}>
                            <Sparkles size={14} /> New Topic
                        </button>
                        <button className="pg-btn pg-btn-ghost" onClick={() => setStep(2)}>← Edit Concept</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PosterGeneration;
