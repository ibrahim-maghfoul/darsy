"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
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
    PanelRightClose,
    PanelRightOpen,
    Search,
    Heart,
} from "lucide-react";
import Link from "next/link";
import { getLessonById, getLessons } from "@/services/data";
import { trackResourceView, markResourceComplete, updateResourceProgress, toggleFavorite } from "@/services/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useTranslations, useLocale } from "next-intl";

/** Timer display that only re-renders itself, not the whole page */
function TimerDisplay({ isRunning, onTick }: { isRunning: boolean; onTick?: (seconds: number) => void }) {
    const [seconds, setSeconds] = useState(0);
    const ref = useRef(0);
    const onTickRef = useRef(onTick);
    onTickRef.current = onTick;

    useEffect(() => {
        if (!isRunning) return;
        const id = setInterval(() => {
            ref.current += 1;
            setSeconds(ref.current);
            onTickRef.current?.(ref.current);
        }, 1000);
        return () => clearInterval(id);
    }, [isRunning]);

    return (
        <>
            <Clock size={18} className={`text-green ${isRunning ? 'animate-pulse' : ''}`} />
            {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
        </>
    );
}

/** Compute a safe resource ID */
function safeId(resource: any): string {
    return resource.docId || (typeof btoa !== 'undefined' ? btoa(encodeURIComponent(resource.url)) : encodeURIComponent(resource.url));
}

function getEmbedUrl(url: string): string {
    if (!url) return '';
    try {
        if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
            const videoId = url.includes('youtube.com/watch')
                ? new URLSearchParams(new URL(url).search).get('v')
                : url.split('youtu.be/')[1]?.split('?')[0];
            return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
        }
        if (url.includes('drive.google.com/file/d/')) {
            const parts = url.split('/file/d/');
            if (parts.length > 1) {
                const id = parts[1].split('/')[0];
                return `https://drive.google.com/file/d/${id}/preview`;
            }
        }
        return url;
    } catch {
        return url;
    }
}

