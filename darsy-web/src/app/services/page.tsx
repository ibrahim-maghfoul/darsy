"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Database,
    ChevronRight,
    Calendar,
    School,
    Info,
    ArrowLeft,
    Clock,
    LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { getSchoolServices } from "@/services/services";
import { useLocale, useTranslations } from "next-intl";

export default function ServicesPage() {
    const locale = useLocale();
    const isAr = locale === 'ar';
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const data = await getSchoolServices();
            setServices(data);
            setLoading(false);
        };
        fetch();
    }, []);

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'calendar_today': return <Calendar size={28} />;
            case 'school': return <School size={28} />;
            case 'info': return <Info size={28} />;
            default: return <Database size={28} />;
        }
    };

    return (
        <div className="min-h-screen bg-white pb-20 pt-32">
            <div className="max-w-5xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                    <div className="space-y-2 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 text-green mb-4">
                            <div className="p-3 rounded-2xl bg-green/10">
                                <LayoutGrid size={24} />
                            </div>
                            <span className="font-bold uppercase tracking-widest text-sm">Official Hub</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-dark">Services & Info</h1>
                        <p className="text-muted-foreground text-lg">Official educational resources and school information for Morocco.</p>
                    </div>
                    <Link
                        href="/profile"
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-dark text-white font-bold hover:shadow-xl transition-all"
                    >
                        <ArrowLeft size={20} className={isAr ? "rotate-180" : ""} />
                        Back to Profile
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-40 rounded-[32px] bg-green/5 animate-pulse border border-green/10" />
                        ))}
                    </div>
                ) : services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {services.map((service, i) => (
                            <motion.div
                                key={service._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Link
                                    href={`/services/${service._id}`}
                                    className="group block p-8 rounded-[40px] bg-white border border-green/10 hover:border-green hover:shadow-2xl hover:shadow-green/5 transition-all relative overflow-hidden h-full"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-green/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-green/10 transition-colors" />

                                    <div className="flex items-start gap-6 relative z-10">
                                        <div className="w-16 h-16 rounded-2xl bg-green/5 text-green flex items-center justify-center group-hover:scale-110 transition-transform">
                                            {getIcon(service.icon)}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 rounded-full bg-green/10 text-green text-[10px] font-black uppercase tracking-widest">{service.category}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-dark group-hover:text-green transition-colors">{service.title}</h3>
                                            <p className="text-muted-foreground text-sm line-clamp-2">{service.description}</p>
                                        </div>
                                        <div className="self-center">
                                            <div className="w-10 h-10 rounded-full border border-green/10 flex items-center justify-center text-green group-hover:bg-green group-hover:text-white transition-all">
                                                <ChevronRight size={20} className={isAr ? "rotate-180" : ""} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center bg-green/5 rounded-[40px] border-2 border-dashed border-green/20">
                        <Database size={48} className="mx-auto text-green/20 mb-4" />
                        <h3 className="text-xl font-bold text-dark">No services available</h3>
                        <p className="text-muted-foreground">Check back later for new updates.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
