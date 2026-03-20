"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Clock, ChevronRight, FileText, Play, ArrowLeft, ClipboardList, Search, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getLessons } from "@/services/data";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations, useLocale } from "next-intl";

export default function SubjectLessonsPage() {
    const params = useParams();
    const subjectId = params.subjectId as string;
    const { user } = useAuth();
    const [lessons, setLessons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const t = useTranslations("Lesson");
    const locale = useLocale();
    const isAr = locale === 'ar';

    useEffect(() => {
        if (subjectId) {
            fetchLessons();
        }
    }, [subjectId]);

    const fetchLessons = async () => {
        const res = await getLessons(subjectId);
        setLessons(res);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header — desktop only (back link only visible on md+) */}
            <header className="hidden md:block bg-green/5 border-b border-green/10 pt-32 pb-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <Link href="/explore" className={`flex text-sm font-medium text-green items-center gap-2 hover:-translate-x-1 transition-transform w-fit hover:underline ${isAr ? 'flex-row-reverse' : ''}`}>
                        <ArrowLeft size={16} className={isAr ? 'rotate-180' : ''} />
                        {t("back_subjects")}
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto pt-4 md:pt-16 pb-[120px] md:pb-32 px-6">
                {loading ? (
                    <div className="space-y-4">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="h-24 bg-green/5 animate-pulse rounded-3xl" />
                        ))}
                    </div>
                ) : lessons.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                        {lessons.map((lesson: any) => {
                            const progress = user ? user.progress?.lessons?.find((l: any) => l.lessonId === (lesson._id || lesson.id)) : null;
                            const completedCount = progress?.completedResources?.length ?? 0;
                            const totalResources = (lesson.coursesPdf?.length ?? 0) + (lesson.videos?.length ?? 0) + (lesson.exercices?.length ?? 0) + (lesson.exams?.length ?? 0) + (lesson.resourses?.length ?? 0);
                            const progressPct = totalResources > 0 ? Math.min(100, Math.round((completedCount / totalResources) * 100)) : 0;
                            const isStarted = user && completedCount > 0;
                            const isFullyCompleted = user && totalResources > 0 && progressPct === 100;

                            return (
                                <Link
                                    href={`/lesson/${lesson.id || lesson._id}`}
                                    key={lesson.id || lesson._id}
                                    className={`group flex flex-col gap-4 p-4 md:p-6 rounded-2xl md:rounded-[32px] border-2 transition-all text-left ${isFullyCompleted
                                        ? 'bg-green/10 border-green hover:bg-green/20 hover:shadow-xl hover:shadow-green/10'
                                        : isStarted
                                            ? 'bg-white border-green hover:shadow-xl hover:shadow-green/10'
                                            : 'bg-white border-green/40 hover:border-green hover:shadow-xl hover:shadow-green/5'
                                        }`}
                                >
                                    <div className="flex flex-col gap-4">
                                        <div className="flex flex-col items-start gap-4 flex-1 min-w-0">
                                            <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0 ${isFullyCompleted ? 'bg-green text-white shadow-lg shadow-green/30' : isStarted ? 'bg-green/20 text-green' : 'bg-green/5 text-green'
                                                }`}>
                                                {isFullyCompleted ? <CheckCircle2 size={isFullyCompleted ? 20 : 28} className="md:w-7 md:h-7" /> : <BookOpen size={20} className="md:w-7 md:h-7" />}
                                            </div>
                                            <div className="space-y-2 min-w-0 w-full">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className={`text-xs md:text-base font-bold transition-colors truncate ${isFullyCompleted ? 'text-green' : 'text-dark group-hover:text-green'}`}>
                                                        {lesson.title}
                                                    </h3>
                                                    {isFullyCompleted && (
                                                        <span className="text-[9px] w-fit font-black bg-green text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Completed</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-sm font-medium">
                                                    {lesson.coursesPdf?.length > 0 && (
                                                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${isFullyCompleted ? 'bg-white/50 text-blue-600' : 'text-blue-500 bg-blue-50'}`} title={`${lesson.coursesPdf.length} PDFs`}>
                                                            <FileText size={12} className="md:w-[14px] md:h-[14px]" />
                                                            <span className="hidden md:inline">{lesson.coursesPdf.length} PDFs</span>
                                                        </div>
                                                    )}
                                                    {lesson.videos?.length > 0 && (
                                                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${isFullyCompleted ? 'bg-white/50 text-purple-600' : 'text-purple-500 bg-purple-50'}`} title={`${lesson.videos.length} Videos`}>
                                                            <Play size={12} className="md:w-[14px] md:h-[14px]" />
                                                            <span className="hidden md:inline">{lesson.videos.length} Videos</span>
                                                        </div>
                                                    )}
                                                    {lesson.exercices?.length > 0 && (
                                                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${isFullyCompleted ? 'bg-white/50 text-orange-600' : 'text-orange-500 bg-orange-50'}`} title={`${lesson.exercices.length} Exercises`}>
                                                            <ClipboardList size={12} className="md:w-[14px] md:h-[14px]" />
                                                            <span className="hidden md:inline">{lesson.exercices.length} Exercises</span>
                                                        </div>
                                                    )}
                                                    {lesson.resourses?.length > 0 && (
                                                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${isFullyCompleted ? 'bg-white/50 text-teal-600' : 'text-teal-500 bg-teal-50'}`} title={`${lesson.resourses.length} Resources`}>
                                                            <Search size={12} className="md:w-[14px] md:h-[14px]" />
                                                            <span className="hidden md:inline">{lesson.resourses.length} Resources</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar - Only for logged in users */}
                                    {user && totalResources > 0 && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-semibold">
                                                <span className={isStarted ? 'text-green' : 'text-muted-foreground'}>
                                                    {completedCount} / {totalResources} courses completed
                                                </span>
                                                <span className={`font-bold ${isFullyCompleted ? 'text-green' : isStarted ? 'text-green/80' : 'text-muted-foreground'}`}>
                                                    {progressPct}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-green/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isFullyCompleted ? 'bg-green shadow-sm shadow-green/40' : 'bg-green/60'}`}
                                                    style={{ width: `${progressPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-24 space-y-4">
                        <div className="w-20 h-20 bg-green/10 text-green rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-dark">No lessons yet</h2>
                        <p className="text-muted-foreground max-w-xs mx-auto">This subject doesn't have any lessons posted yet. Check back later!</p>
                    </div>
                )}
            </main>
        </div>
    );
}
