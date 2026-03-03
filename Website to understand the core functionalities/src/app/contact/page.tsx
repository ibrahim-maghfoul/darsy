'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, User as UserIcon, Send } from 'lucide-react';

export default function ContactPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate sending (in production, this would call a Firebase Function or email API)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setSubmitted(true);
        setLoading(false);
        setName('');
        setEmail('');
        setMessage('');

        setTimeout(() => setSubmitted(false), 5000);
    };

    return (
        <div className="max-w-2xl mx-auto pt-24 pb-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Have a question? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                    </p>
                </div>

                {submitted && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg p-4"
                    >
                        <p className="text-green-800 dark:text-green-400 text-center">
                            ✓ Thank you for contacting us! We'll get back to you soon.
                        </p>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg p-8 space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                            Name
                        </label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                            <input
                                id="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-10 appearance-none rounded-lg relative block w-full px-3 py-3 border border-white/20 dark:border-violet-500/30 placeholder-zinc-500 dark:placeholder-zinc-400 text-zinc-900 dark:text-zinc-100 bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Your name"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 appearance-none rounded-lg relative block w-full px-3 py-3 border border-white/20 dark:border-violet-500/30 placeholder-zinc-500 dark:placeholder-zinc-400 text-zinc-900 dark:text-zinc-100 bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="your.email@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm font-medium mb-2">
                            Message
                        </label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-zinc-400" />
                            <textarea
                                id="message"
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                                className="pl-10 appearance-none rounded-lg relative block w-full px-3 py-3 border border-white/20 dark:border-violet-500/30 placeholder-zinc-500 dark:placeholder-zinc-400 text-zinc-900 dark:text-zinc-100 bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                placeholder="How can we help you?"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                        {loading ? 'Sending...' : 'Send Message'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
