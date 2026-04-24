'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    ArrowLeft, Star, BookOpen, Video, FileText, Eye,
    GraduationCap, Loader2, CheckCircle2, ChevronDown, ChevronUp,
    Download,
} from 'lucide-react';
import { InstructorCourse, InstructorRating } from '@/types';

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
        <div className="flex items-center gap-1">
            {Array.from({ length: max }, (_, i) => {
                const filled = (interactive ? (hover || value) : value) > i;
                return (
                    <button key={i} type="button" disabled={!interactive}
                        onClick={() => interactive && onChange?.(i + 1)}
                        onMouseEnter={() => interactive && setHover(i + 1)}
                        onMouseLeave={() => interactive && setHover(0)}
                        style={{ background: 'none', border: 'none', padding: '1px', cursor: interactive ? 'pointer' : 'default' }}
                    >
                        <Star
                            size={interactive ? 20 : 12}
                            className={filled ? 'text-amber-400 fill-amber-400' : 'text-dark/20 fill-dark/20'}
                        />
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
    const router = useRouter();

    const [profile, setProfile] = useState<InstructorProfile | null>(null);
    const [ratingsData, setRatingsData] = useState<RatingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [myRating, setMyRating] = useState(0);
    const [myFeedback, setMyFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [ratingSuccess, setRatingSuccess] = useState(false);
    const [ratingError, setRatingError] = useState('');
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
        } catch {
            router.push('/');
        } finally {
            setLoading(false);
        }
    }, [instructorId, user, router]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

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

    if (loading) return (
        <div className="min-h-screen bg-[#F8F9FA] animate-pulse">
            <div className="w-full h-52 bg-gradient-to-br from-[#071a0e] to-[#1a3a2a]" />
            <div className="max-w-3xl mx-auto px-4 pt-6 space-y-4">
                <div className="h-32 rounded-[18px] bg-white border border-[rgba(58,170,106,0.11)]" />
                <div className="h-48 rounded-[18px] bg-white border border-[rgba(58,170,106,0.11)]" />
                <div className="h-64 rounded-[18px] bg-white border border-[rgba(58,170,106,0.11)]" />
            </div>
        </div>
    );

    if (!profile) return null;

    const { user: instrUser, profile: instrProfile, courses } = profile;
    const isOwnProfile = user?.id === instrUser._id;
    const coverUrl = imgURL(instrUser.coverPhotoURL, 'cover');
    const avatarUrl = imgURL(instrUser.photoURL);
    const displayedRatings = showAllReviews
        ? (ratingsData?.ratings || [])
        : (ratingsData?.ratings || []).slice(0, 3);

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24">

            {/* ── Cover Hero ── */}
            <div className="relative w-full h-52 md:h-64 overflow-hidden bg-gradient-to-br from-[#071a0e] via-[#0d2416] to-[#1a3a2a]">
                {coverUrl ? (
                    <Image src={coverUrl} alt="" fill className="object-cover opacity-70" unoptimized />
                ) : (
                    <>
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle, rgba(58,170,106,0.18) 1.5px, transparent 1.5px)',
                            backgroundSize: '22px 22px',
                        }} />
                        <div className="absolute inset-0 opacity-[0.04]" style={{
                            backgroundImage: 'repeating-linear-gradient(-45deg, #3aaa6a 0, #3aaa6a 1px, transparent 0, transparent 50%)',
                            backgroundSize: '18px 18px',
                        }} />
                    </>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                <Link href="/"
                    className="absolute top-4 left-4 flex items-center gap-2 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 border border-white/15 hover:bg-white/20 transition-all backdrop-blur-sm z-10"
                >
                    <ArrowLeft size={12} /> Back
                </Link>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6">

                {/* ── Profile Card ── */}
                <div className="relative -mt-12 mb-4 bg-white rounded-[24px] border border-[rgba(58,170,106,0.11)] shadow-[0_2px_10px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] p-6"
                    style={{ animation: 'fadeSlideUp 0.35s ease-out both' }}>

                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-[18px] overflow-hidden flex-shrink-0 bg-gradient-to-br from-green/20 to-green/5 border-[2.5px] border-white shadow-lg">
                            {avatarUrl
                                ? <Image src={avatarUrl} alt={instrUser.displayName} width={80} height={80} className="object-cover w-full h-full" unoptimized />
                                : <div className="w-full h-full flex items-center justify-center">
                                    <GraduationCap size={32} className="text-green/50" />
                                </div>
                            }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-black text-dark">{instrUser.displayName}</h1>
                                <span className="flex items-center gap-1 text-[10px] font-black text-green bg-green/8 border border-green/15 px-2 py-0.5 rounded-full">
                                    <GraduationCap size={9} /> Instructor
                                </span>
                            </div>
                            {instrProfile?.specialist && (
                                <p className="text-sm text-dark/50 font-medium mt-0.5">{instrProfile.specialist}</p>
                            )}

                            {/* Stats row */}
                            <div className="flex items-center gap-4 mt-3 flex-wrap">
                                {(ratingsData?.totalRatings || 0) > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <Stars value={ratingsData?.averageRating || 0} />
                                        <span className="text-xs font-black text-dark/70">{ratingsData?.averageRating?.toFixed(1)}</span>
                                        <span className="text-xs text-dark/30">({ratingsData?.totalRatings})</span>
                                    </div>
                                )}
                                <span className="flex items-center gap-1 text-xs text-dark/40">
                                    <BookOpen size={11} /> {courses.length} courses
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Rate this instructor ── */}
                {user && !isOwnProfile && (
                    <div className="mb-4 bg-white rounded-[18px] border border-[rgba(58,170,106,0.11)] shadow-[0_2px_10px_rgba(0,0,0,0.05)] p-5"
                        style={{ animation: 'fadeSlideUp 0.35s ease-out 0.05s both' }}>
                        <p className="text-xs font-black text-dark/40 uppercase tracking-widest mb-3">
                            {ratingsData?.ratings.some(r => r.userId._id === user.id) ? 'Update your rating' : 'Rate this instructor'}
                        </p>
                        <Stars value={myRating} interactive onChange={setMyRating} />
                        <textarea
                            value={myFeedback}
                            onChange={e => setMyFeedback(e.target.value)}
                            placeholder="Share your experience (optional)..."
                            rows={2}
                            className="mt-3 w-full text-sm text-dark/70 bg-[#F8F9FA] border border-[rgba(58,170,106,0.11)] rounded-xl px-3 py-2 outline-none focus:border-green/40 resize-none placeholder:text-dark/25 transition-colors"
                        />
                        {ratingError && <p className="text-xs text-red-500 mt-1">{ratingError}</p>}
                        <div className="flex items-center gap-3 mt-3">
                            <button
                                onClick={handleSubmitRating}
                                disabled={submitting || !myRating}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green text-white text-xs font-black disabled:opacity-40 transition-opacity"
                            >
                                {submitting ? <><Loader2 size={12} className="animate-spin" /> Submitting...</> : 'Submit Rating'}
                            </button>
                            {ratingSuccess && (
                                <span className="flex items-center gap-1 text-xs font-bold text-green">
                                    <CheckCircle2 size={12} /> Rating saved
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Courses ── */}
                <div className="mb-4" style={{ animation: 'fadeSlideUp 0.35s ease-out 0.1s both' }}>
                    <h2 className="text-xs font-black text-dark/40 uppercase tracking-widest mb-3">Courses</h2>

                    {courses.length === 0 ? (
                        <div className="bg-white rounded-[18px] border border-dashed border-[rgba(58,170,106,0.2)] p-10 text-center">
                            <BookOpen size={28} className="text-dark/10 mx-auto mb-2" />
                            <p className="text-sm text-dark/30 font-medium">No courses uploaded yet</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {courses.map((course, i) => (
                                <div key={course._id}
                                    className="bg-white rounded-[18px] border border-[rgba(58,170,106,0.11)] shadow-[0_2px_10px_rgba(0,0,0,0.05)] overflow-hidden hover:border-[rgba(58,170,106,0.35)] hover:shadow-[0_10px_28px_rgba(58,170,106,0.14)] transition-all duration-200 cursor-pointer group"
                                    style={{ animation: `fadeSlideUp 0.35s ease-out ${i * 40}ms both` }}
                                    onClick={() => handleView(course._id)}
                                >
                                    {/* Card header with dot texture */}
                                    <div className="h-24 relative flex items-center justify-center"
                                        style={{
                                            background: 'linear-gradient(135deg, #f0faf5 0%, #e8f5ee 100%)',
                                        }}>
                                        <div className="absolute inset-0 opacity-60" style={{
                                            backgroundImage: 'radial-gradient(circle, rgba(58,170,106,0.18) 1px, transparent 1px)',
                                            backgroundSize: '14px 14px',
                                        }} />
                                        <div className="relative w-11 h-11 rounded-[14px] bg-white/80 border border-[rgba(58,170,106,0.18)] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                                            {course.videoUrl
                                                ? <Video size={18} className="text-green" />
                                                : <FileText size={18} className="text-green" />
                                            }
                                        </div>
                                        <span className="absolute top-2.5 right-2.5 text-[9px] font-black tracking-wider text-green/70 bg-green/8 border border-green/15 px-2 py-0.5 rounded-full">
                                            {course.videoUrl ? 'VIDEO' : 'PDF'}
                                        </span>
                                    </div>

                                    {/* Card body */}
                                    <div className="p-4">
                                        <h3 className="text-sm font-bold text-dark leading-snug line-clamp-2 mb-2">
                                            {course.title}
                                        </h3>
                                        {course.description && (
                                            <p className="text-xs text-dark/40 leading-relaxed line-clamp-2 mb-3">
                                                {course.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 border-t border-[rgba(58,170,106,0.07)] pt-2.5">
                                            <span className="flex items-center gap-1 text-[11px] text-dark/35">
                                                <Eye size={10} /> {course.viewCount || 0} views
                                            </span>
                                            {course.downloadCount !== undefined && (
                                                <span className="flex items-center gap-1 text-[11px] text-dark/35">
                                                    <Download size={10} /> {course.downloadCount} downloads
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Reviews ── */}
                {(ratingsData?.totalRatings || 0) > 0 && (
                    <div style={{ animation: 'fadeSlideUp 0.35s ease-out 0.15s both' }}>
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <h2 className="text-xs font-black text-dark/40 uppercase tracking-widest">Reviews</h2>
                            <div className="flex items-center gap-1.5">
                                <Stars value={ratingsData?.averageRating || 0} />
                                <span className="text-xs font-black text-dark/70">{ratingsData?.averageRating?.toFixed(1)}</span>
                                <span className="text-xs text-dark/30">· {ratingsData?.totalRatings}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {displayedRatings.map((r, i) => {
                                const reviewer = r.userId;
                                const rPhoto = imgURL(reviewer.photoURL);
                                return (
                                    <div key={r._id}
                                        className="bg-white rounded-[18px] border border-[rgba(58,170,106,0.11)] shadow-[0_2px_10px_rgba(0,0,0,0.05)] p-4"
                                        style={{ animation: `fadeSlideUp 0.35s ease-out ${i * 40}ms both` }}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-green/10 flex items-center justify-center text-xs font-black text-green flex-shrink-0 overflow-hidden relative">
                                                {rPhoto
                                                    ? <Image src={rPhoto} alt={reviewer.displayName} fill className="object-cover" unoptimized />
                                                    : reviewer.displayName?.charAt(0)?.toUpperCase() || '?'
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-bold text-dark truncate">{reviewer.displayName}</p>
                                                    <span className="text-[10px] text-dark/25 whitespace-nowrap">
                                                        {new Date(r.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <Stars value={r.rating} />
                                            </div>
                                        </div>
                                        {r.feedback && (
                                            <p className="text-sm text-dark/60 leading-relaxed">{r.feedback}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {(ratingsData?.ratings.length || 0) > 3 && (
                            <button
                                onClick={() => setShowAllReviews(!showAllReviews)}
                                className="mt-2 w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-dark/40 hover:text-dark/60 bg-white rounded-[18px] border border-[rgba(58,170,106,0.11)] transition-colors"
                            >
                                {showAllReviews
                                    ? <><ChevronUp size={14} /> Show less</>
                                    : <><ChevronDown size={14} /> Show all {ratingsData?.totalRatings} reviews</>
                                }
                            </button>
                        )}
                    </div>
                )}

                {/* Empty reviews state (no ratings yet, show prompt) */}
                {!user && (ratingsData?.totalRatings || 0) === 0 && (
                    <div className="bg-white rounded-[18px] border border-dashed border-[rgba(58,170,106,0.2)] p-8 text-center"
                        style={{ animation: 'fadeSlideUp 0.35s ease-out 0.2s both' }}>
                        <Star size={24} className="text-dark/10 mx-auto mb-2" />
                        <p className="text-sm text-dark/30 font-medium mb-3">No reviews yet</p>
                        <Link href="/login"
                            className="inline-flex items-center gap-1 text-xs font-bold text-green border border-green/20 px-4 py-2 rounded-full hover:bg-green/5 transition-colors">
                            Log in to be the first
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
