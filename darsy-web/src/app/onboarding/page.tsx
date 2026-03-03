"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronRight, GraduationCap, School, BookOpen, User } from "lucide-react";
import { getSchools, getLevels, getGuidances } from "@/services/data";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useTranslations } from "next-intl";

const moroccanCities = [
    "Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir", "Meknes", "Oujda", "Kenitra", "Tetouan",
    "Safi", "Mohammedia", "Khouribga", "Beni Mellal", "El Jadida", "Taza", "Nador", "Settat", "Larache",
    "Ksar El Kebir", "Khemisset", "Guelmim", "Berrechid", "Oued Zem", "Fquih Ben Salah", "Taourirt",
    "Berkane", "Sidi Slimane", "Sidi Qacem", "Khenifra", "Taroudant", "Essaouira", "Tiznit", "Ouarzazate",
    "Errachidia", "Tan-Tan", "Sidi Ifni", "Dakhla", "Laayouine"
];

export default function OnboardingPage() {
    const t = useTranslations("Onboarding");
    const { user, checkAuth } = useAuth();
    const { showSnackbar } = useSnackbar();
    const [currentStep, setCurrentStep] = useState(0);
    const [selections, setSelections] = useState({
        age: "",
        city: "",
        schoolId: "",
        levelId: "",
        guidanceId: "",
    });
    const [options, setOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const steps = [
        {
            id: "personal",
            title: t("personal_info_title"),
            description: t("personal_info_desc"),
            icon: User,
        },
        {
            id: "school",
            title: t("school_title"),
            description: t("school_desc"),
            icon: School,
        },
        {
            id: "level",
            title: t("level_title"),
            description: t("level_desc"),
            icon: GraduationCap,
        },
        {
            id: "guidance",
            title: t("guidance_title"),
            description: t("guidance_desc"),
            icon: BookOpen,
        },
    ];

    useEffect(() => {
        if (currentStep > 0) {
            fetchOptions();
        }
    }, [currentStep, selections.schoolId, selections.levelId]);

    const fetchOptions = async () => {
        setLoading(true);
        try {
            let res: any[] = [];
            if (currentStep === 1) {
                res = await getSchools();
            } else if (currentStep === 2) {
                res = await getLevels(selections.schoolId);
            } else if (currentStep === 3) {
                res = await getGuidances(selections.levelId);
            }
            setOptions(res);
        } catch (error) {
            console.error("Failed to fetch onboarding options:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (id: string) => {
        const stepId = steps[currentStep].id;
        setSelections((prev) => ({ ...prev, [`${stepId}Id`]: id }));

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleFinish({ ...selections, guidanceId: id });
        }
    };

    const handleFinish = async (finalSelections: typeof selections) => {
        try {
            const selectedSchool = (await getSchools()).find(s => s.id === finalSelections.schoolId);
            const selectedLevel = (await getLevels(finalSelections.schoolId)).find(l => l.id === finalSelections.levelId);
            const selectedGuidance = (await getGuidances(finalSelections.levelId)).find(g => g.id === finalSelections.guidanceId);

            if (user) {
                await api.patch('/user/profile', {
                    age: finalSelections.age,
                    city: finalSelections.city,
                    selectedPath: {
                        schoolId: finalSelections.schoolId,
                        levelId: finalSelections.levelId,
                        guidanceId: finalSelections.guidanceId
                    },
                    level: {
                        school: selectedSchool?.title || "",
                        level: selectedLevel?.title || "",
                        guidance: selectedGuidance?.title || ""
                    }
                });
                await checkAuth();
            }
            router.push("/explore");
        } catch (error) {
            console.error("Failed to save profile:", error);
            showSnackbar(t("save_error"), "error");
        }
    };

    const StepIcon = steps[currentStep]?.icon;

    return (
        <div className="min-h-screen bg-white text-dark flex flex-col items-center justify-center p-6 bg-gradient-to-b from-white to-green/5 pt-32">
            <div className="w-full max-w-2xl">
                <div className="flex gap-2 mb-12">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${index <= currentStep ? "bg-green" : "bg-green/10"
                                }`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-8"
                    >
                        <div className="text-center space-y-3">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green/10 text-green mb-4">
                                {StepIcon && <StepIcon size={32} />}
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {steps[currentStep].title}
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                {steps[currentStep].description}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {currentStep === 0 ? (
                                <div className="space-y-6 bg-white p-8 rounded-3xl border border-green/10 shadow-sm">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-dark/60 uppercase tracking-widest px-1">{t("age")}</label>
                                            <input
                                                type="number"
                                                value={selections.age}
                                                onChange={(e) => setSelections(prev => ({ ...prev, age: e.target.value }))}
                                                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-green focus:bg-white outline-none transition-all font-medium"
                                                placeholder="e.g. 18"
                                            />
                                        </div>

                                        <div className="space-y-2 relative">
                                            <label className="text-sm font-bold text-dark/60 uppercase tracking-widest px-1">{t("city")}</label>
                                            <input
                                                type="text"
                                                list="moroccan-cities"
                                                value={selections.city}
                                                onChange={(e) => setSelections(prev => ({ ...prev, city: e.target.value }))}
                                                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:border-green focus:bg-white outline-none transition-all font-medium"
                                                placeholder="e.g. Casablanca"
                                            />
                                            <datalist id="moroccan-cities">
                                                {moroccanCities.map(city => (
                                                    <option key={city} value={city} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setCurrentStep(1)}
                                        disabled={!selections.age || !selections.city}
                                        className="w-full py-4 bg-green text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-green/20 transition-all disabled:opacity-50 mt-4"
                                    >
                                        {t("next")} <ChevronRight size={20} />
                                    </button>
                                </div>
                            ) : loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="h-20 bg-green/5 animate-pulse rounded-2xl" />
                                ))
                            ) : (
                                options.map((item: any) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item.id)}
                                        className="group relative flex items-center justify-between p-6 rounded-2xl bg-white border border-green/10 hover:border-green hover:shadow-xl hover:shadow-green/5 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-green/20 group-hover:bg-green transition-colors" />
                                            <span className="text-lg font-semibold">{item.title}</span>
                                        </div>
                                        <ChevronRight className="text-green/30 group-hover:text-green group-hover:translate-x-1 transition-all" size={20} />
                                    </button>
                                ))
                            )}
                        </div>

                        {currentStep > 0 && (
                            <button
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="text-muted-foreground hover:text-dark transition-colors font-medium flex items-center gap-2"
                            >
                                ← {t("back")}
                            </button>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
