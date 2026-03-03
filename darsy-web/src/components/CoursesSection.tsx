"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { useTranslations, useLocale } from 'next-intl';

// Modern SVG icons
const WorkflowIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <path d="M12 7v4M8.5 17.5l-2-2.5M15.5 17.5l2-2.5M5 17v-3a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3" />
    </svg>
);

const AIIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h3a3 3 0 0 1 3 3v1a2 2 0 0 1 0 4v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1a2 2 0 0 1 0-4v-1a3 3 0 0 1 3-3h3V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z" />
        <path d="M9.5 12.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0M13.5 12.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0" fill="currentColor" stroke="none" />
        <path d="M9 17c1 1 5 1 6 0" />
    </svg>
);

const ShieldIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2L3 7v7c0 5 9 8 9 8s9-3 9-8V7L12 2z" />
        <path d="m9 12 2 2 4-4" />
    </svg>
);

const courses = [
    {
        id: 1,
        Icon: WorkflowIcon,
        kicker: "Premium Service",
        headline: { main: "Exam", alt: "Preparation" },
        desc: "Interactive live classes and exclusive assignments to prepare you for critical exams. Let our expert mentors help you study smarter and reach your academic goals faster.",
        img: "https://i.pravatar.cc/400?img=47",
        className: "flex-[4] h-[480px] bg-gradient-to-br from-[#9ef0b8] via-[#5cd68a] via-[#2aaa62] to-[#0f4428] shadow-[0_8px_40px_rgba(42,170,98,0.3)]",
    },
    {
        id: 2,
        Icon: AIIcon,
        kicker: "Resources",
        headline: { main: "Study", alt: "Materials" },
        desc: "Access thousands of PDFs, videos, and interactive notes.",
        img: "https://i.pravatar.cc/200?img=33",
        className: "flex-[2] h-[240px] bg-gradient-to-br from-[#52d4a0] via-[#1e9e72] via-[#0d6048] to-[#051e16] shadow-[0_8px_40px_rgba(13,96,72,0.35)] !p-[24px_22px]",
    },
    {
        id: 3,
        Icon: ShieldIcon,
        kicker: "Updates",
        headline: { main: "News", alt: "" },
        desc: "Scholarships, Unis & Jobs.",
        className: "flex-[1] h-[120px] bg-gradient-to-br from-[#2a4a3c] via-[#1a3028] to-[#0d1e18] shadow-[0_8px_40px_rgba(0,0,0,0.4)] !p-[18px_16px] rounded-[22px]",
    },
];

