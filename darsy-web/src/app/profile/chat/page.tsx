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
    Star
} from "lucide-react";
import { useSnackbar } from "@/contexts/SnackbarContext";
import Link from "next/link";

interface Reaction {
    emoji: string;
    userId: string;
}

interface Message {
    _id: string;
    sender: { _id: string; displayName: string; photoURL?: string; subscription?: { plan: string } };
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

export default function ChatPage() {
    const t = useTranslations("Profile");
    const { user, loading, getPhotoURL } = useAuth();
    const router = useRouter();

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

    // Scroll to bottom when messages change
    const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
        if (!scrollContainerRef.current) return;
        const { scrollHeight } = scrollContainerRef.current;
        scrollContainerRef.current.scrollTo({
            top: scrollHeight,
            behavior
        });
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
            await api.post('/chat/report', {
                reportedUserId: reportingMsg?.sender?._id,
                messageId: reportingMsg?._id,
                reason: reportReason,
                details: reportDetails
            });
            showSnackbar(t("report_success"), "success");
            setReportingMsg(null);
            setReportReason("");
            setReportDetails("");
        } catch (err) {
            console.error("Failed to submit report", err);
            showSnackbar(t("report_error"), "error");
        } finally {
            setIsSubmittingReport(false);
        }
    };

    useEffect(() => {
        if (messages.length === 0) return;

        // On initial load, scroll to bottom once without animation
        if (isInitialLoad.current) {
            scrollToBottom("auto");
            isInitialLoad.current = false;
            return;
        }

        const lastMessage = messages[messages.length - 1];
        const currentUserId = user?.id || (user as { _id?: string })?._id;
        const isMe = lastMessage?.sender?._id === currentUserId;

        if (isMe || isNearBottom) {
            scrollToBottom("smooth");
        }
    }, [messages.length]); // Only trigger when a NEW message is added

    useEffect(() => {
        if (loading || !isProfileComplete) return;

        if (!user) {
            router.push("/login");
            return;
        }

        const guidance = user.level?.guidance;
        const level = user.level?.level;

        if (!guidance || !level) {
            // Can't chat without a track
            return;
        }

        // 1. Fetch historical messages
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/chat/history?guidance=${encodeURIComponent(guidance)}&level=${encodeURIComponent(level)}`);
                setMessages(res.data);
            } catch (err) {
                console.error("Failed to fetch chat history", err);
            }
        };
        fetchHistory();

        // 2. Connect to Socket.IO
        // Use the same base URL as API but without /api
        const baseURL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
        const socket = io(baseURL, {
            withCredentials: true
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setIsConnecting(false);
            console.log("Connected to chat server");
            // Join specific room with user details
            socket.emit("join_room", {
                guidance,
                level,
                userId: user.id || (user as { _id?: string })._id,
                displayName: user.displayName,
                photoURL: user.photoURL,
                subscriptionPlan: user.subscription?.plan
            });
        });

        socket.on("room_users", (users: { userId: string; displayName: string; photoURL?: string; subscriptionPlan?: string }[]) => {
            setOnlineUsers(users);
        });

        socket.on("room_participants", (participants: Participant[]) => {
            setAllParticipants(participants);
        });

        socket.on("receive_message", (message: Message) => {
            setMessages(prev => [...prev, message]);
        });

        socket.on("message_updated", (updatedMessage: Message) => {
            setMessages(prev => prev.map(msg =>
                msg._id === updatedMessage._id ? updatedMessage : msg
            ));
        });

        socket.on("user_typing", (data: { userId: string; displayName: string }) => {
            setTypingUsers(prev => {
                if (prev.find(u => u.userId === data.userId)) return prev;
                return [...prev, data];
            });
        });

        socket.on("user_stopped_typing", (data: { userId: string }) => {
            setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
        });

        socket.on("disconnect", () => {
            setIsConnecting(true);
            console.log("Disconnected from chat server");
        });

        return () => {
            socket.disconnect();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [user, loading, router]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || !user || !socketRef.current) return;

        socketRef.current.emit("send_message", {
            guidance: user.level?.guidance,
            level: user.level?.level,
            sender: user.id || (user as { _id?: string })._id,
            text: newMessage.trim(),
            replyTo: activeReply?._id
        });

        // Clear typing indicator
        socketRef.current.emit("typing_end", {
            guidance: user.level?.guidance,
            level: user.level?.level,
            userId: user.id || (user as { _id?: string })._id
        });

        setNewMessage("");
        setActiveReply(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (!user || !socketRef.current) return;

        socketRef.current.emit("typing_start", {
            guidance: user.level?.guidance,
            level: user.level?.level,
            userId: user.id || (user as { _id?: string })._id,
            displayName: user.displayName
        });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socketRef.current?.emit("typing_end", {
                guidance: user.level?.guidance,
                level: user.level?.level,
                userId: user.id || (user as { _id?: string })._id
            });
        }, 2000);
    };

    // Lock body scroll when chat is active
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleReaction = (messageId: string, emoji: string) => {
        if (!user || !socketRef.current) return;

        const currentUserId = user.id || (user as { _id?: string })._id;
        const msg = messages.find(m => m._id === messageId);

        // Find existing reaction from this user to replace it
        const existingEmoji = msg?.reactions?.find(r => r.userId === currentUserId)?.emoji;

        // If clicking the SAME emoji, it toggles off.
        // If clicking a DIFFERENT emoji, we replace it.
        if (existingEmoji) {
            socketRef.current.emit("reaction", {
                messageId,
                emoji: existingEmoji,
                userId: currentUserId,
                guidance: user.level?.guidance,
                level: user.level?.level
            });

            if (existingEmoji === emoji) {
                setActiveReactionMsg(null);
                return;
            }
        }

        socketRef.current.emit("reaction", {
            messageId,
            emoji,
            userId: currentUserId,
            guidance: user.level?.guidance,
            level: user.level?.level
        });

        setActiveReactionMsg(null);
    };

    const formatMessageTime = (dateString: string): string => {
        const date = new Date(dateString);
        // Use full format if older than 24h, else just time
        // eslint-disable-next-line react-hooks/purity
        return Date.now() - date.getTime() > 86400000
            ? format(date, "MMM d, h:mm a")
            : format(date, "h:mm a");
    };

    if (!user || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-green border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isProfileComplete) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white rounded-[40px] border border-green/10 p-10 shadow-2xl shadow-green/5 space-y-8"
                >
                    <div className="w-24 h-24 bg-green/10 rounded-[2rem] flex items-center justify-center mx-auto text-green">
                        <ShieldAlert size={48} />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold text-dark">{t("chat_blocked_title")}</h1>
                        <p className="text-muted-foreground leading-relaxed">
                            {t("chat_blocked_desc")}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/onboarding"
                            className="w-full py-4 bg-green text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-green/20 transition-all font-bold"
                        >
                            {t("complete_profile_btn")}
                        </Link>
                        <Link
                            href="/profile"
                            className="w-full py-4 bg-white border border-green/10 text-dark/60 font-bold rounded-2xl hover:bg-green/5 transition-all outline-none"
                        >
                            {t("back_to_profile_btn")}
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    const roomName = user.level?.level || "Class Chat";

    return (
        <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-hidden relative">
            {/* Background Decorative Mesh */}
            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green/20 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-green/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Header */}
            <header className="glass-effect px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm border-b border-white/40">
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm group"
                    >
                        <ChevronLeft size={20} className="text-dark group-hover:text-green transition-colors" />
                    </motion.button>
                    <div>
                        <h1 className="text-xl font-black text-dark tracking-tight flex items-center gap-2">
                            {roomName}
                            <div className="flex items-center">
                                {isConnecting ? (
                                    <span className="flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                ) : (
                                    <div className="relative flex">
                                        <span className="flex h-2 w-2 rounded-full bg-green"></span>
                                        <span className="absolute h-2 w-2 rounded-full bg-green animate-ping opacity-75"></span>
                                    </div>
                                )}
                            </div>
                        </h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1 opacity-70">
                            <MessageCircle size={10} strokeWidth={3} /> {t("class_space")}
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Layout containing Chat and Sidebar */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* Left Column (Chat + Input) */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Chat Area */}
                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto p-6 space-y-6"
                    >
                        {messages.length === 0 && !isConnecting ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 pt-20">
                                <MessageCircle size={48} className="text-gray-300" />
                                <p>{t("no_messages_yet")}</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => {
                                const currentUserId = user.id || (user as { _id?: string })._id;
                                const isMe = msg.sender?._id === currentUserId;
                                const showAvatar = !isMe && (index === 0 || messages[index - 1]?.sender?._id !== msg.sender?._id);

                                // Group reactions by emoji
                                const reactionCounts = msg.reactions.reduce((acc, r) => {
                                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>);

                                const myReactions = msg.reactions.filter(r => r.userId === currentUserId).map(r => r.emoji);

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 260,
                                            damping: 20,
                                            delay: Math.min(index * 0.05, 0.3) // Stagger only for first few
                                        }}
                                        key={msg._id || index}
                                        className={`flex gap-3 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                                    >
                                        {/* Avatar */}
                                        <div className="relative">
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                className={`w-9 h-9 rounded-2xl flex-shrink-0 ${showAvatar ? 'bg-green/10 ring-4 ring-green/5' : 'bg-transparent'} flex items-center justify-center overflow-hidden relative shadow-sm transition-all`}
                                            >
                                                {showAvatar && (msg.sender?.photoURL || (msg.sender as any)?.avatar) ? (
                                                    <Image src={getPhotoURL(msg.sender?.photoURL || (msg.sender as any)?.avatar) || ''} alt={msg.sender?.displayName || 'User'} fill sizes="36px" className="object-cover" />
                                                ) : showAvatar ? (
                                                    <User size={18} className="text-green" />
                                                ) : null}
                                            </motion.div>
                                            {showAvatar && (msg.sender?.subscription?.plan === 'premium' || msg.sender?.subscription?.plan === 'pro') && (
                                                <div className={`absolute -top-1 ${isMe ? '-left-1' : '-right-1'} w-4 h-4 rounded-full bg-amber-400 border-[1.5px] border-white flex items-center justify-center shadow-sm z-10`} title="Premium">
                                                    <Star size={8} className="text-white fill-current" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} min-w-0`}>
                                            {msg.sender && (
                                                <span className="text-[11px] font-black text-dark/40 mb-1 ml-1 uppercase tracking-tight">
                                                    {msg.sender.displayName}
                                                </span>
                                            )}

                                            <div className={`relative group flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                                {/* Reply Quote Block (Modern White Card Design) */}
                                                {msg.replyTo && (
                                                    <motion.div
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="mb-2 p-3 rounded-2xl text-[11px] overflow-hidden max-w-[280px] flex items-start gap-3 shadow-md bg-white border border-gray-100 border-l-4 border-l-green relative z-20"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-black mb-1 flex items-center gap-1.5 text-green uppercase tracking-tighter text-[10px]">
                                                                <Reply size={10} className="rotate-180" />
                                                                {msg.replyTo?.sender?.displayName || "Unknown user"}
                                                            </div>
                                                            <div className="truncate italic text-dark/70 font-semibold">{msg.replyTo.text}</div>
                                                        </div>
                                                    </motion.div>
                                                )}

                                                <div className={`px-5 py-3.5 rounded-[22px] text-sm relative z-10 shadow-lg shadow-black/[0.03] ${isMe
                                                    ? "bg-green text-white rounded-tr-sm font-medium"
                                                    : "bg-white border border-gray-100 text-dark rounded-tl-sm shadow-sm"
                                                    }`}>
                                                    {msg.text}

                                                    {/* Mention Notification (Receiver View) */}
                                                    {msg.replyTo?.sender?._id === currentUserId && !isMe && (
                                                        <motion.div
                                                            initial={{ scale: 0, rotate: -45 }}
                                                            animate={{ scale: 1, rotate: 0 }}
                                                            className="absolute -top-3 -left-3 w-7 h-7 rounded-2xl bg-yellow-400 border-4 border-white flex items-center justify-center text-white shadow-lg z-20"
                                                            style={{ animation: 'fanPulse 2s ease-in-out infinite' }}
                                                        >
                                                            <Bell size={12} fill="currentColor" strokeWidth={3} />
                                                        </motion.div>
                                                    )}

                                                    {/* Mention Confirmation (Sender View) */}
                                                    {msg.replyTo && isMe && (
                                                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/10 text-[10px] font-black text-white/70 uppercase tracking-tighter">
                                                            <AtSign size={10} strokeWidth={3} />
                                                            Mentioned {msg.replyTo.sender?.displayName || "User"}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Hover Actions (Premium Rounded buttons) */}
                                                <div className={`absolute top-1/2 -translate-y-1/2 ${isMe ? "-left-[4.8rem]" : "-right-[4.8rem]"} opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-1.5 z-20`}>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, rotate: -5 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setActiveReply({ _id: msg._id, text: msg.text, senderName: msg.sender?.displayName || "Unknown" })}
                                                        className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur shadow-xl shadow-black/5 flex items-center justify-center text-gray-500 hover:text-green hover:bg-white transition-all border border-gray-100"
                                                    >
                                                        <Reply size={16} />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => setActiveReactionMsg(activeReactionMsg === msg._id ? null : msg._id)}
                                                        className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur shadow-xl shadow-black/5 flex items-center justify-center text-gray-500 hover:text-yellow-500 hover:bg-white transition-all border border-gray-100"
                                                    >
                                                        <Smile size={18} />
                                                    </motion.button>
                                                    {!isMe && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => setReportingMsg(msg)}
                                                            className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur shadow-xl shadow-black/5 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all border border-gray-100"
                                                            title={t("report")}
                                                        >
                                                            <Flag size={14} />
                                                        </motion.button>
                                                    )}
                                                </div>

                                                {/* Reaction Picker Popup (Glassmorphic) */}
                                                <AnimatePresence>
                                                    {activeReactionMsg === msg._id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.8 }}
                                                            transition={{ type: "spring", stiffness: 600, damping: 25 }}
                                                            className={`absolute bottom-full mb-3 ${isMe ? "right-0" : "left-0"} glass-effect shadow-2xl rounded-2xl p-2.5 flex gap-1.5 z-30`}
                                                        >
                                                            {EMOJIS.map(emoji => (
                                                                <motion.button
                                                                    key={emoji}
                                                                    whileHover={{ scale: 1.25, rotate: 10 }}
                                                                    whileTap={{ scale: 0.9 }}
                                                                    onClick={() => handleReaction(msg._id, emoji)}
                                                                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-xl hover:bg-green/10 transition-colors ${myReactions.includes(emoji) ? 'bg-green/20' : ''}`}
                                                                >
                                                                    {emoji}
                                                                </motion.button>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            {/* Existing Reactions */}
                                            {Object.keys(reactionCounts).length > 0 && (
                                                <div className={`flex flex-wrap gap-1 mt-1.5 ${isMe ? "justify-end" : "justify-start"}`}>
                                                    {Object.entries(reactionCounts).map(([emoji, count]) => (
                                                        <motion.button
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            whileHover={{ scale: 1.1 }}
                                                            transition={{ type: "spring", stiffness: 600, damping: 20 }}
                                                            key={emoji}
                                                            onClick={() => handleReaction(msg._id, emoji)}
                                                            className={`px-2.5 py-1 rounded-2xl text-[11px] flex items-center gap-1.5 border backdrop-blur-sm transition-all shadow-sm ${myReactions.includes(emoji)
                                                                ? "bg-green text-white border-green font-bold shadow-green/20"
                                                                : "bg-white/80 border-gray-100 text-muted-foreground hover:bg-white"
                                                                }`}
                                                        >
                                                            <span className="text-base leading-none">{emoji}</span>
                                                            <span className="font-black opacity-80">{count}</span>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Timestamp (Elegant typography) */}
                                            <span className="text-[9px] font-bold text-dark/20 uppercase tracking-widest mt-1.5 mx-2">
                                                {formatMessageTime(msg.createdAt)}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="bg-white border-t border-gray-100 p-4 relative z-20">
                        <div className="max-w-5xl mx-auto">
                            {/* Typing Indicator */}
                            <AnimatePresence>
                                {typingUsers.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="absolute -top-6 left-6 text-[11px] text-green/80 flex items-center gap-1.5 font-medium px-2 py-1 bg-green/5 rounded-t-lg"
                                    >
                                        <div className="flex gap-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green/70 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-green/70 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-green/70 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                                        </div>
                                        {typingUsers.length === 1
                                            ? `${typingUsers[0].displayName} is typing...`
                                            : "Multiple people are typing..."}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Active Reply Banner */}
                            <AnimatePresence>
                                {activeReply && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-gray-50 border border-gray-200 rounded-t-2xl px-4 pt-2 pb-4 flex items-start justify-between relative z-0 border-b-0"
                                    >
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground w-full overflow-hidden">
                                            <Reply size={14} className="text-green flex-shrink-0" />
                                            <span className="font-bold flex-shrink-0">Replying to {activeReply.senderName}:</span>
                                            <span className="truncate">{activeReply.text}</span>
                                        </div>
                                        <button
                                            onClick={() => setActiveReply(null)}
                                            type="button"
                                            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                                        >
                                            <X size={14} className="text-gray-500" />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form
                                onSubmit={handleSendMessage}
                                className="relative flex items-center z-10"
                            >
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={handleInputChange}
                                    placeholder="Message your class..."
                                    disabled={isConnecting}
                                    className={`w-full bg-gray-50 border border-gray-200 focus:border-green focus:bg-white focus:ring-4 focus:ring-green/5 pl-6 pr-14 py-4.5 outline-none transition-all disabled:opacity-50 font-medium ${activeReply ? 'rounded-b-[28px] rounded-t-none shadow-sm border-t-0' : 'rounded-[30px] shadow-sm'}`}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    type="submit"
                                    disabled={!newMessage.trim() || isConnecting}
                                    className="absolute right-2.5 w-11 h-11 rounded-2xl bg-green text-white flex items-center justify-center hover:bg-green/90 disabled:opacity-50 disabled:hover:bg-green transition-all shadow-lg shadow-green/20"
                                >
                                    <Send size={20} className="ml-0.5" />
                                </motion.button>
                            </form>
                        </div>
                    </div>
                </div> {/* End Left Column */}

                {/* Right Sidebar: Online Users (Refined Glassmorphism) */}
                <div className="w-80 bg-white/40 backdrop-blur-xl border-l border-white/60 hidden md:flex flex-col relative z-30">
                    <div className="p-6 border-b border-white/40">
                        <h3 className="font-black flex items-center justify-between text-xs uppercase tracking-widest text-dark/60">
                            <span>Online Classmates</span>
                            <span className="bg-green text-white px-3 py-1 rounded-full text-[10px] shadow-lg shadow-green/20">
                                {onlineUsers.length}
                            </span>
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-8">
                        {/* Online Section */}
                        <div className="space-y-4">
                            <AnimatePresence>
                                {onlineUsers.map((ou) => (
                                    <motion.div
                                        key={ou.userId}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        whileHover={{ x: 5 }}
                                        className="flex items-center gap-4 group cursor-pointer"
                                    >
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-[18px] bg-white flex-shrink-0 flex items-center justify-center relative border border-gray-100 overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                                                {ou.photoURL ? (
                                                    <Image src={getPhotoURL(ou.photoURL) || ''} alt={ou.displayName} fill sizes="48px" className="object-cover" />
                                                ) : (
                                                    <User size={20} className="text-gray-400" />
                                                )}
                                                {/* Online Indicator Badge */}
                                                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green rounded-full border-[3px] border-white shadow-sm"></div>
                                            </div>
                                            {/* Premium Badge */}
                                            {(ou.subscriptionPlan === 'premium' || ou.subscriptionPlan === 'pro') && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-sm z-10" title="Premium">
                                                    <Star size={10} className="text-white fill-current" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate text-[14px] font-black text-dark group-hover:text-green transition-colors">
                                                {ou.displayName}
                                            </div>
                                            <div className="text-[10px] text-green/70 font-black uppercase tracking-widest">Active</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Offline Section */}
                        {allParticipants.filter(p => !onlineUsers.some(ou => ou.userId === p._id)).length > 0 && (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-dark/30 pl-1">Offline</h4>
                                <AnimatePresence>
                                    {allParticipants
                                        .filter(p => p && !onlineUsers.some(ou => ou.userId === p._id))
                                        .map((p) => (
                                            <motion.div
                                                key={p._id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                whileHover={{ x: 5 }}
                                                className="flex items-center gap-4 group cursor-pointer grayscale-[0.25] hover:grayscale-0 transition-all bg-white/10 hover:bg-white/30 rounded-2xl p-2 -m-2"
                                            >
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-[14px] bg-gray-100 flex-shrink-0 flex items-center justify-center relative border border-gray-200 overflow-hidden shadow-none group-hover:shadow-sm transition-all text-dark">
                                                        {p.photoURL ? (
                                                            <Image src={getPhotoURL(p.photoURL) || ''} alt={p.displayName} fill sizes="40px" className="object-cover opacity-80 group-hover:opacity-100" />
                                                        ) : (
                                                            <User size={16} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    {/* Premium Badge */}
                                                    {(p.subscription?.plan === 'premium' || p.subscription?.plan === 'pro') && (
                                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 border-[1.5px] border-white flex items-center justify-center shadow-sm z-10" title="Premium">
                                                            <Star size={8} className="text-white fill-current" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="truncate text-[13px] font-black text-dark/70 group-hover:text-dark transition-colors">
                                                        {p.displayName}
                                                    </div>
                                                    <div className="text-[9px] text-dark/40 font-black uppercase tracking-widest">Away</div>
                                                </div>
                                            </motion.div>
                                        ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div> {/* End Right Sidebar */}
            </div> {/* End Main Layout Wrapper */}

            {/* Reporting Modal */}
            <AnimatePresence>
                {reportingMsg && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setReportingMsg(null)}
                            className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[32px] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
                                            <ShieldAlert size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-dark">{t("report_msg")}</h3>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("report")}: {reportingMsg.sender?.displayName || "Unknown"}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setReportingMsg(null)}
                                        className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 italic text-sm text-dark/70">
                                    "{reportingMsg.text}"
                                </div>

                                <form onSubmit={handleReportSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-dark/40 ml-1">{t("report_reason")}</label>
                                        <select
                                            required
                                            value={reportReason}
                                            onChange={e => setReportReason(e.target.value)}
                                            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-green focus:bg-white outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Select a reason</option>
                                            <option value="spam">{t("reason_spam")}</option>
                                            <option value="harassment">{t("reason_harassment")}</option>
                                            <option value="inappropriate">{t("reason_inappropriate")}</option>
                                            <option value="other">{t("reason_other")}</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-dark/40 ml-1">{t("report_details")}</label>
                                        <textarea
                                            required
                                            value={reportDetails}
                                            onChange={e => setReportDetails(e.target.value)}
                                            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 focus:border-green focus:bg-white outline-none transition-all font-medium text-sm min-h-[120px] resize-none"
                                            placeholder="Please provide more context..."
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setReportingMsg(null)}
                                            className="flex-1 py-4 rounded-2xl bg-gray-50 text-dark font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all"
                                        >
                                            {t("cancel")}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmittingReport}
                                            className="flex-[2] py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-xs hover:bg-red-600 shadow-lg shadow-red-200 transition-all disabled:opacity-50"
                                        >
                                            {isSubmittingReport ? "Submitting..." : t("report_submit")}
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
