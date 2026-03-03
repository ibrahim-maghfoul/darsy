"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, Github, Chrome } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

import { useTranslations } from "next-intl";

export default function LoginPage() {
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
                <div className="text-center space-y-2">
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
