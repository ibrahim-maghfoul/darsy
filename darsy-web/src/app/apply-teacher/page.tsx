'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
    GraduationCap, Upload, CheckCircle, Loader2, Clock,
    FileText, IdCard, School, Briefcase, AlertCircle,
    ChevronRight, Image as ImageIcon, X, ShieldCheck, MapPin, BookOpen, Phone, MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const DOC_TYPES = [
    { value: 'id_card', label: 'National ID Card', icon: IdCard },
    { value: 'certificate', label: 'Teaching Certificate', icon: FileText },
    { value: 'school_letter', label: 'School Official Letter', icon: School },
    { value: 'other', label: 'Other Official Document', icon: FileText },
];

function profileCompletion(user: any): number {
    if (!user) return 0;
    const fields = [
        user.displayName, user.nickname, user.age, user.city,
        user.phone, user.schoolName, user.email, user.level?.school,
        user.level?.level, user.level?.guidance, user.photoURL,
    ];
    return Math.round(fields.filter(f => f && f !== '').length / fields.length * 100);
}

export default function ApplyTeacherPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [verification, setVerification] = useState<any>(null);
    const [fetching, setFetching] = useState(true);

    // Form state
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

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user?.role === 'teacher') {
            router.push('/teacher/dashboard');
            return;
        }
        if (user) fetchVerification();
    }, [user]);

    const fetchVerification = async () => {
        try {
            const res = await api.get('/teacher/verify/me');
            setVerification(res.data);
        } catch { /* not found = no submission yet */ }
        finally { setFetching(false); }
    };

    const handleFile = (f: File) => {
        setFile(f);
        if (f.type.startsWith('image/')) {
            const url = URL.createObjectURL(f);
            setPreview(url);
        } else {
            setPreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !schoolName || !city || !classLevel || !position || !contactInfo) return;
        setSubmitting(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('document', file);
            fd.append('schoolName', schoolName);
            fd.append('city', city);
            fd.append('classLevel', classLevel);
            fd.append('className', className);
            fd.append('subject', subject);
            fd.append('contactInfo', contactInfo);
            fd.append('position', position);
            fd.append('documentType', docType);
            const res = await api.post('/teacher/verify', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
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
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-green" size={36} />
            </div>
        );
    }

    if (!user) return null;

    const completion = profileCompletion(user);
    const isProfileComplete = completion >= 100;

    // Profile incomplete wall
    if (!isProfileComplete) {
        return (
            <main className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-3xl border border-amber-200 shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} className="text-amber-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-dark mb-2">Complete your profile first</h1>
                    <p className="text-dark/60 text-sm mb-6">
                        Your profile is <span className="font-bold text-amber-500">{completion}% complete</span>. You need to reach 100% before applying as a teacher.
                    </p>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-6">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${completion}%` }} />
                    </div>
                    <Link href="/settings"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green text-white rounded-2xl font-bold hover:bg-green/80 transition-all">
                        Complete Profile <ChevronRight size={18} />
                    </Link>
                </div>
            </main>
        );
    }

    // Already approved/pending/rejected states
    if (verification) {
        const statusConfig = {
            pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', title: 'Verification Under Review', desc: 'Your documents have been submitted and are being reviewed by our team. This usually takes 1-3 business days.' },
            approved: { icon: ShieldCheck, color: 'text-green', bg: 'bg-green/10', border: 'border-green/30', title: 'Verification Approved!', desc: 'You are now a verified teacher on Darsy. You can create chat rooms and manage your classroom.' },
            rejected: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', title: 'Verification Rejected', desc: verification.reviewNote || 'Your verification was not approved. You may resubmit with correct documents.' },
        };
        const cfg = statusConfig[verification.status as keyof typeof statusConfig];
        const Icon = cfg.icon;

        return (
            <main className="min-h-screen bg-gray-50 pt-24 pb-16 flex items-center justify-center px-4">
                <div className={`max-w-md w-full bg-white rounded-3xl border ${cfg.border} shadow-xl p-8 text-center`}>
                    <div className={`w-16 h-16 ${cfg.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                        <Icon size={32} className={cfg.color} />
                    </div>
                    <h1 className="text-2xl font-bold text-dark mb-2">{cfg.title}</h1>
                    <p className="text-dark/60 text-sm mb-6">{cfg.desc}</p>

                    <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 text-left text-sm space-y-2 mb-6`}>
                        <div className="flex items-center justify-between">
                            <span className="text-dark/50">School</span>
                            <span className="font-bold text-dark">{verification.schoolName}</span>
                        </div>
                        {verification.city && (
                            <div className="flex items-center justify-between">
                                <span className="text-dark/50">City</span>
                                <span className="font-bold text-dark">{verification.city}</span>
                            </div>
                        )}
                        {verification.classLevel && (
                            <div className="flex items-center justify-between">
                                <span className="text-dark/50">Class Level</span>
                                <span className="font-bold text-dark">{verification.classLevel}{verification.className ? ` — ${verification.className}` : ''}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-dark/50">Position</span>
                            <span className="font-bold text-dark">{verification.position}</span>
                        </div>
                        {verification.subject && (
                            <div className="flex items-center justify-between">
                                <span className="text-dark/50">Subject</span>
                                <span className="font-bold text-dark">{verification.subject}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-dark/50">Status</span>
                            <span className={`font-bold capitalize ${cfg.color}`}>{verification.status}</span>
                        </div>
                    </div>

                    {verification.status === 'approved' && (
                        <Link href="/teacher/dashboard"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green text-white rounded-2xl font-bold hover:bg-green/80 transition-all w-full justify-center">
                            Go to Teacher Dashboard <ChevronRight size={18} />
                        </Link>
                    )}
                    {verification.status === 'rejected' && (
                        <button onClick={() => setVerification(null)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green text-white rounded-2xl font-bold hover:bg-green/80 transition-all w-full justify-center">
                            Resubmit Verification <ChevronRight size={18} />
                        </button>
                    )}
                    {verification.status === 'pending' && (
                        <Link href="/profile"
                            className="inline-flex items-center gap-2 px-6 py-3 border border-green text-green rounded-2xl font-bold hover:bg-green/10 transition-all w-full justify-center">
                            Back to Profile
                        </Link>
                    )}
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pt-20 md:pt-24 pb-16">
            <div className="max-w-2xl mx-auto px-4">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MessageSquare size={32} className="text-indigo-500" />
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold text-indigo-600 mb-3">
                        Teacher Program
                    </div>
                    <h1 className="text-3xl font-bold text-dark mb-2">School Teacher Verification</h1>
                    <p className="text-dark/55 text-sm leading-relaxed max-w-lg mx-auto">
                        This program is for <strong>school teachers</strong> who want to create dedicated chat rooms for their students — a private space to share resources, answer questions, and communicate with their class.
                    </p>
                    <p className="text-dark/40 text-xs mt-2">
                        This is different from the <Link href="/apply-instructor" className="text-green font-semibold hover:underline">Instructor Program</Link> (for uploading online courses).
                    </p>
                </div>

                {/* What you get */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                        { icon: MessageSquare, label: 'Class chat room', sub: 'Private room for your students', color: 'text-indigo-500 bg-indigo-50' },
                        { icon: ShieldCheck, label: 'Verified badge', sub: 'Reviewed in 1-3 days', color: 'text-green bg-green/10' },
                        { icon: Briefcase, label: 'Free forever', sub: 'No cost, no subscription', color: 'text-purple-500 bg-purple-50' },
                    ].map(({ icon: Icon, label, sub, color }) => (
                        <div key={label} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 text-center">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                                <Icon size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-dark">{label}</p>
                                <p className="text-[10px] text-dark/40 mt-0.5">{sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">

                    {/* School name */}
                    <div>
                        <label className="text-sm font-bold text-dark/70 mb-1.5 block">School / Institution *</label>
                        <div className="relative">
                            <School size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" />
                            <input
                                type="text"
                                value={schoolName}
                                onChange={e => setSchoolName(e.target.value)}
                                placeholder="e.g. Lycée Mohammed V"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-green outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* City */}
                    <div>
                        <label className="text-sm font-bold text-dark/70 mb-1.5 block">City *</label>
                        <div className="relative">
                            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" />
                            <input
                                type="text"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                placeholder="e.g. Casablanca, Rabat, Marrakech"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-green outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Class Level + Class Name */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-bold text-dark/70 mb-1.5 block">Class Level *</label>
                            <div className="relative">
                                <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" />
                                <input
                                    type="text"
                                    value={classLevel}
                                    onChange={e => setClassLevel(e.target.value)}
                                    placeholder="e.g. 1ère Bac, TC"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-green outline-none text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-dark/70 mb-1.5 block">Class Name <span className="text-dark/30 font-normal">(optional)</span></label>
                            <input
                                type="text"
                                value={className}
                                onChange={e => setClassName(e.target.value)}
                                placeholder="e.g. 3ème AS-B"
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-green outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Position */}
                    <div>
                        <label className="text-sm font-bold text-dark/70 mb-1.5 block">Your Position *</label>
                        <div className="relative">
                            <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" />
                            <input
                                type="text"
                                value={position}
                                onChange={e => setPosition(e.target.value)}
                                placeholder="e.g. Mathematics Teacher"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-green outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="text-sm font-bold text-dark/70 mb-1.5 block">Subject you teach *</label>
                        <div className="relative">
                            <BookOpen size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" />
                            <input
                                type="text"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="e.g. Mathematics, Physics, Arabic"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-green outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Contact info */}
                    <div>
                        <label className="text-sm font-bold text-dark/70 mb-1.5 block">Phone or Email *</label>
                        <p className="text-xs text-dark/40 mb-2">Used to contact you after verification. Not shown publicly.</p>
                        <div className="relative">
                            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" />
                            <input
                                type="text"
                                value={contactInfo}
                                onChange={e => setContactInfo(e.target.value)}
                                placeholder="e.g. +212 6XX XXX XXX or your@email.com"
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-green outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Document type */}
                    <div>
                        <label className="text-sm font-bold text-dark/70 mb-2 block">Document Type *</label>
                        <div className="grid grid-cols-2 gap-2">
                            {DOC_TYPES.map(dt => {
                                const Icon = dt.icon;
                                return (
                                    <button
                                        key={dt.value}
                                        type="button"
                                        onClick={() => setDocType(dt.value)}
                                        className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-semibold text-left transition-all ${
                                            docType === dt.value
                                                ? 'border-green bg-green/5 text-green'
                                                : 'border-gray-200 text-dark/60 hover:border-green/40'
                                        }`}
                                    >
                                        <Icon size={16} />
                                        {dt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Document upload */}
                    <div>
                        <label className="text-sm font-bold text-dark/70 mb-1.5 block">
                            Upload Document * <span className="text-dark/30 font-normal">(JPG, PNG or PDF · max 10MB)</span>
                        </label>
                        <div
                            onClick={() => fileRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all text-center ${
                                file ? 'border-green bg-green/5' : 'border-gray-200 hover:border-green/50'
                            }`}
                        >
                            {file ? (
                                <div className="space-y-3">
                                    {preview ? (
                                        <div className="relative w-40 h-28 mx-auto rounded-xl overflow-hidden border border-green/20">
                                            <Image src={preview} alt="preview" fill className="object-cover" unoptimized />
                                        </div>
                                    ) : (
                                        <FileText className="text-green mx-auto" size={36} />
                                    )}
                                    <div className="flex items-center justify-center gap-3">
                                        <div>
                                            <p className="font-semibold text-dark text-sm">{file.name}</p>
                                            <p className="text-xs text-dark/40">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); setFile(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                                            className="p-1.5 hover:bg-red-50 text-dark/30 hover:text-red-500 rounded-lg"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <ImageIcon className="text-dark/20 mx-auto mb-2" size={32} />
                                    <p className="text-sm font-semibold text-dark/50">Click to upload your document</p>
                                    <p className="text-xs text-dark/30 mt-1">Photo of ID card, teaching certificate or school letter</p>
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
                    <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                        <ShieldCheck size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700">
                            Your document is stored securely and only reviewed by Darsy admins to verify your teacher status. It will not be shared publicly.
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 border border-red-200 rounded-2xl p-4">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    {success && (
                        <div className="flex items-center gap-2 text-green font-semibold text-sm bg-green/5 border border-green/20 rounded-2xl p-4">
                            <CheckCircle size={16} /> Application submitted! We'll review it within 1-3 business days.
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting || !file || !schoolName || !city || !classLevel || !position || !subject || !contactInfo}
                        className="w-full py-4 bg-green text-white rounded-2xl font-bold text-base hover:bg-green/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-green/20"
                    >
                        {submitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : <><Upload size={18} /> Submit for Verification</>}
                    </button>
                </form>
            </div>
        </main>
    );
}
