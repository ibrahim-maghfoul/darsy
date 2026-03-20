"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User, Mail, GraduationCap, Briefcase, BookOpen, Video,
    ChevronRight, ChevronLeft, Upload, CheckCircle, Loader2, Info,
    Clock, AlertCircle, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import type { School, Level, Guidance, Subject } from "@/types";

interface FormData {
    fullName: string;
    email: string;
    age: string;
    studyBranch: string;
    studyLevel: string;
    specialist: string;
    currentStand: string;
    targetLevelId: string;
    targetGuidanceId: string;
    targetSubjectId: string;
}

const STEPS = [
    { title: "Personal Info", icon: User, desc: "Tell us about yourself" },
    { title: "Qualifications", icon: GraduationCap, desc: "Your academic background" },
    { title: "Choose Course", icon: BookOpen, desc: "What you want to teach" },
    { title: "Demo Video", icon: Video, desc: "Upload a 15-min lesson" },
];

const CURRENT_STAND_OPTIONS = [
    "Student", "Graduate", "Employed Teacher", "Freelance Tutor", "Professor", "Other"
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

    const [form, setForm] = useState<FormData>({
        fullName: "",
        email: "",
        age: "",
        studyBranch: "",
        studyLevel: "",
        specialist: "",
        currentStand: "",
        targetLevelId: "",
        targetGuidanceId: "",
        targetSubjectId: "",
    });

    // Curriculum data for step 3
    const [schools, setSchools] = useState<School[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [guidances, setGuidances] = useState<Guidance[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    // Check existing application + pre-fill
    useEffect(() => {
        if (!user) return;
        setForm(f => ({
            ...f,
            fullName: f.fullName || user.displayName || "",
            email: f.email || user.email || "",
        }));
        // If already an instructor, redirect to dashboard
        if (user.role === 'instructor') {
            router.push('/instructor-dashboard');
            return;
        }
        // Check for existing application
        api.get("/teacher/applications/me")
            .then(r => {
                const apps = r.data;
                if (apps && apps.length > 0) {
                    // Get the latest application
                    setExistingApp(apps[0]);
                }
            })
            .catch(() => {})
            .finally(() => setFetching(false));
    }, [user]);

    // Fetch schools on mount
    useEffect(() => {
        api.get("/data/schools").then(r => setSchools(r.data)).catch(() => {});
    }, []);

    const fetchLevels = async (schoolId: string) => {
        try {
            const res = await api.get(`/data/levels/${schoolId}`);
            setLevels(res.data);
        } catch { setLevels([]); }
    };

    const fetchGuidances = async (levelId: string) => {
        try {
            const res = await api.get(`/data/guidances/${levelId}`);
            setGuidances(res.data);
        } catch { setGuidances([]); }
    };

    const fetchSubjects = async (guidanceId: string) => {
        try {
            const res = await api.get(`/data/subjects/${guidanceId}`);
            setSubjects(res.data);
        } catch { setSubjects([]); }
    };

    const updateForm = (key: keyof FormData, value: string) => {
        setForm(f => ({ ...f, [key]: value }));
    };

    const [selectedSchool, setSelectedSchool] = useState("");

    const canProceed = () => {
        switch (step) {
            case 0: return form.fullName && form.email && form.age;
            case 1: return form.studyBranch && form.studyLevel && form.specialist && form.currentStand;
            case 2: return form.targetLevelId && form.targetGuidanceId && form.targetSubjectId;
            case 3: return videoFile !== null;
            default: return false;
        }
    };

    const handleSubmit = async () => {
        if (!user) {
            showSnackbar("Please log in first", "error");
            return;
        }
        if (!videoFile) {
            showSnackbar("Please upload your demo video", "error");
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            Object.entries(form).forEach(([key, val]) => formData.append(key, val));
            formData.append("video", videoFile);

            await api.post("/teacher/apply", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 300000, // 5 min for large video upload
            });

            setSubmitted(true);
            showSnackbar("Application submitted successfully!", "success");
        } catch (err: any) {
            showSnackbar(err?.response?.data?.error || "Failed to submit application", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4">
                <div className="text-center space-y-4 max-w-md">
                    <div className="w-16 h-16 bg-green/10 rounded-2xl mx-auto flex items-center justify-center">
                        <User size={32} className="text-green" />
                    </div>
                    <h2 className="text-xl font-bold text-dark">Sign in Required</h2>
                    <p className="text-dark/60">You need to sign in before applying to become an instructor.</p>
                    <button onClick={() => router.push("/login")} className="px-6 py-3 bg-green text-white rounded-xl font-bold">
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    if (fetching) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-green" size={36} />
            </div>
        );
    }

    // Show status card if application exists and is not rejected
    if (existingApp && existingApp.status !== 'rejected') {
        const cfg = existingApp.status === 'pending'
            ? { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', title: 'Application Under Review', desc: 'Your application and demo video are being reviewed by our team. This usually takes 3-5 business days.' }
            : { icon: ShieldCheck, color: 'text-green', bg: 'bg-green/10', border: 'border-green/30', title: 'Application Approved!', desc: 'You are now an instructor on Darsy. You can start uploading courses and teaching students online.' };
        const Icon = cfg.icon;

        return (
            <div className="min-h-screen bg-[#F8F9FA] pt-24 pb-16 flex items-center justify-center px-4">
                <div className={`max-w-md w-full bg-white rounded-3xl border ${cfg.border} shadow-xl p-8 text-center`}>
                    <div className={`w-16 h-16 ${cfg.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                        <Icon size={32} className={cfg.color} />
                    </div>
                    <h1 className="text-2xl font-bold text-dark mb-2">{cfg.title}</h1>
                    <p className="text-dark/60 text-sm mb-6">{cfg.desc}</p>

                    <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 text-left text-sm space-y-2 mb-6`}>
                        <div className="flex items-center justify-between">
                            <span className="text-dark/50">Name</span>
                            <span className="font-bold text-dark">{existingApp.fullName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-dark/50">Specialist</span>
                            <span className="font-bold text-dark">{existingApp.specialist}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-dark/50">Status</span>
                            <span className={`font-bold capitalize ${cfg.color}`}>{existingApp.status}</span>
                        </div>
                    </div>

                    {existingApp.status === 'approved' ? (
                        <Link href="/instructor-dashboard"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green text-white rounded-2xl font-bold hover:bg-green/80 transition-all w-full justify-center">
                            Go to Instructor Dashboard <ChevronRight size={18} />
                        </Link>
                    ) : (
                        <Link href="/profile"
                            className="inline-flex items-center gap-2 px-6 py-3 border border-green text-green rounded-2xl font-bold hover:bg-green/10 transition-all w-full justify-center">
                            Back to Profile
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-4 max-w-md"
                >
                    <div className="w-20 h-20 bg-green/10 rounded-full mx-auto flex items-center justify-center">
                        <CheckCircle size={40} className="text-green" />
                    </div>
                    <h2 className="text-2xl font-bold text-dark">Application Submitted!</h2>
                    <p className="text-dark/60">
                        Thank you for applying. Our team will review your demo video and get back to you via email.
                        This usually takes 3-5 business days.
                    </p>
                    <button onClick={() => router.push("/profile")} className="px-6 py-3 bg-green text-white rounded-xl font-bold">
                        Back to Profile
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] pt-24 md:pt-32 pb-32 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green/10 border border-green/20 rounded-full text-xs font-bold text-green mb-3">
                        Instructor Program
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-dark">Apply to Become an Instructor</h1>
                    <p className="text-dark/55 mt-2 text-sm">Upload recorded courses and teach students online on Darsy.</p>
                    <p className="text-dark/35 text-xs mt-1.5">
                        School teacher? Apply to the <a href="/apply-teacher" className="text-indigo-500 font-semibold hover:underline">Teacher Program</a> instead for class chat rooms.
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEPS.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <button
                                onClick={() => i < step && setStep(i)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                    i === step ? "bg-green text-white shadow-lg shadow-green/30" :
                                    i < step ? "bg-green/20 text-green" : "bg-gray-200 text-dark/30"
                                }`}
                            >
                                {i < step ? <CheckCircle size={18} /> : <s.icon size={18} />}
                            </button>
                            {i < STEPS.length - 1 && (
                                <div className={`w-6 md:w-12 h-0.5 rounded ${i < step ? "bg-green/40" : "bg-gray-200"}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Title */}
                <div className="text-center mb-6">
                    <h2 className="text-lg font-bold text-dark">{STEPS[step].title}</h2>
                    <p className="text-sm text-dark/50">{STEPS[step].desc}</p>
                </div>

                {/* Form Steps */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5"
                    >
                        {step === 0 && (
                            <>
                                <InputField label="Full Name" icon={User} value={form.fullName}
                                    onChange={v => updateForm("fullName", v)} placeholder="Your full name" />
                                <InputField label="Email" icon={Mail} value={form.email}
                                    onChange={v => updateForm("email", v)} placeholder="your@email.com" type="email" />
                                <InputField label="Age" icon={User} value={form.age}
                                    onChange={v => updateForm("age", v)} placeholder="e.g. 25" type="number" />
                            </>
                        )}

                        {step === 1 && (
                            <>
                                <InputField label="Study Branch" icon={GraduationCap} value={form.studyBranch}
                                    onChange={v => updateForm("studyBranch", v)} placeholder="e.g. Mathematics, Physics" />
                                <InputField label="Study Level" icon={GraduationCap} value={form.studyLevel}
                                    onChange={v => updateForm("studyLevel", v)} placeholder="e.g. Master's, PhD, Bachelor's" />
                                <InputField label="Specialist" icon={Briefcase} value={form.specialist}
                                    onChange={v => updateForm("specialist", v)} placeholder="e.g. Algebra, Organic Chemistry" />
                                <div>
                                    <label className="text-sm font-bold text-dark/70 mb-1.5 block">Current Stand</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CURRENT_STAND_OPTIONS.map(opt => (
                                            <button key={opt}
                                                onClick={() => updateForm("currentStand", opt)}
                                                className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                                    form.currentStand === opt
                                                        ? "bg-green/10 border-green text-green"
                                                        : "border-gray-200 text-dark/60 hover:border-green/30"
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                {/* School selector — pill buttons like the rest of the site */}
                                <div>
                                    <label className="text-sm font-bold text-dark/70 mb-1.5 block">School</label>
                                    <div className="flex flex-wrap gap-2">
                                        {schools.map(s => {
                                            const sid = (s as any)._id || s.id;
                                            return (
                                                <button key={sid}
                                                    onClick={() => {
                                                        setSelectedSchool(sid);
                                                        setLevels([]); setGuidances([]); setSubjects([]);
                                                        updateForm("targetLevelId", "");
                                                        updateForm("targetGuidanceId", "");
                                                        updateForm("targetSubjectId", "");
                                                        fetchLevels(sid);
                                                    }}
                                                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                                        selectedSchool === sid
                                                            ? "bg-green/10 border-green text-green"
                                                            : "border-gray-200 text-dark/60 hover:border-green/30"
                                                    }`}
                                                >
                                                    {s.title}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Level selector */}
                                {levels.length > 0 && (
                                    <div>
                                        <label className="text-sm font-bold text-dark/70 mb-1.5 block">
                                            Level you want to teach
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {levels.map(l => {
                                                const lid = (l as any)._id || l.id;
                                                return (
                                                    <button key={lid}
                                                        onClick={() => {
                                                            updateForm("targetLevelId", lid);
                                                            setGuidances([]); setSubjects([]);
                                                            updateForm("targetGuidanceId", "");
                                                            updateForm("targetSubjectId", "");
                                                            fetchGuidances(lid);
                                                        }}
                                                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                                            form.targetLevelId === lid
                                                                ? "bg-green/10 border-green text-green"
                                                                : "border-gray-200 text-dark/60 hover:border-green/30"
                                                        }`}
                                                    >
                                                        {l.title}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Guidance selector */}
                                {guidances.length > 0 && (
                                    <div>
                                        <label className="text-sm font-bold text-dark/70 mb-1.5 block">Guidance</label>
                                        <div className="flex flex-wrap gap-2">
                                            {guidances.map(g => {
                                                const gid = (g as any)._id || g.id;
                                                return (
                                                    <button key={gid}
                                                        onClick={() => {
                                                            updateForm("targetGuidanceId", gid);
                                                            setSubjects([]);
                                                            updateForm("targetSubjectId", "");
                                                            fetchSubjects(gid);
                                                        }}
                                                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                                            form.targetGuidanceId === gid
                                                                ? "bg-green/10 border-green text-green"
                                                                : "border-gray-200 text-dark/60 hover:border-green/30"
                                                        }`}
                                                    >
                                                        {g.title}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Subject selector */}
                                {subjects.length > 0 && (
                                    <div>
                                        <label className="text-sm font-bold text-dark/70 mb-1.5 block">
                                            Subject to explain
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {subjects.map(s => {
                                                const sid = (s as any)._id || s.id;
                                                return (
                                                    <button key={sid}
                                                        onClick={() => updateForm("targetSubjectId", sid)}
                                                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                                                            form.targetSubjectId === sid
                                                                ? "bg-green/10 border-green text-green"
                                                                : "border-gray-200 text-dark/60 hover:border-green/30"
                                                        }`}
                                                    >
                                                        {s.title}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {step === 3 && (
                            <>
                                {/* Tips */}
                                <div className="bg-green/5 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-green font-bold text-sm">
                                        <Info size={16} />
                                        Video Guidelines
                                    </div>
                                    <ul className="text-xs text-dark/60 space-y-1 ml-5 list-disc">
                                        <li>Record a ~15 minute demo lesson</li>
                                        <li>Start by explaining the lesson topic clearly</li>
                                        <li>Add 2-3 exercises with different difficulty levels</li>
                                        <li>Correct the exercises step by step</li>
                                        <li>End with a brief summary of key takeaways</li>
                                        <li>Accepted formats: MP4, WebM, MOV (max 500MB)</li>
                                    </ul>
                                </div>

                                {/* Upload area */}
                                <label className="block cursor-pointer">
                                    <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                                        videoFile ? "border-green bg-green/5" : "border-gray-200 hover:border-green/40"
                                    }`}>
                                        {videoFile ? (
                                            <div className="space-y-2">
                                                <CheckCircle size={32} className="text-green mx-auto" />
                                                <p className="font-bold text-dark text-sm">{videoFile.name}</p>
                                                <p className="text-xs text-dark/50">
                                                    {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                                                </p>
                                                <p className="text-xs text-green font-semibold">Click to change</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <Upload size={32} className="text-dark/30 mx-auto" />
                                                <p className="font-bold text-dark/60 text-sm">Upload your demo video</p>
                                                <p className="text-xs text-dark/40">MP4, WebM, or MOV up to 500MB</p>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="video/mp4,video/webm,video/quicktime"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 500 * 1024 * 1024) {
                                                    showSnackbar("Video must be under 500MB", "error");
                                                    return;
                                                }
                                                setVideoFile(file);
                                            }
                                        }}
                                    />
                                </label>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={() => setStep(s => s - 1)}
                        disabled={step === 0}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-dark/60 hover:text-dark disabled:opacity-30 disabled:pointer-events-none transition-all"
                    >
                        <ChevronLeft size={16} /> Back
                    </button>

                    {step < STEPS.length - 1 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={!canProceed()}
                            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-bold bg-green text-white shadow-lg shadow-green/20 disabled:opacity-40 disabled:shadow-none transition-all"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!canProceed() || submitting}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-green text-white shadow-lg shadow-green/20 disabled:opacity-40 disabled:shadow-none transition-all"
                        >
                            {submitting ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : "Submit Application"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function InputField({ label, icon: Icon, value, onChange, placeholder, type = "text" }: {
    label: string; icon: any; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
    return (
        <div>
            <label className="text-sm font-bold text-dark/70 mb-1.5 block">{label}</label>
            <div className="relative">
                <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30" />
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-dark text-sm focus:outline-none focus:border-green transition-colors"
                />
            </div>
        </div>
    );
}
