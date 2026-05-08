"use client";

import { useState, useEffect, useRef } from "react";

const weekData = [
  { day: "Sun", progress: 3.6 },
  { day: "Mon", progress: 5.0 },
  { day: "Tue", progress: 7.26 },
  { day: "Wed", progress: 5.3 },
  { day: "Thu", progress: 3.9 },
  { day: "Fri", progress: 6.1 },
  { day: "Sat", progress: 4.6 },
];

const MAX_H = 8;
const CHART_H = 280;
const BAR_W = 44;
const BAR_GAP = 84;
const LEFT_PAD = 52;
const LINE_GAP = 20;

const ANIMATION_CSS = `
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes pulse {
  0%, 100% { transform: scale(1);   opacity: 0.10; }
  50%       { transform: scale(1.6); opacity: 0.03; }
}
@keyframes floatBadge {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-4px); }
}
@keyframes legendDot {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes drawPath {
  from { stroke-dashoffset: var(--path-len); }
  to   { stroke-dashoffset: 0; }
}
@keyframes shimmerPass {
  0%   { stroke-dashoffset: 900; opacity: 0; }
  8%   { opacity: 1; }
  92%  { opacity: 1; }
  100% { stroke-dashoffset: -80; opacity: 0; }
}
@keyframes spinReplay {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`;

