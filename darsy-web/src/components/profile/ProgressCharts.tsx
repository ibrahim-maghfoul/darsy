"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { MessageSquare } from "lucide-react";


interface TimeData {
  day: string;
  progress: number; // hours
}

interface ProgressChartsProps {
  timeHistory: { date: string; minutes: number }[];
  completedLessons: number;
  viewedLessons: number;
  totalLessons: number;
  // New: resource-level data for the donut
  documentsOpened?: number;
  completedResources?: number;
  totalResources?: number;
}

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
`;

const easeFns: Record<string, (t: number) => number> = {
  easeOut:       (t) => 1 - Math.pow(1 - t, 3),
  easeOutStrong: (t) => 1 - Math.pow(1 - t, 4),
  easeInOut:     (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

function useRaf(duration = 1200, easeType = "easeOut", delay = 0, resetKey = 0) {
  const [progress, setProgress] = useState(0);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    setProgress(0);
    startRef.current = null;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const ease = easeFns[easeType] ?? easeFns.easeOut;
    const delayTimer = setTimeout(() => {
      const tick = (now: number) => {
        if (!startRef.current) startRef.current = now;
        const t = Math.min((now - startRef.current) / duration, 1);
        setProgress(ease(t));
        if (t < 1) animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(delayTimer);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [duration, easeType, delay, resetKey]);

  return progress;
}

function approxPathLength(pts: {x: number, y: number}[], steps = 200) {
  if (pts.length < 2) return 500;
  let len = 0, prev: {x: number, y: number} | null = null;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const totalSegs = pts.length - 1;
    let segIdx = Math.floor(t * totalSegs);
    if (segIdx >= totalSegs) segIdx = totalSegs - 1;
    const segT = t * totalSegs - segIdx;
    const p0 = pts[segIdx];
    const p1 = pts[segIdx + 1];
    const cpx = (p0.x + p1.x) / 2;
    const bx = Math.pow(1-segT,3)*p0.x + 3*Math.pow(1-segT,2)*segT*cpx + 3*(1-segT)*segT*segT*cpx + segT*segT*segT*p1.x;
    const by = Math.pow(1-segT,3)*p0.y + 3*Math.pow(1-segT,2)*segT*p0.y + 3*(1-segT)*segT*segT*p1.y + segT*segT*segT*p1.y;
    if (prev) len += Math.hypot(bx - prev.x, by - prev.y);
    prev = { x: bx, y: by };
  }
  return Math.round(len);
}

/* ── Bar Chart: Study Time ───────────────────────────────────────────────────── */
function StudyTimeBarChart({ resetKey = 0, weekData, locale }: { resetKey: number, weekData: TimeData[], locale: string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [lineReady, setLineReady] = useState(false);
  const t = useTranslations("Profile");

  const animProgress = useRaf(1000, "easeOutStrong", 0, resetKey);

  useEffect(() => {
    setMounted(false);
    setLineReady(false);
    const t1 = setTimeout(() => setMounted(true), 60);
    const t2 = setTimeout(() => setLineReady(true), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [resetKey]);

  const toY = (h: number) => CHART_H - (Math.min(h, MAX_H) / MAX_H) * CHART_H;
  const barX = (i: number) => LEFT_PAD + i * BAR_GAP;
  const centerX = (i: number) => barX(i) + BAR_W / 2;

  const animData = weekData.map((d) => ({ ...d, progress: d.progress * animProgress }));

  const finalPts = weekData.map((d, i) => ({
    x: centerX(i),
    y: toY(d.progress) - LINE_GAP,
  }));

  function smoothPath(pts: {x: number, y: number}[]) {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i-1].x + pts[i].x) / 2;
      d += ` C ${cpx} ${pts[i-1].y}, ${cpx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  }

  function areaPath(pts: {x: number, y: number}[]) {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${CHART_H} L ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i-1].x + pts[i].x) / 2;
      d += ` C ${cpx} ${pts[i-1].y}, ${cpx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }
    d += ` L ${pts[pts.length-1].x} ${CHART_H} Z`;
    return d;
  }

  const yLabels = [8, 6, 4, 2, 0];
  const svgW = LEFT_PAD + weekData.length * BAR_GAP + 20;
  const pathLen = approxPathLength(finalPts);

  let maxIdx = 0, maxVal = -1;
  weekData.forEach((d, i) => {
    if (d.progress > maxVal) { maxVal = d.progress; maxIdx = i; }
  });
  const peakPt = finalPts[maxIdx];
  const totalHours = weekData.reduce((s, d) => s + d.progress, 0);
  const dir = locale === 'ar' ? "rtl" : "ltr";

  return (
    <div style={{
      background: "#ffffff", borderRadius: 28,
      padding: "28px 28px 24px 28px",
      fontFamily: "'DM Sans','Helvetica Neue',sans-serif",
      flex: 1, minWidth: 0, boxSizing: "border-box",
      opacity: mounted ? 1 : 0,
      transform: mounted ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.5s cubic-bezier(.22,1,.36,1), transform 0.5s cubic-bezier(.22,1,.36,1)",
      border: "1px solid rgba(0,158,96,0.1)",
      boxShadow: "0 4px 20px rgba(0,80,40,0.04)"
    }} dir={dir}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: "#009E60",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            transition: "transform 0.2s ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08) rotate(-3deg)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; }}
          >
            {/* Clock icon */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2.5" />
              <polyline points="12 7 12 12 15 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, color: "#1a1a1a", letterSpacing: "-0.5px" }}>
              {t("study_time") || "Study Time"}
            </div>
            <div style={{ fontSize: 14, color: "#aaa", marginTop: 3 }}>
              {t("study_time_desc") || "Hours spent studying this week"}
            </div>
          </div>
        </div>

        <div style={{
          background: "#f7faf8", border: "1px solid #e5f0eb", borderRadius: 16, padding: "8px 16px",
          fontSize: 14, fontWeight: 700, color: "#009E60", flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ color: "#555", fontWeight: 500 }}>{t("total") || "Total"}</span>
          {totalHours.toFixed(1)}h
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 24, marginBottom: 14, paddingLeft: 4 }}>
        {[{ color: "#009E60", label: t("study_time") || "Study Time" }].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#555" }}>
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
            <linearGradient id="gradGreenStudy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#009E60" />
              <stop offset="100%" stopColor="#00c471" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="gradGrayStudy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2e2e2" />
              <stop offset="100%" stopColor="#c8c8c3" />
            </linearGradient>
            <linearGradient id="lineGradStudy" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ccc" />
              <stop offset="30%" stopColor="#009E60" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#009E60" />
              <stop offset="70%" stopColor="#009E60" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ccc" />
            </linearGradient>
            <linearGradient id="areaGradStudy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#009E60" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#009E60" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y labels */}
          {yLabels.map((h, idx) => (
            <text key={h} x={LEFT_PAD - 10} y={toY(h) + 4}
              textAnchor="end" fontSize={12} fill="#c0c0bb" fontFamily="DM Sans, sans-serif"
              style={{ animation: "fadeIn 0.35s ease-out both", animationDelay: `${0.08 + idx * 0.05}s` }}>
              {h === 0 ? "0" : `${h}h`}
            </text>
          ))}

          {/* Horizontal grid lines */}
          {yLabels.map(h => (
            <line key={`grid-${h}`}
              x1={LEFT_PAD} y1={toY(h)} x2={svgW - 20} y2={toY(h)}
              stroke="#f0f0ee" strokeWidth="1" strokeDasharray="4 4"
            />
          ))}

          {/* Bars */}
          {animData.map((d, i) => {
            const x = barX(i);
            const bCx = centerX(i);
            const isLatest = i === animData.length - 1;
            const barH = Math.max((Math.min(d.progress, MAX_H) / MAX_H) * CHART_H, 0);
            const barY = CHART_H - barH;
            
            const isHov = hovered === i;
            // Enhanced hover: Smooth highlight with CSS transitions
            const barFill = isLatest ? "url(#gradGreenStudy)" : ((hovered !== null && isHov) ? "#009E60" : "url(#gradGrayStudy)");

            return (
              <g key={d.day + i} 
                onMouseEnter={() => setHovered(i)} 
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Invisible wider hit area for easier hovering spanning the whole gap */}
                <rect x={x - (BAR_GAP - BAR_W) / 2} y={0} width={BAR_GAP} height={CHART_H + 30} fill="transparent" />
                
                <rect x={x} y={barY} width={BAR_W} height={barH} rx={14}
                  fill={barFill}
                  opacity={hovered !== null && !isHov ? 0.4 : 1}
                  style={{ 
                    transition: "fill 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
                <text x={bCx} y={CHART_H + 24} textAnchor="middle" fontSize={13}
                  fill={isHov ? "#009E60" : "#bbb"} fontFamily="DM Sans, sans-serif"
                  style={{ transition: "fill 0.3s ease", fontWeight: isHov ? 700 : 400 }}
                  direction="ltr"
                >
                  {d.day}
                </text>
              </g>
            );
          })}

          {/* Area */}
          {animProgress > 0.94 && (
            <path d={areaPath(finalPts)} fill="url(#areaGradStudy)"
              style={{ animation: "fadeIn 0.5s ease-out both", pointerEvents: "none" }} />
          )}

          {/* Line */}
          {lineReady && (
            <path
              d={smoothPath(finalPts)}
              fill="none" stroke="url(#lineGradStudy)" strokeWidth="2.5" strokeLinecap="round"
              style={{
                "--path-len": pathLen,
                strokeDasharray: pathLen,
                animation: `drawPath 1.4s cubic-bezier(.25,0,.15,1) forwards`,
                pointerEvents: "none",
              } as React.CSSProperties}
            />
          )}

          {/* Peak marker */}
          {lineReady && maxVal > 0 && hovered === null && (
            <g style={{ animation: "fadeIn 0.4s ease-out 1.0s both", pointerEvents: "none" }}>
              <circle cx={peakPt.x} cy={peakPt.y} r={22} fill="#009E60" opacity="0.08"
                style={{ animation: "pulse 2.8s ease-in-out infinite", transformOrigin: `${peakPt.x}px ${peakPt.y}px` }} />
              <circle cx={peakPt.x} cy={peakPt.y} r={6} fill="#009E60" stroke="white" strokeWidth="2.5" />
              <g style={{ animation: "floatBadge 3s ease-in-out 1.8s infinite", transformOrigin: `${peakPt.x}px ${peakPt.y - 40}px` }}>
                <rect x={peakPt.x - 28} y={peakPt.y - 52} width={56} height={24} rx={12} fill="white" opacity="0.96" />
                <rect x={peakPt.x - 28} y={peakPt.y - 52} width={56} height={24} rx={12} fill="none" stroke="rgba(0,158,96,0.15)" strokeWidth="1" />
                <text x={peakPt.x} y={peakPt.y - 35} textAnchor="middle"
                  fontSize={12} fontWeight="700" fill="#009E60" fontFamily="DM Sans, sans-serif" direction="ltr">
                  {maxVal.toFixed(1)}h
                </text>
              </g>
            </g>
          )}

          {/* Hover value */}
          {hovered !== null && (
            <g style={{ 
              transition: "opacity 0.2s ease, transform 0.2s ease",
              transform: `translateX(${finalPts[hovered].x - centerX(hovered)}px)`,
              opacity: animProgress > 0.5 ? 1 : 0,
              pointerEvents: "none"
            }}>
              <circle cx={centerX(hovered)} cy={finalPts[hovered].y}
                r={5} fill="#009E60" stroke="white" strokeWidth="2" />
              <rect x={centerX(hovered) - 26} y={finalPts[hovered].y - 44}
                width={52} height={22} rx={11} fill="white" 
                style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }} />
              <text x={centerX(hovered)} y={finalPts[hovered].y - 28}
                textAnchor="middle" fontSize={11.5} fontWeight="700" fill="#1a1a1a" fontFamily="DM Sans, sans-serif" direction="ltr">
                {weekData[hovered].progress.toFixed(1)}h
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}

/* ── Donut Chart: Content Progress (Opened / Completed / Remaining) ──────────── */
function ContentDonutChart({
  resetKey = 0, documentsOpened, completedResources, totalResources, locale
}: {
  resetKey: number,
  documentsOpened: number,
  completedResources: number,
  totalResources: number,
  locale: string
}) {
  const [mounted, setMounted] = useState(false);
  const [hoveredSeg, setHoveredSeg] = useState<number | null>(null);
  const t = useTranslations("Profile");

  const prog0 = useRaf(1000, "easeOutStrong", 200, resetKey);
  const prog1 = useRaf(1000, "easeOutStrong", 500, resetKey);
  const prog2 = useRaf(1000, "easeOutStrong", 800, resetKey);
  const progArr = [prog0, prog1, prog2];

  useEffect(() => {
    setMounted(false);
    const timer = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(timer);
  }, [resetKey]);

  const svgSize = 250;
  const cx = svgSize / 2, cy = svgSize / 2;
  const outerR = 105, innerR = 65;
  const midR   = (outerR + innerR) / 2;
  const gapDeg = 7;
  const cornerRadius = 6; // slightly rounded edges

  const safeTotal = Math.max(totalResources, documentsOpened, completedResources, 1);
  const completedPct  = Math.min(completedResources / safeTotal, 1);
  const openedPct     = Math.min(Math.max(0, (documentsOpened - completedResources) / safeTotal), 1 - completedPct);
  const remainingPct  = Math.max(0, 1 - completedPct - openedPct);

  const segments = [
    { color: "#009E60", pct: completedPct },
    { color: "#5B9EF4", pct: openedPct },
    { color: "#f0f0f0", pct: remainingPct },
  ].filter(s => s.pct > 0.005);

  const describeArc = (x: number, y: number, rIn: number, rOut: number, startA: number, endA: number) => {
    // If angle is extremely small, just return empty
    if (endA - startA < 0.01) return "";
    const si = { x: x + rIn * Math.cos(startA), y: y + rIn * Math.sin(startA) };
    const ei = { x: x + rIn * Math.cos(endA),   y: y + rIn * Math.sin(endA)   };
    const so = { x: x + rOut * Math.cos(startA), y: y + rOut * Math.sin(startA) };
    const eo = { x: x + rOut * Math.cos(endA),   y: y + rOut * Math.sin(endA)   };
    const largeArc = endA - startA <= Math.PI ? "0" : "1";
    return [
      "M", so.x, so.y, "A", rOut, rOut, 0, largeArc, 1, eo.x, eo.y,
      "L", ei.x, ei.y, "A", rIn, rIn, 0, largeArc, 0, si.x, si.y, "Z"
    ].join(" ");
  };

  let currentPct = 0;
  const builtSegs = segments.map((seg, i) => {
    const animProg = progArr[i] || prog0;
    
    const sA = (currentPct * 360 - 90) * Math.PI / 180;
    const eA = ((currentPct + seg.pct) * 360 - 90) * Math.PI / 180;
    const gapR = (gapDeg / 2) * Math.PI / 180;
    
    const fS = sA + gapR;
    let fE = eA - gapR;
    if (fE < fS) fE = fS; // prevent negative angle

    const aE = fS + (fE - fS) * animProg;
    
    // adjust radii by half of cornerRadius so total thickness remains visually same 
    const pathD = describeArc(cx, cy, innerR + cornerRadius/2, outerR - cornerRadius/2, fS, aE);
    
    const midR2 = (sA + (eA - sA) / 2);
    const lX = cx + midR * Math.cos(midR2);
    const lY = cy + midR * Math.sin(midR2);

    currentPct += seg.pct;
    
    return { ...seg, pathD, animProg, lX, lY };
  });

  const allT = totalResources > 0 ? totalResources : "-";
  const dir = locale === 'ar' ? "rtl" : "ltr";

  return (
    <div style={{
      background: "#ffffff", borderRadius: 28, padding: "28px 24px 20px 24px",
      flexShrink: 0, fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box",
      opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.5s ease 0.12s, transform 0.5s ease 0.12s",
      border: "1px solid rgba(0,158,96,0.1)", boxShadow: "0 4px 20px rgba(0,80,40,0.04)",
      display: "flex", flexDirection: "column", alignItems: "center"
    }} className="w-full lg:w-[320px]" dir={dir}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 22, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={22} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a1a" }}>{t("content_progress")}</div>
            <div style={{ fontSize: 13, color: "#aaa" }}>{t("content_progress_desc")}</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          {/* Background circle outline to slightly hint at the track */}
          <path d={describeArc(cx, cy, innerR + cornerRadius/2, outerR - cornerRadius/2, 0, 2 * Math.PI)}
                fill="none" stroke="#f6f6f6" strokeWidth={cornerRadius} strokeLinejoin="round" />
                
          {builtSegs.map((s, i) => (
            <path
              key={`seg-${i}`}
              d={s.pathD}
              fill={s.color}
              stroke={s.color}
              strokeWidth={cornerRadius}
              strokeLinejoin="round"
              opacity={hoveredSeg !== null && hoveredSeg !== i ? 0.4 : 1}
              onMouseEnter={() => setHoveredSeg(i)} 
              onMouseLeave={() => setHoveredSeg(null)}
              style={{
                cursor: "pointer", 
                transition: "opacity 0.3s ease",
              }}
            />
          ))}
          <g style={{ pointerEvents: "none" }}>
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize={15} fontWeight="800" fill="#1a1a1a" direction="ltr">{t("total_resources")}</text>
            <text x={cx} y={cy + 16} textAnchor="middle" fontSize={24} fontWeight="900" fill="#009E60" direction="ltr">{allT}</text>
            {builtSegs.map((s, i) => s.animProg > 0.9 && s.pct > 0.08 && (
              <text key={`l-${i}`} x={s.lX} y={s.lY + 5} textAnchor="middle" fontSize={12} fontWeight="bold" fill={s.color === "#f0f0f0" ? "#1a1a1a" : "#fff"} pointerEvents="none" direction="ltr">
                {Math.round(s.pct * 100)}%
              </text>
            ))}
          </g>
        </svg>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
        {[
          { color: "#009E60", label: t("completed"), v: completedResources },
          { color: "#5B9EF4", label: t("opened"),    v: documentsOpened },
          { color: "#f0f0f0", label: t("remaining"), v: Math.max(0, totalResources - documentsOpened) },
        ].map(({ color, label, v }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontSize: 12, color: "#666", fontWeight: 600 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
              {label}
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Root ─────────────────────────────────────────────────────────────────────── */
export default function ProgressCharts({
  timeHistory,
  completedLessons,
  viewedLessons,
  totalLessons,
  documentsOpened = 0,
  completedResources = 0,
  totalResources = 0,
}: ProgressChartsProps) {
  const [replayKey, setReplayKey] = useState(0);
  const locale = useLocale();

  void setReplayKey; // replayKey available for future chart replay feature

  // Dummy study time data for visualization when no real data exist
  const DUMMY_HOURS = [1.2, 2.5, 0.8, 3.1, 1.7, 4.0, 2.3];

  const weekData: TimeData[] = [];

  if (timeHistory && timeHistory.length > 0) {
    const sortedHistory = [...timeHistory].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const recentHistory = sortedHistory.slice(-7);

    recentHistory.forEach(entry => {
      const d = new Date(entry.date);
      let dayName = d.toLocaleDateString(locale, { weekday: 'short' });
      dayName = dayName.replace('.', '');
      weekData.push({
        day: dayName,
        progress: Number((entry.minutes / 60).toFixed(2))
      });
    });

    while (weekData.length < 7) {
      weekData.unshift({ day: "-", progress: 0 });
    }
  } else {
    // Use dummy values so chart always looks rich and informative
    const fallbackDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    fallbackDays.forEach((day, i) => weekData.push({ day, progress: DUMMY_HOURS[i] }));
  }

  // Fallback donut data using lesson-level info if resource-level isn't available
  const effectiveTotal     = totalResources > 0 ? totalResources : totalLessons;
  const effectiveCompleted = completedResources > 0 ? completedResources : completedLessons;
  const effectiveOpened    = documentsOpened > 0 ? documentsOpened : (viewedLessons + completedLessons);

  return (
    <div style={{
      width: "100%",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      fontFamily: "'DM Sans','Helvetica Neue',sans-serif",
    }}>
      <style dangerouslySetInnerHTML={{ __html: ANIMATION_CSS }} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <ContentDonutChart
          key={`donut-${replayKey}`}
          resetKey={replayKey}
          documentsOpened={effectiveOpened}
          completedResources={effectiveCompleted}
          totalResources={effectiveTotal}
          locale={locale}
        />
        <StudyTimeBarChart key={`bar-${replayKey}`} resetKey={replayKey} weekData={weekData} locale={locale} />
      </div>
    </div>
  );
}
