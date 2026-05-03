'use client';

import { useTransition, useState, useRef, useEffect } from 'react';
import { Locale } from '@/lib/localeConfig';
import { setUserLocaleAction } from '@/app/actions/locale';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { usePathname } from 'next/navigation';

const LANGS = [
    { code: 'en', label: 'English', flag: '🌐' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇲🇦' },
];

export function LanguageSwitcher({ mode = 'fixed' }: { mode?: 'fixed' | 'compact' }) {
    const [isPending, startTransition] = useTransition();
    const currentLocale = useLocale();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleLocaleChange = (newLocale: string) => {
        if (newLocale !== currentLocale && !isPending) {
            startTransition(() => {
                setUserLocaleAction(newLocale as Locale);
                setIsOpen(false);
            });
        } else {
            setIsOpen(false);
        }
    };

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isHome = pathname === '/' || pathname === '/en' || pathname === '/fr' || pathname === '/ar' || pathname === `/${currentLocale}`;
    
    // In compact mode (navbar), we ALWAYS want it visible. In fixed mode (floating), only on home.
    if (mode === 'fixed' && !isHome) return null;

    const activeLang = LANGS.find(l => l.code === currentLocale) || LANGS[0];

    return (
        <div
            ref={containerRef}
            className={mode === 'fixed' ? "hidden md:flex fixed bottom-8 left-8 z-[100]" : "relative"}
            dir="ltr"
        >
            <div className={`relative flex flex-col items-${isHome && mode === 'fixed' ? 'start' : 'center'} gap-2`}>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: mode === 'fixed' ? 10 : -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: mode === 'fixed' ? 10 : -10, scale: 0.95 }}
                            className={`flex flex-col bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-black/5 p-1 overflow-hidden w-[140px] absolute z-50 ${mode === 'fixed' ? 'bottom-full mb-3' : 'top-full mt-3 right-0'}`}
                        >
                            {LANGS.filter(l => l.code !== currentLocale).map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLocaleChange(lang.code)}
                                    disabled={isPending}
                                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-green/10 text-dark/70 hover:text-green font-bold text-sm transition-all whitespace-nowrap"
                                >
                                    <span className="text-lg leading-none">{lang.flag}</span>
                                    <span>{lang.label}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`group flex items-center transition-all active:scale-95 ${
                        mode === 'fixed'
                        ? 'gap-3 bg-white/95 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-[6px_16px_6px_8px] border border-black/5 hover:border-green/30'
                        : 'gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20 hover:bg-white/15'
                    }`}
                >
                    <div className={`rounded-full bg-gradient-to-br from-[#3aaa6a] to-[#1e7a46] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(58,170,106,0.2)] ${mode === 'fixed' ? 'w-8 h-8' : 'w-6 h-6'}`}>
                        <span className={mode === 'fixed' ? 'text-lg leading-none' : 'text-xs leading-none'}>{activeLang.flag}</span>
                    </div>
                    {mode === 'fixed' ? (
                        <span className="text-sm font-bold text-dark/80 group-hover:text-dark">
                            {activeLang.label}
                        </span>
                    ) : (
                        <span className="text-white text-[11px] font-black tracking-wide uppercase">
                            {activeLang.code}
                        </span>
                    )}
                    <ChevronUp
                        size={mode === 'fixed' ? 16 : 12}
                        className={`${mode === 'fixed' ? 'text-dark/30' : 'text-white/60'} transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    />

                    {isPending && (
                        <div className="absolute inset-0 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-green border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}
