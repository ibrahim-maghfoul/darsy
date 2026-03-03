"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSchools, getLevels, getGuidances } from "@/services/data";
import type { School, Level, Guidance } from "@/types";
import { GraduationCap, BookOpen, Compass, ChevronRight, ArrowRight, Check } from "lucide-react";
import { cn, EducationLevel } from "@/lib/utils";
import { BlobButton } from "@/components/ui/BlobButton";
import { useAuth } from "@/contexts/AuthContext";
import { getUserDocument, updateUserDocument } from "@/lib/firestore";

export default function ExplorePage() {
    const router = useRouter();

    // Selection State
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
    const [selectedGuidance, setSelectedGuidance] = useState<Guidance | null>(null);

    // Data State
    const [schools, setSchools] = useState<School[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [guidances, setGuidances] = useState<Guidance[]>([]);

    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [userData, setUserData] = useState<any>(null);

    // Initial Path Check and Schools Fetch
    useEffect(() => {
        let mounted = true;

        async function fetch() {
            try {
                // Parallel fetching: Start both requests immediately
                const schoolsPromise = getSchools();
                const userDocPromise = user ? getUserDocument(user.id) : Promise.resolve(null);

                // Wait for both results
                const [schoolsData, userData] = await Promise.all([schoolsPromise, userDocPromise]);

                if (!mounted) return;

                // Set schools immediately so UI can render something
                setSchools(schoolsData);

                // Check for user path redirection
                if (userData) {
                    setUserData(userData);
                    if (userData.selectedPath) {
                        const { schoolId, levelId, guidanceId } = userData.selectedPath;
                        // Pre-fetch next level data while redirecting
                        getLevels(schoolId);
                        router.replace(`/explore/${schoolId}/${levelId}/${guidanceId}`);
                        return;
                    } else {
                        // User has profile but no path -> Onboarding
                        router.replace('/onboarding');
                        return;
                    }
                }
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetch();
        return () => { mounted = false; };
    }, [user, router]); // Dependency array remains [user, router]

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

    // Reset downstream selections
    const handleSchoolSelect = (school: School) => {
        setSelectedSchool(school);
        setSelectedLevel(null);
        setSelectedGuidance(null);
    };

    const handleLevelSelect = (level: Level) => {
        setSelectedLevel(level);
        setSelectedGuidance(null);
    };

    const handleGuidanceSelect = (guidance: Guidance) => {
        setSelectedGuidance(guidance);
    };

    const handleNavigate = async () => {
        if (selectedSchool && selectedLevel && selectedGuidance) {
            try {
                // Save selection to profile ONLY if user is logged in
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

                router.push(`/explore/${selectedSchool.id}/${selectedLevel.id}/${selectedGuidance.id}`);
            } catch (error) {
                console.error("Failed to save path", error);
                // Still navigate even if saving fails
                router.push(`/explore/${selectedSchool.id}/${selectedLevel.id}/${selectedGuidance.id}`);
            }
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 pb-20 pt-24">
                <div className="mb-10 text-center animate-pulse">
                    <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg mx-auto mb-2"></div>
                    <div className="h-6 w-48 bg-zinc-100 dark:bg-zinc-900 rounded-lg mx-auto"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Skeleton Column 1 */}
                    <div className="space-y-4">
                        <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                    {/* Skeleton Column 2 */}
                    <div className="space-y-4 opacity-50">
                        <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                        {[1, 2].map((i) => (
                            <div key={i} className="h-16 w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                    {/* Skeleton Column 3 */}
                    <div className="space-y-4 opacity-25">
                        <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                        {[1, 2].map((i) => (
                            <div key={i} className="h-16 w-full bg-zinc-100 dark:bg-zinc-900 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto px-4 pb-20 pt-24"
        >
            <div className="mb-10 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-2">Find Your Course</h1>
                <p className="text-zinc-500 dark:text-zinc-400">Select your path to view available subjects</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* Step 1: School */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-900/40 text-violet-300 text-sm font-bold border border-violet-500/30">1</span>
                        Select School
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                        {schools.map((school) => (
                            <BlobButton
                                key={school.id}
                                onClick={() => handleSchoolSelect(school)}
                                selected={selectedSchool?.id === school.id}
                                uppercase={false}
                                pill={false}
                                className="w-full !p-0"
                            >
                                <div className="p-4 flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <GraduationCap className={cn("transition-colors", selectedSchool?.id === school.id ? "text-white" : "text-zinc-400 group-hover:text-white")} size={20} />
                                        <span className="font-medium text-zinc-900 dark:text-white group-hover:text-white transition-colors">{school.title}</span>
                                    </div>
                                    {selectedSchool?.id === school.id && <Check size={18} className="text-white" />}
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
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-900/40 text-violet-300 text-sm font-bold border border-violet-500/30">2</span>
                                Select Level
                            </h2>
                            <div className="grid grid-cols-1 gap-3">
                                {levels.map((level) => (
                                    <BlobButton
                                        key={level.id}
                                        onClick={() => handleLevelSelect(level)}
                                        selected={selectedLevel?.id === level.id}
                                        uppercase={false}
                                        pill={false}
                                        className="w-full !p-0"
                                    >
                                        <div className="p-4 flex items-center justify-between w-full">
                                            <div className="flex items-center gap-3">
                                                <BookOpen className={cn("transition-colors", selectedLevel?.id === level.id ? "text-white" : "text-zinc-400 group-hover:text-white")} size={20} />
                                                <span className="font-medium text-zinc-900 dark:text-white group-hover:text-white transition-colors">{level.title}</span>
                                            </div>
                                            {selectedLevel?.id === level.id && <Check size={18} className="text-white" />}
                                        </div>
                                    </BlobButton>
                                ))}
                                {levels.length === 0 && (
                                    <p className="text-zinc-500 text-sm">No levels found for this school.</p>
                                )}
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
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-900/40 text-violet-300 text-sm font-bold border border-violet-500/30">3</span>
                                Select Guidance
                            </h2>
                            <div className="grid grid-cols-1 gap-3">
                                {guidances.map((guidance) => (
                                    <BlobButton
                                        key={guidance.id}
                                        onClick={() => handleGuidanceSelect(guidance)}
                                        selected={selectedGuidance?.id === guidance.id}
                                        uppercase={false}
                                        pill={false}
                                        className="w-full !p-0"
                                    >
                                        <div className="p-4 flex items-center justify-between w-full">
                                            <div className="flex items-center gap-3">
                                                <Compass className={cn("transition-colors", selectedGuidance?.id === guidance.id ? "text-white" : "text-zinc-400 group-hover:text-white")} size={20} />
                                                <span className="font-medium text-zinc-900 dark:text-white group-hover:text-white transition-colors">{guidance.title}</span>
                                            </div>
                                            {selectedGuidance?.id === guidance.id && <Check size={18} className="text-white" />}
                                        </div>
                                    </BlobButton>
                                ))}
                                {guidances.length === 0 && (
                                    <div className="p-4 rounded-xl border border-dashed border-white/20 dark:border-violet-500/30 bg-zinc-50 dark:bg-zinc-900/50 text-center">
                                        <p className="text-zinc-500 text-sm mb-2">No specific guidance found.</p>
                                        <BlobButton
                                            onClick={() => router.push(`/explore/${selectedSchool?.id}/${selectedLevel?.id}/all`)}
                                            uppercase={false}
                                            className="mx-auto px-4 py-2 text-sm"
                                        >
                                            View All Subjects
                                        </BlobButton>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation Button */}
            <AnimatePresence>
                {selectedSchool && selectedLevel && selectedGuidance && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-8 left-0 right-0 flex justify-center px-4 z-50"
                    >
                        <div className="max-w-md w-full">
                            <BlobButton
                                onClick={handleNavigate}
                                className="w-full py-4 text-lg"
                            >
                                Show Subjects <ArrowRight size={20} className="relative z-10" />
                            </BlobButton>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
