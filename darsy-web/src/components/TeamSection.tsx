"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useTranslations } from 'next-intl';
import { Facebook, Twitter, Linkedin } from "lucide-react";

import Image from "next/image";

// Array schema only
const allTeamBase = [
    { id: 1, name: "Amira Benali", roleKey: "member1_role", descKey: "member1_desc", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face", color: "bg-[#9ef0b8]", rot: "-2.3deg", pattern: true },
    { id: 2, name: "Karim Mansour", roleKey: "member2_role", descKey: "member2_desc", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face", color: "bg-[#52d4a0]", rot: "1.5deg", pattern: true },
    { id: 3, name: "Sofia Cherkaoui", roleKey: "member3_role", descKey: "member3_desc", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face", color: "bg-white", rot: "-1.0deg", pattern: "coral" },
    { id: 4, name: "Yassine Driss", roleKey: "member4_role", descKey: "member4_desc", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face", color: "bg-[#c8eeda]", rot: "2.9deg", pattern: true },
    { id: 5, name: "Nadia Ouhab", roleKey: "member5_role", descKey: "member5_desc", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face", color: "bg-[#4a7a5a]", rot: "-0.8deg", darkInfo: true, pattern: "dots" },
    { id: 6, name: "Omar Taibi", roleKey: "member6_role", descKey: "member6_desc", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face", color: "bg-[#d8ead2]", rot: "1.2deg", pattern: "coral-light" },
];

export function TeamSection() {
    const t = useTranslations('Team');
    const [currentPage, setCurrentPage] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const totalPages = 2; // 6 cards / 3 per page

    const allTeam = useMemo(() => allTeamBase.map(member => ({
        ...member,
        role: t(member.roleKey),
        desc: t(member.descKey)
    })), [t]);

    const [shuffledTeam, setShuffledTeam] = useState(allTeam);

    // Reshuffle whenever the team data (or locale) changes
    useEffect(() => {
        setShuffledTeam([...allTeam].sort(() => Math.random() - 0.5));
    }, [allTeam]);

    useEffect(() => {
        if (isHovered) return; // Pause timer if hovered

        const shuffle = () => {
            const shuffled = [...allTeam].sort(() => Math.random() - 0.5);
            setShuffledTeam(shuffled);
        };

        // Wait for entry animations (approx 0.8s) + 3 seconds stay time
        const timer = setTimeout(() => {
            setCurrentPage((prev) => {
                const next = (prev + 1) % totalPages;
                if (next === 0) shuffle();
                return next;
            });
        }, 3800);

        return () => clearTimeout(timer);
    }, [currentPage, totalPages, isHovered]);

    const visibleMembers = useMemo(() => {
        const start = currentPage * 3;
        return shuffledTeam.slice(start, start + 3);
    }, [currentPage, shuffledTeam]);

    return (
        <section className="bg-[#f0f2ee] pt-24 pb-8 md:pb-16 px-[clamp(24px,6vw,80px)] overflow-hidden font-roboto">
            <div className="text-center mb-16">
                <h2 className="text-[clamp(32px,5vw,62px)] font-bold text-dark leading-tight mb-4">
                    <span className="font-light">{t('title1')}</span> <strong className="font-extrabold text-green">{t('title_highlight')}</strong> <span className="text-green relative">{t('title2')}</span>
                </h2>
                <p className="text-[#6a8a78] text-lg max-w-2xl mx-auto">
                    {t('desc1')}<br />{t('desc2')}
                </p>
            </div>

            <div
                className="max-w-[1200px] mx-auto min-h-[180px] md:min-h-[520px]"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative min-h-[140px] md:min-h-[400px]">
                    <AnimatePresence>
                        <div className="grid grid-cols-3 gap-2 md:gap-8 items-start w-full absolute top-0 left-0">
                            {visibleMembers.map((member, i) => (
                                <motion.div
                                    key={`${member.id}-${currentPage}`}
                                    initial={{ opacity: 0, y: 40, scale: 0.9, rotate: member.rot }}
                                    animate={{ opacity: 1, y: 0, scale: 1, rotate: member.rot }}
                                    exit={{ opacity: 0, scale: 0.95, rotate: member.rot }}
                                    whileHover={{ scale: 1.02, rotate: "0deg", zIndex: 10 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: i * 0.1,
                                        type: "spring",
                                        stiffness: 100
                                    }}
                                    className="relative group w-full"
                                >
                                    <div className={`rounded-2xl md:rounded-[40px] overflow-hidden ${member.color} relative aspect-[3/4] shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-black/5 transition-all duration-300 group-hover:shadow-[0_20px_48px_rgba(0,0,0,0.18)]`}>
                                        {member.pattern && (
                                            <div
                                                className={`absolute inset-0 opacity-10 ${member.pattern === 'coral' || member.pattern === 'coral-light'
                                                    ? 'bg-[radial-gradient(circle_at_20%_20%,#ff7f50_0%,transparent_50%)]'
                                                    : member.pattern === 'dots'
                                                        ? 'bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:10px_10px]'
                                                        : 'bg-[linear-gradient(45deg,#000_10%,transparent_10%,transparent_50%,#000_50%,#000_60%,transparent_60%,transparent_100%)]'
                                                    }`}
                                                style={member.pattern === 'dots' ? {} : { backgroundSize: '10px 10px' }}
                                            />
                                        )}

                                        <div className="h-2/3 overflow-hidden relative">
                                            <Image
                                                src={member.img}
                                                alt={member.name}
                                                fill
                                                priority
                                                sizes="(max-width: 640px) 33vw, 33vw"
                                                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300 pointer-events-none"
                                            />
                                        </div>

                                        <div className={`absolute inset-x-0 bottom-0 p-3 md:p-8 pt-6 md:pt-12 bg-gradient-to-t from-black/90 to-transparent text-white transition-transform duration-300 translate-y-2 md:translate-y-6 group-hover:translate-y-0`}>
                                            <h3 className="text-[10px] md:text-2xl font-bold mb-0.5 md:mb-1">{member.name}</h3>
                                            <p className="text-[8px] md:text-sm opacity-80 leading-snug md:leading-relaxed line-clamp-1 md:line-clamp-none">{member.desc}</p>
                                        </div>
                                    </div>

                                    <div className="mt-2 md:mt-6 flex flex-col md:flex-row items-center justify-between px-1 md:px-4 opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 gap-1 md:gap-0">
                                        <span className="bg-dark text-white font-bold text-[7px] md:text-[10px] uppercase tracking-widest px-2 md:px-4 py-1 md:py-2 rounded-full border border-dark/10 hover:bg-green hover:border-green transition-colors cursor-pointer text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                                            {member.role}
                                        </span>
                                        <div className="flex gap-1 md:gap-2 hidden md:flex">
                                            <a href="#" className="w-8 h-8 rounded-full border border-dark/20 flex items-center justify-center text-dark/40 hover:bg-dark hover:text-white transition-all"><Facebook size={12} /></a>
                                            <a href="#" className="w-8 h-8 rounded-full border border-dark/20 flex items-center justify-center text-dark/40 hover:bg-dark hover:text-white transition-all"><Twitter size={12} /></a>
                                            <a href="#" className="w-8 h-8 rounded-full border border-dark/20 flex items-center justify-center text-dark/40 hover:bg-dark hover:text-white transition-all"><Linkedin size={12} /></a>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </AnimatePresence>
                </div>
            </div>

            <div className="flex justify-center gap-3 mt-4 md:mt-12">
                {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => {
                            setCurrentPage(i);
                            // If user manually clicks, they might want to see it, but we won't pause permanently
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 ${currentPage === i ? 'w-10 bg-dark' : 'w-6 bg-dark/10 hover:bg-dark/20'}`}
                    />
                ))}
            </div>
        </section>
    );
}
