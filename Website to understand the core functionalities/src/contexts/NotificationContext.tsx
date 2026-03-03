'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
    id: string;
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
        const id = Math.random().toString(36).substring(7);
        setNotifications((prev) => [...prev, { id, message, type }]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
    }, []);

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5" />;
            case 'error':
                return <AlertCircle className="w-5 h-5" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5" />;
            default:
                return <Info className="w-5 h-5" />;
        }
    };

    const getColors = (type: NotificationType) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900 text-green-800 dark:text-green-400';
            case 'error':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900 text-red-800 dark:text-red-400';
            case 'warning':
                return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-400';
            default:
                return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-900 text-purple-800 dark:text-purple-400';
        }
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
                <AnimatePresence>
                    {notifications.map((notification) => (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg ${getColors(notification.type)}`}
                        >
                            {getIcon(notification.type)}
                            <p className="flex-1 font-medium">{notification.message}</p>
                            <button
                                onClick={() => removeNotification(notification.id)}
                                className="hover:opacity-70 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};
