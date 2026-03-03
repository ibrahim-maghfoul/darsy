'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserDocument, updateUserDocument, deleteUserDocument, UserData } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Moon, Sun, Monitor, Save, Trash2, AlertTriangle, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNotification } from '@/contexts/NotificationContext';
import GradesCalculator from '@/components/GradesCalculator';
import { getEducationCategory, type EducationLevel } from '@/lib/utils';
import { deleteUser } from 'firebase/auth';

export default function SettingsPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const notification = useNotification();

    const [notifications, setNotifications] = useState(true);
    const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [selectedLevel, setSelectedLevel] = useState<EducationLevel>('middle');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            loadUserData();
        }
    }, [user, authLoading]);

    useEffect(() => {
        if (theme) {
            setSelectedTheme(theme as any);
        }
    }, [theme]);

    const loadUserData = async () => {
        if (!user) return;

        try {
            const data = await getUserDocument(user.uid);
            if (data) {
                setUserData(data);
                setNotifications(data.settings?.notifications ?? true);
                setSelectedTheme(data.settings?.theme || 'system');
                setSelectedLevel(getEducationCategory(data.level?.school, data.level?.level));
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);

        try {
            await updateUserDocument(user.uid, {
                // We no longer save category
                settings: {
                    notifications,
                    theme: selectedTheme,
                },
            } as any);

            setTheme(selectedTheme);
            notification.showNotification('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            notification.showNotification('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;

        setDeleting(true);

        try {
            // Delete Firestore data
            await deleteUserDocument(user.uid);

            // Delete Firebase Auth account
            await deleteUser(user);

            notification.showNotification('Account deleted successfully', 'success');

            // Redirect to home
            setTimeout(() => {
                router.push('/');
            }, 1000);
        } catch (error: any) {
            console.error('Error deleting account:', error);
            if (error.code === 'auth/requires-recent-login') {
                notification.showNotification('Please log in again to delete your account', 'error');
                await logout();
                router.push('/login');
            } else {
                notification.showNotification('Failed to delete account', 'error');
            }
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 pt-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <h1 className="text-3xl font-bold mb-8">Settings</h1>

                {/* Educational Level */}
                <div className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg p-6">
                    <h3 className="font-semibold text-lg mb-4">Educational Level</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {(['primary', 'middle', 'secondary'] as EducationLevel[]).map((level) => (
                            <button
                                key={level}
                                onClick={() => setSelectedLevel(level)}
                                className={`p-4 rounded-lg border-2 transition-all ${selectedLevel === level
                                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                    : 'border-white/20 dark:border-violet-500/30 hover:border-zinc-400 dark:hover:border-zinc-600'
                                    }`}
                            >
                                <p className="font-medium capitalize">{level}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notifications */}
                <div className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <Bell className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Notifications</h3>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                    Receive updates about your progress
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={notifications}
                                onChange={(e) => setNotifications(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>
                </div>

                {/* Theme */}
                <div className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg p-6">
                    <h3 className="font-semibold text-lg mb-4">Appearance</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => setSelectedTheme('light')}
                            className={`p-4 rounded-lg border-2 transition-all ${selectedTheme === 'light'
                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-white/20 dark:border-violet-500/30 hover:border-zinc-400 dark:hover:border-zinc-600'
                                }`}
                        >
                            <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                            <p className="text-sm font-medium">Light</p>
                        </button>
                        <button
                            onClick={() => setSelectedTheme('dark')}
                            className={`p-4 rounded-lg border-2 transition-all ${selectedTheme === 'dark'
                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-white/20 dark:border-violet-500/30 hover:border-zinc-400 dark:hover:border-zinc-600'
                                }`}
                        >
                            <Moon className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                            <p className="text-sm font-medium">Dark</p>
                        </button>
                        <button
                            onClick={() => setSelectedTheme('system')}
                            className={`p-4 rounded-lg border-2 transition-all ${selectedTheme === 'system'
                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-white/20 dark:border-violet-500/30 hover:border-zinc-400 dark:hover:border-zinc-600'
                                }`}
                        >
                            <Monitor className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                            <p className="text-sm font-medium">System</p>
                        </button>
                    </div>
                </div>

                {/* Grades Calculator */}
                <GradesCalculator userLevel={selectedLevel} />

                {/* Save Button */}
                <div className="flex justify-end gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-900 p-6">
                    <h3 className="font-semibold text-lg text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                        Once you delete your account, there is no going back. This action cannot be undone.
                    </p>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Trash2 className="w-5 h-5" />
                        Delete Account
                    </button>
                </div>
            </motion.div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl p-6 max-w-md w-full"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold">Delete Account?</h3>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                                This action is permanent and cannot be undone. All your data, progress, and settings will be deleted.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 px-4 py-2 border border-white/20 dark:border-violet-500/30 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleting}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                                >
                                    {deleting ? 'Deleting...' : 'Delete Forever'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
