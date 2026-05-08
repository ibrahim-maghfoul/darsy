import React, { useState } from 'react';
import { Sparkles, ImageIcon, Download, Settings, RefreshCw, AlertCircle, Copy, CheckCircle2 } from 'lucide-react';
import { adminFetch } from '../utils/adminFetch';

const MODELS = [
    { value: 'gpt-image-1', label: 'GPT-Image-1 (OpenAI)', badge: 'Best', color: '#f59e0b' },
    { value: 'dall-e-3', label: 'DALL·E 3 (OpenAI)', badge: 'HD', color: '#6366f1' },
    { value: 'dall-e-2', label: 'DALL·E 2 (OpenAI)', badge: 'Fast', color: '#8b5cf6' },
    { value: 'ghost', label: 'Ghost / img4', badge: 'Alt', color: '#3aaa6a' }
];

const DalleTester = () => {
    const [prompt, setPrompt] = useState('An artistic poster describing...');
    const [model, setModel] = useState('gpt-image-1');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [duration, setDuration] = useState(null);

    const generateImage = async () => {
        if (!prompt.trim()) { setError('Enter a prompt first.'); return; }
        setLoading(true); setError(null); setImageUrl('');
        const start = Date.now();
        try {
            const res = await adminFetch('/poster/generate-poster-image', {
                method: 'POST',
                body: JSON.stringify({ prompt, size: '1024x1024', n: 1, model })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Generation failed');
            if (data.data && data.data[0]?.url) {
                setImageUrl(data.data[0].url);
                setDuration(Date.now() - start);
            } else {
                throw new Error('No image returned');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '20px auto', fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '16px 20px', background: 'var(--green)', borderRadius: 12, color: 'white' }}>
                <Sparkles size={24} />
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>DALL-E Tester</h1>
            </div>

            <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid var(--border)' }}>
                {error && (
                    <div style={{ padding: 12, borderRadius: 8, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.9rem' }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-secondary)' }}>Model Selection</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        {MODELS.map(m => (
                            <button
                                key={m.value}
                                onClick={() => setModel(m.value)}
                                style={{
                                    padding: '8px 16px', borderRadius: 8, border: `2px solid ${model === m.value ? m.color : 'var(--border)'}`,
                                    background: model === m.value ? `${m.color}10` : 'transparent', color: model === m.value ? m.color : 'var(--text-secondary)',
                                    fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6
                                }}
                            >
                                {m.label} <span style={{ fontSize: '0.65rem', background: model === m.value ? m.color : 'var(--border)', color: 'white', padding: '2px 6px', borderRadius: 20 }}>{m.badge}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-secondary)' }}>Direct Prompt</label>
                    <textarea
                        rows={6}
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="A futuristic city with flying cars..."
                        style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', border: '1.5px solid var(--border)', borderRadius: 8, padding: 12, fontSize: '0.9rem', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = 'var(--green)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                </div>

                <button
                    onClick={generateImage}
                    disabled={loading}
                    style={{ background: 'var(--green)', color: 'white', border: 'none', borderRadius: 8, padding: '12px 24px', fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? <RefreshCw size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={18} />}
                    {loading ? 'Generating image...' : 'Test Prompt'}
                </button>
            </div>

            {imageUrl && (
                <div style={{ marginTop: 24, background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--green)' }}><CheckCircle2 size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Generation Successful</span>
                        {duration && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{duration < 1000 ? `${duration}ms` : `${(duration/1000).toFixed(1)}s`}</span>}
                    </div>
                    <img src={imageUrl} alt="Generated result" style={{ width: '100%', maxWidth: 512, height: 'auto', borderRadius: 8, border: '1px solid var(--border)' }} />
                    <div style={{ marginTop: 16 }}>
                        <a href={imageUrl} download="dalle-result.png" style={{ textDecoration: 'none', background: '#f3f4f6', color: 'var(--dark)', fontWeight: 700, padding: '8px 16px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                            <Download size={14} /> Download Image
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DalleTester;
