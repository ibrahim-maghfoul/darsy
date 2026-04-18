"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    User, Mail, GraduationCap, Briefcase, BookOpen, Video,
    ChevronRight, ChevronLeft, Upload, CheckCircle, Loader2, Info,
    Clock, AlertCircle, ShieldCheck, Sparkles, Users, TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import type { School, Level, Guidance, Subject } from "@/types";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap');`;

interface FormData {
    fullName: string; email: string; age: string;
    studyBranch: string; studyLevel: string; specialist: string;
    currentStand: string; targetLevelId: string; targetGuidanceId: string; targetSubjectId: string;
}

const STEPS = [
    { title: "Personal Info", desc: "Tell us about yourself", icon: User },
    { title: "Qualifications", desc: "Your academic background", icon: GraduationCap },
    { title: "Choose Course", desc: "What you want to teach", icon: BookOpen },
    { title: "Demo Video", desc: "Upload a 15-min lesson", icon: Video },
];

const CURRENT_STAND_OPTIONS = ["Student", "Graduate", "Employed Teacher", "Freelance Tutor", "Professor", "Other"];

const PERKS = [
    { icon: Users, title: "Reach thousands", desc: "Teach Moroccan students at scale" },
    { icon: TrendingUp, title: "Grow your brand", desc: "Build your instructor profile" },
    { icon: Sparkles, title: "Free to join", desc: "No fees, no subscription required" },
];

