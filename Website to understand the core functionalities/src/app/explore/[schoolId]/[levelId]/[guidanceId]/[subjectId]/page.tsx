"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getLessons } from "@/services/data";
import type { Lesson, LessonResource } from "@/types";
import { FileText, Video, BookOpen, GraduationCap, ChevronDown, ChevronRight, Play, ExternalLink, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getLessonProgress } from "@/lib/firestore";

export default function LessonsPage() {
    const params = useParams();
    const router = useRouter();
    const schoolId = params.schoolId as string;
    const levelId = params.levelId as string;
    const guidanceId = params.guidanceId as string;
    const subjectId = params.subjectId as string;

    const [lessons, setLessons] = useState<(Lesson & { progress?: any })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        let isMounted = true;
        async function fetch() {
            if (!subjectId || isFetching) return;
            setIsFetching(true);
            try {
                const data = await getLessons(subjectId);
                if (!isMounted) return;

                if (user) {
                    const lessonsWithProgress = await Promise.all(
                        data.map(async (lesson) => {
                            const progress = await getLessonProgress(user.id, lesson.id);
                            return { ...lesson, progress };
                        })
                    );
                    if (isMounted) setLessons(lessonsWithProgress);
                } else {
                    if (isMounted) setLessons(data);
                }
            } catch (error) {
                console.error("Failed to fetch lessons", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setIsFetching(false);
                }
            }
        }
        fetch();
        return () => { isMounted = false; };
    }, [subjectId, user?.id]);

    const toggleLesson = (id: string) => {
        setExpandedLessonId(expandedLessonId === id ? null : id);
    };

    const navigateToResource = (lessonId: string, type: string) => {
        // Navigate to the viewer page with the specific tab active or resource selected
        // For now, simpler to just go to the lesson page, but we could pass query params
        router.push(`/lesson/${lessonId}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-20 pt-24 px-4">
            <div className="mb-8">
                <Link
                    href={`/explore/${schoolId}/${levelId}/${guidanceId}`}
                    className="text-sm text-purple-600 hover:underline mb-2 inline-block"
                >
                    ← Back to Subjects
                </Link>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Lessons</h1>
                <p className="text-zinc-500">Browse lessons and resources.</p>
            </div>

            <div className="space-y-4">
                {lessons.map((lesson, index) => (
                    <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl border border-white/10 dark:border-violet-500/20 overflow-hidden"
                    >
                        {/* Lesson Header / Accordion Trigger */}
                        <div
                            onClick={() => toggleLesson(lesson.id)}
                            className="p-6 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors flex items-center justify-between"
                        >
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white truncate">
                                    {lesson.title}
                                </h3>
                                {lesson.progress && lesson.progress.totalResourcesCount > 0 && (
                                    <div className="mt-2 flex items-center gap-3">
                                        <div className="w-32 bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5">
                                            <div
                                                className="bg-purple-500 h-1.5 rounded-full transition-all"
                                                style={{ width: `${Math.round((lesson.progress.completedResourcesCount / lesson.progress.totalResourcesCount) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-zinc-500">
                                            {lesson.progress.completedResourcesCount}/{lesson.progress.totalResourcesCount} completed
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex gap-2 text-zinc-400">
                                    {(lesson.coursesPdf?.length ?? 0) > 0 && <FileText size={18} />}
                                    {(lesson.videos?.length ?? 0) > 0 && <Video size={18} />}
                                    {(lesson.exercices?.length ?? 0) > 0 && <BookOpen size={18} />}
                                    {(lesson.resourses?.length ?? 0) > 0 && <ExternalLink size={18} />}
                                </div>
                                <ChevronDown
                                    className={cn("transition-transform text-zinc-400", expandedLessonId === lesson.id && "rotate-180")}
                                    size={20}
                                />
                            </div>
                        </div>

                        {/* Expanded Content (Dropdowns) */}
                        <AnimatePresence>
                            {expandedLessonId === lesson.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-zinc-50 dark:bg-zinc-950/50 border-t border-white/10 dark:border-violet-500/20"
                                >
                                    <div className="p-4 space-y-4">
                                        {/* Courses Section */}
                                        {(lesson.coursesPdf?.length ?? 0) > 0 && (
                                            <div>
                                                <h4 className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wide">
                                                    <FileText size={14} /> Courses
                                                </h4>
                                                <div className="space-y-1">
                                                    {lesson.coursesPdf!.map((res, idx) => (
                                                        <Link
                                                            key={idx}
                                                            href={`/lesson/${lesson.id}`}
                                                            className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 py-1.5 px-2 rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors group"
                                                        >
                                                            <div className="w-1 h-1 rounded-full bg-purple-400" />
                                                            <span className="text-sm truncate flex-1">{res.title}</span>
                                                            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Exercises Section */}
                                        {(lesson.exercices?.length ?? 0) > 0 && (
                                            <div>
                                                <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">
                                                    <BookOpen size={14} /> Exercises
                                                </h4>
                                                <div className="space-y-1">
                                                    {lesson.exercices!.map((res, idx) => (
                                                        <Link
                                                            key={idx}
                                                            href={`/lesson/${lesson.id}`}
                                                            className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 py-1.5 px-2 rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors group"
                                                        >
                                                            <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                                            <span className="text-sm truncate flex-1">{res.title}</span>
                                                            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Videos Section */}
                                        {(lesson.videos?.length ?? 0) > 0 && (
                                            <div>
                                                <h4 className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 mb-2 uppercase tracking-wide">
                                                    <Video size={14} /> Videos
                                                </h4>
                                                <div className="space-y-1">
                                                    {lesson.videos!.map((res, idx) => (
                                                        <Link
                                                            key={idx}
                                                            href={`/lesson/${lesson.id}`}
                                                            className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 py-1.5 px-2 rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors group"
                                                        >
                                                            <Play size={10} className="fill-current text-red-500" />
                                                            <span className="text-sm truncate flex-1">{res.title}</span>
                                                            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Exams Section */}
                                        {(lesson.exams?.length ?? 0) > 0 && (
                                            <div>
                                                <h4 className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wide">
                                                    <GraduationCap size={14} /> Exams
                                                </h4>
                                                <div className="space-y-1">
                                                    {lesson.exams!.map((res, idx) => (
                                                        <Link
                                                            key={idx}
                                                            href={`/lesson/${lesson.id}`}
                                                            className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 py-1.5 px-2 rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors group"
                                                        >
                                                            <div className="w-1 h-1 rounded-full bg-purple-400" />
                                                            <span className="text-sm truncate flex-1">{res.title}</span>
                                                            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* General Resources Section */}
                                        {(lesson.resourses?.length ?? 0) > 0 && (
                                            <div>
                                                <h4 className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 uppercase tracking-wide">
                                                    <ExternalLink size={14} /> Resources
                                                </h4>
                                                <div className="space-y-1">
                                                    {lesson.resourses!.map((res, idx) => (
                                                        <Link
                                                            key={idx}
                                                            href={`/lesson/${lesson.id}`}
                                                            className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white py-1.5 px-2 rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-colors group"
                                                        >
                                                            <div className="w-1 h-1 rounded-full bg-zinc-400" />
                                                            <span className="text-sm truncate flex-1">{res.title}</span>
                                                            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl p-4 border-t border-white/10 dark:border-violet-500/20 text-center">
                                        <Link
                                            href={`/lesson/${lesson.id}`}
                                            className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:underline"
                                        >
                                            Go to full lesson view <ChevronRight size={16} />
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
                {lessons.length === 0 && (
                    <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-dashed border-white/20 dark:border-violet-500/30">
                        <p className="text-zinc-500">No lessons found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
