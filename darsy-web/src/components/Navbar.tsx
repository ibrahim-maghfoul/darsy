"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogIn, LayoutGrid, BookOpen, House, CalendarDays, Menu, X, Users, MessageCircle, Share2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageSwitcher } from "./LanguageSwitcher";

type BottomNavProps = {
  bottomTabs: { href: string; label: string; icon: React.ElementType }[];
  isTabActive: (href: string) => boolean;
  isAuthenticated: boolean;
  user: any;
  getPhotoURL: (url: string) => string | null;
  locale: string;
  pathname: string;
};

function BottomNavBar({ bottomTabs, isTabActive, isAuthenticated, user, getPhotoURL, locale, pathname }: BottomNavProps) {
  const allTabs = [...bottomTabs, { href: 'profile', isProfile: true }];
  const activeIdx = allTabs.findIndex((t: any) =>
    t.isProfile
      ? (pathname === '/profile' || pathname === `/${locale}/profile` || pathname?.startsWith('/login') || pathname?.startsWith(`/${locale}/login`))
      : isTabActive(t.href)
  );
  const safeIdx = activeIdx === -1 ? 0 : activeIdx;

  // Green ring x: CSS calc using left property — always accurate at any screen width
  const ringLeft = `calc(8px + ${(safeIdx + 0.5) / 5} * (100% - 16px))`;

  return (
    <div className="mx-4 mb-4 flex items-center justify-around px-2 py-0 relative h-[60px]">
      {/* Shadow */}
      <div className="absolute inset-0 rounded-[24px] shadow-[0_-8px_40px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.08)] pointer-events-none z-0" />

      {/* Backdrop blur (full width, no fill — blurs page content behind navbar) */}
      <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none z-0 backdrop-blur-xl" style={{ willChange: 'transform', isolation: 'isolate' } as React.CSSProperties} />

      {/* Segmented white fill: 5 flex-1 strips, active strip has the cutout at exactly 50% */}
      <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none z-0 flex px-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="flex-1 h-full bg-white/80"
            style={i === safeIdx ? {
              maskImage: 'radial-gradient(circle 30px at 50% 10px, transparent 99.5%, black 100%)',
              WebkitMaskImage: 'radial-gradient(circle 30px at 50% 10px, transparent 99.5%, black 100%)',
            } : undefined}
          />
        ))}
      </div>

      {/* Green contour ring — sits at the cutout edge, visible as green arc at the hole boundary */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: ringLeft,
          top: '10px',
          transform: 'translate(-50%, -50%)',
          width: '62px',
          height: '62px',
          borderRadius: '50%',
          border: '2.5px solid #22c55e',
          boxShadow: '0 0 0 1px rgba(34,197,94,0.18)',
          zIndex: 2,
        }}
      />

      {/* Tab Items */}
      {bottomTabs.map((tab) => {
        const active = isTabActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative flex flex-col items-center justify-center min-w-0 flex-1 z-10 h-[60px]"
          >
            <div className={`relative flex items-center justify-center transition-all duration-300 ${active ? '-translate-y-[20px] w-[50px] h-[50px] rounded-full shadow-sm' : 'w-10 h-10'}`}>
              {active && <motion.div layoutId="bottom-tab-pill" className="absolute inset-0 bg-green rounded-full -z-10" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
              <tab.icon size={active ? 22 : 24} strokeWidth={active ? 2.5 : 2} className={`relative z-10 transition-colors ${active ? 'text-white' : 'text-dark/40 hover:text-dark/70'}`} />
            </div>
          </Link>
        );
      })}

      {/* Profile / Auth tab */}
      <Link
        href={isAuthenticated ? "/profile" : "/login"}
        className="relative flex flex-col items-center justify-center min-w-0 flex-1 z-10 h-[60px]"
      >
        {(() => {
          const active = (pathname === '/profile' || pathname === `/${locale}/profile` || pathname?.startsWith('/login') || pathname?.startsWith(`/${locale}/login`));
          return (
            <div className={`relative flex items-center justify-center transition-all duration-300 ${active ? '-translate-y-[20px] w-[50px] h-[50px] rounded-full shadow-sm' : 'w-10 h-10'}`}>
              {active && <motion.div layoutId="bottom-tab-pill" className="absolute inset-0 bg-green rounded-full -z-10" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
              {isAuthenticated && user?.photoURL ? (
                <div className={`rounded-full overflow-hidden relative z-10 transition-all ${active ? 'w-full h-full border-[1.5px] border-white/30' : 'w-[26px] h-[26px] border-[1.5px] border-dark/20'}`}>
                  <img src={getPhotoURL(user.photoURL) || ''} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <User size={active ? 22 : 24} strokeWidth={active ? 2.5 : 2} className={`relative z-10 transition-colors ${active ? 'text-white' : 'text-dark/40 hover:text-dark/70'}`} />
              )}
            </div>
          );
        })()}
      </Link>
    </div>
  );
}

