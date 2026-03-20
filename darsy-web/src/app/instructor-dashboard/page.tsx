'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { getGuidances, getSubjects } from '@/services/data';
import {
    GraduationCap, Upload, Video, FileText, Trash2,
    Plus, X, CheckCircle, Loader2, BookOpen, Clock,
    Camera, Eye, Download, Star, Settings,
} from 'lucide-react';
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

interface AppData {
    specialist: string;
    targetLevelId: string;
    targetGuidanceId: string;
    targetSubjectId: string;
    guidanceName: string;
    subjectName: string;
}

export default function InstructorDashboardPage() {
    const { user, loading: authLoading, checkAuth, getPhotoURL } = useAuth();
    const router = useRouter();

    const [appData, setAppData] = useState<AppData | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    // Cover / avatar local state (optimistic)
    const [localPhoto, setLocalPhoto] = useState<string | null>(null);
    const [localCover, setLocalCover] = useState<string | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [coverUploading, setCoverUploading] = useState(false);
    const photoRef = useRef<HTMLInputElement>(null);
    const coverRef = useRef<HTMLInputElement>(null);

    // Upload form state
    const [showUpload, setShowUpload] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
        if (!authLoading && user && user.role !== 'instructor') router.push('/profile');
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user?.role === 'instructor') fetchDashboard();
    }, [user]);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const [appRes, coursesRes] = await Promise.all([
                api.get('/teacher/applications/me'),
                api.get('/instructor/courses/me'),
            ]);

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
            await api.post('/instructor/profile/photo', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
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
            await api.post('/instructor/profile/cover', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
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

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-green" size={36} />
            </div>
        );
    }

    if (!user || user.role !== 'instructor') return null;

    const currentPhoto = localPhoto || getPhotoURL(user.photoURL);
    const currentCover = localCover || coverURL(user.coverPhotoURL);

    return (
        <main className="min-h-screen bg-gray-50 pb-16">

            {/* ── Cover photo + profile overlay ── */}
            <div className="relative w-full h-60 md:h-72 overflow-hidden bg-gradient-to-br from-[#0a2a1a] to-[#166534]">
                {currentCover ? (
                    <Image src={currentCover} alt="cover" fill className="object-cover" unoptimized />
                ) : (
                    <div className="absolute inset-0"
                        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1.5px, transparent 1.5px)', backgroundSize: '22px 22px' }}
                    />
                )}
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Edit cover button — top right */}
                <button
                    onClick={() => coverRef.current?.click()}
                    disabled={coverUploading}
                    className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl text-xs font-semibold text-white hover:bg-white/25 transition-all z-10"
                >
                    {coverUploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                    Edit Cover
                </button>
                <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

                {/* Profile info — bottom of cover */}
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-5 flex items-end justify-between gap-4 z-10">
                    <div className="flex items-end gap-4">
                        {/* Avatar — no edit, just display */}
                        <div className="w-20 h-20 rounded-[20px] border-[3px] border-white/30 shadow-2xl overflow-hidden bg-gradient-to-br from-green to-green/60 flex-shrink-0 relative">
                            {currentPhoto ? (
                                <Image src={currentPhoto} alt={user.displayName} fill className="object-cover" unoptimized />
                            ) : (
                                <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">{user.displayName.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="pb-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <GraduationCap className="text-green-300" size={13} />
                                <span className="text-[11px] font-bold text-green-300 uppercase tracking-widest">Instructor</span>
                            </div>
                            <h1 className="text-xl font-bold text-white leading-tight">{user.displayName}</h1>
                            {appData && (
                                <p className="text-white/60 text-sm mt-0.5 line-clamp-1">{appData.specialist} · {appData.guidanceName} · {appData.subjectName}</p>
                            )}
                        </div>
                    </div>
                    <Link
                        href="/settings"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-white text-xs font-semibold hover:bg-white/25 transition-all flex-shrink-0 mb-1"
                    >
                        <Settings size={13} />
                        Edit Info
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6">

                {/* ── Action buttons ── */}
                <div className="flex gap-3 pt-5 mb-6">
                    <Link
                        href={`/instructor/${user.id}`}
                        className="px-4 py-2 border border-green text-green rounded-xl font-semibold text-sm hover:bg-green/10 transition-all"
                    >
                        View Public Profile
                    </Link>
                    <button
                        onClick={() => { setShowUpload(true); setUploadError(''); }}
                        className="flex items-center gap-2 px-4 py-2 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green/80 transition-all"
                    >
                        <Plus size={16} /> Upload Course
                    </button>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <p className="text-3xl font-bold text-dark">{courses.length}</p>
                        <p className="text-sm text-dark/60 mt-1 flex items-center gap-1.5"><BookOpen size={14} /> Total Courses</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <p className="text-3xl font-bold text-dark">{courses.filter(c => c.videoUrl).length}</p>
                        <p className="text-sm text-dark/60 mt-1 flex items-center gap-1.5"><Video size={14} /> Video Courses</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <p className="text-3xl font-bold text-dark">
                            {courses.reduce((s, c) => s + (c.viewCount || 0), 0)}
                        </p>
                        <p className="text-sm text-dark/60 mt-1 flex items-center gap-1.5"><Eye size={14} /> Total Views</p>
                    </div>
                </div>

                {/* ── Upload Modal ── */}
                {showUpload && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-dark">Upload New Course</h2>
                                <button onClick={() => setShowUpload(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleUpload} className="p-6 space-y-4">
                                {appData && (
                                    <div className="bg-green/5 border border-green/20 rounded-xl p-3 flex flex-wrap gap-3">
                                        <span className="text-xs font-semibold text-green">{appData.guidanceName}</span>
                                        <span className="text-xs text-dark/40">·</span>
                                        <span className="text-xs font-semibold text-green">{appData.subjectName}</span>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-bold text-dark/70 mb-1.5 block">Title *</label>
                                    <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                                        placeholder="e.g. Chapter 3 — Derivatives" required
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-dark/70 mb-1.5 block">Description</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                                        placeholder="Brief description..." rows={3}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green outline-none text-sm resize-none" />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-dark/70 mb-1.5 block">File * (Video or PDF)</label>
                                    <div onClick={() => fileRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${file ? 'border-green bg-green/5' : 'border-gray-200 hover:border-green/50'}`}>
                                        {file ? (
                                            <div className="flex items-center justify-center gap-3">
                                                {fileType === 'video' ? <Video className="text-green" size={24} /> : <FileText className="text-green" size={24} />}
                                                <div className="text-left">
                                                    <p className="font-semibold text-dark text-sm truncate max-w-[240px]">{file.name}</p>
                                                    <p className="text-xs text-dark/50">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                                </div>
                                                <button type="button" onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                                                    className="p-1 hover:bg-red-50 text-dark/40 hover:text-red-500 rounded-lg transition-all ml-auto">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="text-dark/30 mx-auto mb-2" size={28} />
                                                <p className="text-sm font-semibold text-dark/60">Click to select file</p>
                                                <p className="text-xs text-dark/40 mt-1">MP4, WebM, MOV, AVI, MKV or PDF · max 500MB</p>
                                            </>
                                        )}
                                    </div>
                                    <input ref={fileRef} type="file"
                                        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,application/pdf"
                                        className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                                </div>
                                {uploading && (
                                    <div>
                                        <div className="flex justify-between text-xs text-dark/60 mb-1">
                                            <span>Uploading...</span><span>{uploadProgress}%</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-green transition-all duration-300 rounded-full" style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                    </div>
                                )}
                                {uploadSuccess && (
                                    <div className="flex items-center gap-2 text-green text-sm font-semibold">
                                        <CheckCircle size={16} /> Uploaded successfully!
                                    </div>
                                )}
                                {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowUpload(false)}
                                        className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-sm text-dark/60 hover:bg-gray-50 transition-all">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={!file || !title || uploading}
                                        className="flex-1 py-3 bg-green text-white rounded-xl font-semibold text-sm hover:bg-green/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Upload</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ── Courses List ── */}
                <div>
                    <h2 className="text-xl font-bold text-dark mb-4">My Courses</h2>
                    {courses.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                            <BookOpen className="text-dark/20 mx-auto mb-3" size={40} />
                            <p className="font-semibold text-dark/60">No courses uploaded yet</p>
                            <p className="text-sm text-dark/40 mt-1">Click "Upload Course" to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {courses.map(course => (
                                <div key={course._id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:border-green/30 hover:shadow-md transition-all duration-200">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${course.videoUrl ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
                                        {course.videoUrl ? <Video size={20} /> : <FileText size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-dark truncate">{course.title}</h3>
                                        {course.description && (
                                            <p className="text-sm text-dark/60 mt-0.5 line-clamp-1">{course.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${course.videoUrl ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                                                {course.videoUrl ? 'Video' : 'PDF'}
                                            </span>
                                            <span className="text-xs text-dark/40 flex items-center gap-1">
                                                <Eye size={11} /> {course.viewCount || 0} views
                                            </span>
                                            <span className="text-xs text-dark/40 flex items-center gap-1">
                                                <Download size={11} /> {course.downloadCount || 0} downloads
                                            </span>
                                            <span className="text-xs text-dark/40 flex items-center gap-1">
                                                <Clock size={11} /> {new Date(course.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(course._id)}
                                        className="p-2 hover:bg-red-50 text-dark/30 hover:text-red-500 rounded-xl transition-all flex-shrink-0"
                                        title="Delete course">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
