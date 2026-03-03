"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';

// ─── Constants (outside module scope — never re-created) ───────────────────
const W = 255, H_COLLAPSED = 110, H_EXPANDED = 240, r = 42;
const triW = 90, triH = 68, CX = W / 2, bottomCornerR = 42;
const tipR = 12, baseR = 24, circleR = 17, GAP = 60, COL_GAP = 30;
const TRAIL_LEN = 20;
const MAX_ORBS = 18;
const KAPPA = 0.5523, CAP_R = 90;

// Moved out of component — these never change
const INTRO_ORIGIN = ["top right", "bottom right", "top left", "bottom left"] as const;
const INTRO_ROT = ["rotateZ(-90deg)", "rotateZ(90deg)", "rotateZ(90deg)", "rotateZ(-90deg)"] as const;
const DIAG_OFFSETS: [number, number][] = [[-40, -40], [-40, 40], [40, -40], [40, 40]];

// ─── buildPath: pure fn, result stable per H value ────────────────────────
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

// Flattened segment format for GC friendliness: [fx, fy, c1x, c1y, c2x, c2y, tx, ty, weight]
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

// ─── Route builders ───────────────────────────────────────────────────────
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

function buildRoutes(dots: { a_top: P, a_bot: P, b_top: P, b_bot: P }): FlatSeg[][] {
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

// ─── AnimOrb: pure DOM manipulation, no React state ───────────────────────
type P = { x: number; y: number };
export interface AnimOrbHandle { start: (segs: FlatSeg[], dur: number) => void; }

const AnimOrb = React.forwardRef<AnimOrbHandle, {}>((_, ref) => {
    const polyRef = useRef<SVGPolylineElement>(null);
    const h1Ref = useRef<SVGCircleElement>(null);
    const h2Ref = useRef<SVGCircleElement>(null);
    const h3Ref = useRef<SVGCircleElement>(null);
    const rafRef = useRef(0);

    React.useImperativeHandle(ref, () => ({
        start(segs: FlatSeg[], dur: number) {
            cancelAnimationFrame(rafRef.current);
            const trail = new Float32Array(TRAIL_LEN * 2);
            let headIdx = 0, len = 0;
            const t0 = performance.now();

            const tick = (now: number) => {
                const t = Math.min((now - t0) / dur, 1);
                const et = t * t * (3 - 2 * t);
                const opacity = t < 0.05 ? t / 0.05 : t > 0.97 ? (1 - t) / 0.03 : 1;
                const [px, py] = bezierSegments(et, segs);

                trail[headIdx * 2] = px;
                trail[headIdx * 2 + 1] = py;
                headIdx = (headIdx + 1) % TRAIL_LEN;
                if (len < TRAIL_LEN) len++;

                if (len >= 2) {
                    let pts = "";
                    for (let i = 0; i < len; i++) {
                        const idx = (headIdx - len + i + TRAIL_LEN) % TRAIL_LEN;
                        pts += trail[idx * 2].toFixed(1) + "," + trail[idx * 2 + 1].toFixed(1) + " ";
                    }
                    const poly = polyRef.current;
                    if (poly) { poly.setAttribute("points", pts); poly.setAttribute("opacity", (opacity * 0.8).toFixed(3)); }
                    const pxS = px.toFixed(1), pyS = py.toFixed(1), opS = opacity.toFixed(3);
                    if (h1Ref.current) { h1Ref.current.setAttribute("cx", pxS); h1Ref.current.setAttribute("cy", pyS); h1Ref.current.setAttribute("opacity", (opacity * 0.15).toFixed(3)); }
                    if (h2Ref.current) { h2Ref.current.setAttribute("cx", pxS); h2Ref.current.setAttribute("cy", pyS); h2Ref.current.setAttribute("opacity", (opacity * 0.9).toFixed(3)); }
                    if (h3Ref.current) { h3Ref.current.setAttribute("cx", pxS); h3Ref.current.setAttribute("cy", pyS); h3Ref.current.setAttribute("opacity", opS); }
                }

                if (t < 1) {
                    rafRef.current = requestAnimationFrame(tick);
                } else {
                    polyRef.current?.setAttribute("opacity", "0");
                    h1Ref.current?.setAttribute("opacity", "0");
                    h2Ref.current?.setAttribute("opacity", "0");
                    h3Ref.current?.setAttribute("opacity", "0");
                }
            };
            rafRef.current = requestAnimationFrame(tick);
        }
    }), []);

    useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

    return (
        <g>
            <polyline ref={polyRef} fill="none" stroke="#22c55e" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 3px #22c55e)" }} opacity="0" />
            <circle ref={h1Ref} r={9} fill="#22c55e" opacity="0" />
            <circle ref={h2Ref} r={5} fill="#22c55e" opacity="0" />
            <circle ref={h3Ref} r={2} fill="white" opacity="0" />
        </g>
    );
});
AnimOrb.displayName = "AnimOrb";

// ─── OrbCanvas: KEY FIX — routes update via ref, spawn loop never restarts ─
type DotsShape = { a_top: P; a_bot: P; b_top: P; b_bot: P };

const OrbCanvas = memo(function OrbCanvas({ dots, canvasW, canvasH }: { dots: DotsShape, canvasW: number, canvasH: number }) {
    const orbRefs = useRef<(AnimOrbHandle | null)[]>(Array(MAX_ORBS).fill(null));
    const nextIdx = useRef(0);
    // Store routes in a ref so the spawn loop always reads the latest without restarting
    const routesRef = useRef<FlatSeg[][]>([]);

    // Update routes whenever dots change — no effect restart needed
    useEffect(() => {
        if (dots.a_top) routesRef.current = buildRoutes(dots);
    }, [dots.a_top?.x, dots.a_top?.y, dots.a_bot?.y, dots.b_top?.x, dots.b_top?.y, dots.b_bot?.y]);

    // Spawn loop — runs once on mount, reads routes via ref
    useEffect(() => {
        let tickId: ReturnType<typeof setTimeout>;
        const spawn = () => {
            const routes = routesRef.current;
            if (!routes.length) { tickId = setTimeout(spawn, 200); return; }
            const segs = routes[Math.floor(Math.random() * routes.length)];
            const dur = 1800 + Math.random() * 700;
            const idx = nextIdx.current;
            orbRefs.current[idx]?.start(segs, dur);
            nextIdx.current = (idx + 1) % MAX_ORBS;
            tickId = setTimeout(spawn, 300 + Math.random() * 200);
        };
        tickId = setTimeout(spawn, 400);
        return () => clearTimeout(tickId);
    }, []); // ← empty: never restarts

    const PHASE2_RANGE = 250;
    const vbX = -PHASE2_RANGE;
    const vbW = canvasW + PHASE2_RANGE * 2;

    return (
        <svg width={vbW} height={canvasH} viewBox={`${vbX} 0 ${vbW} ${canvasH}`}
            style={{ position: "absolute", top: 0, left: vbX, pointerEvents: "none", zIndex: 999, overflow: "visible" }}>
            {Array.from({ length: MAX_ORBS }, (_, i) => (
                <AnimOrb key={i} ref={el => { orbRefs.current[i] = el; }} />
            ))}
        </svg>
    );
});

// ─── GreenCard ────────────────────────────────────────────────────────────
const GreenCard = memo(function GreenCard({ position, visible, content }: { position: string; visible: boolean; content: string }) {
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
                    {content === "star"
                        ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 800, color: "#111", letterSpacing: "-0.01em" }}>{content === "star" ? "New milestone!" : "Keep it up!"}</p>
                    <p style={{ margin: 0, fontSize: 10.5, color: "#666", fontWeight: 500, lineHeight: 1.35 }}>{content === "star" ? "You've unlocked Level 5" : "7-day streak 🔥"}</p>
                </div>
            </div>
        </div>
    );
});

