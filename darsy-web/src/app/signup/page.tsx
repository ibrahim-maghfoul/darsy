"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, UserPlus, ChevronRight, Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

import { useTranslations } from "next-intl";

export default function SignupPage() {
    const { register } = useAuth();
    const t = useTranslations('Auth');
    const t_pricing = useTranslations('Pricing');
    const [name, setName] = useState("");
    const [nickname, setNickname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await register(email, password, name, nickname);
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
                    <h1 className="text-4xl font-black text-dark tracking-tight">{t('signup_title')}</h1>
                    <p className="text-muted-foreground">{t('signup_desc')}</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-500 text-sm font-medium rounded-2xl border border-red-100 italic">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-green" size={20} />
                            <input
                                type="text"
                                placeholder={t('fullname')}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-green/5 border border-transparent focus:border-green focus:bg-white focus:ring-4 focus:ring-green/5 outline-none transition-all font-medium"
                                required
                            />
                        </div>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-green" size={20} />
                            <input
                                type="text"
                                placeholder={t('nickname')}
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-green/5 border border-transparent focus:border-green focus:bg-white focus:ring-4 focus:ring-green/5 outline-none transition-all font-medium"
                                required
                            />
                        </div>
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
                                placeholder={t('password') + ' (min. 8 chars, 1 uppercase, 1 number)'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-green/5 border border-transparent focus:border-green focus:bg-white focus:ring-4 focus:ring-green/5 outline-none transition-all font-medium"
                                minLength={8}
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
                                <UserPlus size={20} />
                                {t('signup_btn')}
                            </>
                        )}
                    </button>
                </form>

                <div className="relative text-center space-y-6">
                    <p className="text-muted-foreground text-sm font-medium">
                        {t('have_account')}{" "}
                        <Link href="/login" className="text-green font-bold hover:underline">
                            {t('signin_btn')}
                        </Link>
                    </p>

                    <div className="pt-4 border-t border-green/5">
                        <Link
                            href="/contact"
                            className="group inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-green transition-colors"
                        >
                            <span>{t_pricing('faq_contact')}</span>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
