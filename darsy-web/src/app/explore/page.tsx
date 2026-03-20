"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, ChevronRight, ChevronLeft, Mail, Lock, LogIn, Calculator, Atom, Globe, Microscope, Cpu, Music, Palette, Scale, Database, Code, Shield, Dumbbell, Stethoscope, TestTube, Lightbulb, Map, FileText, FlaskConical, Languages, FunctionSquare, Compass } from "lucide-react";
import Link from "next/link";
import { getSubjects } from "@/services/data";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

const getSubjectIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('math') || t.includes('calculus') || t.includes('رياضيات')) return <Calculator size={24} />;
    if (t.includes('physi') || t.includes('فيزياء') || t.includes('chimie') || t.includes('pc')) return <Atom size={24} />;
    if (t.includes('chemistry') || t.includes('كيمياء')) return <FlaskConical size={24} />;
    if (t.includes('biology') || t.includes('أحياء') || t.includes('علوم') || t.includes('svt') || t.includes('science') || t.includes('terre') || t.includes('vie')) return <Microscope size={24} />;
    if (t.includes('histor') || t.includes('تاريخ') || t.includes('histoire') || t.includes('géo') || t.includes('géographie')) return <Globe size={24} />;
    if (t.includes('geography') || t.includes('جغرافيا')) return <Map size={24} />;
    if (t.includes('english') || t.includes('إنجليزي') || t.includes('لغة') || t.includes('anglais') || t.includes('français') || t.includes('french') || t.includes('arabe') || t.includes('arabic')) return <Languages size={24} />;
    if (t.includes('computer') || t.includes('حاسب') || t.includes('it') || t.includes('tech') || t.includes('informatique')) return <Cpu size={24} />;
    if (t.includes('art') || t.includes('فنية')) return <Palette size={24} />;
    if (t.includes('music') || t.includes('موسيقى')) return <Music size={24} />;
    if (t.includes('islamic') || t.includes('دين') || t.includes('إسلامية') || t.includes('islamique') || t.includes('education') || t.includes('éducation')) return <BookOpen size={24} />;
    if (t.includes('law') || t.includes('قانون') || t.includes('droit')) return <Scale size={24} />;
    if (t.includes('medicine') || t.includes('طب') || t.includes('médecine')) return <Stethoscope size={24} />;
    if (t.includes('sport') || t.includes('رياضة') || t.includes('بدنية') || t.includes('eps')) return <Dumbbell size={24} />;
    if (t.includes('philosophy') || t.includes('فلسفة') || t.includes('philosophie')) return <Lightbulb size={24} />;
    if (t.includes('economy') || t.includes('اقتصاد') || t.includes('économie') || t.includes('gestion') || t.includes('compta') || t.includes('management')) return <Database size={24} />;
    return <BookOpen size={24} />;
};

// ---------- Guest Level Selector component ----------
import { getSchools, getLevels, getGuidances } from "@/services/data";
import { GraduationCap, School, UserPlus } from "lucide-react";

