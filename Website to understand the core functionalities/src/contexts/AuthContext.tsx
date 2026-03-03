'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import api from '@/lib/api';

// Define User type based on backend response
export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    profilePicture?: string;
    level?: string;
    // Add other fields as needed
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string, level?: string) => Promise<void>;
    signUp: (email: string, password: string, name: string, level?: string) => Promise<void>; // Alias with matching signature
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithFacebook: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const controller = new AbortController();
        checkAuth(controller.signal);

        return () => {
            controller.abort();
        };
    }, []);

    const checkAuth = useCallback(async (signal?: AbortSignal) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('/user/profile', { signal });
            setUser(res.data);
        } catch (error: any) {
            if (error.name === 'CanceledError' || error.name === 'AbortError' || axios.isCancel(error)) {
                // Request was aborted, don't clear state
                return;
            }
            console.error("Auth check failed:", error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [router]);

    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            const { token, user, refreshToken } = res.data;

            localStorage.setItem('token', token);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }

            setUser(user);
            router.push('/explore');
        } catch (error: any) {
            console.error("Login error:", error);
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    }, [router]);

    const register = useCallback(async (email: string, password: string, name: string, level: string = 'lycee') => {
        try {
            const res = await api.post('/auth/register', { displayName: name, email, password, level });
            const { token, user, refreshToken } = res.data;

            localStorage.setItem('token', token);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }

            setUser(user);
            router.push('/onboarding');
        } catch (error: any) {
            console.error("Registration error:", error);

            let errorMessage = 'Registration failed';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                errorMessage = error.response.data.errors.map((e: any) => e.msg).join(', ');
            }

            throw new Error(errorMessage);
        }
    }, [router]);

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.warn("Logout endpoint failed, clearing local state anyway");
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setUser(null);
            router.push('/login');
        }
    }, [router]);

    const signInWithGoogle = useCallback(async () => {
        console.warn("Google Sign-In not yet implemented with backend.");
        alert("Google Sign-In is temporarily unavailable.");
    }, []);

    const signInWithFacebook = useCallback(async () => {
        console.warn("Facebook Sign-In not yet implemented with backend.");
        alert("Facebook Sign-In is temporarily unavailable.");
    }, []);

    const contextValue = useMemo(() => ({
        user,
        loading,
        signIn: login, // Added alias to match LoginPage.tsx
        login,
        register,
        signUp: register, // Alias
        logout,
        isAuthenticated: !!user,
        signInWithGoogle,
        signInWithFacebook
    }), [user, loading, login, register, logout, signInWithGoogle, signInWithFacebook]);

    return (
        <AuthContext.Provider value={contextValue}>
            {!loading && children}
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
