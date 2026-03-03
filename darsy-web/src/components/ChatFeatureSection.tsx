"use client";

import React, { useState, useEffect, useRef, useMemo, memo, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';
import { DownloadButton } from '@/components/DownloadButton';
import { MessageCircle } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────
const W = 255, H_COLLAPSED = 110, H_EXPANDED = 240, r = 42;
const triW = 90, triH = 68, CX = W / 2, bottomCornerR = 42;
const tipR = 12, baseR = 24, circleR = 17, GAP = 60, COL_GAP = 30;
const TRAIL_LEN = 20;
const MAX_ORBS = 18;
const KAPPA = 0.5523, CAP_R = 90;
const PAGE_PAD_V = 120;

const INTRO_ORIGIN = ["top right", "bottom right", "top left", "bottom left"] as const;
const INTRO_ROT = ["rotateZ(-90deg)", "rotateZ(90deg)", "rotateZ(90deg)", "rotateZ(-90deg)"] as const;
const DIAG_OFFSETS: [number, number][] = [[-40, -40], [-40, 40], [40, -40], [40, 40]];

// ─── Module-level constants (visual only) ───────────────────────────────────
const GRAD_A_TOP = { bg1: "#16a34a", bg2: "#22c55e" };
const GRAD_A_BOT = { bg1: "#22c55e", bg2: "#16a34a" };
const GRAD_B_TOP = { bg1: "#15803d", bg2: "#16a34a" };
const GRAD_B_BOT = { bg1: "#16a34a", bg2: "#22c55e" };

// ─── buildPath cache ──────────────────────────────────────────────────────
const pathCache = new Map<number, ReturnType<typeof _buildPath>>();
function _buildPath(H: number) {
    const lx = W / 2 - triW / 2, rx = W / 2 + triW / 2, ty = H - triH;
    return {
        path: `M${r},0 H${W - r} Q${W},0 ${W},${r} V${H - bottomCornerR} Q${W},${H} ${W - bottomCornerR},${H} H${rx + baseR} Q${rx},${H} ${rx - baseR} ${H - baseR * (triH / (triW / 2))} L${CX + tipR},${ty + tipR} Q${CX},${ty} ${CX - tipR},${ty + tipR} L${lx + baseR},${H - baseR * (triH / (triW / 2))} Q${lx},${H} ${lx - baseR},${H} H${bottomCornerR} Q0,${H} 0,${H - bottomCornerR} V${r} Q0,0 ${r},0 Z`,
        ty,
        circleY: ty - circleR - 4,
        greenDotY: ty + 32,
        flippedCircleY: H - (ty - circleR - 4) - circleR,
        flippedGreenDotY: H - (ty + 32),
    };
}
function buildPath(H: number) {
    if (!pathCache.has(H)) pathCache.set(H, _buildPath(H));
    return pathCache.get(H)!;
}

// ─── Bezier math ──────────────────────────────────────────────────────────
function bezier(t: number, fx: number, fy: number, c1x: number, c1y: number, c2x: number, c2y: number, tx: number, ty: number) {
    const mt = 1 - t, mt2 = mt * mt, mt3 = mt2 * mt, t2 = t * t, t3 = t2 * t;
    return [
        mt3 * fx + 3 * mt2 * t * c1x + 3 * mt * t2 * c2x + t3 * tx,
        mt3 * fy + 3 * mt2 * t * c1y + 3 * mt * t2 * c2y + t3 * ty,
    ] as const;
}

type FlatSeg = readonly [number, number, number, number, number, number, number, number, number];

function bezierSegments(t: number, segs: FlatSeg[]) {
    let tw = 0;
    for (const s of segs) tw += s[8];
    let rem = t * tw;
    for (const s of segs) {
        if (rem <= s[8]) return bezier(rem / s[8], s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7]);
        rem -= s[8];
    }
    const l = segs[segs.length - 1];
    return bezier(1, l[0], l[1], l[2], l[3], l[4], l[5], l[6], l[7]);
}

function makeFlatSeg(fx: number, fy: number, c1x: number, c1y: number, c2x: number, c2y: number, tx: number, ty: number, w: number): FlatSeg {
    return [fx, fy, c1x, c1y, c2x, c2y, tx, ty, w];
}

function seg1(fx: number, fy: number, c1x: number, c1y: number, c2x: number, c2y: number, tx: number, ty: number): FlatSeg[] {
    return [makeFlatSeg(fx, fy, c1x, c1y, c2x, c2y, tx, ty, 1)];
}

function makeSigmoid(ax: number, ay: number, bx: number, by: number): FlatSeg[] {
    const sY = Math.sign(by - ay), sX = Math.sign(bx - ax);
    const p1x = ax + sX * CAP_R, p1y = ay + sY * CAP_R;
    const p2x = bx - sX * CAP_R, p2y = by - sY * CAP_R;
    return [
        makeFlatSeg(ax, ay, ax, ay + sY * CAP_R * KAPPA, p1x - sX * CAP_R * KAPPA, p1y, p1x, p1y, CAP_R),
        makeFlatSeg(p1x, p1y, p1x + (p2x - p1x) / 3, p1y + (p2y - p1y) / 3, p1x + (p2x - p1x) * 2 / 3, p1y + (p2y - p1y) * 2 / 3, p2x, p2y, Math.hypot(p2x - p1x, p2y - p1y)),
        makeFlatSeg(p2x, p2y, p2x + sX * CAP_R * KAPPA, p2y, bx, by - sY * CAP_R * KAPPA, bx, by, CAP_R),
    ];
}

