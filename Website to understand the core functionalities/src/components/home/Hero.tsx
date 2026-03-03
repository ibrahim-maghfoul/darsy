"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

export function Hero() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
    const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

    return (
        <section
            ref={sectionRef}
            className="relative min-h-screen flex items-center justify-center overflow-hidden"
            style={{ background: "linear-gradient(160deg, #0d0d1a 0%, #172554 50%, #0d0d1a 100%)" }}
        >
            {/* Layered background blobs */}
            <motion.div style={{ y }} className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full opacity-20"
                    style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", filter: "blur(60px)" }} />
                <div className="absolute bottom-[-15%] right-[-5%] w-[50vw] h-[50vw] rounded-full opacity-15"
                    style={{ background: "radial-gradient(circle, #2563eb 0%, transparent 70%)", filter: "blur(80px)" }} />
                <div className="absolute top-[30%] right-[20%] w-[30vw] h-[30vw] rounded-full opacity-10"
                    style={{ background: "radial-gradient(circle, #93c5fd 0%, transparent 70%)", filter: "blur(50px)" }} />
            </motion.div>

            {/* Floating grid dots */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

            {/* Hero Content */}
            <motion.div style={{ opacity }} className="relative z-10 text-center max-w-4xl mx-auto px-6 pt-24 pb-16">

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-8"
                    style={{
                        background: "rgba(59,130,246,0.15)",
                        border: "1px solid rgba(59,130,246,0.35)",
                        color: "#93c5fd",
                    }}
                >
                    <span style={{ color: "#3b82f6" }}>✦</span>
                    منصة التعلم الرقمي · الجيل القادم
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-none mb-6"
                >
                    تعلّم بذكاء،
                    <br />
                    <span style={{
                        background: "linear-gradient(90deg, #93c5fd 0%, #3b82f6 50%, #2563eb 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}>
                        انجح بثقة
                    </span>
                </motion.h1>

                {/* Subheading */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-base md:text-lg text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed"
                >
                    دروس تفاعلية، مسارات تعليمية مخصصة، ومحتوى شامل لجميع المراحل الدراسية — كل ما تحتاجه في مكان واحد.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link
                        href="/explore"
                        className="group px-8 py-3.5 rounded-full text-sm font-semibold text-white inline-flex items-center gap-2 transition-all"
                        style={{
                            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                            boxShadow: "0 4px 20px rgba(59,130,246,0.5), 0 0 60px rgba(59,130,246,0.15)",
                        }}
                    >
                        ابدأ التعلم الآن
                        <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </Link>
                    <Link
                        href="/news"
                        className="px-8 py-3.5 rounded-full text-sm font-semibold text-blue-300 inline-flex items-center gap-2 transition-all"
                        style={{
                            background: "rgba(59,130,246,0.08)",
                            border: "1px solid rgba(59,130,246,0.3)",
                        }}
                    >
                        آخر الأخبار
                    </Link>
                </motion.div>

                {/* Stats strip */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-16 flex flex-wrap items-center justify-center gap-8"
                >
                    {[
                        { value: "10K+", label: "طالب نشط" },
                        { value: "500+", label: "درس متاح" },
                        { value: "50+", label: "مادة دراسية" },
                        { value: "98%", label: "رضا المستخدمين" },
                    ].map((s) => (
                        <div key={s.label} className="text-center">
                            <div className="text-2xl font-extrabold text-white">{s.value}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </motion.div>
            </motion.div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, transparent, #09090b)" }} />
        </section>
    );
}
