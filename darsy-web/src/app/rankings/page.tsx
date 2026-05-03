"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Trophy, Medal, Crown, User, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface RankedUser {
    rank: number;
    displayName: string;
    photoURL: string | null;
    points: number;
    plan: "free" | "pro" | "premium";
    guidance: string | null;
    level: string | null;
}

const DARK_STRIPE = `repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 2px,transparent 2px,transparent 8px),linear-gradient(135deg,#1e7a46 0%,#0f4428 100%)`;
const DOT_TEXTURE = { backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)", backgroundSize: "18px 18px", opacity: 0.35 };

function PlanBadge({ plan }: { plan: string }) {
    if (plan === "premium") return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase bg-amber-400 text-white shrink-0">
            <Star size={7} className="fill-white" /> Prem
        </span>
    );
    if (plan === "pro") return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase bg-green text-white shrink-0">
            <Star size={7} className="fill-white" /> Pro
        </span>
    );
    return null;
}

function RankIcon({ rank }: { rank: number }) {
    if (rank === 1) return <Crown size={18} className="text-amber-400 fill-amber-400" />;
    if (rank === 2) return <Trophy size={16} className="text-slate-400 fill-slate-300" />;
    if (rank === 3) return <Medal size={16} className="text-amber-600 fill-amber-500" />;
    return <span className="text-xs font-black text-dark/40 tabular-nums w-4 text-center">{rank}</span>;
}