type DotsShape = { a_top: P; a_bot: P; b_top: P; b_bot: P };
function buildRoutes(dots: DotsShape): FlatSeg[][] {
    const { a_top: at, a_bot: ab, b_top: bt, b_bot: bb } = dots;
    return [
        seg1(at.x, at.y, at.x - 80, at.y + (ab.y - at.y) * 0.25, ab.x - 80, at.y + (ab.y - at.y) * 0.75, ab.x, ab.y),
        seg1(ab.x, ab.y, ab.x - 80, ab.y - (ab.y - at.y) * 0.25, at.x - 80, ab.y - (ab.y - at.y) * 0.75, at.x, at.y),
        seg1(bt.x, bt.y, bt.x + 80, bt.y + (bb.y - bt.y) * 0.25, bb.x + 80, bt.y + (bb.y - bt.y) * 0.75, bb.x, bb.y),
        seg1(bb.x, bb.y, bb.x + 80, bb.y - (bb.y - bt.y) * 0.25, bt.x + 80, bb.y - (bb.y - bt.y) * 0.75, bt.x, bt.y),
        seg1(at.x, at.y, at.x, at.y + 180, bt.x, bt.y + 180, bt.x, bt.y),
        seg1(bt.x, bt.y, bt.x, bt.y + 180, at.x, at.y + 180, at.x, at.y),
        seg1(ab.x, ab.y, ab.x, ab.y - 180, bb.x, bb.y - 180, bb.x, bb.y),
        seg1(bb.x, bb.y, bb.x, bb.y - 180, ab.x, ab.y - 180, ab.x, ab.y),
        makeSigmoid(ab.x, ab.y, bt.x, bt.y),
        makeSigmoid(bt.x, bt.y, ab.x, ab.y),
        makeSigmoid(bb.x, bb.y, at.x, at.y),
        makeSigmoid(at.x, at.y, bb.x, bb.y),
    ];
}

// ─── OrbCanvas: single <canvas> + one master RAF replaces 18 SVG + 18 RAFs ─
//
//  WHY THIS IS MUCH FASTER:
//  • Before: 18 separate RAF callbacks/frame × bezier math + 4 setAttribute calls each
//            + CSS drop-shadow filter re-rasterising 18 animated SVG elements/frame
//  • After:  1 RAF callback, ctx.clearRect + draw all active slots in one pass,
//            no SVG DOM, no CSS filters, no GC from string building
//
type P = { x: number; y: number };

type OrbSlot = {
    active: boolean;
    segs: FlatSeg[];
    t0: number;
    dur: number;
    trail: Float32Array;   // TRAIL_LEN * 2  (pre-allocated, reused)
    headIdx: number;
    len: number;
};

function createSlots(): OrbSlot[] {
    return Array.from({ length: MAX_ORBS }, () => ({
        active: false, segs: [], t0: 0, dur: 0,
        trail: new Float32Array(TRAIL_LEN * 2),
        headIdx: 0, len: 0,
    }));
}

const PHASE2_RANGE = 250;

// Pre-built color lookup table: 101 opacity steps (0.00 → 1.00) × 4 alpha variants.
// Avoids ALL string allocation inside the draw loop — zero GC pressure per frame.
const COLOR_LUT = (() => {
    const trail: string[] = [], glow: string[] = [], mid: string[] = [], core: string[] = [];
    for (let i = 0; i <= 100; i++) {
        const o = i / 100;
        trail.push(`rgba(34,197,94,${(o * 0.80).toFixed(2)})`);
        glow.push(`rgba(34,197,94,${(o * 0.15).toFixed(2)})`);
        mid.push(`rgba(34,197,94,${(o * 0.90).toFixed(2)})`);
        core.push(`rgba(34,197,94,${o.toFixed(2)})`);
    }
    return { trail, glow, mid, core };
})();

