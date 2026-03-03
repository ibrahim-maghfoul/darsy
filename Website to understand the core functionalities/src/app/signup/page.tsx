'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Chrome, Facebook as FacebookIcon } from 'lucide-react';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp, signInWithGoogle, signInWithFacebook } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await signUp(email, password, name);
            // Redirection is handled by AuthContext (onboarding for new users)
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
            router.push('/explore');
        } catch (err: any) {
            setError(err.message || 'Failed to sign up with Google');
            setLoading(false);
        }
    };

    const handleFacebookSignUp = async () => {
        try {
            setLoading(true);
            await signInWithFacebook();
            router.push('/explore');
        } catch (err: any) {
            setError(err.message || 'Failed to sign up with Facebook');
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
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
                        Or{' '}
                        <Link href="/login" className="font-medium text-purple-600 hover:text-purple-500">
                            sign in to your account
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
                            <label htmlFor="name" className="sr-only">
                                Full name
                            </label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 appearance-none rounded-lg relative block w-full px-3 py-3 border border-white/20 dark:border-violet-500/30 placeholder-zinc-500 dark:placeholder-zinc-400 text-zinc-900 dark:text-zinc-100 bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Full name"
                                />
                            </div>
                        </div>
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
                        <div>
                            <label htmlFor="confirm-password" className="sr-only">
                                Confirm password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                                <input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10 appearance-none rounded-lg relative block w-full px-3 py-3 border border-white/20 dark:border-violet-500/30 placeholder-zinc-500 dark:placeholder-zinc-400 text-zinc-900 dark:text-zinc-100 bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Confirm password"
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
                            {loading ? 'Creating account...' : 'Sign up'}
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

                    <div className="grid grid-cols-2

 gap-3">
                        <button
                            type="button"
                            onClick={handleGoogleSignUp}
                            disabled={loading}
                            className="w-full flex items-center justify-center px-4 py-3 border border-white/20 dark:border-violet-500/30 rounded-lg shadow-sm text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Chrome className="h-5 w-5 mr-2" />
                            Google
                        </button>
                        <button
                            type="button"
                            onClick={handleFacebookSignUp}
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
