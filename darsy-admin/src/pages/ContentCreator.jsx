import React, { useState } from 'react';
import {
    Sparkles, Image as ImageIcon, Download, RefreshCw, CheckCircle2,
    AlertCircle, Wand2, TrendingUp, Share2
} from 'lucide-react';
import { makeLLMRequest } from '../utils/aiService';
import { adminFetch } from '../utils/adminFetch';
import './ContentCreator.css';

const THEMES = {
    white: { bgColor: '#ffffff', headlineColor: '#3aaa6a', darsyColor: '#111111' },
    green: { bgColor: '#3aaa6a', headlineColor: '#ffffff', darsyColor: '#ffffff' },
};

const buildImagePrompt = ({ title, designPrompt, stylePhrase, theme = 'white', headline, subline }) => {
    const bgColor = theme === 'green' ? 'green (#3aaa6a)' : 'white (#ffffff)';
    const accentColor = theme === 'green' ? 'white (#ffffff)' : 'green (#3aaa6a)';
    const textColor = theme === 'green' ? 'white (#ffffff)' : 'black (#111111)';
    const styleLine = stylePhrase || '2D design';

    return `${styleLine}, Solid ${bgColor} background.

PRIMARY COLOR PALETTE — green (#3aaa6a) is the primary brand color:
- Primary accent & shapes: ${accentColor}
- Characters, figures, and organic elements: styled as described in the scene — use the green (#3aaa6a) palette, NOT forced grayscale
- FORBIDDEN: orange, yellow, red, blue, brown, any warm tone whatsoever

OUTPUT FORMAT — STRICT:
- Elements, shapes, and figures must touch or bleed off the edges — nothing floats in the center with empty space around it

SCENE:
Topic: ${title}
${designPrompt}

TEXT — exactly these phrases, no other text:
1. "${headline}" — large bold display type, off-center, color ${textColor}
${subline ? `2. "${subline}" — small light weight, near the headline, color ${textColor}` : ''}

COMPOSITION:
- Subject and shapes must extend to and bleed off all four edges — nothing is centered in empty space
- Large background shapes, gradients, or color fills must reach every corner
- Do NOT include any brand name, logo, or watermark`.trim();
};

const CORNERS = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-right', label: 'Bottom Right' },
];

const SOCIAL_PLATFORMS = [
    { name: 'Instagram', color: '#e1306c' },
    { name: 'Facebook', color: '#1877f2' },
    { name: 'TikTok', color: '#010101' },
];

const API_BASE = 'http://localhost:5000/api';

const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

const STEPS = [
    { n: 1, label: 'Topic' },
    { n: 2, label: 'Content' },
    { n: 3, label: 'Poster' },
    { n: 4, label: 'Publish' },
];

