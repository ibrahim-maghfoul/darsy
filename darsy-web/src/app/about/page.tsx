"use client";

import { motion } from "framer-motion";
import { Sparkles, Target, Users, Zap, Globe, Heart, ChevronRight, ArrowRight, BookOpen, Lightbulb, Award } from "lucide-react";
import Link from "next/link";

const values = [
    {
        icon: Target,
        title: "Mission-Driven",
        description: "Every feature we build is rooted in a single goal — making quality education accessible to every student, everywhere.",
        color: "text-green",
        bg: "bg-green/10",
    },
    {
        icon: Lightbulb,
        title: "Innovation First",
        description: "We constantly push the boundaries of how learning can be delivered, mixing AI with interactive content.",
        color: "text-amber-500",
        bg: "bg-amber-50",
    },
    {
        icon: Heart,
        title: "Student-Centered",
        description: "Students are at the heart of every decision. We listen, learn and iterate based on real feedback.",
        color: "text-red-500",
        bg: "bg-red-50",
    },
    {
        icon: Globe,
        title: "Global Reach",
        description: "Available in multiple languages and designed for every culture, Darsy is built for the whole world.",
        color: "text-blue-500",
        bg: "bg-blue-50",
    },
];

const stats = [
    { value: "50K+", label: "Active Students" },
    { value: "1,200+", label: "Lessons Available" },
    { value: "50+", label: "Partner Schools" },
    { value: "4.9★", label: "Average Rating" },
];

const team = [
    { name: "Ahmed Karimi", role: "CEO & Co-founder", initials: "AK", color: "bg-green" },
    { name: "Sara Benali", role: "Head of Education", initials: "SB", color: "bg-blue-500" },
    { name: "Omar Talib", role: "Lead Engineer", initials: "OT", color: "bg-amber-500" },
    { name: "Lina Mourad", role: "Product Designer", initials: "LM", color: "bg-purple-500" },
    { name: "Karim Djebbar", role: "Content Director", initials: "KD", color: "bg-red-500" },
    { name: "Yasmine Cherif", role: "Community Lead", initials: "YC", color: "bg-cyan-500" },
];

const milestones = [
    { year: "2021", title: "Founded in Algiers", desc: "Darsy was born out of a shared frustration — quality education felt out of reach for many students." },
    { year: "2022", title: "First 1,000 Students", desc: "Word spread quickly. Within months, students across Algeria were using Darsy to prepare for exams." },
    { year: "2023", title: "National Expansion", desc: "We partnered with 20 schools and launched our mobile apps, reaching 10,000 active users." },
    { year: "2024", title: "Going Global", desc: "Available in Arabic, French & English, Darsy now serves students across the MENA region and beyond." },
];

const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
};

import { useTranslations } from "next-intl";

