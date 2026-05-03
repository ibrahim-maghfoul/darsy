"use client";

import {
  motion, AnimatePresence,
  useMotionValue, useSpring, useTransform, useAnimationFrame, animate,
} from "framer-motion";
import type { MotionValue } from "framer-motion";
import { memo, useMemo, useRef, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DownloadButton } from "@/components/DownloadButton";
import { BookOpen } from "lucide-react";

// ─── Static data (module-level, never re-created) ─────────────────────────────
const CARDS = [
  { id: "math",  label: "Mathématiques",   sub: "الرياضيات",          lessons: 124, pdfs: 89, videos: 34, progress: 73, texture: "dots",   rotation: -7, z: 2, pos: { left: "10%", top: "20%" }, dur: 4.0, delay: 0   },
  { id: "phys",  label: "Physique-Chimie", sub: "الفيزياء والكيمياء", lessons: 98,  pdfs: 67, videos: 28, progress: 45, texture: "lines",  rotation:  5, z: 4, pos: { left: "22%", top: "11%" }, dur: 3.6, delay: 0.5 },
  { id: "arab",  label: "Langue Arabe",    sub: "اللغة العربية",      lessons: 112, pdfs: 78, videos: 22, progress: 82, texture: "cross",  rotation: -3, z: 5, pos: { left: "38%", top: "6%"  }, dur: 4.4, delay: 1.0 },
  { id: "hist",  label: "Histoire-Géo",    sub: "التاريخ والجغرافيا", lessons: 87,  pdfs: 56, videos: 19, progress: 38, texture: "grid",   rotation:  7, z: 3, pos: { left: "53%", top: "8%"  }, dur: 3.8, delay: 0.3 },
  { id: "svt",   label: "SVT",             sub: "علوم الحياة والأرض", lessons: 94,  pdfs: 62, videos: 25, progress: 61, texture: "hex",    rotation:  6, z: 5, pos: { left: "61%", top: "28%" }, dur: 4.2, delay: 1.5 },
  { id: "fr",    label: "Français",        sub: "اللغة الفرنسية",     lessons: 103, pdfs: 71, videos: 31, progress: 55, texture: "stripe", rotation: -5, z: 4, pos: { left: "28%", top: "53%" }, dur: 3.5, delay: 0.8 },
  { id: "philo", label: "Philosophie",     sub: "الفلسفة",            lessons: 68,  pdfs: 38, videos: 16, progress: 29, texture: "rings",  rotation:  4, z: 3, pos: { left: "48%", top: "55%" }, dur: 4.6, delay: 1.9 },
] as const;

type Card = (typeof CARDS)[number];

const TEXTURE: Record<string, { image: string; size: string; position?: string }> = {
  dots:   { image: "radial-gradient(circle, rgba(58,170,106,0.28) 1.5px, transparent 1.5px)", size: "17px 17px" },
  lines:  { image: "repeating-linear-gradient(45deg, rgba(58,170,106,0.13) 0, rgba(58,170,106,0.13) 1.5px, transparent 0, transparent 13px)", size: "13px 13px" },
  cross:  { image: ["repeating-linear-gradient(45deg,rgba(58,170,106,0.11) 0,rgba(58,170,106,0.11) 1px,transparent 0,transparent 10px)", "repeating-linear-gradient(-45deg,rgba(58,170,106,0.11) 0,rgba(58,170,106,0.11) 1px,transparent 0,transparent 10px)"].join(","), size: "10px 10px" },
  grid:   { image: ["repeating-linear-gradient(0deg,rgba(58,170,106,0.11) 0,rgba(58,170,106,0.11) 1px,transparent 0,transparent 20px)", "repeating-linear-gradient(90deg,rgba(58,170,106,0.11) 0,rgba(58,170,106,0.11) 1px,transparent 0,transparent 20px)"].join(","), size: "20px 20px" },
  hex:    { image: ["radial-gradient(circle,rgba(58,170,106,0.24) 1.5px,transparent 1.5px)", "radial-gradient(circle,rgba(58,170,106,0.24) 1.5px,transparent 1.5px)"].join(","), size: "22px 38px", position: "0 0,11px 19px" },
  stripe: { image: "repeating-linear-gradient(-58deg,rgba(58,170,106,0.11) 0,rgba(58,170,106,0.11) 3px,transparent 0,transparent 19px)", size: "19px 19px" },
  rings:  { image: "radial-gradient(circle at 50% 50%,transparent 0,transparent 14px,rgba(58,170,106,0.16) 15px,rgba(58,170,106,0.16) 16px,transparent 16px,transparent 30px,rgba(58,170,106,0.10) 31px,rgba(58,170,106,0.10) 32px)", size: "64px 64px" },
};