function ServiceCard({ course, index, isInView }: { course: any; index: number; isInView: boolean }) {
    const t = useTranslations('Courses');
    const locale = useLocale();
    const isAr = locale === 'ar';
    const [hovered, setHovered] = useState(false);
    const iconSize = course.id === 3 ? "w-6 h-6" : course.id === 2 ? "w-9 h-9" : "w-[52px] h-[52px]";

    // Toggle icon position for Card 3 in RTL
    const iconPos = course.id === 3
        ? (isAr ? "top-[18px] left-[18px]" : "top-[18px] right-[18px]")
        : "top-8 left-8"; // Cards 1 & 2 icons stay on left/start

    return (
        <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 36 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: index * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`rounded-[28px] p-[36px_32px] relative overflow-hidden cursor-pointer flex flex-col justify-end transition-all hover:-translate-y-2 hover:shadow-[0_28px_60px_rgba(0,0,0,0.22)] shrink-0 ${course.className}`}
        >
            {/* Wave fill animation */}
            <motion.div
                initial={{ scale: 0, opacity: 0.6 }}
                animate={hovered ? { scale: 20, opacity: 0 } : { scale: 0, opacity: 0.6 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    position: "absolute",
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.18)",
                    top: course.id === 3 ? 22 : course.id === 2 ? 24 : 30,
                    left: course.id === 3 ? (isAr ? 20 : 'auto') : (course.id === 2 ? 20 : 32),
                    right: course.id === 3 ? (isAr ? 'auto' : 20) : 'auto',
                    transformOrigin: "center center",
                    pointerEvents: "none",
                }}
            />

            {/* Icon */}
            <div className={`absolute ${iconPos} ${iconSize} rounded-[12px] bg-white/15 backdrop-blur-lg flex items-center justify-center text-white border border-white/25 z-10 transition-all duration-300 ${hovered ? 'bg-white/30 scale-110 border-white/50 shadow-[0_0_20_rgba(255,255,255,0.3)]' : ''}`}>
                <course.Icon />
            </div>

            {course.img && (
                <div className={`absolute overflow-hidden shadow-[0_10px_32px_rgba(0,0,0,0.35)] clip-hex-rounded ${course.id === 2 ? 'w-[clamp(55px,6vw,80px)] h-[clamp(55px,6vw,80px)] top-[14px] right-[14px] clip-hex-rounded-small' : 'top-5 right-6 w-[clamp(140px,18vw,240px)] h-[clamp(140px,18vw,240px)]'}`}>
                    <img src={course.img} alt="person" className="w-full h-full object-cover block" />
                </div>
            )}

            <div>
                <div className={`text-[11px] font-bold tracking-[0.1em] uppercase text-white/60 mb-2 ${course.id === 3 ? 'text-[9px] mb-1' : ''}`}>
                    {t(`card${course.id}_kicker`)}
                </div>
                <h3 className={`text-[clamp(22px,2.8vw,34px)] font-bold text-white leading-[1.1] tracking-[-0.03em] mb-2.5 ${course.id === 2 ? 'text-[clamp(16px,2vw,22px)]' : course.id === 3 ? 'text-[clamp(11px,1.2vw,14px)] mb-1' : ''}`}>
                    <em className="not-italic text-[#b4ffdc]/90">{t(`card${course.id}_head1`)}</em> {t(`card${course.id}_head2`)}
                </h3>
                <p className={`text-[13px] text-white/68 leading-[1.65] max-w-[360px] ${course.id === 3 ? 'text-[11px] leading-[1.4]' : course.id === 2 ? 'text-[12px]' : ''}`}>
                    {t(`card${course.id}_desc`)}
                </p>
            </div>
        </motion.div>
    );
}

export function CoursesSection() {
    const gridRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(gridRef, { once: true, amount: 0.08 });
    const t = useTranslations('Courses');

    const courses = [
        {
            id: 1,
            Icon: WorkflowIcon,
            img: "https://i.pravatar.cc/400?img=47",
            className: "flex-[4] h-[480px] bg-gradient-to-br from-[#9ef0b8] via-[#5cd68a] via-[#2aaa62] to-[#0f4428] shadow-[0_8px_40px_rgba(42,170,98,0.3)]",
        },
        {
            id: 2,
            Icon: AIIcon,
            img: "https://i.pravatar.cc/200?img=33",
            className: "flex-[2] h-[240px] bg-gradient-to-br from-[#52d4a0] via-[#1e9e72] via-[#0d6048] to-[#051e16] shadow-[0_8px_40px_rgba(13,96,72,0.35)] !p-[24px_22px]",
        },
        {
            id: 3,
            Icon: ShieldIcon,
            className: "flex-[1] h-[120px] bg-gradient-to-br from-[#2a4a3c] via-[#1a3028] to-[#0d1e18] shadow-[0_8px_40px_rgba(0,0,0,0.4)] !p-[18px_16px] rounded-[22px]",
        },
    ];

    return (
        <section className="bg-[#f0f5f0] p-[100px_clamp(24px,6vw,80px)_120px] relative overflow-hidden">
            <div className="max-w-[680px] mx-auto mb-16 relative">
                <div className="inline-block text-[11px] font-bold tracking-[0.14em] uppercase text-green mb-3.5">{t('kicker')}</div>
                <h2 className="text-[clamp(32px,5vw,62px)] font-bold text-dark leading-[1.08] tracking-[-0.04em] mb-3.5">
                    {t('title1')} <em className="not-italic text-green">{t('title_highlight')}</em>
                </h2>
                <p className="text-[clamp(13px,1.4vw,16px)] text-[#6a8a78] leading-[1.7] max-w-[440px]">
                    {t('desc')}
                </p>
            </div>

            <div ref={gridRef} className="flex flex-row gap-5 max-w-[1200px] mx-auto relative items-start max-md:flex-col">
                {courses.map((course, i) => (
                    <ServiceCard key={course.id} course={course} index={i} isInView={isInView} />
                ))}
            </div>
        </section>
    );
}
