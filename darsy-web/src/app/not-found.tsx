"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Ghost, Home, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NotFound() {
    const t = useTranslations('NotFound');

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden">

            {/* Animated Elements */}
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="relative"
            >
                <div className="absolute inset-0 bg-green/20 blur-[100px] rounded-full" />
                <motion.div
                    animate={{
                        y: [0, -20, 0],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative z-10 text-green drop-shadow-2xl"
                >
                    <Ghost size={140} strokeWidth={1} />
                </motion.div>
            </motion.div>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="z-10 mt-8 space-y-6"
            >
                <h1 className="text-7xl md:text-9xl font-black text-dark tracking-tighter">
                    404
                </h1>
                <div className="space-y-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-dark">
                        {t('title')}
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        {t('desc')}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-8 py-3.5 bg-green text-white font-bold rounded-2xl shadow-lg shadow-green/20 hover:shadow-green/30 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Home size={18} />
                        {t('back_home')}
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-8 py-3.5 bg-dark/5 text-dark font-bold rounded-2xl hover:bg-dark/10 transition-all"
                    >
                        <ArrowLeft size={18} />
                        {t('go_back')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
