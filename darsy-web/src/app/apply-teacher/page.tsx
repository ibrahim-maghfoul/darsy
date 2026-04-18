'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
    GraduationCap, Upload, CheckCircle, Loader2, Clock,
    FileText, IdCard, School, Briefcase, AlertCircle,
    ChevronRight, X, ShieldCheck, MapPin, BookOpen, Phone, MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap');`;

const DOC_TYPES = [
    { value: 'id_card', label: 'National ID Card', icon: IdCard },
    { value: 'certificate', label: 'Teaching Certificate', icon: FileText },
    { value: 'school_letter', label: 'School Letter', icon: School },
    { value: 'other', label: 'Other Document', icon: FileText },
];

const PERKS = [
    { icon: MessageSquare, label: 'Class chat room', sub: 'Private space for your students', color: '#4F46E5' },
    { icon: ShieldCheck, label: 'Verified badge', sub: 'Reviewed in 1-3 business days', color: '#3aaa6a' },
    { icon: GraduationCap, label: 'Free forever', sub: 'No cost, no subscription', color: '#8B5CF6' },
];

function profileCompletion(user: any): number {
    if (!user) return 0;
    const fields = [user.displayName, user.nickname, user.age, user.city, user.phone, user.schoolName, user.email, user.level?.school, user.level?.level, user.level?.guidance, user.photoURL];
    return Math.round(fields.filter(f => f && f !== '').length / fields.length * 100);
}

