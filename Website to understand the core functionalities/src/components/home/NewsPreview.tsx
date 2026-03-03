'use client';

import React from 'react';
import { motion } from 'framer-motion';
import DeepLiquidCard from '@/components/DeepLiquidCard';
import Link from 'next/link';
import { BlobButton } from '@/components/ui/BlobButton';
import { ArrowRight } from 'lucide-react';

import { getNews } from '@/services/data';

export default function NewsPreview() {
    const [newsItems, setNewsItems] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetch() {
            try {
                const data = await getNews();
                setNewsItems(data.slice(0, 3)); // Show top 3
            } catch (error) {
                console.error("Failed to fetch news", error);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    if (loading && newsItems.length === 0) return null;
    return (
        <section className="py-20 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl font-bold mb-4">Latest News & Updates</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                        Stay up to date with the latest announcements, events, and educational content.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {newsItems.map((item, index) => (
                        <motion.div
                            key={item._id || item.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex justify-center"
                        >
                            <DeepLiquidCard
                                title={item.title}
                                subtitle={item.subtitle}
                                price={item.category || item.price}
                                image={item.image}
                                href={`/news/${item._id || item.id}`}
                                description={item.readTime}
                            />
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="flex justify-center"
                >
                    <BlobButton
                        href="/news"
                        className="px-10 py-4"
                    >
                        View All News
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                    </BlobButton>
                </motion.div>
            </div>
        </section>
    );
}
