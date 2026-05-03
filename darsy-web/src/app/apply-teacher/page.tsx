'use client';

import { useState, useEffect, useRef } from 'react';
import { DarsyLoader } from '@/components/DarsyLoader';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
    Upload, CheckCircle, Loader2, Clock, FileText, IdCard, School,
    AlertCircle, ChevronRight, ChevronLeft, X, ShieldCheck, BookOpen, Pencil,
    MessageCircle, Users, Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const DOC_TYPES = [
    { value: 'id_card', label: 'National ID', icon: IdCard },
    { value: 'certificate', label: 'Teaching Certificate', icon: FileText },
    { value: 'school_letter', label: 'School Letter', icon: School },
    { value: 'other', label: 'Other Document', icon: FileText },
];

const PERKS = [
    { Icon: MessageCircle, title: 'Private class chat room' },
    { Icon: Users, title: 'Invite your students by code' },
    { Icon: ShieldCheck, title: 'Verified badge on your profile' },
    { Icon: Sparkles, title: 'Free forever — no subscription' },
];

const CLASS_NAME_SUGGESTIONS = [
    'AS-A', 'AS-B', 'AS-C', 'AS-D',
    'TC-A', 'TC-B', 'TC-C',
    'Classe A', 'Classe B', 'Classe C',
    'Groupe 1', 'Groupe 2', 'Groupe 3',
];

type MissingField = { key: string; label: string };

function checkTeacherProfile(user: any): MissingField[] {
    const missing: MissingField[] = [];
    if (!user) return [{ key: 'all', label: 'Profile' }];
    if (!user.displayName) missing.push({ key: 'displayName', label: 'Full name' });
    if (!user.schoolName) missing.push({ key: 'schoolName', label: 'School / Institution' });
    if (!user.city) missing.push({ key: 'city', label: 'City' });
    if (!user.phone && !user.email) missing.push({ key: 'contact', label: 'Phone or email' });
    return missing;
}

