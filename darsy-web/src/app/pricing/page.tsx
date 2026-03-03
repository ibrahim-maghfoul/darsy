"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Check, Zap, Star, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
};

import { useTranslations, useLocale } from "next-intl";

export default function PricingPage() {
    const t = useTranslations('Pricing');
    const locale = useLocale();
    const isRtl = locale === 'ar';
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const plans = [
        {
            name: t('free_name'),
            price: "0",
            period: t('forever'),
            description: t('free_desc'),
            color: "border-green/20",
            buttonStyle: "bg-green/5 text-green hover:bg-green/10 border border-green/20",
            badge: null,
            savings: null,
            features: [
                t('f1'),
                t('ni3'), // Offline downloads (up to 10 files)
                t('f2'),
                t('f3'),
                t('f4'),
                t('f5'),
            ],
            notIncluded: [
                t('ni1'),
                t('ni4'),
            ],
        },
        {
            name: t('pro_name'),
            price: billingCycle === 'monthly' ? "100" : "900",
            period: billingCycle === 'monthly' ? t('month') : t('year'),
            description: t('pro_desc'),
            color: "border-green/60",
            buttonStyle: "bg-green text-white hover:bg-green/90 shadow-lg shadow-green/20",
            badge: t('most_popular'),
            badgeIcon: Star,
            savings: billingCycle === 'yearly' ? t('save_amount', { amount: 300 }) : null,
            features: [
                t('f22'), // Access premium lessons
                t('f21'), // No ads
                t('f8'),  // Offline downloads (up to 100 files)
                t('f12'),
                t('f6'),
                t('f9'),
                t('f10'),
            ],
            notIncluded: [
                t('ni5'),
                t('ni6'),
            ],
        },
        {
            name: t('premium_name'),
            price: billingCycle === 'monthly' ? "200" : "1900",
            period: billingCycle === 'monthly' ? t('month') : t('year'),
            description: t('premium_desc'),
            color: "border-[#D4AF37]/30",
            buttonStyle: "bg-gradient-to-r from-[#D4AF37] to-[#F9D423] text-white font-black hover:scale-[1.02] shadow-lg shadow-[#D4AF37]/20 border-none",
            badge: t('best_value'),
            badgeIcon: Sparkles,
            isPremium: true,
            savings: billingCycle === 'yearly' ? t('save_amount', { amount: 500 }) : null,
            features: [
                t('f13'),
                t('f14'),
                t('f15'),
                t('f17'),
                t('f18'),
            ],
            notIncluded: [],
        },
    ];

    const faqs = [
        { q: t('faq1_q'), a: t('faq1_a') },
        { q: t('faq2_q'), a: t('faq2_a') },
        { q: t('faq3_q'), a: t('faq3_a') },
        { q: t('faq4_q'), a: t('faq4_a') },
    ];

    return (
        <div className="min-h-screen bg-white pt-32 pb-20 overflow-hidden">

            {/* Hero */}
            <section className="relative px-[clamp(20px,6vw,80px)] pb-16 text-center">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green/5 rounded-full blur-[100px]" />
                </div>
                <div className="relative z-10 max-w-3xl mx-auto space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 text-green text-sm font-bold"
                    >
                        <Zap size={16} />
                        {t('simple')}
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-6xl font-extrabold tracking-tight text-dark"
                    >
                        {t('title')} <span className="text-green">{t('title_highlight')}</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-muted-foreground"
                    >
                        {t('desc')}
                    </motion.p>
                </div>
            </section>

            {/* Billing Toggle */}
            <section className="px-[clamp(20px,6vw,80px)] mb-16 relative z-20">
                <div className="max-w-xl mx-auto text-center space-y-4">
                    <div className="flex justify-center items-center gap-6">
                        <span className={`text-base font-bold transition-colors ${billingCycle === 'monthly' ? 'text-dark' : 'text-muted-foreground'}`}>
                            {t('monthly')}
                        </span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className="relative w-16 h-8 rounded-full bg-green/10 border border-green/20 p-1 transition-colors hover:bg-green/20 cursor-pointer"
                        >
                            <motion.div
                                animate={{ x: billingCycle === 'monthly' ? 0 : (isRtl ? -32 : 32) }}
                                className={`w-6 h-6 rounded-full shadow-sm ${billingCycle === 'yearly' ? 'bg-[#D4AF37]' : 'bg-green'}`}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </button>
                        <div className="flex items-center gap-3">
                            <span className={`text-base font-bold transition-colors ${billingCycle === 'yearly' ? 'text-dark' : 'text-muted-foreground'}`}>
                                {t('yearly')}
                            </span>
                            <div className="px-3 py-1 rounded-full bg-green text-white text-[11px] font-black uppercase tracking-wider shadow-lg shadow-green/20 animate-pulse">
                                {t('save_amount', { amount: "300-500" })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="px-[clamp(20px,6vw,80px)]">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className={`relative bg-white rounded-[36px] border-2 ${plan.color} p-8 shadow-xl flex flex-col transition-all duration-300 ${plan.badge === t('most_popular') ? "md:-translate-y-4 md:scale-[1.03]" : ""}`}
                        >
                            {/* Badge */}
                            {plan.badge && (
                                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full shadow-lg whitespace-nowrap ${(plan as any).isPremium ? 'bg-gradient-to-r from-[#D4AF37] to-[#F9D423] text-white shadow-[#D4AF37]/30' : 'bg-green text-white shadow-green/20'}`}>
                                    {plan.badgeIcon && <plan.badgeIcon size={13} className="fill-current" />}
                                    {plan.badge}
                                </div>
                            )}

                            {/* Plan header */}
                            <div className="space-y-2 mb-6">
                                <h2 className="text-2xl font-black text-dark">{plan.name}</h2>
                                <p className="text-muted-foreground text-sm">{plan.description}</p>
                            </div>

                            {/* Price */}
                            <div className="flex flex-col mb-8">
                                <div className="flex items-end gap-1">
                                    <span className={`text-6xl font-black leading-none ${(plan as any).isPremium ? 'text-[#D4AF37]' : 'text-dark dark:text-white'}`}>{plan.price}</span>
                                    <span className="text-muted-foreground font-bold text-xl">{t('currency')}</span>
                                    <span className="text-muted-foreground font-medium mb-2">/{plan.period}</span>
                                </div>
                                {plan.savings && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mt-2 inline-flex"
                                    >
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${plan.isPremium ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-green/10 text-green'}`}>
                                            {plan.savings}
                                        </span>
                                    </motion.div>
                                )}
                            </div>

                            {/* CTA */}
                            <Link
                                href={plan.price === "0" ? "/signup" : "/signup"}
                                className={`w-full py-3.5 rounded-2xl font-bold text-center flex items-center justify-center gap-2 transition-all hover:scale-[1.02] mb-8 ${plan.buttonStyle}`}
                            >
                                {plan.price === "0" ? t('start_free') : t('start_plan', { plan: plan.name })}
                                <ArrowRight size={18} className={isRtl ? "rotate-180" : ""} />
                            </Link>

                            {/* Features */}
                            <div className="space-y-3 flex-1">
                                {plan.features.map((f, j) => (
                                    <div key={j} className="flex items-start gap-3">
                                        <div className="mt-0.5 w-5 h-5 rounded-full bg-green/10 flex items-center justify-center shrink-0">
                                            <Check size={12} className="text-green font-black" />
                                        </div>
                                        <span className="text-sm text-dark/70">{f}</span>
                                    </div>
                                ))}
                                {plan.notIncluded.map((f, j) => (
                                    <div key={j} className="flex items-start gap-3 opacity-35">
                                        <div className="mt-0.5 w-5 h-5 rounded-full bg-dark/5 flex items-center justify-center shrink-0">
                                            <span className="text-dark/40 text-xs font-bold">—</span>
                                        </div>
                                        <span className="text-sm text-dark/40 line-through">{f}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* FAQ-style trust section */}
            <section className="py-20 px-[clamp(20px,6vw,80px)]">
                <motion.div
                    {...fadeUp}
                    className="max-w-4xl mx-auto text-center space-y-12"
                >
                    <h2 className="text-3xl font-bold text-dark">{t('faq_title')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-green/[0.03] border border-green/10 rounded-[24px] p-6 space-y-2">
                                <h3 className="font-bold text-dark">{faq.q}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-10 flex justify-center">
                        <Link
                            href="/contact"
                            className="group inline-flex items-center gap-3 px-8 py-4 bg-dark/5 hover:bg-dark text-dark hover:text-white rounded-full font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 border border-dark/10 hover:border-dark shadow-sm hover:shadow-xl hover:shadow-dark/10"
                        >
                            <span>{t('faq_contact').replace(' →', '')}</span>
                            <ArrowRight size={20} className={`transition-transform duration-300 group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                        </Link>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
