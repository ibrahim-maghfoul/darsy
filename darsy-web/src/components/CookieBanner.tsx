'use client';

import { useState, useEffect } from 'react';
import { Cookie, Shield, BarChart2, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const COOKIE_KEY = 'darsy_consent';
const CONSENT_DAYS = 15;

function setCookie(name: string, value: string, days: number) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

function saveVisitorMeta(accepted: boolean) {
    try {
        localStorage.setItem('darsy_visitor_meta', JSON.stringify({
            consent: accepted ? 'accepted' : 'declined',
            timestamp: new Date().toISOString(),
            locale: navigator.language,
            referrer: document.referrer || 'direct',
            path: window.location.pathname,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }));
    } catch { /* unavailable */ }
}

export default function CookieBanner() {
    const t = useTranslations('CookieBanner');
    const [visible, setVisible] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        if (!getCookie(COOKIE_KEY)) {
            const t = setTimeout(() => setVisible(true), 900);
            return () => clearTimeout(t);
        }
    }, []);

    const accept = () => { setCookie(COOKIE_KEY, 'accepted', CONSENT_DAYS); saveVisitorMeta(true); setVisible(false); };
    const decline = () => { setCookie(COOKIE_KEY, 'declined', CONSENT_DAYS); saveVisitorMeta(false); setVisible(false); };

    if (!visible) return null;

    return (
        <div className="fixed bottom-4 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-lg animate-slide-up">
                {/* Card with dotted green texture */}
                <div className="relative overflow-hidden rounded-3xl border border-green/30 shadow-2xl shadow-green/10 bg-white">

                    {/* Dotted texture overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle, rgba(58,170,106,0.12) 1.5px, transparent 1.5px)',
                            backgroundSize: '18px 18px',
                        }}
                    />

                    {/* Green top bar */}
                    <div className="h-1.5 bg-gradient-to-r from-green via-emerald-400 to-teal-400 relative z-10" />

                    <div className="relative z-10 p-5 md:p-6">
                        {/* Header */}
                        <div className="flex items-start gap-4 mb-4">
                            {/* Animated cookie icon */}
                            <div className="w-12 h-12 bg-green/10 border border-green/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Cookie
                                    size={24}
                                    className="text-green"
                                    style={{ animation: 'cookieBounce 1.8s ease-in-out infinite' }}
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-dark text-base leading-tight">{t('title')}</h3>
                                <p className="text-sm text-dark/60 mt-1 leading-snug">
                                    {t('desc', { days: CONSENT_DAYS })}{' '}
                                    <Link href="/privacy" className="text-green hover:underline font-semibold">{t('privacy')}</Link>
                                </p>
                            </div>

                            <button
                                onClick={decline}
                                className="p-1.5 rounded-xl hover:bg-green/10 text-dark/30 hover:text-dark/60 transition-all flex-shrink-0"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Details toggle */}
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="text-xs text-dark/40 hover:text-green flex items-center gap-1.5 mb-4 transition-colors font-medium"
                        >
                            <span className="transition-transform duration-200" style={{ display: 'inline-block', transform: showDetails ? 'rotate(90deg)' : 'none' }}>›</span>
                            {t('details')}
                        </button>

                        {showDetails && (
                            <div className="grid grid-cols-2 gap-2 mb-4 animate-slide-up">
                                <div className="flex items-start gap-2 bg-green/5 border border-green/15 rounded-2xl p-3">
                                    <Shield size={13} className="text-green mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-dark">{t('essential')}</p>
                                        <p className="text-xs text-dark/50">{t('essential_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-2xl p-3">
                                    <BarChart2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-dark">{t('analytics')}</p>
                                        <p className="text-xs text-dark/50">{t('analytics_desc')}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={decline}
                                className="flex-1 py-2.5 border border-gray-200 hover:border-green/30 rounded-2xl text-sm font-semibold text-dark/60 hover:text-dark hover:bg-green/5 transition-all"
                            >
                                {t('decline')}
                            </button>
                            <button
                                onClick={accept}
                                className="flex-1 py-2.5 bg-green text-white rounded-2xl text-sm font-bold hover:bg-green/85 transition-all shadow-md shadow-green/25"
                            >
                                {t('accept')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes cookieBounce {
                    0%, 100% { transform: rotate(-8deg) scale(1); }
                    25%       { transform: rotate(8deg) scale(1.12); }
                    50%       { transform: rotate(-5deg) scale(1.05); }
                    75%       { transform: rotate(5deg) scale(1.08); }
                }
            `}</style>
        </div>
    );
}
