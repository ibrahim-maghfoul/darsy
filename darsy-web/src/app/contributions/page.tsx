"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, Plus, Loader2 } from "lucide-react";
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

    const handleAddContribution = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !resourceTitle || !selectedSubject) {
            showSnackbar("Please fill all required fields", "error");
            return;
        }

        // Check 10MB file size limit
        if (uploadFile.size > 10 * 1024 * 1024) {
            showSnackbar("File size must be 10MB or less", "error");
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

            showSnackbar("Contributed successfully!", "success");
            setIsAddModalOpen(false);
            setResourceTitle("");
            setUploadFile(null);
            
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
                                Contributions <span className="text-green">Hub</span>
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg text-muted-foreground font-medium"
                            >
                                Connecting members through knowledge sharing.
                            </motion.p>

                            {/* Contribution status badge */}
                            {contributionStatus && !contributionStatus.isPremium && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${
                                        contributionStatus.remaining === 0
                                            ? 'bg-red-50 border-red-200 text-red-600'
                                            : contributionStatus.remaining !== null && contributionStatus.remaining <= 5
                                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                                            : 'bg-green/5 border-green/20 text-green'
                                    }`}
                                >
                                    <span className={`w-2 h-2 rounded-full ${contributionStatus.remaining === 0 ? 'bg-red-500' : 'bg-green'}`} />
                                    {contributionStatus.remaining === 0
                                        ? 'Monthly limit reached (0 / 30 left)'
                                        : `${contributionStatus.remaining} / 30 contributions remaining this month`}
                                </motion.div>
                            )}
                            {contributionStatus?.isPremium && (
                                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-amber-50 border border-amber-200 text-amber-700">
                                    ✦ Premium — Unlimited contributions
                                </div>
                            )}
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
                                <h2 className="text-2xl font-black text-[#112A46]">Recent Activity</h2>
                                <p className="text-sm text-muted-foreground font-medium mb-4">Latest shared resources</p>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="w-full flex justify-center items-center gap-2 bg-green text-white px-4 py-3 rounded-2xl font-bold hover:shadow-lg hover:shadow-green/30 hover:-translate-y-0.5 transition-all group"
                                >
                                    <Plus size={20} className="transition-transform group-hover:rotate-90" />
                                    Share Your Resources
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar bg-gradient-to-b from-transparent to-green/[0.02]">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <div key={i} className="bg-white p-5 rounded-[24px] border border-green/5 flex items-center gap-4 animate-pulse">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full shrink-0"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-50 rounded w-2/3"></div>
                                                <div className="h-3 bg-gray-50 rounded w-1/3"></div>
                                            </div>
                                        </div>
                                    ))
                                ) : recent.length > 0 ? (
                                recent.map((item, index) => {
                                    const avatarUrl = item.user.photoURL ? getPhotoURL(item.user.photoURL) : null;
                                    const fileUrl = getResourceURL(item.url);
                                    const fileType = getFileType(item.url);
                                    const isEven = index % 2 === 0;
                                    
                                    return (
                                        <motion.div 
                                            key={item._id}
                                            initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`flex items-end gap-3 group w-[85%] ${isEven ? 'self-start' : 'self-end flex-row-reverse'}`}
                                        >
                                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-green/10 bg-green/5 flex items-center justify-center relative z-10">
                                                {avatarUrl ? (
                                                    <Image src={avatarUrl} alt={item.user.displayName} fill className="object-cover" />
                                                ) : (
                                                    <span className="text-green font-black text-xs">{item.user.displayName.charAt(0)}</span>
                                                )}
                                            </div>

                                            <div className={`flex-1 min-w-0 p-4 py-3 border border-green/10 shadow-sm hover:shadow-md transition-all flex flex-col ${
                                                isEven 
                                                    ? 'rounded-t-[24px] rounded-br-[24px] rounded-bl-sm bg-white hover:border-green/20' 
                                                    : 'rounded-t-[24px] rounded-bl-[24px] rounded-br-sm bg-green/5 hover:border-green/30'
                                            }`}>
                                                <div className={`flex items-center gap-2 mb-1 ${isEven ? '' : 'flex-row-reverse'}`}>
                                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-green/10 text-green rounded-md">
                                                        {fileType}
                                                    </span>
                                                    <span className={`text-[11px] font-bold text-green/60 leading-none mt-0.5 ${isEven ? 'ml-auto' : 'mr-auto'}`}>
                                                        {formatTimeAgo(item.createdAt)}
                                                    </span>
                                                </div>
                                                <div className={`flex flex-col gap-1 ${isEven ? 'text-left' : 'text-right'}`}>
                                                    <h3 className="font-bold text-[#112A46] text-sm group-hover:text-green transition-colors leading-tight">
                                                        {item.resourceTitle}
                                                    </h3>
                                                    <p className="text-[11.5px] text-muted-foreground font-medium truncate">
                                                        {item.subjectTitle && item.subjectTitle !== 'General' ? item.subjectTitle : 'Subject'} • {item.lessonTitle && item.lessonTitle !== 'General' ? item.lessonTitle : 'Lesson'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <a 
                                                href={fileUrl || '#'} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={`w-8 h-8 rounded-full bg-white border border-green/10 text-green/60 flex items-center justify-center hover:bg-green hover:text-white transition-all shrink-0 shadow-sm self-center ${isEven ? 'ml-1' : 'mr-1'}`}
                                            >
                                                <Download size={14} />
                                            </a>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                    <div className="text-center py-12 px-6 rounded-[32px] border border-dashed border-gray-200/60 m-4">
                                        <FileText className="mx-auto text-gray-300 w-12 h-12 mb-4" />
                                        <p className="text-sm text-gray-400 font-bold">No recent shares yet</p>
                                    </div>
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
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 60 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            className="relative bg-white w-full md:max-w-xl mx-3 md:mx-0 rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden p-5 md:p-8 max-h-[92dvh] overflow-y-auto mb-3 md:mb-0"
                        >
                            {/* Drag handle — mobile only */}
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 md:hidden" />

                            <div className="flex items-center justify-between mb-5 md:mb-8">
                                <h3 className="text-xl md:text-2xl font-black text-[#112A46]">Contribute Resource</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                    <Plus className="rotate-45" size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddContribution} className="space-y-4 md:space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-widest text-[#112A46]/60 ml-2">Resource Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={resourceTitle}
                                        onChange={(e) => setResourceTitle(e.target.value)}
                                        placeholder="e.g. Physics Summary Chapter 1"
                                        className="w-full h-12 md:h-14 px-4 md:px-6 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-green/20 focus:bg-white transition-all outline-none font-bold text-[#112A46] text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-[#112A46]/60 ml-2">Subject</label>
                                        <select
                                            required
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            className="w-full h-12 md:h-14 px-3 md:px-6 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-green/20 focus:bg-white transition-all outline-none font-bold text-[#112A46] appearance-none text-sm"
                                        >
                                            <option value="">Select subject</option>
                                            {subjects.map(s => (
                                                <option key={s._id} value={s._id}>{s.title}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-[#112A46]/60 ml-2">Lesson</label>
                                        <select
                                            value={selectedLesson}
                                            onChange={(e) => setSelectedLesson(e.target.value)}
                                            disabled={!selectedSubject || lessons.length === 0}
                                            className="w-full h-12 md:h-14 px-3 md:px-6 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-green/20 focus:bg-white transition-all outline-none font-bold text-[#112A46] appearance-none disabled:opacity-50 text-sm"
                                        >
                                            <option value="">Select lesson</option>
                                            {lessons.map(l => (
                                                <option key={l._id} value={l._id}>{l.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-widest text-[#112A46]/60 ml-2">File</label>
                                    <input
                                        type="file"
                                        required
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="contribution-file"
                                    />
                                    <label
                                        htmlFor="contribution-file"
                                        className="flex flex-col items-center justify-center w-full h-24 md:h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-green/5 hover:border-green/20 transition-all cursor-pointer group"
                                    >
                                        {uploadFile ? (
                                            <div className="text-center px-4">
                                                <FileText className="mx-auto text-green w-6 h-6 mb-1" />
                                                <p className="text-sm font-bold text-dark truncate max-w-[200px]">{uploadFile.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                            </div>
                                        ) : (
                                            <>
                                                <Plus className="text-gray-300 group-hover:text-green mb-1" size={24} />
                                                <span className="text-sm font-bold text-gray-400">Upload PDF or Document</span>
                                            </>
                                        )}
                                    </label>
                                </div>

                                <button
                                    disabled={isUploading}
                                    type="submit"
                                    className="w-full h-12 md:h-16 bg-[#112A46] text-white rounded-2xl md:rounded-3xl font-black text-base md:text-lg hover:shadow-2xl hover:shadow-dark/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                >
                                    {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                    {isUploading ? "Uploading..." : "Publish Resource"}
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
                            <h3 className="text-2xl font-black text-dark">Monthly Limit Reached</h3>
                            <p className="text-muted-foreground">
                                You&apos;ve used all <strong>30 contributions</strong> for this month. Your count resets on the 1st of next month.
                                <br /><br />
                                Upgrade to <strong>Premium</strong> for unlimited contributions!
                            </p>
                            <div className="flex flex-col gap-3">
                                <a href="/pricing" className="w-full py-3 bg-green text-white font-bold rounded-2xl hover:shadow-lg transition-all text-center block">
                                    Upgrade to Premium
                                </a>
                                <button
                                    onClick={() => setShowLimitDialog(false)}
                                    className="w-full py-3 bg-gray-50 text-dark font-bold rounded-2xl hover:bg-gray-100 transition-all"
                                >
                                    OK, Got It
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
