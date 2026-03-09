"use client";

import { useState } from 'react';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

interface NewsletterCTAProps {
    ft: {
        loop: string;
        loop_desc: string;
        subscribe_placeholder: string;
        newsletter: string;
    };
}

export default function NewsletterCTA({ ft }: NewsletterCTAProps) {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setStatus('loading');
        try {
            await api.post('/newsletter/subscribe', { email });
            setStatus('success');
            setEmail('');
        } catch (err) {
            setStatus('error');
        }
    };

    return (
        <div className="bg-green py-12 px-8 md:px-16 rounded-[40px] text-center space-y-6 relative overflow-hidden max-w-4xl mx-auto">
            {/* Circled Transparent Texture */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full border-[32px] border-white/30" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full border-[48px] border-white/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/10" />
            </div>

            <div className="relative z-10 space-y-2">
                <h2 className="text-3xl font-bold text-white">{ft.loop}</h2>
                <p className="text-white/80 text-base max-w-md mx-auto">{ft.loop_desc}</p>
            </div>

            <form onSubmit={handleSubscribe} className="relative z-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <div className="flex-1 relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={ft.subscribe_placeholder}
                        disabled={status === 'success'}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:outline-none focus:bg-white focus:text-dark transition-all text-sm"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={status === 'loading' || status === 'success'}
                    className="px-8 py-3.5 rounded-2xl bg-white text-green font-bold hover:scale-105 transition-all shadow-lg active:scale-95 disabled:scale-100 disabled:opacity-70 flex items-center justify-center gap-2 min-w-[140px]"
                >
                    {status === 'loading' ? <Loader2 className="animate-spin" size={20} /> :
                        status === 'success' ? <CheckCircle2 size={20} /> :
                            ft.newsletter}
                </button>
            </form>

            <AnimatePresence>
                {status === 'success' && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white text-sm font-bold bg-white/20 inline-block px-4 py-2 rounded-full"
                    >
                        ✨ Thanks for joining the loop!
                    </motion.p>
                )}
                {status === 'error' && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white/90 text-sm font-medium"
                    >
                        Something went wrong. Please try again.
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
