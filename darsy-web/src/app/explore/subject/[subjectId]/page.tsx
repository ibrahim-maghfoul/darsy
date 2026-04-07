"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
    BookOpen, FileText, Play, ArrowLeft,
    ClipboardList, CheckCircle2, GraduationCap, Search
} from "lucide-react";
import Link from "next/link";
import { getLessons } from "@/services/data";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations, useLocale } from "next-intl";
import "./lesson-cards.css";

export default function SubjectLessonsPage() {
    const params = useParams();
    const subjectId = params.subjectId as string;
    const { user } = useAuth();
    const [lessons, setLessons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const t = useTranslations("Lesson");
    const locale = useLocale();
    const isAr = locale === 'ar';

    useEffect(() => {
        if (subjectId) {
            setError(false);
            getLessons(subjectId)
                .then(res => { setLessons(res); setLoading(false); })
                .catch(() => { setError(true); setLoading(false); });
        }
    }, [subjectId]);

    return (
        <div className="min-h-screen bg-[#fafbfc]">
            {/* Header */}
            <header className="hidden md:block relative overflow-hidden bg-gradient-to-b from-[#f0f7f3] to-transparent border-b border-green/8 pt-32 pb-12 px-6">
                {/* Decorative blobs — GPU-accelerated, pointer-events off */}
                <div
                    className="absolute top-0 right-0 w-[420px] h-[420px] rounded-full bg-green/5 blur-3xl pointer-events-none"
                    style={{ transform: 'translate3d(30%, -30%, 0)' }}
                />
                <div
                    className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-green/4 blur-2xl pointer-events-none"
                    style={{ transform: 'translate3d(-20%, 20%, 0)' }}
                />

                <div className="max-w-6xl mx-auto relative">
                    <Link
                        href="/explore"
                        className={`btn-back mb-4 ${isAr ? 'rtl flex-row-reverse' : ''}`}
                    >
                        <ArrowLeft size={15} className={`btn-back-arrow ${isAr ? 'rotate-180' : ''}`} />
                        {t("back_subjects")}
                    </Link>

                    {!loading && lessons.length > 0 && (
                        <p className="text-xs font-semibold text-green/50 uppercase tracking-widest">
                            {lessons.length} lessons
                        </p>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto pt-4 md:pt-12 pb-[120px] md:pb-32 px-4 md:px-6">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Array(6).fill(0).map((_, i) => (
                            <div
                                key={i}
                                className="lesson-card-skeleton"
                                style={{ animationDelay: `${i * 70}ms` }}
                            />
                        ))}
                    </div>
                ) : lessons.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {lessons.map((lesson: any, index: number) => {
                            const progress = user?.progress?.lessons?.find(
                                (l: any) => l.lessonId === (lesson._id || lesson.id)
                            );
                            const completedCount = progress?.completedResources?.length ?? 0;
                            const totalResources =
                                (lesson.coursesPdf?.length ?? 0) +
                                (lesson.videos?.length ?? 0) +
                                (lesson.exercices?.length ?? 0) +
                                (lesson.exams?.length ?? 0) +
                                (lesson.resourses?.length ?? 0);
                            const progressPct = totalResources > 0
                                ? Math.min(100, Math.round((completedCount / totalResources) * 100))
                                : 0;
                            const isStarted = user && completedCount > 0;
                            const isDone = user && totalResources > 0 && progressPct === 100;

                            const resourceIcons: { icon: any; count: number; key: string }[] = [];
                            if (lesson.coursesPdf?.length > 0)  resourceIcons.push({ icon: FileText,     count: lesson.coursesPdf.length,  key: 'pdf' });
                            if (lesson.videos?.length > 0)       resourceIcons.push({ icon: Play,         count: lesson.videos.length,      key: 'video' });
                            if (lesson.exercices?.length > 0)    resourceIcons.push({ icon: ClipboardList, count: lesson.exercices.length,  key: 'exercise' });
                            if (lesson.exams?.length > 0)        resourceIcons.push({ icon: GraduationCap, count: lesson.exams.length,      key: 'exam' });
                            if (lesson.resourses?.length > 0)    resourceIcons.push({ icon: Search,       count: lesson.resourses.length,   key: 'resource' });

                            return (
                                <Link
                                    href={`/lesson/${lesson.id || lesson._id}`}
                                    key={lesson.id || lesson._id}
                                    className={`lesson-card-v2 ${isDone ? 'lesson-card-done' : ''}`}
                                    style={{ animationDelay: `${index * 40}ms` }}
                                >

                                    {/* Decorative background number */}
                                    <div className="lesson-v2-bg-number">
                                        {isDone
                                            ? <CheckCircle2 size={52} strokeWidth={1.2} />
                                            : String(index + 1).padStart(2, '0')}
                                    </div>

                                    <div className="lesson-v2-content">
                                        {/* Index + done badge */}
                                        <div className="lesson-v2-header">
                                            <span className={`lesson-v2-index ${isDone ? 'lesson-v2-index--done' : ''}`}>
                                                {isDone
                                                    ? <><CheckCircle2 size={13} /> {t("completed") || "Done"}</>
                                                    : `#${String(index + 1).padStart(2, '0')}`}
                                            </span>
                                            {isStarted && !isDone && (
                                                <span className="lesson-v2-badge-done">{t("in_progress") || "In progress"}</span>
                                            )}
                                        </div>

                                        {/* Title */}
                                        <h3 className="lesson-v2-title">{lesson.title}</h3>

                                        {/* Resource chips */}
                                        {resourceIcons.length > 0 && (
                                            <div className="lesson-v2-chips">
                                                {resourceIcons.map(({ icon: Icon, count, key }) => (
                                                    <span key={key} className="lesson-v2-chip">
                                                        <Icon size={11} />
                                                        <span>{count}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Progress bar */}
                                        {user && totalResources > 0 && (
                                            <div className="lesson-v2-progress">
                                                <div className="lesson-v2-progress-track">
                                                    <div
                                                        className="lesson-v2-progress-fill"
                                                        style={{ width: `${progressPct}%` }}
                                                    />
                                                </div>
                                                <span className="lesson-v2-progress-label">
                                                    {completedCount}/{totalResources}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : error ? (
                    <div className="text-center py-24 space-y-4">
                        <div className="w-20 h-20 bg-red-50 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <BookOpen size={36} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Failed to load lessons</h2>
                        <p className="text-gray-400 max-w-xs mx-auto text-sm">Check your connection and try again.</p>
                        <button
                            onClick={() => { setLoading(true); setError(false); getLessons(subjectId).then(res => { setLessons(res); setLoading(false); }).catch(() => { setError(true); setLoading(false); }); }}
                            className="mt-2 px-5 py-2 bg-green text-white text-sm font-bold rounded-xl hover:bg-green/90 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-24 space-y-4">
                        <div className="w-20 h-20 bg-green/8 text-green rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <BookOpen size={36} />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">No lessons yet</h2>
                        <p className="text-gray-400 max-w-xs mx-auto text-sm">
                            This subject doesn&apos;t have any lessons posted yet. Check back later!
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