export default function LessonPage() {
    const t = useTranslations("Lesson");
    const tc = useTranslations("Common");
    const { showSnackbar } = useSnackbar();
    const locale = useLocale();
    const isRTL = locale === 'ar';
    const params = useParams();
    const lessonId = params.lessonId as string;
    const router = useRouter();
    const { user, refreshUser, getResourceURL } = useAuth();
    const [lesson, setLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [localCompletedResources, setLocalCompletedResources] = useState<string[]>([]);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isTimerRunning, setIsTimerRunning] = useState(true);
    const [nextLesson, setNextLesson] = useState<any>(null);
    const [activeResource, setActiveResource] = useState<any>(null);

    // Draggable timer
    const [timerPos, setTimerPos] = useState({ x: 0, y: 0 });
    const timerPosRef = useRef({ x: 0, y: 0 });
    const startTimerDrag = (startX: number, startY: number) => {
        const offsetX = startX - timerPosRef.current.x;
        const offsetY = startY - timerPosRef.current.y;
        const onMove = (e: MouseEvent) => {
            const pos = { x: e.clientX - offsetX, y: e.clientY - offsetY };
            timerPosRef.current = pos;
            setTimerPos({ ...pos });
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };
    const startTimerTouchDrag = (startX: number, startY: number) => {
        const offsetX = startX - timerPosRef.current.x;
        const offsetY = startY - timerPosRef.current.y;
        const onMove = (e: TouchEvent) => {
            const touch = e.touches[0];
            const pos = { x: touch.clientX - offsetX, y: touch.clientY - offsetY };
            timerPosRef.current = pos;
            setTimerPos({ ...pos });
        };
        const onEnd = () => {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        };
        document.addEventListener('touchmove', onMove);
        document.addEventListener('touchend', onEnd);
    };

    // Sync completed resources from user progress
    useEffect(() => {
        const lessonProgress = user?.progress?.lessons?.find((l: any) => l.lessonId === (lesson?.id || lesson?._id));
        if (lessonProgress?.completedResources) {
            setLocalCompletedResources(prev => {
                const merged = new Set([...prev, ...lessonProgress.completedResources]);
                return Array.from(merged);
            });
        }
        if (lessonProgress) {
            setIsFavorite(lessonProgress.isFavorite || false);
        }
    }, [user, lesson]);

    // Fetch lesson data + siblings in parallel
    useEffect(() => {
        if (!lessonId) return;
        let cancelled = false;

        (async () => {
            const res = await getLessonById(lessonId);
            if (cancelled) return;
            setLesson(res);

            if (res) {
                // Auto-select first doc on desktop
                const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
                if (isDesktop) {
                    const firstType = res.coursesPdf?.length ? 'coursesPdf' : res.resourses?.length ? 'resourses' : res.exercices?.length ? 'exercices' : res.exams?.length ? 'exams' : res.videos?.length ? 'videos' : null;
                    const firstDoc = firstType ? res[firstType as keyof typeof res]?.[0] : null;
                    if (firstDoc && typeof firstDoc === 'object') {
                        setActiveResource({ ...(firstDoc as any), type: firstType });
                    }
                }

                // Fetch siblings for next lesson (non-blocking)
                if (res.subjectId) {
                    getLessons(res.subjectId).then(siblings => {
                        if (cancelled) return;
                        const currentIndex = siblings.findIndex(l => (l.id || (l as any)._id) === lessonId);
                        if (currentIndex !== -1 && currentIndex < siblings.length - 1) {
                            setNextLesson(siblings[currentIndex + 1]);
                        }
                    });
                }
            }
            setLoading(false);
        })();

        return () => { cancelled = true; };
    }, [lessonId]);

    // Progress save on unmount / resource switch — using refs to avoid re-renders
    const timerSecondsRef = useRef(0);
    const lastSavedRef = useRef(0);
    const activeResourceRef = useRef<any>(null);

    useEffect(() => { activeResourceRef.current = activeResource; }, [activeResource]);

    // Save progress periodically (every 30s) instead of on every timer tick
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            const resource = activeResourceRef.current;
            if (resource && timerSecondsRef.current > lastSavedRef.current) {
                const timeToSave = timerSecondsRef.current - lastSavedRef.current;
                updateResourceProgress({
                    lessonId,
                    subjectId: lesson?.subjectId || '',
                    resourceId: safeId(resource),
                    additionalTimeSpent: timeToSave,
                    completionPercentage: 0
                });
                lastSavedRef.current = timerSecondsRef.current;
            }
        }, 30_000);

        return () => {
            clearInterval(interval);
            // Save on unmount
            const resource = activeResourceRef.current;
            if (resource && timerSecondsRef.current > lastSavedRef.current) {
                updateResourceProgress({
                    lessonId,
                    subjectId: lesson?.subjectId || '',
                    resourceId: safeId(resource),
                    additionalTimeSpent: timerSecondsRef.current - lastSavedRef.current,
                    completionPercentage: 0
                });
            }
        };
    }, [lessonId, user, lesson?.subjectId]);

    const handleSelectResource = useCallback((resource: any, type: string) => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

        if (isMobile && resource.url) {
            window.open(resource.url, '_blank', 'noopener,noreferrer');
        } else {
            setActiveResource({ ...resource, type });
        }

        // Track view in background (fire-and-forget)
        if (user) {
            trackResourceView({
                lessonId,
                subjectId: lesson?.subjectId || '',
                resourceId: safeId(resource),
                resourceType: type
            });
            refreshUser(); // debounced — won't flood
        }
    }, [lessonId, user, lesson?.subjectId, refreshUser]);

    const handleMarkComplete = useCallback(async () => {
        if (!activeResource) return;
        if (!user) { router.push('/signup'); return; }

        const id = safeId(activeResource);
        if (!localCompletedResources.includes(id)) {
            setLocalCompletedResources(prev => [...prev, id]);
        }

        try {
            await markResourceComplete({
                lessonId,
                subjectId: lesson?.subjectId || '',
                resourceId: id,
                resourceType: activeResource.type,
                isCompleted: true
            });
            refreshUser();
        } catch (error) {
            console.error('Failed to mark complete:', error);
        }
    }, [activeResource, user, lessonId, lesson?.subjectId, localCompletedResources, refreshUser, router]);

    const handleToggleFavorite = useCallback(async () => {
        if (!user) return router.push('/signup');
        try {
            const newFavStatus = !isFavorite;
            setIsFavorite(newFavStatus);
            await toggleFavorite(lessonId, lesson?.subjectId);
            showSnackbar(newFavStatus ? "Added to favorites" : "Removed from favorites", "success");
            refreshUser();
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            setIsFavorite(!isFavorite);
            showSnackbar("Failed to update favorites", "error");
        }
    }, [user, isFavorite, lessonId, lesson?.subjectId, refreshUser, showSnackbar, router]);

    // Memoize the active resource's completed state
    const isActiveCompleted = useMemo(() => {
        if (!activeResource) return false;
        return localCompletedResources.includes(safeId(activeResource));
    }, [activeResource, localCompletedResources]);

    if (loading) return (
        <div className="min-h-screen px-6 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-green/20 border-t-green rounded-full animate-spin" />
                <p className="text-muted-foreground font-medium">{t("loading")}</p>
            </div>
        </div>
    );

    if (!lesson) return (
        <div className="min-h-screen px-6 text-center">
            <h1 className="text-2xl font-bold">{t("not_found")}</h1>
            <Link href="/explore" className="text-green hover:underline">{t("return_explore")}</Link>
        </div>
    );

    // Resource list renderer — avoids repeating the same JSX 5 times
    const renderResourceList = (items: any[], type: string, label: string, Icon: any) => {
        if (!items?.length) return null;
        return (
            <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</h4>
                {items.map((res: any, idx: number) => {
                    const id = safeId(res);
                    const isCompleted = localCompletedResources.includes(id);
                    const isActive = activeResource?.url === res.url;
                    return (
                        <button
                            key={idx}
                            onClick={() => handleSelectResource(res, type)}
                            className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-150 text-left ${isActive ? 'bg-white border-green shadow-xl shadow-green/5' : 'bg-white/50 border-green/5 hover:bg-white hover:border-green/20'}`}
                        >
                            <Icon className={isActive ? 'text-green' : 'text-muted-foreground'} size={20} />
                            <span className="font-semibold text-sm line-clamp-1 flex-1">{res.title}</span>
                            {user && isCompleted && <CheckCircle2 size={16} className="text-green ml-auto flex-shrink-0" />}
                        </button>
                    );
                })}
            </div>
        );
    };

    // Progress summary
    const totalResources = (lesson.coursesPdf?.length ?? 0) + (lesson.videos?.length ?? 0) + (lesson.exercices?.length ?? 0) + (lesson.exams?.length ?? 0) + (lesson.resourses?.length ?? 0);
    const completedCount = localCompletedResources.length;
    const progressPct = totalResources > 0 ? Math.min(100, Math.round((completedCount / totalResources) * 100)) : 0;
    const isFullyDone = progressPct === 100 && totalResources > 0;

    return (
        <div className="min-h-screen bg-white pb-20 md:pb-0 animate-slide-up">
            {/* Draggable Timer — isolated component to prevent full-page re-renders */}
            {user && (
                <div
                    className="fixed top-24 left-8 z-[200] hidden lg:block select-none"
                    style={{ transform: `translate(${timerPos.x}px, ${timerPos.y}px)`, cursor: 'grab' }}
                    onMouseDown={(e) => { e.preventDefault(); startTimerDrag(e.clientX, e.clientY); }}
                    onTouchStart={(e) => { startTimerTouchDrag(e.touches[0].clientX, e.touches[0].clientY); }}
                >
                    <div className="bg-dark/80 backdrop-blur-xl px-4 py-2.5 rounded-full text-white text-sm font-bold flex items-center gap-3 border border-white/10 shadow-2xl">
                        <div className="flex items-center gap-2 pr-2 border-r border-white/10">
                            <TimerDisplay isRunning={isTimerRunning} onTick={(s) => { timerSecondsRef.current = s; }} />
                        </div>
                        <button
                            onClick={() => setIsTimerRunning(!isTimerRunning)}
                            className={`p-1.5 rounded-lg transition-colors ${isTimerRunning ? 'hover:bg-red-500/20 text-white' : 'bg-green text-white shadow-lg shadow-green/20'}`}
                            title={isTimerRunning ? "Pause Timer" : "Start Timer"}
                        >
                            {isTimerRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b border-green/10 md:pt-32 pt-4 pb-4 md:pb-8 px-6 relative z-10">
                <div className={`max-w-7xl mx-auto flex flex-col ${isRTL ? 'md:flex-row-reverse' : 'md:flex-row'} md:items-center justify-between gap-4`}>
                    <div className="space-y-2">
                        <Link href="/explore" className={`hidden md:flex text-sm font-medium text-green items-center gap-2 hover:${isRTL ? 'translate-x-1' : '-translate-x-1'} transition-transform ${isRTL ? 'flex-row-reverse' : ''}`}>
                            {isRTL ? <ChevronRight size={16} /> : <ArrowLeft size={16} />}
                            {t("back_subjects")}
                        </Link>
                        <div className={`flex flex-wrap items-center gap-4 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h1 className="text-3xl font-bold text-dark">{lesson.title}</h1>
                            <button
                                onClick={handleToggleFavorite}
                                className={`group flex items-center gap-2 rounded-full font-bold text-sm transition-all duration-200 active:scale-95 hover:scale-105 shadow-lg ${isFavorite ? 'bg-red-500 text-white shadow-red-500/25' : 'bg-green text-white shadow-green/25'}`}
                                style={{ padding: '10px 20px' }}
                                title={isFavorite ? t("fav_remove") : t("fav_add")}
                            >
                                <Heart
                                    size={15}
                                    className={`transition-all duration-200 group-hover:scale-110 ${isFavorite ? "fill-current" : ""}`}
                                />
                                <span>{isFavorite ? tc("saved") : tc("save")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className={`max-w-7xl mx-auto flex flex-col ${isRTL ? 'lg:flex-row-reverse' : 'lg:flex-row'} bg-white min-h-[calc(100vh-200px)] relative overflow-hidden`}>
                {/* Mobile sidebar toggle */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`fixed bottom-8 ${isRTL ? 'right-8' : 'left-8'} z-[110] p-4 bg-green text-white rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 lg:hidden`}
                    title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                >
                    {isSidebarOpen ? <PanelRightClose size={24} /> : <PanelRightOpen size={24} />}
                </button>

                {/* Content viewer — desktop only */}
                <div className="flex-1 p-6 lg:p-12 transition-all duration-200 hidden lg:block">
                    <div className="aspect-video bg-dark rounded-3xl overflow-hidden shadow-2xl relative">
                        {activeResource?.type === 'video' ? (
                            <iframe
                                src={getEmbedUrl(getResourceURL(activeResource.url) || '')}
                                className="w-full h-full"
                                allowFullScreen
                                loading="lazy"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                        ) : activeResource ? (
                            <iframe
                                src={getEmbedUrl(getResourceURL(activeResource.url) || '')}
                                className="w-full h-full border-none bg-white rounded-3xl"
                                loading="lazy"
                                allowFullScreen
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-white/50 space-y-4">
                                <FileText size={48} />
                                <p>{t("select_resource")}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 flex items-center justify-end">
                        <button
                            disabled={isActiveCompleted}
                            onClick={handleMarkComplete}
                            className={`flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl transition-all ${isActiveCompleted
                                ? 'bg-green text-white cursor-default'
                                : 'bg-gray-200 text-gray-500 hover:bg-green hover:text-white hover:shadow-lg hover:shadow-green/20 active:scale-95'}`}
                        >
                            <CheckCircle2 size={20} />
                            {isActiveCompleted ? "Completed" : tc("mark_completed")}
                        </button>
                    </div>
                </div>

                {/* Desktop sidebar toggle */}
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

                {/* Sidebar — CSS transition instead of Framer Motion spring */}
                <aside
                    className={`overflow-hidden border-${isRTL ? 'r' : 'l'} border-green/10 bg-green/5 shrink-0 transition-all duration-300 ease-out
                        ${isSidebarOpen ? 'w-full lg:w-96 opacity-100' : 'w-0 opacity-0 pointer-events-none'}`}
                >
                    <div className={`p-6 space-y-8 min-w-[384px] ${isRTL ? 'text-right' : 'text-left'}`}>
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-dark flex items-center gap-2">
                                <ClipboardList size={20} className="text-green" />
                                {t("syllabus")}
                            </h3>

                            {/* Progress Summary */}
                            {user && totalResources > 0 && (
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
                                            className={`h-full rounded-full transition-all duration-500 ${isFullyDone ? 'bg-green shadow-sm shadow-green/40' : 'bg-green/70'}`}
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        {completedCount} of {totalResources} resources completed
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {renderResourceList(lesson.coursesPdf, 'pdf', t("courses_pdf"), FileText)}
                                {renderResourceList(lesson.videos, 'video', t("videos"), Play)}
                                {renderResourceList(lesson.exercices, 'exercise', t("exercises"), ClipboardList)}
                                {renderResourceList(lesson.exams, 'exam', t("exams"), FileText)}
                                {renderResourceList(lesson.resourses, 'resource', t("resources"), Search)}
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
                </aside>
            </div>
        </div>
    );
}
