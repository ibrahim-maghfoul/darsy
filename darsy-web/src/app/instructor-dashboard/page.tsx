'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { getGuidances, getSubjects } from '@/services/data';
import {
    GraduationCap, Upload, Video, FileText, Trash2,
    Plus, X, CheckCircle, Loader2, BookOpen, Clock,
    Camera, Eye, Download, Star, Settings, MessageSquare, LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

function coverURL(url?: string | null) {
    if (!url) return null;
    return url.startsWith('http') ? url : `/data/images/cover-photos/${url}`;
}

interface Course {
    _id: string;
    title: string;
    description?: string;
    videoUrl?: string;
    pdfUrl?: string;
    guidanceId: string;
    subjectId: string;
    viewCount: number;
    downloadCount: number;
    createdAt: string;
}

interface InstructorProfile {
    averageRating: number;
    totalRatings: number;
}

interface AppData {
    specialist: string;
    targetLevelId: string;
    targetGuidanceId: string;
    targetSubjectId: string;
    guidanceName: string;
    subjectName: string;
}

export default function InstructorDashboardPage() {
    const { user, loading: authLoading, checkAuth, getPhotoURL, logout } = useAuth();
    const router = useRouter();

    const [appData, setAppData] = useState<AppData | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [instructorProfile, setInstructorProfile] = useState<InstructorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasTeacherAccess, setHasTeacherAccess] = useState(false);

    const [localPhoto, setLocalPhoto] = useState<string | null>(null);
    const [localCover, setLocalCover] = useState<string | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [coverUploading, setCoverUploading] = useState(false);
    const photoRef = useRef<HTMLInputElement>(null);
    const coverRef = useRef<HTMLInputElement>(null);

    const [showUpload, setShowUpload] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    // Pre-load the teacher dashboard so switching is instant
    useEffect(() => { router.prefetch('/teacher/dashboard'); }, [router]);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
        if (!authLoading && user && user.role !== 'instructor' && user.role !== 'teacher' && user.role !== 'admin') router.push('/profile');
    }, [user?.id, authLoading, router]);

    const hasFetchedRef = useRef(false);
    useEffect(() => {
        if (!user?.id || hasFetchedRef.current) return;
        hasFetchedRef.current = true;
        // Admin always has teacher access
        if (user.role === 'admin') { setHasTeacherAccess(true); fetchDashboard(); return; }
        // Teacher arriving here means they also have instructor access (routed from profile "both" case)
        if (user.role === 'teacher') { setHasTeacherAccess(true); fetchDashboard(); return; }
        // Instructor: fetch dashboard + check if also has teacher verification
        if (user.role === 'instructor') {
            fetchDashboard();
            api.get('/teacher/verify/me')
                .then(res => { if (res.data?.status === 'approved') setHasTeacherAccess(true); })
                .catch(() => {});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const [appRes, coursesRes, profileRes] = await Promise.all([
                api.get('/teacher/applications/me'),
                api.get('/instructor/courses/me'),
                api.get(`/instructor/${user!.id}`).catch(() => ({ data: null })),
            ]);
            if (profileRes.data) {
                setInstructorProfile({
                    averageRating: profileRes.data.averageRating || 0,
                    totalRatings: profileRes.data.totalRatings || 0,
                });
            }
            const approved = (appRes.data || []).find((a: any) => a.status === 'approved');
            if (approved) {
                const [guidances, subjects] = await Promise.all([
                    getGuidances(approved.targetLevelId),
                    getSubjects(approved.targetGuidanceId),
                ]);
                const guidance = guidances.find((g: any) => g.id === approved.targetGuidanceId || g._id === approved.targetGuidanceId);
                const subject = subjects.find((s: any) => s.id === approved.targetSubjectId || s._id === approved.targetSubjectId);
                setAppData({
                    specialist: approved.specialist,
                    targetLevelId: approved.targetLevelId,
                    targetGuidanceId: approved.targetGuidanceId,
                    targetSubjectId: approved.targetSubjectId,
                    guidanceName: guidance?.title || approved.targetGuidanceId,
                    subjectName: subject?.title || approved.targetSubjectId,
                });
            }
            setCourses(coursesRes.data || []);
        } catch (err) {
            console.error('Dashboard fetch error', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setPhotoUploading(true);
        setLocalPhoto(URL.createObjectURL(f));
        try {
            const fd = new FormData();
            fd.append('photo', f);
            await api.post('/instructor/profile/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            await checkAuth();
            setLocalPhoto(null);
        } catch {
            setLocalPhoto(null);
            alert('Failed to upload photo');
        } finally {
            setPhotoUploading(false);
        }
    };

    const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setCoverUploading(true);
        setLocalCover(URL.createObjectURL(f));
        try {
            const fd = new FormData();
            fd.append('cover', f);
            await api.post('/instructor/profile/cover', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            await checkAuth();
            setLocalCover(null);
        } catch {
            setLocalCover(null);
            alert('Failed to upload cover photo');
        } finally {
            setCoverUploading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title || !appData) return;
        setUploading(true);
        setUploadProgress(0);
        setUploadError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', title);
            formData.append('description', description);
            formData.append('guidanceId', appData.targetGuidanceId);
            formData.append('subjectId', appData.targetSubjectId);
            const res = await api.post('/instructor/courses/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
                },
            });
            setCourses(prev => [res.data.course, ...prev]);
            setUploadSuccess(true);
            setTitle(''); setDescription(''); setFile(null);
            if (fileRef.current) fileRef.current.value = '';
            setTimeout(() => { setUploadSuccess(false); setShowUpload(false); }, 2000);
        } catch (err: any) {
            setUploadError(err.response?.data?.error || 'Upload failed');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this course?')) return;
        try {
            await api.delete(`/instructor/courses/${id}`);
            setCourses(prev => prev.filter(c => c._id !== id));
        } catch {
            alert('Failed to delete course');
        }
    };

    const fileType = file
        ? ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'].includes(file.type) ? 'video' : 'pdf'
        : null;

    // Only block on auth loading — page data loads inline as skeleton
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <Loader2 className="animate-spin text-green" size={36} />
            </div>
        );
    }

    if (!user || (user.role !== 'instructor' && user.role !== 'teacher' && user.role !== 'admin')) return null;
    const currentPhoto = localPhoto || getPhotoURL(user.photoURL);
    const currentCover = localCover || coverURL(user.coverPhotoURL);
    const totalViews = courses.reduce((s, c) => s + (c.viewCount || 0), 0);
    const totalDownloads = courses.reduce((s, c) => s + (c.downloadCount || 0), 0);

    return (
        <main className="min-h-screen bg-[#F8F9FA] pb-20">

            {/* ── Cover + Profile Hero ── */}
            <div className="relative w-full h-60 md:h-72 overflow-hidden bg-gradient-to-br from-[#0a2a1a] to-[#166534]">
                {currentCover ? (
                    <Image src={currentCover} alt="cover" fill className="object-cover" unoptimized />
                ) : (
                    <div
                        className="absolute inset-0"
                        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Edit cover */}
                <button
                    onClick={() => coverRef.current?.click()}
                    disabled={coverUploading}
                    className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl text-xs font-semibold text-white hover:bg-white/25 transition-all z-10"
                >
                    {coverUploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                    Edit Cover
                </button>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

                {/* Profile info */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-5 flex items-end justify-between gap-4 z-10">
                    <div className="flex items-end gap-4">
                        {/* Avatar with photo upload */}
                        <div className="relative flex-shrink-0">
                            <div className="w-20 h-20 rounded-[20px] border-[3px] border-white/30 shadow-2xl overflow-hidden bg-gradient-to-br from-green to-green/60 relative">
                                {currentPhoto ? (
                                    <Image src={currentPhoto} alt={user.displayName} fill className="object-cover" unoptimized />
                                ) : (
                                    <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">
                                        {user.displayName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            {/* Camera button */}
                            <button
                                onClick={() => photoRef.current?.click()}
                                disabled={photoUploading}
                                className="absolute -bottom-1 -right-1 w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-md border border-gray-100 hover:bg-gray-50 transition-all"
                                title="Change photo"
                            >
                                {photoUploading ? <Loader2 size={12} className="animate-spin text-green" /> : <Camera size={12} className="text-dark/70" />}
                            </button>
                            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                        </div>

                        <div className="pb-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <GraduationCap className="text-green-300" size={13} />
                                <span className="text-[11px] font-bold text-green-300 uppercase tracking-widest">Instructor</span>
                            </div>
                            <h1 className="text-xl font-bold text-white leading-tight">{user.displayName}</h1>
                            {appData && (
                                <p className="text-white/55 text-sm mt-0.5 line-clamp-1">
                                    {appData.specialist} · {appData.guidanceName} · {appData.subjectName}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 mb-1">
                        <Link
                            href="/settings"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-white text-xs font-semibold hover:bg-white/25 transition-all"
                        >
                            <Settings size={13} />
                            Edit Info
                        </Link>
                        <button
                            onClick={() => logout().then(() => router.push("/"))}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-xl text-red-200 text-xs font-semibold hover:bg-red-500/35 transition-all"
                        >
                            <LogOut size={13} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Dashboard tab switcher ── */}
            {(user?.role === 'teacher' || user?.role === 'admin' || hasTeacherAccess) && (
                <div className="flex justify-center py-3 bg-[#F8F9FA] border-b border-gray-100">
                    <div className="flex gap-1 p-1 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <Link
                            href="/teacher/dashboard"
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-dark/40 hover:text-dark/70 hover:bg-gray-50 text-sm font-black transition-all"
                        >
                            <MessageSquare size={14} /> Teacher
                        </Link>
                        <div className="flex items-center gap-2 px-5 py-2 rounded-xl bg-green text-white text-sm font-black">
                            <Video size={14} /> Instructor
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto px-4 sm:px-6">

                {/* ── Action Buttons ── */}
                <div className="flex gap-3 pt-5 mb-6">
                    <Link
                        href={`/instructor/${user.id}`}
                        className="px-4 py-2 border border-green text-green rounded-xl font-semibold text-sm hover:bg-green/5 transition-all"
                    >
                        View Public Profile
                    </Link>
                    <button
                        onClick={() => { setShowUpload(true); setUploadError(''); }}
                        className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green/90 shadow-lg shadow-green/20 active:scale-95 transition-all"
                    >
                        <Plus size={16} /> Upload Course
                    </button>
                </div>

                {/* ── Stats Grid ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
                    {[
                        { value: courses.length, label: 'Total Courses', icon: BookOpen, iconColor: 'text-green', iconBg: 'bg-green/10' },
                        { value: totalViews, label: 'Total Views', icon: Eye, iconColor: 'text-blue-500', iconBg: 'bg-blue-50' },
                        { value: totalDownloads, label: 'Downloads', icon: Download, iconColor: 'text-purple-500', iconBg: 'bg-purple-50' },
                        {
                            value: instructorProfile?.averageRating ? instructorProfile.averageRating.toFixed(1) : '—',
                            label: `${instructorProfile?.totalRatings ?? 0} Ratings`,
                            icon: Star, iconColor: 'text-amber-500', iconBg: 'bg-amber-50',
                        },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <p className="text-3xl font-bold text-dark">{stat.value}</p>
                                <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                                    <stat.icon size={17} className={stat.iconColor} />
                                </div>
                            </div>
                            <p className="text-sm text-dark/50">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* ── Courses Section ── */}
                <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                            <BookOpen size={18} className="text-green" />
                            My Courses
                        </h2>
                        <span className="text-sm text-dark/40 font-medium">{courses.length} total</span>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                                    <div className="h-4 w-1/2 bg-gray-100 rounded-lg mb-3" />
                                    <div className="h-3 w-3/4 bg-gray-100 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-green/5 flex items-center justify-center mx-auto mb-4">
                                <BookOpen size={24} className="text-green/35" />
                            </div>
                            <p className="font-semibold text-dark/60">No courses uploaded yet</p>
                            <p className="text-sm text-dark/40 mt-1">Click "Upload Course" to get started</p>
                            <button
                                onClick={() => { setShowUpload(true); setUploadError(''); }}
                                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-green text-white rounded-xl text-sm font-bold shadow-lg shadow-green/20"
                            >
                                <Plus size={15} /> Upload Course
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {courses.map((course, i) => {
                                const isVideo = !!course.videoUrl;
                                return (
                                    <motion.div
                                        key={course._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.04 + 0.3 }}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:border-green/25 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                                    >
                                        {/* File type icon */}
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${isVideo ? 'bg-blue-50' : 'bg-red-50'}`}>
                                            {isVideo
                                                ? <Video size={20} className="text-blue-500" />
                                                : <FileText size={20} className="text-red-500" />
                                            }
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-dark truncate">{course.title}</h3>
                                            {course.description && (
                                                <p className="text-sm text-dark/55 mt-0.5 line-clamp-1">{course.description}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${isVideo ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                                    {isVideo ? 'Video' : 'PDF'}
                                                </span>
                                                <span className="text-xs text-dark/40 flex items-center gap-1">
                                                    <Eye size={11} /> {course.viewCount || 0}
                                                </span>
                                                <span className="text-xs text-dark/40 flex items-center gap-1">
                                                    <Download size={11} /> {course.downloadCount || 0}
                                                </span>
                                                <span className="text-xs text-dark/40 flex items-center gap-1">
                                                    <Clock size={11} /> {new Date(course.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDelete(course._id)}
                                            className="p-2 hover:bg-red-50 text-dark/30 hover:text-red-400 rounded-xl transition-all flex-shrink-0 group/btn"
                                            title="Delete course"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.section>
            </div>

            {/* ── Upload Modal ── */}
            <AnimatePresence>
                {showUpload && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
                        onClick={() => !uploading && setShowUpload(false)}
                    >
                        <motion.div
                            initial={{ y: 48, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 48, opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            {/* Modal header */}
                            <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100">
                                <div>
                                    <h2 className="text-xl font-bold text-dark">Upload New Course</h2>
                                    {appData && (
                                        <p className="text-xs text-dark/45 mt-0.5">
                                            {appData.guidanceName} · {appData.subjectName}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowUpload(false)}
                                    disabled={uploading}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-all disabled:opacity-40"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleUpload} className="p-6 space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="text-[11px] font-bold text-dark/50 mb-1.5 block uppercase tracking-wider">Title *</label>
                                    <input
                                        type="text" value={title} onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g. Chapter 3 — Derivatives" required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green outline-none text-sm transition-colors"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-[11px] font-bold text-dark/50 mb-1.5 block uppercase tracking-wider">Description</label>
                                    <textarea
                                        value={description} onChange={e => setDescription(e.target.value)}
                                        placeholder="Brief description..." rows={2}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green outline-none text-sm resize-none transition-colors"
                                    />
                                </div>

                                {/* File drop zone */}
                                <div>
                                    <label className="text-[11px] font-bold text-dark/50 mb-1.5 block uppercase tracking-wider">File * (Video or PDF)</label>
                                    <div
                                        onClick={() => fileRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${file ? 'border-green bg-green/5' : 'border-gray-200 hover:border-green/50 hover:bg-gray-50'}`}
                                    >
                                        {file ? (
                                            <div className="flex items-center justify-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${fileType === 'video' ? 'bg-blue-50' : 'bg-red-50'}`}>
                                                    {fileType === 'video'
                                                        ? <Video className="text-blue-500" size={20} />
                                                        : <FileText className="text-red-500" size={20} />
                                                    }
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <p className="font-semibold text-dark text-sm truncate">{file.name}</p>
                                                    <p className="text-xs text-dark/50">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                                                    className="p-1.5 hover:bg-red-50 text-dark/40 hover:text-red-500 rounded-lg transition-all"
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="text-dark/25 mx-auto mb-2" size={28} />
                                                <p className="text-sm font-semibold text-dark/55">Click to select file</p>
                                                <p className="text-xs text-dark/35 mt-1">MP4, WebM, MOV, AVI, MKV or PDF · max 500MB</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        ref={fileRef} type="file"
                                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,application/pdf"
                                        className="hidden" onChange={e => setFile(e.target.files?.[0] || null)}
                                    />
                                </div>

                                {/* Upload progress */}
                                {uploading && (
                                    <div>
                                        <div className="flex justify-between text-xs text-dark/50 mb-1.5">
                                            <span>Uploading...</span>
                                            <span className="font-semibold text-green">{uploadProgress}%</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-green rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${uploadProgress}%` }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Status messages */}
                                {uploadSuccess && (
                                    <div className="flex items-center gap-2 text-green text-sm font-semibold bg-green/5 border border-green/20 rounded-xl px-3 py-2">
                                        <CheckCircle size={16} /> Uploaded successfully!
                                    </div>
                                )}
                                {uploadError && (
                                    <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2">{uploadError}</p>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="button" onClick={() => setShowUpload(false)}
                                        disabled={uploading}
                                        className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-sm text-dark/55 hover:bg-gray-50 transition-all disabled:opacity-40"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit" disabled={!file || !title || uploading}
                                        className="flex-1 py-3 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green/90 shadow-lg shadow-green/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {uploading
                                            ? <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                                            : <><Upload size={16} /> Upload</>
                                        }
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