const OrbCanvas = memo(function OrbCanvas({ dots, canvasW, canvasH, active }: { dots: DotsShape; canvasW: number; canvasH: number; active: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const routesRef = useRef<FlatSeg[][]>([]);
    const slotsRef = useRef<OrbSlot[]>(createSlots());
    const nextIdx = useRef(0);
    const rafRef = useRef(0);
    const spawnRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    // FIX 1: track whether the section is in the viewport
    const visibleRef = useRef(false);

    // Keep routes in sync with dots
    useEffect(() => {
        if (dots.a_top) routesRef.current = buildRoutes(dots);
    }, [dots.a_top?.x, dots.a_top?.y, dots.a_bot?.y,
    dots.b_top?.x, dots.b_top?.y, dots.b_bot?.y]);

    // FIX 1: IntersectionObserver — pause RAF when scrolled off-screen,
    //         resume instantly when scrolled back. Threshold 0 means any
    //         single pixel visible counts as "in view".
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const obs = new IntersectionObserver(
            ([entry]) => { visibleRef.current = entry.isIntersecting; },
            { threshold: 0 }
        );
        obs.observe(canvas);
        return () => obs.disconnect();
    }, []);

    // ── Master RAF ─────────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // FIX 2: desynchronized hint lets the browser paint the canvas on its
        //         own schedule, decoupled from the main-thread scroll paint.
        const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })!;
        const OX = PHASE2_RANGE;
        const TWO_PI = Math.PI * 2;

        // FIX 3: ctx state that never changes goes outside the per-slot loop
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const draw = (now: number) => {
            rafRef.current = requestAnimationFrame(draw);

            // FIX 1: skip ALL work when off-screen or tab hidden
            if (!visibleRef.current || document.hidden) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const slot of slotsRef.current) {
                if (!slot.active) continue;

                const t = Math.min((now - slot.t0) / slot.dur, 1);
                const et = t * t * (3 - 2 * t);
                // FIX 3: integer LUT index — no toFixed(), no string alloc
                const oi = Math.round((t < 0.05 ? t / 0.05 : t > 0.97 ? (1 - t) / 0.03 : 1) * 100);
                const [px, py] = bezierSegments(et, slot.segs);
                const hx = px + OX;

                slot.trail[slot.headIdx * 2] = hx;
                slot.trail[slot.headIdx * 2 + 1] = py;
                slot.headIdx = (slot.headIdx + 1) % TRAIL_LEN;
                if (slot.len < TRAIL_LEN) slot.len++;

                if (slot.len >= 2) {
                    // Trail
                    ctx.beginPath();
                    for (let i = 0; i < slot.len; i++) {
                        const ti = (slot.headIdx - slot.len + i + TRAIL_LEN) % TRAIL_LEN;
                        i === 0
                            ? ctx.moveTo(slot.trail[ti * 2], slot.trail[ti * 2 + 1])
                            : ctx.lineTo(slot.trail[ti * 2], slot.trail[ti * 2 + 1]);
                    }
                    ctx.strokeStyle = COLOR_LUT.trail[oi];
                    ctx.stroke();

                    // Glow halo
                    ctx.beginPath(); ctx.arc(hx, py, 9, 0, TWO_PI);
                    ctx.fillStyle = COLOR_LUT.glow[oi]; ctx.fill();
                    // Mid dot
                    ctx.beginPath(); ctx.arc(hx, py, 5, 0, TWO_PI);
                    ctx.fillStyle = COLOR_LUT.mid[oi]; ctx.fill();
                    // Bright core
                    ctx.beginPath(); ctx.arc(hx, py, 2, 0, TWO_PI);
                    ctx.fillStyle = COLOR_LUT.core[oi]; ctx.fill();
                }

                if (t >= 1) { slot.active = false; slot.len = 0; }
            }
        };

        rafRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    // ── Spawn loop — also respects visibility ──────────────────────────────
    useEffect(() => {
        const spawn = () => {
            // Don't queue new orbs while off-screen or if phase2 is not active
            if (visibleRef.current && active) {
                const routes = routesRef.current;
                if (routes.length) {
                    const slot = slotsRef.current[nextIdx.current];
                    slot.active = true;
                    slot.segs = routes[Math.floor(Math.random() * routes.length)];
                    slot.t0 = performance.now();
                    slot.dur = 1800 + Math.random() * 700;
                    slot.headIdx = 0;
                    slot.len = 0;
                    nextIdx.current = (nextIdx.current + 1) % MAX_ORBS;
                }
            }
            spawnRef.current = setTimeout(spawn, 300 + Math.random() * 200);
        };
        if (active) spawnRef.current = setTimeout(spawn, 400);
        return () => clearTimeout(spawnRef.current);
    }, [active]);

    const totalW = canvasW + PHASE2_RANGE * 2;

    return (
        <canvas
            ref={canvasRef}
            width={totalW}
            height={canvasH}
            style={{
                position: 'absolute', top: 0, left: -PHASE2_RANGE,
                pointerEvents: 'none', zIndex: 999,
                // FIX 2: promote to its own compositor layer so the browser
                //         doesn't have to repaint it during main-thread scroll
                willChange: 'transform',
                // Prevent any inherited transforms from scaling the canvas bitmap
                transform: 'translateZ(0)',
            }}
        />
    );
});

// ─── GreenCard ────────────────────────────────────────────────────────────
const GreenCard = memo(function GreenCard({ position, visible, title, subtitle, icon }: {
    position: string; visible: boolean; title: string; subtitle: string; icon: string;
}) {
    const isGroups = icon === "groups";
    return (
        <div style={{
            position: "absolute",
            ...(position === "top" ? { top: 20 } : { bottom: 20 }),
            left: 20, right: 20, height: H_EXPANDED * 0.35,
            background: "#ffffff", borderRadius: 20, padding: "15px",
            display: "flex", flexDirection: "column", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(0,0,0,0.08)", border: "1px solid rgba(255,255,255,0.4)",
            boxSizing: "border-box", overflow: "hidden",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0px)" : position === "top" ? "translateY(-30px)" : "translateY(30px)",
            transition: "opacity 0.45s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)",
            pointerEvents: visible ? "auto" : "none",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isGroups
                        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 800, color: "#111", letterSpacing: "-0.01em" }}>{title}</p>
                    <p style={{ margin: 0, fontSize: 10.5, color: "#666", fontWeight: 500, lineHeight: 1.35 }}>{subtitle}</p>
                </div>
            </div>
        </div>
    );
});

// ─── CardPair ─────────────────────────────────────────────────────────────
type CardPairProps = {
    hoverTop: boolean; hoverBot: boolean;
    setHoverTop: (v: boolean) => void;
    setHoverBot: (v: boolean) => void;
    contentTop: { title: string; subtitle: string; icon: string };
    contentBot: { title: string; subtitle: string; icon: string };
    gradientTop: typeof GRAD_A_TOP;
    gradientBot: typeof GRAD_A_BOT;
    introTop: React.CSSProperties;
    introBot: React.CSSProperties;
    textureTop: string;
    textureBot: string;
    dirTextureTop: string;
    dirTextureBot: string;
};