export default function ApplyTeacherPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [verification, setVerification] = useState<any>(null);
    const [fetching, setFetching] = useState(true);

    const [classLevel, setClassLevel] = useState('');
    const [className, setClassName] = useState('');
    const [subject, setSubject] = useState('');
    const [docType, setDocType] = useState('id_card');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Suggestion lists fetched from curriculum API
    const [levelSuggestions, setLevelSuggestions] = useState<string[]>([]);
    const [subjectSuggestions, setSubjectSuggestions] = useState<string[]>([]);

    useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading, router]);

    useEffect(() => {
        if (user?.role === 'teacher') { router.push('/teacher/dashboard'); return; }
        if (user) fetchVerification();
    }, [user]);

    // Load curriculum suggestions
    useEffect(() => {
        const loadSuggestions = async () => {
            try {
                const schoolsRes = await api.get('/data/schools');
                const schools: any[] = schoolsRes.data || [];

                // Fetch levels for all schools in parallel
                const levelResults = await Promise.all(
                    schools.map((s: any) => api.get(`/data/levels/${s._id || s.id}`).then(r => r.data).catch(() => []))
                );
                const allLevels: any[] = levelResults.flat();
                setLevelSuggestions([...new Set(allLevels.map((l: any) => l.title).filter(Boolean))]);

                // Fetch guidances for all levels, then subjects for those guidances
                const guidanceResults = await Promise.all(
                    allLevels.map((l: any) => api.get(`/data/guidances/${l._id || l.id}`).then(r => r.data).catch(() => []))
                );
                const allGuidances: any[] = guidanceResults.flat();

                const subjectResults = await Promise.all(
                    allGuidances.map((g: any) => api.get(`/data/subjects/${g._id || g.id}`).then(r => r.data).catch(() => []))
                );
                const allSubjects: any[] = subjectResults.flat();
                setSubjectSuggestions([...new Set(allSubjects.map((s: any) => s.title).filter(Boolean))]);
            } catch { /* suggestions are optional */ }
        };
        loadSuggestions();
    }, []);

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
        if (!user || !file || !classLevel || !subject) return;
        const contactInfo = (user as any).phone || user.email;
        setSubmitting(true); setError('');
        try {
            const fd = new FormData();
            fd.append('document', file);
            fd.append('schoolName', (user as any).schoolName || '');
            fd.append('city', (user as any).city || '');
            fd.append('classLevel', classLevel);
            fd.append('className', className);
            fd.append('subject', subject);
            fd.append('contactInfo', contactInfo);
            fd.append('position', 'Teacher');
            fd.append('documentType', docType);
            const res = await api.post('/teacher/verify', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setVerification(res.data.verification);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Submission failed. Try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Loading ───────────────────────────────────────────
    if (authLoading || fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <DarsyLoader size={90} />
            </div>
        );
    }
    if (!user) return null;

    const missing = checkTeacherProfile(user);

    // ─── Profile incomplete ─────────────────────────────────
    if (missing.length > 0) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] pt-24 md:pt-32 pb-32 px-4">
                <div className="max-w-lg mx-auto">
                    <Link href="/profile" className="btn-back inline-flex mb-6">
                        <ChevronLeft size={14} className="btn-back-arrow" /> Back to Profile
                    </Link>
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-amber-100 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={28} className="text-amber-500" />
                        </div>
                        <h1 className="text-2xl font-black text-dark mb-2">Complete your profile first</h1>
                        <p className="text-sm text-dark/60 leading-relaxed mb-5">
                            Before applying to become a verified teacher, please add the following to your profile:
                        </p>
                        <div className="flex flex-col gap-2 mb-6">
                            {missing.map(m => (
                                <div key={m.key} className="flex items-center gap-2 px-4 py-3 bg-amber-50 rounded-xl text-sm font-semibold text-amber-700 text-left">
                                    <AlertCircle size={14} className="shrink-0" /> {m.label}
                                </div>
                            ))}
                        </div>
                        <Link href="/settings" className="inline-flex items-center gap-2 px-6 py-3 bg-green text-white rounded-xl font-bold text-sm shadow-lg shadow-green/20 hover:bg-green/90 transition-colors">
                            Complete Profile <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Existing verification status ───────────────────────
    if (verification) {
        const cfg = {
            pending: { Icon: Clock, color: 'amber', title: 'Verification under review', desc: 'Your documents are being reviewed. This usually takes 1-3 business days.' },
            approved: { Icon: ShieldCheck, color: 'green', title: 'Verification approved', desc: 'You are now a verified teacher on Darsy. Create chat rooms for your class.' },
            rejected: { Icon: AlertCircle, color: 'red', title: 'Verification rejected', desc: verification.reviewNote || 'Your verification was not approved. Resubmit with the correct documents.' },
        }[verification.status as 'pending' | 'approved' | 'rejected'];

        const palette: Record<string, { border: string; text: string; iconBg: string }> = {
            amber: { border: 'border-amber-100', text: 'text-amber-600', iconBg: 'bg-amber-50' },
            green: { border: 'border-green/20', text: 'text-green', iconBg: 'bg-green/10' },
            red: { border: 'border-red-100', text: 'text-red-500', iconBg: 'bg-red-50' },
        };
        const p = palette[cfg.color];

        return (
            <div className="min-h-screen bg-[#F8F9FA] pt-24 md:pt-32 pb-32 px-4">
                <div className="max-w-lg mx-auto">
                    <Link href="/profile" className="btn-back inline-flex mb-6">
                        <ChevronLeft size={14} className="btn-back-arrow" /> Back to Profile
                    </Link>
                    <div className={`at-card bg-white rounded-2xl p-8 shadow-sm border ${p.border} text-center`}>
                        <div className={`w-16 h-16 rounded-2xl ${p.iconBg} flex items-center justify-center mx-auto mb-4`}>
                            <cfg.Icon size={28} className={p.text} />
                        </div>
                        <h1 className="text-2xl font-black text-dark mb-2">{cfg.title}</h1>
                        <p className="text-sm text-dark/60 leading-relaxed mb-6">{cfg.desc}</p>

                        <div className="bg-[#F8F9FA] rounded-xl p-4 text-left mb-6 border border-gray-100">
                            {[
                                ['School', verification.schoolName],
                                verification.city && ['City', verification.city],
                                verification.classLevel && ['Class level', `${verification.classLevel}${verification.className ? ` — ${verification.className}` : ''}`],
                                ['Position', verification.position],
                                verification.subject && ['Subject', verification.subject],
                                ['Status', verification.status],
                            ].filter(Boolean).map(([k, v]: any) => (
                                <div key={k} className="flex items-center justify-between py-1.5 text-sm border-b border-gray-100 last:border-0">
                                    <span className="text-dark/50">{k}</span>
                                    <span className={`font-bold ${k === 'Status' ? p.text : 'text-dark'} ${k === 'Status' ? 'capitalize' : ''}`}>{v}</span>
                                </div>
                            ))}
                        </div>

                        {verification.status === 'approved' && (
                            <Link href="/teacher/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-green text-white rounded-xl font-bold text-sm shadow-lg shadow-green/20 hover:bg-green/90 transition-colors w-full justify-center">
                                Go to Teacher Dashboard <ChevronRight size={16} />
                            </Link>
                        )}
                        {verification.status === 'rejected' && (
                            <button onClick={() => setVerification(null)} className="inline-flex items-center gap-2 px-6 py-3 bg-green text-white rounded-xl font-bold text-sm shadow-lg shadow-green/20 hover:bg-green/90 transition-colors w-full justify-center">
                                Resubmit Verification <ChevronRight size={16} />
                            </button>
                        )}
                        {verification.status === 'pending' && (
                            <Link href="/profile" className="text-sm font-semibold text-green hover:underline">← Back to Profile</Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ─── Main form ──────────────────────────────────────────
    const contactInfo = (user as any).phone || user.email;
    const canSubmit = !!(file && classLevel && subject);

    return (
        <div className="min-h-screen bg-[#F8F9FA] pt-24 md:pt-32 pb-32 px-4">
            {/* Datalists for suggestions */}
            <datalist id="dl-levels">
                {levelSuggestions.map(l => <option key={l} value={l} />)}
            </datalist>
            <datalist id="dl-classnames">
                {CLASS_NAME_SUGGESTIONS.map(n => <option key={n} value={n} />)}
            </datalist>
            <datalist id="dl-subjects">
                {subjectSuggestions.map(s => <option key={s} value={s} />)}
            </datalist>

            <div className="max-w-6xl mx-auto">
                <Link href="/profile" className="btn-back inline-flex mb-6">
                    <ChevronLeft size={14} className="btn-back-arrow" /> Back to Profile
                </Link>

                {/* Two-column grid */}
                <div className="grid md:grid-cols-[5fr_7fr] gap-6 items-start">

                    {/* ── LEFT: hero + profile info ── */}
                    <div className="space-y-5">

                        {/* Hero card */}
                        <div className="at-card bg-white rounded-[18px] p-7 shadow-sm border border-gray-100 relative">
                            <div
                                className="absolute inset-0 pointer-events-none opacity-40 rounded-[18px]"
                                style={{
                                    backgroundImage: 'radial-gradient(circle, rgba(58,170,106,0.14) 1px, transparent 1px)',
                                    backgroundSize: '14px 14px',
                                    maskImage: 'linear-gradient(to bottom right, black, transparent 60%)',
                                    WebkitMaskImage: 'linear-gradient(to bottom right, black, transparent 60%)',
                                }}
                            />
                            <div className="relative">
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase text-green bg-green/10 px-3 py-1 rounded-full mb-3">
                                    <ShieldCheck size={11} /> Teacher Program
                                </span>
                                <h1 className="text-xl md:text-2xl font-black text-dark mb-2">School Teacher Verification</h1>
                                <p className="text-sm text-dark/60 leading-relaxed">
                                    Verify your status as a school teacher and open a private chat room for your class —
                                    share resources, answer questions, and stay connected with your students.
                                </p>
                                <div className="grid grid-cols-1 gap-2 mt-5">
                                    {PERKS.map(({ Icon, title }) => (
                                        <div key={title} className="flex items-center gap-2 p-2.5 rounded-xl bg-green/5 border border-green/10">
                                            <div className="w-7 h-7 rounded-lg bg-green/10 flex items-center justify-center shrink-0">
                                                <Icon size={13} className="text-green" />
                                            </div>
                                            <p className="text-xs font-bold text-dark/80 leading-tight">{title}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Profile info card */}
                        <div className="at-card bg-white rounded-[18px] p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-black text-dark flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green" /> Your profile info
                                </h2>
                                <Link href="/settings" className="flex items-center gap-1.5 text-xs font-bold text-green hover:underline">
                                    <Pencil size={12} /> Edit
                                </Link>
                            </div>
                            <p className="text-xs text-dark/50 mb-4">
                                Taken from your profile and submitted with your application — no need to retype.
                            </p>
                            <div className="space-y-2">
                                {[
                                    ['School', (user as any).schoolName],
                                    ['City', (user as any).city],
                                    ['Full name', user.displayName],
                                    ['Contact', contactInfo],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#F8F9FA] rounded-xl border border-gray-100">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-dark/40 shrink-0">{k}</span>
                                        <span className="text-sm font-bold text-dark truncate text-right">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: form ── */}
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-[18px] p-6 md:p-8 shadow-sm border border-gray-100 space-y-6"
                    >
                        <div>
                            <h2 className="text-lg font-black text-dark mb-1">Teaching details</h2>
                            <p className="text-xs text-dark/50">Tell us what you teach at your school.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field
                                label="Class level *"
                                icon={BookOpen}
                                value={classLevel}
                                onChange={setClassLevel}
                                placeholder="e.g. 1ère Bac, Tronc Commun"
                                listId="dl-levels"
                            />
                            <Field
                                label="Class name"
                                hint="optional"
                                icon={BookOpen}
                                value={className}
                                onChange={setClassName}
                                placeholder="e.g. AS-B, Groupe 2"
                                listId="dl-classnames"
                            />
                        </div>

                        <Field
                            label="Subject you teach *"
                            icon={BookOpen}
                            value={subject}
                            onChange={setSubject}
                            placeholder="e.g. Mathematics, Physics, Arabic"
                            listId="dl-subjects"
                        />

                        {/* Document type */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-dark/60 mb-2">Document type *</label>
                            <div className="grid grid-cols-2 gap-2">
                                {DOC_TYPES.map(dt => {
                                    const Icon = dt.icon;
                                    const active = docType === dt.value;
                                    return (
                                        <button
                                            key={dt.value}
                                            type="button"
                                            onClick={() => setDocType(dt.value)}
                                            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                                                active
                                                    ? 'bg-green/10 border-green text-green'
                                                    : 'bg-white border-gray-200 text-dark/60 hover:border-green/40 hover:text-dark'
                                            }`}
                                        >
                                            <Icon size={15} /> {dt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Upload */}
                        <div>
                            <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-dark/60 mb-2">
                                <span>Upload document *</span>
                                <span className="text-dark/40 normal-case tracking-normal">JPG, PNG or PDF · max 10MB</span>
                            </label>
                            <div
                                onClick={() => fileRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                                    file ? 'border-green bg-green/5' : 'border-gray-200 bg-[#F8F9FA] hover:border-green/50 hover:bg-green/5'
                                }`}
                            >
                                {file ? (
                                    <div>
                                        {preview ? (
                                            <div className="relative w-36 h-24 mx-auto mb-3 rounded-xl overflow-hidden border border-green/20">
                                                <Image src={preview} alt="preview" fill className="object-cover" unoptimized />
                                            </div>
                                        ) : (
                                            <FileText size={36} className="text-green mx-auto mb-2" />
                                        )}
                                        <div className="flex items-center justify-center gap-3">
                                            <div>
                                                <p className="font-bold text-dark text-sm">{file.name}</p>
                                                <p className="text-xs text-dark/50 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                                                className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={30} className="text-dark/30 mx-auto mb-2" />
                                        <p className="font-bold text-dark/70 text-sm mb-1">Click to upload your document</p>
                                        <p className="text-xs text-dark/40">Photo of ID, teaching certificate, or school letter</p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,application/pdf"
                                className="hidden"
                                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                            />
                        </div>

                        {/* Privacy note */}
                        <div className="flex gap-3 p-4 bg-green/5 border border-green/15 rounded-xl">
                            <ShieldCheck size={18} className="text-green shrink-0 mt-0.5" />
                            <p className="text-xs text-dark/70 leading-relaxed">
                                Your document is stored securely and only reviewed by Darsy admins to verify your teacher status. It will not be shared publicly.
                            </p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl">
                                <AlertCircle size={16} className="text-red-500 shrink-0" />
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-2 p-4 bg-green/10 border border-green/20 rounded-xl">
                                <CheckCircle size={16} className="text-green shrink-0" />
                                <p className="text-sm font-bold text-green">Application submitted! We'll review it within 1-3 business days.</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || !canSubmit}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-green text-white rounded-xl font-bold text-sm shadow-lg shadow-green/20 hover:bg-green/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {submitting
                                ? <><Loader2 size={18} className="animate-spin" /> Submitting…</>
                                : <><Upload size={18} /> Submit for Verification</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function Field({
    label, hint, icon: Icon, value, onChange, placeholder, listId,
}: {
    label: string; hint?: string; icon: any; value: string;
    onChange: (v: string) => void; placeholder: string; listId?: string;
}) {
    return (
        <div>
            <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-dark/60 mb-2">
                <span>{label}</span>
                {hint && <span className="text-dark/40 normal-case tracking-normal">{hint}</span>}
            </label>
            <div className="relative">
                <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    list={listId}
                    autoComplete="off"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-green focus:ring-2 focus:ring-green/15 transition-all"
                />
            </div>
        </div>
    );
}
