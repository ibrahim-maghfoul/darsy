import React, { useState, useRef } from 'react';
import {
    Zap, Image as ImageIcon, Download, RefreshCw, Copy, CheckCircle2,
    AlertCircle, Trash2, ChevronDown, ChevronUp, Clock, Layers,
    Settings2, FlaskConical, Send, Sparkles, ArrowRight, Eye, EyeOff,
    RotateCcw, Info
} from 'lucide-react';
import { adminFetch } from '../utils/adminFetch';
import { makeLLMRequest } from '../utils/aiService';

// ── System prompt ──────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// STYLE_ID: GREEN_AE_01  —  Production Hierarchical Prompt
// 3 Layers: Identity (Immutable) > Scene Engine (Variable) > Render Rules
// ─────────────────────────────────────────────────────────────────────────────
const splitConfigs = [
    () => {
        const p = Math.floor(Math.random() * 30) + 35;
        return `left ${p}% #ffffff right ${100 - p}% #3aaa6a, hard edge no blending`;
    },
    () => {
        const p = Math.floor(Math.random() * 30) + 35;
        return `top ${p}% #3aaa6a bottom ${100 - p}% #ffffff, hard edge no blending`;
    },
    () => {
        const directions = [
            "top-left to bottom-right",
            "top-right to bottom-left",
            "top-center to bottom-left",
            "top-center to bottom-right",
        ];
        const dir = directions[Math.floor(Math.random() * directions.length)];
        return `diagonal split ${dir} upper zone #ffffff lower zone #3aaa6a, hard edge no blending`;
    },
];

const backgrounds = [
    { base: "#ffffff" },
    { base: "#3aaa6a" },
    { base: () => splitConfigs[Math.floor(Math.random() * splitConfigs.length)]() },
];

const getRandomBackground = () => {
    const bg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    return { base: typeof bg.base === "function" ? bg.base() : bg.base };
};

const getCinematicSystemPrompt = (topic) => {
    const bg = getRandomBackground();
    const isWhite = bg.base.startsWith("#ffffff");
    const isSplit = bg.base.includes("and");
    const geometryRule = isSplit
        ? "green #3aaa6a shapes on white zones, white #ffffff shapes on green zones"
        : isWhite
            ? "all geometry in #3aaa6a only"
            : "all geometry in #ffffff only";

    return `
You are a graphic design image prompt generator for Darys School (udarsyschool.com).
Generate one ready-to-use image generation prompt for the topic: "${topic}"

---

BACKGROUND (already chosen — do not change):
${bg.base}
Flat solid surface. You may optionally add one subtle repeating geometric texture
covering the ENTIRE surface uniformly including behind and around the student —
dot grid, line grid, honeycomb, diagonal hatching, cross grid, wave lines, or similar.
Texture color: on white base use near-white. On green base use slightly darker green.
Texture must be subtle — never dominant. Flat with no texture is also valid.

---

TEXT ELEMENTS (sharp, flat, crisp — no glow, no effect):
- "Darys" — top-right corner, small modern sans-serif
- "${topic}" — largest element, bold sans-serif, open side opposite the student
- Subtext — generate a 4–6 word phrase related to "${topic}", below headline, lighter weight
- "udarsyschool.com" — absolute bottom center, medium sans-serif

---
CHARACTER:
A confident 16–18 year old student stands as the main focus of the composition.
The student is smiling with a natural relaxed posture that expresses excitement,
curiosity, and a fresh start mindset. Their appearance is highly realistic with
natural skin tones. one hand holding an object related
to "${topic}", other arm relaxed, gaze at camera.
---

GEOMETRIC ELEMENTS:

Strictly 2D and flat. No depth. No 3D. No shadows on shapes.

Two colors only — white #ffffff and green #3aaa6a:
${geometryRule}
Gradients allowed between white and #3aaa6a only.

Shapes spread across the ENTIRE composition — all four corners, all edges,
all open space, around and over the student. Not clustered in one area.
Shapes layer in front of AND behind the student.

Shapes can be anything 2D: circles, rings, arcs, crescents, rectangles,
triangles, polygons, organic blobs, wave bands, zigzag lines, cross shapes,
overlapping flat transparent planes, dot grids, line patterns, flat silhouettes.

No glow. No neon. Flat color and form only.

---

OUTPUT FORMAT — one continuous paragraph in this exact order:

1. Background — must include the exact hex color(s) from: ${bg.base}
   Then state flat or textured, if textured name the pattern and confirm
   it covers the entire surface uniformly including behind the student

2. Text — one sentence each for all four elements

3. Student — five sentences:
   a. Exact physical description: age, gender, skin tone, hair color and style
   b. Expression, energy, and what that looks like on their face
   c. Exact frame position, crop level, body angle, what they hold and how
   d. Clothing: every item with specific colors and any green trim detail
   e. Lighting on the student only

4. Geometry:
   a. What the shapes are and how they move across the entire composition
   b. Confirm exact hex colors used and that all shapes are flat 2D no glow no shadow

5. Stop. Nothing after geometry.

BANNED SENTENCES — delete any sentence that:
- Starts with "The overall design..."
- Starts with "The shapes are layered..."
- Contains "visually appealing"
- Contains "engaging composition"
- Contains "showcases"
- Contains "incorporates a mix"
- Does not describe a single concrete visible thing
`;
};
// ── Constants ──────────────────────────────────────────────────────────────────

