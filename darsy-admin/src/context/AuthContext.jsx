import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('darsy_admin_user');
        const storedToken = localStorage.getItem('darsy_backend_token');
        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await fetch(`${API}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });
            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || 'Login failed' };
            }

            if (data.user.role !== 'admin') {
                return { success: false, error: 'Access denied. Admin accounts only.' };
            }

            setUser(data.user);
            setToken(data.token);
            localStorage.setItem('darsy_admin_user', JSON.stringify(data.user));
            localStorage.setItem('darsy_backend_token', data.token);
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Cannot reach the backend server.' };
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('darsy_admin_user');
        localStorage.removeItem('darsy_backend_token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!user }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
