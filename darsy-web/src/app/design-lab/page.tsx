"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useCallback, useEffect } from "react";

// ─── Card data — hardcoded subject showcase ────────────────────────────────────
const CARDS = [
  {
    id: "math",
    label: "Mathématiques",
    sub: "الرياضيات",
    lessons: 124,
    pdfs: 89,
    videos: 34,
    progress: 73,
    texture: "dots",
    rotation: -7,
    z: 2,
    pos: { left: "10%", top: "20%" },
    dur: 4.0,
    delay: 0,
  },
  {
    id: "phys",
    label: "Physique-Chimie",
    sub: "الفيزياء والكيمياء",
    lessons: 98,
    pdfs: 67,
    videos: 28,
    progress: 45,
    texture: "lines",
    rotation: 5,
    z: 4,
    pos: { left: "22%", top: "11%" },
    dur: 3.6,
    delay: 0.5,
  },
  {
    id: "arab",
    label: "Langue Arabe",
    sub: "اللغة العربية",
    lessons: 112,
    pdfs: 78,
    videos: 22,
    progress: 82,
    texture: "cross",
    rotation: -3,
    z: 5,
    pos: { left: "38%", top: "6%" },
    dur: 4.4,
    delay: 1.0,
  },
  {
    id: "hist",
    label: "Histoire-Géo",
    sub: "التاريخ والجغرافيا",
    lessons: 87,
    pdfs: 56,
    videos: 19,
    progress: 38,
    texture: "grid",
    rotation: 7,
    z: 3,
    pos: { left: "53%", top: "8%" },
    dur: 3.8,
    delay: 0.3,
  },
  {
    id: "svt",
    label: "SVT",
    sub: "علوم الحياة والأرض",
    lessons: 94,
    pdfs: 62,
    videos: 25,
    progress: 61,
    texture: "hex",
    rotation: 6,
    z: 5,
    pos: { left: "61%", top: "28%" },
    dur: 4.2,
    delay: 1.5,
  },
  {
    id: "fr",
    label: "Français",
    sub: "اللغة الفرنسية",
    lessons: 103,
    pdfs: 71,
    videos: 31,
    progress: 55,
    texture: "stripe",
    rotation: -5,
    z: 4,
    pos: { left: "28%", top: "53%" },
    dur: 3.5,
    delay: 0.8,
  },
  {
    id: "philo",
    label: "Philosophie",
    sub: "الفلسفة",
    lessons: 68,
    pdfs: 38,
    videos: 16,
    progress: 29,
    texture: "rings",
    rotation: 4,
    z: 3,
    pos: { left: "48%", top: "55%" },
    dur: 4.6,
    delay: 1.9,
  },
] as const;

type Card = (typeof CARDS)[number];

// ─── Texture background patterns ───────────────────────────────────────────────
const TEXTURE: Record<string, { image: string; size: string; position?: string }> = {
  dots: {
    image: "radial-gradient(circle, rgba(58,170,106,0.28) 1.5px, transparent 1.5px)",
    size: "17px 17px",
  },
  lines: {
    image: "repeating-linear-gradient(45deg, rgba(58,170,106,0.13) 0, rgba(58,170,106,0.13) 1.5px, transparent 0, transparent 13px)",
    size: "13px 13px",
  },
  cross: {
    image: [
      "repeating-linear-gradient(45deg, rgba(58,170,106,0.11) 0, rgba(58,170,106,0.11) 1px, transparent 0, transparent 10px)",
      "repeating-linear-gradient(-45deg, rgba(58,170,106,0.11) 0, rgba(58,170,106,0.11) 1px, transparent 0, transparent 10px)",
    ].join(", "),
    size: "10px 10px",
  },
  grid: {
    image: [
      "repeating-linear-gradient(0deg, rgba(58,170,106,0.11) 0, rgba(58,170,106,0.11) 1px, transparent 0, transparent 20px)",
      "repeating-linear-gradient(90deg, rgba(58,170,106,0.11) 0, rgba(58,170,106,0.11) 1px, transparent 0, transparent 20px)",
    ].join(", "),
    size: "20px 20px",
  },
  hex: {
    image: [
      "radial-gradient(circle, rgba(58,170,106,0.24) 1.5px, transparent 1.5px)",
      "radial-gradient(circle, rgba(58,170,106,0.24) 1.5px, transparent 1.5px)",
    ].join(", "),
    size: "22px 38px",
    position: "0 0, 11px 19px",
  },
  stripe: {
    image: "repeating-linear-gradient(-58deg, rgba(58,170,106,0.11) 0, rgba(58,170,106,0.11) 3px, transparent 0, transparent 19px)",
    size: "19px 19px",
  },
  rings: {
    image:
      "radial-gradient(circle at 50% 50%, transparent 0, transparent 14px, rgba(58,170,106,0.16) 15px, rgba(58,170,106,0.16) 16px, transparent 16px, transparent 30px, rgba(58,170,106,0.10) 31px, rgba(58,170,106,0.10) 32px)",
    size: "64px 64px",
  },
};