const MODELS = [
    { value: 'ghost', label: 'Ghost / img4 (Infip)', badge: 'Default', color: '#3aaa6a' },
    { value: 'dall-e-3', label: 'DALL·E 3 (OpenAI)', badge: 'HD', color: '#6366f1' },
    { value: 'dall-e-2', label: 'DALL·E 2 (OpenAI)', badge: 'Fast', color: '#8b5cf6' },
    { value: 'gpt-image-1', label: 'GPT-Image-1 (OpenAI)', badge: 'Best', color: '#f59e0b' },
];

const SIZES = ['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024'];

const EXAMPLE_TOPICS = [
    'BAC exam preparation — Udarsy',
    'Passing the brevet with confidence',
    'A student discovering the joy of mathematics',
    'Late-night study session before exams',
    'Breaking barriers through online education',
    'First day at university — a new chapter begins',
    'Mastering science with the help of technology',
    'Growing up and chasing academic dreams in Morocco',
];

const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
};

// ── Step pill ──────────────────────────────────────────────────────────────────

const StepBadge = ({ n, label, active, done }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 14px', borderRadius: 40,
        background: done ? '#f0fdf4' : active ? 'linear-gradient(135deg,#3aaa6a,#2d8a55)' : '#f3f4f6',
        border: `1.5px solid ${done ? '#bbf7d0' : active ? 'transparent' : 'var(--border)'}`,
        transition: 'all 0.25s',
    }}>
        <div style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            background: done ? '#3aaa6a' : active ? 'rgba(255,255,255,0.25)' : 'var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 800, color: done || active ? 'white' : 'var(--text-secondary)',
        }}>
            {done ? '✓' : n}
        </div>
        <span style={{
            fontSize: '0.78rem', fontWeight: 700,
            color: done ? '#15803d' : active ? 'white' : 'var(--text-secondary)',
        }}>
            {label}
        </span>
    </div>
);

// ── Main component ─────────────────────────────────────────────────────────────

