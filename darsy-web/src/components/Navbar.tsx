"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogIn, Compass, Newspaper, Home, Tag } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";

export const Navbar = () => {
  const { user, logout, isAuthenticated, getPhotoURL } = useAuth();
  const t = useTranslations('Navbar');
  const locale = useLocale();
  const pathname = usePathname();
  const isRTL = locale === 'ar';
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  // Early return MUST come after all hooks
  const isSettingsPage = pathname?.startsWith('/settings');
  const isChatPage = pathname?.startsWith('/profile/chat');
  if (isSettingsPage || isChatPage) return null;

  const navLinks = [
    { href: "/", label: t('home'), icon: Home },
    { href: "/explore", label: t('explore'), icon: Compass },
    { href: "/news", label: t('news'), icon: Newspaper },
    { href: "/pricing", label: t('pricing'), icon: Tag },
    { href: isAuthenticated ? "/profile" : "/signup", label: t('profile'), icon: User },
  ].sort((a, b) => isRTL ? -1 : 0); // Reverse order for RTL if needed, but flex-row already handles it usually? 
  // Actually, flex-row-reverse is better. 


  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-6 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between p-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-green/10 shadow-xl shadow-green/5">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 px-4 group">
          <div className="w-10 h-10 bg-green rounded-2xl flex items-center justify-center group-hover:rotate-[15deg] transition-transform">
            <span className="text-white font-black text-xl italic">D</span>
          </div>
          <span className="text-2xl font-black text-dark tracking-tighter">Darsy</span>
        </Link>

        {/* Nav Links */}
        <div className={`hidden md:flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-muted-foreground hover:text-green hover:bg-green/5 transition-all font-bold text-sm"
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className={`flex items-center gap-4 ${isRTL ? 'pr-4 border-r' : 'pl-4 border-l'} border-green/10`}>
              <Link href="/profile" className={`flex items-center gap-3 group ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`${isRTL ? 'text-left' : 'text-right'} hidden sm:block`}>
                  <p className="text-xs font-bold text-muted-foreground">{t('welcome')}</p>
                  <p className="text-sm font-black text-dark">{user?.displayName?.split(' ')[0]}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center text-green group-hover:bg-green group-hover:text-white transition-all overflow-hidden border border-green/5">
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
                className="px-6 py-2.5 rounded-2xl font-bold text-sm text-dark hover:bg-green/5 transition-all flex items-center gap-2"
              >
                <LogIn size={18} />
                {t('signin')}
              </Link>
              <Link
                href="/signup"
                className="px-8 py-2.5 bg-green text-white font-black rounded-2xl text-sm shadow-lg shadow-green/10 hover:shadow-green/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {t('getStarted')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