export default function AboutPage() {
    const t = useTranslations('About');

    const values = [
        {
            icon: Target,
            title: t('v1_title'),
            description: t('v1_desc'),
            color: "text-green",
            bg: "bg-green/10",
        },
        {
            icon: Lightbulb,
            title: t('v2_title'),
            description: t('v2_desc'),
            color: "text-amber-500",
            bg: "bg-amber-50",
        },
        {
            icon: Heart,
            title: t('v3_title'),
            description: t('v3_desc'),
            color: "text-red-500",
            bg: "bg-red-50",
        },
        {
            icon: Globe,
            title: t('v4_title'),
            description: t('v4_desc'),
            color: "text-blue-500",
            bg: "bg-blue-50",
        },
    ];

    const stats = [
        { value: "50K+", label: t('stats_students') },
        { value: "1,200+", label: t('stats_lessons') },
        { value: "50+", label: t('stats_schools') },
        { value: "4.9★", label: t('stats_rating') },
    ];

    const team = [
        { name: "Ahmed Karimi", role: "CEO & Co-founder", initials: "AK", color: "bg-green" },
        { name: "Sara Benali", role: "Head of Education", initials: "SB", color: "bg-blue-500" },
        { name: "Omar Talib", role: "Lead Engineer", initials: "OT", color: "bg-amber-500" },
        { name: "Lina Mourad", role: "Product Designer", initials: "LM", color: "bg-purple-500" },
        { name: "Karim Djebbar", role: "Content Director", initials: "KD", color: "bg-red-500" },
        { name: "Yasmine Cherif", role: "Community Lead", initials: "YC", color: "bg-cyan-500" },
    ];

    const milestones = [
        { year: "2021", title: t('m1_title'), desc: t('m1_desc') },
        { year: "2022", title: t('m2_title'), desc: t('m2_desc') },
        { year: "2023", title: t('m3_title'), desc: t('m3_desc') },
        { year: "2024", title: t('m4_title'), desc: t('m4_desc') },
    ];

    return (
        <div className="min-h-screen bg-white overflow-hidden">

            {/* ─── HERO ─── */}
            <section className="relative pt-40 pb-28 px-[clamp(20px,6vw,80px)] text-center overflow-hidden">
                {/* Background blobs */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-green/5 rounded-full blur-[120px]" />
                    <div className="absolute top-20 left-10 w-72 h-72 bg-green/8 rounded-full blur-[80px]" />
                    <div className="absolute top-10 right-10 w-56 h-56 bg-blue-100 rounded-full blur-[80px]" />
                </div>

                <motion.div {...fadeUp} className="relative z-10 max-w-4xl mx-auto space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 text-green text-sm font-bold">
                        <Sparkles size={16} />
                        {t('story')}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-dark leading-tight">
                        {t('title')}{" "}
                        <span className="text-green relative">
                            {t('title_highlight')}
                            <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 300 6" fill="none">
                                <path d="M0 5 Q75 0 150 5 Q225 10 300 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                            </svg>
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        {t('desc')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/explore" className="px-8 py-4 bg-green text-white font-bold rounded-2xl flex items-center gap-2 hover:scale-[1.03] hover:shadow-xl hover:shadow-green/20 transition-all">
                            {t('start_btn')} <ArrowRight size={20} />
                        </Link>
                        <Link href="/news" className="px-8 py-4 bg-green/5 text-dark font-bold rounded-2xl flex items-center gap-2 hover:bg-green/10 transition-all">
                            {t('blog_btn')} <ChevronRight size={20} />
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ─── STATS STRIP ─── */}
            <section className="py-16 px-[clamp(20px,6vw,80px)] border-y border-green/10 bg-green/[0.02]">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="text-center space-y-1"
                        >
                            <div className="text-4xl md:text-5xl font-black text-dark">{s.value}</div>
                            <div className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">{s.label}</div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── MISSION ─── */}
            <section className="py-24 px-[clamp(20px,6vw,80px)]">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
                    <motion.div {...fadeUp} className="flex-1 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 text-green text-sm font-bold">
                            <Target size={16} /> {t('mission_kicker')}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-dark leading-tight">
                            {t('mission_title')}
                        </h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            {t('mission_desc')}
                        </p>
                    </motion.div>

                    {/* Visual block */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="flex-1 grid grid-cols-2 gap-4"
                    >
                        {[
                            { icon: BookOpen, label: t('mission_stat1_label'), value: "1,200+" },
                            { icon: Users, label: t('mission_stat2_label'), value: "50K+" },
                            { icon: Award, label: t('mission_stat3_label'), value: "120+" },
                            { icon: Zap, label: t('mission_stat4_label'), value: "42 min" },
                        ].map((item, i) => (
                            <div key={i} className="bg-green/5 border border-green/10 rounded-[28px] p-6 space-y-3 hover:bg-green/10 transition-colors">
                                <div className="w-10 h-10 rounded-2xl bg-green/10 flex items-center justify-center text-green">
                                    <item.icon size={20} />
                                </div>
                                <div className="text-2xl font-black text-dark">{item.value}</div>
                                <div className="text-sm text-muted-foreground font-medium">{item.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ─── VALUES ─── */}
            <section className="py-24 px-[clamp(20px,6vw,80px)] bg-dark relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-green rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500 rounded-full blur-[100px]" />
                </div>
                <div className="max-w-6xl mx-auto relative z-10">
                    <motion.div {...fadeUp} className="text-center space-y-4 mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white">{t('values_title')}</h2>
                    </motion.div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {values.map((v, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group flex gap-5 p-8 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                            >
                                <div className={`shrink-0 w-12 h-12 rounded-2xl ${v.bg} ${v.color} flex items-center justify-center`}>
                                    <v.icon size={22} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-white">{v.title}</h3>
                                    <p className="text-white/55 leading-relaxed">{v.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── TIMELINE ─── */}
            <section className="py-24 px-[clamp(20px,6vw,80px)]">
                <div className="max-w-4xl mx-auto">
                    <motion.div {...fadeUp} className="text-center space-y-4 mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 text-green text-sm font-bold">
                            <Sparkles size={16} /> {t('journey_kicker')}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-dark">{t('journey_title')}</h2>
                    </motion.div>

                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-[39px] top-0 bottom-0 w-px bg-green/20" />

                        <div className="space-y-10">
                            {milestones.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.15 }}
                                    className="flex gap-8"
                                >
                                    <div className="flex flex-col items-center shrink-0">
                                        <div className="w-20 h-20 rounded-2xl bg-green/10 border-2 border-green text-green font-black text-sm flex items-center justify-center">
                                            {m.year}
                                        </div>
                                    </div>
                                    <div className="pt-4 space-y-2">
                                        <h3 className="text-xl font-bold text-dark">{m.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">{m.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── TEAM ─── */}
            <section className="py-24 px-[clamp(20px,6vw,80px)] bg-green/[0.03] border-y border-green/10">
                <div className="max-w-6xl mx-auto">
                    <motion.div {...fadeUp} className="text-center space-y-4 mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 text-green text-sm font-bold">
                            <Users size={16} /> {t('team_kicker')}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-dark">{t('team_title')}</h2>
                    </motion.div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {team.map((member, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="group text-center p-8 bg-white rounded-[28px] border border-green/10 hover:border-green hover:shadow-xl hover:shadow-green/5 hover:-translate-y-1 transition-all"
                            >
                                <div className={`w-16 h-16 ${member.color} rounded-2xl flex items-center justify-center text-white font-black text-lg mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                    {member.initials}
                                </div>
                                <h3 className="font-bold text-dark">{member.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{member.role}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="pt-24 pb-0 px-[clamp(20px,6vw,80px)]">
                <motion.div
                    {...fadeUp}
                    className="max-w-4xl mx-auto text-center bg-green rounded-[48px] p-16 md:p-24 relative overflow-hidden"
                >
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-[100px]" />
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-dark rounded-full blur-[120px]" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <h2 className="text-4xl md:text-5xl font-bold text-white">{t('cta_title')}</h2>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/explore" className="px-10 py-4 bg-white text-green font-bold rounded-2xl hover:scale-105 transition-all shadow-xl flex items-center gap-2">
                                {t('start_btn')} <ArrowRight size={20} />
                            </Link>
                            <Link href="/explore" className="px-10 py-4 bg-white/15 text-white font-bold rounded-2xl hover:bg-white/25 transition-all flex items-center gap-2">
                                {t('explore_courses')} <ChevronRight size={20} />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
