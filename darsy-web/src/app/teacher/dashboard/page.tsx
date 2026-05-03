"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Users, Star, MessageCircle, Copy, Trash2, BookOpen,
    Loader2, X, Check, Bell, ChevronDown, ChevronUp, GraduationCap, Settings, Video, LogOut
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { TeacherProfile, TeacherRoom, School, Level, Guidance, Subject } from "@/types";

interface JoinRequest {
    userId: string;
    displayName: string;
    photoURL?: string;
    requestedAt: string;
    status: "pending" | "accepted" | "rejected";
}

interface RoomRequests {
    [roomId: string]: JoinRequest[];
}

export default function TeacherDashboardPage() {
    const { user, loading: authLoading, getPhotoURL, logout } = useAuth();
    const { showSnackbar } = useSnackbar();
    const router = useRouter();

    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [rooms, setRooms] = useState<TeacherRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateRoom, setShowCreateRoom] = useState(false);
    const [hasInstructorAccess, setHasInstructorAccess] = useState(false);

    const [roomRequests, setRoomRequests] = useState<RoomRequests>({});
    const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
    const [reviewingRequest, setReviewingRequest] = useState<string | null>(null);

    const [roomForm, setRoomForm] = useState({ name: "", description: "", guidanceId: "", subjectId: "" });
    const [creatingRoom, setCreatingRoom] = useState(false);

    const [schools, setSchools] = useState<School[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [guidances, setGuidances] = useState<Guidance[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSchool, setSelectedSchool] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");

    const fetchRequests = useCallback(async (roomList: TeacherRoom[]) => {
        const results = await Promise.allSettled(
            roomList.map(room => api.get(`/teacher/rooms/${room._id}/requests`))
        );
        const map: RoomRequests = {};
        results.forEach((result, i) => {
            if (result.status === "fulfilled") map[roomList[i]._id] = result.value.data;
        });
        setRoomRequests(map);
        const withPending = roomList.filter(r => (map[r._id]?.length ?? 0) > 0).map(r => r._id);
        if (withPending.length > 0) setExpandedRequests(prev => new Set([...prev, ...withPending]));
    }, []);

    // Pre-load the instructor dashboard so switching is instant
    useEffect(() => { router.prefetch('/instructor-dashboard'); }, [router]);

    const teacherHasFetchedRef = useRef(false);
    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push("/login"); return; }
        if (user.role !== "teacher" && user.role !== "instructor" && user.role !== "admin") { router.push("/apply-teacher"); return; }

        if (teacherHasFetchedRef.current) return;
        teacherHasFetchedRef.current = true;

        // Admin and instructor roles always have instructor access
        if (user.role === 'admin' || user.role === 'instructor') setHasInstructorAccess(true);

        const fetchData = async () => {
            try {
                const fetches: Promise<any>[] = [
                    api.get("/teacher/profile/me"),
                    api.get("/teacher/rooms/me"),
                    api.get("/data/schools"),
                ];
                // For teacher role, also check if they have an approved instructor application
                if (user.role === 'teacher') {
                    fetches.push(api.get("/teacher/applications/me").catch(() => ({ data: [] })));
                }
                const [profileRes, roomsRes, schoolsRes, appsRes] = await Promise.all(fetches);
                setProfile(profileRes.data);
                const fetchedRooms = roomsRes.data;
                setRooms(fetchedRooms);
                setSchools(schoolsRes.data);
                if (appsRes) {
                    const hasApproved = (appsRes.data || []).some((a: any) => a.status === 'approved');
                    if (hasApproved) setHasInstructorAccess(true);
                }
                await fetchRequests(fetchedRooms);
            } catch (err: any) {
                if (err?.response?.status !== 404) showSnackbar("Failed to load dashboard", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, authLoading]);

    const fetchLevels = async (schoolId: string) => {
        try { setLevels((await api.get(`/data/levels/${schoolId}`)).data); } catch { setLevels([]); }
    };
    const fetchGuidances = async (levelId: string) => {
        try { setGuidances((await api.get(`/data/guidances/${levelId}`)).data); } catch { setGuidances([]); }
    };
    const fetchSubjects = async (guidanceId: string) => {
        try { setSubjects((await api.get(`/data/subjects/${guidanceId}`)).data); } catch { setSubjects([]); }
    };

    const handleCreateRoom = async () => {
        if (!roomForm.name || !roomForm.guidanceId || !roomForm.subjectId) {
            showSnackbar("Fill in all required fields", "error");
            return;
        }
        setCreatingRoom(true);
        try {
            const res = await api.post("/teacher/rooms", roomForm);
            setRooms(prev => [res.data.room, ...prev]);
            setShowCreateRoom(false);
            setRoomForm({ name: "", description: "", guidanceId: "", subjectId: "" });
            showSnackbar(`Room created! Invite code: ${res.data.roomCode}`, "success");
        } catch (err: any) {
            showSnackbar(err?.response?.data?.error || "Failed to create room", "error");
        } finally {
            setCreatingRoom(false);
        }
    };

    const copyInviteLink = (code: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/teacher/join/${code}`);
        showSnackbar("Invite link copied!", "success");
    };

    const deleteRoom = async (roomId: string) => {
        try {
            await api.delete(`/teacher/rooms/${roomId}`);
            setRooms(prev => prev.filter(r => r._id !== roomId));
            showSnackbar("Room deleted", "success");
        } catch {
            showSnackbar("Failed to delete room", "error");
        }
    };

    const reviewRequest = async (roomId: string, userId: string, action: "accept" | "reject") => {
        const key = `${roomId}:${userId}`;
        setReviewingRequest(key);
        try {
            await api.patch(`/teacher/rooms/${roomId}/requests/${userId}`, { action });
            setRoomRequests(prev => ({
                ...prev,
                [roomId]: (prev[roomId] ?? []).filter(r => r.userId !== userId),
            }));
            if (action === "accept") {
                setRooms(prev => prev.map(r =>
                    r._id === roomId ? { ...r, members: [...(r.members as any[]), { _id: userId }] } : r
                ));
            }
            showSnackbar(action === "accept" ? "Student accepted!" : "Request rejected", action === "accept" ? "success" : "error");
        } catch {
            showSnackbar("Failed to review request", "error");
        } finally {
            setReviewingRequest(null);
        }
    };

    const toggleRequests = (roomId: string) => {
        setExpandedRequests(prev => {
            const next = new Set(prev);
            next.has(roomId) ? next.delete(roomId) : next.add(roomId);
            return next;
        });
    };

    const totalPending = Object.values(roomRequests).reduce((sum, reqs) => sum + reqs.length, 0);

    // While auth is still loading (e.g. cold start) show a minimal spinner
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <Loader2 size={32} className="text-green animate-spin" />
            </div>
        );
    }

    const avatarLetter = (profile?.fullName || user?.displayName || "T").charAt(0).toUpperCase();

    return (
        <main className="min-h-screen bg-[#F8F9FA] pb-20">

            {/* ── Hero / Cover ── */}
            <div className="relative w-full h-60 md:h-72 overflow-hidden bg-gradient-to-br from-[#071a0e] via-[#0d2416] to-[#1a3a2a]">
                {/* Dot pattern */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: "radial-gradient(circle, rgba(58,170,106,0.15) 1.5px, transparent 1.5px)",
                        backgroundSize: "22px 22px",
                    }}
                />
                {/* Diagonal line texture */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: "repeating-linear-gradient(-45deg, #3aaa6a 0, #3aaa6a 1px, transparent 0, transparent 50%)",
                        backgroundSize: "18px 18px",
                    }}
                />
                {/* Bottom fade */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Profile overlay */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-5 flex items-end justify-between gap-4 z-10">
                    <div className="flex items-end gap-4">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-[20px] border-[3px] border-white/25 shadow-2xl overflow-hidden bg-gradient-to-br from-green/70 to-green/30 flex-shrink-0 relative">
                            {profile && (profile.userId as any)?.photoURL ? (
                                <Image
                                    src={getPhotoURL((profile.userId as any).photoURL) || ""}
                                    alt="" fill className="object-cover" unoptimized
                                />
                            ) : (
                                <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">
                                    {avatarLetter}
                                </span>
                            )}
                        </div>
                        {/* Name + role */}
                        <div className="pb-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <GraduationCap size={12} className="text-green-300" />
                                <span className="text-[10px] font-bold text-green-300 uppercase tracking-widest">Teacher</span>
                            </div>
                            <h1 className="text-xl font-bold text-white leading-tight">
                                {profile?.fullName || user?.displayName}
                            </h1>
                            {profile?.specialist && (
                                <p className="text-white/55 text-sm mt-0.5">{profile.specialist}</p>
                            )}
                        </div>
                    </div>

                    {/* Hero actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 mb-1">
                        {totalPending > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/20 backdrop-blur-sm border border-amber-300/30 rounded-xl text-xs font-bold text-amber-200">
                                <Bell size={12} />
                                {totalPending} pending
                            </div>
                        )}
                        <Link
                            href="/settings"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-white text-xs font-semibold hover:bg-white/25 transition-all"
                        >
                            <Settings size={12} />
                            Settings
                        </Link>
                        <button
                            onClick={() => logout().then(() => router.push("/"))}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl text-red-200 text-xs font-semibold hover:bg-red-500/35 transition-all"
                        >
                            <LogOut size={12} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Dashboard tab switcher ── */}
            {(user?.role === 'admin' || user?.role === 'instructor' || hasInstructorAccess) && (
                <div className="flex justify-center py-3 bg-[#F8F9FA] border-b border-gray-100">
                    <div className="flex gap-1 p-1 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-black">
                            <GraduationCap size={14} /> Teacher
                        </div>
                        <Link
                            href="/instructor-dashboard"
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-dark/40 hover:text-dark/70 hover:bg-gray-50 text-sm font-black transition-all"
                        >
                            <Video size={14} /> Instructor
                        </Link>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto px-4 sm:px-6">

                {/* ── Stats Row ── */}
                {profile && (
                    <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-5 mb-6">
                        {[
                            { value: profile.totalStudents || 0, label: "Students", icon: Users },
                            { value: rooms.length, label: "Classrooms", icon: MessageCircle },
                            {
                                value: profile.averageRating ? Number(profile.averageRating).toFixed(1) : "—",
                                label: `${profile.totalRatings || 0} ratings`,
                                icon: Star,
                            },
                        ].map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07, duration: 0.35 }}
                                className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm"
                            >
                                <p className="text-2xl sm:text-3xl font-bold text-dark">{stat.value}</p>
                                <p className="text-xs sm:text-sm text-dark/50 mt-1 flex items-center gap-1.5">
                                    <stat.icon size={13} className="text-green" />
                                    {stat.label}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* ── Classrooms Section ── */}
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                            <MessageCircle size={18} className="text-green" />
                            My Classrooms
                        </h2>
                        <button
                            onClick={() => setShowCreateRoom(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green text-white rounded-xl text-xs font-bold shadow-lg shadow-green/20 hover:bg-green/90 active:scale-95 transition-all"
                        >
                            <Plus size={14} /> New Room
                        </button>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                                    <div className="h-4 w-1/3 bg-gray-100 rounded-lg mb-3" />
                                    <div className="h-3 w-2/3 bg-gray-100 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-green/5 flex items-center justify-center mx-auto mb-4">
                                <MessageCircle size={24} className="text-green/35" />
                            </div>
                            <p className="font-semibold text-dark/60">No classrooms yet</p>
                            <p className="text-sm text-dark/40 mt-1">Create your first classroom to start teaching</p>
                            <button
                                onClick={() => setShowCreateRoom(true)}
                                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-green text-white rounded-xl text-sm font-bold shadow-lg shadow-green/20 hover:bg-green/90 transition-all"
                            >
                                <Plus size={15} /> Create Classroom
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rooms.map((room, i) => {
                                const pending = roomRequests[room._id] ?? [];
                                const isExpanded = expandedRequests.has(room._id);

                                return (
                                    <motion.div
                                        key={room._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 + 0.25 }}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:border-green/25 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                                    >
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                                    {/* Room icon */}
                                                    <div className="w-11 h-11 rounded-xl bg-green/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-green/15 transition-colors">
                                                        <BookOpen size={18} className="text-green" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-dark truncate">{room.name}</h3>
                                                        {room.description && (
                                                            <p className="text-sm text-dark/50 mt-0.5 line-clamp-1">{room.description}</p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                                                            <span className="flex items-center gap-1 text-xs text-dark/50 bg-gray-50 px-2.5 py-1 rounded-lg">
                                                                <Users size={11} /> {room.members?.length || 0} members
                                                            </span>
                                                            <span className="text-xs font-mono bg-green/10 text-green px-2.5 py-1 rounded-lg border border-green/15">
                                                                {room.roomCode}
                                                            </span>
                                                            {(room.totalRatings > 0) && (
                                                                <span className="flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg border border-amber-100">
                                                                    <Star size={10} className="fill-amber-400 text-amber-400" />
                                                                    {room.averageRating?.toFixed(1)} <span className="font-normal text-amber-500/70">({room.totalRatings})</span>
                                                                </span>
                                                            )}
                                                            {pending.length > 0 && (
                                                                <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg border border-amber-100">
                                                                    {pending.length} waiting
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {pending.length > 0 && (
                                                        <button
                                                            onClick={() => toggleRequests(room._id)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold text-amber-600 transition-colors"
                                                        >
                                                            <Bell size={12} />
                                                            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => copyInviteLink(room.roomCode)}
                                                        className="p-2 hover:bg-green/10 rounded-lg transition-colors group/btn"
                                                        title="Copy invite link"
                                                    >
                                                        <Copy size={14} className="text-dark/35 group-hover/btn:text-green transition-colors" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteRoom(room._id)}
                                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group/btn"
                                                        title="Delete room"
                                                    >
                                                        <Trash2 size={14} className="text-dark/35 group-hover/btn:text-red-400 transition-colors" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Join requests panel */}
                                        <AnimatePresence>
                                            {isExpanded && pending.length > 0 && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="border-t border-amber-100 bg-amber-50/50 px-4 py-3 space-y-2">
                                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest px-1">
                                                            Pending Join Requests
                                                        </p>
                                                        {pending.map(req => {
                                                            const key = `${room._id}:${req.userId}`;
                                                            const isReviewing = reviewingRequest === key;
                                                            return (
                                                                <div key={req.userId} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2.5 border border-amber-100/60">
                                                                    <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                                        {req.photoURL ? (
                                                                            <Image src={getPhotoURL(req.photoURL) || ""} alt="" width={32} height={32} className="object-cover w-full h-full" />
                                                                        ) : (
                                                                            <span className="text-xs font-black text-green">{req.displayName.charAt(0).toUpperCase()}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-bold text-dark truncate">{req.displayName}</p>
                                                                        <p className="text-[10px] text-dark/40">
                                                                            {new Date(req.requestedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                        <button
                                                                            onClick={() => reviewRequest(room._id, req.userId, "reject")}
                                                                            disabled={isReviewing}
                                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 border border-red-100 transition-colors disabled:opacity-40"
                                                                        >
                                                                            {isReviewing ? <Loader2 size={12} className="animate-spin text-red-400" /> : <X size={12} className="text-red-400" />}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => reviewRequest(room._id, req.userId, "accept")}
                                                                            disabled={isReviewing}
                                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-green/10 hover:bg-green/20 border border-green/20 transition-colors disabled:opacity-40"
                                                                        >
                                                                            {isReviewing ? <Loader2 size={12} className="animate-spin text-green" /> : <Check size={12} className="text-green" />}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.section>
            </div>

            {/* ── Create Room Modal ── */}
            <AnimatePresence>
                {showCreateRoom && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 sm:p-6"
                        onClick={() => setShowCreateRoom(false)}
                    >
                        <motion.div
                            initial={{ y: 48, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 48, opacity: 0 }}
                            transition={{ type: "spring", damping: 28, stiffness: 320 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl sm:rounded-2xl p-6 w-full max-w-md max-h-[88vh] overflow-y-auto shadow-2xl"
                        >
                            {/* Modal header */}
                            <div className="flex items-start justify-between mb-5">
                                <div>
                                    <h3 className="text-lg font-bold text-dark">Create Classroom</h3>
                                    <p className="text-xs text-dark/45 mt-0.5">Set up a new virtual classroom for your students</p>
                                </div>
                                <button
                                    onClick={() => setShowCreateRoom(false)}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Room name */}
                                <div>
                                    <label className="text-[11px] font-bold text-dark/50 mb-1.5 block uppercase tracking-wider">
                                        Room Name *
                                    </label>
                                    <input
                                        value={roomForm.name}
                                        onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="e.g. Math Class — 2nd Bac"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green transition-colors"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-[11px] font-bold text-dark/50 mb-1.5 block uppercase tracking-wider">
                                        Description
                                    </label>
                                    <textarea
                                        value={roomForm.description}
                                        onChange={e => setRoomForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="What will students learn here?"
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-green transition-colors"
                                    />
                                </div>

                                {/* School */}
                                {schools.length > 0 && (
                                    <div>
                                        <label className="text-[11px] font-bold text-dark/50 mb-1.5 block uppercase tracking-wider">School</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {schools.map(s => {
                                                const sid = (s as any)._id || s.id;
                                                return (
                                                    <button key={sid}
                                                        onClick={() => {
                                                            setSelectedSchool(sid);
                                                            setSelectedLevel(""); setLevels([]); setGuidances([]); setSubjects([]);
                                                            setRoomForm(f => ({ ...f, guidanceId: "", subjectId: "" }));
                                                            fetchLevels(sid);
                                                        }}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${selectedSchool === sid ? "bg-green/10 border-green text-green" : "border-gray-200 text-dark/55 hover:border-green/40"}`}
                                                    >
                                                        {s.title}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Level */}
                                {levels.length > 0 && (
                                    <div>
                                        <label className="text-[11px] font-bold text-dark/50 mb-1.5 block uppercase tracking-wider">Level</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {levels.map(l => {
                                                const lid = (l as any)._id || l.id;
                                                return (
                                                    <button key={lid}
                                                        onClick={() => {
                                                            setSelectedLevel(lid);
                                                            setGuidances([]); setSubjects([]);
                                                            setRoomForm(f => ({ ...f, guidanceId: "", subjectId: "" }));
                                                            fetchGuidances(lid);
                                                        }}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${selectedLevel === lid ? "bg-green/10 border-green text-green" : "border-gray-200 text-dark/55 hover:border-green/40"}`}
                                                    >
                                                        {l.title}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Guidance */}
                                {guidances.length > 0 && (
                                    <div>
                                        <label className="text-[11px] font-bold text-dark/50 mb-1.5 block uppercase tracking-wider">Guidance *</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {guidances.map(g => {
                                                const gid = (g as any)._id || g.id;
                                                return (
                                                    <button key={gid}
                                                        onClick={() => {
                                                            setRoomForm(f => ({ ...f, guidanceId: gid, subjectId: "" }));
                                                            setSubjects([]);
                                                            fetchSubjects(gid);
                                                        }}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${roomForm.guidanceId === gid ? "bg-green/10 border-green text-green" : "border-gray-200 text-dark/55 hover:border-green/40"}`}
                                                    >
                                                        {g.title}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Subject */}
                                {subjects.length > 0 && (
                                    <div>
                                        <label className="text-[11px] font-bold text-dark/50 mb-1.5 block uppercase tracking-wider">Subject *</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {subjects.map(s => {
                                                const sid = (s as any)._id || s.id;
                                                return (
                                                    <button key={sid}
                                                        onClick={() => setRoomForm(f => ({ ...f, subjectId: sid }))}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${roomForm.subjectId === sid ? "bg-green/10 border-green text-green" : "border-gray-200 text-dark/55 hover:border-green/40"}`}
                                                    >
                                                        {s.title}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleCreateRoom}
                                    disabled={!roomForm.name || !roomForm.guidanceId || !roomForm.subjectId || creatingRoom}
                                    className="w-full py-3.5 bg-green text-white rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-green/20 hover:bg-green/90 active:scale-[0.98] transition-all mt-2"
                                >
                                    {creatingRoom ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Create Classroom
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
