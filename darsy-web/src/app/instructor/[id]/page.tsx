'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { InstructorCourse, InstructorRating } from '@/types';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    Star, BookOpen, Video, FileText, Eye,
    GraduationCap, MessageSquare, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap');`;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            {Array.from({ length: max }, (_, i) => {
                const filled = (interactive ? (hover || value) : value) > i;
                return (
                    <button key={i} type="button" disabled={!interactive}
                        onClick={() => interactive && onChange?.(i + 1)}
                        onMouseEnter={() => interactive && setHover(i + 1)}
                        onMouseLeave={() => interactive && setHover(0)}
                        style={{ background: 'none', border: 'none', padding: '2px', cursor: interactive ? 'pointer' : 'default' }}>
                        <Star size={interactive ? 22 : 13}
                            style={{ color: filled ? '#F0A030' : '#2A3342', fill: filled ? '#F0A030' : '#2A3342', display: 'block' }} />
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
            <div style={{ background: '#07090F', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <style>{FONT_IMPORT}</style>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid rgba(58,170,106,0.2)', borderTopColor: '#3aaa6a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div style={{ background: '#07090F', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <style>{FONT_IMPORT}</style>
                <div style={{ textAlign: 'center', fontFamily: 'DM Sans, sans-serif' }}>
                    <h1 style={{ color: '#F0F0F0', fontSize: '1.5rem', fontFamily: 'Syne, sans-serif', marginBottom: '8px' }}>Not Found</h1>
                    <p style={{ color: '#8A9099' }}>{error || 'Instructor not found'}</p>
                    <Link href="/instructors" style={{ color: '#3aaa6a', fontWeight: 600, display: 'inline-block', marginTop: '16px' }}>Browse instructors →</Link>
                </div>
            </div>
        );
    }

    const { user: instrUser, profile: instrProfile, courses } = profile;
    const isOwnProfile = user?.id === instrUser._id;
    const displayedRatings = showAllReviews ? (ratingsData?.ratings || []) : (ratingsData?.ratings || []).slice(0, 3);
    const coverUrl = imgURL(instrUser.coverPhotoURL, 'cover');
    const avatarUrl = imgURL(instrUser.photoURL);

    return (
        <main style={{ background: '#07090F', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'DM Sans, sans-serif' }}>
            <style>{`
                ${FONT_IMPORT}
                @keyframes spin { to { transform: rotate(360deg); } }

                .icard {
                    background: #0F1421;
                    border: 1px solid rgba(255,255,255,0.07);
                    border-radius: 18px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
                }
                .icard:hover {
                    transform: translateY(-4px);
                    border-color: rgba(58,170,106,0.35);
                    box-shadow: 0 12px 40px rgba(58,170,106,0.1);
                }
                .irev {
                    background: #0F1421;
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 16px;
                    padding: 18px;
                    transition: border-color 0.2s;
                }
                .irev:hover { border-color: rgba(255,255,255,0.13); }

                .iinput {
                    width: 100%;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 12px;
                    padding: 11px 15px;
                    color: #F0F0F0;
                    font-size: 14px;
                    font-family: 'DM Sans', sans-serif;
                    resize: none;
                    outline: none;
                    transition: border-color 0.2s;
                    box-sizing: border-box;
                }
                .iinput:focus { border-color: rgba(58,170,106,0.45); }
                .iinput::placeholder { color: #3A4455; }

                .ibtn-show {
                    width: 100%;
                    padding: 14px;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 14px;
                    color: #8A9099;
                    font-weight: 600;
                    font-size: 0.875rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    font-family: 'DM Sans', sans-serif;
                    transition: background 0.2s, color 0.2s;
                    margin-top: 14px;
                }
                .ibtn-show:hover { background: rgba(255,255,255,0.04); color: #C0C8D0; }

                .icourse-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
                    gap: 16px;
                }
            `}</style>

            {/* ── HERO ── */}
            <div style={{ position: 'relative', width: '100%', height: '320px', overflow: 'hidden', background: 'linear-gradient(135deg, #0C1F14 0%, #0A1829 100%)' }}>
                {coverUrl ? (
                    <Image src={coverUrl} alt="cover" fill style={{ objectFit: 'cover', opacity: 0.65 }} unoptimized />
                ) : (
                    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="zellige" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                                <circle cx="20" cy="20" r="1.5" fill="#3aaa6a" opacity="0.25" />
                                <circle cx="0" cy="0" r="1.5" fill="#3aaa6a" opacity="0.15" />
                                <circle cx="40" cy="0" r="1.5" fill="#3aaa6a" opacity="0.15" />
                                <circle cx="0" cy="40" r="1.5" fill="#3aaa6a" opacity="0.15" />
                                <circle cx="40" cy="40" r="1.5" fill="#3aaa6a" opacity="0.15" />
                                <line x1="20" y1="0" x2="20" y2="40" stroke="#3aaa6a" strokeWidth="0.5" opacity="0.06" />
                                <line x1="0" y1="20" x2="40" y2="20" stroke="#3aaa6a" strokeWidth="0.5" opacity="0.06" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#zellige)" />
                    </svg>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #07090F 0%, rgba(7,9,15,0.3) 55%, transparent 100%)' }} />
            </div>

            <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px' }}>

                {/* ── PROFILE CARD ── */}
                <div style={{
                    marginTop: '-90px',
                    background: '#0F1421',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '22px',
                    padding: '24px 28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '22px',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    position: 'relative',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minWidth: 0 }}>
                        {/* Avatar */}
                        <div style={{
                            width: '84px', height: '84px', flexShrink: 0, borderRadius: '50%',
                            border: '3px solid #3aaa6a',
                            boxShadow: '0 0 0 6px rgba(58,170,106,0.12), 0 8px 30px rgba(0,0,0,0.4)',
                            overflow: 'hidden', position: 'relative',
                            background: 'linear-gradient(135deg, #1a3a2a, #0C1820)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {avatarUrl ? (
                                <Image src={avatarUrl} alt={instrUser.displayName} fill style={{ objectFit: 'cover' }} unoptimized />
                            ) : (
                                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#3aaa6a', fontFamily: 'Syne, sans-serif', lineHeight: 1 }}>
                                    {instrUser.displayName.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
                                color: '#3aaa6a', background: 'rgba(58,170,106,0.1)',
                                border: '1px solid rgba(58,170,106,0.25)',
                                borderRadius: '20px', padding: '2px 10px',
                                marginBottom: '8px', fontFamily: 'Syne, sans-serif',
                            }}>
                                <GraduationCap size={11} /> INSTRUCTOR
                            </span>
                            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.5rem', color: '#F0F0F0', margin: 0, lineHeight: 1.2 }}>
                                {instrUser.displayName}
                            </h1>
                            {instrProfile?.specialist && (
                                <p style={{ color: '#8A9099', fontSize: '0.9rem', marginTop: '3px', margin: '4px 0 0' }}>
                                    {instrProfile.specialist}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '40px' }}>
                            <BookOpen size={14} style={{ color: '#3aaa6a' }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F0F0F0' }}>{courses.length}</span>
                            <span style={{ fontSize: '0.78rem', color: '#8A9099' }}>courses</span>
                        </div>
                        {(ratingsData?.totalRatings || 0) > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', background: 'rgba(240,160,48,0.07)', border: '1px solid rgba(240,160,48,0.2)', borderRadius: '40px' }}>
                                <Star size={14} style={{ color: '#F0A030', fill: '#F0A030' }} />
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F0F0F0' }}>{ratingsData?.averageRating}</span>
                                <span style={{ fontSize: '0.78rem', color: '#8A9099' }}>({ratingsData?.totalRatings})</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── COURSES ── */}
                <section style={{ marginTop: '44px', marginBottom: '52px' }}>
                    <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#F0F0F0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '3px', height: '20px', background: '#3aaa6a', borderRadius: '2px', display: 'inline-block' }} />
                        Courses
                    </h2>

                    {courses.length === 0 ? (
                        <div style={{ background: '#0F1421', border: '1px dashed rgba(255,255,255,0.09)', borderRadius: '18px', padding: '56px 24px', textAlign: 'center' }}>
                            <BookOpen style={{ color: 'rgba(255,255,255,0.08)', margin: '0 auto 12px', display: 'block' }} size={44} />
                            <p style={{ color: '#8A9099', fontWeight: 500 }}>No courses uploaded yet</p>
                        </div>
                    ) : (
                        <div className="icourse-grid">
                            {courses.map(course => (
                                <div key={course._id} className="icard" onClick={() => handleView(course._id)}>
                                    <div style={{
                                        height: '130px',
                                        background: course.videoUrl
                                            ? 'linear-gradient(135deg, #1A2F5E 0%, #0D1B40 100%)'
                                            : 'linear-gradient(135deg, #3A1A2E 0%, #1F0D1A 100%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        position: 'relative', overflow: 'hidden',
                                    }}>
                                        <svg style={{ position: 'absolute', inset: 0, opacity: 0.1 }} width="100%" height="100%">
                                            <defs>
                                                <pattern id={`cp-${course._id}`} x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                                                    <circle cx="9" cy="9" r="1" fill="white" />
                                                </pattern>
                                            </defs>
                                            <rect width="100%" height="100%" fill={`url(#cp-${course._id})`} />
                                        </svg>
                                        <div style={{ width: '54px', height: '54px', borderRadius: '15px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.18)', position: 'relative', zIndex: 1, transition: 'transform 0.2s' }}>
                                            {course.videoUrl ? <Video style={{ color: 'white' }} size={24} /> : <FileText style={{ color: 'white' }} size={24} />}
                                        </div>
                                        <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '9px', fontFamily: 'Syne, sans-serif', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '8px', padding: '3px 8px' }}>
                                            {course.videoUrl ? 'VIDEO' : 'PDF'}
                                        </span>
                                    </div>
                                    <div style={{ padding: '16px 18px' }}>
                                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, color: '#E8EDF2', fontSize: '0.92rem', marginBottom: '8px', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                            {course.title}
                                        </h3>
                                        {course.description && (
                                            <p style={{ fontSize: '0.8rem', color: '#8A9099', lineHeight: 1.55, marginBottom: '12px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                {course.description}
                                            </p>
                                        )}
                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', display: 'flex', gap: '14px' }}>
                                            <span style={{ fontSize: '11px', color: '#8A9099', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Eye size={11} style={{ color: '#4A7FA6' }} /> {course.viewCount || 0} views
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── REVIEWS ── */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
                        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.2rem', color: '#F0F0F0', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                            <span style={{ width: '3px', height: '20px', background: '#3aaa6a', borderRadius: '2px', display: 'inline-block' }} />
                            Reviews
                        </h2>
                        {(ratingsData?.totalRatings || 0) > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Stars value={ratingsData?.averageRating || 0} />
                                <span style={{ fontWeight: 700, color: '#F0F0F0', fontSize: '0.95rem' }}>{ratingsData?.averageRating}</span>
                                <span style={{ color: '#8A9099', fontSize: '0.85rem' }}>· {ratingsData?.totalRatings} reviews</span>
                            </div>
                        )}
                    </div>

                    {/* Rating form */}
                    {!user ? (
                        <div style={{ background: '#0F1421', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '20px' }}>
                            <p style={{ color: '#8A9099', fontSize: '0.875rem' }}>
                                <Link href="/login" style={{ color: '#3aaa6a', fontWeight: 600 }}>Log in</Link> to rate this instructor
                            </p>
                        </div>
                    ) : !isOwnProfile ? (
                        <div style={{ background: '#0F1421', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '24px', marginBottom: '20px' }}>
                            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#F0F0F0', marginBottom: '16px', fontSize: '1rem', margin: '0 0 16px' }}>
                                {ratingsData?.ratings.some(r => r.userId._id === user.id) ? 'Update your rating' : 'Rate this instructor'}
                            </h3>
                            <Stars value={myRating} interactive onChange={setMyRating} />
                            <textarea
                                className="iinput"
                                value={myFeedback}
                                onChange={e => setMyFeedback(e.target.value)}
                                placeholder="Share your experience (optional)..."
                                rows={3}
                                style={{ marginTop: '12px' }}
                            />
                            {ratingError && <p style={{ color: '#F87171', fontSize: '0.85rem', marginTop: '8px' }}>{ratingError}</p>}
                            {ratingSuccess && <p style={{ color: '#3aaa6a', fontWeight: 600, fontSize: '0.85rem', marginTop: '8px' }}>Rating submitted!</p>}
                            <button
                                onClick={handleSubmitRating}
                                disabled={submitting || !myRating}
                                style={{
                                    marginTop: '14px',
                                    padding: '10px 24px',
                                    background: submitting || !myRating ? 'rgba(58,170,106,0.25)' : '#3aaa6a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    cursor: submitting || !myRating ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontFamily: 'DM Sans, sans-serif',
                                    transition: 'background 0.2s',
                                }}>
                                {submitting ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Submitting...</> : 'Submit Rating'}
                            </button>
                        </div>
                    ) : null}

                    {/* Reviews list */}
                    {(ratingsData?.totalRatings || 0) === 0 ? (
                        <div style={{ background: '#0F1421', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '16px', padding: '44px 24px', textAlign: 'center' }}>
                            <Star size={36} style={{ color: 'rgba(255,255,255,0.07)', margin: '0 auto 10px', display: 'block' }} />
                            <p style={{ color: '#8A9099', fontSize: '0.875rem' }}>No reviews yet. Be the first!</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {displayedRatings.map(r => {
                                    const reviewer = r.userId;
                                    const rPhoto = imgURL(reviewer.photoURL);
                                    return (
                                        <div key={r._id} className="irev">
                                            <div style={{ display: 'flex', gap: '14px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden', position: 'relative', background: 'linear-gradient(135deg, #1a3a2a, #0C1820)', border: '2px solid rgba(58,170,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {rPhoto ? (
                                                        <Image src={rPhoto} alt={reviewer.displayName} fill style={{ objectFit: 'cover' }} unoptimized />
                                                    ) : (
                                                        <span style={{ color: '#3aaa6a', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'Syne, sans-serif' }}>{reviewer.displayName?.charAt(0)?.toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px', gap: '8px' }}>
                                                        <span style={{ fontWeight: 600, color: '#E8EDF2', fontSize: '0.875rem', fontFamily: 'Syne, sans-serif' }}>{reviewer.displayName}</span>
                                                        <span style={{ fontSize: '0.75rem', color: '#8A9099', whiteSpace: 'nowrap' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <Stars value={r.rating} />
                                                    {r.feedback && <p style={{ fontSize: '0.875rem', color: '#9AABB8', marginTop: '6px', lineHeight: 1.55 }}>{r.feedback}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {(ratingsData?.ratings.length || 0) > 3 && (
                                <button className="ibtn-show" onClick={() => setShowAllReviews(!showAllReviews)}>
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
