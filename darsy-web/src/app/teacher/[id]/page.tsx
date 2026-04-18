"use client";

import { useState, useEffect } from "react";
import {
    Star, Users, Award, MessageCircle,
    MapPin, Loader2, Send, Shield, ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import api from "@/lib/api";
import Image from "next/image";
import { useParams } from "next/navigation";
import type { TeacherProfile, TeacherRoom } from "@/types";

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap');`;

export default function TeacherProfilePage() {
    const { id } = useParams();
    const { user, getPhotoURL } = useAuth();
    const { showSnackbar } = useSnackbar();

    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [rooms, setRooms] = useState<TeacherRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [ratingValue, setRatingValue] = useState(0);
    const [ratingHover, setRatingHover] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [submittingRating, setSubmittingRating] = useState(false);

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const [profileRes, roomsRes] = await Promise.all([
                    api.get(`/teacher/profiles/${id}`),
                    api.get(`/teacher/rooms/joined`).catch(() => ({ data: [] })),
                ]);
                setProfile(profileRes.data);
                const teacherRooms = roomsRes.data.filter(
                    (r: TeacherRoom) => r.teacherProfileId && (r.teacherProfileId as any)._id === id
                );
                setRooms(teacherRooms);
            } catch {
                showSnackbar("Failed to load teacher profile", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, showSnackbar]);

    const handleRate = async () => {
        if (!ratingValue) return;
        setSubmittingRating(true);
        try {
            await api.post(`/teacher/profiles/${id}/rate`, { rating: ratingValue, comment: ratingComment });
            showSnackbar("Rating submitted!", "success");
            const profileRes = await api.get(`/teacher/profiles/${id}`);
            setProfile(profileRes.data);
            setRatingComment("");
        } catch (err: any) {
            showSnackbar(err?.response?.data?.error || "Failed to submit rating", "error");
        } finally {
            setSubmittingRating(false);
        }
    };

    const handleJoinRoom = async (inviteCode: string) => {
        try {
            await api.post(`/teacher/rooms/join/${inviteCode}`);
            showSnackbar("Joined room!", "success");
        } catch (err: any) {
            showSnackbar(err?.response?.data?.error || "Failed to join", "error");
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#F2EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <style>{FONT_IMPORT}</style>
                <div style={{ width: '36px', height: '36px', border: '3px solid rgba(79,70,229,0.15)', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'tspin 0.8s linear infinite' }} />
                <style>{`@keyframes tspin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={{ minHeight: '100vh', background: '#F2EFE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <style>{FONT_IMPORT}</style>
                <p style={{ color: '#6B7280', fontFamily: 'DM Sans, sans-serif' }}>Teacher profile not found</p>
            </div>
        );
    }

    const isOwn = user?.id === (profile.userId as any)?._id;
    const photoSrc = profile.photoURL || (profile.userId as any)?.photoURL
        ? getPhotoURL(profile.photoURL || (profile.userId as any)?.photoURL) || ''
        : null;

    return (
        <div style={{ minHeight: '100vh', background: '#F2EFE8', fontFamily: 'DM Sans, sans-serif' }}>
            <style>{`
                ${FONT_IMPORT}
                @keyframes tspin { to { transform: rotate(360deg); } }
                @keyframes tfadein { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

                .tcard {
                    background: white;
                    border-radius: 20px;
                    box-shadow: 0 2px 16px rgba(30,27,75,0.07), 0 1px 4px rgba(30,27,75,0.05);
                    border: 1px solid rgba(79,70,229,0.08);
                    animation: tfadein 0.4s ease both;
                }

                .troom-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 16px;
                    background: #F5F3FF;
                    border-radius: 14px;
                    border: 1px solid rgba(79,70,229,0.1);
                    transition: border-color 0.2s, background 0.2s;
                }
                .troom-card:hover { background: #EDE9FE; border-color: rgba(79,70,229,0.25); }

                .trev-item {
                    display: flex;
                    gap: 12px;
                    padding: 14px;
                    background: #FAFAF8;
                    border-radius: 14px;
                    border: 1px solid rgba(30,27,75,0.06);
                }

                .trating-form {
                    background: #F5F3FF;
                    border: 1px solid rgba(79,70,229,0.12);
                    border-radius: 16px;
                    padding: 18px;
                    margin-bottom: 18px;
                }

                .tjoin-btn {
                    padding: 8px 18px;
                    background: #4F46E5;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    font-family: 'Syne', sans-serif;
                    transition: background 0.2s;
                    white-space: nowrap;
                }
                .tjoin-btn:hover { background: #4338CA; }

                .tsubmit-btn {
                    padding: 9px 20px;
                    background: #4F46E5;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: 'DM Sans', sans-serif;
                    transition: background 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .tsubmit-btn:hover:not(:disabled) { background: #4338CA; }
                .tsubmit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

                .ttextarea {
                    width: 100%;
                    border: 1px solid rgba(79,70,229,0.2);
                    border-radius: 12px;
                    padding: 10px 14px;
                    font-size: 13px;
                    font-family: 'DM Sans', sans-serif;
                    color: #1E1B4B;
                    background: white;
                    resize: none;
                    outline: none;
                    transition: border-color 0.2s;
                    box-sizing: border-box;
                }
                .ttextarea:focus { border-color: #4F46E5; }
                .ttextarea::placeholder { color: #A5B4FC; }
            `}</style>

            {/* ── HERO ── */}
            <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E40AF 100%)', paddingTop: '100px', paddingBottom: '80px', position: 'relative', overflow: 'hidden' }}>
                {/* Background pattern */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }} xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="th-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="20" cy="20" r="1.5" fill="white" />
                            <circle cx="0" cy="0" r="1.5" fill="white" />
                            <circle cx="40" cy="0" r="1.5" fill="white" />
                            <circle cx="0" cy="40" r="1.5" fill="white" />
                            <circle cx="40" cy="40" r="1.5" fill="white" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#th-dots)" />
                </svg>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
                <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />

                <div style={{ maxWidth: '760px', margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                        {/* Avatar */}
                        <div style={{ width: '90px', height: '90px', borderRadius: '22px', border: '3px solid rgba(255,255,255,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {photoSrc ? (
                                <Image src={photoSrc} alt={profile.fullName} width={90} height={90} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                            ) : (
                                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)', fontFamily: 'Syne, sans-serif' }}>
                                    {profile.fullName.charAt(0)}
                                </span>
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Role + verified badge */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '2px 10px', fontFamily: 'Syne, sans-serif' }}>
                                    TEACHER
                                </span>
                                {profile.isVerified && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: '#FDE68A', background: 'rgba(253,230,138,0.15)', border: '1px solid rgba(253,230,138,0.3)', borderRadius: '20px', padding: '2px 10px', fontFamily: 'Syne, sans-serif' }}>
                                        <Shield size={10} /> VERIFIED
                                    </span>
                                )}
                            </div>
                            <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.75rem', color: 'white', margin: '0 0 4px', lineHeight: 1.15 }}>
                                {profile.fullName}
                                {profile.isVerified && <Award size={20} style={{ color: '#FDE68A', display: 'inline', marginLeft: '8px', verticalAlign: 'middle' }} />}
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', margin: '0 0 10px' }}>{profile.specialist}</p>

                            {/* Meta row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                                {profile.schoolName && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.83rem', color: 'rgba(255,255,255,0.55)' }}>
                                        <MapPin size={13} /> {profile.schoolName}
                                    </span>
                                )}
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.83rem', color: 'rgba(255,255,255,0.55)' }}>
                                    <Star size={13} style={{ color: '#FDE68A', fill: '#FDE68A' }} />
                                    {profile.averageRating || '—'}
                                    <span style={{ opacity: 0.6 }}>({profile.totalRatings})</span>
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.83rem', color: 'rgba(255,255,255,0.55)' }}>
                                    <Users size={13} /> {profile.totalStudents} students
                                </span>
                            </div>
                        </div>
                    </div>

                    {profile.bio && (
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.7, marginTop: '20px', maxWidth: '560px' }}>
                            {profile.bio}
                        </p>
                    )}
                </div>
            </div>

            {/* ── CONTENT ── */}
            <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px 80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Classrooms */}
                <div className="tcard" style={{ padding: '24px' }}>
                    <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#1E1B4B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 18px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageCircle size={16} style={{ color: '#4F46E5' }} />
                        </div>
                        Classrooms
                    </h2>

                    {rooms.length === 0 ? (
                        <p style={{ fontSize: '0.875rem', color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>No active classrooms yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {rooms.map(room => (
                                <div key={room._id} className="troom-card">
                                    <div style={{ minWidth: 0 }}>
                                        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#1E1B4B', fontSize: '0.9rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.name}</h3>
                                        {room.description && (
                                            <p style={{ fontSize: '0.78rem', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '0 0 5px' }}>{room.description}</p>
                                        )}
                                        <span style={{ fontSize: '11px', color: '#8B5CF6', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                            <Users size={10} /> {room.members.length}/{room.maxMembers} members
                                        </span>
                                    </div>
                                    {!isOwn && user && (
                                        <button className="tjoin-btn" onClick={() => handleJoinRoom(room.inviteCode)}>
                                            Join <ChevronRight size={13} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reviews */}
                <div className="tcard" style={{ padding: '24px', animationDelay: '0.1s' }}>
                    <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: '#1E1B4B', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 18px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Star size={16} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                        </div>
                        Reviews ({profile.totalRatings})
                    </h2>

                    {/* Rate form */}
                    {user && !isOwn && (
                        <div className="trating-form">
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E1B4B', marginBottom: '10px', fontFamily: 'Syne, sans-serif' }}>Rate this teacher</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}>
                                {[1, 2, 3, 4, 5].map(v => (
                                    <button key={v} style={{ background: 'none', border: 'none', padding: '3px', cursor: 'pointer' }}
                                        onMouseEnter={() => setRatingHover(v)}
                                        onMouseLeave={() => setRatingHover(0)}
                                        onClick={() => setRatingValue(v)}>
                                        <Star size={24} style={{
                                            color: v <= (ratingHover || ratingValue) ? '#F59E0B' : '#D1D5DB',
                                            fill: v <= (ratingHover || ratingValue) ? '#F59E0B' : '#D1D5DB',
                                            display: 'block', transition: 'color 0.15s, fill 0.15s'
                                        }} />
                                    </button>
                                ))}
                            </div>
                            <textarea className="ttextarea" value={ratingComment} onChange={e => setRatingComment(e.target.value)} placeholder="Write a review (optional)..." rows={2} style={{ marginBottom: '10px' }} />
                            <button className="tsubmit-btn" onClick={handleRate} disabled={!ratingValue || submittingRating}>
                                {submittingRating ? <><Loader2 size={14} style={{ animation: 'tspin 0.8s linear infinite' }} /> Submitting...</> : <><Send size={14} /> Submit Review</>}
                            </button>
                        </div>
                    )}

                    {/* Reviews list */}
                    {profile.ratings.length === 0 ? (
                        <p style={{ fontSize: '0.875rem', color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>No reviews yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {profile.ratings.slice().reverse().map((r, i) => {
                                const rPhoto = (r.userId as any)?.photoURL ? getPhotoURL((r.userId as any).photoURL) : null;
                                return (
                                    <div key={i} className="trev-item">
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EDE9FE', flexShrink: 0, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {rPhoto ? (
                                                <Image src={rPhoto} alt="" width={36} height={36} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4F46E5', fontFamily: 'Syne, sans-serif' }}>
                                                    {((r.userId as any)?.displayName || '?').charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E1B4B', fontFamily: 'Syne, sans-serif' }}>
                                                    {(r.userId as any)?.displayName || 'User'}
                                                </span>
                                                <div style={{ display: 'flex', gap: '2px' }}>
                                                    {Array.from({ length: 5 }, (_, j) => (
                                                        <Star key={j} size={11} style={{ color: j < r.rating ? '#F59E0B' : '#D1D5DB', fill: j < r.rating ? '#F59E0B' : '#D1D5DB' }} />
                                                    ))}
                                                </div>
                                            </div>
                                            {r.comment && <p style={{ fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.5, margin: 0 }}>{r.comment}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
