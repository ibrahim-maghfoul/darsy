'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserFavorites } from '@/services/progress';
import { Heart, BookOpen, ChevronRight, Loader2, ArrowLeft, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function FavoriteCoursesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            getUserFavorites().then(res => { setFavorites(res); setLoading(false); });
        }
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-green" size={32} />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pt-20 md:pt-28 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">

                {/* Back */}
                <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-dark/40 hover:text-dark/70 transition-colors mb-8 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back to Profile
                </Link>

                {/* Header */}
                <div className="flex items-start justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                            <Heart size={28} className="text-red-500 fill-red-100" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-dark">Favorite Courses</h1>
                            <p className="text-dark/50 text-sm mt-0.5">
                                {favorites.length} saved {favorites.length === 1 ? 'lesson' : 'lessons'}
                            </p>
                        </div>
                    </div>
                    <Link href="/explore"
                        className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-green text-white rounded-2xl text-sm font-bold hover:bg-green/80 transition-all shadow-md shadow-green/20">
                        Explore more <ChevronRight size={16} />
                    </Link>
                </div>

                {favorites.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center"
                    >
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Bookmark size={28} className="text-red-300" />
                        </div>
                        <p className="font-bold text-dark/50 text-lg mb-1">No favorites yet</p>
                        <p className="text-dark/30 text-sm mb-8">Mark lessons as favorites while browsing to save them here</p>
                        <Link href="/explore"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green text-white rounded-2xl font-bold text-sm hover:bg-green/80 transition-all shadow-md shadow-green/20">
                            Browse Courses <ChevronRight size={16} />
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {favorites.map((lesson: any, i: number) => (
                            <motion.div
                                key={lesson.lessonId}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                            >
                                <Link
                                    href={`/lesson/${lesson.lessonId}`}
                                    className="group flex items-center gap-4 p-5 rounded-3xl bg-white border border-gray-100 shadow-sm hover:border-green/30 hover:shadow-xl hover:shadow-green/5 hover:-translate-y-0.5 transition-all"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-green/8 flex items-center justify-center text-green group-hover:bg-green group-hover:text-white flex-shrink-0 transition-all">
                                        <BookOpen size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-dark line-clamp-1 text-sm">
                                            {lesson.lessonTitle || 'Saved Lesson'}
                                        </h4>
                                        <p className="text-xs text-dark/40 mt-0.5 line-clamp-1">
                                            {lesson.subjectTitle || lesson.subjectId}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Heart size={14} className="text-red-400 fill-red-400" />
                                        <ChevronRight size={16} className="text-dark/20 group-hover:text-green transition-colors" />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {favorites.length > 0 && (
                    <div className="mt-6 text-center sm:hidden">
                        <Link href="/explore"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green text-white rounded-2xl font-bold text-sm hover:bg-green/80 transition-all">
                            Explore more courses <ChevronRight size={16} />
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
