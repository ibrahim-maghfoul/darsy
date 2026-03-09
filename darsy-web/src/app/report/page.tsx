"use client";

import { useState } from "react";
import {
    Send,
    Flag,
    MessageSquare,
    Lightbulb,
    AlertCircle,
    CheckCircle2,
    ChevronRight
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import api from "@/lib/api";

export default function ReportPage() {
    const [type, setType] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await api.post("/user/report", {
                type,
                title,
                description
            });
            setSubmitted(true);
        } catch (err: any) {
            console.error("Report submission error:", err);
            setError(err.response?.data?.error || "Failed to submit report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const types = [
        { id: "bug", label: "Report a Bug", icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
        { id: "suggestion", label: "Suggest a Feature", icon: Lightbulb, color: "text-yellow-500", bg: "bg-yellow-50" },
        { id: "feedback", label: "General Feedback", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-50" },
    ];

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full text-center space-y-8 p-12 rounded-[48px] bg-white border border-green/10 shadow-2xl shadow-green/5"
                >
                    <div className="w-24 h-24 rounded-full bg-green text-white flex items-center justify-center mx-auto shadow-xl shadow-green/20">
                        <CheckCircle2 size={48} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold text-dark">Thank You!</h2>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            Your report has been received. Our team will review it and get back to you if necessary.
                        </p>
                    </div>
                    <button
                        onClick={() => setSubmitted(false)}
                        className="w-full py-4 rounded-2xl bg-green text-white font-bold hover:scale-105 transition-all shadow-xl shadow-green/20"
                    >
                        Submit Another Report
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-20 px-[clamp(16px,5vw,48px)] bg-gradient-to-b from-white to-green/5">
            <div className="max-w-3xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 text-green text-sm font-bold uppercase tracking-wider">
                        <Flag size={16} />
                        Support Center
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tight text-dark">How can we improve?</h1>
                    <p className="text-xl text-muted-foreground">Your feedback helps us build a better learning platform for everyone.</p>
                </div>

                <div className="bg-white p-8 md:p-12 rounded-[48px] border border-green/10 shadow-2xl shadow-green/5 space-y-12">
                    {/* Step 1: Type Selection */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-dark flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-green text-white text-xs flex items-center justify-center font-bold">1</span>
                            Select Report Type
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {types.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setType(t.id)}
                                    className={`flex flex-col items-center gap-4 p-6 rounded-[32px] border transition-all ${type === t.id
                                        ? `bg-white border-green ring-4 ring-green/5 shadow-xl`
                                        : `bg-white border-green/10 hover:border-green/30`
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl ${t.bg} ${t.color} flex items-center justify-center`}>
                                        <t.icon size={24} />
                                    </div>
                                    <span className="font-bold text-sm text-dark">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Form Details */}
                    <form onSubmit={handleSubmit} className={`space-y-8 transition-opacity duration-500 ${type ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold text-dark flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-green text-white text-xs flex items-center justify-center font-bold">2</span>
                                Details
                            </h2>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-dark/60 ml-2">Title</label>
                                    <input
                                        required={!!type}
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Short summary of the issue or suggestion"
                                        className="w-full px-6 py-4 rounded-2xl bg-green/5 border border-transparent focus:bg-white focus:border-green outline-none font-medium transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-dark/60 ml-2">Description</label>
                                    <textarea
                                        required={!!type}
                                        rows={5}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Please provide as much detail as possible..."
                                        className="w-full px-6 py-4 rounded-2xl bg-green/5 border border-transparent focus:bg-white focus:border-green outline-none font-medium transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !type}
                            className={`w-full py-5 rounded-[24px] bg-green text-white text-lg font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-green/20 flex items-center justify-center gap-3 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                            {loading ? "Submitting..." : "Submit Report"}
                            {!loading && <Send size={20} />}
                        </button>
                    </form>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-10 rounded-[40px] bg-dark text-white overflow-hidden relative">
                    <div className="relative z-10 space-y-2 text-center md:text-left">
                        <h3 className="text-2xl font-bold">Contact Support</h3>
                        <p className="text-white/60">Prefer to speak with us directly? Reach out anytime.</p>
                    </div>
                    <Link
                        href="/contact"
                        className="relative z-10 px-10 py-4 rounded-2xl bg-white text-dark font-extrabold hover:bg-green hover:text-white transition-all flex items-center gap-2 group"
                    >
                        Contact Us
                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green opacity-20 blur-[100px] pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
