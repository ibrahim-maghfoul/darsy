"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { DownloadButton } from "@/components/DownloadButton";
import { MessageCircle, Users } from "lucide-react";
import Image from "next/image";

const GlobeSphere = dynamic(
  () => import("@/components/design-lab/GlobeSphere").then(m => m.GlobeSphere),
  { ssr: false, loading: () => null }
);

type Msg = { id: number; name: string; img: string; text: string; time: string };

// ─── ChatWindow ───────────────────────────────────────────────────────────────
function ChatWindow({ msgs, roomTitle, roomStatus, showCta, active }: {
  msgs: Msg[]; roomTitle: string; roomStatus: string;
  showCta?: boolean; active: boolean;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const t = useTranslations("Hero");

  const [visible, setVisible] = useState<Set<number>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Messages appear one by one after section enters view
  useEffect(() => {
    if (!active) return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    msgs.forEach((msg, i) => {
      timers.push(setTimeout(() => {
        setVisible(prev => new Set([...prev, msg.id]));
      }, 400 + i * 700));
    });

    return () => timers.forEach(clearTimeout);
  }, [active, msgs]);


  return (
    <div className="w-full max-w-[420px] mx-auto" style={{ fontFamily: "var(--font-cairo),sans-serif" }}>
        {/* Window chrome */}
        <div style={{
          background: "#ffffff",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(1,8,4,0.60), 0 2px 12px rgba(58,170,106,0.10)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}>

          {/* Title bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px",
            background: "linear-gradient(to bottom, #f8fdfb, #f2faf5)",
            borderBottom: "1px solid rgba(58,170,106,0.10)",
          }}>
            {/* macOS traffic lights */}
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" }} />
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ffbd2e" }} />
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840" }} />
            </div>

            {/* Room info centered */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 9,
                background: "rgba(58,170,106,0.10)", border: "1px solid rgba(58,170,106,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#3aaa6a",
              }}>
                <Users size={14} strokeWidth={2.2} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1a3a2a", lineHeight: 1.2 }}>
                  {roomTitle}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3aaa6a",
                    boxShadow: "0 0 4px rgba(58,170,106,0.6)", display: "inline-block" }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(58,170,106,0.70)",
                    letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {roomStatus}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ width: 29 }} /> {/* balance spacer */}
          </div>

          {/* Messages list */}
          <div
            ref={scrollRef}
            style={{
              padding: "14px 16px 10px",
              display: "flex", flexDirection: "column", gap: 14,
              minHeight: 220, maxHeight: 260,
              overflowY: "hidden",
              background: "#ffffff",
            }}
          >
            {msgs.map(msg => {
              const shown = visible.has(msg.id);
              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    opacity: shown ? 1 : 0,
                    animation: shown ? "msg-in 0.42s cubic-bezier(0.2,1,0.3,1) forwards" : "none",
                  }}
                >
                  <Image
                    src={msg.img} alt={msg.name}
                    width={32} height={32}
                    style={{ borderRadius: 10, objectFit: "cover", flexShrink: 0,
                      border: "1.5px solid rgba(58,170,106,0.15)" }}
                    unoptimized
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: "#1a3a2a" }}>{msg.name}</span>
                      <span style={{ fontSize: 9.5, color: "rgba(26,58,42,0.35)", fontWeight: 500 }}>{msg.time}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: "rgba(26,58,42,0.72)", fontWeight: 500,
                      lineHeight: 1.52, wordBreak: "break-word" }}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input bar */}
          <div style={{
            padding: "10px 14px 14px",
            borderTop: "1px solid rgba(58,170,106,0.08)",
            background: "#fafcfb",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(58,170,106,0.04)", border: "1px solid rgba(58,170,106,0.14)",
              borderRadius: 12, padding: "8px 12px",
            }}>
              <span style={{ flex: 1, fontSize: 12, color: "rgba(26,58,42,0.30)", fontWeight: 500,
                fontStyle: "italic" }}>
                {t("chat_input_placeholder") || "Reply to the room…"}
              </span>
              <div style={{
                width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                background: "rgba(58,170,106,0.12)", color: "#3aaa6a",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        {showCta !== undefined && (
          <div style={{ marginTop: 20, display: "flex", justifyContent: "center",
            opacity: showCta ? 1 : 0, transition: "opacity 0.55s ease",
            pointerEvents: showCta ? "auto" : "none" }}>
            <DownloadButton
              id="chat-cta" href="#"
              text={t("cta_btn_title") || "Join the discussion"}
              icon={<MessageCircle size={20} />}
              onClick={e => { e.preventDefault(); router.push(isAuthenticated ? "/profile/chat" : "/login"); }}
            />
          </div>
        )}
      </div>
  );
}