// ─── Card inner content — white or green color mode ───────────────────────────
function CardInner({ card, green }: { card: Card; green: boolean }) {
  const tex = TEXTURE[card.texture];
  const textPrimary = green ? "#ffffff" : "#1a3a2a";
  const textMuted   = green ? "rgba(255,255,255,0.65)" : "rgba(26,58,42,0.38)";
  const accentText  = green ? "rgba(255,255,255,0.65)" : "rgba(58,170,106,0.6)";

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: tex.image, backgroundSize: tex.size,
          backgroundPosition: tex.position ?? "0 0",
          opacity: green ? 0.12 : 0.42, borderRadius: "inherit",
        }}
      />
      <div
        style={{
          height: 3,
          background: green
            ? "linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.65) 100%)"
            : "linear-gradient(90deg, #3aaa6a 0%, #5dc98a 55%, #97e6be 100%)",
          position: "relative", zIndex: 1,
        }}
      />
      <div style={{ padding: "15px 17px 17px", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 8.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.11em", color: accentText, marginBottom: 5 }}>
          Matière
        </div>
        <div style={{ fontSize: 17, fontWeight: 900, color: textPrimary, letterSpacing: "-0.035em", lineHeight: 1.15 }}>
          {card.label}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: green ? "rgba(255,255,255,0.5)" : "rgba(26,58,42,0.35)", marginTop: 2, marginBottom: 13, direction: "rtl", textAlign: "right", fontFamily: "var(--font-cairo, sans-serif)" }}>
          {card.sub}
        </div>
        <div style={{ height: 1, background: green ? "rgba(255,255,255,0.18)" : "rgba(58,170,106,0.09)", marginBottom: 12 }} />
        <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
          {([
            { val: card.lessons, lbl: "Leçons" },
            { val: card.pdfs,    lbl: "PDFs" },
            { val: card.videos,  lbl: "Vidéos" },
          ] as const).map((s) => (
            <div
              key={s.lbl}
              style={{
                flex: 1, borderRadius: 10, padding: "7px 3px", textAlign: "center",
                background: green ? "rgba(255,255,255,0.15)" : "rgba(58,170,106,0.05)",
                border: `1px solid ${green ? "rgba(255,255,255,0.25)" : "rgba(58,170,106,0.11)"}`,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 900, color: textPrimary, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 7.5, fontWeight: 700, color: textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginTop: 2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 8.5, fontWeight: 700, color: green ? "rgba(255,255,255,0.6)" : "rgba(26,58,42,0.42)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Progression
            </span>
            <span style={{ fontSize: 12, fontWeight: 900, color: green ? "#ffffff" : "#3aaa6a", letterSpacing: "-0.01em" }}>
              {card.progress}%
            </span>
          </div>
          <div style={{ height: 5, background: green ? "rgba(255,255,255,0.2)" : "rgba(58,170,106,0.10)", borderRadius: 999, overflow: "hidden" }}>
            {green ? (
              <div style={{ height: "100%", width: `${card.progress}%`, background: "rgba(255,255,255,0.85)", borderRadius: 999 }} />
            ) : (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${card.progress}%` }}
                transition={{ duration: 1.1, delay: card.delay * 0.35 + 0.65, ease: [0.34, 1.2, 0.64, 1] }}
                style={{ height: "100%", background: "linear-gradient(90deg, #3aaa6a 0%, #5dc98a 100%)", borderRadius: 999 }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Single card component ─────────────────────────────────────────────────────
function SubjectCard({
  card,
  mouse,
  sectionW,
  sectionH,
  flipped,
}: {
  card: Card;
  mouse: { x: number; y: number };
  sectionW: number;
  sectionH: number;
  flipped: boolean;
}) {

  const CARD_W = 280;
  const CARD_H = 195;
  const RADIUS = 270;
  const STRENGTH = 90;

  const leftPct = parseFloat(card.pos.left) / 100;
  const topPct  = parseFloat(card.pos.top)  / 100;
  const cardCX  = leftPct * sectionW + CARD_W / 2;
  const cardCY  = topPct  * sectionH + CARD_H / 2;

  const dx   = mouse.x - cardCX;
  const dy   = mouse.y - cardCY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  let rx = 0, ry = 0;
  if (dist > 0 && dist < RADIUS) {
    const force = Math.pow(1 - dist / RADIUS, 1.8);
    rx = -(dx / dist) * force * STRENGTH;
    ry = -(dy / dist) * force * STRENGTH;
  }

  const shadow = [
    `0 ${6 + card.z * 4}px ${20 + card.z * 10}px rgba(0,0,0,0.09)`,
    `0 2px 6px rgba(0,0,0,0.05)`,
    `inset 0 0 0 0.5px rgba(255,255,255,0.85)`,
  ].join(", ");

  return (
    <div style={{ position: "absolute", left: card.pos.left, top: card.pos.top, zIndex: card.z }}>
      {/* Entrance animation + rotation */}
      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.86 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, delay: card.delay * 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{ rotate: `${card.rotation}deg` }}
      >
        {/* Mouse repulsion layer */}
        <motion.div
          animate={{ x: rx, y: ry }}
          transition={{ type: "spring", stiffness: 180, damping: 22, mass: 0.6 }}
        >
          {/* Float oscillation */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: card.dur, repeat: Infinity, ease: "easeInOut", delay: card.delay }}
          >
            <div
              style={{
                width: "clamp(255px, 20vw, 300px)",
                borderRadius: 18,
                background: "#ffffff",
                border: "1.5px solid rgba(58,170,106,0.13)",
                boxShadow: shadow,
                overflow: "hidden",
                position: "relative",
                willChange: "transform",
              }}
            >
              {/* White base */}
              <CardInner card={card} green={false} />

              {/* Green water-drop overlay — expands from card center */}
              <motion.div
                initial={{ clipPath: "circle(0% at 50% 50%)" }}
                animate={{ clipPath: flipped ? "circle(150% at 50% 50%)" : "circle(0% at 50% 50%)" }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "absolute", inset: 0,
                  background: "#3aaa6a",
                  zIndex: 4,
                  borderRadius: "inherit",
                  overflow: "hidden",
                }}
              >
                <CardInner card={card} green={true} />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function DesignLab() {
  const [mouse, setMouse] = useState({ x: -9999, y: -9999 });
  const [sectionSize, setSectionSize] = useState({ w: 1440, h: 900 });
  const [flippedId, setFlippedId] = useState<string | null>(null);

  // Cycle through cards randomly, one at a time — flip green then back to white
  useEffect(() => {
    let cancelled = false;
    const ids = CARDS.map((c) => c.id);

    const next = (excludeId: string | null) => {
      const pool = ids.filter((id) => id !== excludeId);
      return pool[Math.floor(Math.random() * pool.length)];
    };

    const cycle = (currentId: string | null) => {
      const id = next(currentId);
      setFlippedId(id);
      setTimeout(() => {
        if (cancelled) return;
        setFlippedId(null);
        setTimeout(() => {
          if (cancelled) return;
          cycle(id);
        }, 400); // brief white pause between cards
      }, 1600); // how long a card stays green
    };

    const t = setTimeout(() => { if (!cancelled) cycle(null); }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSectionSize({ w: rect.width, h: rect.height });
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMouse({ x: -9999, y: -9999 });
  }, []);

  return (
    <main style={{ background: "#f2faf5" }}>
      {/* ── Fixed design-lab nav ── */}
      <div
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          borderRadius: 16,
          border: "1px solid rgba(58,170,106,0.18)",
          background: "rgba(255,255,255,0.78)",
          padding: "10px 14px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px rgba(58,170,106,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "rgba(26,58,42,0.4)",
            marginBottom: 2,
          }}
        >
          Design Lab
        </div>
        <a
          href="#cards"
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#3aaa6a",
            textDecoration: "none",
          }}
        >
          Subject Cards
        </a>
        <Link
          href="/"
          style={{
            marginTop: 4,
            fontSize: 9,
            color: "rgba(26,58,42,0.28)",
            textDecoration: "none",
          }}
        >
          ← back to site
        </Link>
      </div>

      {/* ── Cards showcase section ── */}
      <section
        id="cards"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
          background:
            "linear-gradient(148deg, #f0faf5 0%, #e8f5ee 38%, #f3fbf7 72%, #edf8f2 100%)",
        }}
      >
        {/* Background: large grid at very low opacity */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            backgroundImage: [
              "repeating-linear-gradient(0deg, rgba(58,170,106,0.045) 0, rgba(58,170,106,0.045) 1px, transparent 0, transparent 44px)",
              "repeating-linear-gradient(90deg, rgba(58,170,106,0.045) 0, rgba(58,170,106,0.045) 1px, transparent 0, transparent 44px)",
            ].join(", "),
          }}
        />

        {/* Radial glow blobs */}
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}
        >
          <div
            style={{
              position: "absolute",
              width: 700,
              height: 480,
              left: "15%",
              top: "8%",
              background:
                "radial-gradient(ellipse at center, rgba(58,170,106,0.10) 0%, transparent 68%)",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 560,
              height: 380,
              right: "12%",
              bottom: "18%",
              background:
                "radial-gradient(ellipse at center, rgba(58,170,106,0.08) 0%, transparent 68%)",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 320,
              height: 220,
              left: "44%",
              bottom: "12%",
              background:
                "radial-gradient(ellipse at center, rgba(58,170,106,0.06) 0%, transparent 68%)",
              borderRadius: "50%",
            }}
          />
        </div>

        {/* Large faded COURSES watermark behind cards */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "clamp(120px, 22vw, 280px)",
            fontWeight: 900,
            color: "rgba(58,170,106,0.09)",
            letterSpacing: "-0.04em",
            userSelect: "none",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            lineHeight: 1,
            zIndex: 0,
          }}
        >
          COURSES
        </div>

        {/* Section label — top center */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            position: "absolute",
            top: 32,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "5px 16px",
              borderRadius: 999,
              border: "1.5px solid rgba(58,170,106,0.22)",
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(10px)",
              fontSize: 10.5,
              fontWeight: 800,
              color: "rgba(58,170,106,0.85)",
              letterSpacing: "0.04em",
              boxShadow: "0 2px 12px rgba(58,170,106,0.10)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#3aaa6a",
                display: "inline-block",
                boxShadow: "0 0 0 3px rgba(58,170,106,0.25)",
              }}
            />
            Subject Cards — Design Showcase
          </div>
        </motion.div>

        {/* ── Scattered floating cards ── */}
        <div
          style={{ position: "absolute", inset: 0, zIndex: 1 }}
          aria-label="Subject cards showcase"
        >
          {CARDS.map((card) => (
            <SubjectCard
              key={card.id}
              card={card}
              mouse={mouse}
              sectionW={sectionSize.w}
              sectionH={sectionSize.h}
              flipped={flippedId === card.id}
            />
          ))}
        </div>

        {/* Bottom pill legend */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "8px 20px",
            borderRadius: 999,
            border: "1.5px solid rgba(58,170,106,0.16)",
            background: "rgba(255,255,255,0.68)",
            backdropFilter: "blur(12px)",
            boxShadow: "0 4px 20px rgba(58,170,106,0.08)",
            whiteSpace: "nowrap",
          }}
        >
          {[
            { label: "7 Subjects", dot: "#3aaa6a" },
            { label: "686 Leçons", dot: "#5dc98a" },
            { label: "7 Textures", dot: "#97e6be" },
          ].map((item) => (
            <div
              key={item.label}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: item.dot,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(26,58,42,0.55)",
                  letterSpacing: "0.02em",
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
