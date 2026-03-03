"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getLessonById } from "@/services/data";
import type { Lesson, LessonResource } from "@/types";
import { FileText, Video, BookOpen, GraduationCap, ChevronLeft, ExternalLink, PanelLeftClose, PanelLeftOpen, Star, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toggleLessonFavorite, getLessonProgress, trackResourceView, markResourceComplete, updateLessonResourceCount } from "@/lib/firestore";
import { useProgressTracker } from "@/hooks/useProgressTracker";

type TabType = 'courses' | 'videos' | 'exercises' | 'exams' | 'resources';

export default function LessonPage() {
    const params = useParams();
    const lessonId = params.lessonId as string;
    const { user } = useAuth();

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('courses');
    const [selectedResource, setSelectedResource] = useState<LessonResource | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const [lessonProgress, setLessonProgress] = useState<any>(null);
    const [completedResources, setCompletedResources] = useState<Set<string>>(new Set());

    // Generate resource ID from title and URL
    const getResourceId = (resource: LessonResource) => {
        return `${resource.title}-${resource.url}`.replace(/[^a-zA-Z0-9]/g, '_');
    };

    // Get resource type from tab
    const getResourceType = (tab: TabType): 'pdf' | 'video' | 'exercise' | 'exam' | 'resource' => {
        if (tab === 'courses') return 'pdf';
        if (tab === 'videos') return 'video';
        if (tab === 'exercises') return 'exercise';
        if (tab === 'exams') return 'exam';
        return 'resource';
    };

    // Progress tracker for selected resource
    const progressTracker = useProgressTracker({
        lessonId,
        resourceId: selectedResource ? getResourceId(selectedResource) : '',
        resourceType: getResourceType(activeTab),
        autoTrack: !!selectedResource && !!user,
    });

    // Fetch lesson and progress
    useEffect(() => {
        async function fetch() {
            if (!lessonId) return;
            try {
                const data = await getLessonById(lessonId);
                setLesson(data);

                // Fetch user progress if logged in
                if (user && data) {
                    const progress = await getLessonProgress(user.id, lessonId);
                    setLessonProgress(progress);
                    setIsFavorite(progress?.isFavorite || false);

                    // Extract completed resources
                    if (progress?.resources) {
                        const completed = new Set(
                            Object.entries(progress.resources)
                                .filter(([_, res]: [string, any]) => res.isCompleted)
                                .map(([id]) => id)
                        );
                        setCompletedResources(completed);
                    }

                    // Update total resource count
                    const totalCount = (
                        (data.coursesPdf?.length || 0) +
                        (data.videos?.length || 0) +
                        (data.exercices?.length || 0) +
                        (data.exams?.length || 0) +
                        (data.resourses?.length || 0)
                    );
                    await updateLessonResourceCount(user.id, lessonId, data.subjectId, totalCount);
                }

                // Set initial active tab based on available content
                if (data) {
                    if (data.coursesPdf?.length) setActiveTab('courses');
                    else if (data.videos?.length) setActiveTab('videos');
                    else if (data.exercices?.length) setActiveTab('exercises');
                    else if (data.exams?.length) setActiveTab('exams');
                    else if (data.resourses?.length) setActiveTab('resources');
                }
            } catch (error) {
                console.error("Failed to fetch lesson", error);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, [lessonId, user]);

    // Track resource view when selected
    useEffect(() => {
        if (selectedResource && user && lesson) {
            const resourceId = getResourceId(selectedResource);
            trackResourceView(
                user.id,
                lessonId,
                lesson.subjectId,
                resourceId,
                getResourceType(activeTab)
            );
        }
    }, [selectedResource, user, lesson, activeTab]);

    // Handle favorite toggle
    const handleToggleFavorite = async () => {
        if (!user || !lesson) return;
        try {
            const newStatus = await toggleLessonFavorite(user.id, lessonId, lesson.subjectId);
            setIsFavorite(newStatus);
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    };

    // Handle mark as complete
    const handleMarkComplete = async (resource: LessonResource, isComplete: boolean) => {
        if (!user || !lesson) return;
        try {
            const resourceId = getResourceId(resource);
            await markResourceComplete(
                user.id,
                lessonId,
                lesson.subjectId,
                resourceId,
                getResourceType(activeTab),
                isComplete
            );

            setCompletedResources(prev => {
                const newSet = new Set(prev);
                if (isComplete) {
                    newSet.add(resourceId);
                } else {
                    newSet.delete(resourceId);
                }
                return newSet;
            });
        } catch (error) {
            console.error('Failed to mark as complete:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">Lesson not found</h2>
                <Link href="/explore" className="text-purple-600 hover:underline mt-4 block">Back to Explore</Link>
            </div>
        );
    }

    const tabs = [
        { id: 'courses', label: 'Courses', icon: FileText, count: lesson.coursesPdf?.length || 0 },
        { id: 'videos', label: 'Videos', icon: Video, count: lesson.videos?.length || 0 },
        { id: 'exercises', label: 'Exercises', icon: BookOpen, count: lesson.exercices?.length || 0 },
        { id: 'exams', label: 'Exams', icon: GraduationCap, count: lesson.exams?.length || 0 },
        { id: 'resources', label: 'Resources', icon: ExternalLink, count: lesson.resourses?.length || 0 },
    ].filter(tab => tab.count > 0);

    const currentResources =
        activeTab === 'courses' ? lesson.coursesPdf :
            activeTab === 'videos' ? lesson.videos :
                activeTab === 'exercises' ? lesson.exercices :
                    activeTab === 'exams' ? lesson.exams :
                        lesson.resourses;

    const getEmbedUrl = (url: string) => {
        if (url.includes('youtube.com/watch?v=')) {
            const videoId = url.split('v=')[1]?.split('&')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes('youtu.be/')) {
            const videoId = url.split('youtu.be/')[1]?.split('?')[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return url;
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 pt-24">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => window.history.back()}
                    className="text-sm text-purple-600 hover:underline mb-2 flex items-center gap-1"
                >
                    <ChevronLeft size={16} /> Back
                </button>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{lesson.title}</h1>
                    {user && (
                        <button
                            onClick={handleToggleFavorite}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
                                isFavorite
                                    ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                                    : "border-white/20 dark:border-violet-500/30 hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                            )}
                        >
                            <Star size={20} className={isFavorite ? "fill-current" : ""} />
                            {isFavorite ? 'Favorited' : 'Add to Favorites'}
                        </button>
                    )}
                </div>
                {selectedResource && progressTracker.isTracking && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <Clock size={16} />
                        <span>Time spent: {Math.floor(progressTracker.timeSpent / 60)}m {progressTracker.timeSpent % 60}s</span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-white/10 dark:border-violet-500/20 mb-8 overflow-x-auto pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setActiveTab(tab.id as TabType);
                            setSelectedResource(null);
                        }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors relative whitespace-nowrap",
                            activeTab === tab.id
                                ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        )}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        <span className="ml-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-xs">
                            {tab.count}
                        </span>
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400"
                            />
                        )}
                    </button>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-6 relative min-h-[600px]">
                {/* Resource List Sidebar */}
                <motion.div
                    animate={{ width: isSidebarOpen ? "320px" : "80px" }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={cn(
                        "hidden lg:flex flex-col bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/10 dark:border-violet-500/20 rounded-xl overflow-hidden shadow-sm sticky top-24 h-[700px]",
                        !selectedResource && "lg:w-1/3 xl:w-1/4" // Maintain larger size if no resource selected
                    )}
                >
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        {isSidebarOpen && (
                            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                                {activeTab}
                            </h2>
                        )}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors mx-auto"
                        >
                            {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {currentResources?.map((resource, idx) => {
                            const resourceId = getResourceId(resource);
                            const isCompleted = completedResources.has(resourceId);
                            const resourceProgress = lessonProgress?.resources?.[resourceId];

                            return (
                                <div key={idx} className="space-y-1">
                                    <div
                                        onClick={() => setSelectedResource(resource)}
                                        className={cn(
                                            "relative flex items-center gap-3 rounded-lg border cursor-pointer transition-all group",
                                            selectedResource === resource
                                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                                : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                                            isSidebarOpen ? "p-3" : "p-3 justify-center"
                                        )}
                                        title={!isSidebarOpen ? resource.title : ""}
                                    >
                                        <div className={cn(
                                            "flex-shrink-0 transition-colors",
                                            selectedResource === resource ? "text-purple-600" : "text-zinc-400"
                                        )}>
                                            {activeTab === 'videos' ? (
                                                <Video size={20} />
                                            ) : resource.url.toLowerCase().endsWith('.pdf') ? (
                                                <FileText size={20} className="text-red-500" />
                                            ) : (
                                                <FileText size={20} />
                                            )}
                                        </div>
                                        {isSidebarOpen && (
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-zinc-900 dark:text-white text-xs line-clamp-2 flex-1">
                                                        {resource.title}
                                                    </h3>
                                                    {isCompleted && (
                                                        <Check size={16} className="text-green-500 flex-shrink-0" />
                                                    )}
                                                </div>
                                                {resourceProgress && resourceProgress.timeSpent > 0 && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-full h-1">
                                                            <div
                                                                className="bg-purple-500 h-1 rounded-full transition-all"
                                                                style={{ width: `${resourceProgress.completionPercentage}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] text-zinc-500">
                                                            {Math.floor(resourceProgress.timeSpent / 60)}m
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Active Indicator Dot */}
                                        {selectedResource === resource && !isSidebarOpen && (
                                            <div className="absolute right-1 top-1 w-2 h-2 rounded-full bg-purple-500" />
                                        )}
                                        {isCompleted && !isSidebarOpen && (
                                            <div className="absolute right-1 bottom-1 w-3 h-3">
                                                <Check size={12} className="text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                    {user && isSidebarOpen && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkComplete(resource, !isCompleted);
                                            }}
                                            className="w-full text-xs px-2 py-1 rounded text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            {isCompleted ? '✓ Completed' : 'Mark as Complete'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Mobile Resource List */}
                {!selectedResource && (
                    <div className="lg:hidden space-y-3 px-2">
                        {currentResources?.map((resource, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedResource(resource)}
                                className="p-4 rounded-xl border border-white/10 dark:border-violet-500/20 bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText size={20} className="text-purple-500" />
                                    <span className="font-medium text-sm">{resource.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Viewer */}
                <div className={cn(
                    "flex-1 min-w-0 bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden border border-white/10 dark:border-violet-500/20",
                    !selectedResource ? "hidden lg:flex items-center justify-center h-[700px]" : "block h-[600px] lg:h-[700px]"
                )}>
                    {selectedResource ? (
                        <div className="w-full h-full flex flex-col">
                            {/* Mobile Header */}
                            <div className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl border-b border-white/10 dark:border-violet-500/20 p-3 flex justify-between items-center lg:hidden">
                                <button onClick={() => setSelectedResource(null)} className="flex items-center text-sm font-medium">
                                    <ChevronLeft size={16} /> Back
                                </button>
                                <span className="font-semibold truncate max-w-[200px]">{selectedResource.title}</span>
                            </div>

                            {/* Desktop Header Overlay (Optional, but useful for title visibility) */}
                            <div className="hidden lg:block p-3 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-b border-white/10 dark:border-violet-500/20">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{activeTab} / </span>
                                <span className="text-sm font-semibold">{selectedResource.title}</span>
                            </div>

                            <iframe
                                src={getEmbedUrl(selectedResource.url)}
                                className="w-full h-full bg-black"
                                title={selectedResource.title}
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                        </div>
                    ) : (
                        <div className="text-center p-8">
                            <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                                <FileText size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Select a resource</h3>
                            <p className="text-zinc-500 max-w-xs mx-auto mt-2">
                                Choose a resource from the list to view it here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
