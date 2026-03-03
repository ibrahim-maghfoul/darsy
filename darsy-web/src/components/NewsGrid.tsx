'use client';

import React from 'react';
import { motion } from 'framer-motion';
import NewsCard from '@/components/NewsCard';
import { useTranslations } from 'next-intl';

interface NewsItem {
    id: string;
    title: string;
    subtitle: string;
    category: string;
    image: string;
    date: string;
    readTime: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const ITEMS_PER_PAGE = 9;

export default function NewsGrid({ items }: { items: NewsItem[] }) {
    const t = useTranslations('News');
    const [activeTab, setActiveTab] = React.useState('All');
    const [currentPage, setCurrentPage] = React.useState(1);

    const tabs = ['All', 'Bac', 'Etudiant', 'College'];

    const getTabLabel = (tab: string) => {
        if (tab === 'All') return t('tab_all');
        if (tab === 'Bac') return t('tab_bac');
        if (tab === 'Etudiant') return t('tab_etudiant');
        if (tab === 'College') return t('tab_college');
        return tab;
    };

    const filteredItems = React.useMemo(() => {
        if (activeTab === 'All') return items;
        // The scraping sets category to "Bac", "Etudiant", "College"
        return items.filter((item) => item.category === activeTab);
    }, [activeTab, items]);

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;

    const currentItems = React.useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredItems.slice(start, start + ITEMS_PER_PAGE);
    }, [currentPage, filteredItems]);

    // Reset pagination when tab changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const goTo = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-10">
            {/* Tabs Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 ${activeTab === tab
                            ? 'bg-green text-white shadow-lg shadow-green/30 scale-105'
                            : 'bg-white text-dark/60 border border-gray-100 hover:bg-gray-50 hover:text-dark'
                            }`}
                    >
                        {getTabLabel(tab)}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                key={`${activeTab}-${currentPage}`}
                className="flex flex-wrap justify-center gap-8"
            >
                {currentItems.map((item) => (
                    <motion.div key={item.id} variants={itemVariants}>
                        <NewsCard
                            title={item.title}
                            subtitle={item.subtitle}
                            category={item.category}
                            image={item.image}
                            href={`/news/${item.id}`}
                            date={item.date}
                            readTime={item.readTime}
                        />
                    </motion.div>
                ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div dir="ltr" className="flex justify-center items-center gap-2 py-8 flex-wrap">
                    {/* Prev */}
                    <button
                        onClick={() => goTo(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-full font-bold bg-white text-dark border border-gray-200 hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        ←
                    </button>

                    {/* Smart page buttons */}
                    {(() => {
                        const pages: (number | 'dot')[] = [];
                        const addPage = (p: number) => { if (!pages.includes(p)) pages.push(p); };

                        // First 3
                        for (let i = 1; i <= Math.min(3, totalPages); i++) addPage(i);

                        // Current window
                        if (currentPage > 4) pages.push('dot');
                        for (let i = Math.max(4, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) addPage(i);

                        // Last page
                        if (currentPage < totalPages - 2) pages.push('dot');
                        if (totalPages > 3) addPage(totalPages);

                        return pages.map((p, idx) =>
                            p === 'dot' ? (
                                <span key={`dot-${idx}`} className="w-10 h-10 flex items-center justify-center text-dark/30 font-bold text-lg select-none">…</span>
                            ) : (
                                <button
                                    key={p}
                                    onClick={() => goTo(p as number)}
                                    className={`w-10 h-10 rounded-full font-bold transition-all focus:outline-none ${currentPage === p
                                        ? 'bg-green text-white scale-110 shadow-md shadow-green/30'
                                        : 'bg-white text-dark border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {p}
                                </button>
                            )
                        );
                    })()}

                    {/* Next */}
                    <button
                        onClick={() => goTo(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-full font-bold bg-white text-dark border border-gray-200 hover:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    );
}