const ContentCreator = () => {
    const [step, setStep] = useState(1);

    // Step 1
    const [topic, setTopic] = useState('');
    const [topicId, setTopicId] = useState('');
    const [language, setLanguage] = useState('English');
    const [imageModel, setImageModel] = useState('ghost');
    const [imagesPerTheme, setImagesPerTheme] = useState(1);
    const [trends, setTrends] = useState([]);
    const [trendsLoading, setTrendsLoading] = useState(false);
    const [trendsFilter, setTrendsFilter] = useState('education');

    // Step 2
    const [title, setTitle] = useState('');
    const [headline, setHeadline] = useState('');
    const [subline, setSubline] = useState('');
    const [designPrompt, setDesignPrompt] = useState('');
    const [stylePhrase, setStylePhrase] = useState('');
    const [theme, setTheme] = useState('green');
    const [manualPromptOverride, setManualPromptOverride] = useState(null);

    // Step 3 — posters stored as { url, theme } so DARSY color is always correct
    const [posters, setPosters] = useState([]); // [{ url, theme }]
    const [selectedPoster, setSelectedPoster] = useState(null); // { url, theme }
    const [compositedUrl, setCompositedUrl] = useState('');
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('/assets/logo/logo.png');
    const [logoCorner, setLogoCorner] = useState('top-left');
    const [showDarsy, setShowDarsy] = useState(true);
    const [showLogo, setShowLogo] = useState(true);
    const [caption, setCaption] = useState('');
    const [captionLoading, setCaptionLoading] = useState(false);

    // Shared
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const [currentProvider, setCurrentProvider] = useState('');
    const [savedCount, setSavedCount] = useState(0);

    const keys = {
        nebius: import.meta.env.VITE_NEBIUS_API_KEY,
        openrouter: import.meta.env.VITE_OPENROUTER_API_KEY,
    };

    // ── Save finalized image to backend ────────────────────────────────────────
    const saveFinalImage = async () => {
        if (!compositedUrl) return;
        setLoading(true); setStatus('Saving final image to server...');
        try {
            const res = await adminFetch('/poster/save-session', {
                method: 'POST',
                body: JSON.stringify({
                    topicId,
                    topic, title, headline, subline, designPrompt,
                    theme: selectedPoster?.theme || theme,
                    model: imageModel, language,
                    imageUrl: compositedUrl,
                    caption,
                }),
            });
            const data = await res.json();
            setSavedCount(c => c + 1);
            setStatus(`Saved to ${data.folder}`);
        } catch (err) {
            setError(`Save failed: ${err.message}`);
            setStatus('');
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch Morocco trends ─────────────────────────────────────────────────
    const fetchTrends = async () => {
        setTrendsLoading(true);
        setError('');
        try {
            const query = trendsFilter ? `?topic=${encodeURIComponent(trendsFilter)}` : '';
            const res = await adminFetch(`/poster/trends${query}`);
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

    // ── Generate content with LLM ────────────────────────────────────────────
    const generateContent = async () => {
        if (!topic.trim()) { setError('Please enter or select a topic first.'); return; }
        const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
        setTopicId(`${slug}_${Date.now()}`);
        setError(''); setLoading(true); setProgress(20);
        setStatus('Generating creative content...');
        try {
            const response = await makeLLMRequest([
                {
                    role: 'system',
                    content: `You are an expert creative director for Darsy, an educational platform for Moroccan students.
Write all text in ${language}, but write "designPrompt" and "stylePhrase" entirely in English.
Return ONLY valid JSON — no markdown, no extra text.

{
  "title": "short captivating title",
  "headline": "bold punchy poster headline",
  "subline": "short supportive subtitle (optional, leave empty string if not needed)",
  "stylePhrase": "Opening style directive for the image generator. Vary between styles like: 'Flat 2D editorial graphic design', '3D render illustration', 'Isometric vector art', 'Bold typographic poster design', 'Flat artistic editorial graphic design', 'Minimalist geometric illustration', etc. Choose the style that best fits the topic.",
  "designPrompt": "Highly creative visual scene for image generation. Based on the chosen stylePhrase, describe: whether there are characters (their style matching the stylePhrase — flat vector, 3D rendered, isometric, etc.), lighting, composition, props, and any geometric or decorative elements. Be specific and artistic. Characters and elements should use the green (#3aaa6a) palette."
}`
                },
                {
                    role: 'user',
                    content: `Create an Instagram educational poster about: "${topic}". Return ONLY valid JSON.`
                }
            ], { keys, addLog: setStatus, setCurrentProvider });

            const raw = response?.choices?.[0]?.message?.content?.trim();
            const cleaned = raw?.replace(/```json\n?/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);

            setTitle(parsed.title || '');
            setHeadline(parsed.headline || '');
            setSubline(parsed.subline || '');
            setStylePhrase(parsed.stylePhrase || '');
            setDesignPrompt(parsed.designPrompt || '');
            setManualPromptOverride(null);
            setProgress(100);
            setStatus('Content ready!');
            setStep(2);
        } catch (err) {
            setError(`Content generation failed: ${err.message}`);
            setStatus('');
        } finally {
            setLoading(false); setProgress(0);
        }
    };

    // ── Generate poster images + caption in parallel ────────────────────────
    const generatePoster = async () => {
        if (!title || !designPrompt) { setError('Fill in content first.'); return; }
        setError(''); setLoading(true); setProgress(10);
        setStatus('Building image prompt...');
        setPosters([]); setCompositedUrl(''); setSelectedPoster(null); setCaption('');

        // Animate progress 10 → 85% while waiting for the API
        const progressInterval = setInterval(() => {
            setProgress(prev => prev < 85 ? Math.min(prev + 0.4, 85) : 85);
        }, 400);

        try {
            const n = Math.min(Math.max(parseInt(imagesPerTheme) || 1, 1), 4);
            const imagePrompt = manualPromptOverride !== null 
                ? manualPromptOverride 
                : buildImagePrompt({ title, designPrompt, stylePhrase, theme, headline, subline });

            const modelLabel = imageModel === 'ghost' ? 'Ghost API'
                : imageModel === 'gpt-image-1' ? 'GPT-Image-1'
                    : imageModel.toUpperCase();
            setStatus(`Generating poster${n > 1 ? 's' : ''} + caption via ${modelLabel}...`);

            const [posterData, captionText] = await Promise.all([
                adminFetch('/poster/generate-poster-image', {
                    method: 'POST',
                    body: JSON.stringify({ prompt: imagePrompt, size: '1024x1024', n, model: imageModel }),
                }).then(async r => {
                    const d = await r.json();
                    if (!r.ok) throw new Error(d.error || 'Generation failed');
                    return d;
                }),
                makeLLMRequest([
                    {
                        role: 'system',
                        content: `You are a social media expert for Darsy, an educational platform for Moroccan students.
Write one engaging social media caption that works across Instagram, Facebook and TikTok.
- Use relevant emojis
- Include 3–5 relevant hashtags at the end
- Mention Darsy (e.g. "— Darsy Team 🌿")
- Write in ${language}
- Return ONLY the caption text, no extra explanation`,
                    },
                    {
                        role: 'user',
                        content: `Write a caption for:\nTopic: ${topic}\nHeadline: ${headline}\nSubline: ${subline || '(none)'}`,
                    },
                ], { keys, addLog: () => { }, setCurrentProvider: () => { } })
                    .then(r => r?.choices?.[0]?.message?.content?.trim() || '')
                    .catch(() => ''),
            ]);

            clearInterval(progressInterval);

            const allPosters = (posterData.data?.map(img => img.url).filter(Boolean).map(url => ({ url, theme })) || []);
            if (allPosters.length === 0) throw new Error('No image URLs in response');

            setPosters(allPosters);
            setSelectedPoster(allPosters[0]);
            if (captionText) setCaption(captionText);
            setProgress(100);
            setStatus(`Generated ${allPosters.length} poster${allPosters.length > 1 ? 's' : ''} + caption!`);
            setStep(3);
            applyLogo(allPosters[0], true, true, 'top-left');
        } catch (err) {
            clearInterval(progressInterval);
            setError(`Poster generation failed: ${err.message}`);
            setStatus('');
        } finally {
            setLoading(false); setProgress(0);
        }
    };

    // ── Regenerate caption only ──────────────────────────────────────────────
    const regenerateCaption = async () => {
        setCaptionLoading(true); setError('');
        try {
            const response = await makeLLMRequest([
                {
                    role: 'system',
                    content: `You are a social media expert for Darsy, an educational platform for Moroccan students.
Write one engaging social media caption that works across Instagram, Facebook and TikTok.
- Use relevant emojis
- Include 3–5 relevant hashtags at the end
- Mention Darsy (e.g. "— Darsy Team 🌿")
- Write in ${language}
- Return ONLY the caption text, no extra explanation`,
                },
                {
                    role: 'user',
                    content: `Write a caption for:\nTopic: ${topic}\nHeadline: ${headline}\nSubline: ${subline || '(none)'}`,
                },
            ], { keys, addLog: () => { }, setCurrentProvider: () => { } });
            const text = response?.choices?.[0]?.message?.content?.trim();
            if (!text) throw new Error('Empty response');
            setCaption(text);
        } catch (err) {
            setError(`Caption generation failed: ${err.message}`);
        } finally {
            setCaptionLoading(false);
        }
    };

    // ── Stamp DARSY + optional logo onto canvas ──────────────────────────────
    const applyLogo = async (entry = selectedPoster, darsyOn = showDarsy, logoOn = showLogo, corner = logoCorner) => {
        const poster = entry || selectedPoster;
        if (!poster?.url) return;
        setLoading(true); setStatus('Compositing overlays onto poster...');
        try {
            const isDataUrl = poster.url.startsWith('data:');
            const posterSrc = isDataUrl
                ? poster.url
                : `${API_BASE}/poster/proxy?url=${encodeURIComponent(poster.url)}`;

            const posterBlob = await fetch(posterSrc).then(r => { if (!r.ok) throw new Error('Proxy failed'); return r.blob(); });
            const posterObjUrl = URL.createObjectURL(posterBlob);
            const logoObjUrl = logoFile ? URL.createObjectURL(logoFile) : '/assets/logo/logo.png';

            const [posterImg, logoImg] = await Promise.all([
                loadImage(posterObjUrl),
                loadImage(logoObjUrl).catch(() => null),
            ]);

            const canvas = document.createElement('canvas');
            canvas.width = posterImg.naturalWidth || posterImg.width;
            canvas.height = posterImg.naturalHeight || posterImg.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(posterImg, 0, 0);

            if (darsyOn) {
                const darsyPad = canvas.width * 0.03;
                const darsySize = Math.round(canvas.width * 0.038);
                ctx.font = `700 ${darsySize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
                ctx.textBaseline = 'top';
                const darsyW = ctx.measureText('DARSY').width;
                ctx.fillStyle = poster.theme === 'green' ? '#ffffff' : '#111111';
                ctx.fillText('DARSY', canvas.width - darsyW - darsyPad, darsyPad);
            }

            if (logoOn && logoImg) {
                const pad = canvas.width * 0.015;
                const logoW = canvas.width * 0.18;
                const logoH = (logoImg.naturalHeight / logoImg.naturalWidth) * logoW;

                let x = pad, y = pad;
                if (corner === 'top-right') { x = canvas.width - logoW - pad; }
                if (corner === 'bottom-left') { y = canvas.height - logoH - pad; }
                if (corner === 'bottom-right') { x = canvas.width - logoW - pad; y = canvas.height - logoH - pad; }

                ctx.drawImage(logoImg, x, y, logoW, logoH);
            }

            URL.revokeObjectURL(posterObjUrl);
            if (logoFile) URL.revokeObjectURL(logoObjUrl);

            setCompositedUrl(canvas.toDataURL('image/png'));
            setStatus('Logo applied!');
        } catch (err) {
            setError(`Logo compositing failed: ${err.message}`);
            setStatus('');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
        setCompositedUrl('');
    };

    const handleSelectPoster = (entry) => {
        setSelectedPoster(entry);
        setCompositedUrl('');
        // Apply with current checkbox state
        applyLogo(entry, showDarsy, showLogo, logoCorner);
    };

    const download = (url, name) => {
        const a = document.createElement('a');
        a.href = url; a.download = name;
        if (!url.startsWith('data:')) a.target = '_blank';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const reset = () => {
        setStep(1); setTopic(''); setTopicId(''); setTrends([]); setStatus('');
        setTitle(''); setHeadline(''); setSubline(''); setStylePhrase(''); setDesignPrompt('');
        setPosters([]); setSelectedPoster(null); setCompositedUrl('');
        setLogoFile(null); setLogoPreview('');
        setError(''); setSavedCount(0); setCaption('');
        setManualPromptOverride(null);
    };

    const previewPrompt = (title || designPrompt)
        ? buildImagePrompt({ title, designPrompt, stylePhrase, theme, headline, subline })
        : '';

    const StatusBar = ({ style }) => (
        <>
            {error && (
                <div className="pg-status-bar error" style={style}>
                    <AlertCircle size={15} /> {error}
                </div>
            )}
            {status && !error && (
                <div className="pg-status-bar" style={style}>
                    {loading ? <div className="pg-spinner pg-spinner-dark" /> : <CheckCircle2 size={15} />}
                    {status}
                </div>
            )}
            {loading && progress > 0 && (
                <div className="pg-progress-track">
                    <div className="pg-progress-fill" style={{ width: `${progress}%` }} />
                </div>
            )}
        </>
    );

    return (
        <div className="content-creator">
            {/* Header */}
            <div className="pg-header">
                <div className="pg-header-icon">
                    <Sparkles size={22} color="white" />
                </div>
                <div className="pg-header-text">
                    <h1>Social Media Content Creator</h1>
                    <p>Morocco trends → AI content → poster → publish</p>
                </div>
            </div>

            {/* Steps */}
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

            {/* ── STEP 1: Trends & Topic ─────────────────────────────────────── */}
            {step === 1 && (
                <div className="pg-card">
                    <p className="pg-card-title"><TrendingUp size={16} color="var(--green)" /> Morocco Trends & Topic</p>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-end' }}>
                        <div className="pg-input-group" style={{ marginBottom: 0, flex: 1 }}>
                            <label className="pg-label">Filter by topic (e.g. education, sport, tech)</label>
                            <input
                                className="pg-input"
                                placeholder="education"
                                value={trendsFilter}
                                onChange={e => setTrendsFilter(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchTrends()}
                            />
                        </div>
                        <button className="pg-btn pg-btn-ghost" onClick={fetchTrends} disabled={trendsLoading} style={{ flexShrink: 0 }}>
                            {trendsLoading
                                ? <><div className="pg-spinner pg-spinner-dark" /> Fetching...</>
                                : <><RefreshCw size={14} /> Fetch Morocco News</>}
                        </button>
                    </div>

                    {trends.length > 0 && (
                        <div className="pg-input-group">
                            <label className="pg-label">Trending now in Morocco (Google News) — click to use</label>
                            <div className="pg-keywords-wrap">
                                {trends.map((t, i) => (
                                    <button
                                        key={i}
                                        className={`pg-keyword-tag${topic === t.title ? ' active' : ''}`}
                                        onClick={() => setTopic(t.title)}
                                        title={t.source || ''}
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
                        <label className="pg-label">Topic / Custom input</label>
                        <input
                            className="pg-input"
                            placeholder="e.g. BAC exam preparation, or click a trend above"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && generateContent()}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        <div className="pg-input-group">
                            <label className="pg-label">Language</label>
                            <select className="pg-input" value={language} onChange={e => setLanguage(e.target.value)}>
                                <option>English</option>
                                <option>French</option>
                                <option>Arabic</option>
                            </select>
                        </div>
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
                            <label className="pg-label">Images per theme (1–4)</label>
                            <input
                                className="pg-input"
                                type="number"
                                min={1}
                                max={4}
                                value={imagesPerTheme}
                                onChange={e => setImagesPerTheme(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 4))}
                            />
                        </div>
                    </div>

                    <StatusBar />

                    <div className="pg-footer-btns">
                        <button className="pg-btn pg-btn-primary" onClick={generateContent} disabled={loading}>
                            {loading
                                ? <><div className="pg-spinner" /> Generating content...</>
                                : <><Wand2 size={15} /> Generate Content</>}
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 2: Content Review ─────────────────────────────────────── */}
            {step === 2 && (
                <div className="pg-card">
                    <p className="pg-card-title"><CheckCircle2 size={16} color="var(--green)" /> Review & Edit Content</p>

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
                                {Object.keys(THEMES).map(t => (
                                    <button
                                        key={t}
                                        className={`pg-btn ${theme === t ? 'pg-btn-primary' : 'pg-btn-ghost'}`}
                                        style={{ flex: 1, padding: '8px 12px', gap: 8 }}
                                        onClick={() => setTheme(t)}
                                    >
                                        <div style={{ width: 12, height: 12, borderRadius: 3, background: THEMES[t].bgColor, border: '1.5px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pg-input-group">
                            <label className="pg-label">
                                <Sparkles size={13} color="var(--green)" style={{ marginRight: 5, display: 'inline', verticalAlign: 'middle' }} />
                                Creative Visual Concept
                            </label>
                            <textarea className="pg-textarea" rows={4} value={designPrompt} onChange={e => setDesignPrompt(e.target.value)} />
                        </div>

                        <div className="pg-input-group">
                            <label className="pg-label" style={{ color: 'var(--text-secondary)' }}>
                                Image Prompt Preview ({theme} theme)
                            </label>
                            <textarea
                                className="pg-textarea"
                                rows={10}
                                value={manualPromptOverride !== null ? manualPromptOverride : previewPrompt}
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

                    <StatusBar style={{ marginTop: 16 }} />

                    <div className="pg-footer-btns" style={{ marginTop: 20 }}>
                        <button className="pg-btn pg-btn-ghost" onClick={() => setStep(1)}>← Back</button>
                        <button className="pg-btn pg-btn-primary" onClick={generatePoster} disabled={loading}>
                            {loading
                                ? <><div className="pg-spinner" /> Generating posters...</>
                                : <><ImageIcon size={15} /> Generate Posters</>}
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 3: Poster Variations + Logo ──────────────────────────── */}
            {step === 3 && (
                <div className="pg-card">
                    <p className="pg-card-title"><ImageIcon size={16} color="var(--green)" /> Select Variation & Add Logo</p>

                    {/* Variation grid */}
                    {posters.length > 1 && (
                        <div className="pg-input-group">
                            <label className="pg-label">Click a variation to select it</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 8 }}>
                                {posters.map((entry, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleSelectPoster(entry)}
                                        style={{
                                            borderRadius: 8,
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            border: selectedPoster?.url === entry.url ? '2.5px solid var(--green)' : '2px solid var(--border)',
                                            boxShadow: selectedPoster?.url === entry.url ? '0 0 0 2px rgba(58,170,106,0.25)' : 'none',
                                            transition: 'border 0.15s',
                                        }}
                                    >
                                        <img src={entry.url} alt={`Variation ${i + 1}`} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="cc-poster-layout">
                        {/* Selected poster preview */}
                        <div className="cc-poster-preview">
                            <img
                                src={compositedUrl || selectedPoster?.url}
                                alt="Selected poster"
                                style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border)', display: 'block' }}
                            />
                            {savedCount > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--green)', marginTop: 10, marginBottom: 2 }}>
                                    <CheckCircle2 size={13} />
                                    {savedCount} poster{savedCount > 1 ? 's' : ''} auto-saved to <code style={{ fontSize: '0.75rem' }}>data/content-sessions/{topicId}/</code>
                                </div>
                            )}
                            <div className="pg-footer-btns" style={{ marginTop: 12 }}>
                                <button
                                    className="pg-btn pg-btn-primary"
                                    style={{ background: 'var(--green)', borderColor: 'var(--green)' }}
                                    onClick={saveFinalImage}
                                    disabled={!compositedUrl || loading}
                                >
                                    <Download size={14} /> Save Final Image
                                </button>
                                <button className="pg-btn pg-btn-ghost" onClick={generatePoster} disabled={loading}>
                                    <RefreshCw size={14} /> Regenerate
                                </button>
                                <button className="pg-btn pg-btn-ghost" onClick={() => setStep(2)}>← Edit</button>
                            </div>
                        </div>

                        {/* Logo panel */}
                        <div className="cc-logo-panel">
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 16 }}>Logo Overlay</p>

                            <div className="pg-input-group">
                                <label className="pg-label">Upload Logo</label>
                                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ fontSize: '0.82rem' }} />
                                {logoPreview && (
                                    <img src={logoPreview} alt="Logo" style={{ marginTop: 10, height: 48, objectFit: 'contain', background: '#f5f5f5', borderRadius: 8, padding: 4 }} />
                                )}
                            </div>

                            <div className="pg-input-group">
                                <label className="pg-label">Corner (2% padding from edge)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                    {CORNERS.map(c => (
                                        <button
                                            key={c.id}
                                            className={`pg-btn ${logoCorner === c.id ? 'pg-btn-primary' : 'pg-btn-ghost'}`}
                                            style={{ padding: '7px 10px', fontSize: '0.75rem' }}
                                            onClick={() => { setLogoCorner(c.id); applyLogo(selectedPoster, showDarsy, showLogo, c.id); }}
                                        >
                                            {c.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pg-input-group" style={{ marginBottom: 16 }}>
                                <label className="pg-label">Overlays</label>
                                <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showLogo} onChange={e => {
                                            const v = e.target.checked; setShowLogo(v); applyLogo(selectedPoster, showDarsy, v, logoCorner);
                                        }} /> Show Logo
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showDarsy} onChange={e => {
                                            const v = e.target.checked; setShowDarsy(v); applyLogo(selectedPoster, v, showLogo, logoCorner);
                                        }} /> Show DARSY Text
                                    </label>
                                </div>
                            </div>

                            <button
                                className="pg-btn pg-btn-primary"
                                style={{ width: '100%' }}
                                onClick={() => download(compositedUrl || selectedPoster?.url, `darsy-${Date.now()}.png`)}
                                disabled={!compositedUrl || loading}
                            >
                                <Download size={14} /> Download Image Locally
                            </button>

                            {compositedUrl && (
                                <div className="pg-status-bar" style={{ marginTop: 12 }}>
                                    <CheckCircle2 size={15} /> Logo applied — download above
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Caption */}
                    {(caption || captionLoading) && (
                        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--dark)', margin: 0 }}>
                                    <Share2 size={14} color="var(--green)" style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                    Social Media Caption
                                </p>
                                <button
                                    className="pg-btn pg-btn-ghost"
                                    style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                                    onClick={regenerateCaption}
                                    disabled={captionLoading || loading}
                                >
                                    {captionLoading
                                        ? <><div className="pg-spinner pg-spinner-dark" /> Regenerating...</>
                                        : <><RefreshCw size={12} /> Regenerate</>}
                                </button>
                            </div>
                            {captionLoading ? (
                                <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', gap: 8 }}>
                                    <div className="pg-spinner pg-spinner-dark" /> Generating caption...
                                </div>
                            ) : (
                                <textarea
                                    className="pg-textarea"
                                    rows={4}
                                    value={caption}
                                    onChange={e => setCaption(e.target.value)}
                                />
                            )}
                        </div>
                    )}

                    <StatusBar style={{ marginTop: 16 }} />

                    <div className="pg-footer-btns" style={{ marginTop: 20 }}>
                        <button className="pg-btn pg-btn-ghost" onClick={reset}>
                            <Sparkles size={14} /> New Topic
                        </button>
                        <button className="pg-btn pg-btn-primary" onClick={() => setStep(4)}>
                            Continue to Publish →
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 4: Publish ───────────────────────────────────────────── */}
            {step === 4 && (
                <div className="pg-card">
                    <p className="pg-card-title"><Share2 size={16} color="var(--green)" /> Publish to Social Media</p>

                    <div className="cc-coming-soon">
                        <span style={{ fontSize: 28 }}>🚧</span>
                        <div>
                            <strong>Coming Soon</strong>
                            <p>Social media publishing will be enabled in the next update. Connect your accounts in Settings first.</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20, opacity: 0.4, pointerEvents: 'none' }}>
                        {SOCIAL_PLATFORMS.map(p => (
                            <div key={p.name} className="pg-card" style={{ textAlign: 'center', padding: 20 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: p.color, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Share2 size={22} color="white" />
                                </div>
                                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>Not connected</p>
                            </div>
                        ))}
                    </div>

                    <div className="pg-footer-btns" style={{ marginTop: 24 }}>
                        <button className="pg-btn pg-btn-ghost" onClick={() => setStep(3)}>← Back to Poster</button>
                        <button className="pg-btn pg-btn-ghost" onClick={reset}>
                            <Sparkles size={14} /> New Topic
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentCreator;
