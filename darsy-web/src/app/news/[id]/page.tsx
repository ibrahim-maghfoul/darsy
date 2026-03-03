
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ExternalLink, Download, FileText, Share2, Heart, MessageCircle, Send } from "lucide-react";
import { DownloadButton } from "@/components/DownloadButton";
import { ResourceButton } from "@/components/ResourceButton";
import { CookiesWindow } from "@/components/CookiesWindow";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import api from "@/lib/api";
import { useTranslations } from "next-intl";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text || "");

const renderText = (text: string, style: any, forceBlack = false, forceWhite = false) => {
    if (!text) return null;
    const lines = text.split("\n");
    const isColored = (c: string) => {
        if (!c) return false;
        const cl = c.toLowerCase().replace(/\s+/g, '');
        return !['#000', '#000000', 'black', 'rgb(0,0,0)', '#fff', '#ffffff', 'white', 'rgb(255,255,255)', 'transparent', 'inherit'].includes(cl);
    };
    return lines.map((line, i) => (
        <React.Fragment key={i}>
            <span style={{
                color: forceBlack ? "#111" : (forceWhite ? "#fff" : (isColored(style?.color) ? "#3aaa6a" : (style?.color || "inherit"))),
                fontWeight: style?.is_bold ? "900" : "inherit",
                fontSize: style?.font_size || "inherit",
                textAlign: (style?.align as any) || "inherit",
                display: style?.align ? "block" : "inline"
            }}>
                {line}
            </span>
            {i < lines.length - 1 && <br />}
        </React.Fragment>
    ));
};