// Arc text: one repeating unit. 20 copies ensure the path is always filled.
const ARC_UNIT  = "Browse All Subjects · Explore · Discover · Learn · استكشف · Parcourir · ";
const ARC_REPS  = 20;
const ARC_SPEED = 0.006; // % per ms

type Labels = { eyebrow: string; lessons: string; videos: string; progress: string };

const CARD_W = 280;
const CARD_H  = 195;

// ─── Card inner ────────────────────────────────────────────────────────────────
function CardInner({ card, green, labels }: { card: Card; green: boolean; labels: Labels }) {
  const tex        = TEXTURE[card.texture];
  const textPrimary = green ? "#ffffff" : "#1a3a2a";
  const textMuted   = green ? "rgba(255,255,255,0.65)" : "rgba(26,58,42,0.38)";
  const accentText  = green ? "rgba(255,255,255,0.65)" : "rgba(58,170,106,0.6)";

  return (
    <>
      <div aria-hidden style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0, backgroundImage:tex.image, backgroundSize:tex.size, backgroundPosition:tex.position??"0 0", opacity:green?0.10:0.18, borderRadius:"inherit" }} />
      <div style={{ height:3, background:green?"linear-gradient(90deg,rgba(255,255,255,0.3) 0%,rgba(255,255,255,0.65) 100%)":"linear-gradient(90deg,#3aaa6a 0%,#5dc98a 55%,#97e6be 100%)", position:"relative", zIndex:1 }} />
      <div style={{ padding:"15px 17px 17px", position:"relative", zIndex:1 }}>
        <div style={{ fontSize:8.5, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.11em", color:accentText, marginBottom:5 }}>{labels.eyebrow}</div>
        <div style={{ fontSize:17, fontWeight:900, color:textPrimary, letterSpacing:"-0.035em", lineHeight:1.15 }}>{card.label}</div>
        <div style={{ fontSize:11, fontWeight:700, color:green?"rgba(255,255,255,0.5)":"rgba(26,58,42,0.35)", marginTop:2, marginBottom:13, direction:"rtl", textAlign:"right", fontFamily:"var(--font-cairo,sans-serif)" }}>{card.sub}</div>
        <div style={{ height:1, background:green?"rgba(255,255,255,0.18)":"rgba(58,170,106,0.09)", marginBottom:12 }} />
        <div style={{ display:"flex", gap:5, marginBottom:14 }}>
          {([
            { val:card.lessons, lbl:labels.lessons },
            { val:card.pdfs,    lbl:"PDFs" },
            { val:card.videos,  lbl:labels.videos },
          ] as const).map((s) => (
            <div key={s.lbl} style={{ flex:1, borderRadius:10, padding:"7px 3px", textAlign:"center", background:green?"rgba(255,255,255,0.15)":"rgba(58,170,106,0.05)", border:`1px solid ${green?"rgba(255,255,255,0.25)":"rgba(58,170,106,0.11)"}` }}>
              <div style={{ fontSize:15, fontWeight:900, color:textPrimary, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:7.5, fontWeight:700, color:textMuted, textTransform:"uppercase", letterSpacing:"0.07em", marginTop:2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:8.5, fontWeight:700, color:green?"rgba(255,255,255,0.6)":"rgba(26,58,42,0.42)", textTransform:"uppercase", letterSpacing:"0.08em" }}>{labels.progress}</span>
            <span style={{ fontSize:12, fontWeight:900, color:green?"#ffffff":"#3aaa6a", letterSpacing:"-0.01em" }}>{card.progress}%</span>
          </div>
          <div style={{ height:5, background:green?"rgba(255,255,255,0.2)":"rgba(58,170,106,0.10)", borderRadius:999, overflow:"hidden" }}>
            {green
              ? <div style={{ height:"100%", width:`${card.progress}%`, background:"rgba(255,255,255,0.85)", borderRadius:999 }} />
              : <motion.div
                  initial={{ width:0 }}
                  animate={{ width:`${card.progress}%` }}
                  transition={{ duration:1.1, delay:card.delay*0.35+0.65, ease:[0.34,1.2,0.64,1] }}
                  style={{ height:"100%", background:"linear-gradient(90deg,#3aaa6a 0%,#5dc98a 100%)", borderRadius:999 }}
                />
            }
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Single card ───────────────────────────────────────────────────────────────
const SubjectCard = memo(function SubjectCard({
  card, mouseX, mouseY, sectionSizeRef, flipped, labels, spread, floating,
}: {
  card: Card;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  sectionSizeRef: React.MutableRefObject<{ w: number; h: number }>;
  flipped: boolean;
  labels: Labels;
  spread: MotionValue<number>;
  floating: boolean;
}) {
  const RADIUS = 270, STRENGTH = 90;
  const leftPct = parseFloat(card.pos.left) / 100;
  const topPct  = parseFloat(card.pos.top)  / 100;

  // Single transform computes repulse x/y together (one sqrt per move)
  const repulseX = useTransform(() => {
    const mx = mouseX.get(), my = mouseY.get();
    const { w, h } = sectionSizeRef.current;
    const dx = mx - (leftPct * w + CARD_W / 2);
    const dy = my - (topPct  * h + CARD_H / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 0 || dist >= RADIUS) return 0;
    return -(dx / dist) * Math.pow(1 - dist / RADIUS, 1.8) * STRENGTH;
  });
  const repulseY = useTransform(() => {
    const mx = mouseX.get(), my = mouseY.get();
    const { w, h } = sectionSizeRef.current;
    const dx = mx - (leftPct * w + CARD_W / 2);
    const dy = my - (topPct  * h + CARD_H / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= 0 || dist >= RADIUS) return 0;
    return -(dy / dist) * Math.pow(1 - dist / RADIUS, 1.8) * STRENGTH;
  });
  // Softer spring → smoother, less frame-to-frame jitter
  const springRepX = useSpring(repulseX, { stiffness:120, damping:28, mass:0.7, restDelta:0.5 });
  const springRepY = useSpring(repulseY, { stiffness:120, damping:28, mass:0.7, restDelta:0.5 });

  // Offset from natural position → center; lerps to 0 when spread=1
  const stackX = useTransform(spread, (p) => (sectionSizeRef.current.w * (0.5 - leftPct) - CARD_W/2) * (1-p));
  const stackY = useTransform(spread, (p) => (sectionSizeRef.current.h * (0.5 - topPct)  - CARD_H/2) * (1-p));

  const totalX = useTransform(() => springRepX.get() + stackX.get());
  const totalY = useTransform(() => springRepY.get() + stackY.get());
  const opacity = useTransform(spread, [0, 0.3], [0, 1]);

  const shadow = `0 ${6+card.z*4}px ${20+card.z*10}px rgba(0,0,0,0.09),0 2px 6px rgba(0,0,0,0.05),inset 0 0 0 0.5px rgba(255,255,255,0.85)`;

  return (
    <div style={{ position:"absolute", left:card.pos.left, top:card.pos.top, zIndex:card.z }}>
      {/* plain div — rotation is static, no need for a tracked motion.div */}
      <div style={{ transform:`rotate(${card.rotation}deg)` }}>
        <motion.div style={{ x:totalX, y:totalY, opacity }}>
          <div style={{ animation:`subjectFloat ${card.dur}s ease-in-out ${card.delay}s infinite`, willChange:"transform", animationPlayState: floating ? 'running' : 'paused' }}>
            <div style={{ width:"clamp(160px,18vw,280px)", borderRadius:18, background:"#ffffff", border:"1.5px solid rgba(58,170,106,0.13)", boxShadow:shadow, overflow:"hidden", position:"relative" }}>
              <CardInner card={card} green={false} labels={labels} />
              <AnimatePresence>
                {flipped && (
                  <motion.div
                    key="green"
                    initial={{ opacity:0, scale:0.93 }}
                    animate={{ opacity:1, scale:1 }}
                    exit={{ opacity:0, scale:0.93 }}
                    transition={{ duration:0.36, ease:"easeOut" }}
                    style={{ position:"absolute", inset:0, background:"#3aaa6a", zIndex:4, borderRadius:"inherit", overflow:"hidden" }}
                  >
                    <CardInner card={card} green={true} labels={labels} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
});

// ─── Infinite arc text band ────────────────────────────────────────────────────
// Technique: measure one ARC_UNIT's pixel length via a temp straight-line SVG
// text element, divide by path length → exact loop %. Animate startOffset from
// 0 → -loopPct → reset to 0 (seamless because text repeats).
function ArcTextBand() {
  const svgRef      = useRef<SVGSVGElement>(null);
  const pathRef     = useRef<SVGPathElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const loopPctRef  = useRef(0);
  const offsetRef   = useRef(0);

  useEffect(() => {
    const NS = "http://www.w3.org/2000/svg";

    const setup = () => {
      const svg  = svgRef.current;
      const path = pathRef.current;
      if (!svg || !path) return;

      const rect = svg.getBoundingClientRect();
      const W = rect.width  || 1440;
      const H = rect.height || 96;
      // ∩ arch: sides at y=88, control at y=-16 → peak at y=36 = button center
      // (0.25*88 + 0.5*(-16) + 0.25*88 = 36). More pronounced curve.
      path.setAttribute("d", `M ${-W*0.04},88 Q ${W*0.5},-16 ${W*1.04},88`);

      requestAnimationFrame(() => {
        if (!svg || !path) return;
        const pathLen = path.getTotalLength();
        if (pathLen <= 0) return;
        try {
          const tmp = document.createElementNS(NS, "text") as SVGTextElement;
          tmp.setAttribute("font-size",      "11");
          tmp.setAttribute("font-weight",    "800");
          tmp.setAttribute("letter-spacing", "0.16em");
          tmp.style.cssText = "visibility:hidden;position:absolute;text-transform:uppercase;";
          tmp.textContent   = ARC_UNIT;
          svg.appendChild(tmp);
          const unitLen = tmp.getComputedTextLength();
          svg.removeChild(tmp);
          if (unitLen > 0) loopPctRef.current = (unitLen / pathLen) * 100;
        } catch {
          loopPctRef.current = (ARC_UNIT.length * 7.8 / pathLen) * 100;
        }
      });
    };

    setup();
    const ro = new ResizeObserver(setup);
    if (svgRef.current) ro.observe(svgRef.current);
    return () => ro.disconnect();
  }, []);

  // Frame-rate–independent RTL scroll; resets seamlessly at each loop boundary
  useAnimationFrame((_, delta) => {
    const lp = loopPctRef.current;
    if (!textPathRef.current || lp <= 0) return;
    offsetRef.current -= delta * ARC_SPEED;
    if (offsetRef.current < -lp) offsetRef.current += lp;
    textPathRef.current.setAttribute("startOffset", `${offsetRef.current}%`);
  });

  return (
    <svg
      ref={svgRef}
      aria-hidden
      style={{ position:"absolute", inset:0, width:"100%", height:"100%", overflow:"visible", pointerEvents:"none" }}
    >
      <defs>
        <path ref={pathRef} id="darsy-arc-path" d="M 0,88 Q 720,-16 1440,88" />
      </defs>
      <text
        fontSize="11"
        fontWeight="800"
        letterSpacing="0.16em"
        fill="rgba(58,170,106,0.38)"
        style={{ textTransform:"uppercase" }}
      >
        <textPath ref={textPathRef} href="#darsy-arc-path" startOffset="0%">
          {ARC_UNIT.repeat(ARC_REPS)}
        </textPath>
      </text>
    </svg>
  );
}

// ─── Section ───────────────────────────────────────────────────────────────────
export function SubjectCardsSection() {
  const t = useTranslations("SubjectCards");

  const labels = useMemo<Labels>(() => ({
    eyebrow:  t("subject_eyebrow"),
    lessons:  t("lessons"),
    videos:   t("videos"),
    progress: t("progress"),
  }), [t]);

  const sectionRef    = useRef<HTMLElement>(null);
  const cardsAreaRef  = useRef<HTMLDivElement>(null);
  const mouseX        = useMotionValue(-9999);
  const mouseY        = useMotionValue(-9999);
  const sectionSizeRef = useRef({ w: 1440, h: 560 });

  const sectionPosRef = useRef({ left: 0, top: 0 });

  // Keep sectionSizeRef + sectionPosRef accurate without per-mousemove getBoundingClientRect
  useEffect(() => {
    const el = cardsAreaRef.current;
    if (!el) return;
    const updateRect = () => {
      const r = el.getBoundingClientRect();
      sectionPosRef.current = { left: r.left, top: r.top };
      if (r.width > 0) sectionSizeRef.current = { w: r.width, h: r.height };
    };
    updateRect();
    window.addEventListener("scroll", updateRect, { passive: true });
    const ro = new ResizeObserver(updateRect);
    ro.observe(el);
    return () => {
      window.removeEventListener("scroll", updateRect);
      ro.disconnect();
    };
  }, []);

  // Spring-driven spread — fires as soon as section enters view (no inset margin)
  const spread = useMotionValue(0);
  const [floating, setFloating] = useState(false);
  const hasEnteredRef = useRef(false);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Spread cards out as section enters; pause float animations when off-screen
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasEnteredRef.current) {
          hasEnteredRef.current = true;
          setHasEntered(true);
        }
        setFloating(entry.isIntersecting);
        animate(spread, entry.isIntersecting ? 1 : 0, {
          type: "spring",
          stiffness: 110,
          damping: 24,
          mass: 1,
        });
      },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [spread]);

  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  // Random sequential card flip cycle — only after section enters view
  useEffect(() => {
    if (!hasEntered) return;
    let dead = false;
    const ids  = CARDS.map((c) => c.id);
    const pick = (exc: string | null) => {
      const pool = ids.filter((id) => id !== exc);
      return pool[Math.floor(Math.random() * pool.length)];
    };
    const run = (last: string | null) => {
      const id = pick(last);
      setFlippedId(id);
      setTimeout(() => {
        if (dead) return;
        setFlippedId(null);
        setTimeout(() => { if (!dead) run(id); }, 400);
      }, 1600);
    };
    const t0 = setTimeout(() => { if (!dead) run(null); }, 500);
    return () => { dead = true; clearTimeout(t0); };
  }, [hasEntered]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    mouseX.set(e.clientX - sectionPosRef.current.left);
    mouseY.set(e.clientY - sectionPosRef.current.top);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(-9999);
    mouseY.set(-9999);
  }, [mouseX, mouseY]);

  return (
    <section
      ref={sectionRef}
      style={{ background:"linear-gradient(148deg,#f0faf5 0%,#e8f5ee 38%,#f3fbf7 72%,#edf8f2 100%)", overflow:"hidden", position:"relative" }}
    >
      {/* Grid background */}
      <div aria-hidden style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0, backgroundImage:["repeating-linear-gradient(0deg,rgba(58,170,106,0.04) 0,rgba(58,170,106,0.04) 1px,transparent 0,transparent 44px)","repeating-linear-gradient(90deg,rgba(58,170,106,0.04) 0,rgba(58,170,106,0.04) 1px,transparent 0,transparent 44px)"].join(",") }} />

      {/* Heading */}
      <div style={{ position:"relative", zIndex:2, textAlign:"center", padding: isMobile ? "48px 20px 0" : "72px 24px 0" }}>
        <motion.div
          initial={{ opacity:0, y:-10 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }}
          style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"5px 16px", borderRadius:999, border:"1.5px solid rgba(58,170,106,0.22)", background:"rgba(255,255,255,0.72)", backdropFilter:"blur(10px)", fontSize:10.5, fontWeight:800, color:"rgba(58,170,106,0.85)", letterSpacing:"0.04em", boxShadow:"0 2px 12px rgba(58,170,106,0.10)", marginBottom:20 }}
        >
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#3aaa6a", display:"inline-block", boxShadow:"0 0 0 3px rgba(58,170,106,0.25)" }} />
          {t("badge")}
        </motion.div>

        <motion.h2
          initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6, delay:0.1 }}
          style={{ fontSize:"clamp(26px,4vw,44px)", fontWeight:900, color:"#1a3a2a", letterSpacing:"-0.04em", lineHeight:1.15, margin:"0 0 14px" }}
        >
          {t("title")}
        </motion.h2>

        <motion.p
          initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6, delay:0.18 }}
          style={{ fontSize:"clamp(13px,1.5vw,16px)", color:"rgba(26,58,42,0.55)", maxWidth:520, margin:"0 auto", lineHeight:1.6 }}
        >
          {t("subtitle")}
        </motion.p>
      </div>

      {/* COURSES watermark */}
      <div aria-hidden style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)", fontSize:"clamp(80px,18vw,220px)", fontWeight:900, color:"rgba(58,170,106,0.07)", letterSpacing:"-0.04em", userSelect:"none", pointerEvents:"none", whiteSpace:"nowrap", lineHeight:1, zIndex:0 }}>
        COURSES
      </div>

      {/* Cards */}
      {isMobile ? (
        hasEntered && <div
          style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" as const, marginTop: 24 }}
          className="darsy-scroll-hide"
        >
          <div style={{ display: "flex", gap: 12, padding: "8px 20px 20px", width: "max-content" }}>
            {CARDS.map((card) => (
              <div
                key={card.id}
                style={{
                  width: 220,
                  flexShrink: 0,
                  borderRadius: 18,
                  background: "#ffffff",
                  border: "1.5px solid rgba(58,170,106,0.13)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08), inset 0 0 0 0.5px rgba(255,255,255,0.85)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <CardInner card={card} green={false} labels={labels} />
                <AnimatePresence>
                  {flippedId === card.id && (
                    <motion.div
                      key="green"
                      initial={{ opacity: 0, scale: 0.93 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.93 }}
                      transition={{ duration: 0.36, ease: "easeOut" }}
                      style={{ position: "absolute", inset: 0, background: "#3aaa6a", zIndex: 4, borderRadius: "inherit", overflow: "hidden" }}
                    >
                      <CardInner card={card} green={true} labels={labels} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          ref={cardsAreaRef}
          className="darsy-cards-area"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ position:"relative", height:"clamp(480px,58vh,600px)", zIndex:1, marginTop:24, contain:"layout style" }}
        >
          {hasEntered && CARDS.map((card) => (
            <SubjectCard
              key={card.id}
              card={card}
              mouseX={mouseX}
              mouseY={mouseY}
              sectionSizeRef={sectionSizeRef}
              flipped={flippedId === card.id}
              labels={labels}
              spread={spread}
              floating={floating}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity:0, y:12 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay:0.3 }}
        style={{ position:"relative", zIndex:2, height:96, marginBottom:56 }}
      >
        {/* Pill mask — same bg as section, sits between arc (z:1) and button (z:3).
            Slightly larger than the button so the arc text curves cleanly around it. */}
        <div style={{
          position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
          width:308, height:72, borderRadius:36,
          background:"linear-gradient(148deg,#f0faf5 0%,#e8f5ee 50%,#edf8f2 100%)",
          zIndex:2, pointerEvents:"none",
        }} />

        {/* Button */}
        <div style={{ position:"absolute", top:8, left:0, right:0, display:"flex", justifyContent:"center", zIndex:3 }}>
          <DownloadButton
            href="/explore"
            text={t("cta")}
            icon={<BookOpen size={20} />}
            className="!w-[280px]"
          />
        </div>

        {/* Arc */}
        <ArcTextBand />
      </motion.div>
    </section>
  );
}
