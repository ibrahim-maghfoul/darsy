"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import { format } from "date-fns";
import Image from "next/image";
import api from "@/lib/api";
import {
    AtSign,
    Flag,
    ChevronLeft,
    Send,
    Smile,
    User,
    ShieldAlert,
    MessageCircle,
    Reply,
    X,
    Bell,
    Star,
    Users,
    LogIn,
} from "lucide-react";
import { useSnackbar } from "@/contexts/SnackbarContext";
import Link from "next/link";

interface Reaction {
    emoji: string;
    userId: string;
}

interface Message {
    _id: string;
    sender: { _id: string; displayName: string; photoURL?: string; subscription?: { plan: string }; role?: string };
    text: string;
    reactions: Reaction[];
    replyTo?: { _id: string; text: string; sender: { _id: string; displayName: string; subscription?: { plan: string } } };
    createdAt: string;
}

interface Participant {
    _id: string;
    displayName: string;
    photoURL?: string;
    subscription?: { plan: string };
}

const EMOJIS = ["👍", "❤️", "😂", "👏", "💡", "❓"];

const DOT_TEXTURE = `radial-gradient(circle, rgba(58,170,106,0.18) 1px, transparent 1px)`;
const DARK_STRIPE = `repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 8px), linear-gradient(135deg, #1e7a46 0%, #0f4428 100%)`;

