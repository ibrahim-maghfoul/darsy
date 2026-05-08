import React, { useState, useEffect } from 'react';
import { Presentation, ImageIcon, Download, RefreshCw, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { adminFetch } from '../utils/adminFetch';
import { SLIDER_PROMPTS } from '../data/sliderPrompts';
import { buildImagePrompt } from '../utils/promptBuilder';
import { jsPDF } from 'jspdf';

const SliderGenerator = () => {
    const [loadingId, setLoadingId] = useState(null);
    const [results, setResults] = useState({}); // { id: { url, error, duration } }
    const [generatingPdf, setGeneratingPdf] = useState(false);

    useEffect(() => {
        const fetchExisting = async () => {
            try {
                const res = await adminFetch('/poster/sessions');
                const data = await res.json();
                if (data.sessions) {
                    const loadedResults = {};
                    data.sessions.forEach(session => {
                        if (session.topicId && session.topicId.startsWith('slider_')) {
                            const id = session.topicId.replace('slider_', '');
                            if (session.images && session.images.length > 0) {
                                // Sort descending to get the latest
                                const latestImage = [...session.images].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))[0];
                                loadedResults[id] = {
                                    url: `/data/content-sessions/${session.topicId}/${latestImage.filename}`,
                                    duration: 0
                                };
                            }
                        }
                    });
                    setResults(prev => ({ ...prev, ...loadedResults }));
                }
            } catch (e) {
                console.error('Failed to load existing sliders', e);
            }
        };
        fetchExisting();
    }, []);

    const loadColoredSvg = async (color) => {
        const res = await fetch('/assets/logo/logo.svg');
        let svgText = await res.text();
        svgText = svgText.replace(/fill="#000000"/g, `fill="${color}"`).replace(/fill="black"/gi, `fill="${color}"`);
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 400; 
                canvas.height = 400;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 400, 400);
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = url;
        });
    };

    const generatePdf = async () => {
        setGeneratingPdf(true);
        try {
            const pdf = new jsPDF({ orientation: 'landscape', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            const logoDataUrl = await loadColoredSvg('#3aaa6a');
            const logoWidth = pageWidth * 0.04; 
            const logoHeight = logoWidth; 
            const logoMargin = 10;

            const addLogo = () => {
                pdf.addImage(logoDataUrl, 'PNG', pageWidth - logoWidth - logoMargin, logoMargin, logoWidth, logoHeight);
            };

            // Page 1: Brief Presentation
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            addLogo();
            
            pdf.setTextColor(58, 170, 106); 
            pdf.setFontSize(36);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Udarsy Educational Platform', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
            
            pdf.setTextColor(100, 100, 100);
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'normal');
            const introText = "Udarsy is a next-generation online learning ecosystem designed to empower students across Morocco. By combining structured curricula, real-time collaboration, and engaging gamification, Udarsy bridges the gap between traditional education and modern digital accessibility.";
            const splitIntro = pdf.splitTextToSize(introText, pageWidth * 0.7);
            pdf.text(splitIntro, pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });

            // Subsequent Pages: Slider Images
            for (let i = 0; i < SLIDER_PROMPTS.length; i++) {
                const item = SLIDER_PROMPTS[i];
                const result = results[item.id];
                
                if (result && result.url) {
                    pdf.addPage();
                    pdf.setFillColor(255, 255, 255);
                    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
                    addLogo();

                    const imgData = await new Promise((resolve, reject) => {
                        const img = new Image();
                        img.crossOrigin = 'Anonymous';
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.naturalWidth;
                            canvas.height = img.naturalHeight;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            resolve(canvas.toDataURL('image/png'));
                        };
                        img.onerror = reject;
                        img.src = result.url;
                    });

                    const targetWidth = pageWidth * 0.8;
                    const targetHeight = targetWidth * (1024/1792);
                    const imgX = (pageWidth - targetWidth) / 2;
                    const imgY = 20;

                    pdf.addImage(imgData, 'PNG', imgX, imgY, targetWidth, targetHeight);

                    pdf.setTextColor(30, 30, 30);
                    pdf.setFontSize(22);
                    pdf.setFont('helvetica', 'bold');
                    pdf.text(item.title, pageWidth / 2, imgY + targetHeight + 15, { align: 'center' });

                    pdf.setTextColor(100, 100, 100);
                    pdf.setFontSize(14);
                    pdf.setFont('helvetica', 'normal');
                    const splitDesc = pdf.splitTextToSize(item.description, targetWidth);
                    pdf.text(splitDesc, pageWidth / 2, imgY + targetHeight + 25, { align: 'center' });
                }
            }

            pdf.save('Udarsy_Presentation.pdf');
        } catch (e) {
            console.error('PDF Generation Error:', e);
            alert('Failed to generate PDF. Check console.');
        } finally {
            setGeneratingPdf(false);
        }
    };

    const generatePoster = async (item) => {
        setLoadingId(item.id);
        setResults(prev => ({ ...prev, [item.id]: { error: null } }));
        const start = Date.now();

        const finalPrompt = buildImagePrompt({
            designPhrase: item.prompt,
            theme: 'green',
            headline: item.title,
            subline: item.description,
            mood: 'energetic and dynamic',
            geometricDensity: 'balanced',
            figurePlacement: 'centered but asymmetrically cropped',
            shapeStyle: 'floating 3D abstract tech vectors',
            bgTexture: 'smooth matte',
            lang: 'English'
        });

        try {
            const res = await adminFetch('/poster/generate-poster-image', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: finalPrompt,
                    size: '1792x1024',
                    n: 1,
                    model: 'ghost'
                })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Generation failed');
            
            if (data.data && data.data[0]?.url) {
                let rawUrl = data.data[0].url;
                let finalLocalUrl = rawUrl;

                // Attempt to save the image locally to the backend
                try {
                    const saveRes = await adminFetch('/poster/save-session', {
                        method: 'POST',
                        body: JSON.stringify({
                            topicId: `slider_${item.id}`,
                            topic: 'Website Slider',
                            title: item.title,
                            headline: item.title,
                            subline: item.description,
                            designPrompt: item.prompt,
                            socialCaption: '',
                            theme: 'green',
                            model: 'ghost',
                            language: 'English',
                            imageUrl: rawUrl
                        })
                    });
                    if (saveRes.ok) {
                        const saveData = await saveRes.json();
                        finalLocalUrl = `${saveData.folder}/${saveData.imageName}`;
                    } else {
                        // Fallback proxy if saving fails
                        finalLocalUrl = rawUrl.startsWith('data:') ? rawUrl : `http://localhost:5000/api/poster/proxy?url=${encodeURIComponent(rawUrl)}`;
                    }
                } catch (e) {
                    finalLocalUrl = rawUrl.startsWith('data:') ? rawUrl : `http://localhost:5000/api/poster/proxy?url=${encodeURIComponent(rawUrl)}`;
                }

                setResults(prev => ({
                    ...prev,
                    [item.id]: { url: finalLocalUrl, duration: Date.now() - start }
                }));
            } else {
                throw new Error('No image returned');
            }
        } catch (err) {
            setResults(prev => ({
                ...prev,
                [item.id]: { error: err.message }
            }));
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div style={{ maxWidth: 1000, margin: '20px auto', fontFamily: 'system-ui, sans-serif', paddingBottom: 60 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '20px 24px', background: 'linear-gradient(135deg, var(--green) 0%, #1e6e44 100%)', borderRadius: 16, color: 'white', boxShadow: '0 4px 20px rgba(58,170,106,0.2)' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 12 }}>
                    <Presentation size={24} />
                </div>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Slider Image Generator</h1>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                        Generate 1792x1024 (16:9) visualization posters for all Udarsy platform functionalities (via Infip).
                    </p>
                </div>
                <button
                    onClick={generatePdf}
                    disabled={generatingPdf || Object.keys(results).length === 0}
                    style={{
                        padding: '12px 20px', borderRadius: 10, border: 'none',
                        background: generatingPdf ? 'var(--border)' : 'white',
                        color: generatingPdf ? 'var(--text-secondary)' : 'var(--green)',
                        fontWeight: 800, fontSize: '0.9rem', cursor: generatingPdf || Object.keys(results).length === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    {generatingPdf ? <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Building PDF...</> : <><FileText size={18} /> Export PDF Presentation</>}
                </button>
            </div>

            {/* List of functionalities */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {SLIDER_PROMPTS.map((item, index) => {
                    const isLoading = loadingId === item.id;
                    const result = results[item.id] || {};

                    return (
                        <div key={item.id} style={{ background: 'white', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                {/* Left side: Info & Controls */}
                                <div style={{ flex: '1 1 400px', padding: 24, borderRight: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green-100)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>
                                            {index + 1}
                                        </div>
                                        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark)' }}>
                                            {item.title}
                                        </h2>
                                    </div>
                                    <p style={{ margin: '0 0 16px 38px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        {item.description}
                                    </p>
                                    
                                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>
                                        <strong>Prompt:</strong> {item.prompt}
                                    </div>

                                    {result.error && (
                                        <div style={{ padding: 10, borderRadius: 8, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.8rem' }}>
                                            <AlertCircle size={14} /> {result.error}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => generatePoster(item)}
                                        disabled={isLoading || loadingId !== null}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                                            background: isLoading ? 'var(--border)' : 'var(--dark)',
                                            color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: isLoading || loadingId !== null ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        {isLoading ? (
                                            <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating Wide Image...</>
                                        ) : (
                                            <><ImageIcon size={16} /> {result.url ? 'Regenerate Image' : 'Generate Slider Image'}</>
                                        )}
                                    </button>
                                </div>

                                {/* Right side: Image Preview */}
                                <div style={{ flex: '1 1 350px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
                                    {result.url ? (
                                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={14} /> Success</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{(result.duration / 1000).toFixed(1)}s</span>
                                            </div>
                                            <img 
                                                src={result.url} 
                                                alt={item.title} 
                                                style={{ width: '100%', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} 
                                            />
                                            <a 
                                                href={result.url} 
                                                download={`udarsy-slider-${item.id}.png`}
                                                style={{ textDecoration: 'none', background: 'white', border: '1px solid var(--border)', color: 'var(--dark)', fontWeight: 700, padding: '8px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.8rem', marginTop: 4 }}
                                            >
                                                <Download size={14} /> Download High-Res
                                            </a>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#94a3b8', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                            <ImageIcon size={48} opacity={0.5} />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>1792 × 1024 Preview</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default SliderGenerator;