// ─── CardPair ─────────────────────────────────────────────────────────────
// buildPath results are cached — no useMemo needed inside component
const CardPair = memo(function CardPair(props: any) {
    const { hoverTop, hoverBot, setHoverTop, setHoverBot, content, gradientTop, gradientBot, introTop, introBot } = props;
    const topData = buildPath(H_EXPANDED); // O(1) — from cache
    const botData = buildPath(H_EXPANDED);
    const clipTop = hoverTop ? H_EXPANDED : H_COLLAPSED;
    const clipBot = hoverBot ? H_EXPANDED : H_COLLAPSED;
    const uid = content;
    const vg = "vg-" + content;
    const clTop = "clip-" + uid + "-top", clBot = "clip-" + uid + "-bot";
    const PAIR_H = H_COLLAPSED * 2 + GAP;

    return (
        <div style={{ position: "relative", width: W, height: PAIR_H, cursor: "pointer", filter: "drop-shadow(0 15px 35px rgba(0,0,0,0.1))", transition: "all 0.5s cubic-bezier(0.2,0.8,0.2,1)", flexShrink: 0, overflow: "visible" }}>

            {/* Top card — anchored at bottom, expands upward */}
            <div style={{ ...introTop, position: "absolute", left: 0, right: 0, bottom: H_COLLAPSED + GAP, height: H_COLLAPSED, overflow: "visible" }}>
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, cursor: "pointer" }}
                    onMouseEnter={() => setHoverTop(true)} onMouseLeave={() => setHoverTop(false)}>
                    <div style={{ overflow: "hidden", height: clipTop, position: "absolute", bottom: 0, left: 0, right: 0, transition: "height 0.5s cubic-bezier(0.4,0,0.2,1)", borderRadius: r + "px " + r + "px 0 0" }}>
                        <svg width={W} height={H_EXPANDED} viewBox={"0 0 " + W + " " + H_EXPANDED}
                            style={{ display: "block", position: "absolute", bottom: 0, left: 0 }}>
                            <defs><clipPath id={clTop}><path d={topData.path} /></clipPath></defs>
                            <path d={topData.path} fill={gradientTop.bg2} />
                            <path d={topData.path} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" className="card-border-anim" />
                            <circle cx={CX} cy={topData.circleY} r={circleR} fill="rgba(0,0,0,0.25)" />
                            <circle cx={CX} cy={topData.circleY - 5} r={5.5} fill="white" />
                            <ellipse cx={CX} cy={topData.circleY + 11} rx={8.5} ry={6} fill="white" />
                            <circle cx={CX} cy={topData.greenDotY} r={6} fill="#fff" className="glow-dot" />
                            <circle cx={CX} cy={topData.greenDotY} r={6} fill="none" stroke="#fff" strokeWidth="2" className="ripple-dot" />
                        </svg>
                        <GreenCard position="top" visible={hoverTop} content={content} />
                    </div>
                </div>
            </div>

            {/* Bottom card — anchored at top, expands downward */}
            <div style={{ ...introBot, position: "absolute", left: 0, right: 0, top: H_COLLAPSED + GAP, height: H_COLLAPSED, overflow: "visible" }}>
                <div style={{ position: "absolute", left: 0, right: 0, top: 0, cursor: "pointer" }}
                    onMouseEnter={() => setHoverBot(true)} onMouseLeave={() => setHoverBot(false)}>
                    <div style={{ overflow: "hidden", height: clipBot, position: "absolute", top: 0, left: 0, right: 0, transition: "height 0.5s cubic-bezier(0.4,0,0.2,1)", borderRadius: "0 0 " + r + "px " + r + "px" }}>
                        <svg width={W} height={H_EXPANDED} viewBox={"0 0 " + W + " " + H_EXPANDED}
                            style={{ display: "block", transform: "scaleY(-1)", transformOrigin: "center" }}>
                            <defs><clipPath id={clBot}><path d={botData.path} /></clipPath></defs>
                            <path d={botData.path} fill={gradientBot.bg2} />
                            <path d={botData.path} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" className="card-border-anim" />
                        </svg>
                        <div style={{ position: "absolute", top: botData.flippedCircleY, left: CX - circleR, width: circleR * 2, height: circleR * 2 }}>
                            <svg width={circleR * 2} height={circleR * 2} viewBox={"0 0 " + (circleR * 2) + " " + (circleR * 2)}>
                                <circle cx={circleR} cy={circleR} r={circleR} fill="rgba(0,0,0,0.25)" />
                                <circle cx={circleR} cy={circleR - 5} r={5.5} fill="white" />
                                <ellipse cx={circleR} cy={circleR + 11} rx={8.5} ry={6} fill="white" />
                            </svg>
                        </div>
                        <svg width={W} height={H_EXPANDED} viewBox={"0 0 " + W + " " + H_EXPANDED}
                            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
                            <circle cx={CX} cy={botData.flippedGreenDotY} r={6} fill="#fff" className="glow-dot" style={{ animationDelay: "0.5s" }} />
                            <circle cx={CX} cy={botData.flippedGreenDotY} r={6} fill="none" stroke="#fff" strokeWidth="2" className="ripple-dot" style={{ animationDelay: "0.5s" }} />
                        </svg>
                        <GreenCard position="bottom" visible={hoverBot} content={content} />
                    </div>
                </div>
            </div>

            {/* Connective line */}
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

// ─── Chat data outside component ─────────────────────────────────────────
const BASE_MESSAGES = [
    { id: 1, name: "Sara M.", color: "#22c55e", text: "Anyone solved exercise 4? 🤔", time: "17:20" },
    { id: 2, name: "Ahmed B.", color: "#16a34a", text: "Yes! integrate by parts 😄", time: "17:21" },
    { id: 3, name: "Prof. Karim", color: "#15803d", text: "Well done Ahmed, exactly right ✅", time: "17:21" },
    { id: 4, name: "Yassine L.", color: "#22c55e", text: "Sharing my notes now 📎", time: "17:22" },
];
const LIVE_MESSAGES = [
    { id: 101, name: "Ines B.", color: "#16a34a", text: "Can someone share the formula sheet? 🙏", time: "17:23" },
    { id: 102, name: "Karim O.", color: "#15803d", text: "Here you go! 📄 Formula_Sheet.pdf", time: "17:24" },
    { id: 103, name: "Sara M.", color: "#22c55e", text: "This app is amazing 🚀", time: "17:25" },
];

// ─── ChatMessage ──────────────────────────────────────────────────────────
const ChatMessage = memo(function ChatMessage({ msg, delay = 0 }: { msg: any; delay?: number }) {
    const [active, setActive] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setActive(true), delay * 1000 + 10);
        return () => clearTimeout(t);
    }, [delay]);
    return (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, opacity: active ? 1 : 0, transform: active ? "translateY(0)" : "translateY(12px) scale(0.98)", transition: "all 0.45s cubic-bezier(0.2,1,0.3,1)" }}>
            <div style={{ width: 34, height: 34, borderRadius: 11, background: msg.color + "15", border: "1.5px solid " + msg.color + "30", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: msg.color }}>{msg.name[0]}</span>
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "white" }}>{msg.name}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{msg.time}</span>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 500, lineHeight: 1.55 }}>{msg.text}</div>
            </div>
        </div>
    );
});

