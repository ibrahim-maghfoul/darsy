"use client";

import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import { useTranslations } from 'next-intl';
import { BookOpen, TrendingUp, Newspaper } from 'lucide-react';
import { Diagram } from "./Diagram";
import { DarsyLogo } from "./DarsyLogo";

// Square clockwise: Free Materials(TL)→Track Progress(TR)→Latest News(BR)→Premium Prep(BL)
const CARD_IDS = ["card-0", "card-1", "card-2", "card-3"];
const CARD_INDEX: Record<string, number> = Object.fromEntries(CARD_IDS.map((id, i) => [id, i]));
const HOLD_MS        = 2200;
const TRAVEL_MS      = 1400;
const TAIL_LAG       = 0.30;
const W1_FRONT_LAG   = 0.10;
const W1_TAIL_LAG    = 0.35;
const W2_FRONT_LAG   = 0.20;
const W2_TAIL_LAG    = 0.45;
const WAVE_TRIGGER_T = 0.78;
const BLOB_ANIM_MS   = 700;
type CardPhase = 'idle' | 'entering' | 'active' | 'leaving';


// ─── Maths ────────────────────────────────────────────────────────────────────
type Pt = {x:number,y:number};
const ZERO_PT: Pt = {x:0,y:0};
const ease = (t: number) => t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t;

const TWO_PI = Math.PI * 2;

// Canvas draw — zero string allocation, zero DOM manipulation
function drawWavySeg(
    ctx: CanvasRenderingContext2D,
    from: Pt, to: Pt,
    tailFrac: number, frontFrac: number,
    amplitude: number, frequency: number, phaseShift: number
) {
    if (frontFrac <= 0 || tailFrac >= frontFrac) return;
    const dx = to.x - from.x, dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    const nx = -dy / len, ny = dx / len;
    const N = 16;
    for (let i = 0; i <= N; i++) {
        const f = tailFrac + (frontFrac - tailFrac) * (i / N);
        const bx = from.x + dx * f, by = from.y + dy * f;
        const w = Math.sin(f * frequency * TWO_PI + phaseShift) * amplitude;
        i === 0 ? ctx.moveTo(bx + nx * w, by + ny * w) : ctx.lineTo(bx + nx * w, by + ny * w);
    }
}

function drawStraightSeg(
    ctx: CanvasRenderingContext2D,
    from: Pt, to: Pt, tailFrac: number, frontFrac: number
) {
    if (frontFrac <= 0 || tailFrac >= frontFrac) return;
    ctx.moveTo(from.x + (to.x - from.x) * tailFrac, from.y + (to.y - from.y) * tailFrac);
    ctx.lineTo(from.x + (to.x - from.x) * frontFrac, from.y + (to.y - from.y) * frontFrac);
}


// Shared goo filter — defined once in HeroSection root, referenced by all cards
const GOO_FILTER_ID = "hcard-goo";

// ─── BlobWave layer ───────────────────────────────────────────────────────────
function BlobWave({ phase }: { phase: CardPhase | 'entering-top' | 'leaving-top' }) {
    if (phase === 'idle' || phase === 'active') return null;
    return (
        <div style={{position:'absolute',inset:0,overflow:'hidden',zIndex:0,pointerEvents:'none',borderRadius:'inherit'}}>
            <div className={`hcard-blob ${phase}`} style={{filter:`url('#${GOO_FILTER_ID}')`}}>
                <span/><span/><span/><span/>
            </div>
        </div>
    );
}

