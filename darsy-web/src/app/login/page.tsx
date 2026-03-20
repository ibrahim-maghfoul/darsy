"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, Github, Chrome } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useGoogleLogin } from '@react-oauth/google';

import { useTranslations } from "next-intl";

export default function LoginPage() {
    const { login, googleLogin } = useAuth();
    const { showSnackbar } = useSnackbar();
    const t = useTranslations('Auth');
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password, rememberMe);
        } catch (err: any) {
            showSnackbar(err.message || 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            try {
                await googleLogin(tokenResponse.access_token, undefined, rememberMe);
            } catch (err: any) {
                showSnackbar(err.message || 'Google Login failed', 'error');
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            showSnackbar('Google Login Failed', 'error');
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-white to-green/10 p-6 pt-4 md:pt-32">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-8 bg-white p-10 rounded-[40px] border border-green/10 shadow-2xl shadow-green/5"
            >
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black text-dark tracking-tight">{t('signin_title')}</h1>
                    <p className="text-muted-foreground">{t('signin_desc')}</p>
                </div>

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

                    <div className="flex items-center gap-3 px-1">
                        <div className="relative flex items-center justify-center">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-5 h-5 appearance-none rounded-lg border-2 border-green/20 bg-green/5 checked:bg-green checked:border-green transition-all cursor-pointer peer"
                            />
                            <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <label htmlFor="rememberMe" className="text-sm font-medium text-dark/70 cursor-pointer select-none">
                            Remember me for 15 days
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-green text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-green/20 transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-70"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Loading...
                            </>
                        ) : (
                            <>
                                <LogIn size={20} />
                                {t('signin_btn')}
                            </>
                        )}
                    </button>
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-green/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleGoogleLogin()}
                        className="w-full py-4 bg-white border-2 border-green/10 text-dark font-bold rounded-2xl hover:bg-green/5 transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50"
                    >
                        <Chrome size={20} className="text-green" />
                        Google
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