export default function ApplyTeacherPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [verification, setVerification] = useState<any>(null);
    const [fetching, setFetching] = useState(true);
    const [schoolName, setSchoolName] = useState('');
    const [city, setCity] = useState('');
    const [classLevel, setClassLevel] = useState('');
    const [className, setClassName] = useState('');
    const [subject, setSubject] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [position, setPosition] = useState('');
    const [docType, setDocType] = useState('id_card');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

    useEffect(() => {
        if (user?.role === 'teacher') { router.push('/teacher/dashboard'); return; }
        if (user) fetchVerification();
    }, [user]);

    const fetchVerification = async () => {
        try { const res = await api.get('/teacher/verify/me'); setVerification(res.data); }
        catch { /* no submission yet */ }
        finally { setFetching(false); }
    };

    const handleFile = (f: File) => {
        setFile(f);
        setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !schoolName || !city || !classLevel || !position || !contactInfo) return;
        setSubmitting(true); setError('');
        try {
            const fd = new FormData();
            fd.append('document', file); fd.append('schoolName', schoolName); fd.append('city', city);
            fd.append('classLevel', classLevel); fd.append('className', className); fd.append('subject', subject);
            fd.append('contactInfo', contactInfo); fd.append('position', position); fd.append('documentType', docType);
            const res = await api.post('/teacher/verify', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setVerification(res.data.verification);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Submission failed. Try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (authLoading || fetching) {
        return (
            <div style={{ minHeight: '100vh', background: '#F2EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <style>{FONT_IMPORT}</style>
                <div style={{ width: '36px', height: '36px', border: '3px solid rgba(79,70,229,0.15)', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'atspin 0.8s linear infinite' }} />
                <style>{`@keyframes atspin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!user) return null;

    const completion = profileCompletion(user);
    const isProfileComplete = completion >= 100;

    // Profile incomplete
    if (!isProfileComplete) {
        return (
            <div style={{ minHeight: '100vh', background: '#F2EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
                <style>{FONT_IMPORT}</style>
                <div style={{ background: 'white', borderRadius: '24px', border: '1px solid rgba(245,158,11,0.25)', boxShadow: '0 8px 40px rgba(30,27,75,0.1)', padding: '40px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                        <AlertCircle size={30} style={{ color: '#F59E0B' }} />
                    </div>
                    <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.35rem', color: '#1E1B4B', marginBottom: '8px' }}>Complete your profile first</h1>
                    <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '20px' }}>
                        Your profile is <span style={{ fontWeight: 700, color: '#F59E0B' }}>{completion}% complete</span>. Reach 100% before applying.
                    </p>
                    <div style={{ height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
                        <div style={{ height: '100%', background: '#F59E0B', borderRadius: '4px', width: `${completion}%`, transition: 'width 0.4s' }} />
                    </div>
                    <Link href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: '#4F46E5', color: 'white', borderRadius: '14px', fontWeight: 700, textDecoration: 'none', fontFamily: 'Syne, sans-serif', fontSize: '0.9rem' }}>
                        Complete Profile <ChevronRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    // Existing verification state
    if (verification) {
        const statusCfg = {
            pending: { Icon: Clock, accent: '#F59E0B', bg: '#FFFBEB', border: 'rgba(245,158,11,0.25)', title: 'Verification Under Review', desc: 'Your documents are being reviewed. This usually takes 1-3 business days.' },
            approved: { Icon: ShieldCheck, accent: '#3aaa6a', bg: '#F0FDF4', border: 'rgba(58,170,106,0.25)', title: 'Verification Approved!', desc: 'You are now a verified teacher on Darsy. Create chat rooms for your class.' },
            rejected: { Icon: AlertCircle, accent: '#EF4444', bg: '#FEF2F2', border: 'rgba(239,68,68,0.25)', title: 'Verification Rejected', desc: verification.reviewNote || 'Your verification was not approved. Resubmit with correct documents.' },
        };
        const cfg = statusCfg[verification.status as keyof typeof statusCfg];
        return (
            <div style={{ minHeight: '100vh', background: '#F2EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
                <style>{FONT_IMPORT}</style>
                <div style={{ background: 'white', borderRadius: '24px', border: `1px solid ${cfg.border}`, boxShadow: '0 8px 40px rgba(30,27,75,0.1)', padding: '40px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <cfg.Icon size={32} style={{ color: cfg.accent }} />
                    </div>
                    <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.4rem', color: '#1E1B4B', marginBottom: '8px' }}>{cfg.title}</h1>
                    <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '24px' }}>{cfg.desc}</p>

                    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '14px', padding: '16px', textAlign: 'left', marginBottom: '24px' }}>
                        {[
                            ['School', verification.schoolName],
                            verification.city && ['City', verification.city],
                            verification.classLevel && ['Class Level', `${verification.classLevel}${verification.className ? ` — ${verification.className}` : ''}`],
                            ['Position', verification.position],
                            verification.subject && ['Subject', verification.subject],
                            ['Status', verification.status],
                        ].filter(Boolean).map(([k, v]: any) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.875rem', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                <span style={{ color: '#9CA3AF' }}>{k}</span>
                                <span style={{ fontWeight: 700, color: k === 'Status' ? cfg.accent : '#1E1B4B', textTransform: k === 'Status' ? 'capitalize' : 'none' }}>{v}</span>
                            </div>
                        ))}
                    </div>

                    {verification.status === 'approved' && (
                        <Link href="/teacher/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px 24px', background: '#4F46E5', color: 'white', borderRadius: '14px', fontWeight: 700, textDecoration: 'none', fontFamily: 'Syne, sans-serif', fontSize: '0.9rem' }}>
                            Go to Teacher Dashboard <ChevronRight size={16} />
                        </Link>
                    )}
                    {verification.status === 'rejected' && (
                        <button onClick={() => setVerification(null)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px 24px', background: '#4F46E5', color: 'white', borderRadius: '14px', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Syne, sans-serif', fontSize: '0.9rem' }}>
                            Resubmit Verification <ChevronRight size={16} />
                        </button>
                    )}
                    {verification.status === 'pending' && (
                        <Link href="/profile" style={{ display: 'inline-block', color: '#4F46E5', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                            ← Back to Profile
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    // ── MAIN FORM ──
    return (
        <div style={{ minHeight: '100vh', background: '#F2EFE8', fontFamily: 'DM Sans, sans-serif' }}>
            <style>{`
                ${FONT_IMPORT}
                @keyframes atspin { to { transform: rotate(360deg); } }

                .atfield {
                    width: 100%;
                    border: 1px solid rgba(79,70,229,0.15);
                    border-radius: 13px;
                    padding: 12px 14px 12px 42px;
                    font-size: 14px;
                    font-family: 'DM Sans', sans-serif;
                    color: #1E1B4B;
                    background: white;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    box-sizing: border-box;
                }
                .atfield:focus { border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79,70,229,0.08); }
                .atfield::placeholder { color: #C7C9D9; }

                .atfield-plain {
                    width: 100%;
                    border: 1px solid rgba(79,70,229,0.15);
                    border-radius: 13px;
                    padding: 12px 14px;
                    font-size: 14px;
                    font-family: 'DM Sans', sans-serif;
                    color: #1E1B4B;
                    background: white;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    box-sizing: border-box;
                }
                .atfield-plain:focus { border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79,70,229,0.08); }
                .atfield-plain::placeholder { color: #C7C9D9; }

                .atdoc-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px;
                    border-radius: 13px;
                    border: 1px solid rgba(79,70,229,0.15);
                    background: white;
                    font-size: 13px;
                    font-weight: 600;
                    color: #6B7280;
                    cursor: pointer;
                    transition: all 0.18s;
                    font-family: 'DM Sans', sans-serif;
                    text-align: left;
                }
                .atdoc-btn.active { border-color: #4F46E5; background: #F5F3FF; color: #4F46E5; }
                .atdoc-btn:hover:not(.active) { border-color: rgba(79,70,229,0.3); color: #1E1B4B; }

                .atsubmit {
                    width: 100%;
                    padding: 15px;
                    background: #4F46E5;
                    color: white;
                    border: none;
                    border-radius: 14px;
                    font-weight: 700;
                    font-size: 0.95rem;
                    cursor: pointer;
                    font-family: 'Syne', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: background 0.2s;
                    box-shadow: 0 4px 16px rgba(79,70,229,0.3);
                }
                .atsubmit:hover:not(:disabled) { background: #4338CA; }
                .atsubmit:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>

            {/* ── HERO ── */}
            <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 60%, #4338CA 100%)', padding: '90px 24px 60px', position: 'relative', overflow: 'hidden' }}>
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 }} xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="at-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="20" cy="20" r="1.5" fill="white" />
                            <circle cx="0" cy="0" r="1.5" fill="white" />
                            <circle cx="40" cy="0" r="1.5" fill="white" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#at-dots)" />
                </svg>
                <div style={{ position: 'absolute', top: '-40px', right: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }} />
                <div style={{ position: 'absolute', bottom: '-60px', left: '20%', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

                <div style={{ maxWidth: '680px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '3px 12px', marginBottom: '16px', fontFamily: 'Syne, sans-serif' }}>
                        TEACHER PROGRAM
                    </div>
                    <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', color: 'white', lineHeight: 1.15, marginBottom: '12px' }}>
                        School Teacher Verification
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: '520px', marginBottom: '32px' }}>
                        Verify your status as a school teacher and create a private chat room for your class — share resources, answer questions, and stay connected with your students.
                    </p>

                    {/* Perks */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {PERKS.map(({ icon: Icon, label, sub, color }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', backdropFilter: 'blur(8px)' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={14} style={{ color }} />
                                </div>
                                <div>
                                    <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: 'white', margin: 0 }}>{label}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: '16px' }}>
                        Want to upload online courses instead?{' '}
                        <Link href="/apply-instructor" style={{ color: '#A5B4FC', fontWeight: 600, textDecoration: 'none' }}>Apply as Instructor →</Link>
                    </p>
                </div>
            </div>

            {/* ── FORM ── */}
            <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px 80px' }}>
                <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '24px', border: '1px solid rgba(79,70,229,0.08)', boxShadow: '0 4px 32px rgba(30,27,75,0.08)', padding: '36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <AtField label="School / Institution *" icon={School} value={schoolName} onChange={setSchoolName} placeholder="e.g. Lycée Mohammed V" />

                    <AtField label="City *" icon={MapPin} value={city} onChange={setCity} placeholder="e.g. Casablanca, Rabat, Marrakech" />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <AtField label="Class Level *" icon={BookOpen} value={classLevel} onChange={setClassLevel} placeholder="e.g. 1ère Bac, TC" />
                        <div>
                            <label style={atLabel}>Class Name <span style={{ color: '#C7C9D9', fontWeight: 400 }}>(optional)</span></label>
                            <input type="text" value={className} onChange={e => setClassName(e.target.value)} placeholder="e.g. 3ème AS-B" className="atfield-plain" />
                        </div>
                    </div>

                    <AtField label="Your Position *" icon={Briefcase} value={position} onChange={setPosition} placeholder="e.g. Mathematics Teacher" />

                    <AtField label="Subject you teach *" icon={BookOpen} value={subject} onChange={setSubject} placeholder="e.g. Mathematics, Physics, Arabic" />

                    <div>
                        <label style={atLabel}>Phone or Email *</label>
                        <p style={{ fontSize: '0.78rem', color: '#9CA3AF', marginBottom: '8px', marginTop: '-4px' }}>Used to contact you after verification — not shown publicly.</p>
                        <div style={{ position: 'relative' }}>
                            <Phone size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#C7C9D9', pointerEvents: 'none' }} />
                            <input type="text" value={contactInfo} onChange={e => setContactInfo(e.target.value)} placeholder="+212 6XX XXX XXX or your@email.com" required className="atfield" />
                        </div>
                    </div>

                    {/* Document type */}
                    <div>
                        <label style={atLabel}>Document Type *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {DOC_TYPES.map(dt => {
                                const Icon = dt.icon;
                                return (
                                    <button key={dt.value} type="button" onClick={() => setDocType(dt.value)}
                                        className={`atdoc-btn${docType === dt.value ? ' active' : ''}`}>
                                        <Icon size={16} /> {dt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Document upload */}
                    <div>
                        <label style={atLabel}>Upload Document * <span style={{ color: '#C7C9D9', fontWeight: 400 }}>JPG, PNG or PDF · max 10MB</span></label>
                        <div
                            onClick={() => fileRef.current?.click()}
                            style={{
                                border: `2px dashed ${file ? '#4F46E5' : 'rgba(79,70,229,0.2)'}`,
                                borderRadius: '16px', padding: '28px 24px', cursor: 'pointer', textAlign: 'center',
                                background: file ? '#F5F3FF' : 'rgba(79,70,229,0.02)',
                                transition: 'all 0.2s',
                            }}>
                            {file ? (
                                <div>
                                    {preview ? (
                                        <div style={{ position: 'relative', width: '140px', height: '100px', margin: '0 auto 12px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(79,70,229,0.2)' }}>
                                            <Image src={preview} alt="preview" fill style={{ objectFit: 'cover' }} unoptimized />
                                        </div>
                                    ) : (
                                        <FileText style={{ color: '#4F46E5', margin: '0 auto 10px', display: 'block' }} size={36} />
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                                        <div>
                                            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#1E1B4B', fontSize: '0.875rem', margin: 0 }}>{file.name}</p>
                                            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '2px 0 0' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button type="button"
                                            onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                                            style={{ padding: '6px', background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#EF4444', display: 'flex' }}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Upload style={{ color: 'rgba(79,70,229,0.3)', margin: '0 auto 10px', display: 'block' }} size={32} />
                                    <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#6B7280', fontSize: '0.875rem', marginBottom: '4px' }}>Click to upload your document</p>
                                    <p style={{ fontSize: '0.78rem', color: '#C7C9D9' }}>Photo of ID, teaching certificate, or school letter</p>
                                </>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,application/pdf" style={{ display: 'none' }}
                            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    </div>

                    {/* Privacy note */}
                    <div style={{ display: 'flex', gap: '12px', background: '#EFF6FF', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '14px', padding: '14px 16px' }}>
                        <ShieldCheck size={18} style={{ color: '#3B82F6', flexShrink: 0, marginTop: '1px' }} />
                        <p style={{ fontSize: '0.8rem', color: '#3B82F6', lineHeight: 1.6, margin: 0 }}>
                            Your document is stored securely and only reviewed by Darsy admins to verify your teacher status. It will not be shared publicly.
                        </p>
                    </div>

                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                            <AlertCircle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
                            <p style={{ fontSize: '0.875rem', color: '#EF4444', margin: 0 }}>{error}</p>
                        </div>
                    )}

                    {success && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F0FDF4', border: '1px solid rgba(58,170,106,0.2)', borderRadius: '12px', padding: '14px 16px' }}>
                            <CheckCircle size={16} style={{ color: '#3aaa6a', flexShrink: 0 }} />
                            <p style={{ fontSize: '0.875rem', color: '#3aaa6a', fontWeight: 600, margin: 0 }}>Application submitted! We'll review it within 1-3 business days.</p>
                        </div>
                    )}

                    <button type="submit" className="atsubmit" disabled={submitting || !file || !schoolName || !city || !classLevel || !position || !subject || !contactInfo}>
                        {submitting ? <><Loader2 size={18} style={{ animation: 'atspin 0.8s linear infinite' }} /> Submitting...</> : <><Upload size={18} /> Submit for Verification</>}
                    </button>
                </form>
            </div>
        </div>
    );
}

const atLabel: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#6B7280',
    marginBottom: '8px',
    fontFamily: 'Syne, sans-serif',
    letterSpacing: '0.03em',
};

function AtField({ label, icon: Icon, value, onChange, placeholder, required = false }: {
    label: string; icon: any; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean;
}) {
    return (
        <div>
            <label style={atLabel}>{label}</label>
            <div style={{ position: 'relative' }}>
                <Icon size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#C7C9D9', pointerEvents: 'none' }} />
                <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} className="atfield" />
            </div>
        </div>
    );
}
