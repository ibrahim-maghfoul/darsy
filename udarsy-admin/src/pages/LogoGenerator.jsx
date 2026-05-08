import React, { useState } from 'react';
import {
    Wand2, Image as ImageIcon, Download, RefreshCw, CheckCircle2,
    AlertCircle, Sparkles, Palette, Type, ChevronRight, ChevronLeft, Cpu
} from 'lucide-react';
import { makeLLMRequest } from '../utils/aiService';
import { adminFetch } from '../utils/adminFetch';

// ─── Constants ────────────────────────────────────────────────────────────────

const STYLES = [
    { id: 'flat',        label: 'Flat / Minimal',   hint: 'Clean, vector, no shadows' },
    { id: 'geometric',   label: 'Geometric',         hint: 'Shapes, polygons, bold' },
    { id: 'lettermark',  label: 'Lettermark',        hint: 'Single letter as icon' },
    { id: 'wordmark',    label: 'Wordmark',          hint: 'Text-only, no icon' },
    { id: 'mascot',      label: 'Mascot / Emblem',   hint: 'Character or badge style' },
    { id: 'abstract',    label: 'Abstract',          hint: 'Non-literal, artistic' },
];

const MOODS = [
    'Professional', 'Friendly', 'Bold', 'Playful', 'Modern', 'Traditional', 'Minimalist', 'Energetic',
];

const MODELS = [
    {
        id: 'ghost',
        label: 'Ghost API',
        badge: 'Free · Fast',
        badgeColor: '#3aaa6a',
        desc: 'Powered by infip — high-quality AI generation, no cost',
    },
    {
        id: 'dall-e-3',
        label: 'DALL·E 3',
        badge: 'OpenAI · HD',
        badgeColor: '#6366f1',
        desc: "OpenAI's best model — extremely precise prompt following, requires OPENAI_API_KEY",
    },
];

