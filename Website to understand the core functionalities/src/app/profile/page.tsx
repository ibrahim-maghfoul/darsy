'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserDocument, updateUserDocument, UserData } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User as UserIcon, Upload, BookOpen, Clock, TrendingUp, Settings } from 'lucide-react';
import Link from 'next/link';
import GradesCalculator from '@/components/GradesCalculator';
import { getEducationCategory } from '@/lib/utils';
import api from '@/lib/api';
import { getGuidanceStats } from '@/services/data';

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            loadUserData();
        }
    }, [user, authLoading]);

    const loadUserData = async () => {
        if (!user) return;

        try {
            const data = await getUserDocument(user.id);
            if (data) {
                setUserData(data);

                // Fetch guidance stats if available
                const guidanceId = data.selectedPath?.guidanceId;
                if (guidanceId) {
                    const guidanceStats = await getGuidanceStats(guidanceId);
                    setStats(guidanceStats);
                }
            } else {
                // Create initial user data if doesn't exist
                const initialData: Partial<UserData> = {
                    displayName: user.name || '',
                    email: user.email || '',
                    photoURL: user.profilePicture || undefined,
                };
                await updateUserDocument(user.id, initialData as any);
                setUserData(initialData as UserData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('photo', file);

            const res = await api.post('/user/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const photoURL = res.data.photoURL;

            // Update local state
            setUserData((prev) => prev ? { ...prev, photoURL } : null);

            // Note: In a real app, you might want to refresh the user context too
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!user || !userData) return null;

    const progressPercentage = userData.progress?.totalLessons
        ? Math.round((userData.progress.completedLessons / userData.progress.totalLessons) * 100)
        : 0;

    const educationCategory = getEducationCategory(userData.level?.school, userData.level?.level);

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 pt-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Profile Header */}
                <div className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                                {userData.photoURL || user.profilePicture ? (
                                    <img
                                        src={userData.photoURL || user.profilePicture || ''}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <UserIcon className="w-16 h-16 text-zinc-400" />
                                )}
                            </div>
                            <label
                                htmlFor="photo-upload"
                                className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full cursor-pointer transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                <input
                                    id="photo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                                <h1 className="text-3xl font-bold">
                                    {userData.displayName || user.name || 'User'}
                                </h1>
                                <Link
                                    href="/settings"
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-purple-600"
                                    title="Settings"
                                >
                                    <Settings className="w-5 h-5" />
                                </Link>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                                {userData.email || user.email}
                            </p>
                            {userData.level && (
                                <div className="flex flex-col gap-1 items-center md:items-start w-full">
                                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold capitalize">
                                            {educationCategory} Level Student
                                        </span>
                                        {userData.isPremium && (
                                            <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-semibold flex items-center gap-1">
                                                ⭐ Premium
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                        <span>{userData.level.school}</span>
                                        <span className="opacity-50">/</span>
                                        <span>{userData.level.level}</span>
                                        <span className="opacity-50">/</span>
                                        <span className="text-purple-600 dark:text-purple-400 font-medium">{userData.level.guidance}</span>
                                    </div>
                                </div>
                            )}
                            {!userData.level && (
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                                        Student
                                    </span>
                                    {userData.isPremium && (
                                        <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-semibold flex items-center gap-1">
                                            ⭐ Premium
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Progress Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">Study Time</p>
                                <p className="text-2xl font-bold">
                                    {Math.floor((userData.progress?.learningTime || 0) / 60)}h {Math.round((userData.progress?.learningTime || 0) % 60)}m
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <BookOpen className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">PDFs Read</p>
                                <p className="text-2xl font-bold">
                                    {userData.progress?.documentsOpened || 0}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">Videos Watched</p>
                                <p className="text-2xl font-bold">
                                    {userData.progress?.videosWatched || 0}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg p-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                <UserIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">Favorites</p>
                                <p className="text-2xl font-bold">
                                    {userData.lessonProgress ?
                                        Object.values(userData.lessonProgress).filter((lesson: any) => lesson.isFavorite).length
                                        : 0}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Overall Progress Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg p-6"
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Overall Progress</h2>
                        {stats && (
                            <span className="text-sm font-medium text-zinc-500">
                                {userData.progress?.documentsOpened || 0} / {stats.totalPdfs} PDFs
                            </span>
                        )}
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-4">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-purple-500 h-4 rounded-full transition-all duration-500"
                            style={{
                                width: `${stats && stats.totalPdfs > 0
                                    ? Math.round(((userData.progress?.documentsOpened || 0) / stats.totalPdfs) * 100)
                                    : progressPercentage}%`
                            }}
                        ></div>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                        Keep going! You're doing great.
                    </p>
                </motion.div>

                {userData.level && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <GradesCalculator userLevel={educationCategory} />
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}
