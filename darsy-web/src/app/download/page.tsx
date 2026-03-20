'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';
import FizzyButton from '@/components/FizzyButton';

export default function DownloadPage() {
    const t = useTranslations('Download');

    return (
        <main className="min-h-screen bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,#d8f5e8_0%,#f2fbf5_40%,#ffffff_100%)] flex flex-col items-center justify-center px-6 py-32">

            {/* Decorative floating blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-[10%] left-[8%] w-72 h-72 bg-green/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[10%] right-[8%] w-96 h-96 bg-green/8 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 text-center max-w-2xl mx-auto"
            >
                {/* App icon */}
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="w-24 h-24 mx-auto mb-8 rounded-[28px] bg-gradient-to-br from-[#3aaa6a] to-[#1a7a46] flex items-center justify-center shadow-[0_20px_60px_rgba(58,170,106,0.35)]"
                >
                    <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12">
                        <path d="M10 8h20v24H10z" rx="3" fill="white" fillOpacity="0.15" />
                        <rect x="10" y="8" width="20" height="24" rx="3" stroke="white" strokeWidth="1.5" fill="none" />
                        <path d="M15 20h10M15 24h7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="20" cy="14" r="2" fill="white" fillOpacity="0.7" />
                    </svg>
                </motion.div>

                <h1 className="text-[clamp(32px,5vw,60px)] font-bold text-dark leading-[1.08] tracking-[-0.04em] mb-4">
                    {t('title')}<em className="not-italic text-green">{t('title_highlight')}</em>
                </h1>
                <p className="text-[clamp(14px,1.5vw,18px)] text-[#6a8a78] leading-[1.7] max-w-md mx-auto mb-14">
                    {t('desc')}
                </p>

                {/* Platform cards */}
                <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                    {/* Android — available */}
                    <FizzyButton
                        id="android-download"
                        href="https://play.google.com"
                        title={t('android_title')}
                        subtitle={t('android_desc')}
                        variant="green"
                        icon={
                            <svg viewBox="0 -960 960 960" fill="currentColor" className="w-9 h-9">
                                <path d="M40-240q9-107 65.5-197T256-580l-74-128q-6-9-3-19t13-15q8-5 18-2t16 12l74 128q86-36 180-36t180 36l74-128q6-9 16-12t18 2q10 5 13 15t-3 19l-74 128q94 53 150.5 143T920-240H40Zm275.5-124.5Q330-379 330-400t-14.5-35.5Q301-450 280-450t-35.5 14.5Q230-421 230-400t14.5 35.5Q259-350 280-350t35.5-14.5Zm400 0Q730-379 730-400t-14.5-35.5Q701-450 680-450t-35.5 14.5Q630-421 630-400t14.5 35.5Q659-350 680-350t35.5-14.5Z"/>
                            </svg>
                        }
                    />

                    {/* iOS — coming soon */}
                    <FizzyButton
                        id="ios-download"
                        href="#"
                        title={t('ios_title')}
                        subtitle={t('ios_desc')}
                        disabled={true}
                        icon={<span className="material-symbols-outlined" style={{ fontSize: '36px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>ios</span>}
                    />
                </div>

                {/* Back link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12"
                >
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-[#6a8a78] hover:text-green font-semibold transition-colors group"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        {t('back')}
                    </Link>
                </motion.div>
            </motion.div>
        </main>
    );
}
