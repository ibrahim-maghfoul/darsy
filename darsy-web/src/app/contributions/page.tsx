"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Download, FileText, Plus, Loader2, Upload, X, ChevronDown } from "lucide-react";
import CircleRing from "@/components/ui/CircleRing";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import api from "@/lib/api";
import Link from "next/link";
import Image from "next/image";

interface ContributionSummary {
    userId: string;
    contributions: number;
    displayName: string;
    photoURL?: string;
}

interface RecentContribution {
    _id: string;
    resourceTitle: string;
    subjectTitle?: string;
    lessonTitle?: string;
    url: string;
    createdAt: string;
    user: {
        displayName: string;
        photoURL?: string;
    };
}

export default function ContributionsPage() {
    const t = useTranslations("Contributions");
    const { user, getPhotoURL, getResourceURL } = useAuth();
    const { showSnackbar } = useSnackbar();
    
    const [summaries, setSummaries] = useState<ContributionSummary[]>([]);
    const [recent, setRecent] = useState<RecentContribution[]>([]);
    const [loading, setLoading] = useState(true);

    // Contribution limit state
    const [contributionStatus, setContributionStatus] = useState<{
        count: number; limit: number | null; remaining: number | null; isPremium: boolean; canContribute: boolean;
    } | null>(null);
    const [showLimitDialog, setShowLimitDialog] = useState(false);

    // Add Contribution Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [resourceTitle, setResourceTitle] = useState("");
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedLesson, setSelectedLesson] = useState("");
    const [subjects, setSubjects] = useState<any[]>([]);
    const [lessons, setLessons] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (!selectedSubject) {
            setLessons([]);
            setSelectedLesson("");
            return;
        }
        const fetchLessons = async () => {
            try {
                const res = await api.get(`/data/lessons/${selectedSubject}`);
                setLessons(res.data);
            } catch (error) {
                console.error("Failed to fetch lessons:", error);
            }
        };
        fetchLessons();
    }, [selectedSubject]);

    const guidanceId = user?.selectedPath?.guidanceId ?? null;

    useEffect(() => {
        if (!user?.id) return;
        const fetchContributionsData = async () => {
            try {
                const params = guidanceId ? { params: { guidanceId } } : {};

                const [summaryRes, recentRes] = await Promise.all([
                    api.get('/data/contributions/summary', params),
                    api.get('/data/contributions/recent', params)
                ]);

                setSummaries(summaryRes.data);
                setRecent(recentRes.data);

                if (guidanceId) {
                    const subjectsRes = await api.get(`/data/subjects/${guidanceId}`);
                    setSubjects(subjectsRes.data);
                }
            } catch (error) {
                console.error("Failed to fetch contributions:", error);
                showSnackbar("Failed to load contributions data", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchContributionsData();
    }, [user?.id, guidanceId, showSnackbar]);

    // Fetch contribution status
    useEffect(() => {
        if (!user) return;
        api.get('/user/contribution-status')
            .then(res => setContributionStatus(res.data))
            .catch(() => {});
    }, [user]);

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setResourceTitle("");
        setUploadFile(null);
        setSelectedSubject("");
        setSelectedLesson("");
    };

    const handleAddContribution = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !resourceTitle || !selectedSubject) {
            showSnackbar(t("fill_required"), "error");
            return;
        }

        // Check 10MB file size limit
        if (uploadFile.size > 10 * 1024 * 1024) {
            showSnackbar(t("file_too_large"), "error");
            return;
        }

        // Check contribution limit for free users
        if (contributionStatus && !contributionStatus.canContribute) {
            setShowLimitDialog(true);
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("resourceTitle", resourceTitle);
            formData.append("file", uploadFile);
            formData.append("subjectId", selectedSubject);
            formData.append("lessonId", selectedLesson || "contribution");

            await api.post("/data/contribute", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Increment contribution count
            try {
                const incrementRes = await api.post('/user/contribution-count/increment');
                if (incrementRes.data.success) {
                    setContributionStatus(prev => prev ? {
                        ...prev,
                        count: incrementRes.data.count ?? prev.count + 1,
                        remaining: incrementRes.data.remaining ?? null,
                        canContribute: incrementRes.data.unlimited || (incrementRes.data.remaining ?? 1) > 0,
                    } : prev);
                }
            } catch {}

            showSnackbar(t("success"), "success");
            handleCloseModal();
            
            // Refresh recent
            const recentParams = guidanceId ? { params: { guidanceId } } : {};
            const recentRes = await api.get('/data/contributions/recent', recentParams);
            setRecent(recentRes.data);
        } catch (error: any) {
            console.error("Contribution failed:", error);
            const msg = error?.response?.data?.error || "Failed to contribute";
            showSnackbar(msg, "error");
        } finally {
            setIsUploading(false);
        }
    };

    const getFileType = (url: string) => {
        const ext = url.split('.').pop()?.toLowerCase();
        if (['pdf'].includes(ext || '')) return 'PDF';
        if (['doc', 'docx'].includes(ext || '')) return 'DOC';
        if (['jpg', 'jpeg', 'png', 'svg'].includes(ext || '')) return 'IMG';
        return 'FILE';
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m";
        return Math.floor(seconds) + "s";
    };

    return (
        <div className="min-h-screen bg-white md:pt-24 pb-20 overflow-x-hidden">
            {/* Main Content Side-by-Side Grid */}
            <div className="max-w-[1600px] mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Header + CircleRing Visualization (Left Side - 6/12) */}
                    <div className="lg:col-span-6 flex flex-col gap-4 md:gap-8">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-4xl md:text-5xl font-black text-[#112A46] tracking-tight mb-2 pt-4"
                            >
                                {t("page_title")} <span className="text-green">{t("page_title_highlight")}</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg text-muted-foreground font-medium"
                            >
                                {t("page_subtitle")}
                            </motion.p>

                            {/* Contribution status badge — fixed height to prevent ring jump */}
                            <div className="mt-3 min-h-[44px] flex items-start">
                                {contributionStatus && !contributionStatus.isPremium && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${
                                            contributionStatus.remaining === 0
                                                ? 'bg-red-50 border-red-200 text-red-600'
                                                : contributionStatus.remaining !== null && contributionStatus.remaining <= 5
                                                ? 'bg-amber-50 border-amber-200 text-amber-700'
                                                : 'bg-green/5 border-green/20 text-green'
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${contributionStatus.remaining === 0 ? 'bg-red-500' : 'bg-green'}`} />
                                        {contributionStatus.remaining === 0
                                            ? t("limit_reached")
                                            : t("limit_remaining", { count: contributionStatus.remaining })}
                                    </motion.div>
                                )}
                                {contributionStatus?.isPremium && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-amber-50 border border-amber-200 text-amber-700">
                                        {t("premium_unlimited")}
                                    </div>
                                )}
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative flex items-center justify-center"
                        >
                            <CircleRing 
                                users={useMemo(() => summaries.filter(s => s.userId !== user?.id), [summaries, user?.id])} 
                                currentUser={user} 
                                getPhotoURL={getPhotoURL}
                                theme="light"
                            />
                        </motion.div>
                    </div>

                    {/* Recent Contributions Feed (Right Side - 6/12) */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="bg-[#fdfdfd] rounded-[48px] border border-green/5 shadow-2xl shadow-green/5 overflow-hidden flex flex-col md:min-h-[700px] h-full">
                            <div className="p-6 border-b border-green/5 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                                <h2 className="text-2xl font-black text-[#112A46]">{t("recent_activity")}</h2>
                                <p className="text-sm text-muted-foreground font-medium mb-4">{t("latest_shared")}</p>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="w-full flex justify-center items-center gap-2 bg-green text-white px-4 py-3 rounded-2xl font-bold hover:shadow-lg hover:shadow-green/30 hover:-translate-y-0.5 transition-all group"
                                >
                                    <Plus size={20} className="transition-transform group-hover:rotate-90" />
                                    {t("share_btn")}
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <div key={i} className="bg-white rounded-[18px] border border-green/[0.11] p-4 flex items-center gap-3"
                                            style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)', animation: 'shimmer 1.5s ease-in-out infinite', background: 'linear-gradient(90deg,#f3f4f3 0%,#eaf2ed 40%,#f3f4f3 80%)', backgroundSize: '200% 100%', animationDelay: `${i * 0.1}s` }}>
                                            <div className="w-10 h-10 bg-green/5 rounded-[11px] shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3.5 bg-green/5 rounded-full w-2/3" />
                                                <div className="h-2.5 bg-green/5 rounded-full w-1/3" />
                                            </div>
                                            <div className="w-8 h-8 bg-green/5 rounded-full shrink-0" />
                                        </div>
                                    ))
                                ) : recent.length === 0 ? (
                                    <div className="text-center py-12 px-6 rounded-[18px] border border-dashed border-green/[0.11] m-2">
                                        <FileText className="mx-auto text-green/20 w-10 h-10 mb-3" />
                                        <p className="text-sm text-dark/30 font-bold">{t("no_recent")}</p>
                                    </div>
                                ) : (
                                    recent.map((item, index) => {
                                        const avatarUrl = item.user.photoURL ? getPhotoURL(item.user.photoURL) : null;
                                        const fileUrl = getResourceURL(item.url);
                                        const fileType = getFileType(item.url);
                                        return (
                                            <motion.div
                                                key={item._id}
                                                initial={{ opacity: 0, y: 18 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true, margin: "-20px" }}
                                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
                                                className="group bg-white rounded-[18px] border border-green/[0.11] p-4 flex items-center gap-3 transition-all duration-[280ms] cursor-default"
                                                style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
                                                whileHover={{ y: -3, boxShadow: '0 10px 28px rgba(58,170,106,0.14), 0 3px 10px rgba(58,170,106,0.08)', borderColor: 'rgba(58,170,106,0.35)' } as any}
                                            >
                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-[11px] overflow-hidden shrink-0 border border-green/10 bg-green/5 flex items-center justify-center relative">
                                                    {avatarUrl ? (
                                                        <Image src={avatarUrl} alt={item.user.displayName} fill className="object-cover" />
                                                    ) : (
                                                        <span className="text-green font-black text-sm">{item.user.displayName.charAt(0)}</span>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-green/[0.07] text-green rounded-md">
                                                            {fileType}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-dark/30 ml-auto shrink-0">
                                                            {formatTimeAgo(item.createdAt)}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-[#112A46] text-[13px] group-hover:text-green transition-colors leading-tight truncate">
                                                        {item.resourceTitle}
                                                    </h3>
                                                    <p className="text-[11px] text-dark/40 font-medium truncate mt-0.5">
                                                        <span className="font-bold text-dark/55">{item.user.displayName}</span>
                                                        {(item.subjectTitle && item.subjectTitle !== 'General') ? ` · ${item.subjectTitle}` : ''}
                                                    </p>
                                                </div>

                                                {/* Download */}
                                                <a
                                                    href={fileUrl || '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-8 h-8 rounded-full bg-green/5 border border-green/[0.11] text-green/50 flex items-center justify-center hover:bg-green hover:text-white hover:border-green transition-all shrink-0 shadow-sm"
                                                >
                                                    <Download size={13} />
                                                </a>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Add Contribution Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center md:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 48 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 32 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="relative bg-white w-full md:max-w-lg mx-3 md:mx-0 rounded-t-[28px] md:rounded-[28px] overflow-x-hidden overflow-y-auto max-h-[92dvh]"
                            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)' }}
                        >
                            {/* Drag handle — mobile only */}
                            <div className="w-10 h-1 bg-green/10 rounded-full mx-auto mt-3 md:hidden" />

                            {/* Header with icon */}
                            <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 border-b border-green/[0.08]">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0 relative overflow-hidden"
                                        style={{ background: 'linear-gradient(135deg, #f0faf5, #e8f5ee)' }}
                                    >
                                        <div
                                            className="absolute inset-0 opacity-60"
                                            style={{ backgroundImage: 'radial-gradient(circle, rgba(58,170,106,0.18) 1px, transparent 1px)', backgroundSize: '14px 14px' }}
                                        />
                                        <Upload size={18} className="text-green relative z-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-dark">{t("share_modal_title")}</h3>
                                        <p className="text-[11px] text-dark/40 font-medium">{t("share_modal_subtitle")}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="w-8 h-8 rounded-full border border-green/[0.11] bg-green/[0.04] flex items-center justify-center text-dark/40 hover:bg-red-50 hover:text-red-400 hover:border-red-200 transition-all shrink-0 mt-1"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <form onSubmit={handleAddContribution} className="p-6 space-y-5">
                                {/* Resource Title */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-dark/40 ml-1">{t("resource_title_label")}</label>
                                    <input
                                        type="text"
                                        required
                                        value={resourceTitle}
                                        onChange={(e) => setResourceTitle(e.target.value)}
                                        placeholder={t("resource_placeholder")}
                                        className="w-full h-12 px-4 rounded-[12px] bg-green/[0.04] border border-green/[0.11] focus:border-green/[0.35] focus:bg-white transition-all outline-none font-bold text-dark text-sm placeholder:text-dark/25 placeholder:font-medium"
                                    />
                                </div>

                                {/* Subject + Lesson */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-dark/40 ml-1">{t("subject_label")}</label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={selectedSubject}
                                                onChange={(e) => setSelectedSubject(e.target.value)}
                                                className="w-full h-12 pl-4 pr-8 rounded-[12px] bg-green/[0.04] border border-green/[0.11] focus:border-green/[0.35] focus:bg-white transition-all outline-none font-bold text-dark appearance-none text-sm"
                                            >
                                                <option value="">{t("subject_label")}</option>
                                                {subjects.map(s => (
                                                    <option key={s._id} value={s._id}>{s.title}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-dark/40 ml-1">{t("lesson_label")}</label>
                                        <div className="relative">
                                            <select
                                                value={selectedLesson}
                                                onChange={(e) => setSelectedLesson(e.target.value)}
                                                disabled={!selectedSubject || lessons.length === 0}
                                                className="w-full h-12 pl-4 pr-8 rounded-[12px] bg-green/[0.04] border border-green/[0.11] focus:border-green/[0.35] focus:bg-white transition-all outline-none font-bold text-dark appearance-none disabled:opacity-40 text-sm"
                                            >
                                                <option value="">{t("lesson_label")}</option>
                                                {lessons.map(l => (
                                                    <option key={l._id} value={l._id}>{l.title}</option>
                                                ))}
                                            </select>
                                            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* File Upload Zone */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-dark/40 ml-1">File</label>
                                    <input
                                        type="file"
                                        required
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="contribution-file"
                                    />
                                    <label
                                        htmlFor="contribution-file"
                                        className="flex flex-col items-center justify-center w-full h-28 rounded-[14px] border border-dashed border-green/[0.22] bg-green/[0.03] hover:bg-green/[0.06] hover:border-green/[0.40] transition-all cursor-pointer group"
                                    >
                                        {uploadFile ? (
                                            <div className="text-center px-4">
                                                <div className="w-9 h-9 rounded-[11px] bg-green/10 flex items-center justify-center mx-auto mb-2">
                                                    <FileText size={16} className="text-green" />
                                                </div>
                                                <p className="text-sm font-bold text-dark truncate max-w-[220px]">{uploadFile.name}</p>
                                                <p className="text-[10px] text-dark/35 font-medium mt-0.5">{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-9 h-9 rounded-[11px] bg-green/[0.07] group-hover:bg-green/[0.12] flex items-center justify-center mb-2 transition-colors">
                                                    <Upload size={15} className="text-green/50 group-hover:text-green transition-colors" />
                                                </div>
                                                <span className="text-sm font-bold text-dark/40 group-hover:text-dark/60 transition-colors">{t("drop_file")}</span>
                                                <span className="text-[10px] text-dark/25 font-medium mt-0.5">{t("max_size")}</span>
                                            </>
                                        )}
                                    </label>
                                </div>

                                {/* Submit */}
                                <button
                                    disabled={isUploading}
                                    type="submit"
                                    className="w-full h-12 bg-green text-white rounded-[12px] font-bold text-sm hover:bg-green/90 hover:shadow-lg hover:shadow-green/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-2"
                                >
                                    {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                    {isUploading ? t("uploading") : t("publish_btn")}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Limit-reached Dialog */}
            <AnimatePresence>
                {showLimitDialog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            className="bg-white rounded-[28px] p-8 max-w-sm w-full shadow-2xl text-center space-y-5"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
                                <span className="text-3xl">🚫</span>
                            </div>
                            <h3 className="text-2xl font-black text-dark">{t("monthly_limit_title")}</h3>
                            <p className="text-muted-foreground">{t("monthly_limit_desc")}</p>
                            <div className="flex flex-col gap-3">
                                <a href="/pricing" className="w-full py-3 bg-green text-white font-bold rounded-2xl hover:shadow-lg transition-all text-center block">
                                    {t("upgrade_premium")}
                                </a>
                                <button
                                    onClick={() => setShowLimitDialog(false)}
                                    className="w-full py-3 bg-gray-50 text-dark font-bold rounded-2xl hover:bg-gray-100 transition-all"
                                >
                                    {t("ok_got_it")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(46, 139, 69, 0.1);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(46, 139, 69, 0.2);
                }
            `}</style>
        </div>
    );
}
