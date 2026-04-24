'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
    ArrowLeft, Star, Users, BookOpen, GraduationCap,
    MapPin, CheckCircle2, MessageCircle, Loader2, Copy, Check,
} from 'lucide-react';

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

interface TeacherRoom {
    _id: string;
    name: string;
    description?: string;
    members: string[];
    averageRating: number;
    totalRatings: number;
    roomCode: string;
    teacherSlug: string;
}

interface TeacherProfileData {
    _id: string;
    userId: { _id: string; displayName: string; photoURL?: string; coverPhotoURL?: string; };
    fullName: string;
    bio?: string;
    photoURL?: string;
    specialist: string;
    schoolName: string;
    ratings: { userId: { _id: string; displayName: string; photoURL?: string } | null; rating: number; comment?: string; createdAt: string; }[];
    averageRating: number;
    totalRatings: number;
    totalStudents: number;
    isVerified: boolean;
}

export default function TeacherPublicProfilePage() {
    const params = useParams();
    const teacherId = params.id as string;
    const { user, getPhotoURL } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<TeacherProfileData | null>(null);
    const [rooms, setRooms] = useState<TeacherRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [myRating, setMyRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [ratingDone, setRatingDone] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [roomRatings, setRoomRatings] = useState<Record<string, number>>({});
    const [roomRatingLoading, setRoomRatingLoading] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [profileRes, roomsRes] = await Promise.all([
                api.get(`/teacher/profiles/${teacherId}`),
                api.get(`/teacher/profiles/${teacherId}/rooms`).catch(() => ({ data: [] })),
            ]);
            setProfile(profileRes.data);
            setRooms(roomsRes.data || []);

            // Pre-fill user's existing rating if any
            if (user) {
                const existing = profileRes.data.ratings?.find(
                    (r: any) => r.userId?._id === user.id || r.userId === user.id
                );
                if (existing) setMyRating(existing.rating);
            }
        } catch {
            router.push('/teacher');
        } finally {
            setLoading(false);
        }
    }, [teacherId, user, router]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRate = async (rating: number) => {
        if (!user) { router.push('/login'); return; }
        setMyRating(rating);
        setSubmitting(true);
        try {
            const res = await api.post(`/teacher/profiles/${teacherId}/rate`, { rating });
            setProfile(prev => prev ? {
                ...prev,
                averageRating: res.data.averageRating,
                totalRatings: res.data.totalRatings,
            } : prev);
            setRatingDone(true);
        } catch {
            setMyRating(0);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRateRoom = async (roomId: string, rating: number) => {
        if (!user) { router.push('/login'); return; }
        setRoomRatings(prev => ({ ...prev, [roomId]: rating }));
        setRoomRatingLoading(roomId);
        try {
            const res = await api.post(`/teacher/rooms/${roomId}/rate`, { rating });
            setRooms(prev => prev.map(r => r._id === roomId
                ? { ...r, averageRating: res.data.averageRating, totalRatings: res.data.totalRatings }
                : r
            ));
        } catch {
            setRoomRatings(prev => ({ ...prev, [roomId]: 0 }));
        } finally {
            setRoomRatingLoading(null);
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code).catch(() => {});
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8F9FA] animate-pulse">
            <div className="w-full h-52 bg-gradient-to-br from-[#071a0e] to-[#1a3a2a]" />
            <div className="max-w-3xl mx-auto px-4 pt-6 space-y-4">
                <div className="h-32 rounded-[18px] bg-white border border-[rgba(58,170,106,0.11)]" />
                <div className="h-48 rounded-[18px] bg-white border border-[rgba(58,170,106,0.11)]" />
            </div>
        </div>
    );

    if (!profile) return null;

    const coverPhoto = imgURL(profile.userId?.coverPhotoURL, 'cover');
    const avatarPhoto = getPhotoURL(profile.photoURL || profile.userId?.photoURL);
    const displayRatings = profile.ratings?.filter(r => r.comment).slice(0, 5) || [];

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24">

            {/* ── Cover Hero ── */}
            <div className="relative w-full h-52 md:h-64 overflow-hidden bg-gradient-to-br from-[#071a0e] via-[#0d2416] to-[#1a3a2a]">
                {coverPhoto ? (
                    <Image src={coverPhoto} alt="" fill className="object-cover opacity-70" unoptimized />
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

                {/* Back */}
                <Link href="/teacher"
                    className="absolute top-4 left-4 flex items-center gap-2 text-white/80 text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 border border-white/15 hover:bg-white/20 transition-all backdrop-blur-sm z-10"
                >
                    <ArrowLeft size={12} /> Browse Teachers
                </Link>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6">

                {/* ── Profile Card ── */}
                <div className="relative -mt-12 mb-4 bg-white rounded-[24px] border border-[rgba(58,170,106,0.11)] shadow-[0_2px_10px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] p-6"
                    style={{ animation: 'fadeSlideUp 0.35s ease-out both' }}>

                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-[18px] overflow-hidden flex-shrink-0 bg-gradient-to-br from-green/20 to-green/5 border-[2.5px] border-white shadow-lg">
                            {avatarPhoto
                                ? <Image src={avatarPhoto} alt={profile.fullName} width={80} height={80} className="object-cover w-full h-full" unoptimized />
                                : <div className="w-full h-full flex items-center justify-center">
                                    <GraduationCap size={32} className="text-green/50" />
                                </div>
                            }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-black text-dark">{profile.fullName}</h1>
                                {profile.isVerified && (
                                    <span className="flex items-center gap-1 text-[10px] font-black text-green bg-green/8 border border-green/15 px-2 py-0.5 rounded-full">
                                        <CheckCircle2 size={9} className="fill-green text-white" /> Verified
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-dark/50 font-medium mt-0.5">{profile.specialist}</p>
                            {profile.schoolName && (
                                <p className="flex items-center gap-1 text-xs text-dark/40 mt-1">
                                    <MapPin size={10} /> {profile.schoolName}
                                </p>
                            )}

                            {/* Stats row */}
                            <div className="flex items-center gap-4 mt-3 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <Stars value={profile.averageRating} />
                                    <span className="text-xs font-black text-dark/70">{profile.averageRating?.toFixed(1)}</span>
                                    <span className="text-xs text-dark/30">({profile.totalRatings})</span>
                                </div>
                                <span className="flex items-center gap-1 text-xs text-dark/40">
                                    <Users size={11} /> {profile.totalStudents || 0} students
                                </span>
                                <span className="flex items-center gap-1 text-xs text-dark/40">
                                    <MessageCircle size={11} /> {rooms.length} rooms
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {profile.bio && (
                        <p className="mt-4 text-sm text-dark/60 leading-relaxed border-t border-[rgba(58,170,106,0.08)] pt-4">
                            {profile.bio}
                        </p>
                    )}
                </div>

                {/* ── Rate this teacher ── */}
                {user && user.id !== (profile.userId?._id || '') && (
                    <div className="mb-4 bg-white rounded-[18px] border border-[rgba(58,170,106,0.11)] shadow-[0_2px_10px_rgba(0,0,0,0.05)] p-5"
                        style={{ animation: 'fadeSlideUp 0.35s ease-out 0.05s both' }}>
                        <p className="text-xs font-black text-dark/40 uppercase tracking-widest mb-3">Rate this teacher</p>
                        <div className="flex items-center gap-4">
                            <Stars value={myRating} interactive onChange={handleRate} />
                            {submitting && <Loader2 size={14} className="animate-spin text-green" />}
                            {ratingDone && !submitting && (
                                <span className="flex items-center gap-1 text-xs font-bold text-green">
                                    <CheckCircle2 size={12} /> Rating saved
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Rooms ── */}
                {rooms.length > 0 && (
                    <div className="mb-4" style={{ animation: 'fadeSlideUp 0.35s ease-out 0.1s both' }}>
                        <h2 className="text-xs font-black text-dark/40 uppercase tracking-widest mb-3">Classrooms</h2>
                        <div className="space-y-2">
                            {rooms.map((room, i) => (
                                <div key={room._id}
                                    className="bg-white rounded-[18px] border border-[rgba(58,170,106,0.11)] shadow-[0_2px_10px_rgba(0,0,0,0.05)] p-4 flex items-center justify-between gap-3 hover:border-[rgba(58,170,106,0.35)] hover:shadow-[0_10px_28px_rgba(58,170,106,0.14)] transition-all duration-200 cursor-default group"
                                    style={{ animationDelay: `${i * 40}ms` }}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-9 h-9 rounded-[11px] bg-[rgba(58,170,106,0.07)] flex items-center justify-center flex-shrink-0 group-hover:bg-[rgba(58,170,106,0.12)] transition-colors">
                                            <BookOpen size={16} className="text-green" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-dark truncate">{room.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="flex items-center gap-1 text-[11px] text-dark/40">
                                                    <Users size={9} /> {room.members?.length || 0}
                                                </span>
                                                {room.totalRatings > 0 && (
                                                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                                                        <Star size={9} className="fill-amber-400 text-amber-400" />
                                                        {room.averageRating?.toFixed(1)}
                                                        <span className="font-normal text-dark/30">({room.totalRatings})</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                        {/* Room rating — only for logged-in non-owner users */}
                                        {user && user.id !== (profile.userId?._id || '') && (
                                            <div className="flex items-center gap-0.5">
                                                {[1, 2, 3, 4, 5].map(s => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        disabled={roomRatingLoading === room._id}
                                                        onClick={() => handleRateRoom(room._id, s)}
                                                        className="transition-transform hover:scale-125 active:scale-110 disabled:cursor-not-allowed"
                                                        title={`Rate ${s} star${s > 1 ? 's' : ''}`}
                                                    >
                                                        <Star
                                                            size={13}
                                                            className={s <= (roomRatings[room._id] || 0) ? 'text-amber-400 fill-amber-400' : 'text-dark/15 hover:text-amber-300'}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => copyCode(room.roomCode)}
                                            className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-green bg-green/8 border border-green/15 px-2.5 py-1.5 rounded-lg hover:bg-green/15 transition-all flex-shrink-0"
                                        >
                                            {copiedCode === room.roomCode
                                                ? <><Check size={11} /> Copied</>
                                                : <><Copy size={11} /> {room.roomCode}</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Reviews ── */}
                {displayRatings.length > 0 && (
                    <div style={{ animation: 'fadeSlideUp 0.35s ease-out 0.15s both' }}>
                        <h2 className="text-xs font-black text-dark/40 uppercase tracking-widest mb-3">Reviews</h2>
                        <div className="space-y-2">
                            {displayRatings.map((r, i) => (
                                <div key={i}
                                    className="bg-white rounded-[18px] border border-[rgba(58,170,106,0.11)] shadow-[0_2px_10px_rgba(0,0,0,0.05)] p-4"
                                    style={{ animation: `fadeSlideUp 0.35s ease-out ${i * 40}ms both` }}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-7 h-7 rounded-full bg-green/10 flex items-center justify-center text-xs font-black text-green flex-shrink-0">
                                            {r.userId?.displayName?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-dark">{r.userId?.displayName || 'Student'}</p>
                                            <Stars value={r.rating} />
                                        </div>
                                    </div>
                                    <p className="text-sm text-dark/60 leading-relaxed">{r.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
