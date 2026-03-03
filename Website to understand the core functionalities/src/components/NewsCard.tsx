'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

interface NewsCardProps {
    title: string;
    description: string;
    date: string;
    readTime: string;
    image: string;
}

export default function NewsCard({ title, description, date, readTime, image }: NewsCardProps) {
    return (
        <motion.div
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative bg-white/5 dark:bg-zinc-900/40 backdrop-blur-xl rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/10 dark:border-violet-500/20"
        >
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-500 to-purple-700">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            </div>

            {/* Content */}
            <div className="p-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-3">
                    {description}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-500">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{readTime}</span>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>

            {/* Blue accent border */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
        </motion.div>
    );
}
