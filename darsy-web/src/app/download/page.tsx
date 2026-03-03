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
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9">
                                <path d="M17.523 15.3414C17.523 15.3414 16.208 18.0674 15.118 20.3244C14.793 20.9834 14.197 21.0504 13.916 21.0504C13.635 21.0504 12.915 20.7394 12 20.2604C11.085 19.7824 10.365 21.0504 10.084 21.0504C9.803 21.0504 9.207 20.9834 8.882 20.3244C7.792 18.0674 6.477 15.3414 6.477 15.3414C6.477 15.3414 4.545 11.2364 4 10.1554C3.411 9.0324 3.73832 7.8284 4.38132 7.0394C4.84832 6.4674 5.56732 6.0954 6.27532 5.9224C7.29132 5.6744 8.35832 6.1364 8.88232 6.8394L12 11.0594L15.118 6.8394C15.642 6.1364 16.709 5.6744 17.725 5.9224C18.433 6.0954 19.152 6.4674 19.619 7.0394C20.262 7.8284 20.589 9.0324 20 10.1554C19.455 11.2364 17.523 15.3414 17.523 15.3414ZM12 4.14C11.051 4.14 10.282 3.371 10.282 2.422C10.282 1.473 11.051 0.704 12 0.704C12.949 0.704 13.718 1.473 13.718 2.422C13.718 3.371 12.949 4.14 12 4.14Z" />
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
                        icon={
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.27.06 2.15.63 2.9.63.78 0 2.26-.78 3.81-.66 1.06.08 2.8.44 3.84 1.97-3.48 2.12-2.92 6.7.45 8.92zm-3.6-16.08c-2.59.28-4.72 2.9-4.47 5.21 2.33.18 4.73-2.39 4.47-5.21z" />
                            </svg>
                        }
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
