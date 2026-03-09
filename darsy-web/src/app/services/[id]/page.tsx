"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Calendar,
    School,
    Info,
    Database,
    Download,
    ExternalLink,
    FileText,
    Image as ImageIcon,
    Check
} from "lucide-react";
import Link from "next/link";
import { getSchoolServiceById } from "@/services/services";
import { useLocale } from "next-intl";

export default function ServiceDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const locale = useLocale();
    const isAr = locale === 'ar';
    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const data = await getSchoolServiceById(id as string);
            setService(data);
            setLoading(false);
        };
        fetch();
    }, [id]);

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'calendar_today': return <Calendar size={40} />;
            case 'school': return <School size={40} />;
            case 'info': return <Info size={40} />;
            default: return <Database size={40} />;
        }
    };

    const renderBlocks = (blocks: any[]) => {
        return blocks.map((block, index) => {
            const type = block.type;
            const text = block.text || "";
            const isBold = block.style?.is_bold;

            switch (type) {
                case 'text':
                    const subtype = block.subtype || 'p';
                    const isRtl = block.is_arabic;
                    if (subtype.startsWith('h')) {
                        const Tag = subtype as any;
                        const fontSize = subtype === 'h1' ? 'text-3xl' : subtype === 'h2' ? 'text-2xl' : 'text-xl';
                        return (
                            <Tag key={index} className={`${fontSize} font-bold mt-8 mb-4 ${isRtl ? 'text-right' : 'text-left'} ${block.link ? 'text-green hover:underline cursor-pointer' : 'text-dark'}`} dir={isRtl ? "rtl" : "ltr"}>
                                {block.link ? (
                                    <a href={block.link} target="_blank" rel="noopener noreferrer">{text}</a>
                                ) : text}
                            </Tag>
                        );
                    }
                    return (
                        <p
                            key={index}
                            className={`text-lg leading-relaxed mb-4 ${isRtl ? 'text-right' : 'text-left'} ${isBold ? 'font-bold' : ''} ${block.link ? 'text-green hover:underline cursor-pointer' : 'text-dark/80'}`}
                            dir={isRtl ? "rtl" : "ltr"}
                        >
                            {block.link ? (
                                <a href={block.link} target="_blank" rel="noopener noreferrer">{text}</a>
                            ) : text}
                        </p>
                    );

                case 'list':
                    const listIsRtl = block.items?.[0]?.is_arabic;
                    return (
                        <ul key={index} className={`space-y-3 my-6 ${listIsRtl ? 'pr-6' : 'pl-6'}`} dir={listIsRtl ? "rtl" : "ltr"}>
                            {block.items?.map((item: any, i: number) => (
                                <li key={i} className={`flex items-start gap-3 text-lg text-dark/80 ${listIsRtl ? 'text-right' : 'text-left'}`}>
                                    <div className="mt-1.5 w-2 h-2 rounded-full bg-green flex-shrink-0" />
                                    <span>{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    );

                case 'image':
                    const imgElement = <img src={block.src} alt={block.alt || "Service Content"} className="w-full h-auto" />;
                    return (
                        <div key={index} className="my-8 rounded-[32px] overflow-hidden border border-gray-100 shadow-xl">
                            {block.link ? (
                                <a href={block.link} target="_blank" rel="noopener noreferrer" className="block cursor-zoom-in">
                                    {imgElement}
                                </a>
                            ) : (
                                imgElement
                            )}
                        </div>
                    );

                case 'link':
                    return (
                        <a
                            key={index}
                            href={block.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-6 rounded-3xl bg-green/5 border border-green/10 hover:border-green hover:shadow-lg transition-all group my-4"
                            dir={isAr ? "rtl" : "ltr"}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-white text-green">
                                    <Download size={24} />
                                </div>
                                <span className="font-bold text-dark">{block.text || "Download Resource"}</span>
                            </div>
                            <ExternalLink size={20} className="text-green/40 group-hover:text-green" />
                        </a>
                    );

                default:
                    return null;
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-green/20 border-t-green rounded-full animate-spin" />
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6">
                <Database size={64} className="text-red-500/20" />
                <h1 className="text-2xl font-bold">Service not found</h1>
                <Link href="/services" className="text-green font-bold">Back to Services</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-32">
            {/* Header / Hero */}
            <div className="bg-green/10 pt-40 pb-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white" />
                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <button
                        onClick={() => router.back()}
                        className="mb-8 flex items-center gap-2 text-dark/60 font-bold hover:text-green transition-colors"
                    >
                        <ArrowLeft size={20} className={isAr ? "rotate-180" : ""} />
                        Back
                    </button>

                    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                        <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl shadow-green/10 flex items-center justify-center text-green flex-shrink-0 animate-float">
                            {getIcon(service.icon)}
                        </div>
                        <div className={`space-y-4 text-center md:text-left ${isAr ? "md:text-right" : ""}`}>
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="px-4 py-1 rounded-full bg-green text-white text-xs font-black uppercase tracking-widest">{service.category}</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-dark leading-tight">{service.title}</h1>
                            <p className="text-xl text-muted-foreground">{service.description}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-10">
                <div className="bg-white rounded-[48px] border border-green/10 p-10 md:p-16 shadow-2xl shadow-green/5">
                    <div className="prose prose-lg max-w-none">
                        {renderBlocks(service.content_blocks || [])}
                    </div>

                    {service.externalUrl && (
                        <div className="mt-16 pt-12 border-t border-gray-100 flex flex-col items-center gap-6">
                            <p className="text-muted-foreground font-medium">For more details, visit the official source:</p>
                            <a
                                href={service.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-10 py-5 rounded-3xl bg-dark text-white font-bold hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
                            >
                                <ExternalLink size={24} />
                                Original Source
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
