"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { DarsyLogo } from "./DarsyLogo";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogIn, LayoutGrid, BookOpen, House, CalendarDays, Menu, X, Users, MessageCircle, Share2, Bell, Check, CheckCheck, UserCheck } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageSwitcher } from "./LanguageSwitcher";
import api from "@/lib/api";
import { useSnackbar } from "@/contexts/SnackbarContext";

interface Notification {
  _id: string;
  type: "room_accepted" | "room_rejected" | "join_request";
  title: string;
  body: string;
  data?: { roomId?: string; roomName?: string };
  read: boolean;
  createdAt: string;
}

function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unread = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data || []);
    } catch {}
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen(prev => !prev);
    if (!open && unread > 0) {
      api.patch("/notifications/read-all").then(fetchNotifications).catch(() => {});
    }
  };

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-full bg-white flex items-center justify-center text-dark/60 hover:text-green shadow-sm border border-green/10 hover:border-green/30 transition-all"
      >
        <Bell size={17} strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 z-[999] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-black text-dark">Notifications</h3>
              {notifications.some(n => !n.read) && (
                <button
                  onClick={() => api.patch("/notifications/read-all").then(fetchNotifications).catch(() => {})}
                  className="text-xs text-green font-bold flex items-center gap-1 hover:underline"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={28} className="text-dark/15 mx-auto mb-2" />
                  <p className="text-sm text-dark/40 font-semibold">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n._id}
                    onClick={() => markRead(n._id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${!n.read ? "bg-green/[0.03]" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${n.type === "room_accepted" ? "bg-green/10" : n.type === "join_request" ? "bg-amber-50" : "bg-red-50"}`}>
                      {n.type === "room_accepted" ? (
                        <Check size={14} className="text-green" />
                      ) : n.type === "join_request" ? (
                        <UserCheck size={14} className="text-amber-500" />
                      ) : (
                        <X size={14} className="text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-dark leading-tight">{n.title}</p>
                      <p className="text-xs text-dark/50 mt-0.5 leading-snug">{n.body}</p>
                      <p className="text-[10px] text-dark/30 mt-1">
                        {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!n.read && <span className="w-2 h-2 bg-green rounded-full shrink-0 mt-1.5" />}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  const isProfileActive = pathname === '/profile' || pathname === `/${locale}/profile` || pathname?.startsWith('/login') || pathname?.startsWith(`/${locale}/login`);

  return (
    <div className="mx-3 mb-3 flex items-stretch relative h-[58px]">
      {/* Glass pill background */}
      <div className="absolute inset-0 rounded-[22px] bg-white/88 backdrop-blur-2xl border border-white/60 shadow-[0_-4px_32px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)] pointer-events-none" />

      {/* Tab items */}
      {bottomTabs.map((tab) => {
        const active = isTabActive(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative flex flex-col items-center justify-center min-w-0 flex-1 z-10 gap-0.5 pt-1"
          >
            {active && (
              <motion.div
                layoutId="bottom-tab-active"
                className="absolute inset-x-1 inset-y-1 rounded-[18px] bg-green/10"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <tab.icon
              size={22}
              strokeWidth={active ? 2.5 : 1.8}
              className={`relative z-10 transition-all duration-200 ${active ? 'text-green scale-110' : 'text-dark/35'}`}
            />
            <span className={`relative z-10 text-[9px] font-black tracking-wide transition-all duration-200 ${active ? 'text-green' : 'text-dark/30'}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}

      {/* Profile tab */}
      <Link
        href={isAuthenticated ? "/profile" : "/login"}
        className="relative flex flex-col items-center justify-center min-w-0 flex-1 z-10 gap-0.5 pt-1"
      >
        {isProfileActive && (
          <motion.div
            layoutId="bottom-tab-active"
            className="absolute inset-x-1 inset-y-1 rounded-[18px] bg-green/10"
            transition={{ type: 'spring', stiffness: 500, damping: 38 }}
          />
        )}
        <div className={`relative z-10 transition-all duration-200 ${isProfileActive ? 'scale-110' : ''}`}>
          {isAuthenticated && user?.photoURL ? (
            <div className={`rounded-full overflow-hidden border-2 transition-all ${isProfileActive ? 'w-6 h-6 border-green' : 'w-6 h-6 border-dark/20'}`}>
              <img src={getPhotoURL(user.photoURL) || ''} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <User size={22} strokeWidth={isProfileActive ? 2.5 : 1.8} className={`transition-colors ${isProfileActive ? 'text-green' : 'text-dark/35'}`} />
          )}
        </div>
        <span className={`relative z-10 text-[9px] font-black tracking-wide transition-all duration-200 ${isProfileActive ? 'text-green' : 'text-dark/30'}`}>
          Me
        </span>
      </Link>
    </div>
  );
}

export const Navbar = () => {
  const { user, logout, isAuthenticated, getPhotoURL, sessionError, clearSessionError } = useAuth();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (sessionError) {
      showSnackbar(sessionError, 'error');
      clearSessionError();
    }
  }, [sessionError, showSnackbar, clearSessionError]);
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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isSettingsPage = pathname?.startsWith('/settings');
  const isChatPage = pathname?.startsWith('/profile/chat');
  const isLessonPage = pathname?.startsWith('/lesson/') || pathname?.includes('/lesson/');
  if (isSettingsPage) return null;

  const navLinksBase = [
    { href: "/", label: t('home'), icon: House },
    { href: "/explore", label: t('explore'), icon: LayoutGrid },
    { href: "/news", label: t('news'), icon: BookOpen },
    { href: "/profile/chat", label: t('chat_room'), icon: MessageCircle },
    ...(isAuthenticated ? [
      { href: "/calendar", label: t('calendar') || "Calendar", icon: CalendarDays },
      { href: "/contributions", label: t('contributions'), icon: Share2 },
    ] : []),
  ];
  const navLinks = isRTL ? [...navLinksBase].reverse() : navLinksBase;

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
          <div className="absolute -bottom-[20px] left-0 pointer-events-none w-5 h-5 bg-white rounded-tr-[20px]" />

          <Link href="/" className="flex items-center gap-2.5 group relative z-10">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shadow-lg bg-white shadow-black/10 p-1.5">
              <DarsyLogo className="w-full h-full" color="#10b981" />
            </div>
            <span className="text-[19px] font-black tracking-tighter text-white">Darsy</span>
          </Link>

          <div className="flex items-center gap-2 relative z-10">
            <LanguageSwitcher mode="compact" />
            <NotificationBell />
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

      {/* ── Desktop / Tablet Navbar ── */}
      {!isChatPage && (
        <nav className={`fixed top-0 left-0 right-0 z-50 px-3 md:px-4 lg:px-6 py-3 lg:py-6 transition-transform duration-300 hidden md:block ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between p-2.5 lg:p-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-green/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-4 group flex-shrink-0">
              <div className="w-9 h-9 lg:w-10 lg:h-10 bg-green rounded-2xl flex items-center justify-center group-hover:-translate-y-1 transition-transform shadow-lg shadow-green/20 p-2">
                <DarsyLogo className="w-full h-full" color="white" />
              </div>
              <span className="text-xl lg:text-2xl font-black text-dark tracking-tighter">Darsy</span>
            </Link>

            {/* Nav Links */}
            <div className={`flex items-center gap-0.5 lg:gap-1 min-w-0 ${isRTL ? 'flex-row-reverse' : ''}`}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative flex items-center gap-1 lg:gap-2 px-2.5 lg:px-5 py-2 lg:py-2.5 rounded-full text-muted-foreground hover:text-green hover:bg-green/5 transition-all font-bold text-xs lg:text-sm whitespace-nowrap"
                >
                  <link.icon size={15} className="flex-shrink-0" />
                  <span className="hidden lg:inline">{link.label}</span>
                  <span className="lg:hidden text-[11px]" aria-hidden="true">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Auth Actions */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3 flex-shrink-0">
              {isAuthenticated ? (
                <div className={`flex items-center gap-2 lg:gap-3 ${isRTL ? 'pr-2 lg:pr-4 border-r' : 'pl-2 lg:pl-4 border-l'} border-green/10`}>
                  <NotificationBell />
                  <Link href="/profile" className={`flex items-center gap-3 group ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`${isRTL ? 'text-left' : 'text-right'} hidden sm:block`}>
                      <p className="text-xs font-bold text-muted-foreground">{t('welcome')}</p>
                      <p className="text-sm font-black text-dark">{user?.displayName?.split(' ')[0]}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-green shadow-sm border border-green/10 group-hover:shadow-md group-hover:scale-105 transition-all overflow-hidden">
                      {user?.photoURL ? (
                        <img src={getPhotoURL(user.photoURL) || ''} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 lg:gap-3">
                  <Link
                    href="/login"
                    className="px-3 lg:px-6 py-2 lg:py-2.5 rounded-full font-bold text-xs lg:text-sm text-dark hover:bg-black/5 transition-all flex items-center gap-1.5 lg:gap-2"
                  >
                    <LogIn size={16} />
                    <span className="hidden lg:inline">{t('signin')}</span>
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 lg:px-8 py-2 lg:py-2.5 bg-green text-white font-bold rounded-full text-xs lg:text-sm shadow-[0_4px_14px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] hover:-translate-y-0.5 active:scale-95 transition-all"
                  >
                    {t('getStarted')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* ── Mobile Bottom Tab Bar — hidden on lesson + chat pages ── */}
      {!isLessonPage && <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
        <BottomNavBar
          bottomTabs={bottomTabs}
          isTabActive={isTabActive}
          isAuthenticated={isAuthenticated}
          user={user}
          getPhotoURL={getPhotoURL}
          locale={locale}
          pathname={pathname}
        />
      </nav>}
    </>
  );
};
