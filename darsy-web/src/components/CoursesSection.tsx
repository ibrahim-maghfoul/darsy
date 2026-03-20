"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, memo } from "react";
import { useTranslations, useLocale } from 'next-intl';
import { ChevronRight } from "lucide-react";

// Modern SVG icons
const WorkflowIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <path d="M12 7v4M8.5 17.5l-2-2.5M15.5 17.5l2-2.5M5 17v-3a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3" />
    </svg>
);

const AIIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h3a3 3 0 0 1 3 3v1a2 2 0 0 1 0 4v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-1a2 2 0 0 1 0-4v-1a3 3 0 0 1 3-3h3V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z" />
        <path d="M9.5 12.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0M13.5 12.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0" fill="currentColor" stroke="none" />
        <path d="M9 17c1 1 5 1 6 0" />
    </svg>
);

// Slightly rounded hexagon mask — 8% corner radius via quadratic bezier, scales to any size
const ROUNDED_HEX = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M 57 7 L 84 22.5 Q 91 26.5 91 34.5 L 91 65.5 Q 91 73.5 84 77.5 L 57 93 Q 50 97 43 93 L 16 77.5 Q 9 73.5 9 65.5 L 9 34.5 Q 9 26.5 16 22.5 L 43 7 Q 50 3 57 7 Z' fill='%23000'/%3E%3C/svg%3E") center / 100% 100% no-repeat`;


const ServiceCard = memo(function ServiceCard({ course, index, isInView, height }: { course: any; index: number; isInView: boolean; height: number }) {
    const t = useTranslations('Courses');
    const locale = useLocale();
    const isAr = locale === 'ar';
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 36 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: index * 0.12, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ minHeight: height }}
            className={`group rounded-[28px] p-[24px_20px] md:p-[36px_32px] relative overflow-hidden flex flex-col justify-end shrink-0 ${course.className}`}
        >
            {/* Texture overlay */}
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none', zIndex: 0,
                backgroundImage: course.id === 1
                    ? 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 10px)'
                    : course.id === 2
                        ? 'radial-gradient(circle, white 1px, transparent 1px)'
                        : 'repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 8px)',
                backgroundSize: course.id === 2 ? '10px 10px' : undefined,
            }} />

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
                    top: 24,
                    left: 24,
                    transformOrigin: "center center",
                    pointerEvents: "none",
                }}
            />

            {course.img && (
                <div style={{
                    position: 'absolute',
                    top: course.id === 2 ? 14 : 16,
                    right: course.id === 2 ? 14 : 16,
                    width: course.id === 2 ? 'clamp(60px, 22%, 80px)' : 'clamp(100px, 30%, 150px)',
                    aspectRatio: '1 / 1',
                    filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.45))',
                }}>
                    <div style={{
                        position: 'absolute', inset: 0,
                        WebkitMask: ROUNDED_HEX,
                        mask: ROUNDED_HEX,
                        backgroundImage: `url(${course.img})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                    }} />
                </div>
            )}

            {/* Icon + kicker pinned to top-left */}
            {course.id !== 3 && (
                <div className="absolute top-[24px] left-[20px] md:top-[36px] md:left-[32px] flex items-center gap-2.5 z-20">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/25 shrink-0">
                        <div className="w-5 h-5">
                            <course.Icon />
                        </div>
                    </div>
                    <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-white/60">
                        {t(`card${course.id}_kicker`)}
                    </div>
                </div>
            )}

            <div className={`relative z-20 ${course.id === 1 ? 'max-w-[58%] md:max-w-[65%]' : course.id === 2 ? 'max-w-[55%]' : ''}`}>
                {course.id === 3 && (
                    <div className="text-[9px] font-bold tracking-[0.1em] uppercase text-white/60 mb-1">
                        {t(`card${course.id}_kicker`)}
                    </div>
                )}
                <h3 className={`text-[clamp(20px,2.5vw,34px)] font-bold text-white leading-[1.1] tracking-[-0.03em] mb-2.5 ${course.id === 2 ? 'text-[clamp(16px,2vw,22px)]' : course.id === 3 ? 'text-[clamp(11px,1.2vw,14px)] mb-1' : ''}`}>
                    <em className="not-italic text-[#b4ffdc]/90">{t(`card${course.id}_head1`)}</em> {t(`card${course.id}_head2`)}
                </h3>
                <p className={`text-[13px] text-white/68 leading-[1.65] max-w-[360px] line-clamp-3 ${course.id === 3 ? 'text-[11px] leading-[1.4] line-clamp-2' : course.id === 2 ? 'text-[12px] line-clamp-2' : ''}`}>
                    {t(`card${course.id}_desc`)}
                </p>
            </div>

            {/* Arrow indicator */}
            <div className={`absolute ${isAr ? 'left-6' : 'right-6'} bottom-6 w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300`}>
                <ChevronRight size={18} className={isAr ? 'rotate-180' : ''} />
            </div>
        </motion.div>
    );
});

const DESKTOP_H: Record<number, number> = { 1: 480, 2: 240, 3: 120 };
const MOBILE_H: Record<number, number> = { 1: 280, 2: 200, 3: 90 };

export function CoursesSection() {
    const gridRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(gridRef, { once: true, amount: 0.08 });
    const t = useTranslations('Courses');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        setIsMobile(mq.matches);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const courses = [
        {
            id: 1,
            Icon: WorkflowIcon,
            img: "https://i.pravatar.cc/400?img=47",
            className: "course-card-1 flex-[4] bg-gradient-to-br from-[#9ef0b8] via-[#5cd68a] via-[#2aaa62] to-[#0f4428] shadow-[0_8px_40px_rgba(42,170,98,0.3)]",
        },
        {
            id: 2,
            Icon: AIIcon,
            img: "https://i.pravatar.cc/200?img=33",
            className: "course-card-2 flex-[2] bg-gradient-to-br from-[#52d4a0] via-[#1e9e72] via-[#0d6048] to-[#051e16] shadow-[0_8px_40px_rgba(13,96,72,0.35)] !p-[24px_22px]",
        },
        {
            id: 3,
            Icon: null,
            className: "course-card-3 flex-[1] bg-gradient-to-br from-[#2a4a3c] via-[#1a3028] to-[#0d1e18] shadow-[0_8px_40px_rgba(0,0,0,0.4)] !p-[18px_16px] rounded-[22px]",
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

            <div ref={gridRef} className="flex flex-col md:flex-row gap-5 max-w-[1200px] mx-auto relative items-start">
                {courses.map((course, i) => (
                    <ServiceCard
                        key={course.id}
                        course={course}
                        index={i}
                        isInView={isInView}
                        height={isMobile ? MOBILE_H[course.id] : DESKTOP_H[course.id]}
                    />
                ))}
            </div>
        </section>
    );
}
