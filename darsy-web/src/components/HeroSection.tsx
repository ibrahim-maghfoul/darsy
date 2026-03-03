"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from 'next-intl';
import { Diagram } from "./Diagram";

const CARD_IDS = ["card-0", "card-1", "card-2", "card-3"];
const HOLD_MS = 2000;
const TRAVEL_MS = 900;


export function HeroSection() {
    const t = useTranslations('Hero');

    const cardsData = [
        { id: "card-0", icon: "📚", title: t('card0_title'), msg: t('card0_msg'), color: "#e8f5ee" },
        { id: "card-1", icon: "📈", title: t('card1_title'), msg: t('card1_msg'), color: "#d0f0e0" },
        { id: "card-2", icon: "📰", title: t('card2_title'), msg: t('card2_msg'), color: "#b8e8cc" },
        { id: "card-3", icon: "⭐", title: t('card3_title'), msg: t('card3_msg'), color: "#e2f5eb" },
    ];
    const [activeIdx, setActiveIdx] = useState(0);
    const [badgeVal, setBadgeVal] = useState(3);
    const [pts, setPts] = useState<{ x: number; y: number }[]>([]);
    const [segD, setSegD] = useState("");
    const [dotPos, setDotPos] = useState({ x: 0, y: 0 });

    const phaseRef = useRef<"hold" | "travel">("hold");
    const t0Ref = useRef(0);
    const rafRef = useRef<number>(0);
    const diagramWrapRef = useRef<HTMLDivElement>(null);
    const leftColRef = useRef<HTMLDivElement>(null);
    const rightColRef = useRef<HTMLDivElement>(null);

    const getCpt = useCallback((id: string) => {
        const el = document.getElementById(id);
        const container = document.getElementById("hero-scene-container");
        if (!el || !container) return { x: 0, y: 0 };
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        return {
            x: elRect.left - containerRect.left + elRect.width * 0.5,
            y: elRect.top - containerRect.top + elRect.height * 0.5,
        };
    }, []);

    const updatePts = useCallback(() => {
        const newPts = CARD_IDS.map((id) => getCpt(id));
        setPts(newPts);
        if (newPts[activeIdx]) {
            setDotPos(newPts[activeIdx]);
        }
    }, [getCpt, activeIdx]);

    const tick = useCallback((now: number) => {
        if (!pts.length) return;

        const elapsed = now - t0Ref.current;
        const from = pts[activeIdx];
        const to = pts[(activeIdx + 1) % 4];

        if (phaseRef.current === "hold") {
            setDotPos(from);
            setSegD("");
            if (elapsed >= HOLD_MS) {
                phaseRef.current = "travel";
                t0Ref.current = now;
            }
        } else {
            const t = Math.min(elapsed / TRAVEL_MS, 1);
            const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            const mid = {
                x: from.x + (to.x - from.x) * e,
                y: from.y + (to.y - from.y) * e,
            };
            setSegD(`M${from.x},${from.y} L${mid.x},${mid.y}`);
            setDotPos(mid);

            if (t >= 1) {
                setSegD("");
                setActiveIdx((prev) => (prev + 1) % 4);
                phaseRef.current = "hold";
                t0Ref.current = now;
            }
        }
        rafRef.current = requestAnimationFrame(tick);
    }, [pts, activeIdx]);

    useEffect(() => {
        updatePts();
        window.addEventListener("resize", updatePts);
        return () => window.removeEventListener("resize", updatePts);
    }, [updatePts]);

    useEffect(() => {
        t0Ref.current = performance.now();
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [tick]);

    useEffect(() => {
        setBadgeVal(3);
        const interval = setInterval(() => {
            setBadgeVal((prev) => Math.max(0, prev - 1));
        }, HOLD_MS / 3);
        return () => clearInterval(interval);
    }, [activeIdx]);

    useEffect(() => {
        const syncHeights = () => {
            if (diagramWrapRef.current) {
                const h = diagramWrapRef.current.offsetHeight;
                if (leftColRef.current) leftColRef.current.style.height = `${h}px`;
                if (rightColRef.current) rightColRef.current.style.height = `${h}px`;
            }
        };
        syncHeights();
        window.addEventListener("resize", syncHeights);
        return () => window.removeEventListener("resize", syncHeights);
    }, []);

    return (
        <div id="hero-scene-container" className="relative flex flex-col items-stretch overflow-visible min-h-[600px]">
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-1 overflow-visible">
                <path d={segD} fill="none" stroke="#3aaa6a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_6px_rgba(58,170,106,0.8)] drop-shadow-[0_0_12px_rgba(58,170,106,0.4)]" />
                <circle cx={dotPos.x} cy={dotPos.y} r="5" fill="#3aaa6a" className="drop-shadow-[0_0_7px_rgba(58,170,106,0.9)] drop-shadow-[0_0_14px_rgba(58,170,106,0.5)]" />
            </svg>

            <div className="pt-[82px] text-center pb-0 hero">
                <h1 className="text-[clamp(26px,4.5vw,52px)] font-bold text-dark leading-[1.12] tracking-[-0.04em] max-w-[640px] mx-auto hero-title whitespace-pre-wrap">
                    {t('title1')} <em className="not-italic text-green">{t('title_highlight')}</em>{t('title2')}
                </h1>
            </div>

            <div className="flex-1 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch px-0 pt-3 pb-4 min-h-0 relative scene">
                <div ref={leftColRef} className="flex flex-col justify-between items-end px-[clamp(8px,2vw,36px)] py-1 min-w-0 overflow-hidden hidden mobile:flex">
                    {[cardsData[0], cardsData[3]].map((card, i) => (
                        <div key={card.id} id={card.id} className={`w-[clamp(130px,15vw,180px)] bg-white/96 rounded-[14px] p-[10px_12px] flex items-center gap-[9px] transition-all relative z-5 ${activeIdx === (card.id === "card-0" ? 0 : 3) ? "shadow-card-active animate-[cardPump_0.5s_cubic-bezier(0.22,1,0.36,1)]" : "shadow-card"}`}>
                            <div className="w-8 h-8 flex-shrink-0 rounded-[9px] text-[15px] flex items-center justify-center relative" style={{ background: card.color }}>
                                {card.icon}
                                <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 bg-green text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-[0_1px_6px_rgba(58,170,106,0.55)] transition-opacity duration-200 ${activeIdx === (card.id === "card-0" ? 0 : 3) ? "opacity-100" : "opacity-0"}`}>
                                    {badgeVal}
                                </span>
                            </div>
                            <div className="flex flex-col gap-[2px] min-w-0">
                                <div className="text-[10px] font-semibold text-dark leading-[1.25] whitespace-nowrap overflow-hidden text-ellipsis">{card.title}</div>
                                <div className="text-[9px] font-normal text-[#7a9488] leading-[1.45]">{card.msg}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div ref={diagramWrapRef}>
                    <Diagram />
                </div>

                <div ref={rightColRef} className="flex flex-col justify-between items-start px-[clamp(8px,2vw,36px)] py-1 min-w-0 overflow-hidden hidden mobile:flex">
                    {[cardsData[1], cardsData[2]].map((card) => (
                        <div key={card.id} id={card.id} className={`w-[clamp(130px,15vw,180px)] bg-white/96 rounded-[14px] p-[10px_12px] flex items-center gap-[9px] transition-all relative z-5 ${activeIdx === (card.id === "card-1" ? 1 : 2) ? "shadow-card-active animate-[cardPump_0.5s_cubic-bezier(0.22,1,0.36,1)]" : "shadow-card"}`}>
                            <div className="w-8 h-8 flex-shrink-0 rounded-[9px] text-[15px] flex items-center justify-center relative" style={{ background: card.color }}>
                                {card.icon}
                                <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 bg-green text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-[0_1px_6px_rgba(58,170,106,0.55)] transition-opacity duration-200 ${activeIdx === (card.id === "card-1" ? 1 : 2) ? "opacity-100" : "opacity-0"}`}>
                                    {badgeVal}
                                </span>
                            </div>
                            <div className="flex flex-col gap-[2px] min-w-0">
                                <div className="text-[10px] font-semibold text-dark leading-[1.25] whitespace-nowrap overflow-hidden text-ellipsis">{card.title}</div>
                                <div className="text-[9px] font-normal text-[#7a9488] leading-[1.45]">{card.msg}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