const CardPair = memo(function CardPair({
    hoverTop, hoverBot, setHoverTop, setHoverBot,
    contentTop, contentBot, gradientTop, gradientBot, introTop, introBot,
    textureTop, textureBot, dirTextureTop, dirTextureBot,
}: CardPairProps) {
    const topData = buildPath(H_EXPANDED);
    const botData = buildPath(H_EXPANDED);
    const clipTop = hoverTop ? H_EXPANDED : H_COLLAPSED;
    const clipBot = hoverBot ? H_EXPANDED : H_COLLAPSED;
    const uid = contentTop.title + contentBot.title;
    const vg = "vg-" + uid.replace(/\s/g, "");
    const clTop = "clip-" + uid + "-top";
    const clBot = "clip-" + uid + "-bot";
    const PAIR_H = H_COLLAPSED * 2 + GAP;

    return (
        <div style={{ position: "relative", width: W, height: PAIR_H, cursor: "pointer", filter: "drop-shadow(0 15px 35px rgba(0,0,0,0.1))", transition: "all 0.5s cubic-bezier(0.2,0.8,0.2,1)", flexShrink: 0, overflow: "visible" }}>

            {/* Top card */}
            <div style={{ ...introTop, position: "absolute", left: 0, right: 0, bottom: H_COLLAPSED + GAP, height: H_COLLAPSED, overflow: "visible" }}>
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, cursor: "pointer" }}
                    onMouseEnter={() => setHoverTop(true)} onMouseLeave={() => setHoverTop(false)}>
                    <div style={{ overflow: "hidden", height: clipTop, position: "absolute", bottom: 0, left: 0, right: 0, transition: "height 0.5s cubic-bezier(0.4,0,0.2,1)", borderRadius: r + "px " + r + "px 0 0" }}>
                        <svg width={W} height={H_EXPANDED} viewBox={"0 0 " + W + " " + H_EXPANDED}
                            style={{ display: "block", position: "absolute", bottom: 0, left: 0 }}>
                            <defs>
                                <clipPath id={clTop}><path d={topData.path} /></clipPath>
                                <linearGradient id="grad-top-dir" x1="0%" y1="100%" x2="0%" y2="0%">
                                    <stop offset="0%" stopColor="white" stopOpacity="0.7" />
                                    <stop offset="70%" stopColor="white" stopOpacity="0" />
                                </linearGradient>
                                <mask id="mask-top-dir">
                                    <rect width={W} height={H_EXPANDED} fill="url(#grad-top-dir)" />
                                </mask>
                            </defs>
                            <path d={topData.path} fill={gradientTop.bg2} />
                            <path d={topData.path} fill={`url(#${textureTop})`} mask="url(#mask-fade)" opacity="0.8" />
                            <path d={topData.path} fill={`url(#${dirTextureTop})`} mask="url(#mask-top-dir)" />
                            <path d={topData.path} fill="rgba(255,255,255,0.04)" filter="url(#filter-noise)" style={{ pointerEvents: 'none' }} />
                            <path d={topData.path} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" className="card-border-anim" />
                            <circle cx={CX} cy={topData.circleY} r={circleR} fill="white" stroke="rgba(34,197,94,0.1)" strokeWidth="1" />
                            <circle cx={CX} cy={topData.circleY - 5} r={5.5} fill="#22c55e" />
                            <ellipse cx={CX} cy={topData.circleY + 11} rx={8.5} ry={6} fill="#22c55e" />
                            <circle cx={CX} cy={topData.greenDotY} r={6} fill="#22c55e" className="glow-dot" />
                            <circle cx={CX} cy={topData.greenDotY} r={6} fill="none" stroke="#22c55e" strokeWidth="2" className="ripple-dot" />
                        </svg>
                        <GreenCard position="top" visible={hoverTop} {...contentTop} />
                    </div>
                </div>
            </div>

            {/* Bottom card */}
            <div style={{ ...introBot, position: "absolute", left: 0, right: 0, top: H_COLLAPSED + GAP, height: H_COLLAPSED, overflow: "visible" }}>
                <div style={{ position: "absolute", left: 0, right: 0, top: 0, cursor: "pointer" }}
                    onMouseEnter={() => setHoverBot(true)} onMouseLeave={() => setHoverBot(false)}>
                    <div style={{ overflow: "hidden", height: clipBot, position: "absolute", top: 0, left: 0, right: 0, transition: "height 0.5s cubic-bezier(0.4,0,0.2,1)", borderRadius: "0 0 " + r + "px " + r + "px" }}>
                        <svg width={W} height={H_EXPANDED} viewBox={"0 0 " + W + " " + H_EXPANDED}
                            style={{ display: "block", transform: "scaleY(-1)", transformOrigin: "center" }}>
                            <defs>
                                <clipPath id={clBot}><path d={botData.path} /></clipPath>
                                <linearGradient id="grad-bot-dir" x1="0%" y1="100%" x2="0%" y2="0%">
                                    <stop offset="0%" stopColor="white" stopOpacity="0.7" />
                                    <stop offset="70%" stopColor="white" stopOpacity="0" />
                                </linearGradient>
                                <mask id="mask-bot-dir">
                                    <rect width={W} height={H_EXPANDED} fill="url(#grad-bot-dir)" />
                                </mask>
                            </defs>
                            <path d={botData.path} fill={gradientBot.bg2} />
                            <path d={botData.path} fill={`url(#${textureBot})`} mask="url(#mask-fade)" opacity="0.8" />
                            <path d={botData.path} fill={`url(#${dirTextureBot})`} mask="url(#mask-bot-dir)" />
                            <path d={botData.path} fill="rgba(255,255,255,0.04)" filter="url(#filter-noise)" style={{ pointerEvents: 'none' }} />
                            <path d={botData.path} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" className="card-border-anim" />
                        </svg>
                        <div style={{ position: "absolute", top: botData.flippedCircleY, left: CX - circleR, width: circleR * 2, height: circleR * 2 }}>
                            <svg width={circleR * 2} height={circleR * 2} viewBox={"0 0 " + (circleR * 2) + " " + (circleR * 2)}>
                                <circle cx={circleR} cy={circleR} r={circleR} fill="white" stroke="rgba(34,197,94,0.1)" strokeWidth="1" />
                                <circle cx={circleR} cy={circleR - 5} r={5.5} fill="#22c55e" />
                                <ellipse cx={circleR} cy={circleR + 11} rx={8.5} ry={6} fill="#22c55e" />
                            </svg>
                        </div>
                        <svg width={W} height={H_EXPANDED} viewBox={"0 0 " + W + " " + H_EXPANDED}
                            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
                            <circle cx={CX} cy={botData.flippedGreenDotY} r={6} fill="#22c55e" className="glow-dot" style={{ animationDelay: "0.5s" }} />
                            <circle cx={CX} cy={botData.flippedGreenDotY} r={6} fill="none" stroke="#22c55e" strokeWidth="2" className="ripple-dot" style={{ animationDelay: "0.5s" }} />
                        </svg>
                        <GreenCard position="bottom" visible={hoverBot} {...contentBot} />
                    </div>
                </div>
            </div>

            <svg width={W} height={PAIR_H} viewBox={"0 0 " + W + " " + PAIR_H}
                style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 5 }}>
                <defs>
                    <linearGradient id={vg} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.1" />
                        <stop offset="50%" stopColor="#22c55e" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
                    </linearGradient>
                </defs>
                <line x1={CX} y1={H_COLLAPSED - (H_EXPANDED - topData.greenDotY)}
                    x2={CX} y2={H_COLLAPSED + GAP + botData.flippedGreenDotY}
                    stroke={"url(#" + vg + ")"} strokeWidth="1.5" strokeDasharray="6 5" />
            </svg>
        </div>
    );
});

