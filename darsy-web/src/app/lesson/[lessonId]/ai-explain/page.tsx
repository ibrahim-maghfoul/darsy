"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, BotMessageSquare, RefreshCw, Send, Star, Globe, Loader2, ChevronDown } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const DARK_STRIPE = `repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 2px,transparent 2px,transparent 8px),linear-gradient(135deg,#1e7a46 0%,#0f4428 100%)`;
const DOT_TEXTURE = { backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)", backgroundSize: "18px 18px", opacity: 0.35 };

const LANGS = [
    { code: "fr" as const, label: "Français", flag: "🇫🇷" },
    { code: "ar" as const, label: "العربية", flag: "🇲🇦", rtl: true },
    { code: "en" as const, label: "English", flag: "🌐" },
];

type Lang = "fr" | "ar" | "en";

interface QAMessage {
    role: "user" | "ai";
    text: string;
}

/** Simple markdown → JSX without react-markdown dependency */
function renderMarkdown(text: string, isRTL: boolean) {
    return text.split("\n").map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        if (line.startsWith("**") && line.endsWith("**"))
            return <p key={i} className="font-black text-dark text-sm mt-3 mb-1">{line.replace(/\*\*/g, "")}</p>;
        if (/^\d+\.\s\*\*/.test(line))
            return <p key={i} className="font-black text-dark text-sm mt-3 mb-1">{line.replace(/\*\*/g, "")}</p>;
        if (line.startsWith("- ") || line.startsWith("• "))
            return <p key={i} className={`text-sm text-dark/80 leading-relaxed ${isRTL ? "mr-4" : "ml-4"}`}>• {line.slice(2)}</p>;
        // inline bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
            <p key={i} className="text-sm text-dark/80 leading-relaxed">
                {parts.map((p, j) =>
                    p.startsWith("**") ? <strong key={j} className="font-bold text-dark">{p.replace(/\*\*/g, "")}</strong> : p
                )}
            </p>
        );
    });
}

