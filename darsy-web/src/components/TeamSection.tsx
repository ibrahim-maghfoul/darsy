"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslations } from 'next-intl';
import { Facebook, Twitter, Linkedin } from "lucide-react";
import Image from "next/image";
import { TEAM } from "@/lib/constants";

const PATTERN_CLASS: Record<string, string> = {
    coral: "bg-[radial-gradient(circle_at_20%_20%,#ff7f50_0%,transparent_50%)]",
    dots: "bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:10px_10px]",
    diagonal: "bg-[linear-gradient(45deg,#000_10%,transparent_10%,transparent_50%,#000_50%,#000_60%,transparent_60%,transparent_100%)]",
};

export function TeamSection() {
    const t = useTranslations('Team');
    const [currentPage, setCurrentPage] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const totalPages = 2;

    const allTeam = useMemo(() => TEAM.map(m => ({
        ...m, role: t(m.roleKey), desc: t(m.descKey)
    })), [t]);

    const [shuffledTeam, setShuffledTeam] = useState(allTeam);

    useEffect(() => {
        setShuffledTeam([...allTeam].sort(() => Math.random() - 0.5));
    }, [allTeam]);

    const advance = useCallback(() => {
        setCurrentPage(p => {
            const next = (p + 1) % totalPages;
            if (next === 0) setShuffledTeam(s => [...s].sort(() => Math.random() - 0.5));
            return next;
        });
        setAnimKey(k => k + 1);
    }, [totalPages]);

    useEffect(() => {
        if (isHovered) return;
        const timer = setTimeout(advance, 3800);
        return () => clearTimeout(timer);
    }, [currentPage, isHovered, advance]);

    const visibleMembers = useMemo(() =>
        shuffledTeam.slice(currentPage * 3, currentPage * 3 + 3),
    [currentPage, shuffledTeam]);

    return (
        <section className="bg-[#f0f2ee] pt-24 pb-16 md:pb-24 px-[clamp(24px,6vw,80px)] font-roboto">
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green/30 bg-green/5 text-[12px] font-semibold text-green/80 shadow-[0_0_12px_rgba(58,170,106,0.15)] mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                    {t('kicker')}
                </div>
                <h2 className="text-[clamp(32px,5vw,62px)] font-bold text-dark leading-tight mb-4">
                    <span className="font-light">{t('title1')}</span> <strong className="font-extrabold text-green">{t('title_highlight')}</strong> <span className="text-green relative">{t('title2')}</span>
                </h2>
                <p className="text-[#6a8a78] text-lg max-w-2xl mx-auto">
                    {t('desc1')}<br />{t('desc2')}
                </p>
            </div>

            <div
                className="max-w-[1200px] mx-auto"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative">
                    <div className="grid grid-cols-3 gap-2 md:gap-8 items-start w-full">
                        {visibleMembers.map((member, i) => (
                            <div
                                key={`${member.id}-${animKey}`}
                                className="relative group w-full"
                                style={{
                                    opacity: 0, translate: '0 40px', scale: '0.9', rotate: member.rot,
                                    animation: `teamCardIn 0.5s ease-out ${i * 0.1}s forwards`,
                                }}
                            >
                                <div className={`rounded-2xl md:rounded-[40px] overflow-hidden ${member.color} relative aspect-[3/4] shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-black/5 transition-shadow duration-300 group-hover:shadow-[0_20px_48px_rgba(0,0,0,0.18)]`}>
                                    {member.pattern && (
                                        <div className={`absolute inset-0 opacity-10 ${PATTERN_CLASS[member.pattern] || ""}`}
                                            style={member.pattern !== 'dots' ? { backgroundSize: '10px 10px' } : undefined} />
                                    )}
                                    <div className="h-2/3 overflow-hidden relative">
                                        <Image
                                            src={member.img}
                                            alt={member.name}
                                            fill
                                            loading="lazy"
                                            sizes="(max-width: 640px) 33vw, 33vw"
                                            className="object-cover grayscale group-hover:grayscale-0 transition-[filter] duration-300 pointer-events-none"
                                        />
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 p-3 md:p-8 pt-6 md:pt-12 bg-gradient-to-t from-black/90 to-transparent text-white transition-transform duration-300 translate-y-2 md:translate-y-6 group-hover:translate-y-0">
                                        <h3 className="text-[10px] md:text-2xl font-bold mb-0.5 md:mb-1">{member.name}</h3>
                                        <p className="text-[8px] md:text-sm opacity-80 leading-snug md:leading-relaxed line-clamp-1 md:line-clamp-none">{member.desc}</p>
                                    </div>
                                </div>
                                <div className="mt-2 md:mt-6 flex flex-col md:flex-row items-center justify-between px-1 md:px-4 opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 gap-1 md:gap-0">
                                    <span className="bg-dark text-white font-bold text-[7px] md:text-[10px] uppercase tracking-widest px-2 md:px-4 py-1 md:py-2 rounded-full border border-dark/10 hover:bg-green hover:border-green transition-colors cursor-pointer text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                        {member.role}
                                    </span>
                                    <div className="hidden md:flex gap-2">
                                        {member.socials?.facebook && <a href={member.socials.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-dark/20 flex items-center justify-center text-dark/40 hover:bg-dark hover:text-white transition-all"><Facebook size={12} /></a>}
                                        {member.socials?.twitter && <a href={member.socials.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-dark/20 flex items-center justify-center text-dark/40 hover:bg-dark hover:text-white transition-all"><Twitter size={12} /></a>}
                                        {member.socials?.linkedin && <a href={member.socials.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full border border-dark/20 flex items-center justify-center text-dark/40 hover:bg-dark hover:text-white transition-all"><Linkedin size={12} /></a>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-center gap-3 mt-4 md:mt-12">
                {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => { setCurrentPage(i); setAnimKey(k => k + 1); }}
                        className={`h-1.5 rounded-full transition-all duration-300 ${currentPage === i ? 'w-10 bg-dark' : 'w-6 bg-dark/10 hover:bg-dark/20'}`}
                    />
                ))}
            </div>
        </section>
    );
}