function GuestLevelSelector({ onSelect }: { onSelect: (guidanceId: string, title: string) => void }) {
    const t = useTranslations('Onboarding');
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [options, setOptions] = useState<any[]>([]);
    const [selections, setSelections] = useState({ schoolId: "", levelId: "" });

    useEffect(() => {
        fetchOptions();
    }, [step, selections]);

    const fetchOptions = async () => {
        setLoading(true);
        try {
            let res: any[] = [];
            if (step === 1) {
                res = await getSchools();
                res.sort((a, b) => {
                    const priority = (title: string) => {
                        const l = title.toLowerCase();
                        if (l.includes('prim') || l.includes('ابتدا')) return 0;
                        if (l.includes('coll') || l.includes('إعدا')) return 1;
                        if (l.includes('lyc') || l.includes('ثانو')) return 2;
                        return 3;
                    };
                    return priority(a.title) - priority(b.title);
                });
            } else if (step === 2) {
                res = await getLevels(selections.schoolId);
            } else if (step === 3) {
                res = await getGuidances(selections.levelId);
                // Auto-select if there is only one guidance (e.g. "Generale")
                if (res.length === 1) {
                    onSelect(res[0].id, res[0].title);
                    return; // Prevent further rendering of this step
                }
            }
            setOptions(res);
        } catch (error) {
            console.error("Failed to fetch options", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: any) => {
        if (step === 1) {
            setSelections(prev => ({ ...prev, schoolId: item.id }));
            setStep(2);
        } else if (step === 2) {
            setSelections(prev => ({ ...prev, levelId: item.id }));
            setStep(3);
        } else {
            onSelect(item.id, item.title);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white pt-20 md:pt-32">
            <div className="w-full max-w-2xl space-y-8">
                {/* Premium Login Suggestion for Guests - Smaller with Lines Texture */}
                <div
                    className="relative overflow-hidden bg-[#1e7a46] rounded-2xl px-4 py-3 shadow-lg shadow-green/10"
                    style={{
                        backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px), linear-gradient(135deg, #1e7a46 0%, #0f4428 100%)`
                    }}
                >
                    <div className="relative z-10 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <UserPlus size={18} strokeWidth={1.8} className="text-white/90 shrink-0" />
                            <div className="min-w-0">
                                <p className="font-bold text-white text-sm leading-tight">Save your learning progress!</p>
                                <p className="text-white/70 text-xs leading-snug hidden sm:block">Sign in to track lessons and save favorites.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/login')}
                            className="shrink-0 px-4 py-2 bg-white text-green font-bold rounded-xl text-xs shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
                        >
                            <LogIn size={14} />
                            Sign In
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white border border-green/10 rounded-[40px] p-8 md:p-12 shadow-2xl shadow-green/5 space-y-8 text-center"
                    >
                        {step > 1 && (
                            <div className="w-20 h-20 bg-green/10 rounded-3xl mx-auto flex items-center justify-center text-green mb-2">
                                {step === 2 ? <GraduationCap size={40} /> : <BookOpen size={40} />}
                            </div>
                        )}
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-dark tracking-tight">
                                {step === 1 ? t('school_title') : step === 2 ? t('level_title') : t('guidance_title')}
                            </h2>
                            <p className="text-muted-foreground">{t('guest_explore_desc') || "Select your level to view courses"}</p>
                        </div>
                        
                        <div className="grid gap-3 text-left">
                            {loading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="h-20 bg-green/5 animate-pulse rounded-2xl" />
                                ))
                            ) : (
                                options.map((item, index) => (
                                    <motion.button
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        className="group flex items-center justify-between p-5 rounded-2xl bg-gray-50/50 border border-transparent hover:border-green hover:bg-white hover:shadow-xl transition-all duration-300"
                                    >
                                        <span className="font-bold text-dark">{item.title}</span>
                                        <ChevronRight className="text-gray-300 group-hover:text-green group-hover:translate-x-1 transition-all" />
                                    </motion.button>
                                ))
                            )}
                        </div>
                        
                        {step > 1 && (
                            <button 
                                onClick={() => setStep(step - 1)} 
                                className="text-muted-foreground font-medium hover:text-dark transition-colors flex items-center gap-2 mx-auto"
                            >
                                <ChevronLeft size={16} />
                                Back to {step === 2 ? 'school' : 'level'} selection
                            </button>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}


// ---------- LoginGate (Kept for reference but unused in main page) ----------
function LoginGate() {
    const { login } = useAuth();
    const t = useTranslations('Auth');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-white to-green/10 p-6 pt-4 md:pt-32">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-8 bg-white p-10 rounded-[40px] border border-green/10 shadow-2xl shadow-green/5"
            >
                {/* Logo / Context */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-green/10 rounded-3xl flex items-center justify-center mx-auto mb-2">
                        <BookOpen className="text-green" size={32} />
                    </div>
                    <h1 className="text-4xl font-black text-dark tracking-tight">{t('signin_title')}</h1>
                    <p className="text-muted-foreground">{t('signin_desc')}</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-500 text-sm font-medium rounded-2xl border border-red-100 italic">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-green" size={20} />
                            <input
                                type="email"
                                placeholder={t('email')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-green/5 border border-transparent focus:border-green focus:bg-white focus:ring-4 focus:ring-green/5 outline-none transition-all font-medium"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-green" size={20} />
                            <input
                                type="password"
                                placeholder={t('password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-green/5 border border-transparent focus:border-green focus:bg-white focus:ring-4 focus:ring-green/5 outline-none transition-all font-medium"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-green text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-green/20 transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "..." : (
                            <>
                                <LogIn size={20} />
                                {t('signin_btn')}
                            </>
                        )}
                    </button>
                </form>

                <div className="relative text-center">
                    <p className="text-muted-foreground text-sm font-medium">
                        {t('no_account')}{" "}
                        <Link href="/signup" className="text-green font-bold hover:underline">
                            {t('signup_btn')}
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

// ---------- Main page ----------
export default function ExplorePage() {
    const { user } = useAuth();
    const t = useTranslations('Subjects');
    const nt = useTranslations('Navbar');
    const locale = useLocale();
    const isAr = locale === 'ar';
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [anonymousPathParams, setAnonymousPathParams] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        if (!user) {
            const params = new URLSearchParams(window.location.search);
            const guidanceId = params.get('guidanceId');
            const guidanceTitle = params.get('guidanceTitle');

            if (guidanceId) {
                setAnonymousPathParams({ guidanceId, guidanceTitle });
                fetchSubjects(guidanceId);
            } else {
                setLoading(false);
                // We don't redirect to onboarding, we stay here to show level selection
            }
            return;
        }

        // Authenticated user path
        if (user.selectedPath?.guidanceId) {
            setAnonymousPathParams(null);
            fetchSubjects(user.selectedPath.guidanceId);
        } else {
            const params = new URLSearchParams(window.location.search);
            const guidanceId = params.get('guidanceId');
            const guidanceTitle = params.get('guidanceTitle');

            if (guidanceId) {
                setAnonymousPathParams({ guidanceId, guidanceTitle });
                fetchSubjects(guidanceId);
                return;
            }
            router.push('/onboarding');
        }
    }, [user, router]);

    const fetchSubjects = async (guidanceId: string) => {
        setLoading(true);
        const res = await getSubjects(guidanceId);
        setSubjects(res);
        setLoading(false);
    };

    // If not logged in and no path is selected yet, show selector
    if (!user && !loading && !anonymousPathParams) {
        return <GuestLevelSelector onSelect={(guidanceId, title) => {
            setAnonymousPathParams({ guidanceId, guidanceTitle: title });
            fetchSubjects(guidanceId);
        }} />;
    }

    const filteredSubjects = subjects.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen bg-white"
        >
            {/* Header */}
            <header className="bg-green/5 border-b border-green/10 pt-6 md:pt-32 pb-16 px-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-dark">{nt('welcome')}, {user?.displayName?.split(' ')[0] || t('student')}!</h1>
                        <p className="text-muted-foreground text-lg">{t('desc')}</p>
                    </div>

                    {user ? (
                        <div className="flex flex-col md:flex-row gap-4 max-w-2xl">
                            <div className="relative flex-1">
                                <Search className={`absolute ${isAr ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-muted-foreground`} size={20} />
                                <input
                                    type="text"
                                    placeholder={t('search_placeholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full ${isAr ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 rounded-2xl bg-white border border-green/10 focus:border-green focus:ring-4 focus:ring-green/5 outline-none transition-all`}
                                />
                            </div>
                        </div>
                    ) : (
                        <div
                            className="relative overflow-hidden bg-[#1e7a46] rounded-2xl px-4 py-3 shadow-lg shadow-green/10 max-w-2xl"
                            style={{
                                backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px), linear-gradient(135deg, #1e7a46 0%, #0f4428 100%)`
                            }}
                        >
                            <div className="relative z-10 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <UserPlus size={18} strokeWidth={1.8} className="text-white/90 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="font-bold text-white text-sm leading-tight">Save your learning progress!</p>
                                        <p className="text-white/70 text-xs leading-snug hidden sm:block">Sign in to track lessons and save favorites.</p>
                                    </div>
                                </div>
                                <Link
                                    href="/login"
                                    className="shrink-0 px-4 py-2 bg-white text-green font-bold rounded-xl text-xs shadow-md hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap"
                                >
                                    <LogIn size={14} />
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto pt-16 px-6" style={{ paddingBottom: '8rem' }}>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array(6).fill(0).map((_, i) => (
                            <div key={i} className="aspect-[4/3] bg-green/5 animate-pulse rounded-3xl" />
                        ))}
                    </div>
                ) : filteredSubjects.length > 0 ? (
                    <motion.div layout className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredSubjects.map((subject: any) => {
                                const subjectLessons = user?.progress?.lessons?.filter(
                                    (l: any) => l.subjectId === (subject._id || subject.id)
                                ) ?? [];
                                const totalCompleted = subjectLessons.reduce(
                                    (sum: number, l: any) => sum + (l.completedResources?.length ?? 0), 0
                                );
                                const totalResources = subjectLessons.reduce(
                                    (sum: number, l: any) => sum + (l.totalResourcesCount ?? 0), 0
                                );
                                const progressPct = totalResources > 0
                                    ? Math.min(100, Math.round((totalCompleted / totalResources) * 100))
                                    : 0;
                                const isStarted = subjectLessons.length > 0;
                                const isComplete = totalResources > 0 && progressPct === 100;

                                // Link cannot be directly animated with AnimatePresence without motion(), use motion(Link) or wrap it in a motion.div
                                const MotionLink = motion.create(Link);

                                return (
                                    <MotionLink
                                        href={`/explore/subject/${subject.id}`}
                                        key={subject.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        className={`group relative bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 hover:shadow-2xl hover:shadow-green/10 transition-all overflow-hidden flex flex-col gap-3 md:gap-4 border-2 ${isComplete
                                            ? 'border-green bg-green/5'
                                            : isStarted
                                                ? 'border-green/60 hover:border-green'
                                                : 'border-green/20 hover:border-green'
                                            }`}
                                    >
                                    <div className="space-y-4 flex-1">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${isComplete ? 'bg-green text-white shadow-lg shadow-green/30' : 'bg-green/10 text-green'}`}>
                                            {getSubjectIcon(subject.title)}
                                        </div>
                                        <div className="space-y-1 pr-12">
                                            <h3 className="text-xl font-bold text-dark">{subject.title}</h3>
                                            <p className="text-muted-foreground line-clamp-2 text-sm">{subject.description}</p>
                                        </div>
                                    </div>

                                    {isStarted && (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-semibold">
                                                <span className="text-green">
                                                    {totalCompleted}/{totalResources} resources
                                                </span>
                                                <span className={`font-bold ${isComplete ? 'text-green' : 'text-green/70'}`}>
                                                    {progressPct}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-green/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green shadow-sm shadow-green/40' : 'bg-green/60'}`}
                                                    style={{ width: `${progressPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className={`absolute ${isAr ? 'left-6' : 'right-6'} top-6 w-10 h-10 rounded-full border flex items-center justify-center transition-all ${isComplete
                                        ? 'bg-green border-green text-white'
                                        : 'border-green/10 text-green group-hover:bg-green group-hover:text-white group-hover:border-green'
                                        }`}>
                                        {isAr ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                                    </div>
                                    </MotionLink>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="text-center py-24 space-y-4">
                        <div className="w-20 h-20 bg-green/10 text-green rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-dark">{t('no_subjects')}</h2>
                    </div>
                )}
                <div style={{ height: '4rem' }} />
            </main>
        </motion.div>
    );
}
