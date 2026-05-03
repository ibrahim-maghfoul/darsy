"use client";

import { useState, useEffect, useRef } from "react";
import { DarsyLoader } from "@/components/DarsyLoader";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Book,
    Clock,
    Settings as SettingsIcon,
    LogOut,
    ShieldAlert,
    ChevronRight,
    Heart,
    Camera,
    MessageCircle,
    CircleDashed,
    Loader2,
    CheckCircle,
    XCircle,
    Star,
    Plus,
    Calculator,
    Newspaper,
    CalendarDays,
    Share2,
    GraduationCap,
    Sparkles,
    UserPlus,
    MessageSquare,
    Trophy
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { getLessonById, getSubjects, getSchools, getLevels, getGuidances } from "@/services/data";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import ImageCropper from "@/components/ImageCropper";
import { useSnackbar } from "@/contexts/SnackbarContext";
import ProgressCharts from "@/components/profile/ProgressCharts";

export default function ProfilePage() {
    const t = useTranslations("Profile");
    const ts = useTranslations("Settings");
    const tc = useTranslations("Common");
    const locale = useLocale();
    const isAr = locale === 'ar';
    const { user, logout, loading: authLoading, checkAuth, getPhotoURL, getResourceURL } = useAuth();
    const [lastLesson, setLastLesson] = useState<any>(null);
    const [photoUploadStatus, setPhotoUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [cropImage, setCropImage] = useState<string | null>(null);
    const [isChangingPath, setIsChangingPath] = useState(false);
    const [guidanceTotalResources, setGuidanceTotalResources] = useState<number>(0);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [localSettings, setLocalSettings] = useState({ notifications: true, theme: 'system' as 'light' | 'dark' | 'system' });
    const [approvedApplication, setApprovedApplication] = useState<any>(null);
    const [instructorNames, setInstructorNames] = useState<{ guidance: string; subject: string }>({ guidance: '', subject: '' });
    const [teacherVerification, setTeacherVerification] = useState<any>(null);
    const [profileDataLoading, setProfileDataLoading] = useState(true);
    const [redirecting, setRedirecting] = useState(false);
    const [activeRoleTab, setActiveRoleTab] = useState<'instructor' | 'teacher'>('instructor');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchLastVisitedLesson();
            setProfileDataLoading(true);
            Promise.all([fetchApprovedApplication(), fetchTeacherVerification()])
                .finally(() => setProfileDataLoading(false));
            // Sync local settings state from user
            setLocalSettings({
                notifications: user.settings?.notifications ?? true,
                theme: user.settings?.theme ?? 'system',
            });
            // Fetch guidance total resources if path is set
            if (user.selectedPath?.guidanceId) {
                api.get(`/data/guidance-resources/${user.selectedPath.guidanceId}`)
                    .then(r => setGuidanceTotalResources(r.data?.total || 0))
                    .catch(() => {});
            }
        }
    }, [authLoading, user, router]);

    const fetchLastVisitedLesson = async () => {
        if (!user?.progress?.lessons?.length) return;
        const sorted = [...user.progress.lessons]
            .filter((l: any) => l.lastAccessed)
            .sort((a: any, b: any) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime());
        const latest = sorted[0];
        if (!latest?.lessonId) return;
        const lesson = await getLessonById(latest.lessonId);
        if (lesson) {
            setLastLesson({ ...lesson, progress: latest });
        }
    };

    const fetchApprovedApplication = async () => {
        try {
            const res = await api.get('/teacher/applications/me');
            const apps = res.data || [];
            const approved = apps.find((app: any) => app.status === 'approved');
            if (approved) {
                setApprovedApplication(approved);
                const [guidances, subjects] = await Promise.all([
                    getGuidances(approved.targetLevelId),
                    getSubjects(approved.targetGuidanceId),
                ]);
                const gId = String(approved.targetGuidanceId);
                const sId = String(approved.targetSubjectId);
                const guidance = guidances.find((g: any) => String(g._id) === gId || String(g.id) === gId);
                const subject = subjects.find((s: any) => String(s._id) === sId || String(s.id) === sId);
                setInstructorNames({
                    guidance: guidance?.title || '',
                    subject: subject?.title || '',
                });
            }
        } catch (err) {
            console.error('Failed to fetch applications', err);
        }
    };

    const fetchTeacherVerification = async () => {
        try {
            const res = await api.get('/teacher/verify/me');
            if (res.data?.status === 'approved') setTeacherVerification(res.data);
        } catch { }
    };

    const saveSettings = async (patch: Partial<typeof localSettings>) => {
        const updated = { ...localSettings, ...patch };
        setLocalSettings(updated);
        setSavingSettings(true);
        try {
            await api.patch('/user/profile', { settings: updated });
            showSnackbar("Settings saved", "success");
        } catch {
            showSnackbar("Failed to save settings", "error");
        } finally {
            setSavingSettings(false);
        }
    };

    useEffect(() => {
        if (profileDataLoading) return;
        const _isInstructor = user?.role === 'instructor' || user?.role === 'admin';
        const _isTeacher = user?.role === 'teacher' || user?.role === 'admin';
        const _showIns = _isInstructor || (_isTeacher && !!approvedApplication);
        const _showTea = _isTeacher || (_isInstructor && !!teacherVerification);
        if (_showIns && _showTea) {
            setRedirecting(true);
            router.replace('/instructor-dashboard');
            return;
        }
        if (_showIns) { setRedirecting(true); router.replace('/instructor-dashboard'); return; }
        if (_showTea) { setRedirecting(true); router.replace('/teacher/dashboard'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profileDataLoading]);

    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            setCropImage(ev.target?.result as string);
            setIsCropping(true);
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleCropSave = async (croppedBlob: Blob) => {
        setIsCropping(false);
        setPhotoPreview(URL.createObjectURL(croppedBlob));

        // Upload to backend
        setPhotoUploadStatus("uploading");
        setUploadProgress(0);
        try {
            const formData = new FormData();
            formData.append("photo", croppedBlob, "profile.jpg");
            await api.post("/user/profile/photo", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded / (progressEvent.total || 1)) * 100);
                    setUploadProgress(progress);
                }
            });
            await checkAuth(); // Refresh user data
            setPhotoUploadStatus("success");
            showSnackbar(t("photo_updated_success") || "Profile picture updated!", "success");
            setTimeout(() => {
                setPhotoUploadStatus("idle");
                setUploadProgress(0);
            }, 3000);
        } catch (err) {
            console.error("Photo upload failed:", err);
            setPhotoPreview(null);
            setPhotoUploadStatus("error");
            showSnackbar(t("photo_updated_error") || "Failed to upload photo", "error");
            setTimeout(() => {
                setPhotoUploadStatus("idle");
                setUploadProgress(0);
            }, 3000);
        }
    };

    const totalMinutes = user?.progress?.learningTime || 0;
    const timeHours = Math.floor(totalMinutes / 60);
    const timeMins = totalMinutes % 60;
    const timeDisplay = timeHours > 0
        ? `${timeHours}${t("hours_short")} ${timeMins}${t("minutes_short")}`
        : `${timeMins}${t("minutes_short")}`;

    const stats = [
        { label: t("lessons_started"), value: String(user?.progress?.lessons?.length || 0), icon: Book, color: "text-blue-500", bg: "bg-blue-50" },
        { label: t("time_learned"), value: timeDisplay, icon: Clock, color: "text-green", bg: "bg-green/10" },
        { label: t("points"), value: String(user?.points || 0), icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
    ];

    // Data for charts
    const timeHistory = user?.progress?.timeSpentHistory || [];
    const completedLessons = user?.progress?.completedLessons || 0;
    const viewedLessons = Math.max(0, (user?.progress?.lessons?.length || 0) - completedLessons);
    const totalLessons = user?.progress?.totalLessons || 0;

    const calculateCompletion = () => {
        if (!user) return 0;
        const fields = [
            user.displayName,
            user.nickname,
            user.age,
            user.city,
            user.phone,
            user.schoolName,
            user.email,
            user.level?.school,
            user.level?.level,
            user.level?.guidance,
            user.photoURL
        ];
        const filledFields = fields.filter(f => f && f !== "").length;
        return Math.round((filledFields / fields.length) * 100);
    };

    const profileCompletion = calculateCompletion();

    const suggestions = [
        { id: 'nickname', label: t("suggest_nickname"), done: !!user?.nickname },
        { id: 'age', label: t("suggest_age"), done: !!user?.age },
        { id: 'city', label: t("suggest_city"), done: !!user?.city },
        { id: 'path', label: t("suggest_path"), done: !!(user?.level?.school && user?.level?.level && user?.level?.guidance) },
        { id: 'photo', label: t("suggest_photo"), done: !!user?.photoURL },
        { id: 'school', label: t("suggest_school"), done: !!user?.schoolName },
        { id: 'phone', label: t("suggest_phone"), done: !!user?.phone },
    ].filter(s => !s.done);

    const currentPhoto = photoPreview || getPhotoURL(user?.photoURL);

    const isInstructor = user?.role === 'instructor' || user?.role === 'admin';
    const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
    const showInstructorSection = isInstructor || (isTeacher && !!approvedApplication);
    const showTeacherSection = isTeacher || (isInstructor && !!teacherVerification);
    const hasBothRoles = showInstructorSection && showTeacherSection;

    // While deciding whether to redirect, show a clean loading screen for role users
    if ((isInstructor || isTeacher) && (profileDataLoading || redirecting)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <DarsyLoader size={90} />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-h-screen bg-[#F8F9FA] pb-24 md:pb-0 pt-16 md:pt-32 px-0 md:px-8"
        >
            <AnimatePresence>
                {isChangingPath && (
                    <PathSelectionModal
                        userId={user?.id}
                        onClose={() => setIsChangingPath(false)}
                        onSuccess={() => {
                            setIsChangingPath(false);
                            checkAuth();
                            showSnackbar("Profile path updated successfully!", "success");
                        }}
                        t={t}
                    />
                )}
            </AnimatePresence>
            <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10 space-y-6">

                {/* ── Role Banners (Instructor / Teacher) ── */}
                {(showInstructorSection || showTeacherSection) && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-3"
                    >
                        {/* Tab switcher — only shown when user has both roles */}
                        {hasBothRoles && (
                            <div className="flex gap-2 p-1 bg-white rounded-2xl border border-green/10 shadow-sm w-fit">
                                <button
                                    onClick={() => setActiveRoleTab('instructor')}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${activeRoleTab === 'instructor' ? 'bg-green text-white shadow-md shadow-green/20' : 'text-dark/50 hover:text-dark/80'}`}
                                >
                                    <GraduationCap size={14} /> Instructor
                                </button>
                                <button
                                    onClick={() => setActiveRoleTab('teacher')}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${activeRoleTab === 'teacher' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-dark/50 hover:text-dark/80'}`}
                                >
                                    <MessageSquare size={14} /> Teacher
                                </button>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {/* Instructor Banner */}
                            {showInstructorSection && (!hasBothRoles || activeRoleTab === 'instructor') && (
                                <motion.div
                                    key="instructor"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.22 }}
                                    className="relative overflow-hidden rounded-[28px]"
                                    style={{ background: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 2px,transparent 2px,transparent 8px),linear-gradient(135deg,#1e7a46 0%,#0f4428 100%)' }}
                                >
                                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '18px 18px', opacity: 0.35 }} />
                                    <div className="relative z-10 p-6 md:p-8">
                                        <div className="flex items-start gap-4 mb-5">
                                            <div className="w-14 h-14 rounded-[16px] overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                                                {currentPhoto
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    ? <img src={currentPhoto} alt="" className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center"><GraduationCap size={28} className="text-white" /></div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.14em] text-green-300 bg-white/10 border border-white/15 rounded-full px-2.5 py-1 mb-1.5">
                                                    <GraduationCap size={10} /> INSTRUCTOR
                                                </span>
                                                <h2 className="text-lg font-black text-white leading-tight">{user?.displayName}</h2>
                                                {approvedApplication && (
                                                    <p className="text-sm text-white/50 line-clamp-1 mt-0.5">
                                                        {approvedApplication.specialist}{instructorNames.subject ? ` · ${instructorNames.subject}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Link href="/instructor-dashboard" className="inline-flex items-center gap-1.5 px-6 py-3 bg-white text-green font-black rounded-[14px] text-sm hover:bg-green/5 transition-colors shadow-md">
                                            <GraduationCap size={15} /> Go to Instructor Dashboard
                                        </Link>
                                    </div>
                                </motion.div>
                            )}

                            {/* Teacher Banner */}
                            {showTeacherSection && (!hasBothRoles || activeRoleTab === 'teacher') && (
                                <motion.div
                                    key="teacher"
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.22 }}
                                    className="relative overflow-hidden rounded-[28px]"
                                    style={{ background: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 2px,transparent 2px,transparent 8px),linear-gradient(135deg,#1e3a8a 0%,#0f2260 100%)' }}
                                >
                                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '18px 18px', opacity: 0.35 }} />
                                    <div className="relative z-10 p-6 md:p-8">
                                        <div className="flex items-start gap-4 mb-5">
                                            <div className="w-14 h-14 rounded-[16px] overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
                                                {currentPhoto
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    ? <img src={currentPhoto} alt="" className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center"><MessageSquare size={28} className="text-white" /></div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.14em] text-indigo-300 bg-white/10 border border-white/15 rounded-full px-2.5 py-1 mb-1.5">
                                                    <MessageSquare size={10} /> TEACHER
                                                </span>
                                                <h2 className="text-lg font-black text-white leading-tight">{user?.displayName}</h2>
                                                {teacherVerification && (
                                                    <p className="text-sm text-white/50 line-clamp-1 mt-0.5">
                                                        {teacherVerification.subject}{teacherVerification.schoolName ? ` · ${teacherVerification.schoolName}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Link href="/teacher/dashboard" className="inline-flex items-center gap-1.5 px-6 py-3 bg-white text-indigo-700 font-black rounded-[14px] text-sm hover:bg-indigo-50 transition-colors shadow-md">
                                            <MessageSquare size={15} /> Go to Teacher Dashboard
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* ── Student Profile Card ── */}
                <div>
                {/* Hero Section — desktop only */}
                <div className="md:bg-white md:rounded-[40px] md:border md:border-green/10 md:p-10 md:shadow-2xl md:shadow-green/5 p-0 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                            {/* Profile Picture with Upload */}
                            <div className="relative group">
                                <div
                                    className="relative group cursor-pointer w-32 h-32 md:w-40 md:h-40 flex-shrink-0"
                                    onClick={handlePhotoClick}
                                >
                                    <div className="absolute inset-x-2 -inset-y-3 bg-gradient-to-tr from-green/20 to-emerald-400/20 rounded-[3rem] -z-10 blur-2xl group-hover:blur-3xl transition-all duration-500" />
                                    {currentPhoto ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={currentPhoto}
                                            alt={user?.displayName}
                                            className="w-full h-full object-cover rounded-[3rem] border-4 border-green shadow-xl shadow-green/20 group-hover:scale-[1.02] bg-white transition-all duration-300 relative z-10"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-white border-4 border-green rounded-[3rem] flex items-center justify-center shadow-xl shadow-green/20 group-hover:scale-[1.02] transition-all duration-300 relative z-10">
                                            <User size={64} className="text-green" />
                                        </div>
                                    )}
                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[3rem]">
                                        <Camera size={32} className="text-white" />
                                    </div>

                                    {/* Premium Badge */}
                                    {(user?.subscription?.plan === 'premium' || user?.subscription?.plan === 'pro') && (
                                        <div className="absolute -top-1 -right-1 w-10 h-10 rounded-full bg-amber-400 border-[3px] border-white flex items-center justify-center shadow-lg pointer-events-none z-10" title="Premium Member">
                                            <Star size={20} className="text-white fill-current" />
                                        </div>
                                    )}
                                </div>

                                {/* Upload status badge */}
                                <AnimatePresence>
                                    {photoUploadStatus !== "idle" && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center shadow-xl
                                                            ${photoUploadStatus === "uploading" ? "bg-white border border-green/20" : ""}
                                                            ${photoUploadStatus === "success" ? "bg-green" : ""}
                                                            ${photoUploadStatus === "error" ? "bg-red-500" : ""}
                                                        `}
                                        >
                                            {photoUploadStatus === "uploading" && <Loader2 size={20} className="text-green animate-spin" />}
                                            {photoUploadStatus === "success" && <CheckCircle size={20} className="text-white" />}
                                            {photoUploadStatus === "error" && <XCircle size={20} className="text-white" />}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/gif"
                                    className="hidden"
                                    onChange={handlePhotoChange}
                                />

                                {/* Click hint */}
                                <div className="mt-3 space-y-2">
                                    <p className="text-xs text-center text-muted-foreground font-medium">
                                        {photoUploadStatus === "uploading" ? `${t("updating")} (${uploadProgress}%)` :
                                            photoUploadStatus === "success" ? `✓ ${t("updated")}` :
                                                photoUploadStatus === "error" ? t("upload_failed") :
                                                    t("click_to_change")}
                                    </p>
                                    {photoUploadStatus === "uploading" && (
                                        <div className="w-full h-1 bg-green/10 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${uploadProgress}%` }}
                                                className="h-full bg-green"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-center md:text-left space-y-3">
                                <div className="flex flex-col md:flex-row items-center md:items-center gap-2.5">
                                    <h1 className="text-4xl font-bold text-dark">{user?.displayName}</h1>
                                    {/* Plan badge */}
                                    {(() => {
                                        const plan = user?.subscription?.plan;
                                        if (plan === 'premium') return (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-amber-400 text-white shadow-md shadow-amber-200 shrink-0">
                                                <Star size={9} className="fill-white" /> Premium
                                            </span>
                                        );
                                        if (plan === 'pro') return (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-green text-white shadow-md shadow-green/30 shrink-0">
                                                <Star size={9} className="fill-white" /> Pro
                                            </span>
                                        );
                                        return (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-green/20 text-green/60 shrink-0">
                                                Free
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="flex flex-col items-center md:items-start gap-2">
                                    {user?.age && (
                                        <p className="text-muted-foreground flex items-center gap-2">
                                            <User size={16} className="text-green" />
                                            {user.age} yrs
                                        </p>
                                    )}
                                    {user?.gender && (
                                        <p className="text-muted-foreground flex items-center gap-2">
                                            <span className="text-green font-bold">{user.gender.toLowerCase() === 'male' ? '♂' : user.gender.toLowerCase() === 'female' ? '♀' : '⚧'}</span>
                                            {ts(user.gender.toLowerCase()) || user.gender}
                                        </p>
                                    )}
                                    <p className="text-muted-foreground flex items-center gap-2">
                                        <GraduationCap size={16} className="text-green" />
                                        {user?.level?.guidance || t("new_student")} • {user?.level?.level || t("onboarding_status")}
                                    </p>
                                    <button
                                        onClick={() => setIsChangingPath(true)}
                                        className="text-xs font-bold text-green hover:underline flex items-center gap-1 mt-1"
                                    >
                                        <ChevronRight size={14} className={isAr ? 'rotate-180' : ''} />
                                        {t("change_path") || "Change Path"}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 w-full md:w-auto mt-6 md:mt-0">
                            <Link href="/profile/chat" className="px-6 py-3 rounded-2xl bg-dark border border-gray-100/10 hover:border-green hover:shadow-lg hover:shadow-dark/20 transition-all text-white hover:text-green flex items-center justify-center gap-2 relative group font-bold">
                                <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                                {t("chat_room") || "Class Chat"}
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            </Link>
                            <button
                                onClick={() => setSettingsOpen(v => !v)}
                                className={`px-6 py-3 rounded-2xl border transition-all flex items-center justify-center gap-2 font-bold ${settingsOpen ? 'bg-green border-green text-white shadow-lg shadow-green/20' : 'bg-dark border-gray-100/10 hover:border-green hover:shadow-lg text-white hover:text-green'}`}
                            >
                                <SettingsIcon size={20} className={settingsOpen ? 'rotate-45 transition-transform duration-300' : 'transition-transform duration-300'} />
                                {t("settings") || "Settings"}
                            </button>
                        </div>
                    </div>



                    {/* Profile Completion */}
                    {profileCompletion < 100 && (
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        dir={isAr ? "rtl" : "ltr"}
                        className="rounded-[28px] relative overflow-hidden"
                        style={{ background: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 2px,transparent 2px,transparent 8px),linear-gradient(135deg,#1e7a46 0%,#0f4428 100%)' }}
                    >
                        {/* Dot grid texture — matches instructor banner */}
                        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '18px 18px', opacity: 0.35 }} />

                        {/* Header row */}
                        <div className="relative z-10 flex items-center gap-5 p-5 md:p-7">
                            {/* Progress ring */}
                            <div className="relative shrink-0">
                                <svg className="w-[68px] h-[68px] md:w-24 md:h-24 -rotate-90" viewBox="0 0 128 128" style={{ shapeRendering: "geometricPrecision" }}>
                                    {/* Track */}
                                    <circle cx="64" cy="64" r="54" stroke="white" strokeOpacity="0.12" strokeWidth="10" fill="transparent" strokeLinecap="round" />
                                    {/* Fill */}
                                    <motion.circle
                                        cx="64" cy="64" r="54"
                                        stroke="white" strokeWidth="10" fill="transparent"
                                        strokeDasharray={339.3}
                                        initial={{ strokeDashoffset: 339.3 }}
                                        animate={{ strokeDashoffset: 339.3 - (339.3 * profileCompletion) / 100 }}
                                        strokeLinecap="round"
                                        transition={{ duration: 1.1, ease: [0.34, 1.2, 0.64, 1] }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {profileCompletion === 100 ? (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.5 }}>
                                            <Star size={20} className="text-white fill-white" />
                                        </motion.div>
                                    ) : (
                                        <span className="text-base md:text-xl font-black text-white tabular-nums">{profileCompletion}%</span>
                                    )}
                                </div>
                            </div>

                            {/* Text */}
                            <div className={`flex-1 min-w-0 ${isAr ? "text-right" : "text-left"}`}>
                                <div className={`flex items-center gap-1.5 mb-1.5 ${isAr ? "flex-row-reverse" : ""}`}>
                                    {profileCompletion === 100
                                        ? <CheckCircle size={12} className="text-white/80 shrink-0" />
                                        : <CircleDashed size={12} className="text-white/80 shrink-0 animate-spin-slow" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                                        {profileCompletion === 100 ? t("completion_success_title") : t("completion_title")}
                                    </span>
                                </div>
                                <h3 className="text-base md:text-2xl font-black text-white leading-tight mb-1">
                                    {profileCompletion === 100
                                        ? <>{t.rich("completion_perfect", { green: (chunks) => <span className="text-green-200">{chunks}</span> })}</>
                                        : t("completion_almost_ready")}
                                </h3>
                                <p className="text-white/50 text-xs md:text-sm leading-snug line-clamp-2 font-medium">
                                    {profileCompletion === 100 ? t("completion_success_desc") : t("completion_desc")}
                                </p>
                            </div>
                        </div>

                        {/* Suggestions */}
                        {profileCompletion < 100 && suggestions.length > 0 && (
                            <div className="relative z-10 px-5 pb-5 md:px-7 md:pb-7 flex flex-col gap-1.5">
                                <div className="h-px bg-white/10 mb-2" />
                                {suggestions.map((suggestion, idx) => (
                                    <motion.button
                                        key={suggestion.id}
                                        initial={{ opacity: 0, x: isAr ? 12 : -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.15 + idx * 0.05, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                                        onClick={() => {
                                            if (suggestion.id === 'path') router.push('/onboarding');
                                            else if (suggestion.id === 'photo') handlePhotoClick();
                                            else router.push('/settings');
                                        }}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-[14px] bg-white/8 hover:bg-white/14 border border-white/10 hover:border-white/20 transition-all duration-200 group/btn ${isAr ? "flex-row-reverse text-right" : "text-left"}`}
                                    >
                                        <div className="w-6 h-6 rounded-[9px] bg-white/12 flex items-center justify-center text-white shrink-0 group-hover/btn:bg-white/20 group-hover/btn:scale-105 transition-all">
                                            <Plus size={13} />
                                        </div>
                                        <span className="text-sm font-semibold text-white/85 flex-1 truncate group-hover/btn:text-white transition-colors">{suggestion.label}</span>
                                        <ChevronRight size={13} className={`${isAr ? "rotate-180" : ""} text-white/25 group-hover/btn:text-white/70 group-hover/btn:translate-x-0.5 transition-all shrink-0`} />
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                    )}

                    {/* Progress Charts */}
                    <div>
                        <ProgressCharts
                            timeHistory={timeHistory}
                            completedLessons={completedLessons}
                            viewedLessons={viewedLessons}
                            totalLessons={totalLessons}
                            documentsOpened={user?.progress?.documentsOpened || 0}
                            completedResources={user?.progress?.lessons?.reduce((sum: number, l: any) => sum + (l.completedResources?.length || 0), 0) || 0}
                            totalResources={guidanceTotalResources || user?.totalGuidanceResources || user?.progress?.lessons?.reduce((sum: number, l: any) => sum + (l.totalResourcesCount || 0), 0) || totalLessons}
                        />
                    </div>

                    {/* Continue Learning Card */}
                    {lastLesson && (
                        <div className="space-y-3">
                            <h2 className="text-2xl font-black text-dark">{t("last_visited")}</h2>
                            {(() => {
                                const lessons = lastLesson;
                                const prog = lastLesson.progress;
                                const totalResources = (lessons.coursesPdf?.length ?? 0) + (lessons.videos?.length ?? 0) + (lessons.exercices?.length ?? 0) + (lessons.exams?.length ?? 0) + (lessons.resourses?.length ?? 0);
                                const completedCount = prog?.completedResources?.length ?? 0;
                                const progressPct = totalResources > 0 ? Math.min(100, Math.round((completedCount / totalResources) * 100)) : 0;
                                const lastDate = prog?.lastAccessed ? new Date(prog.lastAccessed).toLocaleDateString(locale, { month: 'short', day: 'numeric' }) : '';
                                return (
                                    <Link href={`/lesson/${prog.lessonId}`} className="continue-card group">
                                        {/* Icon header with dot texture */}
                                        <div
                                            className="relative overflow-hidden px-5 pt-5 pb-4 flex items-center justify-between gap-3"
                                            style={{ background: 'linear-gradient(135deg, #f0faf5 0%, #e8f5ee 100%)' }}
                                        >
                                            <div
                                                className="absolute inset-0 pointer-events-none"
                                                style={{ backgroundImage: 'radial-gradient(circle, rgba(58,170,106,0.15) 1px, transparent 1px)', backgroundSize: '14px 14px' }}
                                            />
                                            <div className="relative z-10 flex items-center gap-3 min-w-0">
                                                <div
                                                    className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0 text-green group-hover:scale-105 transition-transform"
                                                    style={{ background: 'rgba(58,170,106,0.1)' }}
                                                >
                                                    <Book size={22} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'rgba(58,170,106,0.5)' }}>{t("continue_learning")}</p>
                                                    <h3 className="font-bold text-dark text-base leading-tight line-clamp-1">{lessons.title}</h3>
                                                </div>
                                            </div>
                                            <div className="relative z-10 flex items-center gap-1.5 flex-shrink-0">
                                                {lastDate && <span className="text-[11px] font-semibold hidden sm:block" style={{ color: 'rgba(58,170,106,0.4)' }}>{lastDate}</span>}
                                                <ChevronRight size={15} className={`text-green/25 group-hover:text-green transition-colors ${isAr ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                        {/* Progress footer */}
                                        {totalResources > 0 && (
                                            <div className="px-5 py-3 flex items-center gap-3">
                                                <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(58,170,106,0.08)' }}>
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #3aaa6a, #5dc98a)', transition: 'width 0.7s cubic-bezier(0.34, 1.2, 0.64, 1)' }}
                                                    />
                                                </div>
                                                <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: 'rgba(58,170,106,0.5)' }}>{completedCount}/{totalResources}</span>
                                                {progressPct > 0 && <span className="text-[11px] font-black text-green">{progressPct}%</span>}
                                            </div>
                                        )}
                                    </Link>
                                );
                            })()}
                        </div>
                    )}

                    {/* Services Grid */}
                    {/* ── Darsy Programs (separated section) ── */}
                    <div className="pt-10 border-t border-green/8 space-y-4">
                        <div>
                            <h2 className="text-2xl font-black text-dark">Darsy Programs</h2>
                            <p className="text-sm mt-1" style={{ color: 'rgba(26,58,42,0.4)' }}>Two ways to share your knowledge with students.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Teacher Program */}
                            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                        <MessageSquare size={20} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-dark text-sm">Teacher</h4>
                                        <p className="text-[11px] text-indigo-500 font-bold">Real-time classroom chat</p>
                                    </div>
                                </div>
                                <p className="text-xs text-dark/50 leading-relaxed">
                                    Create private chat rooms for your students. Share files, answer questions live, and manage up to 50 students per room — all in real time.
                                </p>
                                {user?.role === 'teacher' || user?.role === 'admin' ? (
                                    <Link href="/teacher/dashboard" className="w-full py-2 bg-indigo-500 text-white font-bold rounded-xl text-xs text-center hover:bg-indigo-600 transition-colors">
                                        Go to Dashboard
                                    </Link>
                                ) : profileCompletion < 100 ? (
                                    <div className="w-full py-2 bg-indigo-100 text-indigo-300 font-bold rounded-xl text-xs text-center cursor-not-allowed">
                                        Complete profile first ({profileCompletion}%)
                                    </div>
                                ) : (
                                    <Link href="/apply-teacher" className="w-full py-2 bg-indigo-100 text-indigo-600 font-bold rounded-xl text-xs text-center hover:bg-indigo-200 transition-colors">
                                        Apply as Teacher
                                    </Link>
                                )}
                            </div>

                            {/* Instructor Program */}
                            <div className="rounded-2xl border border-green/20 bg-green/5 p-4 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green/15 flex items-center justify-center shrink-0">
                                        <GraduationCap size={20} className="text-green" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-dark text-sm">Instructor</h4>
                                        <p className="text-[11px] text-green font-bold">On-demand video courses</p>
                                    </div>
                                </div>
                                <p className="text-xs text-dark/50 leading-relaxed">
                                    Upload recorded video lessons and PDF documents. Students discover and watch your courses anytime. Best for structured, self-paced learning.
                                </p>
                                {user?.role === 'instructor' || user?.role === 'admin' ? (
                                    <Link href="/instructor-dashboard" className="w-full py-2 bg-green text-white font-bold rounded-xl text-xs text-center hover:bg-green/90 transition-colors">
                                        Go to Dashboard
                                    </Link>
                                ) : profileCompletion < 100 ? (
                                    <div className="w-full py-2 bg-green/10 text-green/40 font-bold rounded-xl text-xs text-center cursor-not-allowed">
                                        Complete profile first ({profileCompletion}%)
                                    </div>
                                ) : (
                                    <Link href="/apply-instructor" className="w-full py-2 bg-green/10 text-green font-bold rounded-xl text-xs text-center hover:bg-green/20 transition-colors">
                                        Apply as Instructor
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Services Grid ── */}
                    <div className="space-y-4 pt-10 border-t border-green/8">
                        <div>
                            <h2 className="text-2xl font-black text-dark">Services</h2>
                            <p className="text-sm mt-1" style={{ color: 'rgba(26,58,42,0.4)' }}>Access useful tools and services quickly.</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

                            {/* 1. Points System */}
                            <div className="svc-card">
                                <div className="svc-icon" style={{ background: 'rgba(251,191,36,0.1)', color: '#f59e0b' }}>
                                    <Star size={22} className="fill-amber-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark text-sm leading-tight">
                                        {(user?.points || 0).toLocaleString()}<span className="text-[11px] text-amber-500 ml-1">pts</span>
                                    </h4>
                                    <p className="text-xs mt-1" style={{ color: 'rgba(26,58,42,0.38)' }}>Points System</p>
                                </div>
                            </div>

                            {/* Rankings */}
                            <Link href="/rankings" className="svc-card">
                                <div className="svc-icon" style={{ background: 'rgba(251,191,36,0.1)', color: '#f59e0b' }}>
                                    <Trophy size={22} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark text-sm leading-tight">Rankings</h4>
                                    <p className="text-xs mt-1" style={{ color: 'rgba(26,58,42,0.38)' }}>Top students</p>
                                </div>
                            </Link>

                            {/* 2. Calendar */}
                            <Link href="/calendar" className="svc-card">
                                <div className="svc-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                    <CalendarDays size={22} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark text-sm leading-tight">Calendar</h4>
                                    <p className="text-xs mt-1" style={{ color: 'rgba(26,58,42,0.38)' }}>Schedule & events</p>
                                </div>
                            </Link>

                            {/* 3. Contributions Hub */}
                            <Link href="/contributions" className="svc-card">
                                <div className="svc-icon" style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
                                    <Sparkles size={22} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark text-sm leading-tight">Contributions</h4>
                                    <p className="text-xs mt-1" style={{ color: 'rgba(26,58,42,0.38)' }}>Help the community</p>
                                </div>
                            </Link>

                            {/* 4. Favorite Courses */}
                            <Link href="/favorites/courses" className="svc-card">
                                <div className="svc-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                    <Heart size={22} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark text-sm leading-tight">Favorites</h4>
                                    <p className="text-xs mt-1" style={{ color: 'rgba(26,58,42,0.38)' }}>Your saved lessons</p>
                                </div>
                            </Link>

                            {/* 7. Saved News */}
                            <Link href="/favorites/news" className="svc-card">
                                <div className="svc-icon" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                                    <Newspaper size={22} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark text-sm leading-tight">Saved News</h4>
                                    <p className="text-xs mt-1" style={{ color: 'rgba(26,58,42,0.38)' }}>Bookmarked articles</p>
                                </div>
                            </Link>

                            {/* 8. Grades Calculator */}
                            <Link href="/grades-calculator" className="svc-card">
                                <div className="svc-icon" style={{ background: 'rgba(251,191,36,0.1)', color: '#f59e0b' }}>
                                    <Calculator size={22} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark text-sm leading-tight">Grades Calc</h4>
                                    <p className="text-xs mt-1" style={{ color: 'rgba(26,58,42,0.38)' }}>Calculate your GPA</p>
                                </div>
                            </Link>

                            {/* 9. Invite Friends */}
                            <button
                                onClick={async () => {
                                    try {
                                        const res = await import('@/lib/api').then(m => m.default.get('/user/affiliate-code'));
                                        const code = res.data.affiliateCode;
                                        const link = `${window.location.origin}/signup?ref=${code}`;
                                        await navigator.clipboard.writeText(link);
                                        showSnackbar("✦ Invite link copied! Earn +100 pts when they register.", "success");
                                    } catch {
                                        showSnackbar("Failed to get your invite link", "error");
                                    }
                                }}
                                className="svc-card"
                            >
                                <div className="svc-icon" style={{ background: 'rgba(58,170,106,0.1)', color: '#3aaa6a' }}>
                                    <UserPlus size={22} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark text-sm leading-tight">Invite Friends</h4>
                                    <p className="text-xs mt-1" style={{ color: 'rgba(26,58,42,0.38)' }}>+100 pts/signup</p>
                                </div>
                            </button>

                            {/* 10. Share Darsy */}
                            <button
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({ title: 'Darsy', text: 'Check out Darsy — the ultimate education platform!', url: window.location.origin });
                                    } else {
                                        showSnackbar("Sharing not supported on this browser", "info");
                                    }
                                }}
                                className="svc-card"
                            >
                                <div className="svc-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                                    <Share2 size={22} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark text-sm leading-tight">Share Darsy</h4>
                                    <p className="text-xs mt-1" style={{ color: 'rgba(26,58,42,0.38)' }}>Spread the word</p>
                                </div>
                            </button>

                            {/* 11. Report Issue */}
                            <Link href="/report" className="svc-card">
                                <div className="svc-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                    <ShieldAlert size={22} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark text-sm leading-tight">Report Issue</h4>
                                    <p className="text-xs mt-1" style={{ color: 'rgba(26,58,42,0.38)' }}>Help us improve</p>
                                </div>
                            </Link>

                        </div>
                    </div>

                    {/* ── Inline Settings Panel ── */}
                    <AnimatePresence>
                        {settingsOpen && (
                            <motion.div
                                key="settings-panel"
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                                className="border-t border-green/8 pt-8 space-y-4"
                            >
                                <div>
                                    <h2 className="text-2xl font-black text-dark">Settings</h2>
                                    <p className="text-sm mt-1" style={{ color: 'rgba(26,58,42,0.4)' }}>Manage your account preferences.</p>
                                </div>
                                <div className="rounded-[20px] border border-green/10 divide-y divide-green/8 overflow-hidden bg-white shadow-sm">
                                    {/* Notifications toggle */}
                                    <div className="flex items-center justify-between px-5 py-4">
                                        <div>
                                            <p className="text-sm font-bold text-dark">Notifications</p>
                                            <p className="text-xs mt-0.5" style={{ color: 'rgba(26,58,42,0.4)' }}>Receive learning reminders and updates</p>
                                        </div>
                                        <button
                                            disabled={savingSettings}
                                            onClick={() => saveSettings({ notifications: !localSettings.notifications })}
                                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${localSettings.notifications ? 'bg-green' : 'bg-dark/15'} disabled:opacity-50`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${localSettings.notifications ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    {/* Theme selector */}
                                    <div className="px-5 py-4">
                                        <p className="text-sm font-bold text-dark mb-3">Theme</p>
                                        <div className="flex gap-2">
                                            {(['light', 'system', 'dark'] as const).map(t => (
                                                <button
                                                    key={t}
                                                    disabled={savingSettings}
                                                    onClick={() => saveSettings({ theme: t })}
                                                    className={`flex-1 py-2 rounded-[12px] text-xs font-black capitalize transition-all border disabled:opacity-50 ${localSettings.theme === t ? 'bg-green text-white border-green shadow-md shadow-green/20' : 'text-dark/50 border-green/15 hover:border-green/30'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Change password link */}
                                    <Link href="/settings/password" className="flex items-center justify-between px-5 py-4 hover:bg-green/3 transition-colors group">
                                        <div>
                                            <p className="text-sm font-bold text-dark">Change Password</p>
                                            <p className="text-xs mt-0.5" style={{ color: 'rgba(26,58,42,0.4)' }}>Update your account password</p>
                                        </div>
                                        <ChevronRight size={16} className="text-green/30 group-hover:text-green transition-colors" />
                                    </Link>
                                    {/* Delete account link */}
                                    <Link href="/settings/delete-account" className="flex items-center justify-between px-5 py-4 hover:bg-red-50/50 transition-colors group">
                                        <div>
                                            <p className="text-sm font-bold text-red-500">Delete Account</p>
                                            <p className="text-xs mt-0.5 text-red-400/70">Permanently remove your data</p>
                                        </div>
                                        <ChevronRight size={16} className="text-red-300 group-hover:text-red-500 transition-colors" />
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="pt-8 border-t border-green/6 flex flex-col items-center gap-3">
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(26,58,42,0.25)' }}>Account</p>
                        <button
                            onClick={logout}
                            className="group flex items-center gap-2.5 px-7 py-2.5 rounded-full border bg-white font-bold text-sm transition-all"
                            style={{ borderColor: 'rgba(239,68,68,0.2)', color: 'rgba(239,68,68,0.7)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.04)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.35)'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.2)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.7)'; }}
                        >
                            <LogOut size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                            {tc("sign_out")}
                        </button>
                    </div>
                </div>
                </div>{/* end Student Profile Card wrapper */}
            </div>{/* end max-w-5xl */}

            <AnimatePresence>
                {isCropping && cropImage && (
                    <ImageCropper
                        image={cropImage}
                        onClose={() => setIsCropping(false)}
                        onCropSave={handleCropSave}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}


interface PathSelectionModalProps {
    userId?: string;
    onClose: () => void;
    onSuccess: () => void;
    t: any;
}

function PathSelectionModal({ userId, onClose, onSuccess, t }: PathSelectionModalProps) {
    const [step, setStep] = useState(1);
    const [options, setOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selections, setSelections] = useState({
        schoolId: "",
        levelId: "",
        guidanceId: "",
    });

    useEffect(() => {
        fetchOptions();
    }, [step, selections.schoolId, selections.levelId]);

    const fetchOptions = async () => {
        setLoading(true);
        try {
            let res: any[] = [];
            if (step === 1) {
                res = await getSchools();
                // Priority Sort: Primaire -> Collège -> Lycée
                res.sort((a, b) => {
                    const priority = (t: string) => {
                        const l = t.toLowerCase();
                        if (l.includes('prim') || l.includes('ابتدا')) return 0;
                        if (l.includes('coll') || l.includes('إعدا')) return 1;
                        if (l.includes('lyc') || l.includes('ثانو')) return 2;
                        return 3;
                    };
                    return priority(a.title) - priority(b.title);
                });
            } else if (step === 2) {
                res = await getLevels(selections.schoolId);
            } else if (step === 3) {
                res = await getGuidances(selections.levelId);
            }
            setOptions(res);
        } catch (error) {
            console.error("Failed to fetch path options:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (id: string, title: string) => {
        if (step === 1) {
            setSelections(prev => ({ ...prev, schoolId: id, levelId: "", guidanceId: "" }));
            setStep(2);
        } else if (step === 2) {
            setSelections(prev => ({ ...prev, levelId: id, guidanceId: "" }));
            setStep(3);
        } else {
            setLoading(true);
            try {
                // Fetch full objects to get titles
                const allSchools = await getSchools();
                const school = allSchools.find((s: any) => s.id === selections.schoolId);
                const levels = await getLevels(selections.schoolId);
                const level = levels.find((l: any) => l.id === selections.levelId);
                const guidances = await getGuidances(selections.levelId);
                const guidance = guidances.find((g: any) => g.id === id);

                await api.patch('/user/profile', {
                    selectedPath: {
                        schoolId: selections.schoolId,
                        levelId: selections.levelId,
                        guidanceId: id
                    },
                    level: {
                        school: school?.title || "",
                        level: level?.title || "",
                        guidance: guidance?.title || ""
                    }
                });
                onSuccess();
            } catch (error) {
                console.error("Failed to update path:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[40px] p-8 md:p-10 shadow-2xl space-y-6 overflow-hidden"
            >
                <div className="space-y-1">
                    <h2 className="text-2xl font-black text-dark">
                        {step === 1 ? "Select School" : step === 2 ? "Select Level" : "Select Guidance"}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {step === 1 ? "Start by choosing your education system" :
                            step === 2 ? "Pick your current grade level" :
                                "Finally, select your specific branch or path"}
                    </p>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-16 bg-green/5 animate-pulse rounded-2xl" />
                        ))
                    ) : (
                        options.map((item: any) => (
                            <button
                                key={item.id}
                                onClick={() => handleSelect(item.id, item.title)}
                                className="w-full flex items-center justify-between p-5 rounded-2xl border border-green/10 hover:border-green hover:bg-green/5 transition-all text-left group"
                            >
                                <span className="font-bold text-dark/80 group-hover:text-green">{item.title}</span>
                                <ChevronRight size={18} className="text-green/20 group-hover:text-green group-hover:translate-x-1 transition-all" />
                            </button>
                        ))
                    )}
                </div>

                <div className="pt-4 flex items-center justify-between">
                    <button
                        onClick={step === 1 ? onClose : () => setStep(step - 1)}
                        className="text-sm font-bold text-muted-foreground hover:text-dark transition-colors"
                    >
                        {step === 1 ? "Cancel" : "Back"}
                    </button>
                    <div className="flex gap-1.5">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${step === i ? 'bg-green' : 'bg-green/10'}`} />
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
