"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Play,
    Pause,
    FileText,
    ClipboardList,
    ArrowLeft,
    CheckCircle2,
    Clock,
    ChevronRight,
    ChevronLeft,
    PanelLeftClose,
    PanelLeftOpen,
    PanelRightClose,
    PanelRightOpen,
    Search,
    Heart,
    Book
} from "lucide-react";
import Link from "next/link";
import { getLessonById, getLessons } from "@/services/data";
import { trackResourceView, markResourceComplete, updateResourceProgress, toggleFavorite } from "@/services/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useTranslations, useLocale } from "next-intl";

export default function LessonPage() {
    const t = useTranslations("Lesson");
    const tc = useTranslations("Common");
    const { showSnackbar } = useSnackbar();
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const params = useParams();
    const lessonId = params.lessonId as string;
    const router = useRouter();
    const { user, checkAuth, getResourceURL } = useAuth();
    const [lesson, setLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [localCompletedResources, setLocalCompletedResources] = useState<string[]>([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isTimerRunning, setIsTimerRunning] = useState(true);
    const [nextLesson, setNextLesson] = useState<any>(null);

    useEffect(() => {
        const lessonProgress = user?.progress?.lessons?.find((l: any) => l.lessonId === (lesson?.id || lesson?._id));
        if (lessonProgress?.completedResources) {
            setLocalCompletedResources(lessonProgress.completedResources);
        }
        if (lessonProgress) {
            setIsFavorite(lessonProgress.isFavorite || false);
        }
    }, [user, lesson]);

    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        try {
            // YouTube
            if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
                const videoId = url.includes('youtube.com/watch')
                    ? new URLSearchParams(new URL(url).search).get('v')
                    : url.split('youtu.be/')[1]?.split('?')[0];
                return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
            }
            // Google Drive preview
            if (url.includes('drive.google.com/file/d/')) {
                const parts = url.split('/file/d/');
                if (parts.length > 1) {
                    const id = parts[1].split('/')[0];
                    return `https://drive.google.com/file/d/${id}/preview`;
                }
            }
            return url;
        } catch (e) {
            return url; // fallback
        }
    };
    const [activeResource, setActiveResource] = useState<any>(null);
    const [timer, setTimer] = useState(0);
    const timerRef = useRef(0);
    const lastSavedTimerRef = useRef(0);
    const activeResourceRef = useRef<any>(null);

    useEffect(() => {
        timerRef.current = timer;
    }, [timer]);

    useEffect(() => {
        activeResourceRef.current = activeResource;
    }, [activeResource]);

    useEffect(() => {
        if (lessonId) {
            fetchLesson();
        }
    }, [lessonId]);

    useEffect(() => {
        let interval: any;
        if (activeResource && isTimerRunning) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
            // Save progress when switching or leaving
            if (activeResourceRef.current && timerRef.current > lastSavedTimerRef.current && user) {
                const resourceToSave = activeResourceRef.current;
                const timeToSave = timerRef.current - lastSavedTimerRef.current;
                const safeResourceId = typeof btoa !== 'undefined' ? btoa(encodeURIComponent(resourceToSave.url)) : encodeURIComponent(resourceToSave.url);

                updateResourceProgress({
                    lessonId,
                    resourceId: safeResourceId,
                    additionalTimeSpent: timeToSave,
                    completionPercentage: 0
                }).catch(console.error);

                lastSavedTimerRef.current = timerRef.current;
            }
        };
    }, [activeResource, isTimerRunning, lessonId, user]);

    const fetchLesson = async () => {
        const res = await getLessonById(lessonId);
        setLesson(res);
        if (res) {
            const firstPdf = res.coursesPdf?.[0];
            const firstVideo = res.videos?.[0];
            const firstExercise = res.exercices?.[0];
            const firstExam = res.exams?.[0];
            const firstResource = res.resourses?.[0];

            if (firstPdf) handleSelectResource(firstPdf, 'pdf', res);
            else if (firstVideo) handleSelectResource(firstVideo, 'video', res);
            else if (firstExercise) handleSelectResource(firstExercise, 'exercise', res);
            else if (firstExam) handleSelectResource(firstExam, 'exam', res);
            else if (firstResource) handleSelectResource(firstResource, 'resource', res);

            // Fetch siblings to find the next lesson
            if (res.subjectId) {
                const siblings = await getLessons(res.subjectId);
                const currentIndex = siblings.findIndex(l => (l.id || (l as any)._id) === lessonId);
                if (currentIndex !== -1 && currentIndex < siblings.length - 1) {
                    setNextLesson(siblings[currentIndex + 1]);
                }
            }
        }
        setLoading(false);
    };

    const handleSelectResource = (resource: any, type: string, currentLesson: any = lesson) => {
        setActiveResource({ ...resource, type });
        setTimer(0);
        lastSavedTimerRef.current = 0;
        if (user) {
            const safeResourceId = resource.docId || (typeof btoa !== 'undefined' ? btoa(encodeURIComponent(resource.url)) : encodeURIComponent(resource.url));
            trackResourceView({
                lessonId,
                subjectId: currentLesson?.subjectId,
                resourceId: safeResourceId,
                resourceType: type
            });
        }
    };

    const handleMarkComplete = async () => {
        if (!activeResource) return;
        if (!user) {
            router.push('/signup');
            return;
        }

        const safeResourceId = activeResource.docId || (typeof btoa !== 'undefined' ? btoa(encodeURIComponent(activeResource.url)) : encodeURIComponent(activeResource.url));

        if (!localCompletedResources.includes(safeResourceId)) {
            setLocalCompletedResources(prev => [...prev, safeResourceId]);
        }

        try {
            await markResourceComplete({
                lessonId,
                subjectId: lesson?.subjectId,
                resourceId: safeResourceId,
                resourceType: activeResource.type,
                isCompleted: true
            });
            if (checkAuth) {
                checkAuth();
            }
        } catch (error) {
            console.error('Failed to mark complete:', error);
        }
    };

    const handleToggleFavorite = async () => {
        if (!user) return router.push('/signup');
        try {
            const newFavStatus = !isFavorite;
            setIsFavorite(newFavStatus);
            await toggleFavorite(lessonId, lesson?.subjectId);
            showSnackbar(newFavStatus ? "Added to favorites" : "Removed from favorites", "success");
            if (checkAuth) checkAuth();
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            setIsFavorite(!isFavorite);
            showSnackbar("Failed to update favorites", "error");
        }
    };

    if (loading) return (
        <div className="min-h-screen pt-32 px-6 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-green/20 border-t-green rounded-full animate-spin" />
                <p className="text-muted-foreground font-medium">{t("loading")}</p>
            </div>
        </div>
    );

    if (!lesson) return (
        <div className="min-h-screen pt-32 px-6 text-center">
            <h1 className="text-2xl font-bold">{t("not_found")}</h1>
            <Link href="/explore" className="text-green hover:underline">{t("return_explore")}</Link>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-white"
        >
            {/* Draggable Timer Overlay (Global/Fixed) */}
            <motion.div
                drag
                dragMomentum={false}
                dragElastic={0}
                whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
                initial={{ x: 0, y: 0 }}
                className="fixed top-24 left-8 z-[200] cursor-grab active:cursor-grabbing"
            >
                <div className="bg-dark/80 backdrop-blur-xl px-4 py-2.5 rounded-full text-white text-sm font-bold flex items-center gap-3 border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-2 pr-2 border-r border-white/10">
                        <Clock size={18} className={`text-green ${isTimerRunning ? 'animate-pulse' : ''}`} />
                        {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                    </div>
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsTimerRunning(!isTimerRunning);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${isTimerRunning ? 'hover:bg-red-500/20 text-white' : 'bg-green text-white shadow-lg shadow-green/20'}`}
                        title={isTimerRunning ? "Pause Timer" : "Start Timer"}
                    >
                        {isTimerRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    </button>
                </div>
            </motion.div>
            {/* Header */}
            <header className="bg-white border-b border-green/10 pt-32 pb-8 px-6 relative z-10">
                <div className={`max-w-7xl mx-auto flex flex-col ${isRTL ? 'md:flex-row-reverse' : 'md:flex-row'} md:items-center justify-between gap-4`}>
                    <div className="space-y-2">
                        <Link href="/explore" className={`text-sm font-medium text-green flex items-center gap-2 hover:${isRTL ? 'translate-x-1' : '-translate-x-1'} transition-transform ${isRTL ? 'flex-row-reverse' : ''}`}>
                            {isRTL ? <ChevronRight size={16} /> : <ArrowLeft size={16} />}
                            {t("back_subjects")}
                        </Link>
                        <div className={`flex flex-wrap items-center gap-4 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h1 className="text-3xl font-bold text-dark">{lesson.title}</h1>
                            <button
                                onClick={handleToggleFavorite}
                                className={`group flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all active:scale-95 border-2 ${isFavorite
                                    ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-500/20 hover:bg-red-600 hover:border-red-600'
                                    : 'bg-white border-green/20 text-green hover:border-green hover:bg-green/5'
                                    }`}
                                title={isFavorite ? t("fav_remove") : t("fav_add")}
                            >
                                <Heart
                                    size={20}
                                    className={`transition-transform duration-300 ${isFavorite ? "fill-current scale-110" : "group-hover:scale-110"}`}
                                />
                                <span>{isFavorite ? tc("saved") : tc("save")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className={`max-w-7xl mx-auto flex flex-col ${isRTL ? 'lg:flex-row-reverse' : 'lg:flex-row'} bg-white min-h-[calc(100vh-200px)] relative overflow-hidden`}>
                {/* Sidebar Toggle Button (Floating) */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`fixed bottom-8 ${isRTL ? 'right-8' : 'left-8'} z-[110] p-4 bg-green text-white rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 lg:hidden`}
                    title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                >
                    {isSidebarOpen ? <PanelRightClose size={24} /> : <PanelRightOpen size={24} />}
                </button>

                {/* Content Side */}
                <div className="flex-1 p-6 lg:p-12 transition-all duration-300">
                    <div className="aspect-video bg-dark rounded-3xl overflow-hidden shadow-2xl relative group">
                        {activeResource?.type === 'video' ? (
                            <iframe
                                src={getEmbedUrl(getResourceURL(activeResource.url) || '')}
                                className="w-full h-full"
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                        ) : activeResource?.type === 'pdf' || activeResource?.url?.endsWith('.pdf') ? (
                            <iframe
                                src={getEmbedUrl(getResourceURL(activeResource.url) || '')}
                                className="w-full h-full border-none"
                            />
                        ) : activeResource ? (
                            <iframe
                                src={getEmbedUrl(getResourceURL(activeResource.url) || '')}
                                className="w-full h-full border-none bg-white rounded-3xl"
                                allow="fullscreen"
                                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/50 space-y-4">
                                <FileText size={48} />
                                <p>{t("select_resource")}</p>
                            </div>
                        )}

                    </div>

                    <div className="mt-12 space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-dark">{t("resources_notes")}</h2>
                            <button
                                onClick={handleMarkComplete}
                                className="flex items-center gap-2 px-6 py-2.5 bg-green text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green/20 transition-all active:scale-95"
                            >
                                <CheckCircle2 size={20} />
                                {tc("mark_completed")}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Toggle Button (Desktop - Top Aligned) */}
                <div className="hidden lg:flex items-start pt-12">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`z-[110] p-2 bg-green/10 text-green ${isRTL ? 'rounded-r-xl border-y border-r' : 'rounded-l-xl border-y border-l'} border-green/10 hover:bg-green hover:text-white transition-all active:scale-95 shadow-sm`}
                        title={isSidebarOpen ? "Collapse Syllabus" : "Expand Syllabus"}
                    >
                        {isRTL
                            ? (isSidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />)
                            : (isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />)
                        }
                    </button>
                </div>

                {/* Sidebar */}
                <motion.aside
                    initial={false}
                    animate={{
                        width: isSidebarOpen ? (typeof window !== 'undefined' && window.innerWidth < 1024 ? '100vw' : '384px') : '0px',
                        opacity: isSidebarOpen ? 1 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`overflow-hidden border-${isRTL ? 'r' : 'l'} border-green/10 bg-green/5 shrink-0 ${!isSidebarOpen ? 'pointer-events-none' : ''}`}
                >
                    <div className={`p-6 space-y-8 min-w-[384px] ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-dark flex items-center gap-2">
                                <ClipboardList size={20} className="text-green" />
                                {t("syllabus")}
                            </h3>

                            {/* Progress Summary */}
                            {(() => {
                                const totalResources = (lesson.coursesPdf?.length ?? 0) + (lesson.videos?.length ?? 0) + (lesson.exercices?.length ?? 0) + (lesson.exams?.length ?? 0) + (lesson.resourses?.length ?? 0);
                                const completedCount = localCompletedResources.length;
                                const progressPct = totalResources > 0 ? Math.min(100, Math.round((completedCount / totalResources) * 100)) : 0;
                                const isFullyDone = progressPct === 100 && totalResources > 0;
                                if (totalResources === 0) return null;
                                return (
                                    <div className={`p-4 rounded-2xl border space-y-3 transition-colors ${isFullyDone ? 'bg-green/10 border-green/30' : 'bg-white border-green/10'}`}>
                                        <div className="flex items-center justify-between text-sm font-bold">
                                            <span className={isFullyDone ? 'text-green' : 'text-dark'}>
                                                {isFullyDone ? '🎉 All done!' : 'Your Progress'}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isFullyDone ? 'bg-green text-white' : 'bg-green/10 text-green'}`}>
                                                {progressPct}%
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-green/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${isFullyDone ? 'bg-green shadow-sm shadow-green/40' : 'bg-green/70'}`}
                                                style={{ width: `${progressPct}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {completedCount} of {totalResources} resources completed
                                        </p>
                                    </div>
                                );
                            })()}

                            <div className="space-y-4">
                                {/* Course PDF */}
                                {lesson.coursesPdf?.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("courses_pdf")}</h4>
                                        {lesson.coursesPdf.map((res: any, idx: number) => {
                                            const resourceUrl = getResourceURL(res.url) || res.url;
                                            const safeId = res.docId || (typeof btoa !== 'undefined' ? btoa(encodeURIComponent(resourceUrl)) : encodeURIComponent(resourceUrl));
                                            const isCompleted = localCompletedResources.includes(safeId);
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSelectResource(res, 'pdf')}
                                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${activeResource?.url === res.url ? 'bg-white border-green shadow-xl shadow-green/5' : 'bg-white/50 border-green/5 hover:bg-white hover:border-green/20'}`}
                                                >
                                                    <FileText className={activeResource?.url === res.url ? 'text-green' : 'text-muted-foreground'} size={20} />
                                                    <span className="font-semibold text-sm line-clamp-1 flex-1">{res.title}</span>
                                                    {isCompleted && <CheckCircle2 size={16} className="text-green ml-auto flex-shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Videos */}
                                {lesson.videos?.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("videos")}</h4>
                                        {lesson.videos.map((res: any, idx: number) => {
                                            const resourceUrl = getResourceURL(res.url) || res.url;
                                            const safeId = res.docId || (typeof btoa !== 'undefined' ? btoa(encodeURIComponent(resourceUrl)) : encodeURIComponent(resourceUrl));
                                            const isCompleted = localCompletedResources.includes(safeId);
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSelectResource(res, 'video')}
                                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${activeResource?.url === res.url ? 'bg-white border-green shadow-xl shadow-green/5' : 'bg-white/50 border-green/5 hover:bg-white hover:border-green/20'}`}
                                                >
                                                    <Play className={activeResource?.url === res.url ? 'text-green' : 'text-muted-foreground'} size={20} />
                                                    <span className="font-semibold text-sm line-clamp-1 flex-1">{res.title}</span>
                                                    {isCompleted && <CheckCircle2 size={16} className="text-green ml-auto flex-shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Exercises */}
                                {lesson.exercices?.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("exercises")}</h4>
                                        {lesson.exercices.map((res: any, idx: number) => {
                                            const resourceUrl = getResourceURL(res.url) || res.url;
                                            const safeId = res.docId || (typeof btoa !== 'undefined' ? btoa(encodeURIComponent(resourceUrl)) : encodeURIComponent(resourceUrl));
                                            const isCompleted = localCompletedResources.includes(safeId);
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSelectResource(res, 'exercise')}
                                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${activeResource?.url === res.url ? 'bg-white border-green shadow-xl shadow-green/5' : 'bg-white/50 border-green/5 hover:bg-white hover:border-green/20'}`}
                                                >
                                                    <ClipboardList className={activeResource?.url === res.url ? 'text-green' : 'text-muted-foreground'} size={20} />
                                                    <span className="font-semibold text-sm line-clamp-1 flex-1">{res.title}</span>
                                                    {isCompleted && <CheckCircle2 size={16} className="text-green ml-auto flex-shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Exams */}
                                {lesson.exams?.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("exams")}</h4>
                                        {lesson.exams.map((res: any, idx: number) => {
                                            const resourceUrl = getResourceURL(res.url) || res.url;
                                            const safeId = res.docId || (typeof btoa !== 'undefined' ? btoa(encodeURIComponent(resourceUrl)) : encodeURIComponent(resourceUrl));
                                            const isCompleted = localCompletedResources.includes(safeId);
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSelectResource(res, 'exam')}
                                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${activeResource?.url === res.url ? 'bg-white border-green shadow-xl shadow-green/5' : 'bg-white/50 border-green/5 hover:bg-white hover:border-green/20'}`}
                                                >
                                                    <FileText className={activeResource?.url === res.url ? 'text-green' : 'text-muted-foreground'} size={20} />
                                                    <span className="font-semibold text-sm line-clamp-1 flex-1">{res.title}</span>
                                                    {isCompleted && <CheckCircle2 size={16} className="text-green ml-auto flex-shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Additional Resources */}
                                {lesson.resourses?.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("resources")}</h4>
                                        {lesson.resourses.map((res: any, idx: number) => {
                                            const resourceUrl = getResourceURL(res.url) || res.url;
                                            const safeId = res.docId || (typeof btoa !== 'undefined' ? btoa(encodeURIComponent(resourceUrl)) : encodeURIComponent(resourceUrl));
                                            const isCompleted = localCompletedResources.includes(safeId);
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSelectResource(res, 'resource')}
                                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${activeResource?.url === res.url ? 'bg-white border-green shadow-xl shadow-green/5' : 'bg-white/50 border-green/5 hover:bg-white hover:border-green/20'}`}
                                                >
                                                    <Search className={activeResource?.url === res.url ? 'text-green' : 'text-muted-foreground'} size={20} />
                                                    <span className="font-semibold text-sm line-clamp-1 flex-1">{res.title}</span>
                                                    {isCompleted && <CheckCircle2 size={16} className="text-green ml-auto flex-shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {nextLesson && (
                            <div className="p-6 rounded-3xl bg-green text-white space-y-4 shadow-xl shadow-green/20">
                                <h4 className="font-bold">{t("next_lesson")}</h4>
                                <p className="text-white/80 text-sm">{nextLesson.title}</p>
                                <button
                                    onClick={() => router.push(`/lesson/${nextLesson.id || nextLesson._id}`)}
                                    className="w-full py-3 bg-white text-green font-bold rounded-xl hover:scale-[1.02] transition-transform"
                                >
                                    {t("continue_path")}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.aside>
            </div>
        </motion.div>
    );
}
