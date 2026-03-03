"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, User, LogOut, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { user, logout } = useAuth();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        setUserMenuOpen(false);
    };

    const linkClass =
        "text-sm font-medium text-blue-200 hover:text-white hover:bg-blue-500/20 px-3 py-2 rounded-lg transition-all";

    return (
        <nav
            className={`fixed w-full z-50 transition-all duration-300 ${scrolled
                ? "bg-zinc-950/80 backdrop-blur-xl border-b border-blue-500/20 shadow-lg shadow-blue-900/10"
                : "bg-transparent"
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                        <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold text-white"
                            style={{
                                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                                boxShadow: "0 2px 12px rgba(59,130,246,0.5)",
                            }}
                        >
                            📖
                        </div>
                        <span className="text-sm font-bold text-white tracking-tight">
                            9eray
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        <Link href="/" className={linkClass}>Overview</Link>
                        <Link href="/explore" className={linkClass}>Explore</Link>
                        <Link href="/news" className={linkClass}>News</Link>
                        <Link href="/contact" className={linkClass}>Contact</Link>
                    </div>

                    {/* Right Actions */}
                    <div className="hidden md:flex items-center gap-2">
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 p-1 rounded-full transition-colors hover:bg-violet-500/20"
                                >
                                    {user.profilePicture ? (
                                        <img
                                            src={user.profilePicture}
                                            alt="Profile"
                                            className="w-9 h-9 rounded-full border-2 border-violet-500 shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-lg">
                                            <User size={20} />
                                        </div>
                                    )}
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-zinc-900 rounded-xl shadow-xl border border-violet-500/20 py-1">
                                        <Link
                                            href="/profile"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-200 hover:bg-violet-500/20 transition-colors"
                                        >
                                            <User size={15} /> Profile
                                        </Link>
                                        <Link
                                            href="/settings"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-200 hover:bg-violet-500/20 transition-colors"
                                        >
                                            <Settings size={15} /> Settings
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-violet-500/20 transition-colors"
                                        >
                                            <LogOut size={15} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-sm font-semibold text-blue-200 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 transition-all"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all"
                                    style={{
                                        background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                        boxShadow: "0 2px 12px rgba(59,130,246,0.38)",
                                    }}
                                >
                                    Start learning →
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile toggle */}
                    <div className="-mr-2 flex md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-lg text-violet-300 hover:bg-violet-500/20 transition-colors"
                        >
                            {isOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-zinc-950/95 backdrop-blur-xl border-b border-violet-500/20">
                    <div className="px-4 pt-3 pb-4 space-y-1">
                        {[
                            { href: "/", label: "Overview" },
                            { href: "/explore", label: "Explore" },
                            { href: "/news", label: "News" },
                            { href: "/contact", label: "Contact" },
                        ].map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                onClick={() => setIsOpen(false)}
                                className="block px-3 py-2 rounded-lg text-sm font-medium text-violet-200 hover:bg-violet-500/20 transition-colors"
                            >
                                {l.label}
                            </Link>
                        ))}

                        <div className="pt-2 border-t border-violet-500/20 space-y-1">
                            {user ? (
                                <>
                                    <Link href="/profile" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-violet-200 hover:bg-violet-500/20">Profile</Link>
                                    <Link href="/settings" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-violet-200 hover:bg-violet-500/20">Settings</Link>
                                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-violet-500/20">Logout</button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-violet-200 hover:bg-violet-500/20">Sign in</Link>
                                    <Link href="/signup" onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700">Start learning →</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