export default function ChatPage() {
    const t = useTranslations("Profile");
    const { user, loading, getPhotoURL } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<string>("general");
    const [joinedRooms, setJoinedRooms] = useState<any[]>([]);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isConnecting, setIsConnecting] = useState(true);
    const [activeReactionMsg, setActiveReactionMsg] = useState<string | null>(null);
    const [activeReply, setActiveReply] = useState<{ _id: string; text: string; senderName: string } | null>(null);
    const [typingUsers, setTypingUsers] = useState<{ userId: string; displayName: string }[]>([]);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState<{ userId: string; displayName: string; photoURL?: string; subscriptionPlan?: string }[]>([]);
    const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
    const [reportingMsg, setReportingMsg] = useState<Message | null>(null);
    const [reportReason, setReportReason] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const { showSnackbar } = useSnackbar();

    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!user) return;
        api.get("/teacher/rooms/joined").then((r) => setJoinedRooms(r.data || [])).catch(() => {});
    }, [user]);

    const isProfileComplete = !!(
        user?.displayName &&
        user?.nickname &&
        user?.city &&
        user?.age &&
        user?.level?.guidance &&
        user?.level?.level
    );

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialLoad = useRef(true);

    const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
        if (!scrollContainerRef.current) return;
        scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior });
    };

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        setIsNearBottom(scrollHeight - scrollTop - clientHeight < 100);
    };

    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reportingMsg || !reportReason || !reportDetails) return;
        setIsSubmittingReport(true);
        try {
            await api.post("/chat/report", {
                reportedUserId: reportingMsg?.sender?._id,
                messageId: reportingMsg?._id,
                reason: reportReason,
                details: reportDetails,
            });
            showSnackbar(t("report_success"), "success");
            setReportingMsg(null);
            setReportReason("");
            setReportDetails("");
        } catch {
            showSnackbar(t("report_error"), "error");
        } finally {
            setIsSubmittingReport(false);
        }
    };

    useEffect(() => {
        if (messages.length === 0) return;
        if (isInitialLoad.current) {
            scrollToBottom("auto");
            isInitialLoad.current = false;
            return;
        }
        const lastMessage = messages[messages.length - 1];
        const currentUserId = user?.id || (user as { _id?: string })?._id;
        if (lastMessage?.sender?._id === currentUserId || isNearBottom) scrollToBottom("smooth");
    }, [messages.length]);

    useEffect(() => {
        if (loading) return;
        if (!user) return;
        if (!isProfileComplete) return;

        const currentUserId = user.id || (user as { _id?: string })._id;
        const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (activeTab !== "general") {
            const fetchTeacherHistory = async () => {
                try {
                    const res = await api.get(`/teacher/rooms/${activeTab}/messages`);
                    setMessages((res.data || []).map((m: any) => ({ ...m, reactions: m.reactions || [] })));
                } catch {}
            };
            fetchTeacherHistory();

            const socket = io(baseURL, { withCredentials: true, auth: { token } });
            socketRef.current = socket;

            socket.on("connect", () => {
                setIsConnecting(false);
                socket.emit("join_teacher_room", {
                    roomId: activeTab,
                    userId: currentUserId,
                    displayName: user.displayName,
                    isTeacher: user.role === "teacher",
                });
            });
            socket.on("teacher_room_users", (users: { userId: string; displayName: string; isTeacher: boolean }[]) => {
                setOnlineUsers(users.map((u) => ({ userId: u.userId, displayName: u.displayName, photoURL: undefined, subscriptionPlan: undefined })));
            });
            socket.on("receive_teacher_message", (message: any) => {
                setMessages((prev) => [...prev, { ...message, reactions: message.reactions || [] }]);
            });
            socket.on("teacher_user_typing", (data: { userId: string; displayName: string }) => {
                setTypingUsers((prev) => (prev.find((u) => u.userId === data.userId) ? prev : [...prev, data]));
            });
            socket.on("teacher_user_stopped_typing", (data: { userId: string }) => {
                setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
            });
            socket.on("disconnect", () => setIsConnecting(true));

            return () => {
                socket.disconnect();
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            };
        }

        const guidance = user.level?.guidance;
        const level = user.level?.level;
        if (!guidance || !level) return;

        const fetchHistory = async () => {
            try {
                const res = await api.get(`/chat/history?guidance=${encodeURIComponent(guidance)}&level=${encodeURIComponent(level)}`);
                setMessages(res.data);
            } catch {}
        };
        fetchHistory();

        const socket = io(baseURL, { withCredentials: true, auth: { token } });
        socketRef.current = socket;

        socket.on("connect", () => {
            setIsConnecting(false);
            socket.emit("join_room", {
                guidance, level,
                userId: currentUserId,
                displayName: user.displayName,
                photoURL: user.photoURL,
                subscriptionPlan: user.subscription?.plan,
            });
        });
        socket.on("room_users", (users: { userId: string; displayName: string; photoURL?: string; subscriptionPlan?: string }[]) => {
            setOnlineUsers(users);
        });
        socket.on("room_participants", (participants: Participant[]) => {
            setAllParticipants(participants);
        });
        socket.on("receive_message", (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });
        socket.on("message_updated", (updatedMessage: Message) => {
            setMessages((prev) => prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg)));
        });
        socket.on("user_typing", (data: { userId: string; displayName: string }) => {
            setTypingUsers((prev) => (prev.find((u) => u.userId === data.userId) ? prev : [...prev, data]));
        });
        socket.on("user_stopped_typing", (data: { userId: string }) => {
            setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
        });
        socket.on("disconnect", () => setIsConnecting(true));

        return () => {
            socket.disconnect();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [user, loading, activeTab]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !socketRef.current) return;
        const currentUserId = user.id || (user as { _id?: string })._id;

        if (activeTab !== "general") {
            socketRef.current.emit("send_teacher_message", {
                roomId: activeTab,
                sender: currentUserId,
                isTeacher: user.role === "teacher",
                text: newMessage.trim(),
            });
        } else {
            socketRef.current.emit("send_message", {
                guidance: user.level?.guidance,
                level: user.level?.level,
                sender: currentUserId,
                text: newMessage.trim(),
                replyTo: activeReply?._id,
            });
            socketRef.current.emit("typing_end", {
                guidance: user.level?.guidance,
                level: user.level?.level,
                userId: currentUserId,
            });
        }
        setNewMessage("");
        setActiveReply(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (!user || !socketRef.current) return;
        const currentUserId = user.id || (user as { _id?: string })._id;

        if (activeTab !== "general") {
            socketRef.current.emit("teacher_typing_start", { roomId: activeTab, userId: currentUserId, displayName: user.displayName });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current?.emit("teacher_typing_end", { roomId: activeTab, userId: currentUserId });
            }, 2000);
            return;
        }

        socketRef.current.emit("typing_start", {
            guidance: user.level?.guidance,
            level: user.level?.level,
            userId: currentUserId,
            displayName: user.displayName,
        });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current?.emit("typing_end", {
                guidance: user.level?.guidance,
                level: user.level?.level,
                userId: user.id || (user as { _id?: string })._id,
            });
        }, 2000);
    };

    const handleReaction = (messageId: string, emoji: string) => {
        if (!user || !socketRef.current) return;
        const currentUserId = user.id || (user as { _id?: string })._id;
        const msg = messages.find((m) => m._id === messageId);
        const existingEmoji = msg?.reactions?.find((r) => r.userId === currentUserId)?.emoji;

        if (existingEmoji) {
            socketRef.current.emit("reaction", {
                messageId, emoji: existingEmoji, userId: currentUserId,
                guidance: user.level?.guidance, level: user.level?.level,
            });
            if (existingEmoji === emoji) { setActiveReactionMsg(null); return; }
        }
        socketRef.current.emit("reaction", {
            messageId, emoji, userId: currentUserId,
            guidance: user.level?.guidance, level: user.level?.level,
        });
        setActiveReactionMsg(null);
    };

    const formatMessageTime = (dateString: string): string => {
        const date = new Date(dateString);
        return Date.now() - date.getTime() > 86400000
            ? format(date, "MMM d, h:mm a")
            : format(date, "h:mm a");
    };

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = "unset"; };
    }, []);

    // ── Loading spinner ──
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bg">
                <div className="w-10 h-10 border-[3px] border-green border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // ── Not logged in ──
    if (!user) {
        return (
            <div className="min-h-[100dvh] bg-bg flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-md w-full bg-white rounded-[32px] border border-green/10 p-10 shadow-[0_20px_60px_rgba(0,0,0,0.08),_0_4px_16px_rgba(0,0,0,0.04)] text-center space-y-8"
                >
                    <div
                        className="w-20 h-20 rounded-[22px] flex items-center justify-center mx-auto relative overflow-hidden"
                        style={{ background: "linear-gradient(135deg, #f0faf5, #e8f5ee)" }}
                    >
                        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: DOT_TEXTURE, backgroundSize: "14px 14px" }} />
                        <MessageCircle size={36} className="text-green relative z-10" />
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black text-dark">Sign In Required</h1>
                        <p className="text-sm text-dark/50 leading-relaxed font-medium">
                            You need to be signed in to access Class Chat and communicate with other students.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Link href="/login" className="w-full py-4 bg-green text-white font-black rounded-[14px] hover:bg-green/90 transition-colors text-sm flex items-center justify-center gap-2 shadow-lg shadow-green/20">
                            <LogIn size={16} /> Sign In to Chat
                        </Link>
                        <Link href="/" className="w-full py-4 bg-white border-[1.5px] border-green/15 text-dark/50 font-bold rounded-[14px] hover:bg-green/5 hover:border-green/25 transition-all text-sm">
                            Return Home
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ── Profile incomplete ──
    if (!isProfileComplete) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-md w-full bg-white rounded-[32px] border border-green/10 p-10 shadow-[0_20px_60px_rgba(0,0,0,0.08),_0_4px_16px_rgba(0,0,0,0.04)] text-center space-y-8"
                >
                    <div
                        className="w-20 h-20 rounded-[22px] flex items-center justify-center mx-auto relative overflow-hidden"
                        style={{ background: "linear-gradient(135deg, #f0faf5, #e8f5ee)" }}
                    >
                        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: DOT_TEXTURE, backgroundSize: "14px 14px" }} />
                        <ShieldAlert size={36} className="text-green relative z-10" />
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl font-black text-dark">{t("chat_blocked_title")}</h1>
                        <p className="text-sm text-dark/50 leading-relaxed font-medium">{t("chat_blocked_desc")}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Link href="/onboarding" className="w-full py-4 bg-green text-white font-black rounded-[14px] hover:bg-green/90 transition-colors text-sm shadow-lg shadow-green/20">
                            {t("complete_profile_btn")}
                        </Link>
                        <Link href="/profile" className="w-full py-4 bg-white border-[1.5px] border-green/15 text-dark/50 font-bold rounded-[14px] hover:bg-green/5 hover:border-green/25 transition-all text-sm">
                            {t("back_to_profile_btn")}
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    const activeRoomObj = activeTab !== "general" ? joinedRooms.find((r) => r._id === activeTab) : null;
    const roomName = activeRoomObj ? activeRoomObj.name : (user.level?.level || "Class Chat");

    return (
        <div className="h-[100dvh] bg-bg md:bg-bg flex flex-col md:flex-row overflow-hidden relative">

            {/* ── Desktop: dark green sidebar ── */}
            <div
                className="hidden md:flex flex-col w-[272px] shrink-0 p-5 gap-5 relative overflow-hidden"
                style={{ background: DARK_STRIPE }}
            >
                {/* Back button — white pill on dark panel */}
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.back()}
                    className="relative z-10 flex items-center gap-2 text-white/80 hover:text-white transition-all text-xs font-black uppercase tracking-widest w-fit px-4 py-2 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/10 group"
                >
                    <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back
                </motion.button>

                {/* Room info card */}
                <div className="relative z-10 rounded-[18px] overflow-hidden" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    {/* Icon header with dot texture */}
                    <div className="relative px-4 pt-4 pb-3" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: DOT_TEXTURE, backgroundSize: "14px 14px" }} />
                        <div className="relative z-10 w-11 h-11 rounded-[14px] bg-white/15 flex items-center justify-center">
                            <MessageCircle size={20} className="text-white" />
                        </div>
                    </div>
                    {/* Info */}
                    <div className="px-4 pb-4 pt-3 space-y-3">
                        <div>
                            <h2 className="text-white font-black text-base leading-tight">{roomName}</h2>
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.18em] mt-0.5">{t("class_space")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {isConnecting ? (
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                            ) : (
                                <span className="relative flex w-2 h-2 shrink-0">
                                    <span className="w-2 h-2 rounded-full bg-green" />
                                    <span className="absolute inset-0 rounded-full bg-green animate-ping opacity-60" />
                                </span>
                            )}
                            <span className="text-[11px] font-bold text-white/50">
                                {isConnecting ? "Connecting…" : `${onlineUsers.length} online`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Room tabs — vertical list */}
                {joinedRooms.length > 0 && (
                    <div className="relative z-10 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30 px-1 mb-2">Rooms</p>
                        <button
                            onClick={() => { if (activeTab !== "general") { setMessages([]); setOnlineUsers([]); setActiveTab("general"); } }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-xs font-bold text-left transition-all ${activeTab === "general" ? "bg-white/15 text-white border border-white/20" : "text-white/55 hover:bg-white/8 hover:text-white/80"}`}
                        >
                            <MessageCircle size={13} />
                            {user.level?.level || "Class Chat"}
                        </button>
                        {joinedRooms.map((room) => (
                            <button
                                key={room._id}
                                onClick={() => { if (activeTab !== room._id) { setMessages([]); setOnlineUsers([]); setActiveTab(room._id); } }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-xs font-bold text-left transition-all ${activeTab === room._id ? "bg-white/15 text-white border border-white/20" : "text-white/55 hover:bg-white/8 hover:text-white/80"}`}
                            >
                                <Users size={13} />
                                {room.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Online users — full list only for teacher in their own room; count for everyone else */}
                <div className="relative z-10 flex-1 overflow-y-auto space-y-0.5 min-h-0">
                    {activeTab !== 'general' && user.role === 'teacher' ? (
                        <>
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30 px-1 mb-2">Online ({onlineUsers.length})</p>
                            <AnimatePresence>
                                {onlineUsers.map((ou) => (
                                    <motion.div
                                        key={ou.userId}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center gap-2.5 px-2 py-2 rounded-[10px] hover:bg-white/8 transition-colors group"
                                    >
                                        <div className="relative shrink-0">
                                            <div className="w-7 h-7 rounded-[9px] bg-white/12 overflow-hidden flex items-center justify-center">
                                                {ou.photoURL ? (
                                                    <Image src={getPhotoURL(ou.photoURL) || ""} alt={ou.displayName} fill sizes="28px" className="object-cover" />
                                                ) : (
                                                    <User size={13} className="text-white/60" />
                                                )}
                                            </div>
                                            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green rounded-full border border-[#1e7a46]" />
                                        </div>
                                        <span className="text-xs font-semibold text-white/65 group-hover:text-white/90 transition-colors truncate">{ou.displayName}</span>
                                        {(ou.subscriptionPlan === "premium" || ou.subscriptionPlan === "pro") && (
                                            <Star size={9} className="text-amber-300 fill-amber-300 shrink-0 ml-auto" />
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {allParticipants.filter((p) => !onlineUsers.some((ou) => ou.userId === p._id)).length > 0 && (
                                <>
                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/20 px-1 mt-4 mb-2">Offline</p>
                                    {allParticipants
                                        .filter((p) => p && !onlineUsers.some((ou) => ou.userId === p._id))
                                        .map((p) => (
                                            <div key={p._id} className="flex items-center gap-2.5 px-2 py-2 rounded-[10px] opacity-35">
                                                <div className="w-7 h-7 rounded-[9px] bg-white/8 flex items-center justify-center shrink-0">
                                                    {p.photoURL ? (
                                                        <Image src={getPhotoURL(p.photoURL) || ""} alt={p.displayName} fill sizes="28px" className="object-cover grayscale" />
                                                    ) : (
                                                        <User size={13} className="text-white/40" />
                                                    )}
                                                </div>
                                                <span className="text-xs font-semibold text-white/40 truncate">{p.displayName}</span>
                                            </div>
                                        ))}
                                </>
                            )}
                        </>
                    ) : (
                        // Count-only view for students and general chat
                        <div className="flex flex-col gap-3 px-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30 mb-1">Participants</p>
                            <div className="flex items-center gap-2.5 px-3 py-3 rounded-[14px] bg-white/6 border border-white/8">
                                <span className="relative flex w-2.5 h-2.5 shrink-0">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green" />
                                    <span className="absolute inset-0 rounded-full bg-green animate-ping opacity-50" />
                                </span>
                                <span className="text-sm font-black text-white/80">{onlineUsers.length}</span>
                                <span className="text-xs text-white/40 font-semibold">online now</span>
                            </div>
                            {allParticipants.length > 0 && (
                                <div className="flex items-center gap-2.5 px-3 py-3 rounded-[14px] bg-white/4 border border-white/5">
                                    <Users size={13} className="text-white/35 shrink-0" />
                                    <span className="text-sm font-black text-white/60">{allParticipants.length}</span>
                                    <span className="text-xs text-white/30 font-semibold">total members</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Chat panel (floating white card) ── */}
            <div className="flex-1 flex flex-col min-w-0 md:m-3 md:rounded-[24px] bg-white overflow-hidden md:shadow-[0_20px_60px_rgba(0,0,0,0.08),_0_4px_16px_rgba(0,0,0,0.04)]">

                {/* Mobile room tabs */}
                <div className="md:hidden flex gap-1.5 px-3 pt-3 pb-2 overflow-x-auto shrink-0 scrollbar-none bg-white border-b border-green/8">
                    <button
                        onClick={() => { if (activeTab !== "general") { setMessages([]); setOnlineUsers([]); setActiveTab("general"); } }}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === "general" ? "bg-green text-white shadow-sm shadow-green/25" : "text-dark/50 bg-green/7 hover:bg-green/12"}`}
                    >
                        <MessageCircle size={11} /> {user.level?.level || "Class Chat"}
                    </button>
                    {joinedRooms.map((room) => (
                        <button
                            key={room._id}
                            onClick={() => { if (activeTab !== room._id) { setMessages([]); setOnlineUsers([]); setActiveTab(room._id); } }}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === room._id ? "bg-green text-white shadow-sm shadow-green/25" : "text-dark/50 bg-green/7 hover:bg-green/12"}`}
                        >
                            <Users size={11} /> {room.name}
                        </button>
                    ))}
                </div>

                {/* Mobile header */}
                <header className="md:hidden px-4 py-3.5 flex items-center gap-3 border-b border-green/8 bg-white sticky top-0 z-40">
                    <motion.button
                        whileTap={{ scale: 0.93 }}
                        onClick={() => router.back()}
                        className="w-9 h-9 rounded-[12px] bg-green/7 border border-green/12 flex items-center justify-center text-dark/60 hover:bg-green/12 transition-all shrink-0"
                    >
                        <ChevronLeft size={18} />
                    </motion.button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-black text-dark flex items-center gap-2 truncate">
                            {roomName}
                            {isConnecting ? (
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                            ) : (
                                <span className="relative flex w-2 h-2 shrink-0">
                                    <span className="w-2 h-2 rounded-full bg-green" />
                                    <span className="absolute inset-0 rounded-full bg-green animate-ping opacity-60" />
                                </span>
                            )}
                        </h1>
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-dark/35 mt-0.5">{t("class_space")}</p>
                    </div>
                    <div className="text-[10px] font-bold text-dark/35 shrink-0">
                        {!isConnecting && `${onlineUsers.length} online`}
                    </div>
                </header>

                {/* Desktop top bar inside white panel */}
                <div className="hidden md:flex items-center justify-between px-6 py-4 border-b border-green/8">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-[12px] flex items-center justify-center relative overflow-hidden"
                            style={{ background: "linear-gradient(135deg, #f0faf5, #e8f5ee)" }}
                        >
                            <div className="absolute inset-0 opacity-50" style={{ backgroundImage: DOT_TEXTURE, backgroundSize: "14px 14px" }} />
                            <MessageCircle size={16} className="text-green relative z-10" />
                        </div>
                        <div>
                            <span className="font-black text-dark text-sm block">{roomName}</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-dark/35">{t("class_space")}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-dark/40 font-bold">
                        {isConnecting ? (
                            <><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Connecting…</>
                        ) : (
                            <>
                                <span className="relative flex w-2 h-2">
                                    <span className="w-2 h-2 rounded-full bg-green" />
                                    <span className="absolute inset-0 rounded-full bg-green animate-ping opacity-60" />
                                </span>
                                {onlineUsers.length} online
                            </>
                        )}
                    </div>
                </div>

                {/* Desktop room tabs */}
                <div className="hidden md:flex gap-1.5 px-4 py-2.5 border-b border-green/8 overflow-x-auto shrink-0 scrollbar-none">
                    <button
                        onClick={() => { if (activeTab !== "general") { setMessages([]); setOnlineUsers([]); setActiveTab("general"); } }}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === "general" ? "bg-green text-white shadow-sm shadow-green/25" : "text-dark/50 hover:bg-green/7 hover:text-dark/70"}`}
                    >
                        <MessageCircle size={12} />
                        {user.level?.level || "Class Chat"}
                    </button>
                    {joinedRooms.map((room) => (
                        <button
                            key={room._id}
                            onClick={() => { if (activeTab !== room._id) { setMessages([]); setOnlineUsers([]); setActiveTab(room._id); } }}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === room._id ? "bg-green text-white shadow-sm shadow-green/25" : "text-dark/50 hover:bg-green/7 hover:text-dark/70"}`}
                        >
                            <Users size={12} />
                            {room.name}
                        </button>
                    ))}
                </div>

                {/* Messages area */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4"
                    style={{ background: "#fafcfb" }}
                >
                    {messages.length === 0 && !isConnecting ? (
                        <div className="h-full flex flex-col items-center justify-center text-dark/30 space-y-4 pt-20 animate-slide-up">
                            <div
                                className="w-16 h-16 rounded-[18px] flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg, #f0faf5, #e8f5ee)" }}
                            >
                                <MessageCircle size={28} className="text-green/50" />
                            </div>
                            <p className="text-sm font-bold">{t("no_messages_yet")}</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const currentUserId = user.id || (user as { _id?: string })._id;
                            const isMe = msg.sender?._id === currentUserId;
                            const showAvatar = index === 0 || messages[index - 1]?.sender?._id !== msg.sender?._id;

                            const reactionCounts = msg.reactions.reduce((acc, r) => {
                                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                return acc;
                            }, {} as Record<string, number>);

                            const myReactions = msg.reactions.filter((r) => r.userId === currentUserId).map((r) => r.emoji);

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 14, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 280, damping: 22, delay: Math.min(index * 0.04, 0.25) }}
                                    key={msg._id || index}
                                    className={`flex gap-2.5 max-w-[86%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"} ${!showAvatar ? "!mt-0.5" : ""}`}
                                >
                                    {/* Avatar */}
                                    <div className="relative w-8 shrink-0">
                                        {showAvatar && (
                                            <>
                                                <motion.div
                                                    whileHover={{ scale: 1.08 }}
                                                    className="w-8 h-8 rounded-[11px] bg-green/10 ring-2 ring-green/8 flex items-center justify-center overflow-hidden relative shadow-sm"
                                                >
                                                    {(msg.sender?.photoURL || (msg.sender as any)?.avatar) ? (
                                                        <Image src={getPhotoURL(msg.sender?.photoURL || (msg.sender as any)?.avatar) || ""} alt={msg.sender?.displayName || "User"} fill sizes="32px" className="object-cover" />
                                                    ) : (
                                                        <User size={15} className="text-green" />
                                                    )}
                                                </motion.div>
                                                {(msg.sender?.subscription?.plan === "premium" || msg.sender?.subscription?.plan === "pro") && (
                                                    <div className={`absolute -top-1 ${isMe ? "-left-1" : "-right-1"} w-4 h-4 rounded-full bg-amber-400 border-[1.5px] border-white flex items-center justify-center shadow-sm z-10`}>
                                                        <Star size={7} className="text-white fill-current" />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Bubble */}
                                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} min-w-0`}>
                                        {showAvatar && msg.sender && (
                                            <span className="flex items-center gap-1.5 mb-1 mx-1">
                                                <span className="text-[10px] font-black text-dark/35 uppercase tracking-tight">
                                                    {msg.sender.displayName}
                                                </span>
                                                {(() => {
                                                    const r = msg.sender?.role;
                                                    if (!r || r === 'user') return null;
                                                    const isT = r === 'teacher' || r === 'admin';
                                                    const isI = r === 'instructor' || r === 'admin';
                                                    const label = isT && isI ? 'Tea/Ins' : isT ? 'Tea' : 'Ins';
                                                    const cls = isT && isI
                                                        ? 'bg-purple-100 text-purple-600'
                                                        : isT ? 'bg-indigo-100 text-indigo-600'
                                                        : 'bg-green/10 text-green';
                                                    return (
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wide uppercase ${cls}`}>
                                                            {label}
                                                        </span>
                                                    );
                                                })()}
                                            </span>
                                        )}

                                        <div className={`relative group flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                            {/* Reply quote */}
                                            {msg.replyTo && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="mb-1.5 p-2.5 rounded-[14px] text-[11px] overflow-hidden max-w-[260px] flex items-start gap-2.5 bg-white border border-green/15 border-l-4 border-l-green relative z-20 shadow-sm"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-black mb-0.5 flex items-center gap-1 text-green uppercase tracking-tighter text-[10px]">
                                                            <Reply size={9} className="rotate-180" />
                                                            {msg.replyTo?.sender?.displayName || "Unknown"}
                                                        </div>
                                                        <div className="truncate italic text-dark/60 font-semibold">{msg.replyTo.text}</div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            <div className={`px-4 py-3 rounded-[20px] text-sm relative z-10 ${isMe
                                                ? "bg-green text-white rounded-tr-[6px] font-medium shadow-md shadow-green/20"
                                                : "bg-white border border-green/10 text-dark rounded-tl-[6px] shadow-sm"
                                            }`}>
                                                {msg.text}

                                                {msg.replyTo?.sender?._id === currentUserId && !isMe && (
                                                    <motion.div
                                                        initial={{ scale: 0, rotate: -45 }}
                                                        animate={{ scale: 1, rotate: 0 }}
                                                        className="absolute -top-3 -left-3 w-6 h-6 rounded-[10px] bg-amber-400 border-2 border-white flex items-center justify-center text-white shadow-lg z-20"
                                                        style={{ animation: "fanPulse 2s ease-in-out infinite" }}
                                                    >
                                                        <Bell size={10} fill="currentColor" strokeWidth={3} />
                                                    </motion.div>
                                                )}

                                                {msg.replyTo && isMe && (
                                                    <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-white/15 text-[9px] font-black text-white/65 uppercase tracking-tighter">
                                                        <AtSign size={8} strokeWidth={3} />
                                                        Mentioned {msg.replyTo.sender?.displayName || "User"}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Hover actions */}
                                            <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "-left-[4.2rem]" : "-right-[4.2rem]"} opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1 z-20`}>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setActiveReply({ _id: msg._id, text: msg.text, senderName: msg.sender?.displayName || "Unknown" })}
                                                    className="w-8 h-8 rounded-[10px] bg-white border border-green/12 shadow-sm flex items-center justify-center text-dark/40 hover:text-green hover:border-green/25 transition-all"
                                                >
                                                    <Reply size={13} />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setActiveReactionMsg(activeReactionMsg === msg._id ? null : msg._id)}
                                                    className="w-8 h-8 rounded-[10px] bg-white border border-green/12 shadow-sm flex items-center justify-center text-dark/40 hover:text-amber-500 hover:border-amber-200 transition-all"
                                                >
                                                    <Smile size={14} />
                                                </motion.button>
                                                {!isMe && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setReportingMsg(msg)}
                                                        className="w-8 h-8 rounded-[10px] bg-white border border-green/12 shadow-sm flex items-center justify-center text-dark/30 hover:text-red-400 hover:border-red-200 transition-all"
                                                        title={t("report")}
                                                    >
                                                        <Flag size={11} />
                                                    </motion.button>
                                                )}
                                            </div>

                                            {/* Reaction picker */}
                                            <AnimatePresence>
                                                {activeReactionMsg === msg._id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 8, scale: 0.85 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.85 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 24 }}
                                                        className={`absolute bottom-full mb-2.5 ${isMe ? "right-0" : "left-0"} glass-effect shadow-xl rounded-[16px] p-2 flex gap-1 z-30`}
                                                    >
                                                        {EMOJIS.map((emoji) => (
                                                            <motion.button
                                                                key={emoji}
                                                                whileHover={{ scale: 1.22, y: -2 }}
                                                                whileTap={{ scale: 0.9 }}
                                                                onClick={() => handleReaction(msg._id, emoji)}
                                                                className={`w-8 h-8 flex items-center justify-center rounded-[10px] text-lg hover:bg-green/10 transition-colors ${myReactions.includes(emoji) ? "bg-green/15" : ""}`}
                                                            >
                                                                {emoji}
                                                            </motion.button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Reactions */}
                                        {Object.keys(reactionCounts).length > 0 && (
                                            <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                                                {Object.entries(reactionCounts).map(([emoji, count]) => (
                                                    <motion.button
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        whileHover={{ scale: 1.08 }}
                                                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                                        key={emoji}
                                                        onClick={() => handleReaction(msg._id, emoji)}
                                                        className={`px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 border transition-all shadow-sm ${myReactions.includes(emoji)
                                                            ? "bg-green text-white border-green font-bold shadow-green/20"
                                                            : "bg-white border-green/12 text-dark/50 hover:bg-green/5"
                                                        }`}
                                                    >
                                                        <span className="text-sm leading-none">{emoji}</span>
                                                        <span className="font-black">{count}</span>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Timestamp */}
                                        <span className="text-[9px] font-bold text-dark/20 uppercase tracking-widest mt-1 mx-1">
                                            {formatMessageTime(msg.createdAt)}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>

                {/* Input area */}
                <div className="bg-white border-t border-green/8 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+88px)] md:pb-4 relative z-20">
                    <div className="max-w-5xl mx-auto">
                        {/* Typing indicator */}
                        <AnimatePresence>
                            {typingUsers.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute -top-7 left-6 text-[10px] text-green font-bold flex items-center gap-1.5 px-2.5 py-1 bg-green/8 rounded-full border border-green/15"
                                >
                                    <div className="flex gap-0.5">
                                        {[0, 150, 300].map((d) => (
                                            <span key={d} className="w-1 h-1 rounded-full bg-green animate-bounce" style={{ animationDelay: `${d}ms` }} />
                                        ))}
                                    </div>
                                    {typingUsers.length === 1 ? `${typingUsers[0].displayName} is typing…` : "Multiple people typing…"}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Reply banner */}
                        <AnimatePresence>
                            {activeReply && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-green/5 border border-green/15 rounded-t-[18px] px-4 pt-2.5 pb-4 flex items-center justify-between border-b-0"
                                >
                                    <div className="flex items-center gap-2 text-xs text-dark/60 w-full overflow-hidden">
                                        <Reply size={12} className="text-green shrink-0" />
                                        <span className="font-bold shrink-0 text-green">Replying to {activeReply.senderName}:</span>
                                        <span className="truncate text-dark/50">{activeReply.text}</span>
                                    </div>
                                    <button onClick={() => setActiveReply(null)} type="button" className="p-1 hover:bg-green/10 rounded-full transition-colors shrink-0">
                                        <X size={13} className="text-dark/40" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleSendMessage} className="relative flex items-center z-10">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={handleInputChange}
                                placeholder="Message your class…"
                                disabled={isConnecting}
                                className={`w-full bg-green/5 border-[1.5px] border-green/15 focus:border-green focus:bg-white focus:ring-4 focus:ring-green/8 pl-5 pr-14 py-4 outline-none transition-all disabled:opacity-50 font-medium text-dark placeholder:text-dark/35 text-sm ${activeReply ? "rounded-b-[22px] rounded-t-none border-t-0" : "rounded-[22px]"}`}
                            />
                            <motion.button
                                whileHover={{ scale: 1.08, rotate: 3 }}
                                whileTap={{ scale: 0.92 }}
                                type="submit"
                                disabled={!newMessage.trim() || isConnecting}
                                className="absolute right-2 w-10 h-10 rounded-[14px] bg-green text-white flex items-center justify-center hover:bg-green/90 disabled:opacity-40 transition-all shadow-md shadow-green/25"
                            >
                                <Send size={16} className="ml-0.5" />
                            </motion.button>
                        </form>
                    </div>
                </div>
            </div>

            {/* ── Report modal ── */}
            <AnimatePresence>
                {reportingMsg && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setReportingMsg(null)}
                            className="absolute inset-0 bg-dark/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 16 }}
                            transition={{ type: "spring", stiffness: 300, damping: 26 }}
                            className="relative w-full max-w-md bg-white rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12),_0_4px_16px_rgba(0,0,0,0.06)]"
                        >
                            <div className="p-7 space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-[14px] bg-red-50 border border-red-100 flex items-center justify-center">
                                            <ShieldAlert size={20} className="text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-dark">{t("report_msg")}</h3>
                                            <p className="text-[10px] font-bold text-dark/40 uppercase tracking-widest">{t("report")}: {reportingMsg.sender?.displayName || "Unknown"}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setReportingMsg(null)}
                                        className="w-9 h-9 rounded-[11px] bg-green/6 border border-green/12 flex items-center justify-center text-dark/40 hover:bg-green/10 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="p-3.5 rounded-[14px] bg-green/5 border border-green/12 italic text-sm text-dark/60 font-medium">
                                    "{reportingMsg.text}"
                                </div>

                                <form onSubmit={handleReportSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.18em] text-dark/35 ml-0.5">{t("report_reason")}</label>
                                        <select
                                            required
                                            value={reportReason}
                                            onChange={(e) => setReportReason(e.target.value)}
                                            className="w-full px-4 py-3 rounded-[14px] bg-green/5 border-[1.5px] border-green/15 focus:border-green focus:bg-white outline-none transition-all font-bold text-sm text-dark appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Select a reason</option>
                                            <option value="spam">{t("reason_spam")}</option>
                                            <option value="harassment">{t("reason_harassment")}</option>
                                            <option value="inappropriate">{t("reason_inappropriate")}</option>
                                            <option value="other">{t("reason_other")}</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.18em] text-dark/35 ml-0.5">{t("report_details")}</label>
                                        <textarea
                                            required
                                            value={reportDetails}
                                            onChange={(e) => setReportDetails(e.target.value)}
                                            className="w-full px-4 py-3 rounded-[14px] bg-green/5 border-[1.5px] border-green/15 focus:border-green focus:bg-white outline-none transition-all font-medium text-sm text-dark min-h-[100px] resize-none placeholder:text-dark/30"
                                            placeholder="Please provide more context…"
                                        />
                                    </div>

                                    <div className="flex gap-2.5 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setReportingMsg(null)}
                                            className="flex-1 py-3.5 rounded-[14px] bg-green/6 border border-green/12 text-dark/60 font-black uppercase tracking-widest text-[10px] hover:bg-green/10 transition-all"
                                        >
                                            {t("cancel")}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingReport}
                                            className="flex-[2] py-3.5 rounded-[14px] bg-red-500 text-white font-black uppercase tracking-widest text-[10px] hover:bg-red-600 shadow-lg shadow-red-200 transition-all disabled:opacity-50"
                                        >
                                            {isSubmittingReport ? "Submitting…" : t("report_submit")}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
