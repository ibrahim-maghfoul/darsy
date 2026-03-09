"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, ChevronRight, ChevronLeft, Mail, Lock, LogIn } from "lucide-react";
import Link from "next/link";
import { getSubjects } from "@/services/data";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

// ---------- Inline login form shown when not authenticated ----------
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-white to-green/10 p-6 pt-32">
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
            setLoading(false);
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
        const res = await getSubjects(guidanceId);
        setSubjects(res);
        setLoading(false);
    };

    // Show login form inline if not authenticated
    if (!user && !loading) {
        return <LoginGate />;
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
            <header className="bg-green/5 border-b border-green/10 pt-32 pb-16 px-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-dark">{nt('welcome')}, {user?.displayName?.split(' ')[0] || t('student')}!</h1>
                        <p className="text-muted-foreground text-lg">{t('desc')}</p>
                    </div>

                    {user && (
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
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto pt-16 pb-16 px-6">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array(6).fill(0).map((_, i) => (
                            <div key={i} className="aspect-[4/3] bg-green/5 animate-pulse rounded-3xl" />
                        ))}
                    </div>
                ) : filteredSubjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

                            return (
                                <Link
                                    href={`/explore/subject/${subject.id}`}
                                    key={subject.id}
                                    className={`group relative bg-white rounded-3xl p-6 hover:shadow-2xl hover:shadow-green/10 transition-all overflow-hidden flex flex-col gap-4 border-2 ${isComplete
                                        ? 'border-green bg-green/5'
                                        : isStarted
                                            ? 'border-green/60 hover:border-green'
                                            : 'border-green/20 hover:border-green'
                                        }`}
                                >
                                    <div className="space-y-4 flex-1">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${isComplete ? 'bg-green text-white shadow-lg shadow-green/30' : 'bg-green/10 text-green'}`}>
                                            <BookOpen size={24} />
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
            </main>
        </motion.div>
    );
}
