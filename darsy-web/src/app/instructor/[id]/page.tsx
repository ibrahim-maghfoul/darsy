'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { InstructorCourse, InstructorRating } from '@/types';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    Star, BookOpen, Video, FileText, Eye, Download,
    GraduationCap, MessageSquare, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

function imgURL(url?: string | null, type: 'avatar' | 'cover' = 'avatar') {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const dir = type === 'avatar' ? 'profile-picture' : 'cover-photos';
    return `/data/images/${dir}/${url}`;
}

function Stars({ value, max = 5, interactive = false, onChange }: {
    value: number; max?: number; interactive?: boolean; onChange?: (v: number) => void;
}) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: max }, (_, i) => {
                const filled = (interactive ? (hover || value) : value) > i;
                return (
                    <button key={i} type="button" disabled={!interactive}
                        onClick={() => interactive && onChange?.(i + 1)}
                        onMouseEnter={() => interactive && setHover(i + 1)}
                        onMouseLeave={() => interactive && setHover(0)}
                        className={interactive ? 'cursor-pointer' : 'cursor-default'}>
                        <Star size={interactive ? 24 : 14}
                            className={filled ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'} />
                    </button>
                );
            })}
        </div>
    );
}

interface InstructorProfile {
    user: { _id: string; displayName: string; photoURL?: string; coverPhotoURL?: string; };
    profile: { fullName: string; specialist: string; } | null;
    courses: InstructorCourse[];
    courseCount: number;
    averageRating: number;
    totalRatings: number;
}

interface RatingsData {
    ratings: InstructorRating[];
    averageRating: number;
    totalRatings: number;
}

