'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
    getPhotoURL: (url: string | undefined | null) => string | null;
    getResourceURL: (url: string | undefined | null) => string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const checkAuth = useCallback(async () => {
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const res = await api.get('/user/profile', { signal: controller.signal });
            setUser(res.data);
        } catch (error) {
            console.error("Auth check failed:", error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            clearTimeout(timeout);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
        try {
            const res = await api.post('/auth/login', { email, password, rememberMe });
            const { token, user: userData } = res.data;

            if (typeof window !== 'undefined') {
                localStorage.setItem('token', token);
            }

            setUser(userData);
            router.push('/explore');
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
            // Backend returns { errors: [{msg: '...'}] } on validation failure
            // or { error: '...' } on other errors
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
                router.push('/explore');
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

        // If it's just a filename (no slashes), prepend the profile picture path
        if (!url.includes('/')) {
            return `/data/images/profile-picture/${url}`;
        }

        // For legacy paths that already start with /data, return as-is (they are relative)
        // If they don't start with / but have slashes, prepend /
        return url.startsWith('/') ? url : `/${url}`;
    }, []);

    const getResourceURL = useCallback((url: string | undefined | null) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;

        // If it's just a filename, prepend the resources path
        if (!url.includes('/')) {
            return `/data/resources/${url}`;
        }

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
        getPhotoURL,
        getResourceURL,
    }), [user, loading, login, register, googleLogin, logout, checkAuth, getPhotoURL, getResourceURL]);

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
                            borderTop: '3px solid #3498db',
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
