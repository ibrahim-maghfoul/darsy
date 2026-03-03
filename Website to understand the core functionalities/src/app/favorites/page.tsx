'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, BookOpen, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getFavoriteLessons, toggleLessonFavorite } from '@/lib/firestore';
import { getLessonById } from '@/services/data';
import type { Lesson } from '@/types';

interface FavoriteLessonWithDetails {
    lessonId: string;
    subjectId: string;
    isFavorite: boolean;
    lastAccessed: any;
    totalTimeSpent: number;
    completedResourcesCount: number;
    totalResourcesCount: number;
    lesson?: Lesson;
}

export default function FavoritesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [favorites, setFavorites] = useState<FavoriteLessonWithDetails[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchFavorites() {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const favoriteLessons = await getFavoriteLessons(user.uid);

                // Fetch full lesson details for each favorite
                const favoritesWithDetails = await Promise.all(
                    favoriteLessons.map(async (fav) => {
                        const lesson = await getLessonById(fav.lessonId);
                        return {
                            ...fav,
                            lesson: lesson || undefined,
                        };
                    })
                );

                setFavorites(favoritesWithDetails);
            } catch (error) {
                console.error('Failed to fetch favorites:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchFavorites();
    }, [user]);

    const handleRemoveFavorite = async (lessonId: string, subjectId: string) => {
        if (!user) return;

        try {
            await toggleLessonFavorite(user.uid, lessonId, subjectId);
            setFavorites(prev => prev.filter(fav => fav.lessonId !== lessonId));
        } catch (error) {
            console.error('Failed to remove favorite:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    if (!user) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-4 text-center">
                <Star size={48} className="mx-auto mb-4 text-zinc-400" />
                <h2 className="text-2xl font-bold mb-2">Sign in to view favorites</h2>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                    Create an account to save your favorite lessons
                </p>
                <button
                    onClick={() => router.push('/login')}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                    Sign In
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Star size={32} className="text-yellow-500 fill-current" />
                        <h1 className="text-4xl font-bold">Favorite Lessons</h1>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Quick access to your favorite lessons
                    </p>
                </div>

                {favorites.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen size={48} className="mx-auto mb-4 text-zinc-400" />
                        <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                            Star lessons to add them to your favorites
                        </p>
                        <button
                            onClick={() => router.push('/explore')}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Explore Lessons
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {favorites.map((favorite) => (
                            <motion.div
                                key={favorite.lessonId}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl border border-white/10 dark:border-violet-500/20 p-6 hover:border-purple-500 transition-all group"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Star size={20} className="text-yellow-500 fill-current flex-shrink-0" />
                                            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                                                {favorite.lesson?.title || 'Loading...'}
                                            </h3>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                            {favorite.totalTimeSpent > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <Clock size={16} />
                                                    <span>{formatTime(favorite.totalTimeSpent)}</span>
                                                </div>
                                            )}
                                            {favorite.totalResourcesCount > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <BookOpen size={16} />
                                                    <span>
                                                        {favorite.completedResourcesCount}/{favorite.totalResourcesCount} completed
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {favorite.totalResourcesCount > 0 && (
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                                                    <span>Progress</span>
                                                    <span>
                                                        {Math.round((favorite.completedResourcesCount / favorite.totalResourcesCount) * 100)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                                                    <div
                                                        className="bg-purple-500 h-2 rounded-full transition-all"
                                                        style={{
                                                            width: `${(favorite.completedResourcesCount / favorite.totalResourcesCount) * 100}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => router.push(`/lesson/${favorite.lessonId}`)}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                        >
                                            Open
                                            <ArrowRight size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveFavorite(favorite.lessonId, favorite.subjectId)}
                                            className="px-4 py-2 border border-white/20 dark:border-violet-500/30 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg font-medium transition-all flex items-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