export default function InstructorProfilePage() {
    const params = useParams();
    const instructorId = params.id as string;
    const { user } = useAuth();

    const [profile, setProfile] = useState<InstructorProfile | null>(null);
    const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [myRating, setMyRating] = useState(0);
    const [myFeedback, setMyFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [ratingError, setRatingError] = useState('');
    const [ratingSuccess, setRatingSuccess] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            setLoading(true);
            const [profRes, ratRes] = await Promise.all([
                api.get(`/instructor/${instructorId}`),
                api.get(`/instructor/${instructorId}/ratings`),
            ]);
            setProfile(profRes.data);
            setRatingsData(ratRes.data);

            if (user) {
                const existing = ratRes.data.ratings.find((r: InstructorRating) => r.userId._id === user.id);
                if (existing) { setMyRating(existing.rating); setMyFeedback(existing.feedback || ''); }
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Instructor not found');
        } finally {
            setLoading(false);
        }
    }, [instructorId, user]);

    useEffect(() => { if (instructorId) fetchProfile(); }, [fetchProfile]);

    const handleView = (courseId: string) => {
        api.post(`/instructor/courses/${courseId}/view`).catch(() => {});
    };

    const handleSubmitRating = async () => {
        if (!myRating) { setRatingError('Please select a star rating'); return; }
        setSubmitting(true); setRatingError('');
        try {
            await api.post(`/instructor/${instructorId}/rate`, { rating: myRating, feedback: myFeedback });
            setRatingSuccess(true);
            const ratRes = await api.get(`/instructor/${instructorId}/ratings`);
            setRatingsData(ratRes.data);
            setTimeout(() => setRatingSuccess(false), 3000);
        } catch (err: any) {
            setRatingError(err.response?.data?.error || 'Failed to submit rating');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-green" size={36} />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-dark mb-2">Not Found</h1>
                    <p className="text-dark/60">{error || 'Instructor not found'}</p>
                    <Link href="/instructors" className="mt-4 inline-block text-green font-semibold hover:underline">Browse instructors</Link>
                </div>
            </div>
        );
    }

    const { user: instrUser, profile: instrProfile, courses } = profile;
    const isOwnProfile = user?.id === instrUser._id;
    const displayedRatings = showAllReviews ? (ratingsData?.ratings || []) : (ratingsData?.ratings || []).slice(0, 3);

    return (
        <main className="min-h-screen bg-gray-50 pb-16">

            {/* Cover photo */}
            <div className="relative w-full h-56 md:h-72 overflow-hidden bg-gradient-to-br from-[#0a2a1a] to-[#166534]">
                {imgURL(instrUser.coverPhotoURL, 'cover') ? (
                    <Image src={imgURL(instrUser.coverPhotoURL, 'cover')!} alt="cover" fill className="object-cover" unoptimized />
                ) : (
                    <div className="absolute inset-0"
                        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                {/* Profile info overlaid at bottom of cover */}
                <div className="absolute bottom-0 left-0 right-0 max-w-4xl mx-auto px-6 pb-5 flex items-end justify-between gap-4">
                    <div className="flex items-end gap-4">
                        <div className="w-20 h-20 rounded-[20px] border-[3px] border-white/30 shadow-2xl shadow-black/40 overflow-hidden bg-gradient-to-br from-green to-green/60 flex-shrink-0 relative">
                            {imgURL(instrUser.photoURL) ? (
                                <Image src={imgURL(instrUser.photoURL)!} alt={instrUser.displayName} fill className="object-cover" unoptimized />
                            ) : (
                                <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">{instrUser.displayName.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="pb-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <GraduationCap size={13} className="text-green-300" />
                                <span className="text-[11px] font-bold text-green-300 uppercase tracking-widest">Instructor</span>
                            </div>
                            <h1 className="text-xl font-bold text-white">{instrUser.displayName}</h1>
                            {instrProfile?.specialist && <p className="text-white/60 text-sm mt-0.5">{instrProfile.specialist}</p>}
                        </div>
                    </div>
                    {/* Stats chips */}
                    <div className="flex items-center gap-2 pb-1 flex-wrap justify-end">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                            <BookOpen size={13} className="text-white/80" />
                            <span className="text-sm font-bold text-white">{courses.length}</span>
                            <span className="text-xs text-white/60">courses</span>
                        </div>
                        {(ratingsData?.totalRatings || 0) > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/20 backdrop-blur-sm rounded-xl border border-amber-300/30">
                                <Star size={13} className="text-amber-300 fill-amber-300" />
                                <span className="text-sm font-bold text-white">{ratingsData?.averageRating}</span>
                                <span className="text-xs text-white/60">({ratingsData?.totalRatings})</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">

                {/* Courses */}
                <section className="mb-10">
                    <h2 className="text-xl font-bold text-dark mb-5">Courses</h2>
                    {courses.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                            <BookOpen className="text-dark/20 mx-auto mb-3" size={40} />
                            <p className="font-semibold text-dark/60">No courses uploaded yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {courses.map(course => (
                                <div key={course._id}
                                    className="group bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-green/8 hover:border-green/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                    onClick={() => handleView(course._id)}>
                                    {/* Rich texture header */}
                                    <div
                                        className={`h-32 flex items-center justify-center relative overflow-hidden ${course.videoUrl ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-rose-500 to-pink-700'}`}
                                        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
                                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/25">
                                            {course.videoUrl ? <Video className="text-white" size={28} /> : <FileText className="text-white" size={28} />}
                                        </div>
                                        <span className={`absolute top-3 right-3 text-xs font-black px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-sm border border-white/25 text-white tracking-wider`}>
                                            {course.videoUrl ? 'VIDEO' : 'PDF'}
                                        </span>
                                    </div>

                                    <div className="p-5">
                                        <h3 className="font-bold text-dark mb-2 line-clamp-2 leading-snug text-[15px]">{course.title}</h3>
                                        {course.description && (
                                            <p className="text-sm text-dark/45 line-clamp-2 mb-4 leading-relaxed">{course.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
                                            <span className="text-xs text-dark/40 flex items-center gap-1.5 font-medium">
                                                <Eye size={12} className="text-blue-400" /> {course.viewCount || 0} views
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Ratings & Reviews */}
                <section>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-bold text-dark flex items-center gap-2">
                            <MessageSquare size={20} className="text-green" /> Reviews
                        </h2>
                        {(ratingsData?.totalRatings || 0) > 0 && (
                            <div className="flex items-center gap-2">
                                <Stars value={ratingsData?.averageRating || 0} />
                                <span className="font-bold text-dark">{ratingsData?.averageRating}</span>
                                <span className="text-sm text-dark/50">· {ratingsData?.totalRatings} reviews</span>
                            </div>
                        )}
                    </div>

                    {/* Rating form */}
                    {!user ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-6 text-center mb-6">
                            <p className="text-dark/60 text-sm">
                                <Link href="/login" className="text-green font-semibold hover:underline">Log in</Link> to rate this instructor
                            </p>
                        </div>
                    ) : !isOwnProfile ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                            <h3 className="font-bold text-dark mb-4">
                                {ratingsData?.ratings.some(r => r.userId._id === user.id) ? 'Update your rating' : 'Rate this instructor'}
                            </h3>
                            <div className="mb-3">
                                <Stars value={myRating} interactive onChange={setMyRating} />
                            </div>
                            <textarea
                                value={myFeedback}
                                onChange={e => setMyFeedback(e.target.value)}
                                placeholder="Share your experience (optional)..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green outline-none text-sm resize-none mb-3"
                            />
                            {ratingError && <p className="text-red-500 text-sm mb-2">{ratingError}</p>}
                            {ratingSuccess && <p className="text-green font-semibold text-sm mb-2">Rating submitted!</p>}
                            <button
                                onClick={handleSubmitRating}
                                disabled={submitting || !myRating}
                                className="px-6 py-2.5 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green/80 transition-all disabled:opacity-50 flex items-center gap-2">
                                {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting...</> : 'Submit Rating'}
                            </button>
                        </div>
                    ) : null}

                    {/* Reviews list */}
                    {(ratingsData?.totalRatings || 0) === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                            <Star size={32} className="text-gray-200 mx-auto mb-2" />
                            <p className="text-dark/50 text-sm">No reviews yet. Be the first!</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {displayedRatings.map(r => {
                                    const reviewer = r.userId;
                                    const rPhoto = imgURL(reviewer.photoURL);
                                    return (
                                        <div key={r._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md p-5 flex gap-4 transition-all">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green to-green/60 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                                {rPhoto ? (
                                                    <Image src={rPhoto} alt={reviewer.displayName} fill className="object-cover" unoptimized />
                                                ) : (
                                                    <span className="text-white font-bold text-sm">{reviewer.displayName?.charAt(0)?.toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                                                    <span className="font-bold text-dark text-sm">{reviewer.displayName}</span>
                                                    <span className="text-xs text-dark/40">{new Date(r.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <Stars value={r.rating} />
                                                {r.feedback && <p className="text-sm text-dark/70 mt-1.5">{r.feedback}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {(ratingsData?.ratings.length || 0) > 3 && (
                                <button
                                    onClick={() => setShowAllReviews(!showAllReviews)}
                                    className="mt-4 w-full py-3 border border-gray-200 rounded-2xl text-sm font-semibold text-dark/60 hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                    {showAllReviews
                                        ? <><ChevronUp size={16} /> Show less</>
                                        : <><ChevronDown size={16} /> Show all {ratingsData?.totalRatings} reviews</>}
                                </button>
                            )}
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}