export default function AiExplainPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    const lessonId = params.lessonId as string;
    const docId = searchParams.get("docId") || "";
    const documentTitle = searchParams.get("title") || "Document";
    const documentUrl = searchParams.get("url") || "";
    const lessonTitle = searchParams.get("lessonTitle") || "";

    const [lang, setLang] = useState<Lang>("fr");
    const [langOpen, setLangOpen] = useState(false);
    const [explanation, setExplanation] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [regenLoading, setRegenLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userRating, setUserRating] = useState(0);
    const [avgRating, setAvgRating] = useState(0);
    const [ratingCount, setRatingCount] = useState(0);
    const [ratingLoading, setRatingLoading] = useState(false);
    const [qaMessages, setQaMessages] = useState<QAMessage[]>([]);
    const [qaInput, setQaInput] = useState("");
    const [qaLoading, setQaLoading] = useState(false);
    const qaBottomRef = useRef<HTMLDivElement>(null);
    const effectiveDocId = docId || (typeof btoa !== "undefined" ? btoa(encodeURIComponent(documentUrl)) : encodeURIComponent(documentUrl));
    // suppress lessonId unused warning
    void lessonId;

    const fetchExplanation = useCallback(async (language: Lang, force = false) => {
        if (!user) { setError("Please log in to use AI explanations."); return; }
        setLoading(true);
        setError(null);
        try {
            const res = await api.post("/ai/explain", {
                docId: effectiveDocId,
                documentTitle,
                lessonTitle,
                documentUrl,
                language,
                forceRegenerate: force,
            });
            setExplanation(res.data.answer);
            setAvgRating(res.data.avgRating || 0);
            setRatingCount(res.data.ratingCount || 0);
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to generate explanation. Please try again.");
        } finally {
            setLoading(false);
            setRegenLoading(false);
        }
    }, [effectiveDocId, documentTitle, lessonTitle, documentUrl, user]);

    useEffect(() => {
        fetchExplanation(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLangChange = (newLang: Lang) => {
        setLang(newLang);
        setLangOpen(false);
        setExplanation(null);
        setQaMessages([]);
        fetchExplanation(newLang);
    };

    const handleRegenerate = () => {
        setRegenLoading(true);
        setExplanation(null);
        fetchExplanation(lang, true);
    };

    const handleRate = async (rating: number) => {
        if (!user || ratingLoading) return;
        setRatingLoading(true);
        setUserRating(rating);
        try {
            const res = await api.post(`/ai/rate/${encodeURIComponent(effectiveDocId)}`, { rating, language: lang });
            setAvgRating(res.data.avgRating);
            setRatingCount(res.data.ratingCount);
        } catch { setUserRating(0); }
        finally { setRatingLoading(false); }
    };

    const handleAsk = async () => {
        if (!user || !qaInput.trim() || qaLoading) return;
        const q = qaInput.trim();
        setQaInput("");
        setQaMessages(prev => [...prev, { role: "user", text: q }]);
        setQaLoading(true);
        setTimeout(() => qaBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        try {
            const res = await api.post("/ai/ask", {
                docId: effectiveDocId,
                documentTitle,
                lessonTitle,
                documentUrl,
                question: q,
                language: lang,
            });
            setQaMessages(prev => [...prev, { role: "ai", text: res.data.answer }]);
        } catch (err: any) {
            setQaMessages(prev => [...prev, { role: "ai", text: err?.response?.data?.error || "Failed to get answer." }]);
        } finally {
            setQaLoading(false);
            setTimeout(() => qaBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
    };

    const activeLang = LANGS.find(l => l.code === lang) || LANGS[0];
    const isRTL = lang === "ar";

    return (
        <div className="min-h-screen bg-[#F8F9FA] pb-8">
            {/* Hero header */}
            <div className="relative overflow-hidden" style={{ background: DARK_STRIPE }}>
                <div className="absolute inset-0 pointer-events-none" style={DOT_TEXTURE} />
                <div className="relative z-10 px-4 pt-12 pb-6 max-w-2xl mx-auto">
                    <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-white/60 text-sm font-bold mb-4 hover:text-white transition-colors">
                        <ArrowLeft size={14} /> Back
                    </button>
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-[14px] bg-white/15 border border-white/15 flex items-center justify-center shrink-0">
                            <BotMessageSquare size={22} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">AI Explanation</p>
                            <h1 className="text-white font-black text-lg leading-tight line-clamp-2">{documentTitle}</h1>
                            {lessonTitle && <p className="text-white/40 text-xs mt-0.5 truncate">{lessonTitle}</p>}
                        </div>
                    </div>

                    {/* Language selector */}
                    <div className="mt-5 relative" dir="ltr">
                        <button
                            onClick={() => setLangOpen(o => !o)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/12 border border-white/18 text-white text-xs font-bold hover:bg-white/18 transition-all"
                        >
                            <Globe size={12} />
                            <span>{activeLang.flag} {activeLang.label}</span>
                            <ChevronDown size={11} className={`transition-transform ${langOpen ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                            {langOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute top-full mt-2 left-0 bg-white rounded-2xl shadow-xl border border-green/10 p-1 z-50 min-w-[150px]"
                                >
                                    {LANGS.map(l => (
                                        <button
                                            key={l.code}
                                            onClick={() => handleLangChange(l.code)}
                                            className={`flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${lang === l.code ? "bg-green/10 text-green" : "text-dark/60 hover:bg-green/5"}`}
                                        >
                                            <span>{l.flag}</span>
                                            <span>{l.label}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 space-y-4 mt-4">
                {/* Explanation card */}
                <div className="bg-white rounded-[22px] border border-green/10 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-green/8">
                        <span className="text-[10px] font-black uppercase tracking-widest text-dark/40">Explanation</span>
                        {explanation && (
                            <button
                                onClick={handleRegenerate}
                                disabled={regenLoading}
                                className="flex items-center gap-1.5 text-[11px] font-black text-dark/40 hover:text-green transition-colors disabled:opacity-40"
                            >
                                <RefreshCw size={11} className={regenLoading ? "animate-spin" : ""} />
                                Regenerate
                            </button>
                        )}
                    </div>

                    <div className="p-4" dir={isRTL ? "rtl" : "ltr"}>
                        {loading ? (
                            <div className="flex flex-col items-center gap-3 py-10 text-dark/30">
                                <Loader2 size={28} className="animate-spin text-green" />
                                <p className="text-sm font-bold">Generating explanation…</p>
                            </div>
                        ) : error ? (
                            <div className="py-8 text-center">
                                <p className="text-red-500 font-bold text-sm mb-3">{error}</p>
                                {!user && (
                                    <a href="/login" className="inline-block px-6 py-2.5 bg-green text-white font-black rounded-full text-sm">
                                        Log In
                                    </a>
                                )}
                            </div>
                        ) : explanation ? (
                            <>
                                <div className="prose prose-sm max-w-none">
                                    {renderMarkdown(explanation, isRTL)}
                                </div>

                                {/* Rating */}
                                <div className="mt-5 pt-4 border-t border-green/8 flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <button
                                                key={s}
                                                onClick={() => handleRate(s)}
                                                disabled={ratingLoading}
                                                className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                                            >
                                                <Star
                                                    size={18}
                                                    className={s <= userRating ? "text-amber-400 fill-amber-400" : "text-dark/15"}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    {ratingCount > 0 && (
                                        <span className="text-[11px] text-dark/35 font-bold">
                                            {avgRating.toFixed(1)} · {ratingCount} {ratingCount === 1 ? "rating" : "ratings"}
                                        </span>
                                    )}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>

                {/* Chat Q&A — shown only after explanation loaded */}
                {explanation && (
                    <div className="bg-white rounded-[22px] border border-green/10 overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-green/8">
                            <p className="text-[10px] font-black uppercase tracking-widest text-dark/40">Ask a Question</p>
                        </div>

                        {/* Messages */}
                        <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
                            {qaMessages.length === 0 && (
                                <p className="text-center text-dark/25 text-sm font-medium py-4">Ask anything about this document…</p>
                            )}
                            {qaMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div
                                        className={`max-w-[85%] px-4 py-3 rounded-[16px] text-sm font-medium leading-relaxed ${
                                            msg.role === "user"
                                                ? "text-white rounded-br-[4px]"
                                                : "bg-green/5 border border-green/10 text-dark/80 rounded-bl-[4px]"
                                        }`}
                                        style={msg.role === "user" ? { background: "linear-gradient(135deg,#3aaa6a,#2a8a55)" } : undefined}
                                    >
                                        {msg.role === "ai" ? renderMarkdown(msg.text, isRTL) : msg.text}
                                    </div>
                                </div>
                            ))}
                            {qaLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-green/5 border border-green/10 px-4 py-3 rounded-[16px] rounded-bl-[4px] flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-green/60 animate-bounce" style={{ animationDelay: "120ms" }} />
                                        <span className="w-1.5 h-1.5 rounded-full bg-green/60 animate-bounce" style={{ animationDelay: "240ms" }} />
                                    </div>
                                </div>
                            )}
                            <div ref={qaBottomRef} />
                        </div>

                        {/* Input */}
                        <div className="px-4 pb-4">
                            <div className="flex items-end gap-2 bg-green/4 border border-green/12 rounded-[16px] p-2 focus-within:border-green/30 transition-colors">
                                <textarea
                                    value={qaInput}
                                    onChange={e => setQaInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
                                    placeholder="Ask about this document…"
                                    rows={1}
                                    dir={isRTL ? "rtl" : "ltr"}
                                    className="flex-1 bg-transparent text-sm text-dark font-medium placeholder:text-dark/30 outline-none resize-none leading-relaxed px-2 py-1 min-h-[32px] max-h-[120px]"
                                />
                                <button
                                    onClick={handleAsk}
                                    disabled={!qaInput.trim() || qaLoading}
                                    className="w-9 h-9 rounded-[12px] bg-green flex items-center justify-center text-white shrink-0 hover:bg-green/90 disabled:opacity-30 transition-all active:scale-95"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
