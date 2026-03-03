"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getGuidances } from "@/services/data";
import type { Guidance } from "@/types";
import { Compass, ChevronRight } from "lucide-react";

export default function GuidancesPage() {
    const params = useParams();
    const schoolId = params.schoolId as string;
    const levelId = params.levelId as string;

    const [guidances, setGuidances] = useState<Guidance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            if (!levelId) return;
            try {
                const data = await getGuidances(levelId);
                setGuidances(data);
            } catch (error) {
                console.error("Failed to fetch guidances", error);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, [levelId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pt-24 px-4">
            <div className="mb-8">
                <Link href={`/explore/${schoolId}`} className="text-sm text-purple-600 hover:underline mb-2 inline-block">
                    ← Back to Levels
                </Link>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Sort by Guidance</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guidances.map((guidance, index) => (
                    <motion.div
                        key={guidance.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Link
                            href={`/explore/${schoolId}/${levelId}/${guidance.id}`}
                            className="block group h-full"
                        >
                            <div className="h-full p-6 bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl border border-white/10 dark:border-violet-500/20 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                        <Compass size={24} />
                                    </div>
                                    <ChevronRight className="text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                                </div>
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {guidance.title}
                                </h3>
                            </div>
                        </Link>
                    </motion.div>
                ))}
                {guidances.length === 0 && (
                    <div className="col-span-full text-center py-10 text-zinc-500">
                        No specific guidance found.
                        <Link href={`/explore/${schoolId}/${levelId}/all`} className="block mt-4 text-purple-600 hover:underline">
                            Browse all subjects available for this level
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
