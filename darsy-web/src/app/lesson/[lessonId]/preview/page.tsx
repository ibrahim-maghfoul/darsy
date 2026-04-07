"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Pause, Play, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateResourceProgress, markResourceComplete } from "@/services/progress";
import { useTranslations } from "next-intl";

export default function PreviewPage() {
    const searchParams = useSearchParams();
    const params = useParams();
    const router = useRouter();
    const { user, getResourceURL } = useAuth();
    const t = useTranslations("Lesson");
    const tc = useTranslations("Common");

    const lessonId = params.lessonId as string;
    const url = searchParams.get("url");
    const type = searchParams.get("type") || "pdf";
    const title = searchParams.get("title") || "Preview";
    const docId = searchParams.get("docId");

    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);
    const timerRef = useRef(0);
    const lastSavedTimerRef = useRef(0);

    useEffect(() => {
        timerRef.current = timer;
    }, [timer]);

    useEffect(() => {
        let interval: any;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
            // Save progress
            if (timerRef.current > lastSavedTimerRef.current && user && url) {
                const safeResourceId = docId || (typeof btoa !== 'undefined' ? btoa(encodeURIComponent(url)) : encodeURIComponent(url));
                updateResourceProgress({
                    lessonId,
                    resourceId: safeResourceId,
                    additionalTimeSpent: timerRef.current - lastSavedTimerRef.current,
                    completionPercentage: 0
                });
            }
        };
    }, [isTimerRunning, lessonId, user, url, docId]);

    const handleMarkComplete = async () => {
        if (!url || !user) return;
        const safeResourceId = docId || (typeof btoa !== 'undefined' ? btoa(encodeURIComponent(url)) : encodeURIComponent(url));
        try {
            await markResourceComplete({
                lessonId,
                subjectId: "", // Not strictly needed for the API call if it handles it
                resourceId: safeResourceId,
                resourceType: type,
                isCompleted: true
            });
            setIsCompleted(true);
        } catch (error) {
            console.error("Failed to mark complete:", error);
        }
    };

    if (!url) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>No preview URL provided.</p>
            </div>
        );
    }

    const fullUrl = getResourceURL(url) || url;

    return (
        <div className="fixed inset-0 bg-white z-[500] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                <button 
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 px-4 truncate">
                    <h1 className="font-bold text-sm truncate">{title}</h1>
                </div>
                <div className="bg-dark/90 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                    <Clock size={14} className="text-green" />
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-gray-100 relative">
                <iframe 
                    src={fullUrl}
                    className="w-full h-full border-none"
                    allowFullScreen
                />
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between">
                <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${isTimerRunning ? 'bg-gray-100 text-gray-600' : 'bg-green text-white shadow-lg shadow-green/20'}`}
                >
                    {isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
                    {isTimerRunning ? "Pause" : "Resume"}
                </button>

                <button
                    onClick={handleMarkComplete}
                    disabled={isCompleted}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${isCompleted ? 'bg-green text-white' : 'bg-green/10 text-green active:scale-95'}`}
                >
                    <CheckCircle2 size={18} />
                    {isCompleted ? "Completed" : "Mark as Done"}
                </button>
            </div>
        </div>
    );
}
