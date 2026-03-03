"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslations } from 'next-intl';


const floatingIcons = [
    {
        id: 1, delay: 0, className: "top-[8%] right-[6%] w-[72px] h-[72px] [--wdy:-18px] [--wr:4deg]", content: (
            <svg className="w-8 h-8" viewBox="0 0 40 40" fill="none">
                <rect x="6" y="6" width="12" height="12" rx="3" fill="#3aaa6a" />
                <rect x="22" y="6" width="12" height="12" rx="3" fill="#3aaa6a" opacity=".5" />
                <rect x="6" y="22" width="12" height="12" rx="3" fill="#3aaa6a" opacity=".5" />
                <rect x="22" y="22" width="12" height="12" rx="3" fill="#3aaa6a" opacity=".25" />
            </svg>
        )
    },
    {
        id: 2, delay: 0.8, className: "top-[20%] left-[4%] w-[88px] h-[88px] [--wdy:-12px] [--wr:-3deg]", content: (
            <svg className="w-[36px] h-[36px]" viewBox="0 0 44 44" fill="none">
                <polygon points="22,4 40,34 4,34" fill="none" stroke="#3aaa6a" strokeWidth="3" strokeLinejoin="round" />
                <polygon points="22,12 34,32 10,32" fill="#3aaa6a" opacity=".25" />
            </svg>
        )
    },
    {
        id: 3, delay: 0.3, className: "top-[65%] right-[5%] w-[66px] h-[66px] [--wdy:-20px] [--wr:2deg]", content: (
            <svg className="w-[28px] h-[28px]" viewBox="0 0 36 36" fill="none">
                <rect x="4" y="8" width="28" height="5" rx="2.5" fill="#3aaa6a" />
                <rect x="4" y="17" width="20" height="5" rx="2.5" fill="#3aaa6a" opacity=".5" />
                <rect x="4" y="26" width="24" height="5" rx="2.5" fill="#3aaa6a" opacity=".25" />
            </svg>
        )
    },
    {
        id: 4, delay: 1.1, className: "top-[72%] left-[6%] w-[58px] h-[58px] [--wdy:-14px] [--wr:-2deg]", content: (
            <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
                <rect x="5" y="5" width="22" height="22" rx="5" stroke="#3aaa6a" strokeWidth="2.5" />
                <rect x="10" y="10" width="12" height="12" rx="3" fill="#3aaa6a" opacity=".5" />
            </svg>
        )
    },
];

export function WorksSection() {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const t = useTranslations('Works');

    const items = [
        { num: "01", label: t('item1_label'), desc: t('item1_desc') },
        { num: "02", label: t('item2_label'), desc: t('item2_desc') },
        { num: "03", label: t('item3_label'), desc: t('item3_desc') },
        { num: "04", label: t('item4_label'), desc: t('item4_desc') },
    ];

    return (
        <section className="bg-[#f4f6f3] min-h-screen relative overflow-hidden flex items-center justify-center p-[100px_clamp(24px,8vw,120px)]">
            {floatingIcons.map((icon) => (
                <div
                    key={icon.id}
                    className={`absolute pointer-events-none animate-[wFloat_6s_ease-in-out_infinite] ${icon.className}`}
                    style={{ animationDelay: `${icon.delay}s` } as any}
                >
                    <div className="rounded-[22px] bg-white/72 backdrop-blur-[16px] border border-white/90 shadow-[0_8px_32px_rgba(58,170,106,0.15),0_2px_8px_rgba(0,0,0,0.06)] flex items-center justify-center w-full h-full">
                        {icon.content}
                    </div>
                </div>
            ))}

            <div className="absolute top-[32%] right-[4%] w-[150px] h-[150px] rounded-[50%_50%_50%_44%_/_50%_50%_44%_50%] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.2)] border-4 border-white/90 animate-[wFloat_6s_ease-in-out_infinite] delay-[0.5s] [--wdy:-10px] [--wr:0deg]">
                <img src="https://i.pravatar.cc/260?img=44" alt="person" className="w-full h-full object-cover block" />
            </div>

            <div className="max-w-[780px] w-full relative z-2 text-left">
                <div className="flex flex-col gap-0">
                    {items.map((item, i) => (
                        <div
                            key={i}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            className="flex items-baseline gap-[18px] leading-[1] py-1 cursor-pointer group"
                        >
                            <span className="text-[clamp(11px,1.1vw,14px)] font-semibold text-green font-mono tracking-[0.05em] shrink-0 pt-2 whitespace-nowrap">
                                {`{ ${item.num} }`}
                            </span>
                            <div className="relative">
                                <span className={`text-[clamp(42px,7vw,96px)] font-bold text-dark tracking-[-0.04em] leading-[1.05] transition-colors relative inline-block`}>
                                    {item.label}
                                    {hoveredIdx === i && (
                                        <motion.span
                                            layoutId="brush"
                                            className="absolute bottom-1 -left-1 -right-1 h-3 z-[-1] bg-[url('data:image/svg+xml,%3Csvg_xmlns=%27http://www.w3.org/2000/svg%27_viewBox=%270_0_200_12%27%3E%3Cpath_d=%27M2_9_Q50_2_100_7_Q150_12_198_5%27_stroke=%27%2338c070%27_stroke-width=%277%27_fill=%27none%27_stroke-linecap=%27round%27/%3E%3C/svg%3E')] bg-no-repeat bg-center bg-contain"
                                        />
                                    )}
                                </span>
                                {item.desc && (
                                    <p className="block mt-1 text-[clamp(13px,1.2vw,16px)] text-[#7a9488] leading-[1.65] max-w-[440px] pb-2.5 ml-0">
                                        {item.desc}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