export const Navbar = () => {
  const { user, logout, isAuthenticated, getPhotoURL } = useAuth();
  const t = useTranslations('Navbar');
  const locale = useLocale();
  const pathname = usePathname();
  const isRTL = locale === 'ar';
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Early return MUST come after all hooks
  const isSettingsPage = pathname?.startsWith('/settings');
  const isChatPage = pathname?.startsWith('/profile/chat');
  if (isSettingsPage) return null;

  const navLinks = [
    { href: "/", label: t('home'), icon: House },
    { href: "/explore", label: t('explore'), icon: LayoutGrid },
    { href: "/news", label: t('news'), icon: BookOpen },
    { href: "/profile/chat", label: t('chat_room'), icon: MessageCircle },
    ...(isAuthenticated ? [
      { href: "/calendar", label: t('calendar') || "Calendar", icon: CalendarDays },
      { href: "/contributions", label: t('contributions'), icon: Share2 },
    ] : []),
  ].sort((a, b) => isRTL ? -1 : 0);

  // Bottom tab links (5 max for mobile)
  const bottomTabs = [
    { href: "/", label: t('home'), icon: House },
    { href: "/explore", label: t('explore'), icon: LayoutGrid },
    { href: "/news", label: t('news'), icon: BookOpen },
    { href: "/profile/chat", label: t('chat_room'), icon: MessageCircle },
  ];

  const isTabActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === `/${locale}`;
    return pathname?.startsWith(href) || pathname?.startsWith(`/${locale}${href}`);
  };

  return (
    <>
      {/* ── Mobile Top Bar — ONLY on home page ── */}
      {(pathname === '/' || pathname === `/${locale}`) && (
        <div 
          className={`fixed top-0 left-0 right-0 w-full z-50 px-5 py-3.5 flex items-center justify-between md:hidden transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'} bg-green/90 backdrop-blur-xl border-b border-white/10`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        >
          {/* Concave bottom-left corner — white rounded element makes navbar appear scooped */}
          <div className="absolute -bottom-[20px] left-0 pointer-events-none w-5 h-5 bg-white rounded-tr-[20px]" />

          <Link href="/" className="flex items-center gap-2.5 group relative z-10">
            {/* SVG Logo with fanGlow */}
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="fanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
            <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shadow-lg bg-white shadow-black/10`}>
              <span className={`font-black text-base italic`} style={{ color: 'url(#fanGlow)' }}>D</span>
            </div>
            <span className={`text-[19px] font-black tracking-tighter text-white`}>Darsy</span>
          </Link>

          <div className="flex items-center gap-2 relative z-10">
            <LanguageSwitcher mode="compact" />
            <Link href={isAuthenticated ? "/profile" : "/login"} className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-green overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-green/10 hover:scale-105 active:scale-95 transition-all">
                {isAuthenticated && user?.photoURL ? (
                    <img src={getPhotoURL(user.photoURL) || ''} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <User size={18} strokeWidth={2.5} />
                )}
            </Link>
          </div>
        </div>
      )}

      {/* ── Desktop / Tablet Navbar — hidden on chat pages ── */}
      {!isChatPage && (
        <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-6 transition-transform duration-300 hidden md:block ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between p-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-green/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2 px-4 group">
              <div className="w-10 h-10 bg-green rounded-2xl flex items-center justify-center group-hover:-translate-y-1 transition-transform shadow-lg shadow-green/20">
                <span className="text-white font-black text-xl italic">D</span>
              </div>
              <span className="text-2xl font-black text-dark tracking-tighter">Darsy</span>
            </Link>

            {/* Nav Links — desktop only */}
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative flex items-center gap-2 px-6 py-2.5 rounded-full text-muted-foreground hover:text-green hover:bg-green/5 transition-all font-bold text-sm"
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth Actions — desktop only */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <div className={`flex items-center gap-4 ${isRTL ? 'pr-4 border-r' : 'pl-4 border-l'} border-green/10`}>
                  <Link href="/profile" className={`flex items-center gap-3 group ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`${isRTL ? 'text-left' : 'text-right'} hidden sm:block`}>
                      <p className="text-xs font-bold text-muted-foreground">{t('welcome')}</p>
                      <p className="text-sm font-black text-dark">{user?.displayName?.split(' ')[0]}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green shadow-sm border border-green/10 group-hover:shadow-md group-hover:scale-105 transition-all overflow-hidden border border-green/5">
                      {user?.photoURL ? (
                        <img src={getPhotoURL(user.photoURL) || ''} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="px-6 py-2.5 rounded-full font-bold text-sm text-dark hover:bg-black/5 transition-all flex items-center gap-2"
                  >
                    <LogIn size={18} />
                    {t('signin')}
                  </Link>
                  <Link
                    href="/signup"
                    className="px-8 py-2.5 bg-green text-white font-bold rounded-full text-sm shadow-[0_4px_14px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] hover:-translate-y-0.5 active:scale-95 transition-all"
                  >
                    {t('getStarted')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe" style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 55%, transparent 100%)' }}>
        <BottomNavBar
          bottomTabs={bottomTabs}
          isTabActive={isTabActive}
          isAuthenticated={isAuthenticated}
          user={user}
          getPhotoURL={getPhotoURL}
          locale={locale}
          pathname={pathname}
        />
      </nav>
    </>
  );
};