// ─── ChatRoomUI: KEY FIX — input text via ref, only flush to state on word boundaries ─
function ChatRoomUI() {
    const [shown, setShown] = useState(false);
    const [typing, setTyping] = useState(false);
    const [visibleCount, setVisibleCount] = useState(0);
    const [liveIdx, setLiveIdx] = useState(0);
    const [isSending, setIsSending] = useState(false);
    // Input text uses a ref for the RAF tick, state only for display — batches updates
    const inputRef = useRef("");
    const inputSpan = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const t = setTimeout(() => setShown(true), 100);
        return () => clearTimeout(t);
    }, []);

    // Stagger base messages
    useEffect(() => {
        if (!shown) return;
        let i = 0;
        const step = () => { i++; setVisibleCount(i); if (i < BASE_MESSAGES.length) setTimeout(step, 100); };
        setTimeout(step, 200);
    }, [shown]);

    // Typing loop — direct DOM for input text, state only for typing/sending flags
    useEffect(() => {
        if (!shown) return;
        let cancelled = false, rafId = 0;
        let state = "INITIAL_WAIT", nextTime = performance.now() + 1200;
        let msgIdx = 0, typeIdx = 0;

        const tick = (now: number) => {
            if (cancelled) return;
            rafId = requestAnimationFrame(tick);
            if (now < nextTime) return;

            const msg = LIVE_MESSAGES[msgIdx % LIVE_MESSAGES.length];
            const chars = msg.text;

            if (state === "INITIAL_WAIT" || state === "WAITING") {
                state = "TYPING_WAIT"; setTyping(true);
                inputRef.current = "";
                if (inputSpan.current) inputSpan.current.textContent = "";
                nextTime = now + 800;
            } else if (state === "TYPING_WAIT") {
                state = "TYPING"; typeIdx = 0; nextTime = now + 60;
            } else if (state === "TYPING") {
                typeIdx++;
                inputRef.current = chars.slice(0, typeIdx);
                // Direct DOM write — no re-render
                if (inputSpan.current) inputSpan.current.textContent = inputRef.current;
                if (typeIdx >= chars.length) { state = "PRE_SEND_WAIT"; nextTime = now + 600; }
                else nextTime = now + 60;
            } else if (state === "PRE_SEND_WAIT") {
                state = "SENDING"; setTyping(false); setIsSending(true);
                inputRef.current = "";
                if (inputSpan.current) inputSpan.current.textContent = "";
                nextTime = now + 500;
            } else if (state === "SENDING") {
                setIsSending(false); setLiveIdx(p => p + 1);
                state = "WAITING"; msgIdx++; nextTime = now + 2800;
            }
        };
        rafId = requestAnimationFrame(tick);
        return () => { cancelled = true; cancelAnimationFrame(rafId); };
    }, [shown]);

    // Memoize combined messages to avoid re-creating array on every render
    const allMessages = useMemo(() =>
        [...BASE_MESSAGES, ...LIVE_MESSAGES.slice(0, liveIdx)],
        [liveIdx]);

    return (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: shown ? "translate(-50%,-50%) scale(1)" : "translate(-50%,-50%) scale(0.86)", opacity: shown ? 1 : 0, transition: "opacity 0.5s cubic-bezier(0.22,1,0.36,1) 0.15s, transform 0.5s cubic-bezier(0.22,1,0.36,1) 0.15s", width: 440, zIndex: 9999, pointerEvents: "none" }}>
            <div style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 32, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)" }}>
                {/* Header */}
                <div style={{ padding: "18px 22px 16px", borderBottom: "1px solid rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "white", letterSpacing: "-0.01em" }}>Class Chat Room</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px rgba(34,197,94,0.4)" }} />
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>24 Online</span>
                        </div>
                    </div>
                </div>
                {/* Messages */}
                <div style={{ padding: "16px 20px 12px", display: "flex", flexDirection: "column", gap: 16, minHeight: 220 }}>
                    {allMessages.map((msg, i) => {
                        const isBase = i < BASE_MESSAGES.length;
                        if (isBase && i >= visibleCount) return null;
                        return <ChatMessage key={msg.id} msg={msg} delay={isBase ? i * 0.1 : 0} />;
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
                    <div style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 16, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Direct DOM ref — zero re-renders for typing */}
                        <span ref={inputSpan} style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 500 }} />
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform 0.15s", transform: isSending ? "scale(0.85)" : "scale(1)" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function TestPage() {
    const [hA_top, setHA_top] = useState(false);
    const [hA_bot, setHA_bot] = useState(false);
    const [hB_top, setHB_top] = useState(false);
    const [hB_bot, setHB_bot] = useState(false);
    const [settled, setSettled] = useState(false);
    const [phase2, setPhase2] = useState(false);

    useEffect(() => {
        const t1 = setTimeout(() => setSettled(true), 600);
        const t2 = setTimeout(() => setPhase2(true), 2000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    const PAGE_PAD_V = 120;
    // Only rebuild when hover state actually changes
    const Htop_A = hA_top ? H_EXPANDED : H_COLLAPSED, Hbot_A = hA_bot ? H_EXPANDED : H_COLLAPSED;
    const Htop_B = hB_top ? H_EXPANDED : H_COLLAPSED, Hbot_B = hB_bot ? H_EXPANDED : H_COLLAPSED;

    // buildPath results come from cache — no useMemo needed, O(1) lookup
    const topDataA = buildPath(Htop_A), botDataA = buildPath(Hbot_A);
    const topDataB = buildPath(Htop_B), botDataB = buildPath(Hbot_B);

    const colBX = W + COL_GAP;
    const canvasW = W * 2 + COL_GAP;
    const canvasH = Math.max(Htop_A + GAP + Hbot_A, Htop_B + GAP + Hbot_B) + PAGE_PAD_V * 2;

    const phase2DxLeft = phase2 ? -200 : 0;
    const phase2DxRight = phase2 ? 200 : 0;

    // Stable dots object — only changes when values actually change
    const dots = useMemo(() => ({
        a_top: { x: CX + (settled ? -40 : 0) + phase2DxLeft, y: PAGE_PAD_V + topDataA.greenDotY + (settled ? -40 : 0) },
        a_bot: { x: CX + (settled ? -40 : 0) + phase2DxLeft, y: PAGE_PAD_V + Htop_A + GAP + botDataA.flippedGreenDotY + (settled ? 40 : 0) },
        b_top: { x: colBX + CX + (settled ? 40 : 0) + phase2DxRight, y: PAGE_PAD_V + topDataB.greenDotY + (settled ? -40 : 0) },
        b_bot: { x: colBX + CX + (settled ? 40 : 0) + phase2DxRight, y: PAGE_PAD_V + Htop_B + GAP + botDataB.flippedGreenDotY + (settled ? 40 : 0) },
    }), [settled, phase2DxLeft, phase2DxRight,
        topDataA.greenDotY, Htop_A, botDataA.flippedGreenDotY,
        topDataB.greenDotY, Htop_B, botDataB.flippedGreenDotY, colBX]);

    const makeIntro = useCallback((idx: number) => {
        const [dx, dy] = DIAG_OFFSETS[idx];
        const px2 = (idx === 0 || idx === 1) ? phase2DxLeft : phase2DxRight;
        return {
            transformOrigin: INTRO_ORIGIN[idx],
            transform: settled
                ? `rotateZ(0deg) translate(${dx + px2}px,${dy}px)`
                : INTRO_ROT[idx],
            transition: phase2
                ? "transform 0.7s cubic-bezier(0.4,0,0.2,1)"
                : settled
                    ? `transform 0.8s cubic-bezier(0.4,0,0.2,1) ${idx * 120}ms`
                    : "none",
            willChange: "transform",
        };
    }, [settled, phase2, phase2DxLeft, phase2DxRight]);

    const replay = useCallback(() => {
        setSettled(false); setPhase2(false);
        setTimeout(() => setSettled(true), 600);
        setTimeout(() => setPhase2(true), 2000);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-[#111] overflow-hidden flex items-center justify-center font-sans">
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
            <style>{`
                @keyframes glow{0%,100%{opacity:1}50%{opacity:0.4}}
                @keyframes ripple{0%{r:6;opacity:0.9}100%{r:22;opacity:0}}
                @keyframes typingBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
                @keyframes borderFlow{0%{stroke-dashoffset:1000}100%{stroke-dashoffset:0}}
                .glow-dot{animation:glow 1.8s ease-in-out infinite}
                .ripple-dot{animation:ripple 1.8s ease-out infinite}
                .card-border-anim{stroke-dasharray:200 800;animation:borderFlow 15s linear infinite}
            `}</style>
            <div style={{ position: "relative", paddingTop: PAGE_PAD_V, paddingBottom: PAGE_PAD_V }}>
                <div style={{ display: "flex", flexDirection: "row", gap: COL_GAP, alignItems: "flex-start" }}>
                    <CardPair
                        hoverTop={hA_top} hoverBot={hA_bot} setHoverTop={setHA_top} setHoverBot={setHA_bot}
                        content="people"
                        gradientTop={{ bg1: "#16a34a", bg2: "#22c55e" }} gradientBot={{ bg1: "#22c55e", bg2: "#16a34a" }}
                        introTop={makeIntro(0)} introBot={makeIntro(1)}
                    />
                    <CardPair
                        hoverTop={hB_top} hoverBot={hB_bot} setHoverTop={setHB_top} setHoverBot={setHB_bot}
                        content="star"
                        gradientTop={{ bg1: "#15803d", bg2: "#16a34a" }} gradientBot={{ bg1: "#16a34a", bg2: "#22c55e" }}
                        introTop={makeIntro(2)} introBot={makeIntro(3)}
                    />
                </div>

                {phase2 && <ChatRoomUI />}
                {phase2 && (
                    <div style={{ position: "absolute", inset: 0, zIndex: 50, pointerEvents: "none", overflow: "visible" }}>
                        <OrbCanvas dots={dots} canvasW={canvasW} canvasH={canvasH} />
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "center", marginTop: 36 }}>
                    <button onClick={replay} style={{ background: "transparent", border: "1px solid rgba(34,197,94,0.5)", borderRadius: 99, color: "#22c55e", fontSize: 13, fontWeight: 500, padding: "8px 22px", cursor: "pointer", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 7, transition: "background 0.2s" }}>
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M11.5 6.5A5 5 0 1 1 8 2.1" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                            <polyline points="8,0.5 8,2.5 10,2.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Replay
                    </button>
                </div>
            </div>
            <button onClick={() => window.location.href = '/'} className="absolute top-8 left-8 text-white/40 hover:text-white transition-colors text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <span>← Exit Test</span>
            </button>
        </div>
    );
}
