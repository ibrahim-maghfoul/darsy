'use client';

import React from 'react';
import DeepLiquidCard from '@/components/DeepLiquidCard';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

import { getNews } from '@/services/data';

export default function NewsPage() {
    const [news, setNews] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetch() {
            try {
                const data = await getNews();
                setNews(data);
            } catch (error) {
                console.error("Failed to fetch news", error);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    if (loading && news.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 pt-24 min-h-screen">
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-black text-zinc-900 dark:text-zinc-50 mb-12"
            >
                Latest News & Updates
            </motion.h1>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                {news.map((item) => (
                    <motion.div key={item._id} variants={itemVariants} className="flex justify-center">
                        <DeepLiquidCard
                            title={item.title}
                            subtitle={item.description}
                            price={item.category}
                            image={item.imageUrl}
                            href={`/news/${item._id}`}
                            description={item.readTime || new Date(item.date || item.createdAt).toLocaleDateString()}
                        />
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
