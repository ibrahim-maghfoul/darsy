"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart2, MessageSquare, Headphones, BookOpen, Star, Video,
  CloudOff, Users, Compass, Zap, Shield, Globe, TrendingUp,
  Bell, FileText, Heart,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type LucideIcon = React.FC<{ size?: number; color?: string; strokeWidth?: number }>;

type CardDef = {
  id: string;
  texture: string;
  flip: "v" | "h";
  isCenter?: boolean;
  gridColumn: string;
  gridRow: string;
  transformOrigin?: string;
  ring: number; // 0=center, 1=inner, 2=outer
  front: { Icon: LucideIcon; title: string };
  back: { Icon: LucideIcon; title: string; desc: string };
};

// ─── Textures ─────────────────────────────────────────────────────────────────
const getTexture = (name: string, color: string): React.CSSProperties => {
  const s: Record<string, React.CSSProperties> = {
    "t-grid": { backgroundImage: `linear-gradient(${color} 1px,transparent 1px),linear-gradient(90deg,${color} 1px,transparent 1px)`, backgroundSize: "12px 12px" },
    "t-dots": { backgroundImage: `radial-gradient(circle,${color} 1.2px,transparent 1.2px)`, backgroundSize: "8px 8px" },
    "t-rings": { backgroundImage: `radial-gradient(circle,transparent 6px,${color} 6px,${color} 7px,transparent 7px)`, backgroundSize: "16px 16px" },
    "t-dash": { backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 4px,${color} 4px,${color} 5px)` },
    "t-diagonal": { backgroundImage: `repeating-linear-gradient(45deg,${color},${color} 1px,transparent 1px,transparent 8px)` },
    "t-cross-hatch": { backgroundImage: `repeating-linear-gradient(45deg,${color},${color} 1px,transparent 1px,transparent 7px),repeating-linear-gradient(-45deg,${color},${color} 1px,transparent 1px,transparent 7px)` },
    "t-zigzag": { 
      backgroundImage: `linear-gradient(135deg,${color} 25%,transparent 25%), linear-gradient(225deg,${color} 25%,transparent 25%), linear-gradient(315deg,${color} 25%,transparent 25%), linear-gradient(45deg,${color} 25%,transparent 25%)`,
      backgroundPosition: "-8px 0, -8px 0, 0 0, 0 0",
      backgroundSize: "16px 16px" 
    },
    "t-waves": { backgroundImage: `repeating-radial-gradient(circle at 0 50%,transparent 0,transparent 5px,${color} 6px,transparent 7px)`, backgroundSize: "13px 13px" },
    "t-hexagons": { backgroundImage: `radial-gradient(circle farthest-side at 0% 50%,transparent 23%,${color} 24%,${color} 26%,transparent 27%,transparent 49%),radial-gradient(circle farthest-side at 100% 50%,transparent 23%,${color} 24%,${color} 26%,transparent 27%)`, backgroundSize: "14px 8px" },
    "t-plus": { backgroundImage: `radial-gradient(circle,${color} 1px,transparent 1px)`, backgroundSize: "10px 10px" },
    "t-checker": { backgroundImage: `linear-gradient(45deg,${color} 25%,transparent 25%,transparent 75%,${color} 75%)`, backgroundSize: "10px 10px" },
    "t-herringbone": { backgroundImage: `repeating-linear-gradient(60deg,${color},${color} 1px,transparent 1px,transparent 10px),repeating-linear-gradient(-60deg,${color},${color} 1px,transparent 1px,transparent 10px)` },
  };
  return s[name] || {};
};

const CELL = 82;
const GAP = 6;

// ─── Cards ────────────────────────────────────────────────────────────────────
const ALL_CARDS: CardDef[] = [
  // CENTER
  {
    id: "ctr", ring: 0, texture: "t-cross-hatch", flip: "v", isCenter: true,
    gridColumn: "4", gridRow: "3",
    front: { Icon: Compass, title: "Explore" }, back: { Icon: Compass, title: "All Features", desc: "Click to expand." }
  },

  // INNER RING (ring 1)
  {
    id: "i1", ring: 1, texture: "t-grid", flip: "v", gridColumn: "3/5", gridRow: "2", transformOrigin: "bottom center",
    front: { Icon: BarChart2, title: "Analytics" }, back: { Icon: BarChart2, title: "Your Progress", desc: "Track every win." }
  },
  {
    id: "i2", ring: 1, texture: "t-dots", flip: "h", gridColumn: "5", gridRow: "2/4", transformOrigin: "center left",
    front: { Icon: MessageSquare, title: "Messages" }, back: { Icon: MessageSquare, title: "Inbox", desc: "Chat with mentors." }
  },
  {
    id: "i3", ring: 1, texture: "t-diagonal", flip: "h", gridColumn: "3", gridRow: "3/5", transformOrigin: "center right",
    front: { Icon: Headphones, title: "Support" }, back: { Icon: Headphones, title: "24/7 Help", desc: "We are always here." }
  },
  {
    id: "i4", ring: 1, texture: "t-waves", flip: "v", gridColumn: "4/6", gridRow: "4", transformOrigin: "top center",
    front: { Icon: BookOpen, title: "Courses" }, back: { Icon: BookOpen, title: "Full Library", desc: "1,200+ lessons." }
  },

  // OUTER RING (ring 2)
  {
    id: "oTOP", ring: 2, texture: "t-rings", flip: "v", gridColumn: "2/6", gridRow: "1",
    front: { Icon: Star, title: "Premium" }, back: { Icon: Star, title: "Unlock More", desc: "Exclusive resources." }
  },
  {
    id: "oRA", ring: 2, texture: "t-zigzag", flip: "h", gridColumn: "6", gridRow: "1/5",
    front: { Icon: Video, title: "Live Sessions" }, back: { Icon: Video, title: "Join Live", desc: "Real-time interaction." }
  },
  {
    id: "oBOT", ring: 2, texture: "t-hexagons", flip: "v", gridColumn: "3/7", gridRow: "5",
    front: { Icon: CloudOff, title: "Offline Mode" }, back: { Icon: CloudOff, title: "Save Data", desc: "Learn anywhere." }
  },
  {
    id: "oLA", ring: 2, texture: "t-dash", flip: "h", gridColumn: "2", gridRow: "2/6",
    front: { Icon: Users, title: "Community" }, back: { Icon: Users, title: "Discussion", desc: "Talk with peers." }
  },
  {
    id: "oTL", ring: 2, texture: "t-checker", flip: "v", gridColumn: "1", gridRow: "1/3",
    front: { Icon: Zap, title: "Quick Start" }, back: { Icon: Zap, title: "Shortcuts", desc: "Launch anything fast." }
  },
  {
    id: "oLM", ring: 2, texture: "t-plus", flip: "h", gridColumn: "1", gridRow: "3",
    front: { Icon: Shield, title: "Security" }, back: { Icon: Shield, title: "Protected", desc: "Your data is safe." }
  },
  {
    id: "oBL", ring: 2, texture: "t-herringbone", flip: "v", gridColumn: "1", gridRow: "4/6",
    front: { Icon: Globe, title: "Languages" }, back: { Icon: Globe, title: "Worldwide", desc: "20+ languages." }
  },
  {
    id: "oTR", ring: 2, texture: "t-diagonal", flip: "v", gridColumn: "7", gridRow: "1/3",
    front: { Icon: Bell, title: "Notifications" }, back: { Icon: Bell, title: "Alerts", desc: "Never miss a beat." }
  },
  {
    id: "oRM", ring: 2, texture: "t-grid", flip: "h", gridColumn: "7", gridRow: "3",
    front: { Icon: TrendingUp, title: "Leaderboard" }, back: { Icon: TrendingUp, title: "Rankings", desc: "Compete & rise." }
  },
  {
    id: "oBR", ring: 2, texture: "t-dots", flip: "v", gridColumn: "7", gridRow: "4/6",
    front: { Icon: FileText, title: "Certificates" }, back: { Icon: FileText, title: "Your Certs", desc: "Download & share." }
  },
];

const OUTER_CARDS = ALL_CARDS.filter(c => c.ring === 2);
const NON_CENTER_CARDS = ALL_CARDS.filter(c => !c.isCenter);
const CENTER_CARD = ALL_CARDS.find(c => c.isCenter)!;

// ─── Slide directions ─────────────────────────────────────────────────────────
const OUTER_SLIDE: Record<string, { hidden: string; visible: string }> = {
  oTOP: { hidden: "translateY(-120%)", visible: "translateY(0)" },
  oRA: { hidden: "translateX(120%)", visible: "translateX(0)" },
  oBOT: { hidden: "translateY(120%)", visible: "translateY(0)" },
  oLA: { hidden: "translateX(-120%)", visible: "translateX(0)" },
  oTL: { hidden: "translate(-120%,-120%)", visible: "translate(0,0)" },
  oLM: { hidden: "translateX(-120%)", visible: "translateX(0)" },
  oBL: { hidden: "translate(-120%,120%)", visible: "translate(0,0)" },
  oTR: { hidden: "translate(120%,-120%)", visible: "translate(0,0)" },
  oRM: { hidden: "translateX(120%)", visible: "translateX(0)" },
  oBR: { hidden: "translate(120%,120%)", visible: "translate(0,0)" },
};

// ─── Countdown ring ───────────────────────────────────────────────────────────
function RingCountdown({ total, current }: { total: number; current: number }) {
  const r = 28, circ = 2 * Math.PI * r, dash = circ * (current / total);
  return (
    <svg width="72" height="72" style={{ position: "absolute", inset: 0, margin: "auto", zIndex: 0, pointerEvents: "none" }}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
      <circle cx="36" cy="36" r={r} fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} transform="rotate(-90 36 36)"
        style={{ transition: "stroke-dasharray 0.85s cubic-bezier(0.4,0,0.2,1)" }} />
    </svg>
  );
}

// ─── Center card ──────────────────────────────────────────────────────────────
function CenterCard({ card, isExpanded, started, onClick }: { card: CardDef; isExpanded: boolean; started: boolean; onClick: () => void }) {
  const TOTAL = 3;
  const [count, setCount] = useState(TOTAL);
  const [phase, setPhase] = useState<"counting" | "enjoy" | "collapsed">("counting");
  const hasExpandedOnce = useRef(false);

  useEffect(() => {
    if (isExpanded) { hasExpandedOnce.current = true; setPhase("enjoy"); return; }
    if (!hasExpandedOnce.current) {
      if (started) {
        setCount(TOTAL); setPhase("counting");
        const iv = setInterval(() => setCount(c => { if (c <= 1) { clearInterval(iv); return 0; } return c - 1; }), 1000);
        return () => clearInterval(iv);
      } else {
        setCount(TOTAL); setPhase("counting");
      }
      return;
    }
    setPhase("collapsed");
  }, [isExpanded, started]);

  return (
    <div style={{ gridColumn: card.gridColumn, gridRow: card.gridRow, position: "relative", cursor: "pointer", zIndex: 10 }} onClick={onClick}>
      <div style={{ width: "100%", height: "100%", transform: isExpanded ? "scale(1)" : "scale(0.86)", transformOrigin: "center", transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 13, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 10, background: "linear-gradient(135deg,#00c471,#009E60)", boxShadow: "0 8px 28px rgba(0,140,70,0.35)" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.15, zIndex: 0, ...getTexture(card.texture, "white") }} />
          {phase === "collapsed" ? (
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <card.front.Icon size={20} color="#fff" strokeWidth={2} />
              <span style={{ fontWeight: 800, fontSize: 9.5, color: "#fff" }}>Expand</span>
            </div>
          ) : phase === "counting" ? (
            <>
              <RingCountdown total={TOTAL} current={started ? count : TOTAL} />
              <span key={count} style={{ position: "relative", zIndex: 1, fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{count}</span>
            </>
          ) : (
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Heart size={20} color="#fff" strokeWidth={2} fill="rgba(255,255,255,0.35)" />
              <span style={{ fontWeight: 900, fontSize: 12, color: "#fff" }}>Enjoy!</span>
              <span style={{ fontSize: 7.5, color: "rgba(255,255,255,0.7)" }}>tap to collapse</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Generic card ─────────────────────────────────────────────────────────────
function Card({ card, isFlipped, isRevealed, isExpanded, onClick, onMouseEnter, onMouseLeave }: {
  card: CardDef; isFlipped: boolean; isRevealed: boolean; isExpanded: boolean;
  onClick: () => void; onMouseEnter: () => void; onMouseLeave: () => void;
}) {
  const isOuter = card.ring === 2;
  const slide = OUTER_SLIDE[card.id];

  const frontStyle = isFlipped
    ? card.flip === "v" ? { opacity: 0, transform: "translateY(50%) rotateX(90deg)" } : { opacity: 0, transform: "translateX(50%) rotateY(90deg)" }
    : {};
  const backRest = card.flip === "v" ? { transform: "translateY(-50%) rotateX(90deg)", opacity: 0 } : { transform: "translateX(-50%) rotateY(-90deg)", opacity: 0 };
  const backActive = isFlipped ? { transform: "translateY(0) rotateX(0) translateX(0) rotateY(0)", opacity: 1 } : {};

  const wrapperStyle: React.CSSProperties = isOuter
    ? {
      gridColumn: card.gridColumn,
      gridRow: card.gridRow,
      opacity: isRevealed ? 1 : 0,
      transform: isRevealed ? slide.visible : slide.hidden,
      pointerEvents: isRevealed ? "all" : "none",
      transition: "transform 0.65s cubic-bezier(0.34,1.18,0.64,1), opacity 0.4s ease",
      willChange: "transform",
      position: "relative",
      cursor: "pointer",
    }
    : {
      gridColumn: card.gridColumn,
      gridRow: card.gridRow,
      position: "relative",
      cursor: "pointer",
    };

  const innerScale: React.CSSProperties = card.ring === 1
    ? { width: "100%", height: "100%", transform: isExpanded ? "scale(1)" : "scale(0.80)", transformOrigin: card.transformOrigin || "center", transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)" }
    : { width: "100%", height: "100%" };

  const faceBase: React.CSSProperties = {
    position: "absolute", inset: 0, borderRadius: 13,
    backfaceVisibility: "hidden", transition: "0.5s cubic-bezier(0.645,0.045,0.355,1)",
    overflow: "hidden", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", textAlign: "center", padding: 10,
  };
  const ct = "transform 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease";
  const frontContentStyle: React.CSSProperties = isFlipped
    ? card.flip === "v" ? { transform: "translateY(35%)", opacity: 0, transition: ct } : { transform: "translateX(35%)", opacity: 0, transition: ct }
    : { transform: "translateY(0) translateX(0)", opacity: 1, transition: ct };
  const backContentStyle: React.CSSProperties = isFlipped
    ? { transform: "translateY(0) translateX(0)", opacity: 1, transition: ct }
    : card.flip === "v" ? { transform: "translateY(-35%)", opacity: 0, transition: ct } : { transform: "translateX(-35%)", opacity: 0, transition: ct };

  return (
    <div style={wrapperStyle} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div style={innerScale}>
        <div style={{ ...faceBase, background: "#ffffff", border: "1px solid rgba(0, 158, 96, 0.35)", boxShadow: "0 2px 14px rgba(0,80,40,0.08)", zIndex: 2, ...frontStyle }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.05, zIndex: 0, ...getTexture(card.texture, "#009E60") }} />
          <div style={{ ...frontContentStyle, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative", zIndex: 1 }}>
            <card.front.Icon size={18} color="#009E60" strokeWidth={1.8} />
            <span style={{ fontWeight: 700, fontSize: 9, color: "#003d25", lineHeight: 1.3, letterSpacing: "0.01em" }}>{card.front.title}</span>
          </div>
        </div>
        <div style={{ ...faceBase, background: "linear-gradient(135deg,#00c471,#007a47)", zIndex: 1, ...backRest, ...backActive }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.16, zIndex: 0, ...getTexture(card.texture, "white") }} />
          <div style={{ ...backContentStyle, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <card.back.Icon size={18} color="#ffffff" strokeWidth={1.8} />
            <span style={{ fontWeight: 700, fontSize: 9, color: "#fff", lineHeight: 1.3 }}>{card.back.title}</span>
            {card.back.desc && <span style={{ fontSize: 7.5, color: "rgba(255,255,255,0.88)", lineHeight: 1.4 }}>{card.back.desc}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}



// ─── Main ─────────────────────────────────────────────────────────────────────
export function PlatformFeatures() {
  const [started, setStarted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const sectionRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealedRef = useRef<Record<string, boolean>>({});
  const autoFlipRef = useRef<Record<string, boolean>>({});
  const historyRef = useRef<string[]>([]);
  const hoveredRef = useRef<string | null>(null);
  const HISTORY_SIZE = 6;

  const revealOuter = useCallback(() => {
    setExpanded(true);
    OUTER_CARDS.forEach((c, i) => {
      setTimeout(() => {
        setRevealed(p => { const next = { ...p, [c.id]: true }; revealedRef.current = next; return next; });
      }, i * 80);
    });
  }, []);

  const collapseAll = useCallback(() => {
    setExpanded(false); setFlipped({}); setRevealed({});
    revealedRef.current = {}; autoFlipRef.current = {}; historyRef.current = [];
  }, []);

  const handleCardClick = useCallback((card: CardDef) => {
    if (card.isCenter) { if (!expanded) revealOuter(); else collapseAll(); return; }
    setFlipped(p => ({ ...p, [card.id]: !p[card.id] }));
  }, [expanded, revealOuter, collapseAll]);

  useEffect(() => {
    if (started && !expanded) {
      const t = setTimeout(revealOuter, 3000);
      return () => clearTimeout(t);
    }
  }, [started, expanded, revealOuter]);

  useEffect(() => {
    const el = sectionRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      // Relaxed threshold to 0.7 to ensure it triggers on most screens
      if (e.isIntersecting && e.intersectionRatio >= 0.7) {
        setStarted(true);
      }
    }, { threshold: [0, 0.7, 1.0] });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const innerTimers = new Set<ReturnType<typeof setTimeout>>();
    function pickCards(pool: CardDef[], count: number) {
      const eligible = pool.filter(c => !historyRef.current.includes(c.id));
      const source = eligible.length >= count ? eligible : pool;
      return [...source].sort(() => Math.random() - 0.5).slice(0, count);
    }
    function autoFlip() {
      const revNow = revealedRef.current;
      const autoFl = autoFlipRef.current;
      const pool = ALL_CARDS.filter(c => {
        if (c.isCenter) return false;
        return (c.ring === 2 ? !!revNow[c.id] : true) && !autoFl[c.id] && hoveredRef.current !== c.id;
      });
      if (pool.length > 0) {
        const picks = pickCards(pool, Math.floor(Math.random() * Math.min(pool.length, 4)) + 1);
        picks.forEach((pick, idx) => {
          historyRef.current = [...historyRef.current.slice(-(HISTORY_SIZE - 1)), pick.id];
          const t1 = setTimeout(() => {
            innerTimers.delete(t1);
            autoFlipRef.current = { ...autoFlipRef.current, [pick.id]: true };
            setFlipped(p => ({ ...p, [pick.id]: true }));
            const t2 = setTimeout(() => {
              innerTimers.delete(t2);
              autoFlipRef.current = { ...autoFlipRef.current, [pick.id]: false };
              setFlipped(p => ({ ...p, [pick.id]: false }));
            }, 2600);
            innerTimers.add(t2);
          }, idx * 90);
          innerTimers.add(t1);
        });
      }
      timerRef.current = setTimeout(autoFlip, Math.floor(Math.random() * 900) + 1800);
    }
    timerRef.current = setTimeout(autoFlip, 2000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      innerTimers.forEach(clearTimeout);
      innerTimers.clear();
    };
  }, []);

  const fullW = 7 * CELL + 6 * GAP;
  const fullH = 5 * CELL + 4 * GAP;

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 bg-gradient-to-b from-white to-[#f0fbf5]"
      style={{ overflow: "hidden" }}
    >
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-10 md:gap-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="inline-block text-xs font-black uppercase tracking-widest text-[#009E60] mb-4 px-4 py-1.5 bg-[#009E60]/10 rounded-full">
            Platform Features
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#112A46] leading-tight">
            Everything you need to <span className="text-[#009E60]">succeed</span>
          </h2>
        </motion.div>

        {/* ── Mobile: Vertical feature card list ── */}
        <div className="md:hidden w-full grid grid-cols-2 gap-3">
          {ALL_CARDS.filter(c => !c.isCenter).slice(0, 10).map((card, i) => {
            const isFlippedMob = !!flipped[card.id];
            const isV = card.flip === "v";
            const CT = "transform 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease";
            const frontOut  = isV ? "translateY(40%) rotateX(90deg)"  : "translateX(40%) rotateY(-90deg)";
            const backRest  = isV ? "translateY(-40%) rotateX(-90deg)" : "translateX(-40%) rotateY(90deg)";
            const isFeature = i === 1;
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                onClick={() => setFlipped(p => ({ ...p, [card.id]: !p[card.id] }))}
                className={`relative rounded-2xl cursor-pointer overflow-hidden${isFeature ? ' col-span-2' : ''}`}
                style={{ height: isFeature ? 110 : 90, perspective: "600px", ...(isFeature ? { width: '80vw', justifySelf: 'center' } : {}) }}
              >
                {/* Front face */}
                <div style={{
                  position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 8, padding: 14,
                  borderRadius: 16, border: "1px solid rgba(0,158,96,0.15)",
                  background: "#ffffff", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  transition: CT,
                  transform: isFlippedMob ? frontOut : "translateY(0) translateX(0) rotateX(0deg) rotateY(0deg)",
                  opacity: isFlippedMob ? 0 : 1,
                }}>
                  <card.front.Icon size={22} color="#009E60" strokeWidth={1.8} />
                  <span style={{ fontWeight: 700, fontSize: 10, color: "#003d25", textAlign: "center" }}>{card.front.title}</span>
                </div>

                {/* Back face */}
                <div style={{
                  position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 6, padding: 14,
                  borderRadius: 16, background: "linear-gradient(135deg,#00c471,#007a47)", overflow: "hidden",
                  transition: CT,
                  transform: isFlippedMob ? "translateY(0) translateX(0) rotateX(0deg) rotateY(0deg)" : backRest,
                  opacity: isFlippedMob ? 1 : 0,
                }}>
                  <div style={{ position: "absolute", inset: 0, opacity: 0.15, ...getTexture(card.texture, "white") }} />
                  <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <card.back.Icon size={20} color="#fff" strokeWidth={1.8} />
                    <span style={{ fontWeight: 700, fontSize: 10, color: "#fff", textAlign: "center" }}>{card.back.title}</span>
                    {card.back.desc && <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.8)", textAlign: "center" }}>{card.back.desc}</span>}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {/* Center card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl overflow-hidden cursor-pointer col-span-2"
            style={{
              background: "linear-gradient(135deg,#00c471,#009E60)",
              padding: "18px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              boxShadow: "0 8px 28px rgba(0,140,70,0.35)"
            }}
          >
            <CENTER_CARD.front.Icon size={22} color="#fff" strokeWidth={2} />
            <span style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>Explore All Features</span>
          </motion.div>
        </div>

        {/* ── Desktop: Full interactive grid ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="hidden md:block"
          style={{ width: fullW, height: fullH, overflow: "hidden", borderRadius: 16 }}
        >
          <div style={{
            display: "grid",
            gridTemplateColumns: `repeat(7, ${CELL}px)`,
            gridTemplateRows: `repeat(5, ${CELL}px)`,
            gap: GAP,
            width: fullW,
            height: fullH,
          }}>
            {NON_CENTER_CARDS.map(card => (
              <Card
                key={card.id}
                card={card}
                isFlipped={!!flipped[card.id]}
                isRevealed={!!revealed[card.id]}
                isExpanded={expanded}
                onClick={() => handleCardClick(card)}
                onMouseEnter={() => { hoveredRef.current = card.id; }}
                onMouseLeave={() => { hoveredRef.current = null; }}
              />
            ))}
            <CenterCard card={CENTER_CARD} isExpanded={expanded} started={started} onClick={() => handleCardClick(CENTER_CARD)} />
          </div>
        </motion.div>

      </div>
    </section>
  );
}