// ─── ChatMessage ──────────────────────────────────────────────────────────
const ChatMessage = memo(function ChatMessage({ msg, delay = 0 }: { msg: any; delay?: number }) {
    const [active, setActive] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setActive(true), delay * 1000 + 10);
        return () => clearTimeout(t);
    }, [delay]);
    return (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, opacity: active ? 1 : 0, transform: active ? "translateY(0)" : "translateY(12px) scale(0.98)", transition: "all 0.45s cubic-bezier(0.2,1,0.3,1)" }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: msg.color + "15", border: "1.5px solid " + msg.color + "30", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                <img src={msg.img} alt={msg.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#111" }}>{msg.name}</span>
                    <span style={{ fontSize: 10, color: "rgba(0,0,0,0.45)", fontWeight: 600 }}>{msg.time}</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(0,0,0,0.7)", fontWeight: 500, lineHeight: 1.55 }}>{msg.text}</div>
            </div>
        </div>
    );
});

// ─── ChatRoomUI ───────────────────────────────────────────────────────────
// OPTIMIZED: memo'd to prevent re-renders on parent hover changes
//            pulse animation moved to direct DOM (no state re-render)
//            typing text already uses direct DOM ref
const ChatRoomUI = memo(function ChatRoomUI({ phase2, messages, liveMessages, roomTitle, roomStatus }: { phase2: boolean, messages: any[], liveMessages: any[], roomTitle: string, roomStatus: string }) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const t = useTranslations('Hero');

    const [typing, setTyping] = useState(false);
    const [visibleCount, setVisibleCount] = useState(0);
    const [liveIdx, setLiveIdx] = useState(0);
    const [isSending, setIsSending] = useState(false);

    // OPTIMIZATION: pulse via direct DOM — eliminated a state variable + re-render
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputSpan = useRef<HTMLSpanElement>(null);

    // Stagger base messages once on mount
    useEffect(() => {
        let i = 0, tid: ReturnType<typeof setTimeout>;
        const step = () => { i++; setVisibleCount(i); if (i < messages.length) tid = setTimeout(step, 100); };
        tid = setTimeout(step, 300);
        return () => clearTimeout(tid);
    }, []);

    // Pulse wrapper via direct DOM when a live message arrives — no state re-render
    useEffect(() => {
        if (liveIdx === 0) return;
        const el = wrapperRef.current;
        if (!el) return;
        el.style.transform = "translate(-50%, -50%) scale(1.06)";
        el.style.transition = "transform 0.2s cubic-bezier(0.2, 0, 0, 1)";
        const id = setTimeout(() => {
            el.style.transform = "translate(-50%, -50%) scale(1)";
            el.style.transition = "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)";
        }, 200);
        return () => clearTimeout(id);
    }, [liveIdx]);

    // Typing loop — direct DOM for input text, minimal state flips
    useEffect(() => {
        let cancelled = false, rafId = 0;
        let state = "INITIAL_WAIT", nextTime = performance.now() + 1200;
        let msgIdx = 0, typeIdx = 0;
        const tick = (now: number) => {
            if (cancelled) return;
            rafId = requestAnimationFrame(tick);
            if (now < nextTime) return;
            const msg = liveMessages[msgIdx % liveMessages.length];
            const chars = msg.text;
            if (state === "INITIAL_WAIT" || state === "WAITING") {
                state = "TYPING_WAIT"; setTyping(true);
                if (inputSpan.current) inputSpan.current.textContent = "";
                nextTime = now + 800;
            } else if (state === "TYPING_WAIT") {
                state = "TYPING"; typeIdx = 0; nextTime = now + 60;
            } else if (state === "TYPING") {
                typeIdx++;
                if (inputSpan.current) inputSpan.current.textContent = chars.slice(0, typeIdx);
                if (typeIdx >= chars.length) { state = "PRE_SEND_WAIT"; nextTime = now + 600; }
                else nextTime = now + 60;
            } else if (state === "PRE_SEND_WAIT") {
                state = "SENDING"; setTyping(false); setIsSending(true);
                if (inputSpan.current) inputSpan.current.textContent = "";
                nextTime = now + 500;
            } else if (state === "SENDING") {
                setIsSending(false); setLiveIdx(p => p + 1);
                state = "WAITING"; msgIdx++; nextTime = now + 2800;
            }
        };
        rafId = requestAnimationFrame(tick);
        return () => { cancelled = true; cancelAnimationFrame(rafId); };
    }, []);

    const allMessages = useMemo(() =>
        [...messages, ...liveMessages.slice(0, liveIdx)].slice(-6),
        [liveIdx, messages, liveMessages]);

    return (
        <div
            ref={wrapperRef}
            dir={document.documentElement.dir || "ltr"}
            style={{
                position: "absolute", top: "50%", left: "50%",
                // Initial scale/opacity handled via CSS class for zero-JS first paint
                transform: "translate(-50%, -50%)",
                width: 440, zIndex: 9999, pointerEvents: "none",
                willChange: "transform, opacity",
            }}
        >
            <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 32, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)" }}>
                {/* Header */}
                <div style={{ padding: "18px 22px 16px", borderBottom: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.3)" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#111", letterSpacing: "-0.01em" }}>{roomTitle}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px rgba(34,197,94,0.4)" }} />
                            <span style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{roomStatus}</span>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div style={{ padding: "16px 20px 12px", display: "flex", flexDirection: "column", gap: 16, minHeight: 220, background: "rgba(0,0,0,0.02)" }}>
                    {allMessages.map((msg) => {
                        const isBase = msg.id < 100;
                        if (isBase && msg.id > visibleCount) return null;
                        return <ChatMessage key={msg.id} msg={msg} delay={isBase ? (msg.id - 1) * 0.1 : 0} />;
                    })}
                    {/* Typing dots */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: typing ? 1 : 0, transform: typing ? "translateY(0)" : "translateY(6px)", transition: "opacity 0.25s ease, transform 0.25s ease" }}>
                        <div style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: "#22c55e" }}>I</span>
                        </div>
                        <div style={{ padding: "8px 14px", background: "rgba(34,197,94,0.05)", borderRadius: 12, display: "flex", gap: 5, alignItems: "center" }}>
                            {[0, 1, 2].map(k => <span key={k} style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", opacity: 0.5, display: "inline-block", animation: "typingBounce 1.2s ease-in-out infinite", animationDelay: `${k * 0.18}s` }} />)}
                        </div>
                    </div>
                </div>

                {/* Input bar */}
                <div style={{ padding: "0 18px 18px" }}>
                    <div style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 16, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                        <span ref={inputSpan} style={{ flex: 1, fontSize: 13, color: "#333", fontWeight: 500 }} />
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform 0.15s", transform: isSending ? "scale(0.85)" : "scale(1)" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div style={{ marginTop: 30, display: "flex", justifyContent: "center", opacity: phase2 ? 1 : 0, transform: phase2 ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.8s ease 0.3s, transform 0.8s cubic-bezier(0.23,1,0.32,1) 0.3s", pointerEvents: phase2 ? "auto" : "none" }}>
                <DownloadButton
                    id="chat-cta"
                    href="#"
                    text={t('cta_btn_title') || "Join the discussion"}
                    icon={<MessageCircle size={22} />}
                    onClick={(e) => {
                        e.preventDefault();
                        router.push(isAuthenticated ? '/profile/chat' : '/login');
                    }}
                />
            </div>
        </div>
    );
});