const renderBlock = (block: any, index: number) => {
    const blockStyle = block.style || {};
    switch (block.type) {
        case "text": {
            const TagName = (block.subtype?.startsWith("h") ? block.subtype : "p") as any;
            const isHeading = block.subtype?.startsWith("h");
            const isAr = isArabic(block.text);
            return (
                <TagName key={index} dir={isAr ? "rtl" : "ltr"}
                    className={`${isHeading ? "text-green font-black mt-16 mb-8 tracking-tight leading-[1.2]" : "text-dark/80 leading-[1.8] mb-8"}
                        ${block.subtype === "h1" || block.subtype === "h2" ? "text-6xl" : block.subtype === "h3" ? "text-5xl" : block.subtype === "h4" ? "text-4xl" : block.subtype === "h5" ? "text-3xl" : block.subtype === "h6" ? "text-2xl" : "text-xl"}
                        ${isAr ? "text-right" : "text-left"}`}
                    style={{ textAlign: (blockStyle.align as any) || (isAr ? "right" : "left") }}>
                    {renderText(block.text, blockStyle)}
                </TagName>
            );
        }
        case "image":
            return (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="my-10 relative group">
                    <a href={block.src} target="_blank" rel="noopener noreferrer" className="block relative overflow-hidden rounded-[32px] border border-gray-100 cursor-zoom-in">
                        <img src={block.src} alt={block.alt || "Article Image"} className="w-full h-auto object-cover hover:scale-[1.02] transition-transform duration-700" />
                        {block.alt && (
                            <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                                <p className="text-white/90 text-sm font-bold tracking-wide italic">{block.alt}</p>
                            </div>
                        )}
                    </a>
                </motion.div>
            );
        case "list": {
            const listIsAr = block.items?.some((item: any) => isArabic(item.text));
            return (
                <ul key={index} className="space-y-4 mb-10 list-none" dir={listIsAr ? "rtl" : "ltr"}>
                    {block.items?.map((item: any, i: number) => {
                        const isAr = isArabic(item.text);
                        return (
                            <li key={i} className={`flex gap-4 group items-start ${isAr ? "text-right" : "text-left"}`} dir={isAr ? "rtl" : "ltr"}>
                                <span className="mt-2.5 w-2 h-2 rounded-full bg-green/20 border-2 border-green/40 group-hover:bg-green group-hover:border-green transition-all shrink-0" />
                                <span className="text-dark/80 leading-relaxed text-lg lg:text-xl">{renderText(item.text, item.style)}</span>
                            </li>
                        );
                    })}
                </ul>
            );
        }
        case "link":
            return (
                <motion.div key={index} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="mb-8">
                    <DownloadButton href={block.url} text={renderText(block.text, block.style, false, true)} />
                </motion.div>
            );
        case "table":
            return (
                <div key={index} className="relative group my-12">
                    <div className="relative overflow-hidden rounded-[36px] bg-white/80 border border-white/40 shadow-xl backdrop-blur-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        {block.rows[0].map((cell: any, i: number) => (
                                            <th key={i} className="p-6 text-xl font-black text-green uppercase tracking-[0.25em] border-b border-gray-100/50 text-right">
                                                {renderText(cell.text, cell.style, false)}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50/30">
                                    {block.rows.slice(1).map((row: any[], ri: number) => (
                                        <tr key={ri} className="hover:bg-white/40 transition-all">
                                            {row.map((cell: any, ci: number) => (
                                                <td key={ci} className="p-6 text-[15px] font-medium text-dark/70 leading-relaxed border-r border-gray-50/20 last:border-r-0 text-right">
                                                    <div className={cell.is_header ? "font-black text-dark" : ""}>
                                                        {cell.link ? (
                                                            <DownloadButton href={cell.link.url} text={renderText(cell.text || cell.link.text, cell.style, false, true)} isSmall showArrow={false} />
                                                        ) : renderText(cell.text, cell.style, true)}
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        case "video":
            if (block.platform === "youtube" && block.embed_url) {
                return (
                    <motion.div key={index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="my-10">
                        <div className="relative w-full rounded-[32px] overflow-hidden border border-gray-100 shadow-lg" style={{ paddingTop: "56.25%" }}>
                            <iframe
                                src={`${block.embed_url}?rel=0&modestbranding=1`}
                                title="YouTube video"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                            />
                        </div>
                    </motion.div>
                );
            }
            return null;
        default:
            return null;
    }
};

export default function NewsDetailPage() {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations("News");
    const id = params.id as string;

    const [article, setArticle] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const { user, checkAuth } = useAuth();
    const { showSnackbar } = useSnackbar();
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Q&A State
    const [questions, setQuestions] = useState<any[]>([]);
    const [newQuestion, setNewQuestion] = useState("");
    const [isSubmittingQ, setIsSubmittingQ] = useState(false);
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [adminAnswer, setAdminAnswer] = useState("");
    const [isSubmittingA, setIsSubmittingA] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch(`${BACKEND}/api/news/${id}`).then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); }),
            fetch(`${BACKEND}/api/news/${id}/questions`).then(r => r.ok ? r.json() : [])
        ])
            .then(([articleData, qData]) => {
                setArticle(articleData);
                setQuestions(qData || []);
                setLoading(false);
            })
            .catch(() => { setError(true); setLoading(false); });
    }, [id]);

    useEffect(() => {
        if (user?.progress?.savedNews && id) {
            setIsSaved(user.progress.savedNews.includes(id));
        }
    }, [user, id]);

    const handleSave = async () => {
        if (!user) {
            showSnackbar('Please log in to save articles.', 'info');
            return;
        }
        if (isSaving) return;

        setIsSaving(true);
        try {
            const res = await api.post('/user/saved-news', { newsId: id });
            setIsSaved(res.data.savedNews.includes(id));
            await checkAuth();
        } catch (error) {
            console.error('Failed to toggle save', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAskQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newQuestion.trim() || isSubmittingQ) return;

        setIsSubmittingQ(true);
        try {
            const res = await api.post(`/news/${id}/questions`, { question: newQuestion });
            setQuestions([res.data, ...questions]);
            setNewQuestion("");
        } catch (err) {
            console.error('Ask question error:', err);
            showSnackbar('Failed to post question. Please try again.', 'error');
        } finally {
            setIsSubmittingQ(false);
        }
    };

    const handleAnswerQuestion = async (questionId: string) => {
        if (!user || user.role !== 'admin' || !adminAnswer.trim() || isSubmittingA) return;

        setIsSubmittingA(true);
        try {
            const res = await api.patch(`/news/questions/${questionId}/answer`, { answer: adminAnswer });
            setQuestions(questions.map(q => q._id === questionId ? res.data : q));
            setAdminAnswer("");
            setReplyingToId(null);
            showSnackbar('Answer posted successfully!', 'success');
        } catch (err) {
            console.error('Answer question error:', err);
            showSnackbar('Failed to post answer.', 'error');
        } finally {
            setIsSubmittingA(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-green border-t-transparent animate-spin" />
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <div className="text-center space-y-6">
                    <h1 className="text-3xl font-black text-dark tracking-tight">Article not found</h1>
                    <button onClick={() => router.push("/news")}
                        className="px-8 py-3 rounded-2xl bg-dark text-white font-bold hover:scale-105 transition-all flex items-center gap-2 mx-auto">
                        <ArrowLeft size={18} /> Return to News
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pt-32 pb-32 px-[clamp(16px,5vw,48px)] bg-[#FAFBFD]">
            <div className="max-w-4xl mx-auto">
                {/* Nav */}
                <div className="flex items-center justify-between mb-16">
                    <button onClick={() => router.push("/news")}
                        className="group flex items-center gap-4 text-dark font-black tracking-widest text-[10px] uppercase">
                        <div className="w-12 h-12 rounded-[20px] bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:border-green/30 group-hover:bg-green group-hover:text-white transition-all duration-500">
                            <ArrowLeft size={20} strokeWidth={3} />
                        </div>
                        {t('back_to_news')}
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`w-12 h-12 rounded-[20px] border shadow-sm flex items-center justify-center transition-all duration-300 ${isSaved
                                ? 'bg-green/10 border-green/30 text-green'
                                : 'bg-white border-gray-100 text-dark/40 hover:border-green/30 hover:text-green'
                                }`}
                        >
                            <Heart size={20} fill={isSaved ? "currentColor" : "transparent"} />
                        </button>
                    </div>
                </div>

                {/* Header */}
                <header className="space-y-10 mb-20">
                    <div className="flex flex-wrap gap-4">
                        <div className="px-6 py-2.5 rounded-2xl bg-green text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-green/20">
                            {article.type || article.category}
                        </div>
                        {article.card_date && (
                            <div className="px-6 py-2.5 rounded-2xl bg-white border border-gray-100 text-dark/40 text-[10px] font-black uppercase tracking-[0.2em]">
                                <Calendar size={12} className="inline mr-2" />{article.card_date}
                            </div>
                        )}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-dark leading-[1.05] tracking-tight">{article.title}</h1>
                </header>

                {/* Content */}
                <div className="relative" dir="rtl">
                    <article className="prose prose-2xl max-w-none text-right">
                        {article.content_blocks && article.content_blocks.length > 0
                            ? article.content_blocks.map((block: any, idx: number) => renderBlock(block, idx))
                            : (article.paragraphs || []).map((p: string, idx: number) => (
                                <p key={idx} className="mb-8">{p}</p>
                            ))
                        }
                    </article>
                </div>

                {/* Attachments */}
                {article.attachments && article.attachments.length > 0 && (
                    <section className="mt-24 p-6 lg:p-8 rounded-[40px] bg-white border border-gray-100 shadow-xl shadow-black/[0.01]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center text-green">
                                <FileText size={20} />
                            </div>
                            <h3 className="text-2xl font-black text-dark tracking-tight">{t('official_resources')}</h3>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {article.attachments.map((att: any, idx: number) => (
                                <div key={idx} className="group p-6 rounded-[32px] bg-white border-2 border-green/60 shadow-lg shadow-green/5 hover:border-green hover:shadow-xl hover:shadow-green/10 transition-all duration-300 flex flex-col items-center gap-5 text-center justify-between">
                                    <div className="flex-1 flex flex-col justify-center w-full">
                                        <p className="font-black text-black text-[17px] leading-tight group-hover:text-green transition-colors mb-4 line-clamp-3">{att.label}</p>
                                    </div>
                                    <ResourceButton href={att.url} text="DOWNLOAD" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Q&A Section */}
                <section className="mt-24 p-6 lg:p-10 rounded-[40px] bg-white border border-gray-100 shadow-xl shadow-black/[0.01]">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                            <MessageCircle size={20} />
                        </div>
                        <h3 className="text-2xl font-black text-dark tracking-tight">{t('questions_answers')}</h3>
                    </div>

                    {/* Ask Question Form */}
                    <div className="mb-12">
                        {user ? (
                            <form onSubmit={handleAskQuestion} className="space-y-4">
                                <div className="flex gap-4 items-start">
                                    <img
                                        src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=f3f4f6&color=111`}
                                        alt={user.displayName}
                                        className="w-10 h-10 rounded-full border border-gray-100 object-cover shrink-0"
                                    />
                                    <div className="flex-1 relative">
                                        <textarea
                                            value={newQuestion}
                                            onChange={(e) => setNewQuestion(e.target.value)}
                                            placeholder={t('ask_placeholder')}
                                            className="w-full bg-gray-50/50 border border-gray-100 rounded-3xl p-5 pr-14 text-[15px] resize-none focus:outline-none focus:border-blue-500/30 focus:bg-white transition-all min-h-[100px]"
                                            disabled={isSubmittingQ}
                                        />
                                        <button
                                            type="submit"
                                            disabled={isSubmittingQ || !newQuestion.trim()}
                                            className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                                        >
                                            <Send size={16} className="-ml-1 mt-0.5" />
                                        </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-8 text-center flex flex-col items-center gap-4">
                                <p className="text-dark/60 font-medium">{t('login_hint')}</p>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="px-6 py-2.5 rounded-2xl bg-dark text-white text-sm font-bold shadow-lg shadow-dark/10"
                                >
                                    {t('login_to_ask')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Questions List */}
                    <div className="space-y-6">
                        {questions.length === 0 ? (
                            <p className="text-center text-dark/40 py-8">{t('no_questions')}</p>
                        ) : (
                            questions.map((q) => (
                                <div key={q._id} className="p-6 rounded-3xl bg-gray-50/50 border border-gray-100 space-y-4">
                                    {/* Question */}
                                    <div className="flex gap-4">
                                        <img
                                            src={q.userId?.photoURL || `https://ui-avatars.com/api/?name=${q.userId?.displayName}&background=fff&color=111`}
                                            alt={q.userId?.displayName || "User"}
                                            className="w-10 h-10 rounded-full border border-gray-200 object-cover shrink-0 bg-white"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="font-bold text-dark text-[15px]">{q.userId?.displayName || "Unknown User"}</span>
                                                <span className="text-xs text-dark/40">{new Date(q.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-dark/80 text-[15px] leading-relaxed relative right-0" dir={isArabic(q.question) ? "rtl" : "ltr"}>{q.question}</p>
                                        </div>
                                    </div>

                                    {/* Admin Answer */}
                                    {q.answer ? (
                                        <div className="ml-6 md:ml-12 pl-6 py-1 border-l-2 border-green/20">
                                            <div className="flex gap-4">
                                                <div className="w-8 h-8 rounded-full bg-green text-white flex items-center justify-center shrink-0">
                                                    <span className="font-bold text-[10px]">ADMIN</span>
                                                </div>
                                                <div className="flex-1 mt-0.5">
                                                    <p className="text-dark/90 text-[15px] leading-relaxed relative right-0" dir={isArabic(q.answer) ? "rtl" : "ltr"}>{q.answer}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        user?.role === 'admin' && (
                                            <div className="ml-6 md:ml-12">
                                                {replyingToId === q._id ? (
                                                    <div className="space-y-3">
                                                        <textarea
                                                            value={adminAnswer}
                                                            onChange={(e) => setAdminAnswer(e.target.value)}
                                                            placeholder="Write your answer..."
                                                            className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-[14px] resize-none focus:outline-none focus:border-green/30 transition-all min-h-[80px]"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleAnswerQuestion(q._id)}
                                                                disabled={isSubmittingA || !adminAnswer.trim()}
                                                                className="px-4 py-1.5 rounded-xl bg-green text-white text-xs font-bold shadow-lg shadow-green/10 disabled:opacity-50"
                                                            >
                                                                {t('post_answer')}
                                                            </button>
                                                            <button
                                                                onClick={() => { setReplyingToId(null); setAdminAnswer(""); }}
                                                                className="px-4 py-1.5 rounded-xl bg-gray-100 text-dark/60 text-xs font-bold hover:bg-gray-200 transition-all"
                                                            >
                                                                {t('cancel')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setReplyingToId(q._id)}
                                                        className="flex items-center gap-2 text-green font-bold text-xs hover:underline"
                                                    >
                                                        <Send size={12} className="rotate-45" /> {t('reply_btn')}
                                                    </button>
                                                )
                                                }
                                            </div>
                                        )
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-32 pt-16 border-t border-gray-100 flex flex-col items-center gap-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-dark/20 text-center">Verified by Darsy Editorial Team</p>
                    {article.url && (
                        <a href={article.url} target="_blank" rel="noopener noreferrer"
                            className="group inline-flex items-center gap-4 px-10 py-5 rounded-[24px] bg-dark text-white font-black text-[11px] uppercase tracking-[0.35em] hover:scale-[1.05] transition-all duration-500 shadow-2xl shadow-dark/20">
                            ORIGINAL SOURCE <ExternalLink size={14} strokeWidth={3} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </a>
                    )}
                </footer>
            </div>

            <CookiesWindow />

            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
                <defs>
                    <filter id="goo_download">
                        <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7" result="gooResult" />
                        <feBlend in2="gooResult" in="SourceGraphic" result="mix" />
                    </filter>
                </defs>
            </svg>
        </motion.div>
    );
}
