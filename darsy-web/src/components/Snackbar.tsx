"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface SnackbarProps {
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
    onClose: () => void;
}

const Snackbar: React.FC<SnackbarProps> = ({ message, type, isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    const icons = {
        success: <CheckCircle className="text-white" size={20} />,
        error: <XCircle className="text-white" size={20} />,
        info: <Info className="text-white" size={20} />,
    };

    const colors = {
        success: 'bg-[#22C55E]',
        error: 'bg-red-500',
        info: 'bg-blue-500',
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] min-w-[300px] max-w-[90vw]"
                >
                    <div className={`${colors[type]} backdrop-blur-md bg-opacity-90 shadow-2xl rounded-[24px] p-4 pr-12 flex items-center gap-3 border border-white/20`}>
                        <div className="flex-shrink-0 bg-white/20 p-2 rounded-full">
                            {icons[type]}
                        </div>
                        <p className="text-white font-bold text-sm tracking-tight">{message}</p>
                        <button
                            onClick={onClose}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Snackbar;