// ─── Desktop card (memoized — only re-renders when its own props change) ──────
const DesktopCard = memo(function DesktopCard({ card, phase, isActive, badgeVal }: {
    card: {id:string;icon:React.ReactNode;title:string;msg:string;color:string;iconColor:string};
    phase: CardPhase;
    isActive: boolean;
    badgeVal: number;
}) {
    const isLight = phase === 'entering' || phase === 'active';
    return (
        <div id={card.id}
            className={`relative overflow-hidden flex items-center gap-[10px]
                transition-all duration-500 border-[1.5px]
                ${isLight
                    ? 'bg-green border-green shadow-[0_6px_28px_rgba(58,170,106,0.40),0_0_0_2.5px_#3aaa6a]'
                    : 'bg-white/90 border-[rgba(58,170,106,0.11)] shadow-[0_2px_10px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)]'
                }`}
            style={{
                width: 'clamp(142px,15.5vw,192px)',
                borderRadius: '18px',
                padding: '11px 13px',
            }}>
            <BlobWave phase={phase}/>

            {/* Icon well */}
            <div className="relative flex-shrink-0 flex items-center justify-center z-10 transition-all duration-300"
                style={{
                    width: 34, height: 34,
                    borderRadius: 11,
                    background: isLight
                        ? 'rgba(255,255,255,0.22)'
                        : 'linear-gradient(135deg, #f0faf5, #e8f5ee)',
                    boxShadow: isLight ? '0 1px 8px rgba(0,0,0,0.10)' : 'none',
                }}>
                {/* Dot texture — inactive only */}
                {!isLight && (
                    <div className="absolute inset-0 pointer-events-none" style={{
                        borderRadius: 11,
                        backgroundImage: 'radial-gradient(circle, rgba(58,170,106,0.22) 1px, transparent 1px)',
                        backgroundSize: '6px 6px',
                    }}/>
                )}
                <span className={`relative z-10 transition-colors duration-300 ${isLight ? 'text-white' : 'text-[#3aaa6a]'}`}>
                    {card.icon}
                </span>
                {/* Badge */}
                <span className={`absolute -top-[5px] -right-[5px] w-[14px] h-[14px] bg-white text-green text-[7px] font-black rounded-full flex items-center justify-center shadow-[0_1px_6px_rgba(58,170,106,0.55)] transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                    {badgeVal}
                </span>
            </div>

            {/* Text */}
            <div className="flex flex-col gap-[3px] min-w-0 relative z-10">
                <div className={`text-[10.5px] font-black leading-[1.2] truncate transition-colors duration-300 tracking-tight ${isLight ? 'text-white' : 'text-[#1a3a2a]'}`}>
                    {card.title}
                </div>
                <div className={`text-[8.5px] font-medium leading-[1.4] truncate transition-colors duration-300 ${isLight ? 'text-white/70' : 'text-[rgba(26,58,42,0.45)]'}`}>
                    {card.msg}
                </div>
            </div>
        </div>
    );
});

// ─── Mobile card list ─────────────────────────────────────────────────────────
function MobileCardList({ cards }: {
    cards: {id:string;icon:React.ReactNode;title:string;msg:string;color:string;iconColor:string}[];
}) {
    const cardsRef = useRef(cards);

    const [phases, setPhases] = useState<Record<string, CardPhase>>(
        () => Object.fromEntries(cards.map(c => [c.id, 'idle' as CardPhase]))
    );
    const activeIdxRef  = useRef<number>(-1);
    const timersRef     = useRef<ReturnType<typeof setTimeout>[]>([]);
    const hasStartedRef = useRef(false);

    const advanceSequence = useCallback((nextIdx: number) => {
        const cs = cardsRef.current;
        const idx = nextIdx % cs.length;

        const prevId = activeIdxRef.current >= 0 ? cs[activeIdxRef.current].id : null;
        activeIdxRef.current = idx;
        const curId = cs[idx].id;

        setPhases(p => {
            const next = { ...p, [curId]: 'entering' as CardPhase };
            if (prevId) next[prevId] = 'leaving';
            return next;
        });

        const t1 = setTimeout(() => {
            setPhases(p => {
                const next = { ...p };
                if (next[curId] === 'entering') next[curId] = 'active';
                if (prevId && next[prevId] === 'leaving') next[prevId] = 'idle';
                return next;
            });
        }, BLOB_ANIM_MS);

        const t2 = setTimeout(() => advanceSequence(nextIdx + 1), BLOB_ANIM_MS + 1500);
        timersRef.current.push(t1, t2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const firstId = cardsRef.current[0]?.id;

        const checkScroll = () => {
            const el = document.getElementById(`${firstId}-mobile`);
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const centerY = window.innerHeight / 2;

            if (!hasStartedRef.current && rect.top <= centerY) {
                hasStartedRef.current = true;
                advanceSequence(0);
            }
            if (hasStartedRef.current && rect.top > window.innerHeight) {
                hasStartedRef.current = false;
                activeIdxRef.current = -1;
                timersRef.current.forEach(clearTimeout);
                timersRef.current = [];
                setPhases(() => Object.fromEntries(cardsRef.current.map(c => [c.id, 'idle' as CardPhase])));
            }
        };

        window.addEventListener('scroll', checkScroll, { passive: true });
        window.addEventListener('resize', checkScroll, { passive: true });
        checkScroll();

        return () => {
            window.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
            timersRef.current.forEach(clearTimeout);
            timersRef.current = [];
        };
    }, [advanceSequence]);

    return (
        <div className="flex flex-col gap-2 w-full">
            {cards.map(card => {
                const phase     = phases[card.id] ?? 'idle';
                const isLight   = phase === 'entering' || phase === 'active';
                const isActive  = phase === 'active';
                const isLeaving = phase === 'leaving';

                return (
                    <div key={card.id} id={`${card.id}-mobile`}
                        className={`rounded-2xl p-3 flex items-center gap-3 relative overflow-hidden
                            transition-[box-shadow,background] duration-500 border
                            ${isLight ? 'bg-green border-green shadow-[0_4px_20px_rgba(58,170,106,0.3)]' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <BlobWave phase={phase}/>
                        <div className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center relative z-10 transition-[background,color] duration-300"
                            style={isLight ? {background:'rgba(255,255,255,0.25)',color:'white'} : {background:'rgba(58,170,106,0.1)',color:'#3aaa6a'}}>
                            {card.icon}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0 relative z-10">
                            <div className={`text-[10px] font-bold leading-snug truncate transition-colors duration-300 ${isLight?'text-white':'text-dark'}`}>{card.title}</div>
                            <div className={`text-[9px] leading-snug truncate transition-colors duration-300 ${isLight?'text-white/75':'text-dark/50'}`}>{card.msg}</div>
                        </div>
                        <div className={`ml-auto w-2 h-2 rounded-full bg-white flex-shrink-0 relative z-10 transition-opacity duration-300 ${(isLight||isLeaving)?'opacity-100':'opacity-0'}`}/>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function HeroSection() {
    const t = useTranslations('Hero');

    const cardsData = useMemo(() => [
        {id:"card-0", icon:<BookOpen   size={15}/>, title:t('card0_title'), msg:t('card0_msg'), color:"#e8f5ee", iconColor:"#3aaa6a"},
        {id:"card-1", icon:<TrendingUp size={15}/>, title:t('card1_title'), msg:t('card1_msg'), color:"#e8f5ee", iconColor:"#3aaa6a"},
        {id:"card-2", icon:<Newspaper  size={15}/>, title:t('card2_title'), msg:t('card2_msg'), color:"#e8f5ee", iconColor:"#3aaa6a"},
        {id:"card-3", icon:<DarsyLogo className="w-[15px] h-[15px]" color="#3aaa6a" />, title:t('card3_title'), msg:t('card3_msg'), color:"#e8f5ee", iconColor:"#3aaa6a"},
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [t]);

    const [activeIdx,  setActiveIdx]  = useState(0);
    const [badgeVal,   setBadgeVal]   = useState(3);
    const [cardPhases, setCardPhases] = useState<Record<string,CardPhase>>(
        () => Object.fromEntries(CARD_IDS.map((id,i) => [id, i===0?'active':'idle']))
    );

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // ── Single effect: canvas + resize + visibility + animation loop ──────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let phase: "hold" | "travel" = "hold";
        let t0 = performance.now();
        let aidx = 0;
        let waveFired = false;
        let rafId = 0;
        let visible = true;
        let cw = 0, ch = 0;
        const innerTimers: ReturnType<typeof setTimeout>[] = [];

        const startRAF = () => { if (!rafId) rafId = requestAnimationFrame(tick); };

        // Position cache
        const posCache: Record<string, Pt> = {};
        let posValid = false;

        const computePos = (id: string): Pt => {
            const dEl = document.getElementById(id);
            const mEl = document.getElementById(`${id}-mobile`);
            const isMob = (!dEl || dEl.getBoundingClientRect().width === 0) && (mEl && mEl.getBoundingClientRect().width > 0);
            const el = !isMob ? dEl : (mEl && mEl.getBoundingClientRect().width > 0) ? mEl : null;
            const ctr = document.getElementById("hero-scene-container");
            if (!el || !ctr) return ZERO_PT;
            const er = el.getBoundingClientRect(), cr = ctr.getBoundingClientRect();
            return {
                x: isMob ? er.right - cr.left - 12 : er.left - cr.left + er.width * 0.5,
                y: er.top - cr.top + er.height * 0.5,
            };
        };

        const getPos = (id: string): Pt => {
            if (!posValid) {
                CARD_IDS.forEach(cid => { posCache[cid] = computePos(cid); });
                posValid = true;
            }
            return posCache[id] ?? ZERO_PT;
        };

        const resize = () => {
            posValid = false;
            const parent = canvas.parentElement;
            if (!parent) return;
            const dpr = window.devicePixelRatio || 1;
            cw = parent.offsetWidth;
            ch = parent.offsetHeight;
            canvas.width = cw * dpr;
            canvas.height = ch * dpr;
            canvas.style.width = cw + 'px';
            canvas.style.height = ch + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        };
        resize();
        window.addEventListener('resize', resize);

        // Visibility — stop RAF when off-screen, restart when back in view
        const container = document.getElementById('hero-scene-container');
        const obs = new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            if (visible) startRAF();
        }, { threshold: 0 });
        if (container) obs.observe(container);

        const handleVisibility = () => { if (!document.hidden && visible) startRAF(); };
        document.addEventListener('visibilitychange', handleVisibility);

        const triggerArrival = (idx: number, next: number) => {
            const departId = CARD_IDS[idx], arriveId = CARD_IDS[next];
            setCardPhases(p => ({ ...p, [arriveId]: 'entering' }));
            const t1 = setTimeout(() => setCardPhases(p =>
                p[arriveId] === 'entering' ? { ...p, [arriveId]: 'active' } : p), BLOB_ANIM_MS);
            innerTimers.push(t1);
            setCardPhases(p => ({ ...p, [departId]: 'leaving' }));
            const t2 = setTimeout(() => setCardPhases(p =>
                p[departId] === 'leaving' ? { ...p, [departId]: 'idle' } : p), BLOB_ANIM_MS);
            innerTimers.push(t2);
        };

        const tick = (now: number) => {
            // Stop rescheduling when off-screen or tab hidden — IO/visibilitychange restarts us
            if (!visible || document.hidden) { rafId = 0; return; }
            rafId = requestAnimationFrame(tick);

            const from = getPos(CARD_IDS[aidx]);
            const to   = getPos(CARD_IDS[(aidx + 1) % 4]);
            if (from.x === 0 && from.y === 0) { posValid = false; return; }

            const elapsed = now - t0;

            if (phase === "hold") {
                if (elapsed >= HOLD_MS) {
                    phase = "travel";
                    waveFired = false;
                    t0 = now;
                }
                return;
            }

            // ── Travel phase — draw to canvas ────────────────────────────────
            const rawT = elapsed / TRAVEL_MS;
            const mainFront  = Math.min(rawT, 1.0);
            const mainTail   = Math.max(0, rawT - TAIL_LAG);
            const mainFrontE = ease(mainFront);
            const mainTailE  = ease(Math.min(mainTail, 1.0));

            const w1Front = Math.min(Math.max(0, rawT - W1_FRONT_LAG), 1.0);
            const w1Tail  = Math.max(0, rawT - W1_TAIL_LAG);
            const w2Front = Math.min(Math.max(0, rawT - W2_FRONT_LAG), 1.0);
            const w2Tail  = Math.max(0, rawT - W2_TAIL_LAG);

            ctx.clearRect(0, 0, cw, ch);

            // Wavy line 2 — dark green
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#166534';
            ctx.beginPath();
            drawWavySeg(ctx, from, to, ease(Math.min(w2Tail, 1.0)), ease(w2Front), 18, 1.5, Math.PI);
            ctx.stroke();

            // Wavy line 1 — dark green
            ctx.beginPath();
            drawWavySeg(ctx, from, to, ease(Math.min(w1Tail, 1.0)), ease(w1Front), 18, 1.5, 0);
            ctx.stroke();

            // Main line — main green
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#3aaa6a';
            ctx.beginPath();
            drawStraightSeg(ctx, from, to, mainTailE, mainFrontE);
            ctx.stroke();

            // Dot
            const dotX = from.x + (to.x - from.x) * mainFrontE;
            const dotY = from.y + (to.y - from.y) * mainFrontE;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 5, 0, TWO_PI);
            ctx.fillStyle = '#3aaa6a';
            ctx.fill();

            if (mainFront >= WAVE_TRIGGER_T && !waveFired) {
                waveFired = true;
                triggerArrival(aidx, (aidx + 1) % 4);
            }

            if (mainTail >= 1.0) {
                ctx.clearRect(0, 0, cw, ch);
                const next = (aidx + 1) % 4;
                aidx = next;
                setActiveIdx(next);
                phase = "hold";
                t0 = now;
            }
        };

        rafId = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(rafId);
            innerTimers.forEach(clearTimeout);
            window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', handleVisibility);
            obs.disconnect();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setBadgeVal(3);
        const iv = setInterval(() => setBadgeVal(p => Math.max(0, p - 1)), HOLD_MS / 3);
        return () => clearInterval(iv);
    }, [activeIdx]);

    return (
        <div
            id="hero-scene-container"
            className="relative flex flex-col items-stretch overflow-visible min-h-[600px] bg-green/[0.03]"
        >
            {/* Shared goo filter — one definition for all BlobWave cards */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
                <defs>
                    <filter id={GOO_FILTER_ID}>
                        <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation="10"/>
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7" result="goo"/>
                        <feBlend in2="goo" in="SourceGraphic" result="mix"/>
                    </filter>
                </defs>
            </svg>

            {/* Checker texture overlay — matches PlatformFeatures "Quick Start" card */}
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.03,
                    backgroundImage: `linear-gradient(45deg, #3aaa6a 25%, transparent 25%, transparent 75%, #3aaa6a 75%)`,
                    backgroundSize: '10px 10px',
                }}
            />
            {/* Canvas for line animation */}
            <canvas
                ref={canvasRef}
                className="hidden md:block absolute top-0 left-0 w-full h-full pointer-events-none z-[2]"
            />

            {/* Badge */}
            <div className="relative z-[3] flex justify-center pt-[76px] md:pt-12 opacity-0 animate-[fadeSlideUp_0.6s_ease-out_0.1s_forwards]">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green/30 bg-green/5 text-[12px] font-semibold text-green/80 shadow-[0_0_12px_rgba(58,170,106,0.15)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                    {t('badge') ?? 'AI-Powered Education Platform'}
                </div>
            </div>

            {/* Title */}
            <div className="relative z-[3] pt-4 text-center pb-0 hero px-4">
                <h1 className="text-[clamp(28px,5.5vw,52px)] md:text-[clamp(36px,5.5vw,52px)] font-bold text-dark leading-[1.1] tracking-[-0.04em] max-w-[680px] mx-auto hero-title whitespace-pre-wrap opacity-0 animate-[fadeSlideUp_0.6s_ease-out_0.25s_forwards]">
                    {t('title1')} <em className="not-italic text-green">{t('title_highlight')}</em>{t('title2')}
                </h1>
                <p className="mt-3 text-dark/55 text-sm md:text-base max-w-[480px] mx-auto leading-relaxed opacity-0 animate-[fadeSlideUp_0.6s_ease-out_0.4s_forwards]">
                    {t('subtitle') ?? 'Access free courses, track your progress, and prepare for your exams with Darsy.'}
                </p>
            </div>

            {/* Desktop cards + Diagram */}
            <div className="hidden md:grid relative z-[3] flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch px-0 pt-3 pb-4 min-h-0 opacity-0 animate-[fadeSlideUp_0.7s_ease-out_0.55s_forwards]">
                <div className="flex flex-col justify-between items-end px-[clamp(8px,2vw,36px)] py-1 min-w-0 overflow-hidden">
                    {[cardsData[0], cardsData[3]].map(card => (
                        <DesktopCard key={card.id} card={card}
                            phase={cardPhases[card.id] ?? 'idle'}
                            isActive={activeIdx === CARD_INDEX[card.id]}
                            badgeVal={badgeVal}/>
                    ))}
                </div>
                <div><Diagram/></div>
                <div className="flex flex-col justify-between items-start px-[clamp(8px,2vw,36px)] py-1 min-w-0 overflow-hidden">
                    {[cardsData[1], cardsData[2]].map(card => (
                        <DesktopCard key={card.id} card={card}
                            phase={cardPhases[card.id] ?? 'idle'}
                            isActive={activeIdx === CARD_INDEX[card.id]}
                            badgeVal={badgeVal}/>
                    ))}
                </div>
            </div>

            {/* Mobile cards + Diagram */}
            <div className="md:hidden relative z-[3] flex flex-col items-stretch pt-3 pb-6 gap-3 px-4 opacity-0 animate-[fadeSlideUp_0.7s_ease-out_0.55s_forwards]">
                <div className="w-full flex justify-center mb-2"><Diagram/></div>
                <MobileCardList cards={cardsData}/>
            </div>

        </div>
    );
}
