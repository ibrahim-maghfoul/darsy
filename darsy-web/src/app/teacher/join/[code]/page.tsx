"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, BookOpen, Loader2, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { useTranslations } from "next-intl";
import api from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

interface RoomPreview {
    _id: string;
    name: string;
    description?: string;
    members: { _id: string }[];
    maxMembers: number;
    roomCode: string;
    teacherProfileId: { fullName: string; specialist: string };
    teacherId: { displayName: string; photoURL?: string };
}

export default function JoinRoomPage() {
    const { code } = useParams<{ code: string }>();
    const { user, getPhotoURL } = useAuth();
    const { showSnackbar } = useSnackbar();
    const router = useRouter();
    const t = useTranslations("JoinRoom");

    const [room, setRoom] = useState<RoomPreview | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [joining, setJoining] = useState(false);
    const [requested, setRequested] = useState(false);

    useEffect(() => {
        if (!code) return;
        api.get(`/teacher/rooms/code/${code}`)
            .then(res => {
                setRoom(res.data);
                // If the current user already has a pending request, show the pending state
                // (checked client-side after auth loads — room.members won't have them yet)
            })
            .catch(err => {
                if (err?.response?.status === 404) setNotFound(true);
            })
            .finally(() => setLoading(false));
    }, [code]);

    // Once user and room are both loaded, check if they already sent a request or are a member
    useEffect(() => {
        if (!user || !room) return;
        const userId = (user as any).id || (user as any)._id;
        const isMember = room.members?.some((m: any) => (m._id || m) === userId);
        if (isMember) setRequested(true);
    }, [user, room]);

    const handleJoin = async () => {
        if (!user) {
            router.push(`/login?redirect=/teacher/join/${code}`);
            return;
        }
        setJoining(true);
        try {
            await api.post(`/teacher/rooms/join-code/${code}`);
            setRequested(true);
            showSnackbar(t("request_sent"), "success");
        } catch (err: any) {
            const msg = err?.response?.data?.error || t("join_error");
            if (msg.toLowerCase().includes("already")) {
                setRequested(true);
                showSnackbar(t("already_member"), "success");
            } else {
                showSnackbar(msg, "error");
            }
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <Loader2 size={32} className="text-green animate-spin" />
            </div>
        );
    }

    if (notFound || !room) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] px-6 text-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center">
                    <BookOpen size={32} className="text-red-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-dark">{t("not_found_title")}</h1>
                    <p className="text-dark/50 mt-2 max-w-sm">{t("not_found_desc")}</p>
                </div>
                <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-green hover:underline">
                    <ArrowLeft size={16} /> {t("back_home")}
                </Link>
            </div>
        );
    }

    const memberCount = room.members?.length ?? 0;
    const isFull = memberCount >= room.maxMembers;

    return (
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4 py-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md p-8 flex flex-col gap-6"
            >
                {/* Teacher info */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green/10 flex items-center justify-center overflow-hidden shrink-0">
                        {room.teacherId?.photoURL ? (
                            <Image
                                src={getPhotoURL(room.teacherId.photoURL) || ""}
                                alt="" width={48} height={48}
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <span className="text-lg font-black text-green">
                                {(room.teacherProfileId?.fullName || room.teacherId?.displayName || "T").charAt(0)}
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-dark text-sm">{room.teacherProfileId?.fullName || room.teacherId?.displayName}</p>
                        <p className="text-xs text-dark/50">{room.teacherProfileId?.specialist}</p>
                    </div>
                </div>

                {/* Room name */}
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green/10 text-green text-xs font-bold mb-3">
                        <BookOpen size={12} /> {t("classroom")}
                    </div>
                    <h1 className="text-2xl font-black text-dark">{room.name}</h1>
                    {room.description && (
                        <p className="text-dark/50 text-sm mt-1.5 leading-relaxed">{room.description}</p>
                    )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 py-4 border-y border-gray-100">
                    <div className="flex items-center gap-1.5 text-sm text-dark/60">
                        <Users size={15} className="text-green" />
                        <span className="font-semibold">{memberCount}</span>
                        <span>/ {room.maxMembers} {t("members")}</span>
                    </div>
                    <div className="h-4 w-px bg-gray-200" />
                    <div className="text-xs font-mono bg-green/10 text-green px-2 py-1 rounded-lg">
                        {room.roomCode}
                    </div>
                </div>

                {/* CTA */}
                {requested ? (
                    <div className="flex items-center gap-3 p-4 bg-green/5 rounded-2xl border border-green/20">
                        <CheckCircle size={20} className="text-green shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-dark">{t("request_sent")}</p>
                            <p className="text-xs text-dark/50 mt-0.5">{t("request_desc")}</p>
                        </div>
                    </div>
                ) : isFull ? (
                    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                        <Users size={20} className="text-red-400 shrink-0" />
                        <p className="text-sm font-bold text-red-500">{t("room_full")}</p>
                    </div>
                ) : (
                    <button
                        onClick={handleJoin}
                        disabled={joining}
                        className="w-full py-4 bg-green text-white rounded-2xl font-bold text-sm shadow-lg shadow-green/25 hover:shadow-green/40 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {joining ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Clock size={16} />
                        )}
                        {joining ? t("joining") : t("request_join")}
                    </button>
                )}

                <Link href="/" className="flex items-center justify-center gap-1.5 text-xs text-dark/40 hover:text-dark/60 transition-colors">
                    <ArrowLeft size={13} /> {t("back_home")}
                </Link>
            </motion.div>
        </div>
    );
}
