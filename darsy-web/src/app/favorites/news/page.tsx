'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Newspaper, Loader2, ChevronRight, ArrowLeft, Bookmark, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import NewsCard from '@/components/NewsCard';

export default function FavoriteNewsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const PER_PAGE = 6;

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            api.get('/user/saved-news')
                .then(res => setNews(res.data || []))
                .catch(() => {})
                .finally(() => setLoading(false));
        }
    }, [user]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-green" size={32} />
            </div>
        );
    }

    const totalPages = Math.ceil(news.length / PER_PAGE);
    const paged = news.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <main className="min-h-screen bg-gray-50 pt-20 md:pt-28 pb-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">

                {/* Back */}
                <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-dark/40 hover:text-dark/70 transition-colors mb-8 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back to Profile
                </Link>

                {/* Header */}
                <div className="flex items-start justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center">
                            <Newspaper size={28} className="text-sky-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-dark">Saved News</h1>
                            <p className="text-dark/50 text-sm mt-0.5">
                                {news.length} saved {news.length === 1 ? 'article' : 'articles'}
                            </p>
                        </div>
                    </div>
                    <Link href="/news"
                        className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-green text-white rounded-2xl text-sm font-bold hover:bg-green/80 transition-all shadow-md shadow-green/20">
                        Browse news <ChevronRight size={16} />
                    </Link>
                </div>

                {news.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center"
                    >
                        <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Bookmark size={28} className="text-sky-300" />
                        </div>
                        <p className="font-bold text-dark/50 text-lg mb-1">No saved articles yet</p>
                        <p className="text-dark/30 text-sm mb-8">Save articles from the news feed to find them here</p>
                        <Link href="/news"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-green text-white rounded-2xl font-bold text-sm hover:bg-green/80 transition-all shadow-md shadow-green/20">
                            Browse News <ChevronRight size={16} />
                        </Link>
                    </motion.div>
                ) : (
                    <>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={page}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {paged.map((item: any, i: number) => (
                                    <motion.div
                                        key={item._id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="w-full"
                                    >
                                        <NewsCard
                                            title={item.title}
                                            subtitle={item.type || item.category}
                                            category={item.category || 'General'}
                                            image={item.imageUrl || item.images?.[0]?.src || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=60'}
                                            href={`/news/${item._id}`}
                                            date={item.card_date || (item.date ? new Date(item.date).toLocaleDateString() : '')}
                                            readTime={item.readTime}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        </AnimatePresence>

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-10">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-all text-dark/50 hover:text-dark font-bold text-lg">
                                    ‹
                                </button>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button key={i} onClick={() => setPage(i + 1)}
                                        className={`w-10 h-10 rounded-2xl text-sm font-bold transition-all ${page === i + 1 ? 'bg-green text-white shadow-md shadow-green/20' : 'bg-white border border-gray-200 text-dark hover:border-green/40'}`}>
                                        {i + 1}
                                    </button>
                                ))}
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="w-10 h-10 rounded-2xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition-all text-dark/50 hover:text-dark font-bold text-lg">
                                    ›
                                </button>
                            </div>
                        )}

                        <div className="mt-6 text-center sm:hidden">
                            <Link href="/news"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green text-white rounded-2xl font-bold text-sm hover:bg-green/80 transition-all">
                                Browse news <ChevronRight size={16} />
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