const STEPS = [
    { n: 1, label: 'Brand Info' },
    { n: 2, label: 'Prompt Ideas' },
    { n: 3, label: 'Generate' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const LogoGenerator = () => {
    const [step, setStep] = useState(1);

    // Step 1
    const [brandName, setBrandName]       = useState('Udarsy');
    const [tagline, setTagline]           = useState('تعلّم، تقدّم، تفوّق');
    const [industry, setIndustry]         = useState('Online education platform for Moroccan students');
    const [primaryColor, setPrimaryColor] = useState('#3aaa6a');
    const [bgColor, setBgColor]           = useState('#ffffff');
    const [selectedStyle, setSelectedStyle]   = useState('flat');
    const [selectedMoods, setSelectedMoods]   = useState(['Modern', 'Friendly']);
    const [extraNotes, setExtraNotes]     = useState('');

    // Step 2
    const [promptIdeas, setPromptIdeas]   = useState([]);
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [editedPrompt, setEditedPrompt] = useState('');
    const [promptLoading, setPromptLoading]   = useState(false);

    // Step 3
    const [imageModel, setImageModel]     = useState('ghost');
    const [logos, setLogos]               = useState([]);
    const [genLoading, setGenLoading]     = useState(false);

    // Shared
    const [status, setStatus]   = useState('');
    const [error, setError]     = useState('');
    const [currentProvider, setCurrentProvider] = useState('');

    const keys = {
        gemini:     import.meta.env.VITE_GEMINI_API_KEY,
        nebius:     import.meta.env.VITE_NEBIUS_API_KEY,
        openrouter: import.meta.env.VITE_OPENROUTER_API_KEY,
    };

    const toggleMood = (m) =>
        setSelectedMoods(prev =>
            prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
        );

    // ── Step 2: Generate prompt ideas via LLM ─────────────────────────────────
    const generatePromptIdeas = async () => {
        setPromptLoading(true);
        setError('');
        setPromptIdeas([]);
        setSelectedPrompt(null);
        setEditedPrompt('');
        setStatus('Generating prompt ideas…');

        const styleObj  = STYLES.find(s => s.id === selectedStyle);
        const moodStr   = selectedMoods.join(', ') || 'Modern';
        const colorHex  = primaryColor;

        const systemPrompt = `You are an expert logo designer and AI image prompt engineer.
Your job is to write precise, detailed prompts for AI image generators (DALL-E 3 / Stable Diffusion) to create complete logos.
Each prompt must produce a logo that visually represents the brand — including the brand name as styled text AND a matching icon/symbol.
Prompts must be self-contained, specific, and optimized for vector-style logo generation.`;

        const userPrompt = `Generate 4 distinct logo design prompt ideas for this brand:

Brand name: "${brandName}"
Tagline: ${tagline || 'none'}
What the brand does: ${industry}
Primary color: ${colorHex}
Background color: ${bgColor}
Logo style: ${styleObj?.label} (${styleObj?.hint})
Mood / personality: ${moodStr}
${extraNotes ? `Extra notes: ${extraNotes}` : ''}

Each of the 4 prompts must:
1. Start with the visual style (e.g. "Flat minimal vector logo")
2. Describe a unique icon/symbol concept that reflects what the brand does (${industry})
3. Include the brand name "${brandName}" as bold styled text beneath or beside the icon — this is mandatory
4. Use exact hex colors: primary ${colorHex}, background ${bgColor}
5. Keep the composition square 1:1, centered, clean edges, no drop shadows, no gradients, no 3D effects
6. Vary the 4 concepts — different icon ideas, different text+icon arrangements (stacked, side-by-side, icon inside letter, etc.)
7. End every prompt with: "Square 1:1 format. Flat vector style. Clean white margins."

Return a JSON array of exactly 4 strings. No markdown, no explanation — just the raw JSON array.
Example: ["prompt 1...", "prompt 2...", "prompt 3...", "prompt 4..."]`;

        try {
            const result = await makeLLMRequest(
                [
                    { role: 'system', content: systemPrompt },
                    { role: 'user',   content: userPrompt },
                ],
                {
                    keys,
                    forceProvider: 'nebius',
                    setCurrentProvider,
                    addLog: (msg) => setStatus(msg),
                    config: { temperature: 0.8, maxTokens: 1200 },
                }
            );

            const raw = result.choices[0].message.content.trim();
            // Extract JSON array even if wrapped in backticks
            const jsonMatch = raw.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('AI did not return a valid JSON array');
            const ideas = JSON.parse(jsonMatch[0]);
            if (!Array.isArray(ideas) || ideas.length === 0) throw new Error('Empty ideas array');

            setPromptIdeas(ideas);
            setStatus('');
        } catch (err) {
            setError(`Prompt generation failed: ${err.message}`);
            setStatus('');
        } finally {
            setPromptLoading(false);
        }
    };

    const pickPrompt = (prompt) => {
        setSelectedPrompt(prompt);
        setEditedPrompt(prompt);
    };

    // ── Step 3: Generate logo images ──────────────────────────────────────────
    const generateLogos = async () => {
        if (!editedPrompt.trim()) {
            setError('Select or write a prompt first.');
            return;
        }
        setGenLoading(true);
        setLogos([]);
        setError('');
        setStatus(`Generating with ${imageModel === 'ghost' ? 'Ghost API' : 'DALL·E 3'}…`);

        try {
            const res = await adminFetch('/poster/generate-poster-image', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: editedPrompt,
                    size:   '1024x1024',
                    n:      4,
                    model:  imageModel,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
            if (!data.data?.length) throw new Error('No images returned');

            setLogos(data.data.map(d => d.url));
            setStatus('');
        } catch (err) {
            setError(`Generation failed: ${err.message}`);
            setStatus('');
        } finally {
            setGenLoading(false);
        }
    };

    const downloadLogo = async (url, index) => {
        try {
            const proxyUrl = url.startsWith('http')
                ? `http://localhost:5000/api/poster/proxy?url=${encodeURIComponent(url)}`
                : url;
            const res  = await fetch(proxyUrl);
            const blob = await res.blob();
            const a    = document.createElement('a');
            a.href     = URL.createObjectURL(blob);
            a.download = `udarsy-logo-${index + 1}.png`;
            a.click();
        } catch {
            window.open(url, '_blank');
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    const canGoStep2 = brandName.trim().length > 0 && industry.trim().length > 0;
    const canGoStep3 = editedPrompt.trim().length > 0;

    return (
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 60px' }}>

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: 12,
                        background: 'linear-gradient(135deg, #3aaa6a, #2d8a55)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(58,170,106,0.25)',
                    }}>
                        <Sparkles size={18} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--dark)', margin: 0 }}>
                            Logo Generator
                        </h1>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                            AI-powered — describe your brand, get prompt ideas, then generate logos
                        </p>
                    </div>
                </div>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
                {STEPS.map((s, i) => (
                    <React.Fragment key={s.n}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '6px 14px', borderRadius: 20,
                            background: step === s.n ? 'var(--green)' : step > s.n ? 'var(--green-100)' : 'var(--bg)',
                            border: `1.5px solid ${step === s.n ? 'var(--green)' : step > s.n ? 'var(--green-200, #a7f3d0)' : 'var(--border)'}`,
                        }}>
                            <div style={{
                                width: 20, height: 20, borderRadius: '50%',
                                background: step === s.n ? 'rgba(255,255,255,0.3)' : step > s.n ? 'var(--green)' : 'var(--border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.65rem', fontWeight: 800,
                                color: step >= s.n ? 'white' : 'var(--text-secondary)',
                            }}>
                                {step > s.n ? '✓' : s.n}
                            </div>
                            <span style={{
                                fontSize: '0.78rem', fontWeight: 700,
                                color: step === s.n ? 'white' : step > s.n ? 'var(--green)' : 'var(--text-secondary)',
                            }}>
                                {s.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div style={{ height: 1, flex: 1, background: 'var(--border)', maxWidth: 32 }} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Status / Error */}
            {(status || error) && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
                    padding: '10px 14px', borderRadius: 10,
                    background: error ? '#fef2f2' : 'var(--green-50)',
                    border: `1px solid ${error ? '#fecaca' : 'var(--green-200, #a7f3d0)'}`,
                }}>
                    {error
                        ? <AlertCircle size={16} color="#ef4444" />
                        : <RefreshCw size={14} color="var(--green)" style={{ animation: 'spin 1s linear infinite' }} />
                    }
                    <span style={{ fontSize: '0.82rem', color: error ? '#ef4444' : 'var(--green)', fontWeight: 500 }}>
                        {error || status}
                        {currentProvider && !error && ` (${currentProvider})`}
                    </span>
                </div>
            )}

            {/* ── STEP 1: Brand Info ─────────────────────────────────────────── */}
            {step === 1 && (
                <div className="card" style={{ padding: 28 }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 22, color: 'var(--dark)' }}>
                        Describe your brand
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div>
                            <label style={labelStyle}>Brand Name *</label>
                            <input
                                value={brandName}
                                onChange={e => setBrandName(e.target.value)}
                                placeholder="e.g. Udarsy"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Tagline / Slogan</label>
                            <input
                                value={tagline}
                                onChange={e => setTagline(e.target.value)}
                                placeholder="e.g. تعلّم، تقدّم، تفوّق"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Brand / Industry Description *</label>
                        <textarea
                            value={industry}
                            onChange={e => setIndustry(e.target.value)}
                            rows={2}
                            placeholder="e.g. Online education platform for Moroccan high school students, BAC and Brevet prep"
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                        <div>
                            <label style={labelStyle}>
                                <Palette size={13} style={{ marginRight: 5 }} />
                                Primary Brand Color
                            </label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input
                                    type="color"
                                    value={primaryColor}
                                    onChange={e => setPrimaryColor(e.target.value)}
                                    style={{ width: 42, height: 38, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }}
                                />
                                <input
                                    value={primaryColor}
                                    onChange={e => setPrimaryColor(e.target.value)}
                                    placeholder="#3aaa6a"
                                    style={{ ...inputStyle, flex: 1 }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>
                                <Palette size={13} style={{ marginRight: 5 }} />
                                Background Color
                            </label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input
                                    type="color"
                                    value={bgColor}
                                    onChange={e => setBgColor(e.target.value)}
                                    style={{ width: 42, height: 38, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }}
                                />
                                <input
                                    value={bgColor}
                                    onChange={e => setBgColor(e.target.value)}
                                    placeholder="#ffffff"
                                    style={{ ...inputStyle, flex: 1 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Style picker */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>
                            <Type size={13} style={{ marginRight: 5 }} />
                            Logo Style
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                            {STYLES.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedStyle(s.id)}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        border: `1.5px solid ${selectedStyle === s.id ? 'var(--green)' : 'var(--border)'}`,
                                        background: selectedStyle === s.id ? 'var(--green-50)' : 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: selectedStyle === s.id ? 'var(--green)' : 'var(--dark)' }}>
                                        {s.label}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>{s.hint}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mood picker */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>Mood / Personality (pick any)</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {MOODS.map(m => (
                                <button
                                    key={m}
                                    onClick={() => toggleMood(m)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: 20,
                                        border: `1.5px solid ${selectedMoods.includes(m) ? 'var(--green)' : 'var(--border)'}`,
                                        background: selectedMoods.includes(m) ? 'var(--green)' : 'transparent',
                                        color: selectedMoods.includes(m) ? 'white' : 'var(--text-secondary)',
                                        fontSize: '0.78rem', fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={labelStyle}>Extra Notes (optional)</label>
                        <textarea
                            value={extraNotes}
                            onChange={e => setExtraNotes(e.target.value)}
                            rows={2}
                            placeholder="e.g. Include an open book icon, avoid blue colors, should work on both light and dark backgrounds..."
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>

                    <button
                        onClick={() => { setError(''); setStep(2); generatePromptIdeas(); }}
                        disabled={!canGoStep2}
                        style={primaryBtn(canGoStep2)}
                    >
                        <Wand2 size={16} />
                        Generate Prompt Ideas
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* ── STEP 2: Prompt Ideas ────────────────────────────────────────── */}
            {step === 2 && (
                <div className="card" style={{ padding: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--dark)' }}>
                            Choose a Prompt Idea
                        </h2>
                        <button
                            onClick={generatePromptIdeas}
                            disabled={promptLoading}
                            style={outlineBtn}
                        >
                            <RefreshCw size={14} style={promptLoading ? { animation: 'spin 1s linear infinite' } : {}} />
                            Regenerate
                        </button>
                    </div>

                    {promptLoading && (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                            <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', marginBottom: 10, color: 'var(--green)' }} />
                            <div style={{ fontSize: '0.85rem' }}>AI is crafting prompt ideas…</div>
                        </div>
                    )}

                    {!promptLoading && promptIdeas.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                            {promptIdeas.map((idea, i) => (
                                <button
                                    key={i}
                                    onClick={() => pickPrompt(idea)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '14px 16px',
                                        borderRadius: 12,
                                        border: `1.5px solid ${selectedPrompt === idea ? 'var(--green)' : 'var(--border)'}`,
                                        background: selectedPrompt === idea ? 'var(--green-50)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                        <div style={{
                                            flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                                            background: selectedPrompt === idea ? 'var(--green)' : 'var(--bg)',
                                            border: `1.5px solid ${selectedPrompt === idea ? 'var(--green)' : 'var(--border)'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.65rem', fontWeight: 800,
                                            color: selectedPrompt === idea ? 'white' : 'var(--text-secondary)',
                                        }}>
                                            {selectedPrompt === idea ? '✓' : i + 1}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--dark)' }}>
                                            {idea}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Editable prompt area */}
                    {selectedPrompt && (
                        <div style={{ marginBottom: 22 }}>
                            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <CheckCircle2 size={13} color="var(--green)" />
                                Selected prompt — edit freely before generating
                            </label>
                            <textarea
                                value={editedPrompt}
                                onChange={e => setEditedPrompt(e.target.value)}
                                rows={5}
                                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.6 }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setStep(1)} style={outlineBtn}>
                            <ChevronLeft size={14} /> Back
                        </button>
                        <button
                            onClick={() => { setError(''); setStep(3); }}
                            disabled={!canGoStep3}
                            style={primaryBtn(canGoStep3)}
                        >
                            Continue to Generate
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 3: Model choice + Generate ────────────────────────────── */}
            {step === 3 && (
                <div>
                    <div className="card" style={{ padding: 28, marginBottom: 20 }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6, color: 'var(--dark)' }}>
                            Choose AI Model
                        </h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 18 }}>
                            Both models use the same prompt. Ghost API is free and fast; DALL·E 3 is more precise.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                            {MODELS.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setImageModel(m.id)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '16px 18px',
                                        borderRadius: 14,
                                        border: `2px solid ${imageModel === m.id ? 'var(--green)' : 'var(--border)'}`,
                                        background: imageModel === m.id ? 'var(--green-50)' : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <Cpu size={16} color={imageModel === m.id ? 'var(--green)' : 'var(--text-secondary)'} />
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: imageModel === m.id ? 'var(--green)' : 'var(--dark)' }}>
                                            {m.label}
                                        </span>
                                        <span style={{
                                            fontSize: '0.65rem', fontWeight: 700,
                                            padding: '2px 8px', borderRadius: 20,
                                            background: imageModel === m.id ? m.badgeColor : 'var(--border)',
                                            color: imageModel === m.id ? 'white' : 'var(--text-secondary)',
                                        }}>
                                            {m.badge}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                        {m.desc}
                                    </p>
                                </button>
                            ))}
                        </div>

                        {/* Prompt preview */}
                        <div style={{ marginBottom: 22 }}>
                            <label style={labelStyle}>Prompt to be sent</label>
                            <div style={{
                                padding: '12px 14px', borderRadius: 10,
                                background: 'var(--bg)', border: '1px solid var(--border)',
                                fontSize: '0.78rem', lineHeight: 1.6, color: 'var(--dark)',
                                fontFamily: 'monospace', maxHeight: 120, overflowY: 'auto',
                            }}>
                                {editedPrompt}
                            </div>
                            <button
                                onClick={() => setStep(2)}
                                style={{ ...outlineBtn, marginTop: 8, fontSize: '0.75rem', padding: '5px 12px' }}
                            >
                                Edit prompt
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setStep(2)} style={outlineBtn}>
                                <ChevronLeft size={14} /> Back
                            </button>
                            <button
                                onClick={generateLogos}
                                disabled={genLoading}
                                style={primaryBtn(true)}
                            >
                                {genLoading
                                    ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                                    : <ImageIcon size={15} />
                                }
                                {genLoading ? 'Generating 4 logos…' : 'Generate 4 Logos'}
                            </button>
                        </div>
                    </div>

                    {/* Results grid */}
                    {logos.length > 0 && (
                        <div className="card" style={{ padding: 28 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--dark)' }}>
                                    Generated Logos
                                </h2>
                                <button
                                    onClick={generateLogos}
                                    disabled={genLoading}
                                    style={outlineBtn}
                                >
                                    <RefreshCw size={14} />
                                    Regenerate
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                                {logos.map((url, i) => (
                                    <div key={i} style={{
                                        borderRadius: 14,
                                        border: '1.5px solid var(--border)',
                                        overflow: 'hidden',
                                        background: '#f8f8f8',
                                        position: 'relative',
                                    }}>
                                        <img
                                            src={url}
                                            alt={`Logo option ${i + 1}`}
                                            style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                        <div style={{
                                            padding: '10px 12px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            borderTop: '1px solid var(--border)', background: 'white',
                                        }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                Option {i + 1}
                                            </span>
                                            <button
                                                onClick={() => downloadLogo(url, i)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 5,
                                                    padding: '5px 10px', borderRadius: 8,
                                                    background: 'var(--green)', border: 'none',
                                                    color: 'white', cursor: 'pointer',
                                                    fontSize: '0.75rem', fontWeight: 600,
                                                }}
                                            >
                                                <Download size={13} />
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

// ─── Style helpers ────────────────────────────────────────────────────────────

const labelStyle = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
};

const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 10,
    border: '1.5px solid var(--border)',
    fontSize: '0.85rem',
    color: 'var(--dark)',
    background: 'var(--bg)',
    boxSizing: 'border-box',
    outline: 'none',
};

const primaryBtn = (enabled) => ({
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 20px', borderRadius: 10,
    background: enabled ? 'var(--green)' : 'var(--border)',
    border: 'none',
    color: enabled ? 'white' : 'var(--text-secondary)',
    fontWeight: 700, fontSize: '0.85rem',
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'all 0.15s',
});

const outlineBtn = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 16px', borderRadius: 10,
    background: 'transparent',
    border: '1.5px solid var(--border)',
    color: 'var(--text-secondary)',
    fontWeight: 600, fontSize: '0.82rem',
    cursor: 'pointer',
};

export default LogoGenerator;
