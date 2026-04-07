"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Users, Star, MessageCircle, Copy, Trash2, BookOpen,
    Loader2, Link2, Settings, ChevronRight, ExternalLink, X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { TeacherProfile, TeacherRoom, School, Level, Guidance, Subject } from "@/types";

export default function TeacherDashboardPage() {
    const { user, getPhotoURL } = useAuth();
    const { showSnackbar } = useSnackbar();
    const router = useRouter();

    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [rooms, setRooms] = useState<TeacherRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateRoom, setShowCreateRoom] = useState(false);

    // Create room form
    const [roomForm, setRoomForm] = useState({ name: "", description: "", guidanceId: "", subjectId: "" });
    const [creatingRoom, setCreatingRoom] = useState(false);

    // Curriculum for room creation
    const [schools, setSchools] = useState<School[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [guidances, setGuidances] = useState<Guidance[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSchool, setSelectedSchool] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");

    useEffect(() => {
        if (!user) return;
        if (user.role === "instructor") {
            router.push("/instructor-dashboard");
            return;
        }
        if (user.role !== "teacher" && user.role !== "admin") {
            router.push("/apply-teacher");
            return;
        }

        const fetchData = async () => {
            try {
                const [profileRes, roomsRes, schoolsRes] = await Promise.all([
                    api.get("/teacher/profile/me"),
                    api.get("/teacher/rooms/me"),
                    api.get("/data/schools"),
                ]);
                setProfile(profileRes.data);
                setRooms(roomsRes.data);
                setSchools(schoolsRes.data);
            } catch (err: any) {
                if (err?.response?.status === 404) {
                    // No profile yet — that's fine
                } else {
                    showSnackbar("Failed to load dashboard", "error");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, router, showSnackbar]);

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
            showSnackbar(`Room created! Invite code: ${res.data.inviteCode}`, "success");
        } catch (err: any) {
            showSnackbar(err?.response?.data?.error || "Failed to create room", "error");
        } finally {
            setCreatingRoom(false);
        }
    };

    const copyInviteLink = (code: string) => {
        const link = `${window.location.origin}/teacher/join/${code}`;
        navigator.clipboard.writeText(link);
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

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <Loader2 size={32} className="text-green animate-spin" />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <Loader2 size={32} className="text-green animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8F9FA] pt-24 md:pt-32 pb-32 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-dark">Teacher Dashboard</h1>
                        <p className="text-sm text-dark/50 mt-1">Manage your classrooms and profile</p>
                    </div>
                    {profile && (
                        <button
                            onClick={() => router.push(`/teacher/${profile._id}`)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-dark/70 hover:border-green/40 transition-all"
                        >
                            <ExternalLink size={14} /> View Public Profile
                        </button>
                    )}
                </div>

                {/* Profile Summary */}
                {profile && (
                    <motion.div
                        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-green/10 flex items-center justify-center overflow-hidden shrink-0">
                                {(profile.userId as any)?.photoURL ? (
                                    <Image
                                        src={getPhotoURL((profile.userId as any).photoURL) || ''}
                                        alt="" width={56} height={56}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <span className="text-lg font-black text-green">
                                        {profile.fullName.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold text-dark">{profile.fullName}</h2>
                                <p className="text-sm text-dark/50">{profile.specialist}</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="flex items-center gap-1 justify-center">
                                        <Star size={14} className="text-amber-400 fill-amber-400" />
                                        <span className="font-bold text-dark">{profile.averageRating || "—"}</span>
                                    </div>
                                    <p className="text-[10px] text-dark/40">{profile.totalRatings} reviews</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center gap-1 justify-center">
                                        <Users size={14} className="text-green" />
                                        <span className="font-bold text-dark">{profile.totalStudents}</span>
                                    </div>
                                    <p className="text-[10px] text-dark/40">students</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Rooms Section */}
                <motion.div
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                            <MessageCircle size={18} className="text-green" />
                            My Classrooms
                        </h2>
                        <button
                            onClick={() => setShowCreateRoom(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green text-white rounded-xl text-xs font-bold shadow-lg shadow-green/20"
                        >
                            <Plus size={14} /> New Room
                        </button>
                    </div>

                    {rooms.length === 0 ? (
                        <div className="text-center py-8">
                            <MessageCircle size={32} className="text-dark/20 mx-auto mb-2" />
                            <p className="text-sm text-dark/50">No classrooms yet. Create your first one!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rooms.map(room => (
                                <div key={room._id} className="p-4 bg-[#F8F9FA] rounded-xl">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-dark text-sm">{room.name}</h3>
                                            {room.description && (
                                                <p className="text-xs text-dark/50 mt-0.5">{room.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="flex items-center gap-1 text-xs text-dark/50">
                                                    <Users size={12} /> {room.members?.length || 0} members
                                                </span>
                                                <span className="text-xs font-mono bg-green/10 text-green px-2 py-0.5 rounded">
                                                    {room.inviteCode}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                onClick={() => copyInviteLink(room.inviteCode)}
                                                className="p-2 hover:bg-green/10 rounded-lg transition-colors"
                                                title="Copy invite link"
                                            >
                                                <Copy size={14} className="text-green" />
                                            </button>
                                            <button
                                                onClick={() => deleteRoom(room._id)}
                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete room"
                                            >
                                                <Trash2 size={14} className="text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Create Room Dialog */}
                <AnimatePresence>
                    {showCreateRoom && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                            onClick={() => setShowCreateRoom(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                                onClick={e => e.stopPropagation()}
                                className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-dark">Create Classroom</h3>
                                    <button onClick={() => setShowCreateRoom(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-dark/70 mb-1 block">Room Name *</label>
                                    <input
                                        value={roomForm.name}
                                        onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="e.g. Math Class - 2nd Bac"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-dark/70 mb-1 block">Description</label>
                                    <textarea
                                        value={roomForm.description}
                                        onChange={e => setRoomForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="What will students learn here?"
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:border-green"
                                    />
                                </div>

                                {/* School → Level → Guidance → Subject */}
                                <div>
                                    <label className="text-sm font-bold text-dark/70 mb-1 block">School</label>
                                    <div className="flex flex-wrap gap-2">
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
                                                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                                        selectedSchool === sid
                                                            ? "bg-green/10 border-green text-green"
                                                            : "border-gray-200 text-dark/60"
                                                    }`}
                                                >
                                                    {s.title}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {levels.length > 0 && (
                                    <div>
                                        <label className="text-sm font-bold text-dark/70 mb-1 block">Level</label>
                                        <div className="flex flex-wrap gap-2">
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
                                                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                                            selectedLevel === lid
                                                                ? "bg-green/10 border-green text-green"
                                                                : "border-gray-200 text-dark/60"
                                                        }`}
                                                    >
                                                        {l.title}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {guidances.length > 0 && (
                                    <div>
                                        <label className="text-sm font-bold text-dark/70 mb-1 block">Guidance *</label>
                                        <div className="flex flex-wrap gap-2">
                                            {guidances.map(g => {
                                                const gid = (g as any)._id || g.id;
                                                return (
                                                <button key={gid}
                                                    onClick={() => {
                                                        setRoomForm(f => ({ ...f, guidanceId: gid, subjectId: "" }));
                                                        setSubjects([]);
                                                        fetchSubjects(gid);
                                                    }}
                                                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                                        roomForm.guidanceId === gid
                                                            ? "bg-green/10 border-green text-green"
                                                            : "border-gray-200 text-dark/60"
                                                    }`}
                                                >
                                                    {g.title}
                                                </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {subjects.length > 0 && (
                                    <div>
                                        <label className="text-sm font-bold text-dark/70 mb-1 block">Subject *</label>
                                        <div className="flex flex-wrap gap-2">
                                            {subjects.map(s => {
                                                const sid = (s as any)._id || s.id;
                                                return (
                                                    <button key={sid}
                                                        onClick={() => setRoomForm(f => ({ ...f, subjectId: sid }))}
                                                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                                            roomForm.subjectId === sid
                                                                ? "bg-green/10 border-green text-green"
                                                                : "border-gray-200 text-dark/60"
                                                        }`}
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
                                    className="w-full py-3 bg-green text-white rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                                >
                                    {creatingRoom ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Create Classroom
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
