"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getSubjects } from "@/services/data";
import { getSubjectProgress } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import type { Subject } from "@/types";
import { Book, ChevronRight } from "lucide-react";

interface SubjectWithProgress extends Subject {
    progress?: {
        completedResources: number;
        totalResources: number;
        progressPercentage: number;
    };
}

export default function SubjectsPage() {
    const params = useParams();
    const { user } = useAuth();
    const schoolId = params.schoolId as string;
    const levelId = params.levelId as string;
    const guidanceId = params.guidanceId as string;

    const [subjects, setSubjects] = useState<SubjectWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        let isMounted = true;
        async function fetch() {
            if (!guidanceId || isFetching) return;
            setIsFetching(true);
            try {
                const data = await getSubjects(guidanceId);
                if (!isMounted) return;

                // Fetch progress for each subject if user is logged in
                if (user) {
                    const subjectsWithProgress = await Promise.all(
                        data.map(async (subject) => {
                            const progress = await getSubjectProgress(user.id, subject.id);
                            return { ...subject, progress };
                        })
                    );
                    if (isMounted) setSubjects(subjectsWithProgress);
                } else {
                    if (isMounted) setSubjects(data);
                }
            } catch (error) {
                console.error("Failed to fetch subjects", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setIsFetching(false);
                }
            }
        }
        fetch();
        return () => { isMounted = false; };
    }, [guidanceId, user?.id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto pt-24 px-4">
            <div className="mb-8">
                <Link href={`/explore/${schoolId}/${levelId}`} className="text-sm text-purple-600 hover:underline mb-2 inline-block">
                    ← Back to Guidance
                </Link>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Subjects</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {subjects.map((subject, index) => (
                    <motion.div
                        key={subject.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Link
                            href={`/explore/${schoolId}/${levelId}/${guidanceId}/${subject.id}`}
                            className="block group h-full"
                        >
                            <div className="h-full flex flex-col bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl border border-white/10 dark:border-violet-500/20 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all overflow-hidden">
                                <div className="h-32 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center relative">
                                    {/* Placeholder icon since we don't have images yet */}
                                    <Book size={48} className="text-emerald-500/50" />
                                    {subject.imageUrl && (
                                        <img src={subject.imageUrl} alt={subject.title} className="absolute inset-0 w-full h-full object-cover" />
                                    )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                        {subject.title}
                                    </h3>

                                    {/* Progress Display */}
                                    {subject.progress && subject.progress.totalResources > 0 && (
                                        <div className="mt-2 mb-3">
                                            <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                                                <span>Progress</span>
                                                <span>{subject.progress.completedResources}/{subject.progress.totalResources}</span>
                                            </div>
                                            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5">
                                                <div
                                                    className="bg-emerald-500 h-1.5 rounded-full transition-all"
                                                    style={{ width: `${subject.progress.progressPercentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-auto pt-4 flex items-center text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                        View Lessons <ChevronRight size={16} className="ml-1" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
                {subjects.length === 0 && (
                    <div className="col-span-full text-center py-10 text-zinc-500">
                        No subjects found for this guidance.
                    </div>
                )}
            </div>
        </div>
    );
}
