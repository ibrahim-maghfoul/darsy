"use client";

import { useState } from "react";
import { Facebook, Twitter, Instagram, Youtube, Send, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { DarsyLogo } from "./DarsyLogo";

import { useTranslations } from "next-intl";
import { SOCIALS } from "@/lib/constants";

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
        <footer className="bg-dark text-white/70 py-16 px-[clamp(24px,6vw,80px)] pb-32 md:pb-16 font-roboto relative overflow-hidden">
            {/* Lines Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,1) 0px, rgba(255,255,255,1) 1px, transparent 1px, transparent 12px)`,
                    backgroundSize: '24px 24px'
                }}
            />
            <div className="max-w-[1200px] mx-auto relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.5fr_1fr_1fr_1.5fr] gap-x-8 gap-y-10 pb-12 border-b border-white/10">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-[34px] h-[34px] bg-gradient-to-br from-green to-[#2a8a50] rounded-[10px] flex items-center justify-center shadow-[0_2px_12px_rgba(58,170,106,0.4)] p-1.5">
                                <DarsyLogo className="w-full h-full" color="white" />
                            </div>
                            <span className="text-[15px] font-bold text-white tracking-tight">Darsy</span>
                        </div>
                        <p className="text-sm leading-[1.65] text-white/50 max-w-xs transition-all">
                            {t.rich('desc', { br: () => <br /> })}
                        </p>
                        <div className="flex gap-2">
                            <a href={SOCIALS.twitter} target="_blank" rel="noopener noreferrer" className="w-[32px] h-[32px] rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:bg-green hover:text-white hover:border-green transition-all"><Twitter size={12} /></a>
                            <a href={SOCIALS.instagram} target="_blank" rel="noopener noreferrer" className="w-[32px] h-[32px] rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:bg-green hover:text-white hover:border-green transition-all"><Instagram size={12} /></a>
                            <a href={SOCIALS.facebook} target="_blank" rel="noopener noreferrer" className="w-[32px] h-[32px] rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:bg-green hover:text-white hover:border-green transition-all"><Facebook size={12} /></a>
                            <a href={SOCIALS.youtube} target="_blank" rel="noopener noreferrer" className="w-[32px] h-[32px] rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:bg-green hover:text-white hover:border-green transition-all"><Youtube size={12} /></a>
                        </div>
                    </div>

                    {/* Product Column */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-[11px] font-black tracking-widest uppercase text-white mb-1">{t('product')}</h4>
                        <Link href="/explore" className="text-[13px] text-white/50 hover:text-white transition-colors">{t('explore')}</Link>
                        <Link href="/pricing" className="text-[13px] text-white/50 hover:text-white transition-colors">{t('pricing')}</Link>
                        <Link href="/services" className="text-[13px] text-white/50 hover:text-white transition-colors">{t('services')}</Link>
                        <Link href="/news" className="text-[13px] text-white/50 hover:text-white transition-colors">{t('news')}</Link>
                        <Link href="/instructors" className="text-[13px] text-white/50 hover:text-white transition-colors">{t('instructors')}</Link>
                        <Link href="/download" className="text-[13px] text-white/50 hover:text-white transition-colors">{t('download')}</Link>
                    </div>

                    {/* Company Column */}
                    <div className="flex flex-col gap-3">
                        <h4 className="text-[11px] font-black tracking-widest uppercase text-white mb-1">{t('company')}</h4>
                        <Link href="/about" className="text-[13px] text-white/50 hover:text-white transition-colors">{t('about')}</Link>
                        <Link href="/contact" className="text-[13px] text-white/50 hover:text-white transition-colors">{t('contact')}</Link>
                        <Link href="/report" className="text-[13px] text-white/50 hover:text-white transition-colors">{t('report')}</Link>
                    </div>

                    {/* Newsletter */}
                    <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
                        <h4 className="text-[11px] font-black tracking-widest uppercase text-white mb-1">{t('loop')}</h4>
                        <p className="text-[12px] leading-relaxed text-white/40">
                            {t('loop_desc')}
                        </p>
                        <div className="relative mt-1 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(58,170,106,0.25)', background: 'rgba(58,170,106,0.07)' }}>
                            {/* Dot texture */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{ backgroundImage: 'radial-gradient(circle, rgba(58,170,106,0.18) 1px, transparent 1px)', backgroundSize: '12px 12px' }}
                            />
                            <form onSubmit={handleSubscribe} className="relative flex focus-within:ring-1 focus-within:ring-green/40 rounded-xl transition-all">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder={t('subscribe_placeholder')}
                                    disabled={subStatus === "loading" || subStatus === "success"}
                                    className="flex-1 bg-transparent border-none outline-none p-3 text-sm text-white placeholder:text-white/25 disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={subStatus === "loading" || subStatus === "success"}
                                    className="bg-green hover:bg-[#2a9a5a] text-white px-5 font-bold transition-colors disabled:opacity-60 flex items-center rounded-r-xl"
                                    aria-label="Subscribe"
                                >
                                    {subStatus === "loading" ? <Loader2 size={16} className="animate-spin" /> : subStatus === "success" ? <CheckCircle size={16} /> : <Send size={16} />}
                                </button>
                            </form>
                        </div>
                        {subStatus === "success" && <p className="text-[11px] text-green">✓ {t('subscribe_success')}</p>}
                        {subStatus === "error" && <p className="text-[11px] text-red-400">{t('subscribe_error')}</p>}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between py-6 text-xs text-white/30 gap-4">
                    <span>&copy; {new Date().getFullYear()} Darsy. {t('rights')}</span>
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
