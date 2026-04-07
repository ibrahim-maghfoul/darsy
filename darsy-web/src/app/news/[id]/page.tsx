
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ExternalLink, Download, FileText, Share2, Heart, MessageCircle, Send, Star, Eye, Clock, ChevronRight } from "lucide-react";
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
    const { user, checkAuth, getPhotoURL, getResourceURL } = useAuth();
    const { showSnackbar } = useSnackbar();
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [userRating, setUserRating] = useState(0);

    // Q&A State
    const [questions, setQuestions] = useState<any[]>([]);
    const [newQuestion, setNewQuestion] = useState("");
    const [isSubmittingQ, setIsSubmittingQ] = useState(false);
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [adminAnswer, setAdminAnswer] = useState("");
    const [isSubmittingA, setIsSubmittingA] = useState(false);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            fetch(`${BACKEND}/api/news/${id}`).then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); }),
            fetch(`${BACKEND}/api/news/${id}/questions`).then(r => r.ok ? r.json() : [])
        ])
            .then(([articleData, qData]) => {
                if (cancelled) return;
                setArticle(articleData);
                setQuestions(qData || []);
                setUserRating(articleData.userRating || 0);
                setLoading(false);
            })
            .catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
        return () => { cancelled = true; };
    }, [id]);

    useEffect(() => {
        // Track view
        const trackView = async () => {
            try {
                await api.post(`/news/${id}/view`);
                // Increment locally for immediate feedback if needed, 
                // but article object will have the server value on load
            } catch (err) {
                console.error('Failed to track view:', err);
            }
        };
        trackView();
    }, [id]);

    useEffect(() => {
        if (user?.progress?.savedNews && id) {
            setIsSaved(user.progress.savedNews.includes(id));
        }
    }, [user, id]);

    const handleRate = async (rating: number) => {
        if (!user) {
            showSnackbar('Please log in to rate articles.', 'info');
            return;
        }
        if (userRating > 0) return; // Already rated

        try {
            const res = await api.post(`/news/${id}/rate`, { rating });
            setUserRating(rating);
            if (res.data.rating) {
                setArticle({ ...article, rating: res.data.rating });
            }
            showSnackbar('Thank you for your rating!', 'success');
        } catch (err) {
            console.error('Rating error:', err);
            showSnackbar('Failed to submit rating.', 'error');
        }
    };

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

    // Extract hero image from article data
    const heroImage = article.imageUrl
        || article.images?.[0]?.src
        || article.content_blocks?.find((b: any) => b.type === 'image')?.src
        || null;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pb-32 bg-white">

            {/* ── Hero ─────────────────────────────────────── */}
            <div className="relative overflow-hidden" style={{ minHeight: heroImage ? '520px' : '420px' }}>
                {/* Background: hero image or gradient */}
                {heroImage ? (
                    <>
                        <img src={heroImage} alt={article.title || "Article cover"} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(26,58,42,0.45) 0%, rgba(26,58,42,0.92) 70%, #1a3a2a 100%)' }} />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-dark" />
                )}
                {/* Dot texture overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                {/* Decorative rings */}
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none" style={{ border: '30px solid rgba(58,170,106,0.12)' }} />
                <div className="absolute -bottom-28 -left-28 w-80 h-80 rounded-full pointer-events-none" style={{ border: '36px solid rgba(58,170,106,0.08)' }} />

                <div className="relative z-10 max-w-4xl mx-auto px-[clamp(20px,5vw,48px)] pt-36 pb-20 flex flex-col justify-end h-full">
                    {/* Top bar: back + save */}
                    <div className="flex items-center justify-between mb-auto pb-8">
                        <button
                            onClick={() => router.push("/news")}
                            className="hidden md:flex items-center gap-2 font-bold text-sm rounded-full px-4 py-2 transition-all duration-200 backdrop-blur-md"
                            style={{ color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                        >
                            <ArrowLeft size={15} />
                            {t('back_to_news')}
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm backdrop-blur-md transition-all duration-200 active:scale-95 ${isSaved ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-white/80 hover:text-white'}`}
                                style={isSaved ? {} : { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                            >
                                <Heart size={14} fill={isSaved ? "currentColor" : "transparent"} />
                                {isSaved ? 'Saved' : 'Save'}
                            </button>
                        </div>
                    </div>

                    {/* Category + meta */}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                        <span className="px-4 py-1.5 rounded-full bg-green text-white text-[11px] font-black uppercase tracking-wider">
                            {article.type || article.category}
                        </span>
                        {article.card_date && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/60 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                <Calendar size={11} />{article.card_date}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/60 backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <Eye size={11} />{article.viewCount || 0}
                        </span>
                        {(article.rating?.average || article.rating) ? (
                            <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-black text-amber-300 backdrop-blur-sm" style={{ background: 'rgba(251,191,36,0.12)' }}>
                                <Star size={11} className="fill-current" />
                                {(article.rating?.average || article.rating || 0).toFixed(1)}
                            </span>
                        ) : null}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight max-w-3xl">
                        {article.title}
                    </h1>
                </div>
            </div>

            {/* ── Article Body ────────────────────────────── */}
            <div className="max-w-3xl mx-auto px-[clamp(20px,5vw,48px)]">

                {/* Green accent line */}
                <div className="h-1 w-16 rounded-full bg-green mx-auto -mt-0.5 mb-12" />

                {/* Content */}
                <div className="mb-16" dir="rtl">
                    <article className="prose prose-xl max-w-none text-right prose-headings:text-dark prose-p:text-dark/75 prose-p:leading-[1.9] prose-li:text-dark/75">
                        {article.content_blocks && article.content_blocks.length > 0
                            ? article.content_blocks.map((block: any, idx: number) => renderBlock(block, idx))
                            : (article.paragraphs || []).map((p: string, idx: number) => (
                                <p key={idx} className="mb-8 text-lg leading-[1.9]">{p}</p>
                            ))
                        }
                    </article>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-12">
                    <div className="flex-1 h-px bg-green/10" />
                    <Star size={14} className="text-green/20" />
                    <div className="flex-1 h-px bg-green/10" />
                </div>

                {/* Star Rating */}
                <section className="mb-12 p-10 rounded-[32px] relative overflow-hidden text-center" style={{ background: 'linear-gradient(135deg, #f0faf5 0%, #e8f5ee 50%, #f0faf5 100%)' }}>
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(58,170,106,0.08) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-green/15 flex items-center justify-center text-green mx-auto mb-4">
                            <Star size={26} className="fill-current" />
                        </div>
                        <h3 className="text-xl font-black text-dark tracking-tight mb-1">Did you find this helpful?</h3>
                        <p className="text-dark/40 font-medium text-sm mb-6">Your feedback helps us provide better content</p>

                        <div className="flex justify-center gap-3 mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => handleRate(star)}
                                    disabled={userRating > 0}
                                    className={`p-2 rounded-xl transition-all duration-200 ${userRating > 0 ? 'cursor-default' : 'hover:scale-125 hover:bg-white/60 active:scale-95'}`}
                                >
                                    <Star
                                        size={36}
                                        strokeWidth={1.8}
                                        className={`${star <= (userRating || (article.rating?.average || article.rating || 0))
                                            ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                                            : 'text-green/20 hover:text-amber-300'
                                            } transition-colors`}
                                    />
                                </button>
                            ))}
                        </div>
                        {userRating > 0 && (
                            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-green font-bold text-sm bg-white/60 inline-flex px-5 py-2 rounded-full">
                                Thank you for rating! ⭐
                            </motion.p>
                        )}
                    </div>
                </section>

                {/* Attachments */}
                {article.attachments && article.attachments.length > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-green/10 flex items-center justify-center text-green shrink-0">
                                <FileText size={18} />
                            </div>
                            <h3 className="text-xl font-black text-dark tracking-tight">{t('official_resources')}</h3>
                        </div>
                        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {article.attachments.map((att: any, idx: number) => (
                                <div key={idx} className="group p-5 rounded-2xl bg-[#f6f9f7] border border-green/8 hover:border-green/25 hover:bg-white hover:shadow-xl hover:shadow-green/[0.06] transition-all duration-300 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-green/10 flex items-center justify-center text-green shrink-0 group-hover:bg-green group-hover:text-white transition-colors">
                                        <Download size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-dark text-sm leading-tight line-clamp-2 group-hover:text-green transition-colors">{att.label}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-dark/20 group-hover:text-green shrink-0 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Q&A Section */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-green/10 flex items-center justify-center text-green shrink-0">
                            <MessageCircle size={18} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-dark tracking-tight">{t('questions_answers')}</h3>
                            {questions.length > 0 && <p className="text-xs text-dark/30 font-semibold mt-0.5">{questions.length} question{questions.length > 1 ? 's' : ''}</p>}
                        </div>
                    </div>

                    {/* Ask form */}
                    <div className="mb-8">
                        {user ? (
                            <form onSubmit={handleAskQuestion}>
                                <div className="flex gap-3 items-start">
                                    <img
                                        src={getPhotoURL(user.photoURL) || `https://ui-avatars.com/api/?name=${user.displayName}&background=f3f4f6&color=111`}
                                        alt={user.displayName}
                                        className="w-9 h-9 rounded-full border border-green/10 object-cover shrink-0 mt-1"
                                    />
                                    <div className="flex-1 relative">
                                        <textarea
                                            value={newQuestion}
                                            onChange={(e) => setNewQuestion(e.target.value)}
                                            placeholder={t('ask_placeholder')}
                                            className="w-full bg-[#f6f9f7] border border-green/8 rounded-2xl p-4 pr-14 text-sm resize-none focus:outline-none focus:border-green/25 focus:bg-white focus:shadow-lg focus:shadow-green/[0.04] transition-all min-h-[90px]"
                                            disabled={isSubmittingQ}
                                        />
                                        <button
                                            type="submit"
                                            disabled={isSubmittingQ || !newQuestion.trim()}
                                            className="absolute bottom-3 right-3 w-9 h-9 rounded-xl bg-green text-white flex items-center justify-center hover:bg-dark disabled:opacity-40 transition-all shadow-md shadow-green/20"
                                        >
                                            <Send size={14} className="-ml-0.5 mt-0.5" />
                                        </button>
                                    </div>
                                </div>
                            </form>
                        ) : (
                            <div className="bg-[#f6f9f7] border border-green/8 rounded-2xl p-8 text-center flex flex-col items-center gap-3">
                                <MessageCircle size={28} className="text-green/30" />
                                <p className="text-dark/50 font-medium text-sm">{t('login_hint')}</p>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="px-5 py-2 rounded-full bg-green text-white text-sm font-bold shadow-md shadow-green/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    {t('login_to_ask')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Questions list */}
                    <div className="space-y-3">
                        {questions.length === 0 ? (
                            <p className="text-center text-dark/30 py-8 text-sm">{t('no_questions')}</p>
                        ) : (
                            questions.map((q) => (
                                <div key={q._id} className="p-4 rounded-2xl bg-[#f6f9f7] border border-green/6 space-y-3 hover:border-green/15 transition-colors">
                                    <div className="flex gap-3">
                                        <img
                                            src={getPhotoURL(q.userId?.photoURL) || `https://ui-avatars.com/api/?name=${q.userId?.displayName}&background=fff&color=111`}
                                            alt={q.userId?.displayName || "User"}
                                            className="w-8 h-8 rounded-full border border-green/10 object-cover shrink-0 bg-white"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="font-bold text-dark text-sm">{q.userId?.displayName || "Unknown"}</span>
                                                <span className="text-[11px] text-dark/30">{new Date(q.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-dark/70 text-sm leading-relaxed" dir={isArabic(q.question) ? "rtl" : "ltr"}>{q.question}</p>
                                        </div>
                                    </div>

                                    {q.answer ? (
                                        <div className="ml-8 md:ml-11 pl-4 py-2.5 rounded-xl border-l-2 border-green/30 bg-white/60">
                                            <div className="flex gap-2.5">
                                                <div className="w-6 h-6 rounded-md bg-green text-white flex items-center justify-center shrink-0 text-[7px] font-black mt-0.5">A</div>
                                                <p className="flex-1 text-dark/80 text-sm leading-relaxed" dir={isArabic(q.answer) ? "rtl" : "ltr"}>{q.answer}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        user?.role === 'admin' && (
                                            <div className="ml-8 md:ml-11">
                                                {replyingToId === q._id ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            value={adminAnswer}
                                                            onChange={(e) => setAdminAnswer(e.target.value)}
                                                            placeholder="Write your answer..."
                                                            className="w-full bg-white border border-green/15 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-green/30 transition-all min-h-[70px]"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleAnswerQuestion(q._id)}
                                                                disabled={isSubmittingA || !adminAnswer.trim()}
                                                                className="px-3.5 py-1.5 rounded-lg bg-green text-white text-xs font-bold shadow-sm disabled:opacity-40"
                                                            >
                                                                {t('post_answer')}
                                                            </button>
                                                            <button
                                                                onClick={() => { setReplyingToId(null); setAdminAnswer(""); }}
                                                                className="px-3.5 py-1.5 rounded-lg bg-gray-100 text-dark/50 text-xs font-bold hover:bg-gray-200 transition-colors"
                                                            >
                                                                {t('cancel')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setReplyingToId(q._id)}
                                                        className="flex items-center gap-1.5 text-green font-bold text-xs hover:underline"
                                                    >
                                                        <Send size={10} className="rotate-45" /> {t('reply_btn')}
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Source link + footer */}
                <footer className="pt-8 pb-4 border-t border-green/6 flex flex-col items-center gap-5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-dark/15">Verified by Darsy Editorial Team</p>
                    {article.url && (
                        <a href={article.url} target="_blank" rel="noopener noreferrer"
                            className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-dark text-white font-bold text-xs hover:scale-105 transition-all duration-200 shadow-xl shadow-dark/15">
                            Original Source <ExternalLink size={13} strokeWidth={2.5} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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
