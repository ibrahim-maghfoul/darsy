"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslations } from 'next-intl';
import Link from "next/link";
import styles from "./NewsCard.module.css";

const avatars = [
    { id: 1, img: "https://i.pravatar.cc/160?img=1", shape: "rounded-full", className: "w-20 h-20 top-[8%] left-[4%] [--dy:-12px] [--r:0deg]" },
    { id: 2, img: "https://i.pravatar.cc/160?img=5", shape: "rounded-[32%]", className: "w-24 h-24 top-[22%] left-[10%] [--dy:-8px] [--r:-3deg]" },
    { id: 3, img: "https://i.pravatar.cc/160?img=9", shape: "hex", className: "w-[110px] h-[110px] top-[42%] left-[7%] [--dy:-14px] [--r:0deg]" },
    { id: 4, img: "https://i.pravatar.cc/160?img=20", shape: "blob", className: "w-[76px] h-[76px] top-[70%] left-[3%] [--dy:-10px] [--r:2deg]" },
    { id: 5, img: "https://i.pravatar.cc/160?img=32", shape: "rounded-full", className: "w-[88px] h-[88px] top-[6%] right-[12%] [--dy:-9px] [--r:0deg]" },
    { id: 6, img: "https://i.pravatar.cc/160?img=44", shape: "rounded-[32%]", className: "w-20 h-20 top-[20%] right-[5%] [--dy:-13px] [--r:1deg]" },
    { id: 7, img: "https://i.pravatar.cc/160?img=47", shape: "hex", className: "w-[100px] h-[100px] top-[40%] right-[4%] [--dy:-11px] [--r:-2deg]" },
    { id: 8, img: "https://i.pravatar.cc/160?img=56", shape: "blob", className: "w-[84px] h-[84px] top-[62%] right-[10%] [--dy:-8px] [--r:0deg]" },
];

export function BelieveSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { once: true, amount: 0.12 });
    const t = useTranslations('Believe');

    return (
        <section
            ref={sectionRef}
            className={`relative min-h-screen flex flex-col items-center justify-center overflow-hidden p-[clamp(140px,18vh,200px)_clamp(24px,6vw,80px)] transition-all duration-700
      bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,#3aaa6a_0%,#5dc88a_18%,#a8ecc4_42%,#d8f5e8_62%,#f2fbf5_80%,#ffffff_100%)]
      before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(ellipse_55%_40%_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]`}
        >
            {avatars.map((av, i) => (
                <motion.div
                    key={av.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: i * 0.05, duration: 0.6 }}
                    className={`absolute overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.28)] animate-[chipFloat_5s_ease-in-out_infinite] ${av.shape === 'hex' ? 'clip-hex' : av.shape === 'blob' ? 'rounded-[60%_40%_55%_45%_/_45%_55%_40%_60%]' : av.shape} ${av.className}`}
                    style={{ animationDelay: `${i * 0.2}s` } as any}
                >
                    <img src={av.img} alt="person" className="w-full h-full object-cover block" />
                </motion.div>
            ))}

            <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 0.92, y: 0 } : {}}
                transition={{ duration: 0.8 }}
                className="relative z-2 mb-[-120px] -mt-12"
            >
                <img src="/door.png" alt="Door" className="block w-[clamp(60px,24vw,280px)] h-auto mx-auto object-contain drop-shadow-2xl" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="relative z-2 text-center px-5"
            >
                <h2 className="text-[clamp(32px,5.5vw,68px)] font-bold text-dark leading-[1.05] tracking-[-0.04em] shadow-white/40 mb-[14px]">
                    {t('title1')}
                    <span className="block text-[clamp(36px,6vw,76px)] text-white">{t('title2')}</span>
                </h2>
                <p className="text-[clamp(13px,1.4vw,16px)] text-white/92 max-w-[340px] mx-auto mb-7 leading-[1.65]">
                    {t('desc')}
                </p>
                <div className="flex justify-center mt-8">
                    <Link
                        href="/download"
                        className={`${styles.blobBtn} !relative !inline-flex !items-center !justify-center gap-3 !bg-[#111] !text-white font-semibold text-sm !px-10 !py-4 !rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:!text-[#3aaa6a] hover:-translate-y-[2px] hover:shadow-[0_8px_28px_rgba(0,0,0,0.3)] transition-all overflow-hidden border-none outline-none cursor-pointer !h-auto !w-auto !bottom-auto !right-auto group mx-0 no-underline`}
                    >
                        <span className={styles.blobBtnInner}>
                            <span className={styles.blobBtnBlobs}>
                                <span className={styles.blobBtnBlob} />
                                <span className={styles.blobBtnBlob} />
                                <span className={styles.blobBtnBlob} />
                                <span className={styles.blobBtnBlob} />
                            </span>
                        </span>
                        <span className={`${styles.blobBtnLabel} z-10 flex items-center justify-center gap-3 w-full`}>
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.27.06 2.15.63 2.9.63.78 0 2.26-.78 3.81-.66 1.06.08 2.8.44 3.84 1.97-3.48 2.12-2.92 6.7.45 8.92zm-3.6-16.08c-2.59.28-4.72 2.9-4.47 5.21 2.33.18 4.73-2.39 4.47-5.21z" />
                            </svg>
                            {t('btn_download')}
                        </span>
                    </Link>
                </div>
            </motion.div>

            {/* Hidden SVG goo filter — needed for blob merge effect */}
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
                <defs>
                    <filter id="goo">
                        <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7" result="gooResult" />
                        <feBlend in2="gooResult" in="SourceGraphic" result="mix" />
                    </filter>
                </defs>
            </svg>
        </section>
    );
}
