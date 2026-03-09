"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    User,
    Book,
    Clock,
    Award,
    Settings as SettingsIcon,
    LogOut,
    Trash2,
    ShieldAlert,
    ChevronRight,
    ChevronLeft,
    Heart,
    Camera,
    MessageCircle,
    Info,
    CheckCircle2,
    CircleDashed,
    Loader2,
    CheckCircle,
    XCircle,
    Star,
    Plus,
    Upload,
    FileText,
    FileUp,
    FolderPlus,
    LayoutGrid,
    Briefcase,
    Calendar,
    HelpCircle,
    Share2,
    Database,
    GraduationCap
} from "lucide-react";
import { getSchoolServices } from "@/services/services";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { getUserFavorites } from "@/services/progress";
import { getLessonById, getSubjects, getLessons, getSchools, getLevels, getGuidances } from "@/services/data";
import { Subject, Lesson } from "@/types";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import NewsCard from "@/components/NewsCard";
import GradesCalculator from "@/components/GradesCalculator";
import ImageCropper from "@/components/ImageCropper";
import { useSnackbar } from "@/contexts/SnackbarContext";

export default function ProfilePage() {
    const t = useTranslations("Profile");
    const tc = useTranslations("Common");
    const locale = useLocale();
    const isAr = locale === 'ar';
    const { user, logout, loading: authLoading, checkAuth, getPhotoURL, getResourceURL } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [lastLesson, setLastLesson] = useState<any>(null);
    const [savedNews, setSavedNews] = useState([]);
    const [savedNewsPage, setSavedNewsPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [newsLoading, setNewsLoading] = useState(true);
    const [photoUploadStatus, setPhotoUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [cropImage, setCropImage] = useState<string | null>(null);
    const [isChangingPath, setIsChangingPath] = useState(false);

    // Resource Contribution State
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [selectedLesson, setSelectedLesson] = useState<string>("");
    const [newLessonTitle, setNewLessonTitle] = useState("");
    const [isAddingNewLesson, setIsAddingNewLesson] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploadingResource, setIsUploadingResource] = useState(false);
    const [resourceTitle, setResourceTitle] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const resourceInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/signup');
        } else if (user) {
            fetchFavorites();
            fetchSavedNews();
            fetchLastVisitedLesson();
            if (user.selectedPath?.guidanceId) {
                fetchSubjects(user.selectedPath.guidanceId);
            }
        }
    }, [authLoading, user, router]);

    const fetchSubjects = async (guidanceId: string) => {
        const data = await getSubjects(guidanceId);
        setSubjects(data);
    };

    const handleSubjectChange = async (subjectId: string) => {
        setSelectedSubject(subjectId);
        setSelectedLesson("");
        setLessons([]);
        if (subjectId) {
            const data = await getLessons(subjectId);
            setLessons(data);
        }
    };

    const fetchLastVisitedLesson = async () => {
        if (!user?.progress?.lessons?.length) return;
        const sorted = [...user.progress.lessons].sort(
            (a: any, b: any) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
        );
        const latest = sorted[0];
        if (!latest?.lessonId) return;
        const lesson = await getLessonById(latest.lessonId);
        if (lesson) {
            setLastLesson({ ...lesson, progress: latest });
        }
    };

    const fetchFavorites = async () => {
        const res = await getUserFavorites();
        setFavorites(res);
        setLoading(false);
    };

    const fetchSavedNews = async () => {
        try {
            const res = await api.get('/user/saved-news');
            setSavedNews(res.data || []);
        } catch (err) {
            console.error('Failed to fetch saved news', err);
        } finally {
            setNewsLoading(false);
        }
    };

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

    const handleResourceUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !selectedSubject || (!selectedLesson && !newLessonTitle) || !resourceTitle) {
            showSnackbar("Please fill all fields", "error");
            return;
        }

        setIsUploadingResource(true);
        try {
            const formData = new FormData();
            formData.append("resourceTitle", resourceTitle);
            formData.append("file", uploadFile);
            formData.append("subjectId", selectedSubject);

            if (isAddingNewLesson && newLessonTitle) {
                formData.append("newLessonTitle", newLessonTitle);
            } else {
                formData.append("lessonId", selectedLesson);
            }

            await api.post("/data/contribute", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            showSnackbar("Resource contributed successfully!", "success");
            setUploadFile(null);
            setResourceTitle("");
            setNewLessonTitle("");
            setIsAddingNewLesson(false);
            if (resourceInputRef.current) resourceInputRef.current.value = "";
        } catch (err) {
            console.error("Resource upload failed:", err);
            showSnackbar("Failed to upload resource", "error");
        } finally {
            setIsUploadingResource(false);
        }
    };

    const stats = [
        { label: t("lessons_started"), value: String(user?.progress?.lessons?.length || 0), icon: Book, color: "text-blue-500", bg: "bg-blue-50" },
        { label: t("time_learned"), value: timeDisplay, icon: Clock, color: "text-green", bg: "bg-green/10" },
        { label: t("points"), value: String(user?.points || 0), icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
    ];

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

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen bg-white pb-0"
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
            {/* Hero Section */}
            <div className="h-56 bg-green/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
            </div>

            <div className="max-w-5xl mx-auto px-6 -mt-24 relative z-10">
                <div className="bg-white rounded-[40px] border border-green/10 p-8 md:p-12 shadow-2xl shadow-green/5 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                            {/* Profile Picture with Upload */}
                            <div className="relative group">
                                <div
                                    className="w-40 h-40 rounded-[3rem] bg-green/5 border-4 border-white shadow-xl overflow-hidden cursor-pointer"
                                    onClick={handlePhotoClick}
                                >
                                    {currentPhoto ? (
                                        <img src={currentPhoto} alt={user?.displayName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-green/10 text-green">
                                            <User size={64} />
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

                            <div className="text-center md:text-left space-y-2">
                                <h1 className="text-4xl font-bold text-dark">{user?.displayName}</h1>
                                <div className="flex flex-col md:flex-row items-center md:items-end gap-3">
                                    <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                                        <GraduationCap size={18} className="text-green" />
                                        {user?.level?.guidance || t("new_student")} • {user?.level?.level || t("onboarding_status")}
                                    </p>
                                    <button
                                        onClick={() => setIsChangingPath(true)}
                                        className="text-xs font-bold text-green hover:underline flex items-center gap-1"
                                    >
                                        <ChevronRight size={14} className={isAr ? 'rotate-180' : ''} />
                                        {t("change_path") || "Change Path"}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/profile/chat" className="p-3 rounded-2xl bg-white border border-green/10 hover:border-green hover:shadow-lg hover:shadow-green/10 transition-all text-green flex items-center justify-center relative group">
                                <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            </Link>
                            <Link href="/settings" className="p-3 rounded-2xl bg-white border border-gray-100 hover:border-green hover:shadow-lg transition-all text-muted-foreground hover:text-green">
                                <SettingsIcon size={24} />
                            </Link>
                        </div>
                    </div>

                    {/* Continue Learning Card */}
                    {lastLesson && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-green/10 text-green flex items-center justify-center flex-shrink-0">
                                    <Book size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-dark">{t("last_visited")}</h2>
                                    <p className="text-xs text-muted-foreground">{t("last_visited_desc")}</p>
                                </div>
                            </div>
                            {(() => {
                                const lessons = lastLesson;
                                const prog = lastLesson.progress;
                                const totalResources = (lessons.coursesPdf?.length ?? 0) + (lessons.videos?.length ?? 0) + (lessons.exercices?.length ?? 0) + (lessons.exams?.length ?? 0) + (lessons.resourses?.length ?? 0);
                                const completedCount = prog?.completedResources?.length ?? 0;
                                const progressPct = totalResources > 0 ? Math.min(100, Math.round((completedCount / totalResources) * 100)) : 0;
                                const lastDate = prog?.lastAccessed ? new Date(prog.lastAccessed).toLocaleDateString(locale, { month: 'short', day: 'numeric' }) : '';
                                return (
                                    <Link
                                        href={`/lesson/${prog.lessonId}`}
                                        className="group flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-3xl border-2 border-green/20 bg-gradient-to-r from-green/5 to-white hover:border-green hover:shadow-xl hover:shadow-green/10 transition-all"
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-green/10 text-green flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <Book size={28} />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold uppercase tracking-widest text-green bg-green/10 px-2 py-0.5 rounded-full">{t("continue_learning")}</span>
                                                {lastDate && <span className="text-xs text-muted-foreground">{lastDate}</span>}
                                            </div>
                                            <h3 className="font-bold text-lg text-dark line-clamp-1">{lessons.title}</h3>
                                            {totalResources > 0 && (
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs font-semibold">
                                                        <span className="text-muted-foreground">{completedCount}/{totalResources} completed</span>
                                                        <span className="text-green font-bold">{progressPct}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-green/10 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight size={22} className={`text-green/30 group-hover:text-green flex-shrink-0 transition-colors ${isAr ? 'rotate-180' : ''}`} />
                                    </Link>
                                );
                            })()}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat, i) => (
                            <div key={i} className={`${stat.bg} p-8 rounded-[32px] space-y-2 group hover:scale-[1.02] transition-transform`}>
                                <div className={`${stat.color} flex justify-between items-start`}>
                                    <stat.icon size={28} />
                                    <span className="text-3xl font-black">{stat.value}</span>
                                </div>
                                <p className="text-dark/60 font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Profile Completion — Highly Prominent */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        dir={isAr ? "rtl" : "ltr"}
                        className={`bg-green/15 rounded-[40px] p-10 space-y-8 border-2 relative overflow-hidden group transition-all duration-500 ${profileCompletion === 100
                            ? "border-green/30"
                            : "border-green/10"
                            }`}
                    >
                        {/* Hexagon Hive Texture Overlay — perfect honeycomb hive */}
                        <div className="absolute inset-0 opacity-[0.2] pointer-events-none z-0"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='97' viewBox='0 0 56 97'%3E%3Cpath d='M28 64.6L0 48.45L0 16.15L28 0L56 16.15L56 48.45L28 64.6L28 97' fill='none' stroke='%2322C55E' stroke-width='0.5'/%3E%3C/svg%3E")`,
                                backgroundSize: '28px 48.5px',
                                backgroundRepeat: 'repeat'
                            }}
                        />

                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                            <div className={`space-y-4 text-center ${isAr ? "md:text-right" : "md:text-left"}`}>
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg transition-all duration-500 ${profileCompletion === 100 ? "bg-dark text-white shadow-dark/20" : "bg-green text-white shadow-green/20"
                                    }`}>
                                    {profileCompletion === 100 ? <CheckCircle size={14} /> : <CircleDashed size={14} className="animate-spin-slow" />}
                                    {profileCompletion === 100 ? t("completion_success_title") : t("completion_title")}
                                </div>
                                <h3 className="text-3xl font-black text-dark leading-tight">
                                    {profileCompletion === 100 ? (
                                        <>{t.rich("completion_perfect", { green: (chunks) => <span className="text-green">{chunks}</span> })}</>
                                    ) : (
                                        <span className="text-green">{t("completion_almost_ready")}</span>
                                    )}
                                </h3>
                                <p className="text-muted-foreground text-lg max-w-md">
                                    {profileCompletion === 100 ? t("completion_success_desc") : t("completion_desc")}
                                </p>
                            </div>

                            <div className="relative">
                                <svg className="w-32 h-32 transform -rotate-90">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="58"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        className="text-green/10"
                                    />
                                    <motion.circle
                                        cx="64"
                                        cy="64"
                                        r="58"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={364.4}
                                        initial={{ strokeDashoffset: 364.4 }}
                                        animate={{ strokeDashoffset: 364.4 - (364.4 * profileCompletion) / 100 }}
                                        strokeLinecap="round"
                                        className="text-green"
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {profileCompletion === 100 ? (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                                        >
                                            <Star size={32} className="text-green fill-green" />
                                        </motion.div>
                                    ) : (
                                        <span className="text-2xl font-black text-dark">{profileCompletion}%</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {profileCompletion < 100 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion.id}
                                        onClick={() => {
                                            if (suggestion.id === 'path') router.push('/onboarding');
                                            else if (suggestion.id === 'photo') handlePhotoClick();
                                            else router.push('/settings');
                                        }}
                                        className={`flex items-center gap-4 p-5 rounded-3xl bg-white/60 backdrop-blur-md border border-white hover:border-green hover:bg-white hover:shadow-xl hover:shadow-green/5 transition-all group/btn ${isAr ? "text-right" : "text-left"
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-2xl bg-green/5 flex items-center justify-center text-green group-hover/btn:scale-110 transition-transform">
                                            <Plus size={20} />
                                        </div>
                                        <span className="text-sm font-bold text-dark/80">{suggestion.label}</span>
                                        <ChevronRight size={18} className={`${isAr ? "mr-auto rotate-180" : "ml-auto"} text-green/20 group-hover/btn:text-green group-hover/btn:translate-x-1 transition-all`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Actions Grid */}
                    <div className="space-y-6 pt-8 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-green/10 text-green flex items-center justify-center flex-shrink-0">
                                <LayoutGrid size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-dark">{t("quick_actions") || "Quick Actions"}</h2>
                                <p className="text-sm text-muted-foreground">{t("quick_actions_desc") || "Access useful tools and services quickly."}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link href="/services" className="group p-6 rounded-[32px] bg-white border border-green/10 hover:border-green hover:shadow-xl hover:shadow-green/5 transition-all flex flex-col gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-green/10 text-green flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Database size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark">{t("services_info") || "Services & Info"}</h4>
                                    <p className="text-xs text-muted-foreground">{t("services_info_desc") || "Official info and resources"}</p>
                                </div>
                            </Link>

                            <button
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({
                                            title: 'Darsy',
                                            text: 'Check out Darsy - The ultimate education platform!',
                                            url: window.location.origin,
                                        });
                                    } else {
                                        showSnackbar("Sharing not supported on this browser", "info");
                                    }
                                }}
                                className="group p-6 rounded-[32px] bg-white border border-green/10 hover:border-green hover:shadow-xl hover:shadow-green/5 transition-all flex flex-col text-left gap-4"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Share2 size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark">{t("share_app") || "Share Darsy"}</h4>
                                    <p className="text-xs text-muted-foreground">{t("share_app_desc") || "Invite your friends"}</p>
                                </div>
                            </button>

                            <Link href="/report" className="group p-6 rounded-[32px] bg-white border border-green/10 hover:border-green hover:shadow-xl hover:shadow-green/5 transition-all flex flex-col gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ShieldAlert size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark">{t("report_issue") || "Report Issue"}</h4>
                                    <p className="text-xs text-muted-foreground">{t("report_issue_desc") || "Help us improve"}</p>
                                </div>
                            </Link>

                            <Link href="/about" className="group p-6 rounded-[32px] bg-white border border-green/10 hover:border-green hover:shadow-xl hover:shadow-green/5 transition-all flex flex-col gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <HelpCircle size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-dark">{t("about_us") || "About Us"}</h4>
                                    <p className="text-xs text-muted-foreground">{t("about_us_desc") || "Learn more about Darsy"}</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Grades Calculator — shown above favorites */}
                    <div className="space-y-6 pt-8 border-t border-gray-100">
                        <GradesCalculator />
                    </div>

                    {/* Contribute Resources Section */}
                    <div className="space-y-6 pt-8 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-green/10 text-green flex items-center justify-center flex-shrink-0">
                                <FileUp size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-dark">{t("contribute_title") || "Contribute Resources"}</h2>
                                <p className="text-sm text-muted-foreground">{t("contribute_desc") || "Share your PDF notes and materials with others."}</p>
                            </div>
                        </div>

                        <form onSubmit={handleResourceUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-green/5 p-6 rounded-[32px] border border-green/10">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-dark/60 ml-2">{t("select_subject") || "Subject"}</label>
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => handleSubjectChange(e.target.value)}
                                        className="w-full px-5 py-4 rounded-2xl bg-white border border-transparent focus:border-green outline-none transition-all font-medium appearance-none"
                                        required
                                    >
                                        <option value="">{t("choose_subject") || "Choose a subject..."}</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-dark/60 ml-2">{t("select_lesson") || "Lesson"}</label>
                                    <div className="flex flex-col gap-3">
                                        {!isAddingNewLesson ? (
                                            <div className="flex gap-2">
                                                <select
                                                    value={selectedLesson}
                                                    onChange={(e) => setSelectedLesson(e.target.value)}
                                                    className="flex-1 px-5 py-4 rounded-2xl bg-white border border-transparent focus:border-green outline-none transition-all font-medium appearance-none"
                                                    required={!isAddingNewLesson}
                                                    disabled={!selectedSubject}
                                                >
                                                    <option value="">{t("choose_lesson") || "Select existing lesson..."}</option>
                                                    {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddingNewLesson(true)}
                                                    className="p-4 bg-white border border-green/20 text-green rounded-2xl hover:bg-green hover:text-white transition-all shadow-sm"
                                                    title="Add New Lesson"
                                                >
                                                    <Plus size={24} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <FolderPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-green" size={20} />
                                                    <input
                                                        type="text"
                                                        placeholder={t("new_lesson_placeholder") || "Enter new lesson title..."}
                                                        value={newLessonTitle}
                                                        onChange={(e) => setNewLessonTitle(e.target.value)}
                                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-green focus:ring-4 focus:ring-green/5 outline-none transition-all font-medium"
                                                        required={isAddingNewLesson}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAddingNewLesson(false);
                                                        setNewLessonTitle("");
                                                    }}
                                                    className="p-4 bg-gray-100 text-dark/40 rounded-2xl hover:bg-gray-200 transition-all"
                                                >
                                                    <XCircle size={24} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-dark/60 ml-2">{t("resource_title_label") || "Resource Title"}</label>
                                    <div className="relative">
                                        <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-green" size={20} />
                                        <input
                                            type="text"
                                            placeholder={t("resource_title_placeholder") || "e.g. Summary Notes Chapter 1"}
                                            value={resourceTitle}
                                            onChange={(e) => setResourceTitle(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-transparent focus:border-green outline-none transition-all font-medium"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-dark/60 ml-2">{t("upload_file") || "Upload File (PDF/Image)"}</label>
                                    <div
                                        onClick={() => resourceInputRef.current?.click()}
                                        className="w-full h-[60px] cursor-pointer rounded-2xl bg-white border-2 border-dashed border-green/20 hover:border-green transition-all flex items-center justify-center gap-3 group px-4 overflow-hidden"
                                    >
                                        <Upload size={20} className="text-green group-hover:scale-110 transition-transform flex-shrink-0" />
                                        <span className="text-sm font-medium text-dark/60 truncate">
                                            {uploadFile ? uploadFile.name : (t("click_to_upload") || "Click to select PDF or Image")}
                                        </span>
                                        <input
                                            ref={resourceInputRef}
                                            type="file"
                                            accept="application/pdf,image/*"
                                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isUploadingResource || !uploadFile || !selectedSubject || (!selectedLesson && !newLessonTitle)}
                                    className="w-full py-4 bg-green text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-green/20 transition-all disabled:opacity-50"
                                >
                                    {isUploadingResource ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
                                    {isUploadingResource ? t("uploading") : (t("contribute_btn") || "Contribute Resource")}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Favorites Hub */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-dark flex items-center gap-2">
                                <Heart size={24} className="text-red-500 fill-red-500" />
                                {t("favorites_hub")}
                            </h2>
                            <Link href="/explore" className="text-green font-bold text-sm hover:underline">{t("explore_more")}</Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {loading ? (
                                Array(2).fill(0).map((_, i) => <div key={i} className="h-24 bg-green/5 animate-pulse rounded-2xl" />)
                            ) : favorites.length > 0 ? (
                                favorites.map((lesson: any) => (
                                    <Link key={lesson.lessonId} href={`/lesson/${lesson.lessonId}`} className="flex items-center justify-between p-5 rounded-3xl border border-green/10 hover:border-green hover:shadow-xl hover:shadow-green/5 transition-all bg-white group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-green/5 flex items-center justify-center text-green group-hover:scale-110 transition-transform">
                                                <Book size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-dark line-clamp-1">{lesson.lessonTitle || 'Saved Lesson'}</h4>
                                                <p className="text-xs text-muted-foreground">{lesson.subjectTitle || `Subject: ${lesson.subjectId}`}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-green/20 group-hover:text-green" />
                                    </Link>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-muted-foreground bg-green/5 rounded-3xl border border-dashed border-green/20">
                                    {t("no_favorites")}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8 pt-6 border-t border-gray-100">
                        <div className={`flex items-center justify-between ${isAr ? 'flex-row-reverse' : ''}`}>
                            <h2 className="text-2xl font-bold text-dark flex items-center gap-2">
                                <Heart size={24} className="text-green fill-green" />
                                {t("saved_news")}
                            </h2>
                            <Link href="/news" className="text-green font-bold text-sm hover:underline">{t("explore_more")}</Link>
                        </div>

                        <div className="relative">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={savedNewsPage}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 auto-rows-max justify-items-center"
                                >
                                    {savedNews.slice((savedNewsPage - 1) * 3, savedNewsPage * 3).map((item: any) => (
                                        <div key={item._id} className="flex justify-center w-full max-w-[340px]">
                                            <NewsCard
                                                title={item.title}
                                                subtitle={item.type || item.category}
                                                category={item.category || "General"}
                                                image={item.imageUrl || item.images?.[0]?.src || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=60'}
                                                href={`/news/${item._id}`}
                                                date={item.card_date || (item.date ? new Date(item.date).toLocaleDateString() : '')}
                                                readTime={item.readTime}
                                            />
                                        </div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>

                            {!newsLoading && savedNews.length === 0 && (
                                <div className="py-20 text-center text-muted-foreground bg-blue-50/50 rounded-3xl border border-dashed border-blue-200">
                                    {t("no_saved_news")}
                                </div>
                            )}
                        </div>

                        {savedNews.length > 3 && (
                            <div className={`flex justify-center items-center gap-4 pt-6 ${isAr ? 'flex-row-reverse' : ''}`}>
                                <button
                                    onClick={() => setSavedNewsPage(p => Math.max(1, p - 1))}
                                    disabled={savedNewsPage === 1}
                                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    {isAr ? <ChevronRight size={20} className="text-dark" /> : <ChevronLeft size={20} className="text-dark" />}
                                </button>
                                <div className={`flex gap-2 ${isAr ? 'flex-row-reverse' : ''}`}>
                                    {Array.from({ length: Math.ceil(savedNews.length / 3) }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSavedNewsPage(i + 1)}
                                            className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition-all ${savedNewsPage === i + 1
                                                ? 'bg-green text-white shadow-md'
                                                : 'bg-gray-100 text-dark hover:bg-green/20'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={() => setSavedNewsPage(p => Math.min(Math.ceil(savedNews.length / 3), p + 1))}
                                    disabled={savedNewsPage === Math.ceil(savedNews.length / 3)}
                                    className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                >
                                    {isAr ? <ChevronLeft size={20} className="text-dark" /> : <ChevronRight size={20} className="text-dark" />}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="pt-8 border-t border-gray-100 flex justify-center">
                        <button
                            onClick={logout}
                            className="px-12 py-4 bg-white border border-red-100 text-red-500 font-bold rounded-3xl hover:bg-red-50 transition-all flex items-center gap-3 shadow-xl shadow-red-500/5 group"
                        >
                            <LogOut size={24} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-lg">{tc("sign_out")}</span>
                        </button>
                    </div>
                </div>
            </div>

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
