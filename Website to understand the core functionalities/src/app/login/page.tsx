'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Chrome, Facebook as FacebookIcon } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signInWithGoogle, signInWithFacebook } = useAuth();
    const notification = useNotification();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            notification.showNotification('Welcome back! Login successful.', 'success');
            router.push('/explore');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
            notification.showNotification(err.message || 'Failed to sign in', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
            notification.showNotification('Welcome! Signed in with Google.', 'success');
            router.push('/explore');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google');
            notification.showNotification(err.message || 'Failed to sign in with Google', 'error');
            setLoading(false);
        }
    };

    const handleFacebookSignIn = async () => {
        try {
            setLoading(true);
            await signInWithFacebook();
            notification.showNotification('Welcome! Signed in with Facebook.', 'success');
            router.push('/explore');
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Facebook');
            notification.showNotification(err.message || 'Failed to sign in with Facebook', 'error');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full space-y-8"
            >
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
                        Or{' '}
                        <Link href="/signup" className="font-medium text-purple-600 hover:text-purple-500">
                            create a new account
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 appearance-none rounded-lg relative block w-full px-3 py-3 border border-white/20 dark:border-violet-500/30 placeholder-zinc-500 dark:placeholder-zinc-400 text-zinc-900 dark:text-zinc-100 bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Email address"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 appearance-none rounded-lg relative block w-full px-3 py-3 border border-white/20 dark:border-violet-500/30 placeholder-zinc-500 dark:placeholder-zinc-400 text-zinc-900 dark:text-zinc-100 bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Password"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/20 dark:border-violet-500/30"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-zinc-50 dark:bg-zinc-950 text-zinc-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full flex items-center justify-center px-4 py-3 border border-white/20 dark:border-violet-500/30 rounded-lg shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Chrome className="h-5 w-5 mr-2" />
                            Google
                        </button>
                        <button
                            type="button"
                            onClick={handleFacebookSignIn}
                            disabled={loading}
                            className="w-full flex items-center justify-center px-4 py-3 border border-white/20 dark:border-violet-500/30 rounded-lg shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <FacebookIcon className="h-5 w-5 mr-2" />
                            Facebook
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
