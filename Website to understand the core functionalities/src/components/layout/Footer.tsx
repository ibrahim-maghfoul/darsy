"use client";

import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Linkedin, MessageCircle } from 'lucide-react';

export function Footer() {
    const footerLinks = {
        المنتج: [
            { name: 'استكشف', href: '/explore' },
            { name: 'الأخبار', href: '/news' },
            { name: 'المواد الدراسية', href: '/explore' },
        ],
        الشركة: [
            { name: 'من نحن', href: '#' },
            { name: 'تواصل معنا', href: '/contact' },
            { name: 'المسار المهني', href: '#' },
        ],
        الدعم: [
            { name: 'مركز المساعدة', href: '#' },
            { name: 'البلاغات', href: '/report' },
            { name: 'شروط الخدمة', href: '#' },
            { name: 'سياسة الخصوصية', href: '#' },
        ],
    };

    const socials = [
        { icon: <Facebook size={18} />, href: '#', label: 'Facebook' },
        { icon: <Instagram size={18} />, href: '#', label: 'Instagram' },
        { icon: <Twitter size={18} />, href: '#', label: 'Twitter' },
        { icon: <Linkedin size={18} />, href: '#', label: 'Linkedin' },
        { icon: <MessageCircle size={18} />, href: '#', label: 'WhatsApp' },
    ];

    return (
        <footer
            className="relative mt-24 overflow-hidden"
            style={{ background: "linear-gradient(160deg, #0d0a1f 0%, #172554 60%, #0d0a1f 100%)" }}
        >
            {/* Top glow */}
            <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)" }} />

            {/* Blob */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full -translate-y-1/2 pointer-events-none"
                style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.18) 0%, transparent 70%)", filter: "blur(40px)" }} />

            {/* Site Name pill */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="p-2 rounded-full" style={{ background: "#09090b" }}>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-xl font-extrabold text-white transition-all hover:scale-105"
                        style={{
                            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                            boxShadow: "0 4px 24px rgba(59,130,246,0.55)",
                        }}
                    >
                        📖 9eray
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    {/* Brand column */}
                    <div className="col-span-1">
                        <p className="text-sm text-zinc-400 leading-relaxed text-center md:text-left">
                            منصة 9eray — التعليم الرقمي للجيل القادم. دروس شاملة، مسارات مخصصة، ومحتوى تعليمي عالي الجودة.
                        </p>
                        {/* Social icons */}
                        <div className="flex justify-center md:justify-start gap-2 mt-5">
                            {socials.map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    aria-label={s.label}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 transition-all hover:text-white hover:scale-110"
                                    style={{
                                        background: "rgba(59,130,246,0.08)",
                                        border: "1px solid rgba(59,130,246,0.2)",
                                    }}
                                >
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">{category}</h3>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-zinc-400 hover:text-blue-300 transition-colors"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Newsletter */}
                <div className="mt-12 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
                    style={{
                        background: "rgba(59,130,246,0.08)",
                        border: "1px solid rgba(59,130,246,0.2)",
                    }}>
                    <div>
                        <p className="text-sm font-semibold text-white">ابقَ على اطلاع دائم</p>
                        <p className="text-xs text-zinc-400 mt-0.5">اشترك في نشرتنا الإخبارية لتصلك آخر الأخبار التربوية.</p>
                    </div>
                    <form className="flex gap-2 w-full md:w-auto" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="email"
                            placeholder="أدخل بريدك الإلكتروني"
                            className="flex-1 md:w-56 px-4 py-2 text-sm rounded-lg bg-white/5 border border-blue-500/20 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                            style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
                        >
                            اشتراك
                        </button>
                    </form>
                </div>

                {/* Bottom bar */}
                <div className="mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
                    style={{ borderTop: "1px solid rgba(59,130,246,0.15)" }}>
                    <p className="text-xs text-zinc-500">
                        © {new Date().getFullYear()} 9eray. جميع الحقوق محفوظة.
                    </p>
                    <div className="flex gap-4">
                        {['شروط الخدمة', 'الخصوصية', 'الاتصال'].map((l) => (
                            <a key={l} href="#" className="text-xs text-zinc-500 hover:text-blue-300 transition-colors">{l}</a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