// ─── Hover state reducer — batches 4 booleans, one setState call ──────────
type HoverState = { aTop: boolean; aBot: boolean; bTop: boolean; bBot: boolean };
type HoverAction =
    | { type: 'SET_A_TOP'; v: boolean } | { type: 'SET_A_BOT'; v: boolean }
    | { type: 'SET_B_TOP'; v: boolean } | { type: 'SET_B_BOT'; v: boolean };
const hoverInit: HoverState = { aTop: false, aBot: false, bTop: false, bBot: false };
function hoverReducer(s: HoverState, a: HoverAction): HoverState {
    switch (a.type) {
        case 'SET_A_TOP': return s.aTop === a.v ? s : { ...s, aTop: a.v };
        case 'SET_A_BOT': return s.aBot === a.v ? s : { ...s, aBot: a.v };
        case 'SET_B_TOP': return s.bTop === a.v ? s : { ...s, bTop: a.v };
        case 'SET_B_BOT': return s.bBot === a.v ? s : { ...s, bBot: a.v };
    }
}

// ─── Stable setter factories (created once) ───────────────────────────────
function makeSetters(dispatch: React.Dispatch<HoverAction>) {
    return {
        setATop: (v: boolean) => dispatch({ type: 'SET_A_TOP', v }),
        setABot: (v: boolean) => dispatch({ type: 'SET_A_BOT', v }),
        setBTop: (v: boolean) => dispatch({ type: 'SET_B_TOP', v }),
        setBBot: (v: boolean) => dispatch({ type: 'SET_B_BOT', v }),
    };
}

