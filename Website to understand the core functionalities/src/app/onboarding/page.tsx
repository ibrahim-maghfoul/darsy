"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSchools, getLevels, getGuidances } from "@/services/data";
import type { School, Level, Guidance } from "@/types";
import { GraduationCap, BookOpen, Compass, ArrowRight, Check, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BlobButton } from "@/components/ui/BlobButton";
import { useAuth } from "@/contexts/AuthContext";
import { updateUserDocument } from "@/lib/firestore";

export default function OnboardingPage() {
    const router = useRouter();
    const { user } = useAuth();

    // Selection State
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
    const [selectedGuidance, setSelectedGuidance] = useState<Guidance | null>(null);

    // Data State
    const [schools, setSchools] = useState<School[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [guidances, setGuidances] = useState<Guidance[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Initial load
    useEffect(() => {
        async function fetch() {
            try {
                const data = await getSchools();
                setSchools(data);
            } catch (error) {
                console.error("Failed to fetch schools", error);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    // Fetch Levels when School Changes
    useEffect(() => {
        async function fetch() {
            if (!selectedSchool) {
                setLevels([]);
                return;
            }
            try {
                const data = await getLevels(selectedSchool.id);
                setLevels(data);
            } catch (error) {
                console.error("Failed to fetch levels", error);
            }
        }
        fetch();
    }, [selectedSchool]);

    // Fetch Guidances when Level Changes
    useEffect(() => {
        async function fetch() {
            if (!selectedLevel) {
                setGuidances([]);
                return;
            }
            try {
                const data = await getGuidances(selectedLevel.id);
                setGuidances(data);
            } catch (error) {
                console.error("Failed to fetch guidances", error);
            }
        }
        fetch();
    }, [selectedLevel]);

    const handleComplete = async () => {
        if (selectedSchool && selectedLevel && selectedGuidance) {
            setSaving(true);
            try {
                // Save selection to profile
                if (user) {
                    await updateUserDocument(user.id, {
                        level: {
                            school: selectedSchool.title,
                            level: selectedLevel.title,
                            guidance: selectedGuidance.title,
                        },
                        selectedPath: {
                            schoolId: selectedSchool.id,
                            levelId: selectedLevel.id,
                            guidanceId: selectedGuidance.id,
                        }
                    } as any);
                }

                // Redirect to the specific subjects page for the chosen guidance
                router.push(`/explore/${selectedSchool.id}/${selectedLevel.id}/${selectedGuidance.id}`);
            } catch (error) {
                console.error("Failed to save onboarding data", error);
                router.replace("/explore");
            } finally {
                setSaving(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-zinc-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pt-32 pb-20 px-4">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-6">
                        <Sparkles size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
                        Welcome to Darsy
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
                        Choose your path to get personalized study materials.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Step 1: School */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold text-lg">1</span>
                            Select School
                        </h2>
                        <div className="space-y-3">
                            {schools.map((school) => (
                                <BlobButton
                                    key={school.id}
                                    onClick={() => { setSelectedSchool(school); setSelectedLevel(null); setSelectedGuidance(null); }}
                                    selected={selectedSchool?.id === school.id}
                                    uppercase={false}
                                    pill={false}
                                    className="w-full !p-0"
                                >
                                    <div className="p-5 flex items-center justify-between w-full">
                                        <div className="flex items-center gap-4">
                                            <GraduationCap className={cn("transition-colors", selectedSchool?.id === school.id ? "text-white" : "text-zinc-400 group-hover:text-white")} size={24} />
                                            <span className="font-semibold text-zinc-900 dark:text-white group-hover:text-white transition-colors text-lg">{school.title}</span>
                                        </div>
                                        {selectedSchool?.id === school.id && <Check size={20} className="text-white" />}
                                    </div>
                                </BlobButton>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Level */}
                    <AnimatePresence>
                        {selectedSchool && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold text-lg">2</span>
                                    Select Level
                                </h2>
                                <div className="space-y-3">
                                    {levels.map((level) => (
                                        <BlobButton
                                            key={level.id}
                                            onClick={() => { setSelectedLevel(level); setSelectedGuidance(null); }}
                                            selected={selectedLevel?.id === level.id}
                                            uppercase={false}
                                            pill={false}
                                            className="w-full !p-0"
                                        >
                                            <div className="p-5 flex items-center justify-between w-full">
                                                <div className="flex items-center gap-4">
                                                    <BookOpen className={cn("transition-colors", selectedLevel?.id === level.id ? "text-white" : "text-zinc-400 group-hover:text-white")} size={24} />
                                                    <span className="font-semibold text-zinc-900 dark:text-white group-hover:text-white transition-colors text-lg">{level.title}</span>
                                                </div>
                                                {selectedLevel?.id === level.id && <Check size={20} className="text-white" />}
                                            </div>
                                        </BlobButton>
                                    ))}
                                    {levels.length === 0 && <p className="text-zinc-500 text-center animate-pulse">Fetching levels...</p>}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Step 3: Guidance */}
                    <AnimatePresence>
                        {selectedLevel && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold text-lg">3</span>
                                    Select Guidance
                                </h2>
                                <div className="space-y-3">
                                    {guidances.map((guidance) => (
                                        <BlobButton
                                            key={guidance.id}
                                            onClick={() => setSelectedGuidance(guidance)}
                                            selected={selectedGuidance?.id === guidance.id}
                                            uppercase={false}
                                            pill={false}
                                            className="w-full !p-0"
                                        >
                                            <div className="p-5 flex items-center justify-between w-full">
                                                <div className="flex items-center gap-4">
                                                    <Compass className={cn("transition-colors", selectedGuidance?.id === guidance.id ? "text-white" : "text-zinc-400 group-hover:text-white")} size={24} />
                                                    <span className="font-semibold text-zinc-900 dark:text-white group-hover:text-white transition-colors text-lg">{guidance.title}</span>
                                                </div>
                                                {selectedGuidance?.id === guidance.id && <Check size={20} className="text-white" />}
                                            </div>
                                        </BlobButton>
                                    ))}
                                    {guidances.length === 0 && (
                                        <BlobButton
                                            onClick={() => setSelectedGuidance({ id: 'all', title: 'All Subjects' } as any)}
                                            selected={selectedGuidance?.id === 'all'}
                                            uppercase={false}
                                            pill={false}
                                            className="w-full !p-0"
                                        >
                                            <div className="p-5 flex items-center justify-between w-full">
                                                <div className="flex items-center gap-4">
                                                    <ChevronRight className={cn("transition-colors", selectedGuidance?.id === 'all' ? "text-white" : "text-zinc-400 group-hover:text-white")} size={24} />
                                                    <span className="font-semibold text-zinc-900 dark:text-white group-hover:text-white transition-colors text-lg">General / All</span>
                                                </div>
                                                {selectedGuidance?.id === 'all' && <Check size={20} className="text-white" />}
                                            </div>
                                        </BlobButton>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {selectedGuidance && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-20 flex justify-center"
                        >
                            <div className="max-w-md w-full">
                                <BlobButton
                                    onClick={handleComplete}
                                    disabled={saving}
                                    className="w-full py-6 text-2xl font-black shadow-2xl shadow-purple-500/40"
                                >
                                    {saving ? "Saving Selection..." : "GET STARTED"} <ArrowRight className="ml-3 relative z-10" size={28} />
                                </BlobButton>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
