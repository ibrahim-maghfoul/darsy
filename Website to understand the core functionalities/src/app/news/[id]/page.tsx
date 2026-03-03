'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getNewsById } from '@/services/data';
import { Calendar, User, Clock, ChevronLeft, Tag, Share2 } from 'lucide-react';
import Link from 'next/link';
import { BlobButton } from '@/components/ui/BlobButton';

export default function NewsDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [news, setNews] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDetail() {
            if (!id) return;
            try {
                const data = await getNewsById(id);
                setNews(data);
            } catch (error) {
                console.error("Failed to fetch news detail", error);
            } finally {
                setLoading(false);
            }
        }
        fetchDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!news) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-32 text-center">
                <h1 className="text-2xl font-bold mb-4">News not found</h1>
                <BlobButton href="/news">Back to News</BlobButton>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-24 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Link */}
                <Link
                    href="/news"
                    className="inline-flex items-center gap-2 text-zinc-500 hover:text-purple-600 transition-colors mb-8 group"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Back to all news
                </Link>

                <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Header Image */}
                    <div className="relative aspect-video rounded-3xl overflow-hidden mb-12 shadow-2xl border border-white/10 dark:border-violet-500/20">
                        <img
                            src={news.image}
                            alt={news.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-6 left-6">
                            <span className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-bold shadow-lg flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                {news.category}
                            </span>
                        </div>
                    </div>

                    {/* Content Header */}
                    <header className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-zinc-50 mb-6 leading-tight">
                            {news.title}
                        </h1>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8 font-medium">
                            {news.subtitle}
                        </p>

                        <div className="flex flex-wrap items-center gap-6 py-6 border-y border-white/10 dark:border-violet-500/20">
                            <div className="flex items-center gap-2 text-zinc-500">
                                <Calendar className="w-5 h-5" />
                                <span>{new Date(news.date).toLocaleDateString()}</span>
                            </div>
                            {news.author && (
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <User className="w-5 h-5" />
                                    <span>{news.author}</span>
                                </div>
                            )}
                            {news.readTime && (
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <Clock className="w-5 h-5" />
                                    <span>{news.readTime}</span>
                                </div>
                            )}
                            <button className="ml-auto p-2 text-zinc-400 hover:text-purple-600 transition-colors">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>
                    </header>

                    {/* Main Content */}
                    <div className="prose prose-lg prose-zinc dark:prose-invert max-w-none">
                        {(news.content || news.description || '').split('\n').map((paragraph: string, i: number) => {
                            if (paragraph.startsWith('### ')) {
                                return <h3 key={i} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace('### ', '')}</h3>;
                            }
                            if (paragraph.startsWith('- ')) {
                                return <li key={i} className="mb-2 list-inside">{paragraph.replace('- ', '')}</li>;
                            }
                            return <p key={i} className="mb-6 leading-relaxed text-zinc-700 dark:text-zinc-300">
                                {paragraph}
                            </p>;
                        })}
                    </div>
                </motion.article>

                {/* Footer CTA */}
                <div className="mt-20 p-12 bg-zinc-900 rounded-3xl border border-zinc-800 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-purple-600/5 group-hover:bg-purple-600/10 transition-colors" />
                    <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Continue Learning with DarsySchool</h3>
                    <p className="text-zinc-400 mb-8 max-w-lg mx-auto relative z-10">
                        Stay updated with more educational content and start your learning journey today.
                    </p>
                    <div className="relative z-10">
                        <BlobButton href="/explore">Explore All Subjects</BlobButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
