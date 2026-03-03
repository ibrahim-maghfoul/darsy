'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, AlertTriangle, MessageSquare, Send } from 'lucide-react';

export default function ReportPage() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'bug' | 'feature' | 'other'>('bug');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate sending (in production, this would store in Firestore or send to issue tracker)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setSubmitted(true);
        setLoading(false);
        setTitle('');
        setDescription('');
        setType('bug');

        setTimeout(() => setSubmitted(false), 5000);
    };

    return (
        <div className="max-w-2xl mx-auto py-12 px-4 pt-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Report an Issue</h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Help us improve DarsySchool by reporting bugs or suggesting new features.
                    </p>
                </div>

                {submitted && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg p-4"
                    >
                        <p className="text-green-800 dark:text-green-400 text-center">
                            ✓ Thank you for your report! We'll look into it.
                        </p>
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-xl shadow-lg p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-3">Issue Type</label>
                        <div className="grid grid-cols-3 gap-4">
                            <button
                                type="button"
                                onClick={() => setType('bug')}
                                className={`p-4 rounded-lg border-2 transition-all ${type === 'bug'
                                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                    : 'border-white/20 dark:border-violet-500/30 hover:border-zinc-400'
                                    }`}
                            >
                                <Bug className="w-8 h-8 mx-auto mb-2 text-red-500" />
                                <p className="text-sm font-medium">Bug</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('feature')}
                                className={`p-4 rounded-lg border-2 transition-all ${type === 'feature'
                                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                    : 'border-white/20 dark:border-violet-500/30 hover:border-zinc-400'
                                    }`}
                            >
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                                <p className="text-sm font-medium">Feature</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('other')}
                                className={`p-4 rounded-lg border-2 transition-all ${type === 'other'
                                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                    : 'border-white/20 dark:border-violet-500/30 hover:border-zinc-400'
                                    }`}
                            >
                                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                                <p className="text-sm font-medium">Other</p>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="title" className="block text-sm font-medium mb-2">
                            Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-white/20 dark:border-violet-500/30 placeholder-zinc-500 dark:placeholder-zinc-400 text-zinc-900 dark:text-zinc-100 bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Brief description of the issue"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-white/20 dark:border-violet-500/30 placeholder-zinc-500 dark:placeholder-zinc-400 text-zinc-900 dark:text-zinc-100 bg-white/5 dark:bg-zinc-800/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                            placeholder="Provide detailed information about the issue..."
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                        {loading ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
