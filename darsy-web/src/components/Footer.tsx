"use client";

import { useState } from "react";
import { Facebook, Twitter, Instagram, Youtube, Send, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

import { useTranslations } from "next-intl";

export function Footer() {
    const t = useTranslations('Footer');
    const [email, setEmail] = useState("");
    const [subStatus, setSubStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setSubStatus("loading");
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/newsletter/subscribe`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                }
            );
            if (res.ok) {
                setSubStatus("success");
                setEmail("");
            } else {
                setSubStatus("error");
            }
        } catch {
            setSubStatus("error");
        }
        setTimeout(() => setSubStatus("idle"), 4000);
    };

    return (
        <footer className="bg-dark text-white/70 py-16 px-[clamp(24px,6vw,80px)] font-roboto">
            <div className="max-w-[1200px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-[1.4fr_2fr_1.4fr] gap-12 pb-12 border-b border-white/10">
                    {/* Brand Column */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-[34px] h-[34px] bg-gradient-to-br from-green to-[#2a8a50] rounded-[10px] flex items-center justify-center text-white font-black text-base shadow-[0_2px_12px_rgba(58,170,106,0.4)]">
                                D
                            </div>
                            <span className="text-[15px] font-bold text-white tracking-tight">Darsy</span>
                        </div>
                        <p className="text-sm leading-[1.65] text-white/50">
                            {t.rich('desc', { br: () => <br /> })}
                        </p>
                        <div className="flex gap-2">
                            <a
                                href="https://twitter.com/darsyio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-[34px] h-[34px] rounded-full border border-white/15 flex items-center justify-center text-white/55 hover:bg-green hover:text-white hover:border-green transition-all"
                                aria-label="Twitter"
                            >
                                <Twitter size={13} />
                            </a>
                            <a
                                href="https://instagram.com/darsyio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-[34px] h-[34px] rounded-full border border-white/15 flex items-center justify-center text-white/55 hover:bg-green hover:text-white hover:border-green transition-all"
                                aria-label="Instagram"
                            >
                                <Instagram size={13} />
                            </a>
                            <a
                                href="https://facebook.com/darsyio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-[34px] h-[34px] rounded-full border border-white/15 flex items-center justify-center text-white/55 hover:bg-green hover:text-white hover:border-green transition-all"
                                aria-label="Facebook"
                            >
                                <Facebook size={13} />
                            </a>
                            <a
                                href="https://youtube.com/@darsyio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-[34px] h-[34px] rounded-full border border-white/15 flex items-center justify-center text-white/55 hover:bg-green hover:text-white hover:border-green transition-all"
                                aria-label="YouTube"
                            >
                                <Youtube size={13} />
                            </a>
                        </div>
                    </div>

                    {/* Links Group */}
                    <div className="flex gap-14 sm:gap-20">
                        <div className="flex flex-col gap-3">
                            <h4 className="text-[11px] font-bold tracking-widest uppercase text-white mb-1">{t('product')}</h4>
                            <Link href="/explore" className="text-sm text-white/50 hover:text-white transition-colors">{t('explore')}</Link>
                            <Link href="/pricing" className="text-sm text-white/50 hover:text-white transition-colors">{t('pricing')}</Link>
                            <Link href="/news" className="text-sm text-white/50 hover:text-white transition-colors">{t('news')}</Link>
                            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{t('changelog')}</a>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h4 className="text-[11px] font-bold tracking-widest uppercase text-white mb-1">{t('community')}</h4>
                            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{t('forum')}</a>
                            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{t('events')}</a>
                            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{t('mentorship')}</a>
                            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{t('newsletter')}</a>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h4 className="text-[11px] font-bold tracking-widest uppercase text-white mb-1">{t('company')}</h4>
                            <Link href="/about" className="text-sm text-white/50 hover:text-white transition-colors">{t('about')}</Link>
                            <Link href="/news" className="text-sm text-white/50 hover:text-white transition-colors">{t('blog')}</Link>
                            <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{t('careers')}</a>
                            <Link href="/contact" className="text-sm text-white/50 hover:text-white transition-colors">{t('contact')}</Link>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-[11px] font-bold tracking-widest uppercase text-white mb-1">{t('loop')}</h4>
                        <p className="text-[13px] leading-[1.65] text-white/45">
                            {t('loop_desc')}
                        </p>
                        <form onSubmit={handleSubscribe} className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-green transition-colors mt-1">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder={t('subscribe_placeholder')}
                                disabled={subStatus === "loading" || subStatus === "success"}
                                className="flex-1 bg-transparent border-none outline-none p-3 text-sm text-white placeholder:text-white/30 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={subStatus === "loading" || subStatus === "success"}
                                className="bg-green hover:bg-[#2a9a5a] text-white px-5 font-bold transition-colors disabled:opacity-60 flex items-center"
                                aria-label="Subscribe"
                            >
                                {subStatus === "loading" ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : subStatus === "success" ? (
                                    <CheckCircle size={16} />
                                ) : (
                                    <Send size={16} />
                                )}
                            </button>
                        </form>
                        {subStatus === "success" && (
                            <p className="text-[12px] text-green">✓ {t('subscribe_success')}</p>
                        )}
                        {subStatus === "error" && (
                            <p className="text-[12px] text-red-400">{t('subscribe_error')}</p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between py-6 text-xs text-white/30 gap-4">
                    <span>&copy; 2025 Darsy. {t('rights')}</span>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-white transition-colors">{t('privacy')}</Link>
                        <a href="#" className="hover:text-white transition-colors">{t('terms')}</a>
                        <a href="#" className="hover:text-white transition-colors">{t('cookies')}</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