export default function RankingsPage() {
    const { user, getPhotoURL } = useAuth();
    const [rankings, setRankings] = useState<RankedUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/user/rankings")
            .then(r => setRankings(r.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const myRank = user ? rankings.find(r => r.displayName === user.displayName) : null;
    const top3 = rankings.slice(0, 3);
    const rest = rankings.slice(3);

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-24 md:pb-0 pt-16 md:pt-28">
            <div className="max-w-2xl mx-auto px-4 md:px-6 space-y-6">

                {/* Back */}
                <Link href="/profile" className="btn-back inline-flex">
                    <ArrowLeft size={14} className="btn-back-arrow" />
                    Back to Profile
                </Link>

                {/* Hero header */}
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="relative overflow-hidden rounded-[28px] p-6 md:p-8"
                    style={{ background: DARK_STRIPE }}
                >
                    <div className="absolute inset-0 pointer-events-none" style={DOT_TEXTURE} />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[16px] bg-white/15 flex items-center justify-center shrink-0 border border-white/15">
                            <Trophy size={26} className="text-amber-300 fill-amber-300/30" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center gap-1.5">
                                <Sparkles size={9} /> Monthly Leaderboard
                            </span>
                            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">Top Students</h1>
                            <p className="text-white/50 text-xs font-medium mt-0.5">Ranked by total points earned</p>
                        </div>
                    </div>

                    {/* My rank chip */}
                    {myRank && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="relative z-10 mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/12 border border-white/18 text-white text-xs font-bold"
                        >
                            <span className="text-white/60">Your rank:</span>
                            <span className="text-white font-black">#{myRank.rank}</span>
                            <span className="text-white/60">·</span>
                            <span className="text-amber-300 font-black">{myRank.points.toLocaleString()} pts</span>
                        </motion.div>
                    )}
                </motion.div>

                {loading ? (
                    <div className="space-y-3">
                        {Array(8).fill(0).map((_, i) => (
                            <div key={i} className="h-16 rounded-[18px] bg-white border border-green/10 animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                        ))}
                    </div>
                ) : rankings.length === 0 ? (
                    <div className="text-center py-16 text-dark/30">
                        <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold">No rankings yet</p>
                        <p className="text-sm mt-1">Start learning to earn points!</p>
                    </div>
                ) : (
                    <>
                        {/* Podium — top 3 */}
                        {top3.length >= 3 && (
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="grid grid-cols-3 gap-2 items-end"
                            >
                                {/* 2nd */}
                                <PodiumCard user={top3[1]} getPhotoURL={getPhotoURL} height="h-28" delay={0.15} />
                                {/* 1st */}
                                <PodiumCard user={top3[0]} getPhotoURL={getPhotoURL} height="h-36" delay={0.05} isFirst />
                                {/* 3rd */}
                                <PodiumCard user={top3[2]} getPhotoURL={getPhotoURL} height="h-24" delay={0.25} />
                            </motion.div>
                        )}

                        {/* Rest of the list */}
                        <div className="space-y-2">
                            <AnimatePresence>
                                {rest.map((rankedUser, idx) => {
                                    const isMe = user?.displayName === rankedUser.displayName;
                                    return (
                                        <motion.div
                                            key={rankedUser.rank}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.05 + idx * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            className={`flex items-center gap-3.5 p-3.5 rounded-[18px] border transition-all ${isMe ? "bg-green/5 border-green/25 shadow-md shadow-green/8" : "bg-white border-green/10 hover:border-green/25 hover:shadow-md hover:shadow-green/5"}`}
                                        >
                                            {/* Rank */}
                                            <div className="w-8 flex items-center justify-center shrink-0">
                                                <RankIcon rank={rankedUser.rank} />
                                            </div>

                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-[12px] bg-green/10 overflow-hidden flex items-center justify-center shrink-0 relative">
                                                {rankedUser.photoURL ? (
                                                    <Image
                                                        src={getPhotoURL(rankedUser.photoURL) || ""}
                                                        alt={rankedUser.displayName}
                                                        fill
                                                        sizes="40px"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <User size={18} className="text-green/50" />
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`text-sm font-black truncate ${isMe ? "text-green" : "text-dark"}`}>
                                                        {rankedUser.displayName}
                                                        {isMe && " (You)"}
                                                    </span>
                                                    <PlanBadge plan={rankedUser.plan} />
                                                </div>
                                                {rankedUser.guidance && (
                                                    <p className="text-[11px] font-medium truncate" style={{ color: "rgba(26,58,42,0.4)" }}>
                                                        {rankedUser.guidance}{rankedUser.level ? ` · ${rankedUser.level}` : ""}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Points */}
                                            <div className="text-right shrink-0">
                                                <p className={`text-sm font-black tabular-nums ${isMe ? "text-green" : "text-dark"}`}>
                                                    {rankedUser.points.toLocaleString()}
                                                </p>
                                                <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(26,58,42,0.3)" }}>pts</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function PodiumCard({
    user, getPhotoURL, height, delay, isFirst
}: {
    user: RankedUser;
    getPhotoURL: (url?: string) => string | null;
    height: string;
    delay: number;
    isFirst?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2"
        >
            {/* Crown for #1 */}
            {isFirst && (
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: delay + 0.2, type: "spring", stiffness: 300 }}
                >
                    <Crown size={22} className="text-amber-400 fill-amber-400" />
                </motion.div>
            )}

            {/* Avatar */}
            <div className={`relative rounded-[18px] overflow-hidden border-2 shrink-0 ${isFirst ? "w-16 h-16 border-amber-400 shadow-lg shadow-amber-200" : "w-12 h-12 border-green/20"}`}>
                {user.photoURL ? (
                    <Image src={getPhotoURL(user.photoURL) || ""} alt={user.displayName} fill sizes="64px" className="object-cover" />
                ) : (
                    <div className="w-full h-full bg-green/10 flex items-center justify-center">
                        <User size={isFirst ? 28 : 20} className="text-green/50" />
                    </div>
                )}
            </div>

            {/* Name */}
            <p className="text-xs font-black text-dark text-center line-clamp-1 px-1">{user.displayName}</p>
            <p className="text-[11px] font-black text-green tabular-nums">{user.points.toLocaleString()} pts</p>

            {/* Podium base */}
            <div className={`w-full ${height} rounded-t-[14px] flex items-center justify-center ${isFirst ? "bg-amber-400" : user.rank === 2 ? "bg-slate-300" : "bg-amber-600/70"}`}>
                <span className="text-white font-black text-2xl">{user.rank}</span>
            </div>
        </motion.div>
    );
}