const GhostApiTester = () => {

    // Step 1 — topic
    const [topic, setTopic] = useState('');
    const [llmProvider, setLlmProvider] = useState('auto');

    // Step 2 — LLM-generated prompt
    const [prompt, setPrompt] = useState('');
    const [promptProvider, setPromptProvider] = useState('');
    const [promptDuration, setPromptDuration] = useState(null);
    const [generatingPrompt, setGeneratingPrompt] = useState(false);
    const [showPrompt, setShowPrompt] = useState(true);

    // Step 3 — image generation
    const [model, setModel] = useState('ghost');
    const [size, setSize] = useState('1024x1024');
    const [numImages, setNumImages] = useState(1);
    const [generating, setGenerating] = useState(false);
    const [results, setResults] = useState([]);
    const [imgDuration, setImgDuration] = useState(null);

    // Status / errors
    const [llmStatus, setLlmStatus] = useState('');
    const [llmError, setLlmError] = useState('');
    const [imgStatus, setImgStatus] = useState('');
    const [imgError, setImgError] = useState('');

    // Misc UI
    const [copiedIdx, setCopiedIdx] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const topicRef = useRef(null);

    // Active step indicator
    const step = results.length > 0 ? 3 : prompt ? 2 : 1;

    const keys = {
        nebius: import.meta.env.VITE_NEBIUS_API_KEY,
        openai: import.meta.env.VITE_OPENROUTER_API_KEY,
        openrouter: import.meta.env.VITE_OPENROUTER_API_KEY,
        gemini: import.meta.env.VITE_GEMINI_API_KEY,
    };

    // ── Step 1 → 2: Generate cinematic prompt via Nebius ──────────────────────

    const generatePrompt = async () => {
        if (!topic.trim()) { setLlmError('Enter a topic first.'); return; }
        setLlmError(''); setLlmStatus('Contacting AI Provider…');
        setGeneratingPrompt(true); setPrompt(''); setResults([]); setImgError(''); setImgStatus('');
        setImgDuration(null); setPromptDuration(null); setPromptProvider('');
        const t0 = Date.now();
        try {
            const res = await makeLLMRequest(
                [
                    { role: 'system', content: getCinematicSystemPrompt(topic.trim()) },
                    { role: 'user', content: `Please generate the cinematic Ghost API prompt for the exact topic provided above.` },
                ],
                {
                    keys,
                    forceProvider: llmProvider === 'auto' ? undefined : llmProvider,
                    addLog: setLlmStatus,
                    setCurrentProvider: (p) => setPromptProvider(p),
                    config: { temperature: 0.92, maxTokens: 800 },
                }
            );
            const raw = res?.choices?.[0]?.message?.content?.trim() || '';
            if (!raw) throw new Error('Empty response from LLM.');
            setPrompt(raw);
            setPromptDuration(Date.now() - t0);
            setPromptProvider(res.provider || promptProvider);
            setLlmStatus(`✅ Cinematic prompt ready via ${res.provider?.toUpperCase() || 'AI'}`);
        } catch (err) {
            setLlmError(err.message);
            setLlmStatus('');
        } finally {
            setGeneratingPrompt(false);
        }
    };

    // ── Step 2 → 3: Generate image from prompt ────────────────────────────────

    const generateImage = async () => {
        if (!prompt.trim()) { setImgError('Generate or write a prompt first.'); return; }
        setImgError(''); setResults([]);
        const modelLabel = MODELS.find(m => m.value === model)?.label || model;
        setImgStatus(`Sending to ${modelLabel}…`);
        setGenerating(true);
        const t0 = Date.now();
        try {
            const res = await adminFetch('/poster/generate-poster-image', {
                method: 'POST',
                body: JSON.stringify({ prompt: prompt.trim(), size, n: numImages, model }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
            const urls = (data.data || []).map(img => img.url).filter(Boolean);
            if (urls.length === 0) throw new Error('No images returned from API.');
            const dur = Date.now() - t0;
            setImgDuration(dur);
            const newResults = urls.map(url => ({ url, prompt: prompt.trim(), model, size, durationMs: dur, ts: new Date().toISOString() }));
            setResults(newResults);
            setHistory(h => [{ topic: topic.trim(), prompt: prompt.trim(), model, size, results: newResults, ts: newResults[0].ts }, ...h].slice(0, 20));
            setImgStatus(`✅ ${urls.length} image${urls.length > 1 ? 's' : ''} generated in ${formatDuration(dur)}`);
        } catch (err) {
            setImgError(err.message);
            setImgStatus('');
        } finally {
            setGenerating(false);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    const reset = () => {
        setTopic(''); setPrompt(''); setResults([]);
        setLlmStatus(''); setLlmError(''); setImgStatus(''); setImgError('');
        setPromptProvider(''); setPromptDuration(null); setImgDuration(null);
        topicRef.current?.focus();
    };

    const downloadImage = (url, idx) => {
        const a = document.createElement('a');
        a.href = url; a.download = `udarsy-ghost-${Date.now()}-${idx + 1}.png`;
        if (!url.startsWith('data:')) a.target = '_blank';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    const copyToClipboard = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2000);
    };

    const selectedModel = MODELS.find(m => m.value === model) || MODELS[0];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 4px' }}>

            {/* ── Dark hero header ─────────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #0c1a13 0%, #152b1f 55%, #0a1e14 100%)',
                borderRadius: 20, padding: '28px 32px', marginBottom: 24,
                display: 'flex', alignItems: 'center', gap: 20,
                boxShadow: '0 8px 40px rgba(58,170,106,0.15)', position: 'relative', overflow: 'hidden',
            }}>
                {/* decorative blobs */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(58,170,106,0.06)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -20, right: 100, width: 90, height: 90, borderRadius: '50%', background: 'rgba(58,170,106,0.1)', pointerEvents: 'none' }} />

                <div style={{
                    width: 54, height: 54, borderRadius: 16, flexShrink: 0,
                    background: 'linear-gradient(135deg,#3aaa6a,#1e6e44)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 24px rgba(58,170,106,0.45)',
                }}>
                    <FlaskConical size={26} color="white" />
                </div>

                <div style={{ flex: 1 }}>
                    <h1 style={{ color: 'white', fontSize: '1.45rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                        Ghost API Tester
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', margin: '5px 0 0' }}>
                        Topic → Nebius (GREEN_AE_01 engine) → Ghost / OpenAI image
                    </p>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                        {[
                            { label: '16–18yo student', color: '#3aaa6a' },
                            { label: 'Darys top-left', color: '#3aaa6a' },
                            { label: 'White background', color: '#3aaa6a' },
                            { label: 'Green accent only', color: '#3aaa6a' },
                        ].map(t => (
                            <span key={t.label} style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'rgba(58,170,106,0.15)', border: '1px solid rgba(58,170,106,0.25)', color: '#3aaa6a' }}>
                                {t.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Step pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <StepBadge n={1} label="Topic" active={step === 1} done={step > 1} />
                    <ArrowRight size={14} color="rgba(255,255,255,0.25)" />
                    <StepBadge n={2} label="Prompt" active={step === 2} done={step > 2} />
                    <ArrowRight size={14} color="rgba(255,255,255,0.25)" />
                    <StepBadge n={3} label="Image" active={step === 3} done={false} />
                </div>

                {step > 1 && (
                    <button onClick={reset} style={{
                        padding: '7px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)',
                        cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0
                    }}>
                        <RotateCcw size={13} /> Reset
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

                {/* ── Left column ──────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* ── STEP 1: Topic input ─────────────────────────────── */}
                    <div style={{
                        background: 'white', borderRadius: 16, padding: 24,
                        border: step === 1 ? '1.5px solid var(--green)' : '1px solid var(--border)',
                        boxShadow: step === 1 ? '0 0 0 4px rgba(58,170,106,0.08)' : '0 2px 12px rgba(0,0,0,0.04)',
                        transition: 'border 0.2s, box-shadow 0.2s',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                            <div style={{
                                width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                                background: 'linear-gradient(135deg,#3aaa6a,#2d8a55)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.7rem', fontWeight: 800, color: 'white',
                            }}>1</div>
                            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--dark)' }}>
                                Enter Topic
                            </p>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                                Press Enter or click Generate Prompt
                            </span>
                        </div>

                        <input
                            ref={topicRef}
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && generatePrompt()}
                            placeholder="e.g. BAC exam preparation in Morocco, online education platform, young student discovering math…"
                            style={{
                                width: '100%', padding: '13px 16px', borderRadius: 12, boxSizing: 'border-box',
                                border: '1.5px solid var(--border)', fontSize: '0.9rem', fontFamily: 'inherit',
                                color: 'var(--dark)', background: '#fafafa', outline: 'none',
                                transition: 'border-color 0.15s, background 0.15s',
                            }}
                            onFocus={e => { e.target.style.borderColor = 'var(--green)'; e.target.style.background = 'white'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = '#fafafa'; }}
                        />

                        {/* Example chips */}
                        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {EXAMPLE_TOPICS.map((t, i) => (
                                <button
                                    key={i}
                                    onClick={() => setTopic(t)}
                                    style={{
                                        padding: '5px 11px', borderRadius: 20, border: '1px solid var(--border-light)',
                                        background: topic === t ? 'var(--green-100)' : 'transparent',
                                        color: topic === t ? 'var(--green)' : 'var(--text-secondary)',
                                        fontWeight: topic === t ? 700 : 500,
                                        cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.15s',
                                    }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* LLM status / error */}
                        {llmError && (
                            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <AlertCircle size={15} style={{ flexShrink: 0 }} /> {llmError}
                            </div>
                        )}
                        {llmStatus && !llmError && (
                            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                {generatingPrompt
                                    ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #15803d', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                                    : <CheckCircle2 size={15} />}
                                {llmStatus}
                            </div>
                        )}

                        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                            <select
                                value={llmProvider}
                                onChange={e => setLlmProvider(e.target.value)}
                                style={{
                                    padding: '0 12px', borderRadius: 12, border: '1.5px solid var(--border)',
                                    background: '#fafafa', fontFamily: 'inherit', fontSize: '0.85rem', color: 'var(--dark)',
                                    outline: 'none', cursor: 'pointer', flexShrink: 0, fontWeight: 700, width: 140,
                                }}
                            >
                                <option value="auto">Auto Select</option>
                                <option value="openai">GPT-4o (Direct/OpenAI)</option>
                                <option value="nebius">Llama 3.3 (Nebius)</option>
                                <option value="gemini">Gemini 2.0</option>
                            </select>

                            <button
                                onClick={generatePrompt}
                                disabled={generatingPrompt || !topic.trim()}
                                style={{
                                    flex: 1, padding: '13px 20px', borderRadius: 12,
                                    border: 'none', fontWeight: 800, fontSize: '0.9rem', cursor: generatingPrompt || !topic.trim() ? 'not-allowed' : 'pointer',
                                    background: generatingPrompt || !topic.trim()
                                        ? 'var(--border)'
                                        : 'linear-gradient(135deg,#3aaa6a,#1e6e44)',
                                    color: generatingPrompt || !topic.trim() ? 'var(--text-secondary)' : 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                                    boxShadow: generatingPrompt || !topic.trim() ? 'none' : '0 4px 20px rgba(58,170,106,0.35)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {generatingPrompt
                                    ? <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Generating…</>
                                    : <><Sparkles size={16} /> Generate Prompt</>}
                            </button>
                        </div>
                    </div>

                    {/* ── STEP 2: Prompt review & edit ────────────────────── */}
                    {(prompt || generatingPrompt) && (
                        <div style={{
                            background: 'white', borderRadius: 16, padding: 24,
                            border: step === 2 ? '1.5px solid var(--green)' : '1px solid var(--border)',
                            boxShadow: step === 2 ? '0 0 0 4px rgba(58,170,106,0.08)' : '0 2px 12px rgba(0,0,0,0.04)',
                            transition: 'all 0.2s',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <div style={{
                                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                                    background: step >= 2 ? 'linear-gradient(135deg,#3aaa6a,#2d8a55)' : 'var(--border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.7rem', fontWeight: 800, color: 'white',
                                }}>2</div>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--dark)' }}>
                                    Cinematic Prompt
                                </p>

                                {/* Provider badge */}
                                {promptProvider && (
                                    <span style={{
                                        fontSize: '0.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 20,
                                        background: promptProvider === 'nebius' ? '#e0f2fe' : '#f0fdf4',
                                        color: promptProvider === 'nebius' ? '#0369a1' : '#15803d',
                                        border: `1px solid ${promptProvider === 'nebius' ? '#bae6fd' : '#bbf7d0'}`,
                                    }}>
                                        via {promptProvider.toUpperCase()}
                                        {promptDuration && ` · ${formatDuration(promptDuration)}`}
                                    </span>
                                )}

                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                                    <button
                                        onClick={() => setShowPrompt(s => !s)}
                                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 9px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.73rem' }}
                                    >
                                        {showPrompt ? <EyeOff size={12} /> : <Eye size={12} />}
                                        {showPrompt ? 'Hide' : 'Show'}
                                    </button>
                                    <button
                                        onClick={() => copyToClipboard(prompt, 'prompt')}
                                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 9px', cursor: 'pointer', color: copiedIdx === 'prompt' ? 'var(--green)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.73rem' }}
                                    >
                                        {copiedIdx === 'prompt' ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                                        {copiedIdx === 'prompt' ? 'Copied!' : 'Copy'}
                                    </button>
                                    <button
                                        onClick={generatePrompt}
                                        disabled={generatingPrompt}
                                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 9px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.73rem' }}
                                    >
                                        <RefreshCw size={12} /> Regenerate
                                    </button>
                                </div>
                            </div>

                            {showPrompt && (
                                <textarea
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    rows={7}
                                    placeholder={generatingPrompt ? 'Generating…' : ''}
                                    style={{
                                        width: '100%', resize: 'vertical', boxSizing: 'border-box',
                                        border: '1.5px solid var(--border)', borderRadius: 12, padding: '12px 14px',
                                        fontSize: '0.84rem', fontFamily: 'inherit', color: 'var(--dark)',
                                        outline: 'none', lineHeight: 1.65, background: '#fafafa',
                                        transition: 'border-color 0.15s, background 0.15s',
                                    }}
                                    onFocus={e => { e.target.style.borderColor = 'var(--green)'; e.target.style.background = 'white'; }}
                                    onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = '#fafafa'; }}
                                />
                            )}

                            {/* Prompt char count */}
                            {showPrompt && prompt && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 5, textAlign: 'right' }}>
                                    {prompt.length} characters
                                </div>
                            )}

                            {/* Image gen errors */}
                            {imgError && (
                                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <AlertCircle size={15} style={{ flexShrink: 0 }} /> {imgError}
                                </div>
                            )}
                            {imgStatus && !imgError && (
                                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {generating
                                        ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #15803d', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                                        : <CheckCircle2 size={15} />}
                                    {imgStatus}
                                </div>
                            )}

                            {/* Generate image button */}
                            <button
                                onClick={generateImage}
                                disabled={generating || !prompt.trim()}
                                style={{
                                    marginTop: 16, width: '100%', padding: '13px 20px', borderRadius: 12,
                                    border: 'none', fontWeight: 800, fontSize: '0.9rem',
                                    cursor: generating || !prompt.trim() ? 'not-allowed' : 'pointer',
                                    background: generating || !prompt.trim()
                                        ? 'var(--border)'
                                        : `linear-gradient(135deg, ${selectedModel.color}, ${selectedModel.color}bb)`,
                                    color: generating || !prompt.trim() ? 'var(--text-secondary)' : 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                                    boxShadow: generating || !prompt.trim() ? 'none' : `0 4px 20px ${selectedModel.color}44`,
                                    transition: 'all 0.2s',
                                }}
                            >
                                {generating
                                    ? <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} /> Generating image{numImages > 1 ? 's' : ''}…</>
                                    : <><Zap size={16} /> Generate with {selectedModel.label}{numImages > 1 ? ` ×${numImages}` : ''}</>}
                            </button>
                        </div>
                    )}

                    {/* ── STEP 3: Results ──────────────────────────────────── */}
                    {results.length > 0 && (
                        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid var(--border)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                                <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg,#3aaa6a,#2d8a55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'white' }}>3</div>
                                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--dark)' }}>
                                    Generated Images
                                </p>
                                <span style={{ background: 'var(--green-100)', color: 'var(--green)', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                                    {results.length}
                                </span>
                                {imgDuration && (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={11} /> {formatDuration(imgDuration)}
                                    </span>
                                )}
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                                    <button
                                        onClick={generateImage}
                                        disabled={generating}
                                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem' }}
                                    >
                                        <RefreshCw size={12} /> Regenerate
                                    </button>
                                    <button
                                        onClick={() => { setResults([]); setImgStatus(''); setImgError(''); }}
                                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem' }}
                                    >
                                        <Trash2 size={12} /> Clear
                                    </button>
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: results.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(230px, 1fr))',
                                gap: 14,
                            }}>
                                {results.map((item, idx) => (
                                    <div key={idx} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', background: '#f5f5f5', aspectRatio: '1/1' }}>
                                        <img
                                            src={item.url} alt={`Gen ${idx + 1}`}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%239ca3af" font-size="10">Load failed</text></svg>'; }}
                                        />
                                        {/* hover overlay */}
                                        <div
                                            className="img-overlay"
                                            style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.72))', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 10, gap: 6, opacity: 0, transition: 'opacity 0.2s' }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                                        >
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    onClick={() => downloadImage(item.url, idx)}
                                                    style={{ flex: 1, padding: '7px 0', background: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.73rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: 'var(--dark)' }}
                                                >
                                                    <Download size={13} /> Download
                                                </button>
                                                <button
                                                    onClick={() => copyToClipboard(item.url, idx)}
                                                    style={{ flex: 1, padding: '7px 0', background: copiedIdx === idx ? '#d1fae5' : 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.73rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, color: copiedIdx === idx ? '#059669' : 'var(--dark)' }}
                                                >
                                                    {copiedIdx === idx ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                                                    {copiedIdx === idx ? 'Copied!' : 'Copy URL'}
                                                </button>
                                            </div>
                                        </div>
                                        {/* number badge */}
                                        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', borderRadius: 6, padding: '2px 8px', color: 'white', fontSize: '0.65rem', fontWeight: 700 }}>
                                            #{idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Session history ──────────────────────────────────── */}
                    {history.length > 0 && (
                        <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <button
                                onClick={() => setShowHistory(h => !h)}
                                style={{ width: '100%', padding: '14px 20px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: 'var(--dark)' }}
                            >
                                <span style={{ fontWeight: 700, fontSize: '0.87rem', display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <Clock size={14} color="var(--green)" />
                                    Session History
                                    <span style={{ background: 'var(--green-100)', color: 'var(--green)', borderRadius: 20, padding: '1px 8px', fontSize: '0.68rem', fontWeight: 700 }}>{history.length}</span>
                                </span>
                                {showHistory ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                            {showHistory && (
                                <div style={{ borderTop: '1px solid var(--border-light)', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                                    {history.map((h, i) => (
                                        <div
                                            key={i}
                                            onClick={() => { setTopic(h.topic); setPrompt(h.prompt); setModel(h.model); setSize(h.size); setResults(h.results); setShowHistory(false); }}
                                            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-light)', background: '#fafafa', cursor: 'pointer' }}
                                        >
                                            <div style={{ display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase' }}>{h.model}</span>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>· {h.size}</span>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>{new Date(h.ts).toLocaleTimeString()}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--dark)', fontWeight: 600 }}>{h.topic}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.prompt}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Right sidebar ─────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 20 }}>

                    {/* Model picker */}
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <p style={{ margin: '0 0 12px', fontWeight: 800, fontSize: '0.87rem', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: 7 }}>
                            <Layers size={14} color="var(--green)" /> Image Model
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            {MODELS.map(m => (
                                <button
                                    key={m.value}
                                    onClick={() => setModel(m.value)}
                                    style={{
                                        padding: '9px 12px', borderRadius: 10,
                                        border: `1.5px solid ${model === m.value ? m.color : 'var(--border)'}`,
                                        background: model === m.value ? `${m.color}12` : 'transparent',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: model === m.value ? m.color : 'var(--border)', transition: 'background 0.15s', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.81rem', fontWeight: model === m.value ? 700 : 500, color: model === m.value ? m.color : 'var(--dark)', flex: 1 }}>
                                        {m.label}
                                    </span>
                                    <span style={{ fontSize: '0.63rem', fontWeight: 700, color: m.color, background: `${m.color}1a`, padding: '2px 7px', borderRadius: 6 }}>
                                        {m.badge}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Settings */}
                    <div style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', padding: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <button
                            onClick={() => setShowSettings(s => !s)}
                            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0 }}
                        >
                            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.87rem', color: 'var(--dark)', display: 'flex', alignItems: 'center', gap: 7 }}>
                                <Settings2 size={14} color="var(--green)" /> Settings
                            </p>
                            {showSettings ? <ChevronUp size={14} color="var(--text-secondary)" /> : <ChevronDown size={14} color="var(--text-secondary)" />}
                        </button>
                        {!showSettings && (
                            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.72rem', background: '#f3f4f6', borderRadius: 6, padding: '3px 9px', color: 'var(--dark)', fontWeight: 600 }}>{size}</span>
                                <span style={{ fontSize: '0.72rem', background: '#f3f4f6', borderRadius: 6, padding: '3px 9px', color: 'var(--dark)', fontWeight: 600 }}>×{numImages}</span>
                            </div>
                        )}
                        {showSettings && (
                            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>
                                        Image Size
                                    </label>
                                    <select
                                        value={size}
                                        onChange={e => setSize(e.target.value)}
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontFamily: 'inherit', fontSize: '0.83rem', background: '#fafafa', color: 'var(--dark)', outline: 'none', cursor: 'pointer' }}
                                    >
                                        {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 7 }}>
                                        Number of Images
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                                        {[1, 2, 3, 4].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setNumImages(n)}
                                                style={{
                                                    padding: '8px 0', borderRadius: 10, fontSize: '0.87rem', fontWeight: numImages === n ? 700 : 500,
                                                    border: `1.5px solid ${numImages === n ? 'var(--green)' : 'var(--border)'}`,
                                                    background: numImages === n ? 'var(--green-100)' : 'transparent',
                                                    color: numImages === n ? 'var(--green)' : 'var(--text-secondary)',
                                                    cursor: 'pointer', transition: 'all 0.15s',
                                                }}
                                            >{n}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Style lock card */}
                    <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', borderRadius: 16, border: '1px solid #bbf7d0', padding: 16 }}>
                        <p style={{ fontWeight: 800, fontSize: '0.82rem', color: '#15803d', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Info size={13} /> GREEN_AE_01 — Style Lock
                        </p>

                        {/* Fixed anchors */}
                        <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Fixed text anchors</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                            {[
                                { zone: 'Top-right ~5rem', text: '"Darys"', note: 'text only · no logo · fixed padding' },
                                { zone: 'Center', text: 'Topic headline', note: 'dominant · particle light typography' },
                                { zone: 'Mid-below ctr', text: '"udarsyschool.com"', note: 'reflection / trail · optional subtext' },
                            ].map(a => (
                                <div key={a.zone} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: '6px 9px' }}>
                                    <div style={{ fontSize: '0.63rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{a.zone}</div>
                                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#14532d' }}>{a.text}</div>
                                    <div style={{ fontSize: '0.67rem', color: '#166534', opacity: 0.75 }}>{a.note}</div>
                                </div>
                            ))}
                        </div>

                        {/* Locked rules */}
                        <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Always locked</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                            {[
                                '16–18yo student — always the subject',
                                'Background: pure green, pure white, or green↔white gradient',
                                'Natural skin tones — no green on face/body',
                                'Green: accent only (stripe, trim, reflection)',
                                'Darys top-right · ~5rem padding · text only',
                                'Geometry: green on white bg · white on green bg',
                                'Floating circles · arcs · lines · particles',
                                'Cinematic volumetric studio lighting',
                            ].map(r => (
                                <div key={r} style={{ fontSize: '0.73rem', color: '#166534', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                    <span style={{ color: '#3aaa6a', fontWeight: 800, flexShrink: 0 }}>✓</span> {r}
                                </div>
                            ))}
                        </div>

                        {/* Pipeline */}
                        <p style={{ fontSize: '0.68rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px' }}>Pipeline</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <div style={{ width: 18, height: 18, borderRadius: 5, background: '#3aaa6a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 800, color: 'white', flexShrink: 0, marginTop: 1 }}>1</div>
                                <p style={{ margin: 0, fontSize: '0.73rem', color: '#166534', lineHeight: 1.4 }}><strong>Nebius Llama 3.3 70B</strong> — generates locked cinematic prompt</p>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                <div style={{ width: 18, height: 18, borderRadius: 5, background: '#3aaa6a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 800, color: 'white', flexShrink: 0, marginTop: 1 }}>2</div>
                                <p style={{ margin: 0, fontSize: '0.73rem', color: '#166534', lineHeight: 1.4 }}><strong>Ghost API</strong> (70 Infip keys) or OpenAI — renders the image</p>
                            </div>
                        </div>
                        <div style={{ marginTop: 10, padding: '7px 10px', background: 'rgba(0,0,0,0.05)', borderRadius: 8 }}>
                            <code style={{ fontSize: '0.67rem', color: '#15803d' }}>POST /api/poster/generate-poster-image</code>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default GhostApiTester;