// ─── Main export ──────────────────────────────────────────────────────────
export const ChatFeatureSection = () => {
    const t = useTranslations('Hero');
    const [hover, dispatchHover] = useReducer(hoverReducer, hoverInit);

    // OPTIMIZATION: stable setters via useMemo — created once, never change
    const setters = useMemo(() => makeSetters(dispatchHover), []);

    const [settled, setSettled] = useState(false);
    const [phase2, setPhase2] = useState(false);

    const sectionRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            setIsVisible(e.isIntersecting);
        }, { threshold: 0.15 });
        if (sectionRef.current) obs.observe(sectionRef.current);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) {
            setSettled(false);
            setPhase2(false);
            return;
        }
        const t1 = setTimeout(() => setSettled(true), 600);
        const t2 = setTimeout(() => setPhase2(true), 2000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [isVisible]);

    const Htop_A = hover.aTop ? H_EXPANDED : H_COLLAPSED, Hbot_A = hover.aBot ? H_EXPANDED : H_COLLAPSED;
    const Htop_B = hover.bTop ? H_EXPANDED : H_COLLAPSED, Hbot_B = hover.bBot ? H_EXPANDED : H_COLLAPSED;

    const topDataA = buildPath(Htop_A), botDataA = buildPath(Hbot_A);
    const topDataB = buildPath(Htop_B), botDataB = buildPath(Hbot_B);

    const colBX = W + COL_GAP;
    const canvasW = W * 2 + COL_GAP;
    const canvasH = Math.max(Htop_A + GAP + Hbot_A, Htop_B + GAP + Hbot_B) + PAGE_PAD_V * 2;

    const phase2DxLeft = phase2 ? -200 : 0;
    const phase2DxRight = phase2 ? 200 : 0;

    const dots = useMemo(() => ({
        a_top: { x: CX + (settled ? -40 : 0) + phase2DxLeft, y: PAGE_PAD_V + topDataA.greenDotY + (settled ? -40 : 0) },
        a_bot: { x: CX + (settled ? -40 : 0) + phase2DxLeft, y: PAGE_PAD_V + Htop_A + GAP + botDataA.flippedGreenDotY + (settled ? 40 : 0) },
        b_top: { x: colBX + CX + (settled ? 40 : 0) + phase2DxRight, y: PAGE_PAD_V + topDataB.greenDotY + (settled ? -40 : 0) },
        b_bot: { x: colBX + CX + (settled ? 40 : 0) + phase2DxRight, y: PAGE_PAD_V + Htop_B + GAP + botDataB.flippedGreenDotY + (settled ? 40 : 0) },
    }), [settled, phase2DxLeft, phase2DxRight,
        topDataA.greenDotY, Htop_A, botDataA.flippedGreenDotY,
        topDataB.greenDotY, Htop_B, botDataB.flippedGreenDotY, colBX]);

    // OPTIMIZATION: pre-compute all 4 intro style objects together — stable references
    //               previously makeIntro() was called 4x per render, each returning a new object
    //               which broke CardPair's React.memo entirely
    const introStyles = useMemo((): React.CSSProperties[] =>
        DIAG_OFFSETS.map((_, idx) => {
            const [dx, dy] = DIAG_OFFSETS[idx];
            const px2 = (idx === 0 || idx === 1) ? phase2DxLeft : phase2DxRight;
            return {
                transformOrigin: INTRO_ORIGIN[idx],
                transform: settled
                    ? `rotateZ(0deg) translate(${dx + px2}px,${dy}px)`
                    : INTRO_ROT[idx],
                transition: phase2
                    ? "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)"
                    : settled
                        ? `transform 0.5s cubic-bezier(0.5, 0, 0, 1) ${idx * 80}ms`
                        : "none",
                willChange: "transform",
            };
        }),
        [settled, phase2, phase2DxLeft, phase2DxRight]);

    return (
        <div ref={sectionRef} dir="ltr" className="relative w-full min-h-[90vh] bg-[radial-gradient(circle_at_center,_#dcfce7_0%,_#ffffff_100%)] overflow-hidden flex items-center justify-center py-24">
            <style>{`
                @keyframes glow{0%,100%{opacity:1}50%{opacity:0.4}}
                @keyframes ripple{0%{r:6;opacity:0.9}100%{r:22;opacity:0}}
                @keyframes typingBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
                @keyframes borderFlow{0%{stroke-dashoffset:1000}100%{stroke-dashoffset:0}}
                .glow-dot{animation:glow 1.8s ease-in-out infinite}
                .ripple-dot{animation:ripple 1.8s ease-out infinite}
                .card-border-anim{stroke-dasharray:200 800;animation:borderFlow 15s linear infinite}
            `}</style>
            <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
                <svg>
                    <defs>
                        <pattern id="pattern-hex" x="0" y="0" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(0.8) rotate(30)">
                            <path d="M25 0 L50 14.4 L50 28.8 L25 43.4 L0 28.8 L0 14.4 Z" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="2 2" />
                        </pattern>
                        <pattern id="pattern-circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="10" cy="10" r="1.5" fill="rgba(255,255,255,0.2)" />
                            <circle cx="30" cy="25" r="2.5" fill="rgba(255,255,255,0.12)" />
                            <circle cx="15" cy="35" r="1" fill="rgba(255,255,255,0.18)" />
                        </pattern>
                        <pattern id="pattern-lines" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <line x1="0" y1="12.5" x2="25" y2="12.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                        </pattern>
                        <pattern id="pattern-crosses" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                            <path d="M15 12 V18 M12 15 H18" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
                        </pattern>
                        <pattern id="pattern-dir-dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                            <circle cx="6" cy="6" r="1.2" fill="rgba(255,255,255,0.5)" />
                        </pattern>
                        <pattern id="pattern-dir-squares" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                            <rect x="4" y="4" width="2.5" height="2.5" fill="rgba(255,255,255,0.45)" />
                        </pattern>
                        <pattern id="pattern-dir-plus" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
                            <path d="M7 5 V9 M5 7 H9" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                        </pattern>
                        <pattern id="pattern-dir-lines" x="0" y="0" width="16" height="4" patternUnits="userSpaceOnUse">
                            <line x1="2" y1="2" x2="10" y2="2" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                        </pattern>
                        <radialGradient id="fade-grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" stopColor="white" stopOpacity="1" />
                            <stop offset="100%" stopColor="white" stopOpacity="0.15" />
                        </radialGradient>
                        <mask id="mask-fade">
                            <rect width="100%" height="100%" fill="url(#fade-grad)" />
                        </mask>
                        <filter id="filter-noise">
                            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="noise" />
                            <feDiffuseLighting in="noise" lightingColor="#fff" surfaceScale="2">
                                <feDistantLight azimuth="45" elevation="60" />
                            </feDiffuseLighting>
                            <feComposite operator="in" in2="SourceGraphic" result="textured" />
                            <feBlend in="SourceGraphic" in2="textured" mode="overlay" />
                        </filter>
                    </defs>
                </svg>
            </div>
            <div style={{ position: "relative", paddingTop: PAGE_PAD_V, paddingBottom: PAGE_PAD_V }}>
                <div style={{ display: "flex", flexDirection: "row", gap: COL_GAP, alignItems: "flex-start" }}>
                    <CardPair
                        hoverTop={hover.aTop} hoverBot={hover.aBot}
                        setHoverTop={setters.setATop} setHoverBot={setters.setABot}
                        contentTop={{ title: t("chat_a_title"), subtitle: t("chat_a_subtitle"), icon: "groups" }}
                        contentBot={{ title: t("chat_d_title"), subtitle: t("chat_d_subtitle"), icon: "chat" }}
                        gradientTop={GRAD_A_TOP} gradientBot={GRAD_A_BOT}
                        introTop={introStyles[0]} introBot={introStyles[1]}
                        textureTop="pattern-hex" textureBot="pattern-circles"
                        dirTextureTop="pattern-dir-dots" dirTextureBot="pattern-dir-squares"
                    />
                    <CardPair
                        hoverTop={hover.bTop} hoverBot={hover.bBot}
                        setHoverTop={setters.setBTop} setHoverBot={setters.setBBot}
                        contentTop={{ title: t("chat_b_title"), subtitle: t("chat_b_subtitle"), icon: "chat" }}
                        contentBot={{ title: t("chat_c_title"), subtitle: t("chat_c_subtitle"), icon: "groups" }}
                        gradientTop={GRAD_B_TOP} gradientBot={GRAD_B_BOT}
                        introTop={introStyles[2]} introBot={introStyles[3]}
                        textureTop="pattern-lines" textureBot="pattern-crosses"
                        dirTextureTop="pattern-dir-plus" dirTextureBot="pattern-dir-lines"
                    />
                </div>

                {phase2 && (
                    <>
                        <ChatRoomUI
                            phase2={phase2}
                            roomTitle={t("room_title")}
                            roomStatus={t("room_status")}
                            messages={[
                                { id: 1, name: t("msg1_name"), color: "#22c55e", img: "https://i.pravatar.cc/150?u=sara", text: t("msg1_text"), time: "17:20" },
                                { id: 2, name: t("msg2_name"), color: "#16a34a", img: "https://i.pravatar.cc/150?u=ahmed", text: t("msg2_text"), time: "17:21" },
                                { id: 3, name: t("msg3_name"), color: "#15803d", img: "https://i.pravatar.cc/150?u=karim", text: t("msg3_text"), time: "17:21" },
                                { id: 4, name: t("msg4_name"), color: "#22c55e", img: "https://i.pravatar.cc/150?u=yassine", text: t("msg4_text"), time: "17:22" },
                            ]}
                            liveMessages={[
                                { id: 101, name: t("msg101_name"), color: "#16a34a", img: "https://i.pravatar.cc/150?u=ines", text: t("msg101_text"), time: "17:23" },
                                { id: 102, name: t("msg102_name"), color: "#15803d", img: "https://i.pravatar.cc/150?u=sami", text: t("msg102_text"), time: "17:24" },
                                { id: 103, name: t("msg103_name"), color: "#22c55e", img: "https://i.pravatar.cc/150?u=laila", text: t("msg103_text"), time: "17:25" },
                            ]}
                        />
                        <div style={{ position: "absolute", inset: 0, zIndex: 50, pointerEvents: "none", overflow: "visible" }}>
                            <OrbCanvas dots={dots} canvasW={canvasW} canvasH={canvasH} active={phase2} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
