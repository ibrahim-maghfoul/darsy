'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import api from '@/lib/api';

interface Instructor {
    _id: string;
    displayName: string;
    photoURL?: string;
    courseCount: number;
}

export default function InstructorsPage() {
    const t = useTranslations('Instructors');
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchInstructors();
    }, []);

    const fetchInstructors = async () => {
        try {
            setLoading(true);
            const res = await api.get('/instructor');
            setInstructors(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch instructors');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-green mx-auto mb-4 animate-spin"></div>
                    <p className="text-dark/60">{t('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-green/5 pt-20 md:pt-32 pb-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-dark mb-3">
                        {t('title')}
                    </h1>
                    <p className="text-dark/60 text-lg">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700">
                        {error}
                    </div>
                )}

                {/* Instructors grid */}
                {instructors.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-dark/60 text-lg">
                            {t('empty')}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {instructors.map((instructor) => (
                            <Link
                                key={instructor._id}
                                href={`/instructor/${instructor._id}`}
                                className="group"
                            >
                                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-green/20 h-full flex flex-col">
                                    {/* Avatar */}
                                    <div className="bg-gradient-to-br from-green/10 to-green/5 p-8 flex items-center justify-center">
                                        {instructor.photoURL ? (
                                            <Image
                                                src={instructor.photoURL.startsWith('http') ? instructor.photoURL : `${process.env.NEXT_PUBLIC_BACKEND_URL}/data/images/profile-picture/${instructor.photoURL}`}
                                                alt={instructor.displayName}
                                                width={100}
                                                height={100}
                                                className="w-24 h-24 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green to-green/60 flex items-center justify-center">
                                                <span className="text-3xl font-bold text-white">
                                                    {instructor.displayName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 p-6 flex flex-col">
                                        <h3 className="text-xl font-bold text-dark mb-2 group-hover:text-green transition-colors">
                                            {instructor.displayName}
                                        </h3>

                                        <div className="flex items-center gap-2 mt-auto">
                                            <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center">
                                                <span className="text-sm font-semibold text-green">
                                                    {instructor.courseCount}
                                                </span>
                                            </div>
                                            <span className="text-sm text-dark/60">
                                                {instructor.courseCount === 1
                                                    ? t('course')
                                                    : t('courses')}
                                            </span>
                                        </div>

                                        <button className="mt-4 w-full px-4 py-2.5 bg-green/10 border border-green text-green rounded-xl font-semibold hover:bg-green hover:text-white transition-all duration-300">
                                            {t('viewProfile')}
                                        </button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