export default function ApplyInstructorPage() {
    const { user } = useAuth();
    const { showSnackbar } = useSnackbar();
    const router = useRouter();

    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [existingApp, setExistingApp] = useState<any>(null);
    const [fetching, setFetching] = useState(true);
    const [form, setForm] = useState<FormData>({ fullName: "", email: "", age: "", studyBranch: "", studyLevel: "", specialist: "", currentStand: "", targetLevelId: "", targetGuidanceId: "", targetSubjectId: "" });
    const [schools, setSchools] = useState<School[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [guidances, setGuidances] = useState<Guidance[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSchool, setSelectedSchool] = useState("");

    useEffect(() => {
        if (!user) return;
        setForm(f => ({ ...f, fullName: f.fullName || user.displayName || "", email: f.email || user.email || "" }));
        if (user.role === 'instructor') { router.push('/instructor-dashboard'); return; }
        api.get("/teacher/applications/me")
            .then(r => { if (r.data?.length > 0) setExistingApp(r.data[0]); })
            .catch(() => {})
            .finally(() => setFetching(false));
    }, [user]);

    useEffect(() => { api.get("/data/schools").then(r => setSchools(r.data)).catch(() => {}); }, []);

    const fetchLevels = async (sid: string) => { try { setLevels((await api.get(`/data/levels/${sid}`)).data); } catch { setLevels([]); } };
    const fetchGuidances = async (lid: string) => { try { setGuidances((await api.get(`/data/guidances/${lid}`)).data); } catch { setGuidances([]); } };
    const fetchSubjects = async (gid: string) => { try { setSubjects((await api.get(`/data/subjects/${gid}`)).data); } catch { setSubjects([]); } };
    const updateForm = (key: keyof FormData, value: string) => setForm(f => ({ ...f, [key]: value }));

    const canProceed = () => {
        switch (step) {
            case 0: return !!(form.fullName && form.email && form.age);
            case 1: return !!(form.studyBranch && form.studyLevel && form.specialist && form.currentStand);
            case 2: return !!(form.targetLevelId && form.targetGuidanceId && form.targetSubjectId);
            case 3: return videoFile !== null;
            default: return false;
        }
    };

    const handleSubmit = async () => {
        if (!user) { showSnackbar("Please log in first", "error"); return; }
        if (!videoFile) { showSnackbar("Please upload your demo video", "error"); return; }
        setSubmitting(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            fd.append("video", videoFile);
            await api.post("/teacher/apply", fd, { headers: { "Content-Type": "multipart/form-data" }, timeout: 300000 });
            setSubmitted(true);
            showSnackbar("Application submitted!", "success");
        } catch (err: any) {
            showSnackbar(err?.response?.data?.error || "Failed to submit", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // ── FULL-PAGE STATES ──

    if (!user) return (
        <FullPageWrap>
            <div style={{ textAlign: 'center', maxWidth: '360px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(58,170,106,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <User size={30} style={{ color: '#3aaa6a' }} />
                </div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.4rem', color: '#F0F0F0', marginBottom: '10px' }}>Sign in Required</h2>
                <p style={{ color: '#8A9099', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>Sign in to apply and start teaching on Darsy.</p>
                <button onClick={() => router.push("/login")} style={greenBtn}>Sign In</button>
            </div>
        </FullPageWrap>
    );

    if (fetching) return (
        <FullPageWrap>
            <div style={{ width: '36px', height: '36px', border: '3px solid rgba(58,170,106,0.15)', borderTopColor: '#3aaa6a', borderRadius: '50%', animation: 'ispin 0.8s linear infinite' }} />
            <style>{`@keyframes ispin { to { transform: rotate(360deg); } }`}</style>
        </FullPageWrap>
    );

    if (existingApp && existingApp.status !== 'rejected') {
        const isPending = existingApp.status === 'pending';
        const cfg = isPending
            ? { Icon: Clock, accent: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', title: 'Application Under Review', desc: 'Your application is being reviewed. This usually takes 3-5 business days.' }
            : { Icon: ShieldCheck, accent: '#3aaa6a', bg: 'rgba(58,170,106,0.1)', border: 'rgba(58,170,106,0.25)', title: 'Application Approved!', desc: 'You are now an instructor on Darsy. Start uploading courses!' };
        return (
            <FullPageWrap>
                <div style={{ background: '#0F1421', border: `1px solid ${cfg.border}`, borderRadius: '24px', padding: '40px 36px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <cfg.Icon size={32} style={{ color: cfg.accent }} />
                    </div>
                    <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.4rem', color: '#F0F0F0', marginBottom: '8px' }}>{cfg.title}</h1>
                    <p style={{ color: '#8A9099', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '24px' }}>{cfg.desc}</p>
                    <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '14px', padding: '16px', textAlign: 'left', marginBottom: '24px' }}>
                        {[['Name', existingApp.fullName], ['Specialist', existingApp.specialist], ['Status', existingApp.status]].map(([k, v]) => (
                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '0.875rem' }}>
                                <span style={{ color: '#8A9099' }}>{k}</span>
                                <span style={{ fontWeight: 700, color: k === 'Status' ? cfg.accent : '#F0F0F0', textTransform: k === 'Status' ? 'capitalize' : 'none' }}>{v}</span>
                            </div>
                        ))}
                    </div>
                    {existingApp.status === 'approved'
                        ? <Link href="/instructor-dashboard" style={{ ...greenBtn, display: 'flex', justifyContent: 'center', gap: '8px', textDecoration: 'none', padding: '12px 24px' }}>
                            Go to Dashboard <ChevronRight size={18} />
                          </Link>
                        : <Link href="/profile" style={{ display: 'inline-block', color: '#3aaa6a', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>Back to Profile →</Link>
                    }
                </div>
            </FullPageWrap>
        );
    }

    if (submitted) return (
        <FullPageWrap>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', maxWidth: '380px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(58,170,106,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid rgba(58,170,106,0.25)' }}>
                    <CheckCircle size={40} style={{ color: '#3aaa6a' }} />
                </div>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#F0F0F0', marginBottom: '10px' }}>Application Submitted!</h2>
                <p style={{ color: '#8A9099', lineHeight: 1.65, marginBottom: '28px', fontSize: '0.9rem' }}>
                    Our team will review your demo video and get back within 3-5 business days.
                </p>
                <button onClick={() => router.push("/profile")} style={greenBtn}>Back to Profile</button>
            </motion.div>
        </FullPageWrap>
    );

    // ── MAIN FORM ──
    return (
        <div style={{ minHeight: '100vh', background: '#07090F', fontFamily: 'DM Sans, sans-serif', display: 'flex' }}>
            <style>{`
                ${FONT_IMPORT}
                @keyframes ispin { to { transform: rotate(360deg); } }
                @keyframes ifadein { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }

                .ifield {
                    width: 100%;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 13px;
                    padding: 12px 14px 12px 42px;
                    color: #F0F0F0;
                    font-size: 14px;
                    font-family: 'DM Sans', sans-serif;
                    outline: none;
                    transition: border-color 0.2s, background 0.2s;
                    box-sizing: border-box;
                }
                .ifield:focus { border-color: rgba(58,170,106,0.5); background: rgba(58,170,106,0.04); }
                .ifield::placeholder { color: #3A4455; }

                .ipill {
                    padding: 9px 16px;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 600;
                    border: 1px solid rgba(255,255,255,0.08);
                    background: rgba(255,255,255,0.03);
                    color: #8A9099;
                    cursor: pointer;
                    transition: all 0.18s;
                    font-family: 'DM Sans', sans-serif;
                }
                .ipill:hover { border-color: rgba(58,170,106,0.3); color: #C0C8D0; }
                .ipill.active { background: rgba(58,170,106,0.12); border-color: rgba(58,170,106,0.4); color: #3aaa6a; }

                @media (max-width: 767px) {
                    .split-left { display: none !important; }
                    .split-right { padding: 80px 20px 40px !important; }
                    .form-mobile-steps { display: flex !important; }
                }
                @media (min-width: 768px) {
                    .form-mobile-steps { display: none !important; }
                }
            `}</style>

            {/* ── LEFT PANEL ── */}
            <div className="split-left" style={{ width: '38%', minWidth: '300px', background: 'linear-gradient(160deg, #0C1F14 0%, #07090F 60%)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '0', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '48px 36px 36px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: '#3aaa6a', background: 'rgba(58,170,106,0.1)', border: '1px solid rgba(58,170,106,0.2)', borderRadius: '20px', padding: '3px 12px', marginBottom: '16px', fontFamily: 'Syne, sans-serif' }}>
                        INSTRUCTOR PROGRAM
                    </span>
                    <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.55rem', color: '#F0F0F0', lineHeight: 1.2, margin: '0 0 10px' }}>
                        Share your knowledge with Morocco
                    </h1>
                    <p style={{ color: '#8A9099', fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>
                        Upload recorded lessons and build your teaching profile on Darsy.
                    </p>
                </div>

                {/* Step tracker */}
                <div style={{ padding: '28px 36px', flex: 1 }}>
                    <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#8A9099', marginBottom: '20px', fontFamily: 'Syne, sans-serif' }}>YOUR PROGRESS</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {STEPS.map((s, i) => {
                            const isDone = i < step;
                            const isActive = i === step;
                            return (
                                <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', paddingBottom: '4px' }}>
                                    {/* connector */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px', flexShrink: 0 }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: isDone ? '#3aaa6a' : isActive ? 'rgba(58,170,106,0.15)' : 'rgba(255,255,255,0.04)',
                                            border: isActive ? '2px solid #3aaa6a' : isDone ? '2px solid #3aaa6a' : '1px solid rgba(255,255,255,0.08)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.25s',
                                            cursor: i < step ? 'pointer' : 'default',
                                        }} onClick={() => i < step && setStep(i)}>
                                            {isDone
                                                ? <CheckCircle size={15} style={{ color: 'white' }} />
                                                : <span style={{ fontSize: '12px', fontWeight: 700, color: isActive ? '#3aaa6a' : '#8A9099', fontFamily: 'Syne, sans-serif' }}>{i + 1}</span>}
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div style={{ width: '2px', height: '32px', background: isDone ? 'rgba(58,170,106,0.4)' : 'rgba(255,255,255,0.05)', borderRadius: '1px', marginTop: '4px', transition: 'background 0.3s' }} />
                                        )}
                                    </div>
                                    <div style={{ paddingTop: '6px', paddingBottom: i < STEPS.length - 1 ? '28px' : '0' }}>
                                        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: isActive ? '#F0F0F0' : isDone ? '#8A9099' : '#5A6475', margin: '0 0 2px', transition: 'color 0.25s' }}>{s.title}</p>
                                        <p style={{ fontSize: '0.78rem', color: '#5A6475', margin: 0 }}>{s.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Perks */}
                <div style={{ padding: '24px 36px 36px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {PERKS.map(({ icon: Icon, title, desc }) => (
                        <div key={title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '9px', background: 'rgba(58,170,106,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon size={15} style={{ color: '#3aaa6a' }} />
                            </div>
                            <div>
                                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.8rem', color: '#D0D8E0', margin: '0 0 2px' }}>{title}</p>
                                <p style={{ fontSize: '0.75rem', color: '#8A9099', margin: 0 }}>{desc}</p>
                            </div>
                        </div>
                    ))}
                    <p style={{ fontSize: '0.78rem', color: '#8A9099', marginTop: '16px' }}>
                        Want a classroom room instead?{' '}
                        <Link href="/apply-teacher" style={{ color: '#3aaa6a', fontWeight: 600, textDecoration: 'none' }}>Apply as Teacher →</Link>
                    </p>
                </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="split-right" style={{ flex: 1, padding: '80px 48px 80px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                {/* Mobile step indicator */}
                <div className="form-mobile-steps" style={{ gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
                    {STEPS.map((_, i) => (
                        <div key={i} style={{ width: i === step ? '24px' : '8px', height: '8px', borderRadius: '4px', background: i <= step ? '#3aaa6a' : 'rgba(255,255,255,0.12)', transition: 'all 0.3s' }} />
                    ))}
                </div>

                <div style={{ maxWidth: '480px', margin: '0 auto', width: '100%', flex: 1 }}>
                    <div style={{ marginBottom: '32px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: '#8A9099', marginBottom: '6px', fontFamily: 'Syne, sans-serif' }}>STEP {step + 1} OF {STEPS.length}</p>
                        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.4rem', color: '#F0F0F0', margin: '0 0 6px' }}>{STEPS[step].title}</h2>
                        <p style={{ color: '#8A9099', fontSize: '0.875rem', margin: 0 }}>{STEPS[step].desc}</p>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div key={step} initial={{ x: 16, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -16, opacity: 0 }} transition={{ duration: 0.22 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                {step === 0 && (
                                    <>
                                        <IField label="Full Name" icon={User} value={form.fullName} onChange={v => updateForm("fullName", v)} placeholder="Your full name" />
                                        <IField label="Email" icon={Mail} value={form.email} onChange={v => updateForm("email", v)} placeholder="your@email.com" type="email" />
                                        <IField label="Age" icon={User} value={form.age} onChange={v => updateForm("age", v)} placeholder="e.g. 25" type="number" />
                                    </>
                                )}

                                {step === 1 && (
                                    <>
                                        <IField label="Study Branch" icon={GraduationCap} value={form.studyBranch} onChange={v => updateForm("studyBranch", v)} placeholder="e.g. Mathematics, Physics" />
                                        <IField label="Study Level" icon={GraduationCap} value={form.studyLevel} onChange={v => updateForm("studyLevel", v)} placeholder="e.g. Master's, PhD, Bachelor's" />
                                        <IField label="Specialist" icon={Briefcase} value={form.specialist} onChange={v => updateForm("specialist", v)} placeholder="e.g. Algebra, Organic Chemistry" />
                                        <div>
                                            <label style={fieldLabel}>Current Stand</label>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {CURRENT_STAND_OPTIONS.map(opt => (
                                                    <button key={opt} onClick={() => updateForm("currentStand", opt)}
                                                        className={`ipill${form.currentStand === opt ? ' active' : ''}`}>
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {step === 2 && (
                                    <>
                                        <PillSelector label="School" options={schools} selected={selectedSchool}
                                            onSelect={sid => { setSelectedSchool(sid); setLevels([]); setGuidances([]); setSubjects([]); updateForm("targetLevelId", ""); updateForm("targetGuidanceId", ""); updateForm("targetSubjectId", ""); fetchLevels(sid); }} />
                                        {levels.length > 0 && (
                                            <PillSelector label="Level you want to teach" options={levels} selected={form.targetLevelId}
                                                onSelect={lid => { updateForm("targetLevelId", lid); setGuidances([]); setSubjects([]); updateForm("targetGuidanceId", ""); updateForm("targetSubjectId", ""); fetchGuidances(lid); }} />
                                        )}
                                        {guidances.length > 0 && (
                                            <PillSelector label="Guidance" options={guidances} selected={form.targetGuidanceId}
                                                onSelect={gid => { updateForm("targetGuidanceId", gid); setSubjects([]); updateForm("targetSubjectId", ""); fetchSubjects(gid); }} />
                                        )}
                                        {subjects.length > 0 && (
                                            <PillSelector label="Subject to explain" options={subjects} selected={form.targetSubjectId}
                                                onSelect={sid => updateForm("targetSubjectId", sid)} />
                                        )}
                                    </>
                                )}

                                {step === 3 && (
                                    <>
                                        <div style={{ background: 'rgba(58,170,106,0.06)', border: '1px solid rgba(58,170,106,0.15)', borderRadius: '14px', padding: '16px 18px' }}>
                                            <p style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#3aaa6a', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'Syne, sans-serif', marginBottom: '10px' }}>
                                                <Info size={15} /> Video Guidelines
                                            </p>
                                            <ul style={{ margin: 0, paddingLeft: '18px', color: '#8A9099', fontSize: '0.8rem', lineHeight: 1.7 }}>
                                                <li>Record a ~15 minute demo lesson</li>
                                                <li>Start by explaining the topic clearly</li>
                                                <li>Include 2-3 exercises with corrections</li>
                                                <li>End with a brief summary</li>
                                                <li>MP4, WebM or MOV · max 500MB</li>
                                            </ul>
                                        </div>

                                        <label style={{ display: 'block', cursor: 'pointer' }}>
                                            <div style={{
                                                border: `2px dashed ${videoFile ? 'rgba(58,170,106,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                                borderRadius: '18px',
                                                padding: '40px 24px',
                                                textAlign: 'center',
                                                background: videoFile ? 'rgba(58,170,106,0.05)' : 'rgba(255,255,255,0.02)',
                                                transition: 'all 0.2s',
                                            }}>
                                                {videoFile ? (
                                                    <div>
                                                        <CheckCircle size={36} style={{ color: '#3aaa6a', margin: '0 auto 10px', display: 'block' }} />
                                                        <p style={{ fontWeight: 700, color: '#F0F0F0', fontSize: '0.9rem', marginBottom: '4px', fontFamily: 'Syne, sans-serif' }}>{videoFile.name}</p>
                                                        <p style={{ fontSize: '0.8rem', color: '#8A9099', marginBottom: '8px' }}>{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                                                        <p style={{ fontSize: '0.78rem', color: '#3aaa6a', fontWeight: 600 }}>Click to change</p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <Upload size={36} style={{ color: 'rgba(255,255,255,0.18)', margin: '0 auto 12px', display: 'block' }} />
                                                        <p style={{ fontWeight: 600, color: '#8A9099', fontSize: '0.9rem', marginBottom: '4px', fontFamily: 'Syne, sans-serif' }}>Upload your demo video</p>
                                                        <p style={{ fontSize: '0.78rem', color: '#5A6475' }}>MP4, WebM or MOV · max 500MB</p>
                                                    </div>
                                                )}
                                            </div>
                                            <input type="file" accept="video/mp4,video/webm,video/quicktime" style={{ display: 'none' }}
                                                onChange={e => {
                                                    const f = e.target.files?.[0];
                                                    if (f) { if (f.size > 500 * 1024 * 1024) { showSnackbar("Video must be under 500MB", "error"); return; } setVideoFile(f); }
                                                }} />
                                        </label>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '36px' }}>
                        <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: step === 0 ? '#3A4455' : '#8A9099', fontSize: '0.875rem', fontWeight: 600, cursor: step === 0 ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s' }}>
                            <ChevronLeft size={16} /> Back
                        </button>
                        {step < STEPS.length - 1 ? (
                            <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} style={{ ...greenBtn, display: 'flex', alignItems: 'center', gap: '8px', opacity: canProceed() ? 1 : 0.4, cursor: canProceed() ? 'pointer' : 'not-allowed' }}>
                                Continue <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={!canProceed() || submitting} style={{ ...greenBtn, display: 'flex', alignItems: 'center', gap: '8px', opacity: canProceed() && !submitting ? 1 : 0.4, cursor: canProceed() && !submitting ? 'pointer' : 'not-allowed' }}>
                                {submitting ? <><Loader2 size={16} style={{ animation: 'ispin 0.8s linear infinite' }} /> Uploading...</> : 'Submit Application'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── HELPERS ──

const greenBtn: React.CSSProperties = {
    padding: '11px 24px',
    background: '#3aaa6a',
    color: 'white',
    border: 'none',
    borderRadius: '13px',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: 'DM Sans, sans-serif',
};

const fieldLabel: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#8A9099',
    marginBottom: '8px',
    fontFamily: 'Syne, sans-serif',
    letterSpacing: '0.04em',
};

function FullPageWrap({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ minHeight: '100vh', background: '#07090F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'DM Sans, sans-serif' }}>
            <style>{FONT_IMPORT}</style>
            {children}
        </div>
    );
}

function IField({ label, icon: Icon, value, onChange, placeholder, type = "text" }: {
    label: string; icon: any; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
    return (
        <div>
            <label style={fieldLabel}>{label}</label>
            <div style={{ position: 'relative' }}>
                <Icon size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#3A4455', pointerEvents: 'none' }} />
                <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="ifield" />
            </div>
        </div>
    );
}

function PillSelector({ label, options, selected, onSelect }: {
    label: string; options: any[]; selected: string; onSelect: (id: string) => void;
}) {
    return (
        <div>
            <label style={fieldLabel}>{label}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {options.map(o => {
                    const id = o._id || o.id;
                    return (
                        <button key={id} onClick={() => onSelect(id)} className={`ipill${selected === id ? ' active' : ''}`}>
                            {o.title}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
