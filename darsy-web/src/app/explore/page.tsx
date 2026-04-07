"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, BookOpen, ChevronRight, ChevronLeft, LogIn, Calculator, Atom, Globe, Microscope, Cpu, Music, Palette, Scale, Database, Dumbbell, Stethoscope, Lightbulb, Map, FlaskConical, Languages } from "lucide-react";
import Link from "next/link";
import { getSubjects, prefetchLessons } from "@/services/data";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import "./subject-cards.css";

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
import { getSchools, getLevels, getGuidances, prefetchLevels, prefetchGuidances } from "@/services/data";
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
                // Prefetch levels for all schools so next step loads instantly
                res.forEach(s => prefetchLevels(s.id));
            } else if (step === 2) {
                res = await getLevels(selections.schoolId);
                // Prefetch guidances for all levels
                res.forEach(l => prefetchGuidances(l.id));
            } else if (step === 3) {
                res = await getGuidances(selections.levelId);
                if (res.length === 1) {
                    onSelect(res[0].id, res[0].title);
                    return;
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

    const stepIcons = [
        <School size={26} />,
        <GraduationCap size={26} />,
        <BookOpen size={26} />,
    ];

    const stepLabels = [
        t('school_title'),
        t('level_title'),
        t('guidance_title'),
    ];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 pt-24 md:pt-32 bg-[#fafbfc]">
            <div className="w-full max-w-md space-y-4">

                {/* Login banner */}
                <div
                    className="relative overflow-hidden rounded-2xl px-4 py-3 shadow-md"
                    style={{ backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px), linear-gradient(135deg, #1e7a46 0%, #0f4428 100%)` }}
                >
                    <div className="relative z-10 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <UserPlus size={16} strokeWidth={2} className="text-white/80 shrink-0" />
                            <div className="min-w-0">
                                <p className="font-bold text-white text-xs leading-tight">Save your progress — sign in free</p>
                                <p className="text-white/60 text-[11px] leading-snug hidden sm:block">Track lessons, earn points, save favorites.</p>
                            </div>
                        </div>
                        <button onClick={() => router.push('/login')} className="btn-signin">
                            <LogIn size={13} />
                            Sign In
                        </button>
                    </div>
                </div>

                {/* Wizard panel */}
                <div
                    key={step}
                    className="bg-white rounded-[28px] border border-green/8 shadow-xl shadow-green/5 overflow-hidden animate-slide-up"
                >
                    {/* Header with dot texture */}
                    <div
                        className="relative px-6 pt-7 pb-6 border-b border-green/6"
                        style={{ background: 'linear-gradient(135deg, #f0faf5 0%, #e8f5ee 100%)' }}
                    >
                        {/* Dot texture */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(circle, rgba(58,170,106,0.15) 1px, transparent 1px)', backgroundSize: '14px 14px' }}
                        />

                        {/* Step progress */}
                        <div className="relative z-10 flex items-center justify-center gap-2 mb-5">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={`step-dot ${s < step ? 'step-dot-past' : s === step ? 'step-dot-active' : 'step-dot-future'}`}>
                                        {s < step ? '✓' : s}
                                    </div>
                                    {s < 3 && (
                                        <div className={`step-line ${s < step ? 'step-line-done' : 'step-line-pending'}`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Icon + title */}
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="step-icon-box">
                                {stepIcons[step - 1]}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-green/50 uppercase tracking-widest mb-0.5">
                                    Step {step} of 3
                                </p>
                                <h2 className="text-xl font-black text-dark tracking-tight leading-tight">
                                    {stepLabels[step - 1]}
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Options list */}
                    <div className="p-4 space-y-2">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div
                                    key={i}
                                    className="selection-skeleton"
                                    style={{ animationDelay: `${i * 70}ms` }}
                                />
                            ))
                        ) : options.length === 0 ? (
                            <div className="py-8 text-center text-sm text-green/40 font-medium">
                                Nothing found — check your connection.
                            </div>
                        ) : (
                            options.map((item, index) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className="selection-card"
                                    style={{ animationDelay: `${index * 40}ms` }}
                                >
                                    <div className="selection-card-row">
                                        <span className="selection-card-num">{String(index + 1).padStart(2, '0')}</span>
                                        <span className="selection-card-label">{item.title}</span>
                                        <ChevronRight size={15} className="selection-card-chevron" />
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Back / footer */}
                    {step > 1 && (
                        <div className="px-4 pb-4">
                            <button onClick={() => setStep(step - 1)} className="btn-back">
                                <ChevronLeft size={14} className="btn-back-arrow" />
                                Back to {step === 2 ? stepLabels[0] : stepLabels[1]}
                            </button>
                        </div>
                    )}
                </div>
            </div>
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
            }
            return;
        }

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
        try {
            const res = await getSubjects(guidanceId);
            setSubjects(res);
        } catch {
            setSubjects([]);
        } finally {
            setLoading(false);
        }
    };

    // Memoize filtered subjects to avoid re-filtering on every render
    const filteredSubjects = useMemo(() =>
        subjects.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())),
        [subjects, searchQuery]
    );

    // If not logged in and no path is selected yet, show selector
    if (!user && !loading && !anonymousPathParams) {
        return <GuestLevelSelector onSelect={(guidanceId, title) => {
            setAnonymousPathParams({ guidanceId, guidanceTitle: title });
            fetchSubjects(guidanceId);
        }} />;
    }

    return (
        <div className="min-h-screen bg-white animate-slide-up">
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
                                <Link href="/login" className="btn-signin">
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
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        {Array(6).fill(0).map((_, i) => (
                            <div
                                key={i}
                                className="subject-card-skeleton"
                                style={{ animationDelay: `${i * 70}ms` }}
                            />
                        ))}
                    </div>
                ) : filteredSubjects.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        {filteredSubjects.map((subject: any, index: number) => {
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

                            const radius = 17;
                            const circumference = 2 * Math.PI * radius;
                            const strokeOffset = circumference - (progressPct / 100) * circumference;

                            return (
                                <Link
                                    href={`/explore/subject/${subject.id}`}
                                    key={subject.id}
                                    className={`subject-card ${isComplete ? 'subject-card-done' : ''}`}
                                    style={{ animationDelay: `${index * 40}ms` }}
                                    onMouseEnter={() => prefetchLessons(subject.id)}
                                >
                                    {/* Icon header area */}
                                    <div className="subject-card-icon-area">

                                        <div className="subject-card-icon">
                                            {getSubjectIcon(subject.title)}
                                        </div>

                                        {isStarted ? (
                                            <div className="subject-card-ring">
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
                                                    <circle cx="20" cy="20" r={radius} fill="none" stroke="rgba(58,170,106,0.12)" strokeWidth="2.5" />
                                                    <circle
                                                        cx="20" cy="20" r={radius} fill="none"
                                                        stroke={isComplete ? '#3aaa6a' : 'rgba(58,170,106,0.65)'}
                                                        strokeWidth="2.5" strokeLinecap="round"
                                                        strokeDasharray={circumference}
                                                        strokeDashoffset={strokeOffset}
                                                        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                                                    />
                                                </svg>
                                                <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-black ${isComplete ? 'text-green' : 'text-gray-500'}`}>
                                                    {isComplete ? '✓' : `${progressPct}%`}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="subject-card-arrow">
                                                {isAr ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content body */}
                                    <div className="subject-card-body">
                                        <h3 className="subject-card-title">{subject.title}</h3>

                                        {isStarted && (
                                            <div className="subject-card-footer">
                                                <span className="subject-card-stat">
                                                    {totalCompleted}/{totalResources} resources
                                                </span>
                                                {isComplete && (
                                                    <span className="subject-card-badge">Done</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
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
        </div>
    );
}
