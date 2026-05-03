"use client";

import { useState, useEffect } from "react";
import { DarsyLoader } from "@/components/DarsyLoader";
import { AnimatePresence, motion } from "framer-motion";
import {
    User, Mail, GraduationCap, Briefcase, BookOpen, Video,
    ChevronRight, ChevronLeft, Upload, CheckCircle, Loader2, Info,
    Clock, ShieldCheck, Sparkles, Users, TrendingUp, LogIn, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import type { School, Level, Guidance, Subject } from "@/types";

interface FormData {
    fullName: string; email: string; age: string;
    studyBranch: string; studyLevel: string; specialist: string;
    currentStand: string; targetLevelId: string; targetGuidanceId: string; targetSubjectId: string;
}

const STEPS = [
    { title: "Personal Info",    desc: "Tell us about yourself",       icon: User },
    { title: "Qualifications",   desc: "Your academic background",      icon: GraduationCap },
    { title: "Choose Course",    desc: "What you want to teach",        icon: BookOpen },
    { title: "Demo Video",       desc: "Upload a 15-min lesson",        icon: Video },
];

const CURRENT_STAND_OPTIONS = ["Student", "Graduate", "Employed Teacher", "Freelance Tutor", "Professor", "Other"];

const PERKS = [
    { icon: Users,      title: "Reach thousands",   desc: "Teach Moroccan students at scale" },
    { icon: TrendingUp, title: "Grow your brand",   desc: "Build your instructor profile" },
    { icon: Sparkles,   title: "Free to join",      desc: "No fees, no subscription required" },
];

const DOT_TEXTURE  = `radial-gradient(circle, rgba(58,170,106,0.18) 1px, transparent 1px)`;
const DARK_STRIPE  = `repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 2px,transparent 2px,transparent 8px),linear-gradient(135deg,#1e7a46 0%,#0f4428 100%)`;

/* ─── Shared left panel ─────────────────────────────────────────── */
function LeftPanel({ step }: { step?: number }) {
    return (
        <div
            className="hidden md:flex flex-col w-[38%] min-w-[300px] sticky top-0 h-screen overflow-hidden"
            style={{ background: DARK_STRIPE }}
        >
            {/* Header */}
            <div className="px-9 pt-24 pb-8 border-b border-white/8 shrink-0">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.14em] text-green bg-white/10 border border-white/15 rounded-full px-3 py-1 mb-5">
                    INSTRUCTOR PROGRAM
                </span>
                <h1 className="text-2xl font-black text-white leading-tight mb-3">
                    Share your knowledge<br />with Morocco
                </h1>
                <p className="text-sm text-white/50 leading-relaxed font-medium">
                    Upload recorded lessons and build your teaching profile on Darsy.
                </p>
            </div>

            {/* Step tracker — only shown when step is defined */}
            {step !== undefined && (
                <div className="px-9 py-7 flex-1 min-h-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30 mb-5">YOUR PROGRESS</p>
                    <div className="flex flex-col gap-0">
                        {STEPS.map((s, i) => {
                            const isDone   = i < step;
                            const isActive = i === step;
                            return (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="flex flex-col items-center w-8 shrink-0">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0"
                                            style={{
                                                background: isDone ? "#3aaa6a" : isActive ? "rgba(58,170,106,0.18)" : "rgba(255,255,255,0.05)",
                                                border: isActive ? "2px solid #3aaa6a" : isDone ? "2px solid #3aaa6a" : "1px solid rgba(255,255,255,0.1)",
                                            }}
                                        >
                                            {isDone
                                                ? <CheckCircle size={14} className="text-white" />
                                                : <span className={`text-xs font-black ${isActive ? "text-green" : "text-white/35"}`}>{i + 1}</span>
                                            }
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div className="w-px h-8 mt-1 rounded-full transition-all" style={{ background: isDone ? "rgba(58,170,106,0.45)" : "rgba(255,255,255,0.07)" }} />
                                        )}
                                    </div>
                                    <div className={`pt-1.5 ${i < STEPS.length - 1 ? "pb-7" : ""}`}>
                                        <p className={`text-sm font-black mb-0.5 transition-colors ${isActive ? "text-white" : isDone ? "text-white/45" : "text-white/25"}`}>{s.title}</p>
                                        <p className="text-xs text-white/30 font-medium">{s.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Perks — fills remaining space when no step tracker */}
            <div className={`px-9 pb-9 border-t border-white/8 ${step !== undefined ? "pt-6" : "pt-8 flex-1 flex flex-col justify-between"}`}>
                {step === undefined && (
                    <div className="space-y-5 mb-8">
                        {PERKS.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex gap-3 items-start">
                                <div className="w-9 h-9 rounded-[11px] bg-white/10 flex items-center justify-center shrink-0">
                                    <Icon size={16} className="text-white/80" />
                                </div>
                                <div className="pt-0.5">
                                    <p className="text-sm font-black text-white/85 mb-0.5">{title}</p>
                                    <p className="text-xs text-white/40 font-medium">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="space-y-3">
                    {step !== undefined && PERKS.map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="flex gap-3 items-start">
                            <div className="w-8 h-8 rounded-[10px] bg-white/10 flex items-center justify-center shrink-0">
                                <Icon size={14} className="text-white/80" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-white/80 mb-0.5">{title}</p>
                                <p className="text-xs text-white/40 font-medium">{desc}</p>
                            </div>
                        </div>
                    ))}
                    <p className="text-xs text-white/35 pt-2 font-medium">
                        Want a classroom instead?{" "}
                        <Link href="/apply-teacher" className="text-green font-bold hover:text-green/80 transition-colors">Apply as Teacher →</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ─── Page ─────────────────────────────────────────────────────── */
export default function ApplyInstructorPage() {
    const { user } = useAuth();
    const { showSnackbar } = useSnackbar();
    const router = useRouter();

    const [step, setStep]         = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted]   = useState(false);
    const [videoFile, setVideoFile]   = useState<File | null>(null);
    const [existingApp, setExistingApp] = useState<any>(null);
    const [fetching, setFetching]     = useState(true);
    const [form, setForm] = useState<FormData>({
        fullName: "", email: "", age: "",
        studyBranch: "", studyLevel: "", specialist: "", currentStand: "",
        targetLevelId: "", targetGuidanceId: "", targetSubjectId: "",
    });
    const [schools, setSchools]     = useState<School[]>([]);
    const [levels, setLevels]       = useState<Level[]>([]);
    const [guidances, setGuidances] = useState<Guidance[]>([]);
    const [subjects, setSubjects]   = useState<Subject[]>([]);
    const [selectedSchool, setSelectedSchool] = useState("");

    useEffect(() => {
        if (!user) return;
        setForm(f => ({ ...f, fullName: f.fullName || user.displayName || "", email: f.email || user.email || "" }));
        if (user.role === "instructor") { router.push("/instructor-dashboard"); return; }
        if (user.role === "teacher") { router.push("/teacher/dashboard"); return; }
        api.get("/teacher/applications/me")
            .then(r => { if (r.data?.length > 0) setExistingApp(r.data[0]); })
            .catch(() => {})
            .finally(() => setFetching(false));
    }, [user]);

    useEffect(() => { api.get("/data/schools").then(r => setSchools(r.data)).catch(() => {}); }, []);

    const fetchLevels    = async (sid: string) => { try { setLevels((await api.get(`/data/levels/${sid}`)).data);       } catch { setLevels([]); } };
    const fetchGuidances = async (lid: string) => { try { setGuidances((await api.get(`/data/guidances/${lid}`)).data); } catch { setGuidances([]); } };
    const fetchSubjects  = async (gid: string) => { try { setSubjects((await api.get(`/data/subjects/${gid}`)).data);   } catch { setSubjects([]); } };
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

    /* ── Loading ── */
    if (fetching && user) return (
        <div className="min-h-screen bg-bg flex items-center justify-center">
            <DarsyLoader size={90} />
        </div>
    );

    /* ── Not logged in ── */
    if (!user) return (
        <div className="min-h-screen bg-bg flex">
            <LeftPanel />
            <div className="flex-1 flex items-center justify-center p-8 pt-24 md:pt-28">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-md"
                >
                    {/* Visual banner */}
                    <div
                        className="relative rounded-t-[28px] overflow-hidden px-8 py-10 flex flex-col items-center text-center"
                        style={{ background: DARK_STRIPE }}
                    >
                        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: DOT_TEXTURE, backgroundSize: "18px 18px" }} />
                        <div className="relative z-10 w-16 h-16 rounded-[20px] bg-white/15 flex items-center justify-center mb-5 border border-white/20">
                            <LogIn size={28} className="text-white" />
                        </div>
                        <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.18em] text-green mb-2">INSTRUCTOR PROGRAM</p>
                        <h2 className="relative z-10 text-2xl font-black text-white mb-2 leading-tight">Sign in to Apply</h2>
                        <p className="relative z-10 text-sm text-white/50 font-medium leading-relaxed">
                            Create your instructor account and start teaching thousands of Moroccan students.
                        </p>
                    </div>

                    {/* White content */}
                    <div className="bg-white rounded-b-[28px] px-8 py-8 space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.08),_0_4px_16px_rgba(0,0,0,0.04)]">
                        <button
                            onClick={() => router.push("/login")}
                            className="w-full py-4 bg-green text-white font-black rounded-[14px] hover:bg-green/90 transition-all text-sm shadow-lg shadow-green/25 flex items-center justify-center gap-2"
                        >
                            Sign In <ArrowRight size={15} />
                        </button>
                        <Link
                            href="/"
                            className="w-full py-3.5 flex items-center justify-center text-dark/45 font-bold text-sm rounded-[14px] border-[1.5px] border-green/15 hover:border-green/30 hover:text-dark/65 transition-all"
                        >
                            Return Home
                        </Link>
                        <p className="text-center text-xs text-dark/35 font-medium pt-1">
                            Want a classroom instead?{" "}
                            <Link href="/apply-teacher" className="text-green font-bold hover:underline">Apply as Teacher</Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );

    /* ── Existing application ── */
    if (existingApp && existingApp.status !== "rejected") {
        const isPending  = existingApp.status === "pending";
        const isApproved = existingApp.status === "approved";

        return (
            <div className="min-h-screen bg-bg flex">
                <LeftPanel />
                <div className="flex-1 flex items-center justify-center p-8 pt-24 md:pt-28">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full max-w-md"
                    >
                        {/* Status banner */}
                        <div
                            className="relative rounded-t-[28px] overflow-hidden px-8 py-10 flex flex-col items-center text-center"
                            style={{
                                background: isPending
                                    ? `repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 2px,transparent 2px,transparent 8px),linear-gradient(135deg,#92400e 0%,#451a03 100%)`
                                    : DARK_STRIPE,
                            }}
                        >
                            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: DOT_TEXTURE, backgroundSize: "18px 18px" }} />
                            <div className={`relative z-10 w-16 h-16 rounded-[20px] flex items-center justify-center mb-5 border ${isPending ? "bg-amber-400/20 border-amber-300/30" : "bg-white/15 border-white/20"}`}>
                                {isPending ? <Clock size={28} className="text-amber-300" /> : <ShieldCheck size={28} className="text-white" />}
                            </div>
                            <p className={`relative z-10 text-[10px] font-black uppercase tracking-[0.18em] mb-2 ${isPending ? "text-amber-300" : "text-green"}`}>
                                {isPending ? "UNDER REVIEW" : "APPROVED"}
                            </p>
                            <h2 className="relative z-10 text-2xl font-black text-white mb-2 leading-tight">
                                {isPending ? "We're reviewing your application" : "You're an Instructor!"}
                            </h2>
                            <p className="relative z-10 text-sm text-white/50 font-medium leading-relaxed">
                                {isPending ? "This usually takes 3–5 business days. We'll notify you by email." : "Your profile is live. Start uploading courses and reach students across Morocco."}
                            </p>
                        </div>

                        {/* White content */}
                        <div className="bg-white rounded-b-[28px] px-8 py-8 space-y-5 shadow-[0_20px_60px_rgba(0,0,0,0.08),_0_4px_16px_rgba(0,0,0,0.04)]">
                            {/* App details */}
                            <div className={`rounded-[18px] p-4 space-y-2 border ${isPending ? "bg-amber-50 border-amber-100" : "bg-green/5 border-green/12"}`}>
                                {[["Name", existingApp.fullName], ["Specialist", existingApp.specialist], ["Status", existingApp.status]].map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center text-sm py-0.5">
                                        <span className="text-dark/40 font-medium">{k}</span>
                                        <span className={`font-black capitalize ${k === "Status" ? (isPending ? "text-amber-500" : "text-green") : "text-dark"}`}>{v}</span>
                                    </div>
                                ))}
                            </div>

                            {isApproved ? (
                                <Link href="/instructor-dashboard" className="w-full py-4 bg-green text-white font-black rounded-[14px] hover:bg-green/90 transition-all text-sm shadow-lg shadow-green/25 flex items-center justify-center gap-2">
                                    Go to Dashboard <ArrowRight size={15} />
                                </Link>
                            ) : (
                                <Link href="/profile" className="w-full py-3.5 flex items-center justify-center text-dark/45 font-bold text-sm rounded-[14px] border-[1.5px] border-green/15 hover:border-green/30 hover:text-dark/65 transition-all">
                                    ← Back to Profile
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    /* ── Submitted success ── */
    if (submitted) return (
        <div className="min-h-screen bg-bg flex">
            <LeftPanel />
            <div className="flex-1 flex items-center justify-center p-8 pt-24 md:pt-28">
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 18 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 280, damping: 22 }}
                    className="w-full max-w-md"
                >
                    {/* Success banner */}
                    <div
                        className="relative rounded-t-[28px] overflow-hidden px-8 py-12 flex flex-col items-center text-center"
                        style={{ background: DARK_STRIPE }}
                    >
                        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: DOT_TEXTURE, backgroundSize: "18px 18px" }} />
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 18 }}
                            className="relative z-10 w-20 h-20 rounded-full bg-white/15 border-2 border-white/25 flex items-center justify-center mb-5"
                        >
                            <CheckCircle size={36} className="text-green" />
                        </motion.div>
                        <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.18em] text-green mb-2">ALL DONE</p>
                        <h2 className="relative z-10 text-2xl font-black text-white mb-2">Application Submitted!</h2>
                        <p className="relative z-10 text-sm text-white/50 font-medium leading-relaxed">
                            Our team will review your demo video and get back to you within 3–5 business days.
                        </p>
                    </div>

                    {/* White content */}
                    <div className="bg-white rounded-b-[28px] px-8 py-8 space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.08),_0_4px_16px_rgba(0,0,0,0.04)]">
                        <div className="bg-green/5 border border-green/12 rounded-[18px] p-4 text-sm text-dark/55 font-medium leading-relaxed text-center">
                            We'll email you at <span className="font-black text-dark">{form.email}</span> once your application is reviewed.
                        </div>
                        <button
                            onClick={() => router.push("/profile")}
                            className="w-full py-4 bg-green text-white font-black rounded-[14px] hover:bg-green/90 transition-all text-sm shadow-lg shadow-green/25 flex items-center justify-center gap-2"
                        >
                            Back to Profile <ArrowRight size={15} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );

    /* ── Main multi-step form ── */
    return (
        <div className="min-h-screen bg-bg flex">

            <LeftPanel step={step} />

            {/* Right panel */}
            <div className="flex-1 overflow-y-auto flex flex-col md:px-12 md:py-12 px-5 py-8 pt-20 md:pt-24">

                {/* Mobile step dots */}
                <div className="flex md:hidden gap-1.5 justify-center mb-8">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className="h-2 rounded-full transition-all duration-300"
                            style={{ width: i === step ? "24px" : "8px", background: i <= step ? "#3aaa6a" : "rgba(26,58,42,0.15)" }}
                        />
                    ))}
                </div>

                <div className="max-w-[480px] mx-auto w-full flex-1 flex flex-col">

                    {/* Step header */}
                    <div className="mb-8 animate-slide-up">
                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-green/60 mb-2 block">
                            STEP {step + 1} OF {STEPS.length}
                        </span>
                        <h2 className="text-2xl font-black text-dark mb-1.5">{STEPS[step].title}</h2>
                        <p className="text-sm text-dark/45 font-medium">{STEPS[step].desc}</p>
                    </div>

                    {/* Animated step content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ x: 14, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -14, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="flex-1"
                        >
                            <div className="flex flex-col gap-5">

                                {step === 0 && (<>
                                    <IField label="Full Name"  icon={User}        value={form.fullName}  onChange={v => updateForm("fullName", v)}  placeholder="Your full name" />
                                    <IField label="Email"      icon={Mail}        value={form.email}     onChange={v => updateForm("email", v)}     placeholder="your@email.com" type="email" />
                                    <IField label="Age"        icon={User}        value={form.age}       onChange={v => updateForm("age", v)}       placeholder="e.g. 25"        type="number" />
                                </>)}

                                {step === 1 && (<>
                                    <IField label="Study Branch" icon={GraduationCap} value={form.studyBranch} onChange={v => updateForm("studyBranch", v)} placeholder="e.g. Mathematics, Physics" />
                                    <IField label="Study Level"  icon={GraduationCap} value={form.studyLevel}  onChange={v => updateForm("studyLevel", v)}  placeholder="e.g. Master's, PhD, Bachelor's" />
                                    <IField label="Specialist"   icon={Briefcase}     value={form.specialist}  onChange={v => updateForm("specialist", v)}  placeholder="e.g. Algebra, Organic Chemistry" />
                                    <div>
                                        <FieldLabel>Current Stand</FieldLabel>
                                        <div className="flex flex-wrap gap-2">
                                            {CURRENT_STAND_OPTIONS.map(opt => (
                                                <button key={opt} onClick={() => updateForm("currentStand", opt)}
                                                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${form.currentStand === opt ? "bg-green text-white border-green shadow-sm shadow-green/25" : "bg-green/6 border-green/15 text-dark/55 hover:bg-green/10 hover:border-green/25"}`}>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>)}

                                {step === 2 && (<>
                                    <PillSelector label="School" options={schools} selected={selectedSchool}
                                        onSelect={sid => { setSelectedSchool(sid); setLevels([]); setGuidances([]); setSubjects([]); updateForm("targetLevelId",""); updateForm("targetGuidanceId",""); updateForm("targetSubjectId",""); fetchLevels(sid); }} />
                                    {levels.length > 0 && (
                                        <PillSelector label="Level you want to teach" options={levels} selected={form.targetLevelId}
                                            onSelect={lid => { updateForm("targetLevelId", lid); setGuidances([]); setSubjects([]); updateForm("targetGuidanceId",""); updateForm("targetSubjectId",""); fetchGuidances(lid); }} />
                                    )}
                                    {guidances.length > 0 && (
                                        <PillSelector label="Guidance" options={guidances} selected={form.targetGuidanceId}
                                            onSelect={gid => { updateForm("targetGuidanceId", gid); setSubjects([]); updateForm("targetSubjectId",""); fetchSubjects(gid); }} />
                                    )}
                                    {subjects.length > 0 && (
                                        <PillSelector label="Subject to explain" options={subjects} selected={form.targetSubjectId}
                                            onSelect={sid => updateForm("targetSubjectId", sid)} />
                                    )}
                                </>)}

                                {step === 3 && (<>
                                    {/* Guidelines */}
                                    <div className="rounded-[18px] bg-green/5 border border-green/15 p-5">
                                        <p className="flex items-center gap-2 text-green font-black text-xs uppercase tracking-widest mb-3">
                                            <Info size={13} /> Video Guidelines
                                        </p>
                                        <ul className="list-disc list-inside text-dark/55 text-sm font-medium space-y-1.5 leading-relaxed">
                                            <li>Record a ~15 minute demo lesson</li>
                                            <li>Start by explaining the topic clearly</li>
                                            <li>Include 2–3 exercises with corrections</li>
                                            <li>End with a brief summary</li>
                                            <li>MP4, WebM or MOV · max 500MB</li>
                                        </ul>
                                    </div>

                                    {/* Upload zone */}
                                    <label className="block cursor-pointer">
                                        <div className={`rounded-[22px] border-2 border-dashed p-10 text-center transition-all ${videoFile ? "border-green/40 bg-green/5" : "border-green/15 hover:border-green/30 hover:bg-green/5"}`}>
                                            {videoFile ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <CheckCircle size={40} className="text-green" />
                                                    <p className="font-black text-dark text-sm mt-1">{videoFile.name}</p>
                                                    <p className="text-xs text-dark/40 font-medium">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                                                    <p className="text-xs text-green font-bold mt-1">Click to change</p>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-14 h-14 rounded-[16px] bg-green/10 flex items-center justify-center mb-1">
                                                        <Upload size={24} className="text-green/50" />
                                                    </div>
                                                    <p className="font-black text-dark/60 text-sm">Upload your demo video</p>
                                                    <p className="text-xs text-dark/35 font-medium">MP4, WebM or MOV · max 500MB</p>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden"
                                            onChange={e => {
                                                const f = e.target.files?.[0];
                                                if (f) { if (f.size > 500 * 1024 * 1024) { showSnackbar("Video must be under 500MB", "error"); return; } setVideoFile(f); }
                                            }} />
                                    </label>
                                </>)}

                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-10 pt-6 border-t border-green/8">
                        <button
                            onClick={() => setStep(s => s - 1)}
                            disabled={step === 0}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border-[1.5px] border-green/15 text-dark/45 text-xs font-bold transition-all hover:border-green/30 hover:text-dark/70 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={14} /> Back
                        </button>
                        {step < STEPS.length - 1 ? (
                            <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                                className="flex items-center gap-2 px-6 py-3 bg-green text-white text-sm font-black rounded-[14px] hover:bg-green/90 transition-all shadow-md shadow-green/25 disabled:opacity-40 disabled:cursor-not-allowed">
                                Continue <ChevronRight size={15} />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={!canProceed() || submitting}
                                className="flex items-center gap-2 px-6 py-3 bg-green text-white text-sm font-black rounded-[14px] hover:bg-green/90 transition-all shadow-md shadow-green/25 disabled:opacity-40 disabled:cursor-not-allowed">
                                {submitting ? <><Loader2 size={15} className="animate-spin" /> Uploading…</> : "Submit Application"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Sub-components ─────────────────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="block text-[9px] font-black uppercase tracking-[0.18em] text-dark/40 mb-2">
            {children}
        </label>
    );
}

function IField({ label, icon: Icon, value, onChange, placeholder, type = "text" }: {
    label: string; icon: any; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
    return (
        <div>
            <FieldLabel>{label}</FieldLabel>
            <div className="relative">
                <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-green/45 pointer-events-none" />
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-green/5 border-[1.5px] border-green/15 focus:border-green focus:bg-white focus:ring-4 focus:ring-green/8 rounded-[13px] pl-10 pr-4 py-3.5 outline-none transition-all text-sm font-medium text-dark placeholder:text-dark/30"
                />
            </div>
        </div>
    );
}

function PillSelector({ label, options, selected, onSelect }: {
    label: string; options: any[]; selected: string; onSelect: (id: string) => void;
}) {
    return (
        <div>
            <FieldLabel>{label}</FieldLabel>
            <div className="flex flex-wrap gap-2">
                {options.map(o => {
                    const id = o._id || o.id;
                    return (
                        <button key={id} onClick={() => onSelect(id)}
                            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${selected === id ? "bg-green text-white border-green shadow-sm shadow-green/25" : "bg-green/6 border-green/15 text-dark/55 hover:bg-green/10 hover:border-green/25"}`}>
                            {o.title}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
