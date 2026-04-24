'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User } from '@/types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    register: (email: string, password: string, name: string, nickname: string, referralCode?: string) => Promise<void>;
    googleLogin: (accessToken: string, referralCode?: string, rememberMe?: boolean) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    checkAuth: () => Promise<void>;
    refreshUser: () => void;
    getPhotoURL: (url: string | undefined | null) => string | null;
    getResourceURL: (url: string | undefined | null) => string | null;
    sessionError: string | null;
    clearSessionError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Throttle: only allow checkAuth once per interval
const CHECK_AUTH_THROTTLE = 10_000; // 10 seconds

function getDashboardPath(role: string) {
    if (role === 'teacher') return '/teacher/dashboard';
    if (role === 'instructor') return '/instructor-dashboard';
    return '/explore';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const router = useRouter();
    const lastCheckRef = useRef(0);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearSessionError = useCallback(() => setSessionError(null), []);

    const checkAuth = useCallback(async () => {
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        // Throttle: skip if we checked recently
        const now = Date.now();
        if (now - lastCheckRef.current < CHECK_AUTH_THROTTLE) return;
        lastCheckRef.current = now;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await api.get('/user/profile', { signal: controller.signal });
            setUser(res.data);
        } catch (error: any) {
            if (error?.code !== 'ERR_NETWORK' && error?.code !== 'ERR_CANCELED') {
                console.error("Auth check failed:", error);
            }
            if (error?.response?.data?.code === 'SESSION_INVALIDATED') {
                setSessionError('Your account was logged in from another device. You have been signed out.');
                router.push('/');
            }
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            clearTimeout(timeout);
            setLoading(false);
        }
    }, [router]);

    /**
     * Debounced refresh: call this instead of checkAuth() after mutations.
     * Coalesces multiple rapid calls into a single API call after 2s.
     */
    const refreshUser = useCallback(() => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => {
            lastCheckRef.current = 0; // reset throttle so the check goes through
            checkAuth();
        }, 2000);
    }, [checkAuth]);

    useEffect(() => {
        checkAuth();
        return () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, [checkAuth]);

    const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
        try {
            const res = await api.post('/auth/login', { email, password, rememberMe });
            const { token, user: userData } = res.data;

            if (typeof window !== 'undefined') {
                localStorage.setItem('token', token);
            }

            setUser(userData);
            router.push(getDashboardPath(userData.role));
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Login failed';
            console.error("Login attempt failed:", errorMsg);
            throw new Error(errorMsg);
        }
    }, [router]);

    const register = useCallback(async (email: string, password: string, name: string, nickname: string, referralCode?: string) => {
        try {
            const res = await api.post('/auth/register', { displayName: name, email, password, nickname, ...(referralCode ? { referralCode } : {}) });
            const { token, user: userData } = res.data;

            if (typeof window !== 'undefined') {
                localStorage.setItem('token', token);
            }

            setUser(userData);
            router.push('/onboarding');
        } catch (error: any) {
            const data = error.response?.data;
            let errorMsg = 'Registration failed';
            if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
                errorMsg = data.errors[0].msg;
            } else if (data?.error) {
                errorMsg = data.error;
            }
            console.error("Registration attempt failed:", errorMsg);
            throw new Error(errorMsg);
        }
    }, [router]);

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.warn("Logout endpoint failed, clearing local state anyway");
        } finally {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
            }
            setUser(null);
            setSessionError(null);
            router.push('/');
        }
    }, [router]);

    const googleLogin = useCallback(async (accessToken: string, referralCode?: string, rememberMe: boolean = false) => {
        try {
            const res = await api.post('/auth/google', { accessToken, ...(referralCode ? { referralCode } : {}), rememberMe });
            const { token, user: userData, isNewUser } = res.data;

            if (typeof window !== 'undefined') {
                localStorage.setItem('token', token);
            }

            setUser(userData);

            if (isNewUser) {
                router.push('/onboarding');
            } else {
                router.push(getDashboardPath(userData.role));
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Google Login failed';
            console.error("Google Login attempt failed:", errorMsg);
            throw new Error(errorMsg);
        }
    }, [router]);

    const getPhotoURL = useCallback((url: string | undefined | null) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        if (!url.includes('/')) return `/data/images/profile-picture/${url}`;
        return url.startsWith('/') ? url : `/${url}`;
    }, []);

    const getResourceURL = useCallback((url: string | undefined | null) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        if (!url.includes('/')) return `/data/resources/${url}`;
        return url.startsWith('/') ? url : `/${url}`;
    }, []);

    const contextValue = useMemo(() => ({
        user,
        loading,
        login,
        register,
        googleLogin,
        logout,
        isAuthenticated: !!user,
        checkAuth,
        refreshUser,
        getPhotoURL,
        getResourceURL,
        sessionError,
        clearSessionError,
    }), [user, loading, login, register, googleLogin, logout, checkAuth, refreshUser, getPhotoURL, getResourceURL, sessionError, clearSessionError]);

    return (
        <AuthContext.Provider value={contextValue}>
            {loading && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fff',
                    zIndex: 9999
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid #f3f3f3',
                            borderTop: '3px solid #3aaa6a',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <p style={{ color: '#666', fontSize: '14px' }}>Loading...</p>
                    </div>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
