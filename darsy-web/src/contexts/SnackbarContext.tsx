"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from '@/components/Snackbar';

type SnackbarType = 'success' | 'error' | 'info';

interface SnackbarContextType {
    showSnackbar: (message: string, type: SnackbarType) => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [snackbar, setSnackbar] = useState<{ message: string; type: SnackbarType; isVisible: boolean }>({
        message: '',
        type: 'info',
        isVisible: false,
    });

    const showSnackbar = useCallback((message: string, type: SnackbarType) => {
        setSnackbar({ message, type, isVisible: true });
    }, []);

    const hideSnackbar = useCallback(() => {
        setSnackbar(prev => ({ ...prev, isVisible: false }));
    }, []);

    return (
        <SnackbarContext.Provider value={{ showSnackbar }}>
            {children}
            <Snackbar
                message={snackbar.message}
                type={snackbar.type}
                isVisible={snackbar.isVisible}
                onClose={hideSnackbar}
            />
        </SnackbarContext.Provider>
    );
};

export const useSnackbar = () => {
    const context = useContext(SnackbarContext);
    if (!context) {
        throw new Error('useSnackbar must be used within a SnackbarProvider');
    }
    return context;
};