/* ── ease functions ──────────────────────────────────────────────────────────── */
const easeFns = {
  easeOut:       (t) => 1 - Math.pow(1 - t, 3),
  easeOutStrong: (t) => 1 - Math.pow(1 - t, 4),
  easeInOut:     (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

/* ── RAF hook ────────────────────────────────────────────────────────────────── */
function useRaf(duration = 1200, easeType = "easeOut", delay = 0, resetKey = 0) {
  const [progress, setProgress] = useState(0);
  const animRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    setProgress(0);
    startRef.current = null;
    cancelAnimationFrame(animRef.current);

    const ease = easeFns[easeType] ?? easeFns.easeOut;

    const delayTimer = setTimeout(() => {
      const tick = (now) => {
        if (!startRef.current) startRef.current = now;
        const t = Math.min((now - startRef.current) / duration, 1);
        setProgress(ease(t));
        if (t < 1) animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      cancelAnimationFrame(animRef.current);
    };
  }, [duration, easeType, delay, resetKey]);

  return progress;
}

/* ── path length helper ──────────────────────────────────────────────────────── */
function approxPathLength(pts, steps = 200) {
  if (pts.length < 2) return 500;
  let len = 0, prev = null;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const totalSegs = pts.length - 1;
    const segIdx = Math.min(Math.floor(t * totalSegs), totalSegs - 1);
    const segT = t * totalSegs - segIdx;
    const p0 = pts[segIdx], p1 = pts[segIdx + 1];
    const cpx = (p0.x + p1.x) / 2;
    const bx = Math.pow(1-segT,3)*p0.x + 3*Math.pow(1-segT,2)*segT*cpx + 3*(1-segT)*segT*segT*cpx + segT*segT*segT*p1.x;
    const by = Math.pow(1-segT,3)*p0.y + 3*Math.pow(1-segT,2)*segT*p0.y + 3*(1-segT)*segT*segT*p1.y + segT*segT*segT*p1.y;
    if (prev) len += Math.hypot(bx - prev.x, by - prev.y);
    prev = { x: bx, y: by };
  }
  return Math.round(len);
}

/* ── Bar Chart ───────────────────────────────────────────────────────────────── */
function AnalyticsBarChart({ resetKey = 0 }) {
  const [hovered, setHovered] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [lineReady, setLineReady] = useState(false);

  // Strong ease-out: bars shoot up fast, land softly
  const animProgress = useRaf(1000, "easeOutStrong", 0, resetKey);

  useEffect(() => {
    setMounted(false);
    setLineReady(false);
    const t1 = setTimeout(() => setMounted(true), 60);
    const t2 = setTimeout(() => setLineReady(true), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [resetKey]);

  const toY = (h) => CHART_H - (h / MAX_H) * CHART_H;
  const barX = (i) => LEFT_PAD + i * BAR_GAP;
  const centerX = (i) => barX(i) + BAR_W / 2;

  const animData = weekData.map((d) => ({ ...d, progress: d.progress * animProgress }));

  const finalPts = weekData.map((d, i) => ({
    x: centerX(i),
    y: toY(d.progress) - LINE_GAP,
  }));

  function smoothPath(pts) {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i-1].x + pts[i].x) / 2;
      d += ` C ${cpx} ${pts[i-1].y}, ${cpx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  }

  function areaPath(pts) {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${CHART_H} L ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i-1].x + pts[i].x) / 2;
      d += ` C ${cpx} ${pts[i-1].y}, ${cpx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }
    d += ` L ${pts[pts.length-1].x} ${CHART_H} Z`;
    return d;
  }

  const yLabels = [8, 7, 6, 5, 4, 3, 2, 0];
  const svgW = LEFT_PAD + weekData.length * BAR_GAP + 20;
  const pathLen = approxPathLength(finalPts);
  const tuePt = finalPts[2];

  return (
    <div style={{
      background: "#f4f4ef", borderRadius: 28,
      padding: "28px 28px 24px 28px",
      fontFamily: "'DM Sans','Helvetica Neue',sans-serif",
      flex: 1, minWidth: 0, boxSizing: "border-box",
      opacity: mounted ? 1 : 0,
      transform: mounted ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.5s cubic-bezier(.22,1,.36,1), transform 0.5s cubic-bezier(.22,1,.36,1)",
    }}>

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8,
        animation: mounted ? "fadeSlideUp 0.45s ease-out both" : "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: "#f97316",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            transition: "transform 0.2s ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08) rotate(-3deg)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="16 7 22 7 22 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, color: "#1a1a1a", letterSpacing: "-0.5px" }}>Analytics Statistic</div>
            <div style={{ fontSize: 14, color: "#aaa", marginTop: 3 }}>Time you spend daily for learning</div>
          </div>
        </div>

        <button style={{
          background: "white", border: "none", borderRadius: 22, padding: "10px 20px",
          fontSize: 14, fontWeight: 600, color: "#333", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)", flexShrink: 0,
          transition: "transform 0.15s ease",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
        >
          Last Week
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 24, marginBottom: 14, paddingLeft: 4 }}>
        {[{ color: "#f97316", label: "Progress" }, { color: "#222", label: "Losses" }].map(({ color, label }, idx) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#555",
            animation: "legendDot 0.4s ease-out both",
            animationDelay: `${0.3 + idx * 0.1}s`,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* SVG */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <svg width="100%" viewBox={`0 0 ${svgW} ${CHART_H + 36}`}
          style={{ overflow: "visible", display: "block" }}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fb923c" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="gradBlack" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a3a3a" />
              <stop offset="100%" stopColor="#111" />
            </linearGradient>
            <linearGradient id="gradGray" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ddddd8" />
              <stop offset="100%" stopColor="#c8c8c3" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ccc" />
              <stop offset="30%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="70%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ccc" />
            </linearGradient>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y labels */}
          {yLabels.map((h, idx) => (
            <text key={h} x={LEFT_PAD - 10} y={toY(h) + 4}
              textAnchor="end" fontSize={12} fill="#c0c0bb" fontFamily="DM Sans, sans-serif"
              style={{ animation: "fadeIn 0.35s ease-out both", animationDelay: `${0.08 + idx * 0.03}s` }}>
              {h === 0 ? "0" : `${h}h`}
            </text>
          ))}

          {/* Bars */}
          {animData.map((d, i) => {
            const x = barX(i);
            const bCx = centerX(i);
            const isTue = i === 2;
            const isThu = i === 4;
            const barH = Math.max((d.progress / MAX_H) * CHART_H, 0);
            const barY = CHART_H - barH;
            const fill = isTue ? "url(#gradOrange)" : isThu ? "url(#gradBlack)" : "url(#gradGray)";
            const isHov = hovered === i;

            return (
              <g key={d.day} onMouseEnter={() => setHovered(i)} style={{ cursor: "pointer" }}>
                {/* Subtle column highlight behind bar */}
                {isHov && (
                  <rect
                    x={x - 5} y={0} width={BAR_W + 10} height={CHART_H}
                    rx={16}
                    fill={isTue ? "#f97316" : isThu ? "#1a1a1a" : "#b0b0ab"}
                    opacity={0.05}
                    style={{ animation: "fadeIn 0.15s ease-out both" }}
                  />
                )}
                <rect
                  x={x} y={barY} width={BAR_W} height={barH} rx={14}
                  fill={fill}
                  opacity={hovered !== null && !isHov ? 0.5 : 1}
                  style={{ transition: "opacity 0.18s ease" }}
                />
                <text x={bCx} y={CHART_H + 24} textAnchor="middle" fontSize={13}
                  fill={isHov ? "#777" : "#bbb"} fontFamily="DM Sans, sans-serif"
                  style={{ transition: "fill 0.15s ease" }}>
                  {d.day}
                </text>
              </g>
            );
          })}

          {/* Area */}
          {animProgress > 0.94 && (
            <path d={areaPath(finalPts)} fill="url(#areaGrad)"
              style={{ animation: "fadeIn 0.5s ease-out both" }} />
          )}

          {/* Line */}
          {lineReady && (
            <>
              <path
                d={smoothPath(finalPts)}
                fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round"
                style={{
                  "--path-len": pathLen,
                  strokeDasharray: pathLen,
                  animation: `drawPath 1.4s cubic-bezier(.25,0,.15,1) forwards`,
                }}
              />
            </>
          )}

          {/* Arrow hint */}
          <text x={LEFT_PAD + 4} y={toY(7) + 4} fontSize={14} fill="#d0d0cb">→</text>

          {/* Tue peak marker */}
          {lineReady && (
            <g style={{ animation: "fadeIn 0.4s ease-out 1.0s both" }}>
              <circle cx={tuePt.x} cy={tuePt.y} r={22} fill="#f97316" opacity="0.08"
                style={{ animation: "pulse 2.8s ease-in-out infinite", transformOrigin: `${tuePt.x}px ${tuePt.y}px` }} />
              <circle cx={tuePt.x} cy={tuePt.y} r={6} fill="#f97316" stroke="white" strokeWidth="2.5" />
              <g style={{
                animation: "floatBadge 3s ease-in-out 1.8s infinite",
                transformOrigin: `${tuePt.x}px ${tuePt.y - 40}px`,
              }}>
                <rect x={tuePt.x - 27} y={tuePt.y - 52} width={54} height={24} rx={12}
                  fill="white" opacity="0.96" />
                <rect x={tuePt.x - 27} y={tuePt.y - 52} width={54} height={24} rx={12}
                  fill="none" stroke="#f9731625" strokeWidth="1" />
                <text x={tuePt.x} y={tuePt.y - 35} textAnchor="middle"
                  fontSize={12} fontWeight="700" fill="#f97316" fontFamily="DM Sans, sans-serif">
                  7.26h
                </text>
              </g>
            </g>
          )}

          {/* Hover value — clean fade, no bounce */}
          {hovered !== null && hovered !== 2 && animProgress >= 1 && (
            <g style={{ animation: "fadeIn 0.15s ease-out both" }}>
              <circle cx={finalPts[hovered].x} cy={finalPts[hovered].y}
                r={5} fill="#f97316" stroke="white" strokeWidth="2" />
              <rect
                x={finalPts[hovered].x - 24} y={finalPts[hovered].y - 44}
                width={48} height={22} rx={11}
                fill="white" opacity="0.96"
              />
              <text x={finalPts[hovered].x} y={finalPts[hovered].y - 28}
                textAnchor="middle" fontSize={11.5} fontWeight="700" fill="#1a1a1a" fontFamily="DM Sans, sans-serif">
                {weekData[hovered].progress.toFixed(1)}h
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

/* ── Donut Chart ─────────────────────────────────────────────────────────────── */
function DonutChart({ resetKey = 0 }) {
  const [mounted, setMounted] = useState(false);
  const [hoveredSeg, setHoveredSeg] = useState(null);

  // Each segment fills with strong ease-out, staggered one after another
  const prog0 = useRaf(950, "easeOutStrong", 200, resetKey);
  const prog1 = useRaf(950, "easeOutStrong", 500, resetKey);
  const prog2 = useRaf(950, "easeOutStrong", 800, resetKey);
  const progArr = [prog0, prog1, prog2];

  useEffect(() => {
    setMounted(false);
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, [resetKey]);

  const svgSize = 240;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const outerR = 97;
  const innerR = 71;
  const midR   = (outerR + innerR) / 2;
  const gapDeg = 5;
  const h = 4; // px — corner cut size, controls how round the corners are

  const segments = [
    { color: "#f97316", pct: 0.48, label: "48%", lightLabel: false },
    { color: "#d1d5db", pct: 0.22, label: "22%", lightLabel: true  },
    { color: "#1a1a1a", pct: 0.30, label: "30%", lightLabel: false },
  ];

  const toRad = (deg) => (deg - 90) * Math.PI / 180;
  const ptOn  = (rad, R) => [cx + R * Math.cos(rad), cy + R * Math.sin(rad)];

  function sectorPath(startDeg, endDeg, progress) {
    const animEnd = startDeg + (endDeg - startDeg) * progress;
    if (animEnd - startDeg < 1) return null;
    const s = toRad(startDeg);
    const e = toRad(animEnd);
    const large = (animEnd - startDeg) > 180 ? 1 : 0;
    const δ = h / midR; // angular offset matching h px along the arc

    // 4 corner Q-bezier control points
    const [ix1, iy1] = ptOn(s, innerR);  // start inner corner
    const [ox1, oy1] = ptOn(s, outerR);  // start outer corner
    const [ox2, oy2] = ptOn(e, outerR);  // end outer corner
    const [ix2, iy2] = ptOn(e, innerR);  // end inner corner

    // Approach / depart points offset from each corner
    const [ai1, bi1] = [ptOn(s + δ, innerR), ptOn(s, innerR + h)]; // start-inner
    const [ao1, bo1] = [ptOn(s, outerR - h), ptOn(s + δ, outerR)]; // start-outer
    const [ao2, bo2] = [ptOn(e - δ, outerR), ptOn(e, outerR - h)]; // end-outer
    const [ai2, bi2] = [ptOn(e, innerR + h), ptOn(e - δ, innerR)]; // end-inner

    return [
      `M ${ai1[0]} ${ai1[1]}`,
      `Q ${ix1} ${iy1} ${bi1[0]} ${bi1[1]}`,          // start-inner rounded corner
      `L ${ao1[0]} ${ao1[1]}`,                          // radial edge
      `Q ${ox1} ${oy1} ${bo1[0]} ${bo1[1]}`,           // start-outer rounded corner
      `A ${outerR} ${outerR} 0 ${large} 1 ${ao2[0]} ${ao2[1]}`, // outer arc
      `Q ${ox2} ${oy2} ${bo2[0]} ${bo2[1]}`,           // end-outer rounded corner
      `L ${ai2[0]} ${ai2[1]}`,                          // radial edge
      `Q ${ix2} ${iy2} ${bi2[0]} ${bi2[1]}`,           // end-inner rounded corner
      `A ${innerR} ${innerR} 0 ${large} 0 ${ai1[0]} ${ai1[1]}`, // inner arc back
      "Z",
    ].join(" ");
  }

  let cumulativeDeg = 0;
  const builtSegs = segments.map((seg, i) => {
    const fullDeg  = seg.pct * 360;
    const startDeg = cumulativeDeg + gapDeg / 2;
    const endDeg   = cumulativeDeg + fullDeg - gapDeg / 2;
    cumulativeDeg += fullDeg;
    const midRad   = toRad((startDeg + endDeg) / 2);
    const labelX   = cx + midR * Math.cos(midRad);
    const labelY   = cy + midR * Math.sin(midRad);
    const showLabel = progArr[i] > 0.88;
    return { ...seg, startDeg, endDeg, labelX, labelY, showLabel };
  });

  return (
    <div style={{
      background: "#f4f4ef", borderRadius: 28,
      padding: "28px 24px 20px 24px",
      width: 300, flexShrink: 0,
      fontFamily: "'DM Sans','Helvetica Neue',sans-serif",
      boxSizing: "border-box",
      opacity: mounted ? 1 : 0,
      transform: mounted ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.5s cubic-bezier(.22,1,.36,1) 0.12s, transform 0.5s cubic-bezier(.22,1,.36,1) 0.12s",
    }}>

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22,
        animation: "fadeSlideUp 0.45s ease-out 0.2s both",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: "#f97316",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            transition: "transform 0.2s ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08) rotate(3deg)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="white" strokeWidth="2.5" />
              <path d="M3 9h18M9 21V9" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a1a", letterSpacing: "-0.3px" }}>Completion</div>
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 3 }}>Overall assignment</div>
          </div>
        </div>

        <button style={{
          width: 34, height: 34, borderRadius: "50%", border: "1.5px solid #e0e0da",
          background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.18s ease",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "rotate(45deg)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M7 17L17 7M17 7H7M17 7v10" stroke="#777" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Donut */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>

          {/* Track ring */}
          <circle cx={cx} cy={cy} r={midR}
            fill="none" stroke="#e8e8e3" strokeWidth={outerR - innerR} opacity={0.4} />

          {/* Segments */}
          {builtSegs.map((seg, i) => {
            const isHov    = hoveredSeg === i;
            const isDimmed = hoveredSeg !== null && !isHov;
            const d = sectorPath(seg.startDeg, seg.endDeg, progArr[i]);
            if (!d) return null;
            return (
              <path key={i}
                d={d}
                fill={seg.color}
                opacity={isDimmed ? 0.3 : 1}
                style={{
                  cursor: "pointer",
                  transform: isHov ? "scale(1.03)" : "scale(1)",
                  transformOrigin: `${cx}px ${cy}px`,
                  transition: "opacity 0.18s ease, transform 0.2s ease-out",
                }}
                onMouseEnter={() => setHoveredSeg(i)}
                onMouseLeave={() => setHoveredSeg(null)}
              />
            );
          })}

          {/* Center text */}
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize={16} fontWeight="800" fill="#1a1a1a" fontFamily="DM Sans, sans-serif">Total</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize={16} fontWeight="800" fill="#1a1a1a" fontFamily="DM Sans, sans-serif">Summary</text>

          {/* Labels — simple fade in */}
          {builtSegs.map((seg, i) => {
            if (!seg.showLabel) return null;
            return (
              <text key={i}
                x={seg.labelX} y={seg.labelY + 5}
                textAnchor="middle" fontSize={12.5} fontWeight="700"
                fill={seg.lightLabel ? "#888" : "white"}
                fontFamily="DM Sans, sans-serif"
                style={{ animation: "fadeIn 0.3s ease-out both" }}
              >
                {seg.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        {[
          { color: "#f97316", label: "Completed" },
          { color: "#1a1a1a", label: "Pending"   },
          { color: "#d1d5db", label: "Overdue"   },
        ].map(({ color, label }, idx) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#666",
            animation: "legendDot 0.35s ease-out both",
            animationDelay: `${0.65 + idx * 0.08}s`,
            cursor: "pointer",
          }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Root ────────────────────────────────────────────────────────────────────── */
export default function LearningDashboard() {
  const [replayKey, setReplayKey] = useState(0);
  const [spinning,  setSpinning]  = useState(false);

  const handleReplay = () => {
    setSpinning(true);
    setReplayKey((k) => k + 1);
    setTimeout(() => setSpinning(false), 600);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#e8e8e3",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      fontFamily: "'DM Sans','Helvetica Neue',sans-serif",
    }}>
      <style>{ANIMATION_CSS}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 1100, width: "100%" }}>

        {/* Replay button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleReplay}
            style={{
              background: "white", border: "none", borderRadius: 50,
              padding: "9px 20px", fontSize: 13, fontWeight: 700, color: "#333",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
              transition: "transform 0.15s ease, background 0.15s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.background = "#fff8f4"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.background = "white"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              style={{ animation: spinning ? `spinReplay 0.55s cubic-bezier(.4,0,.2,1) both` : "none", transformOrigin: "center" }}>
              <path d="M1 4v6h6" stroke="#f97316" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3.51 15a9 9 0 1 0 .49-4.5" stroke="#f97316" strokeWidth="2.3" strokeLinecap="round" />
            </svg>
            Replay
          </button>
        </div>

        {/* Charts */}
        <div style={{ display: "flex", gap: 20 }}>
          <AnalyticsBarChart key={`bar-${replayKey}`}   resetKey={replayKey} />
          <DonutChart        key={`donut-${replayKey}`} resetKey={replayKey} />
        </div>

      </div>
    </div>
  );
}
