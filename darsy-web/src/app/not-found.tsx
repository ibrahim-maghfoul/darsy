"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NotFound() {
    const t = useTranslations("NotFound");

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-32 text-center">
            {/* Decorative blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-[10%] left-[8%] w-72 h-72 bg-green/[0.06] rounded-full blur-3xl" />
                <div className="absolute bottom-[10%] right-[8%] w-96 h-96 bg-green/[0.04] rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 max-w-lg mx-auto flex flex-col items-center gap-8"
            >
                <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-green/30 bg-green/5 text-[12px] font-semibold text-green/80 shadow-[0_0_12px_rgba(58,170,106,0.15)]">
                    {t("badge")}
                </div>

                <p className="text-[clamp(180px,40vw,210px)] font-black text-dark leading-none select-none tracking-tight">
                    404
                </p>

                <div className="space-y-3">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-dark tracking-tight">
                        {t("title")}
                    </h1>
                    <p className="text-[#6a8a78] text-base md:text-lg leading-relaxed max-w-sm mx-auto">
                        {t("description")}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-green font-bold text-sm rounded-2xl border-2 border-green/40 hover:border-green hover:bg-green/5 hover:-translate-y-[2px] active:scale-95 transition-all uppercase tracking-wide"
                    >
                        <ArrowLeft size={18} />
                        {t("back_home")}
                    </Link>
                    <Link
                        href="/explore"
                        className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-green text-white font-bold text-sm rounded-2xl shadow-[0_4px_20px_rgba(58,170,106,0.35)] hover:shadow-[0_8px_28px_rgba(58,170,106,0.45)] hover:-translate-y-[2px] active:scale-95 transition-all uppercase tracking-wide"
                    >
                        <BookOpen size={18} />
                        {t("explore")}
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
