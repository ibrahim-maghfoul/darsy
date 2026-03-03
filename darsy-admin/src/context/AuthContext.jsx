import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for persistent login
        const storedUser = localStorage.getItem('darsy_admin_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        // In a real app, this would call the backend login endpoint
        // For now, we'll simulate a successful login for "admin@darsy.com"
        if (email === 'admin@darsy.com' && password === 'admin123') {
            const adminUser = { email, role: 'admin', name: 'Admin User' };
            setUser(adminUser);
            localStorage.setItem('darsy_admin_user', JSON.stringify(adminUser));
            return { success: true };
        } else {
            return { success: false, error: 'Invalid credentials' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('darsy_admin_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
