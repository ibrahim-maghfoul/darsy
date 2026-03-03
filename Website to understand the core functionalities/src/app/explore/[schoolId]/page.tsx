"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getLevels } from "@/services/data";
import type { Level } from "@/types";
import { BookOpen, ChevronRight } from "lucide-react";

export default function LevelsPage() {
    const params = useParams();
    const schoolId = params.schoolId as string;

    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            if (!schoolId) return;
            try {
                const data = await getLevels(schoolId);
                setLevels(data);
            } catch (error) {
                console.error("Failed to fetch levels", error);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, [schoolId]);

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
                <Link href="/explore" className="text-sm text-purple-600 hover:underline mb-2 inline-block">
                    ← Back to Schools
                </Link>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Select Level</h1>
            </div>

            <div className="space-y-4">
                {levels.map((level, index) => (
                    <motion.div
                        key={level.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Link
                            href={`/explore/${schoolId}/${level.id}`}
                            className="block group"
                        >
                            <div className="p-6 bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl border border-white/10 dark:border-violet-500/20 hover:border-purple-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                        <BookOpen size={20} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                        {level.title}
                                    </h3>
                                </div>
                                <ChevronRight className="text-zinc-400 group-hover:text-purple-500 transition-colors" />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
