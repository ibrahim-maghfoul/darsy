"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Star, Users, BookOpen, Award, MessageCircle,
    MapPin, ChevronRight, Loader2, Send
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import api from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { TeacherProfile, TeacherRoom } from "@/types";

export default function TeacherProfilePage() {
    const { id } = useParams();
    const { user, getPhotoURL } = useAuth();
    const { showSnackbar } = useSnackbar();

    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [rooms, setRooms] = useState<TeacherRoom[]>([]);
    const [loading, setLoading] = useState(true);

    // Rating form
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
                // Filter rooms belonging to this teacher
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
            const res = await api.post(`/teacher/profiles/${id}/rate`, {
                rating: ratingValue,
                comment: ratingComment,
            });
            showSnackbar("Rating submitted!", "success");
            // Refresh profile to get updated ratings
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
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <Loader2 size={32} className="text-green animate-spin" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <p className="text-dark/60">Teacher profile not found</p>
            </div>
        );
    }

    const isOwn = user?.id === (profile.userId as any)?._id;

    return (
        <div className="min-h-screen bg-[#F8F9FA] pt-24 md:pt-32 pb-32 px-4">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Profile Header */}
                <motion.div
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-2xl bg-green/10 flex items-center justify-center overflow-hidden shrink-0">
                            {profile.photoURL || (profile.userId as any)?.photoURL ? (
                                <Image
                                    src={getPhotoURL(profile.photoURL || (profile.userId as any)?.photoURL) || ''}
                                    alt={profile.fullName}
                                    width={80} height={80}
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <span className="text-2xl font-black text-green">
                                    {profile.fullName.charAt(0)}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-dark truncate">{profile.fullName}</h1>
                                {profile.isVerified && (
                                    <Award size={18} className="text-green shrink-0" />
                                )}
                            </div>
                            <p className="text-sm text-dark/60 mt-0.5">{profile.specialist}</p>
                            <div className="flex items-center gap-1 mt-1">
                                <MapPin size={14} className="text-dark/40" />
                                <span className="text-xs text-dark/50">{profile.schoolName}</span>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-1">
                                    <Star size={14} className="text-amber-400 fill-amber-400" />
                                    <span className="text-sm font-bold text-dark">{profile.averageRating || "—"}</span>
                                    <span className="text-xs text-dark/40">({profile.totalRatings})</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users size={14} className="text-green" />
                                    <span className="text-sm font-semibold text-dark">{profile.totalStudents}</span>
                                    <span className="text-xs text-dark/40">students</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {profile.bio && (
                        <p className="text-sm text-dark/70 mt-4 leading-relaxed">{profile.bio}</p>
                    )}
                </motion.div>

                {/* Teacher Rooms */}
                <motion.div
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <h2 className="text-lg font-bold text-dark flex items-center gap-2 mb-4">
                        <MessageCircle size={18} className="text-green" />
                        Classrooms
                    </h2>

                    {rooms.length === 0 ? (
                        <p className="text-sm text-dark/50 text-center py-6">No active classrooms yet</p>
                    ) : (
                        <div className="space-y-3">
                            {rooms.map(room => (
                                <div key={room._id} className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-xl">
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-dark text-sm truncate">{room.name}</h3>
                                        {room.description && (
                                            <p className="text-xs text-dark/50 mt-0.5 truncate">{room.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                            <Users size={12} className="text-dark/40" />
                                            <span className="text-xs text-dark/40">{room.members.length}/{room.maxMembers}</span>
                                        </div>
                                    </div>
                                    {!isOwn && user && (
                                        <button
                                            onClick={() => handleJoinRoom(room.inviteCode)}
                                            className="px-4 py-2 bg-green text-white rounded-xl text-xs font-bold shrink-0"
                                        >
                                            Join
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Ratings & Reviews */}
                <motion.div
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <h2 className="text-lg font-bold text-dark flex items-center gap-2 mb-4">
                        <Star size={18} className="text-amber-400" />
                        Reviews ({profile.totalRatings})
                    </h2>

                    {/* Submit rating (not own profile, authenticated) */}
                    {user && !isOwn && (
                        <div className="bg-[#F8F9FA] rounded-xl p-4 mb-4 space-y-3">
                            <p className="text-sm font-semibold text-dark">Rate this teacher</p>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(v => (
                                    <button key={v}
                                        onMouseEnter={() => setRatingHover(v)}
                                        onMouseLeave={() => setRatingHover(0)}
                                        onClick={() => setRatingValue(v)}
                                    >
                                        <Star
                                            size={24}
                                            className={`transition-colors ${
                                                v <= (ratingHover || ratingValue)
                                                    ? "text-amber-400 fill-amber-400"
                                                    : "text-gray-300"
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={ratingComment}
                                onChange={e => setRatingComment(e.target.value)}
                                placeholder="Write a review (optional)..."
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:border-green"
                            />
                            <button
                                onClick={handleRate}
                                disabled={!ratingValue || submittingRating}
                                className="px-4 py-2 bg-green text-white rounded-xl text-xs font-bold disabled:opacity-40 flex items-center gap-1.5"
                            >
                                {submittingRating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                Submit Review
                            </button>
                        </div>
                    )}

                    {/* Existing reviews */}
                    {profile.ratings.length === 0 ? (
                        <p className="text-sm text-dark/50 text-center py-4">No reviews yet</p>
                    ) : (
                        <div className="space-y-3">
                            {profile.ratings.slice().reverse().map((r, i) => (
                                <div key={i} className="flex gap-3 p-3 bg-[#F8F9FA] rounded-xl">
                                    <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center shrink-0">
                                        {(r.userId as any)?.photoURL ? (
                                            <Image
                                                src={getPhotoURL((r.userId as any).photoURL) || ''}
                                                alt="" width={32} height={32}
                                                className="rounded-lg object-cover w-full h-full"
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-green">
                                                {((r.userId as any)?.displayName || "?").charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-dark">
                                                {(r.userId as any)?.displayName || "User"}
                                            </span>
                                            <div className="flex items-center gap-0.5">
                                                {Array.from({ length: 5 }, (_, j) => (
                                                    <Star key={j} size={10}
                                                        className={j < r.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"} />
                                                ))}
                                            </div>
                                        </div>
                                        {r.comment && (
                                            <p className="text-xs text-dark/60 mt-1">{r.comment}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