// ─── Main section ──────────────────────────────────────────────────────────────
export const ChatFeatureSection = () => {
  const t = useTranslations("Hero");

  const sectionRef  = useRef<HTMLDivElement>(null);
  const [active,    setActive]   = useState(false);
  const [showGlobe, setGlobe]    = useState(false);
  const [showCta,   setShowCta]  = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setActive(true);
    }, { threshold: 0.08 });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    const t1 = setTimeout(() => setGlobe(true),  200);
    const t2 = setTimeout(() => setShowCta(true), 3600); // after all msgs revealed
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [active]);

  const roomTitle  = t("room_title");
  const roomStatus = t("room_status");

  // All messages in one flat array (base + live), shown sequentially
  const msgs = useMemo<Msg[]>(() => [
    { id: 1,   name: t("msg1_name"),   img: "https://i.pravatar.cc/150?u=sara",    text: t("msg1_text"),   time: "17:20" },
    { id: 2,   name: t("msg2_name"),   img: "https://i.pravatar.cc/150?u=ahmed",   text: t("msg2_text"),   time: "17:21" },
    { id: 3,   name: t("msg3_name"),   img: "https://i.pravatar.cc/150?u=karim",   text: t("msg3_text"),   time: "17:21" },
    { id: 4,   name: t("msg4_name"),   img: "https://i.pravatar.cc/150?u=yassine", text: t("msg4_text"),   time: "17:22" },
    { id: 101, name: t("msg101_name"), img: "https://i.pravatar.cc/150?u=ines",    text: t("msg101_text"), time: "17:23" },
    { id: 102, name: t("msg102_name"), img: "https://i.pravatar.cc/150?u=sami",    text: t("msg102_text"), time: "17:24" },
  ], [t]);

  return (
    <div
      ref={sectionRef}
      dir="ltr"
      className="relative w-full overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 20%,#0d2018 0%,#060c08 55%,#020604 100%)" }}
    >
      {/* Globe — desktop, always rendered once section mounts; fades in over 1.4s */}
      <div
        className="hidden md:block absolute inset-0 pointer-events-none z-0"
        style={{ opacity: showGlobe ? 1 : 0, transition: 'opacity 1.4s ease' }}
        aria-hidden="true"
      >
        {showGlobe && <GlobeSphere bottomMask />}
      </div>

      {/* Top blend */}
      <div className="absolute inset-x-0 top-0 h-16 pointer-events-none z-[1]"
        style={{ background: "linear-gradient(to bottom,#060c08,transparent)" }} />

      <div className="relative z-[2] flex flex-col items-center py-20 md:py-28 gap-10 md:gap-14 min-h-[84vh] justify-center">

        {/* Header */}
        <div className="text-center px-4 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold mb-4"
            style={{ border: "1px solid rgba(125,211,168,0.28)", background: "rgba(58,170,106,0.09)",
              color: "rgba(210,245,225,0.82)", letterSpacing: "0.05em" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#7dd3a8" }} />
            {t("chat_a_title")}
          </div>
          <h2 className="text-[clamp(24px,4vw,46px)] font-bold leading-tight mb-3"
            style={{ color: "#fff", letterSpacing: "-0.02em" }}>
            {t("chat_b_title")}
          </h2>
          <p className="text-sm md:text-base leading-relaxed"
            style={{ color: "rgba(210,245,225,0.50)" }}>
            {t("chat_b_subtitle")}
          </p>
        </div>

        {/* Chat window */}
        <div className="w-full px-4">
          <ChatWindow
            msgs={msgs} roomTitle={roomTitle} roomStatus={roomStatus}
            showCta={showCta} active={active}
          />
        </div>

      </div>
    </div>
  );
};
