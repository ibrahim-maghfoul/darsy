"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Play,
    Pause,
    FileText,
    ClipboardList,
    ArrowLeft,
    Send,
    CheckCircle2,
    Clock,
    ChevronRight,
    ChevronLeft,
    PanelRightClose,
    PanelRightOpen,
    Search,
    Heart,
    Sparkles,
    Loader2,
    ChevronDown,
    ChevronUp,
    Star,
    RefreshCw,
    Globe,
    BotMessageSquare,
} from "lucide-react";
import api from "@/lib/api";
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

    // AI explanation state
    const [aiAnswer, setAiAnswer] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiExpanded, setAiExpanded] = useState(false);
    const [aiDocId, setAiDocId] = useState<string | null>(null);
    const [aiLanguage, setAiLanguage] = useState<'fr' | 'ar' | 'en'>('fr');
    const [aiAvgRating, setAiAvgRating] = useState<number>(0);
    const [aiRatingCount, setAiRatingCount] = useState<number>(0);
    const [aiUserRating, setAiUserRating] = useState<number>(0);
    const [aiRatingLoading, setAiRatingLoading] = useState(false);
    const [aiRegenLoading, setAiRegenLoading] = useState(false);
    const [showProLangDialog, setShowProLangDialog] = useState(false);

    // Q&A state
    type QaMessage = { role: 'user' | 'ai'; text: string };
    const [qaMessages, setQaMessages] = useState<QaMessage[]>([]);
    const [qaInput, setQaInput] = useState('');
    const [qaLoading, setQaLoading] = useState(false);
    const qaBottomRef = useRef<HTMLDivElement>(null);

    // Draggable timer — starts centered at top under navbar
    const [timerPos, setTimerPos] = useState({ x: 0, y: 80 });
    const timerPosRef = useRef({ x: 0, y: 80 });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const cx = Math.max(0, (window.innerWidth / 2) - 80);
            setTimerPos({ x: cx, y: 108 });
            timerPosRef.current = { x: cx, y: 108 };
        }
    }, []);

    // Lock body scroll when upgrade dialog is open
    useEffect(() => {
        if (showProLangDialog) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [showProLangDialog]);
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

    // Reset AI answer + Q&A when switching to a different resource and auto-detect language
    useEffect(() => {
        const id = activeResource ? safeId(activeResource) : null;
        if (id !== aiDocId) {
            setAiAnswer(null);
            setAiError(null);
            setAiExpanded(false);
            setAiAvgRating(0);
            setAiRatingCount(0);
            setAiUserRating(0);
            setQaMessages([]);
            setQaInput('');
            // Auto-detect document language for all users (manual switching is still premium-gated in the UI)
            if (activeResource?.title) {
                const hasArabic = /[؀-ۿ]/.test(activeResource.title);
                setAiLanguage(hasArabic ? 'ar' : 'fr');
            }
        }
    }, [activeResource, aiDocId, user?.subscription?.plan]);

    const loadAiAnswer = useCallback(async (docId: string, lang: 'fr' | 'ar' | 'en', forceRegen = false) => {
        setAiLoading(true);
        setAiError(null);
        setAiDocId(docId);

        try {
            if (!forceRegen) {
                try {
                    const cached = await api.get(`/ai/answer/${encodeURIComponent(docId)}?lang=${lang}`);
                    setAiAnswer(cached.data.answer);
                    setAiAvgRating(cached.data.avgRating || 0);
                    setAiRatingCount(cached.data.ratingCount || 0);
                    setAiExpanded(true);
                    return;
                } catch {
                    // Not cached — generate
                }
            }

            const res = await api.post('/ai/explain', {
                docId,
                documentTitle: activeResource?.title || 'Document',
                lessonTitle: lesson?.title || '',
                documentUrl: activeResource?.url || '',
                language: lang,
                forceRegenerate: forceRegen,
            });
            setAiAnswer(res.data.answer);
            setAiAvgRating(res.data.avgRating || 0);
            setAiRatingCount(res.data.ratingCount || 0);
            setAiExpanded(true);
        } catch (err: any) {
            setAiError(err?.response?.data?.error || 'Failed to generate explanation. Please try again.');
        } finally {
            setAiLoading(false);
            setAiRegenLoading(false);
        }
    }, [activeResource, lesson?.title]);

    const handleGetAiExplanation = useCallback(async () => {
        if (!activeResource || !user) return;
        const docId = safeId(activeResource);

        // If already loaded for this doc+lang, just toggle expand
        if (aiDocId === docId && aiAnswer) {
            setAiExpanded(prev => !prev);
            return;
        }

        await loadAiAnswer(docId, aiLanguage);
    }, [activeResource, user, aiDocId, aiAnswer, aiLanguage, loadAiAnswer]);

    const handleSwitchLanguage = useCallback(async (lang: 'fr' | 'ar' | 'en') => {
        if (!activeResource || !user) return;
        setAiLanguage(lang);
        setAiAnswer(null);
        setAiExpanded(false);
        const docId = safeId(activeResource);
        await loadAiAnswer(docId, lang);
    }, [activeResource, user, loadAiAnswer]);

    const handleRegenerate = useCallback(async () => {
        if (!activeResource || !user) return;
        const docId = safeId(activeResource);
        setAiRegenLoading(true);
        setAiAnswer(null);
        await loadAiAnswer(docId, aiLanguage, true);
    }, [activeResource, user, aiLanguage, loadAiAnswer]);

    const handleRateAi = useCallback(async (rating: number) => {
        if (!activeResource || !user || aiRatingLoading) return;
        const docId = safeId(activeResource);
        setAiRatingLoading(true);
        setAiUserRating(rating);
        try {
            const res = await api.post(`/ai/rate/${encodeURIComponent(docId)}`, { rating, language: aiLanguage });
            setAiAvgRating(res.data.avgRating);
            setAiRatingCount(res.data.ratingCount);
        } catch (err: any) {
            setAiUserRating(0);
        } finally {
            setAiRatingLoading(false);
        }
    }, [activeResource, user, aiLanguage, aiRatingLoading]);

    const handleAskQuestion = useCallback(async () => {
        if (!activeResource || !user || !qaInput.trim() || qaLoading) return;
        const question = qaInput.trim();
        setQaInput('');
        setQaMessages(prev => [...prev, { role: 'user', text: question }]);
        setQaLoading(true);
        setTimeout(() => qaBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        try {
            const res = await api.post('/ai/ask', {
                docId: safeId(activeResource),
                documentTitle: activeResource?.title || 'Document',
                lessonTitle: lesson?.title || '',
                documentUrl: activeResource?.url || '',
                question,
                language: aiLanguage,
            });
            setQaMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
        } catch (err: any) {
            setQaMessages(prev => [...prev, { role: 'ai', text: err?.response?.data?.error || 'Failed to get an answer. Please try again.' }]);
        } finally {
            setQaLoading(false);
            setTimeout(() => qaBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
    }, [activeResource, user, qaInput, qaLoading, aiLanguage, lesson?.title]);

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
    // On mobile, PDF-type resources show an AI icon leading to the AI explain page.
    const renderResourceList = (items: any[], type: string, label: string, Icon: any) => {
        if (!items?.length) return null;
        const isPdfType = type === 'coursesPdf' || type === 'exercices' || type === 'exams' || type === 'resourses';
        return (
            <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</h4>
                {items.map((res: any, idx: number) => {
                    const id = safeId(res);
                    const isCompleted = localCompletedResources.includes(id);
                    const isActive = activeResource?.url === res.url;
                    const aiHref = `/lesson/${lessonId}/ai-explain?docId=${encodeURIComponent(id)}&title=${encodeURIComponent(res.title || '')}&url=${encodeURIComponent(res.url || '')}&lessonTitle=${encodeURIComponent(lesson?.title || '')}`;
                    return (
                        <div
                            key={idx}
                            className={`flex items-center gap-2 rounded-2xl border transition-all duration-150 ${isActive ? 'bg-white border-green shadow-xl shadow-green/5' : 'bg-white/50 border-green/5 hover:bg-white hover:border-green/20'}`}
                        >
                            <button
                                onClick={() => handleSelectResource(res, type)}
                                className="flex items-center gap-3 p-4 text-left flex-1 min-w-0"
                            >
                                <Icon className={isActive ? 'text-green' : 'text-muted-foreground'} size={20} />
                                <span className="font-semibold text-sm line-clamp-1 flex-1">{res.title}</span>
                                {user && isCompleted && <CheckCircle2 size={16} className="text-green flex-shrink-0" />}
                            </button>
                            {isPdfType && (
                                <Link
                                    href={aiHref}
                                    onClick={e => e.stopPropagation()}
                                    className="md:hidden shrink-0 mr-2 flex items-center justify-center w-9 h-9 rounded-[12px] bg-green/8 hover:bg-green/15 border border-green/12 transition-all active:scale-95"
                                    title="AI Explain"
                                >
                                    <BotMessageSquare size={16} className="text-green" />
                                </Link>
                            )}
                        </div>
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
        <>
        <div className="min-h-screen bg-white pb-20 md:pb-0 animate-slide-up">
            {/* Draggable Timer — isolated component to prevent full-page re-renders */}
            {user && (
                <div
                    className="fixed top-0 left-0 z-[200] hidden lg:block select-none"
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
                        <Link href="/explore" className={`hidden md:inline-flex btn-back ${isRTL ? 'rtl flex-row-reverse' : ''}`}>
                            {isRTL ? <ChevronRight size={14} className="btn-back-arrow" /> : <ArrowLeft size={14} className="btn-back-arrow" />}
                            {t("back_subjects")}
                        </Link>
                        <div className={`flex flex-wrap items-center gap-4 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <h1 className="text-3xl font-bold text-dark">{lesson.title}</h1>
                            <button
                                onClick={handleToggleFavorite}
                                className={`group inline-flex items-center gap-[7px] text-xs font-bold tracking-[0.02em] py-[7px] pr-[14px] pl-[11px] rounded-full border transition-all duration-200 active:scale-95 ${
                                    isFavorite
                                        ? 'text-red-500 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300'
                                        : 'text-green/50 border-green/15 bg-transparent hover:text-green hover:border-green/35 hover:bg-green/5'
                                }`}
                                title={isFavorite ? t("fav_remove") : t("fav_add")}
                            >
                                <Heart
                                    size={14}
                                    className={`transition-transform duration-200 group-hover:scale-110 flex-shrink-0 ${isFavorite ? "fill-red-500" : ""}`}
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
                    <div className="aspect-video bg-dark rounded-xl overflow-hidden shadow-2xl relative">
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
                                className="w-full h-full border-none bg-white"
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

                    <div className="mt-6 flex items-center justify-end">
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

                    {/* ── AI Explanation Section — only for non-video resources ── */}
                    {activeResource && activeResource.type !== 'video' && (() => {
                        const isPremium = user?.subscription?.plan === 'pro' || user?.subscription?.plan === 'premium';
                        const docId = safeId(activeResource);
                        const isCurrentDoc = aiDocId === docId;
                        const LANGS: { code: 'fr' | 'ar' | 'en'; label: string }[] = [
                            { code: 'fr', label: 'FR' },
                            { code: 'ar', label: 'AR' },
                            { code: 'en', label: 'EN' },
                        ];
                        return (
                            <div className="mt-6 rounded-2xl border border-green/15 bg-gradient-to-br from-green/5 to-emerald-50/60 overflow-hidden">
                                {/* Header row */}
                                <div className="p-5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-green flex-shrink-0 flex items-center justify-center shadow-md shadow-green/25">
                                            <Sparkles size={18} className="text-white" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-dark text-sm">AI Explanation</p>
                                            <p className="text-xs text-muted-foreground font-medium truncate">
                                                {aiLoading || aiRegenLoading ? 'Generating…' :
                                                    isCurrentDoc && aiAnswer ? 'Explanation ready — click to expand' :
                                                    user ? 'Get a detailed AI explanation of this document' : 'Sign in to use AI explanations'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {/* Main action button */}
                                        {user ? (
                                            <button
                                                onClick={handleGetAiExplanation}
                                                disabled={aiLoading || aiRegenLoading}
                                                className="flex items-center gap-2 px-4 py-2 bg-green text-white font-bold text-sm rounded-xl hover:bg-green/90 active:scale-95 transition-all shadow-md shadow-green/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {aiLoading ? (
                                                    <><Loader2 size={16} className="animate-spin" /> Generating…</>
                                                ) : isCurrentDoc && aiAnswer ? (
                                                    <>{aiExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />} {aiExpanded ? 'Hide' : 'Show'}</>
                                                ) : (
                                                    <><Sparkles size={16} /> Explain</>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => router.push('/login')}
                                                className="px-4 py-2 border border-green text-green font-bold text-sm rounded-xl hover:bg-green hover:text-white transition-all"
                                            >
                                                Sign in
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Language picker row — shown when no answer yet */}
                                {user && !(isCurrentDoc && aiAnswer) && !aiLoading && (
                                    <div className="px-5 pb-4 flex items-center gap-3">
                                        <Globe size={13} className="text-green/50 flex-shrink-0" />
                                        <span className="text-xs font-bold text-dark/40">Language:</span>
                                        <div className="flex items-center gap-1 bg-white/80 rounded-xl p-1 border border-green/10">
                                            {isPremium ? (
                                                LANGS.map(l => (
                                                    <button
                                                        key={l.code}
                                                        onClick={() => setAiLanguage(l.code)}
                                                        className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all ${aiLanguage === l.code ? 'bg-green text-white shadow-sm' : 'text-dark/40 hover:text-green'}`}
                                                    >
                                                        {l.label}
                                                    </button>
                                                ))
                                            ) : (
                                                <>
                                                    <div className={`px-3 py-1 rounded-lg text-[11px] font-black bg-green text-white shadow-sm`}>
                                                        {LANGS.find(l => l.code === 'fr')?.label || 'FR'}
                                                    </div>
                                                    {LANGS.filter(l => l.code !== 'fr').map(l => (
                                                        <button key={l.code} onClick={() => setShowProLangDialog(true)} className="flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-black text-dark/25 hover:text-amber-500 transition-colors" title="Upgrade to unlock">
                                                            {l.label}
                                                            <span className="text-[8px] bg-amber-100 text-amber-500 px-1 rounded-full font-black">PRO</span>
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Error */}
                                {aiError && (
                                    <div className="px-5 pb-5">
                                        <p className="text-sm text-red-500 font-medium bg-red-50 rounded-xl px-4 py-3 border border-red-100">{aiError}</p>
                                    </div>
                                )}

                                {/* Answer + rating */}
                                {aiExpanded && isCurrentDoc && aiAnswer && (
                                    <div className="px-5 pb-0 border-t border-green/10">
                                        <div className="mt-4 prose prose-sm max-w-none">
                                            {aiAnswer.split('\n').map((line, i) => {
                                                if (!line.trim()) return <br key={i} />;
                                                if (line.startsWith('**') && line.endsWith('**')) {
                                                    return <p key={i} className="font-black text-dark text-sm mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
                                                }
                                                if (/^\d+\.\s\*\*/.test(line)) {
                                                    return <p key={i} className="font-black text-dark text-sm mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
                                                }
                                                if (line.startsWith('- ') || line.startsWith('• ')) {
                                                    return <p key={i} className="text-sm text-dark/80 ml-4 leading-relaxed">• {line.slice(2)}</p>;
                                                }
                                                return <p key={i} className="text-sm text-dark/80 leading-relaxed">{line}</p>;
                                            })}
                                        </div>

                                        {/* Footer: rating + regen + attribution */}
                                        <div className="mt-5 pt-4 border-t border-green/10 flex items-center justify-between flex-wrap gap-3">
                                            {/* Rating stars */}
                                            {user && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-dark/50">Rate accuracy:</span>
                                                    <div className="flex items-center gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => handleRateAi(s)}
                                                                disabled={aiRatingLoading}
                                                                className="transition-transform hover:scale-125 active:scale-110 disabled:cursor-not-allowed"
                                                                aria-label={`Rate ${s} stars`}
                                                            >
                                                                <Star
                                                                    size={16}
                                                                    className={s <= (aiUserRating || 0) ? 'text-amber-400 fill-amber-400' : 'text-dark/20 hover:text-amber-300'}
                                                                />
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {aiRatingCount > 0 && (
                                                        <span className="text-xs text-muted-foreground font-medium">
                                                            {aiAvgRating.toFixed(1)} ({aiRatingCount})
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3 ml-auto">
                                                {/* Language switcher in answer footer */}
                                                {user && (
                                                    <div className="flex items-center gap-1 bg-white/70 rounded-lg p-0.5 border border-green/10">
                                                        {LANGS.map(l => (
                                                            isPremium ? (
                                                                <button
                                                                    key={l.code}
                                                                    onClick={() => handleSwitchLanguage(l.code)}
                                                                    className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all ${aiLanguage === l.code ? 'bg-green text-white' : 'text-dark/40 hover:text-green'}`}
                                                                >
                                                                    {l.label}
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    key={l.code}
                                                                    onClick={() => l.code !== 'fr' ? setShowProLangDialog(true) : undefined}
                                                                    className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all ${aiLanguage === l.code ? 'bg-green text-white' : l.code !== 'fr' ? 'text-dark/20 hover:text-amber-500' : 'text-dark/40 hover:text-green'}`}
                                                                >
                                                                    {l.label}{l.code !== 'fr' && <span className="ml-0.5 text-[7px] text-amber-400">✦</span>}
                                                                </button>
                                                            )
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Regenerate button */}
                                                {user && (
                                                    <button
                                                        onClick={handleRegenerate}
                                                        disabled={aiRegenLoading || aiLoading}
                                                        className="flex items-center gap-1.5 text-xs font-bold text-green/70 hover:text-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title={isPremium ? 'Regenerate explanation' : '1 free regeneration per day'}
                                                    >
                                                        <RefreshCw size={12} className={aiRegenLoading ? 'animate-spin' : ''} />
                                                        Regenerate {!isPremium && <span className="text-[9px] text-dark/30 font-medium">1/day</span>}
                                                    </button>
                                                )}
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Sparkles size={10} className="text-green" />
                                                    AI · Saved for all students
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Q&A — ask anything about this document */}
                                {user && (
                                    <div className="px-5 pb-5 border-t border-green/10 pt-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-5 h-5 rounded-lg bg-green/10 flex items-center justify-center flex-shrink-0">
                                                <Sparkles size={11} className="text-green" />
                                            </div>
                                            <p className="text-xs font-black text-dark/50 uppercase tracking-wider">Ask about this document</p>
                                        </div>

                                        {/* Messages thread */}
                                        {qaMessages.length > 0 && (
                                            <div className="mb-3 space-y-3 max-h-72 overflow-y-auto pr-1">
                                                {qaMessages.map((msg, i) => (
                                                    <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                                        <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5 ${msg.role === 'user' ? 'bg-green text-white' : 'bg-green/10 text-green'}`}>
                                                            {msg.role === 'user' ? 'Me' : <Sparkles size={11} />}
                                                        </div>
                                                        <div className={`flex-1 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-green/90 text-white rounded-tr-sm' : 'bg-white border border-green/10 text-dark/80 rounded-tl-sm'}`}>
                                                            {msg.text.split('\n').map((line, j) => (
                                                                <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br />}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                {qaLoading && (
                                                    <div className="flex gap-2.5">
                                                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center bg-green/10 text-green mt-0.5">
                                                            <Sparkles size={11} />
                                                        </div>
                                                        <div className="bg-white border border-green/10 rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 bg-green/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                            <span className="w-1.5 h-1.5 bg-green/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                            <span className="w-1.5 h-1.5 bg-green/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                        </div>
                                                    </div>
                                                )}
                                                <div ref={qaBottomRef} />
                                            </div>
                                        )}

                                        {/* Input row */}
                                        <div className="flex gap-2 items-end">
                                            <textarea
                                                value={qaInput}
                                                onChange={(e) => setQaInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskQuestion(); } }}
                                                placeholder="What don't you understand? Ask anything…"
                                                rows={1}
                                                className="flex-1 resize-none bg-white border border-green/15 rounded-2xl px-4 py-2.5 text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-green/40 focus:ring-1 focus:ring-green/20 transition-all leading-relaxed"
                                                style={{ minHeight: '42px', maxHeight: '120px' }}
                                                onInput={(e) => {
                                                    const t = e.target as HTMLTextAreaElement;
                                                    t.style.height = 'auto';
                                                    t.style.height = Math.min(t.scrollHeight, 120) + 'px';
                                                }}
                                            />
                                            <button
                                                onClick={handleAskQuestion}
                                                disabled={!qaInput.trim() || qaLoading}
                                                className="w-10 h-10 flex-shrink-0 bg-green text-white rounded-2xl flex items-center justify-center hover:bg-green/90 active:scale-95 transition-all shadow-md shadow-green/20 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                {qaLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                                            </button>
                                        </div>
                                        {qaMessages.length === 0 && (
                                            <p className="text-[10px] text-dark/30 font-medium mt-2 text-center">The AI reads the document to answer your specific questions</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
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

        {/* Pro Language Upgrade Dialog — rendered outside animated container so fixed positioning is viewport-relative */}
        {showProLangDialog && (
            <div
                className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowProLangDialog(false)}
            >
                <div
                    className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl shadow-black/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/25">
                        <Globe size={26} className="text-white" />
                    </div>
                    <h3 className="text-xl font-black text-dark text-center mb-2">Multi-Language AI</h3>
                    <p className="text-sm text-dark/55 text-center leading-relaxed mb-1">
                        Get AI explanations in <strong>Arabic</strong> and <strong>English</strong> with a Pro subscription.
                    </p>
                    <p className="text-xs text-dark/35 text-center mb-6">All free students get explanations in their document&apos;s language automatically.</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => { setShowProLangDialog(false); router.push('/pricing'); }}
                            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-amber-500/25 text-sm"
                        >
                            Upgrade to Pro — 100 MAD/mo
                        </button>
                        <button
                            onClick={() => setShowProLangDialog(false)}
                            className="w-full py-2.5 text-dark/40 font-bold text-sm hover:text-dark transition-colors"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
