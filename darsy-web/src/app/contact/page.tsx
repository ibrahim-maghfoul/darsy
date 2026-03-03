"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, User, Send, CheckCircle, MapPin, Phone } from "lucide-react";
import api from "@/lib/api";

const subjects = [
    "General Inquiry",
    "Technical Support",
    "Billing & Payments",
    "Partnership",
    "Content Request",
    "Other",
];

import { useTranslations } from "next-intl";

export default function ContactPage() {
    const t = useTranslations('Contact');
    const [form, setForm] = useState({ name: "", email: "", subject: subjects[0], message: "" });
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) return;
        setStatus("sending");
        try {
            await api.post('/contact', form);
            setStatus("sent");
        } catch (error) {
            console.error('Contact submit error:', error);
            setStatus("error");
        }
    };

    const inputClass = "w-full px-5 py-3.5 rounded-2xl border border-green/15 bg-green/[0.02] text-dark placeholder:text-muted-foreground focus:outline-none focus:border-green focus:bg-white transition-all text-sm font-medium";

    if (status === "sent") {
        return (
            <div className="min-h-screen flex items-center justify-center pt-32 pb-20 px-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-6 max-w-md"
                >
                    <div className="w-24 h-24 bg-green/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={48} className="text-green" />
                    </div>
                    <h2 className="text-3xl font-bold text-dark">{t('sent_title')}</h2>
                    <p className="text-muted-foreground">{t('sent_desc')}</p>
                    <button onClick={() => { setForm({ name: "", email: "", subject: subjects[0], message: "" }); setStatus("idle"); }} className="px-8 py-3 bg-green text-white font-bold rounded-2xl hover:scale-105 transition-all">
                        {t('send_btn')}
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pt-32 pb-20 px-[clamp(20px,6vw,80px)]">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 text-green text-sm font-bold">
                        <MessageSquare size={16} />
                        {t('touch')}
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-dark">
                        {t('title')}<span className="text-green">{t('title_highlight')}</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-xl mx-auto">
                        {t('desc')}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-16 items-start">
                    {/* Info column */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-8"
                    >
                        <div className="space-y-6">
                            {[
                                { icon: Mail, label: t('email_us'), value: "hello@darsy.io", href: "mailto:hello@darsy.io" },
                                { icon: Phone, label: t('call_us'), value: "+213 555 000 123", href: "tel:+213555000123" },
                                { icon: MapPin, label: t('find_us'), value: "Algiers, Algeria", href: "#" },
                            ].map((item, i) => (
                                <a key={i} href={item.href} className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 rounded-2xl bg-green/10 flex items-center justify-center text-green group-hover:bg-green group-hover:text-white transition-all">
                                        <item.icon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.label}</p>
                                        <p className="font-bold text-dark">{item.value}</p>
                                    </div>
                                </a>
                            ))}
                        </div>

                        {/* Response time callout */}
                        <div className="bg-green/5 border border-green/15 rounded-[28px] p-6 space-y-2">
                            <h3 className="font-bold text-dark">⚡ {t('fast_response')}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {t('fast_desc')}
                            </p>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <motion.form
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        onSubmit={handleSubmit}
                        className="bg-white rounded-[40px] border border-green/10 shadow-2xl shadow-green/5 p-10 space-y-6"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-dark/60 uppercase tracking-wide">{t('fullname')}</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Your name"
                                        className={`${inputClass} pl-10`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-dark/60 uppercase tracking-wide">Email</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        placeholder={t('email_placeholder')}
                                        className={`${inputClass} pl-10`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-dark/60 uppercase tracking-wide">{t('subject')}</label>
                            <select
                                name="subject"
                                value={form.subject}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-dark/60 uppercase tracking-wide">{t('message')}</label>
                            <textarea
                                name="message"
                                value={form.message}
                                onChange={handleChange}
                                required
                                rows={6}
                                placeholder="Tell us how we can help..."
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        {status === "error" && (
                            <p className="text-red-500 text-sm font-bold text-center">
                                Failed to send message. Please try again.
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={status === "sending"}
                            className="w-full py-4 bg-green text-white font-bold rounded-2xl hover:scale-[1.02] hover:shadow-xl hover:shadow-green/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {status === "sending" ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    {t('sending')}
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    {t('send_btn')}
                                </>
                            )}
                        </button>
                    </motion.form>
                </div>
            </div>
        </div>
    );
}
