"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Card definitions ─────────────────────────────────────────────────────────
const INNER_CARDS = [
  {
    id: "cardA", texture: "t-grid", flip: "v",
    gridColumn: "2 / 4", gridRow: "2",
    transformOrigin: "bottom right",
    front: { icon: "fa-solid fa-chart-line", title: "Analytics" },
    back:  { icon: "fa-solid fa-medal",       title: "Your Progress", desc: "Track your wins." },
  },
  {
    id: "cardB", texture: "t-dots", flip: "v",
    gridColumn: "4", gridRow: "2 / 4",
    transformOrigin: "bottom left",
    front: { icon: "fa-solid fa-envelope",    title: "Messages" },
    back:  { icon: "fa-solid fa-paper-plane", title: "Inbox",    desc: "Contact mentors." },
  },
  {
    id: "cardE", texture: "t-cross-hatch", flip: "v", isCenter: true,
    gridColumn: "3", gridRow: "3",
    transformOrigin: "center",
    front: { icon: "fa-solid fa-plus",    title: "Explore" },
    back:  { icon: "fa-solid fa-compass", title: "Features", desc: "Click to expand." },
  },
  {
    id: "cardD", texture: "t-diagonal", flip: "h",
    gridColumn: "2", gridRow: "3 / 5",
    transformOrigin: "top right",
    front: { icon: "fa-solid fa-headset", title: "Support" },
    back:  { icon: "fa-solid fa-clock",   title: "24/7 Help", desc: "We are here." },
  },
  {
    id: "cardC", texture: "t-waves", flip: "h",
    gridColumn: "3 / 5", gridRow: "4",
    transformOrigin: "top left",
    front: { icon: "fa-solid fa-book",           title: "Courses" },
    back:  { icon: "fa-solid fa-graduation-cap", title: "Library", desc: "Full access." },
  },
];

const OUTER_CARDS = [
  {
    id: "cardTOP", texture: "t-rings", flip: "v",
    gridColumn: "1 / 5", gridRow: "1",
    front: { icon: "fa-solid fa-star", title: "Premium Content" },
    back:  { icon: "fa-solid fa-gem",  title: "Unlock More", desc: "Exclusive resources." },
  },
  {
    id: "cardRIGHT", texture: "t-zigzag", flip: "h",
    gridColumn: "5", gridRow: "1 / 5",
    front: { icon: "fa-solid fa-video",           title: "Live Sessions" },
    back:  { icon: "fa-solid fa-tower-broadcast", title: "Join Live",  desc: "Interact in real-time." },
  },
  {
    id: "cardBOT", texture: "t-hexagons", flip: "v",
    gridColumn: "2 / 6", gridRow: "5",
    front: { icon: "fa-solid fa-download",         title: "Offline Mode" },
    back:  { icon: "fa-solid fa-cloud-arrow-down", title: "Save Data",   desc: "Learn without internet." },
  },
  {
    id: "cardLEFT", texture: "t-dash", flip: "h",
    gridColumn: "1", gridRow: "2 / 6",
    front: { icon: "fa-solid fa-user-group", title: "Community" },
    back:  { icon: "fa-solid fa-comments",   title: "Discussion", desc: "Talk with peers." },
  },
];

const TEXTURE_STYLES = {
  "t-grid": {
    backgroundImage:
      "linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)",
    backgroundSize: "15px 15px",
  },
  "t-dots": {
    backgroundImage: "radial-gradient(circle,white 1.5px,transparent 1.5px)",
    backgroundSize: "10px 10px",
  },
  "t-rings": {
    backgroundImage:
      "radial-gradient(circle,transparent 7px,white 7px,white 8px,transparent 8px)",
    backgroundSize: "20px 20px",
  },
  "t-dash": {
    backgroundImage:
      "repeating-linear-gradient(0deg,transparent,transparent 5px,white 5px,white 6px)",
  },
  "t-diagonal": {
    backgroundImage:
      "repeating-linear-gradient(45deg,white,white 1px,transparent 1px,transparent 10px)",
  },
  "t-cross-hatch": {
    backgroundImage:
      "repeating-linear-gradient(45deg,white,white 1px,transparent 1px,transparent 8px)," +
      "repeating-linear-gradient(-45deg,white,white 1px,transparent 1px,transparent 8px)",
  },
  "t-zigzag": {
    backgroundImage:
      "linear-gradient(135deg,white 25%,transparent 25%) -10px 0," +
      "linear-gradient(225deg,white 25%,transparent 25%) -10px 0," +
      "linear-gradient(315deg,white 25%,transparent 25%)," +
      "linear-gradient(45deg,white 25%,transparent 25%)",
    backgroundSize: "20px 20px",
  },
  "t-waves": {
    backgroundImage:
      "repeating-radial-gradient(circle at 0 50%,transparent 0,transparent 6px,white 7px,transparent 8px)",
    backgroundSize: "16px 16px",
  },
  "t-hexagons": {
    backgroundImage:
      "radial-gradient(circle farthest-side at 0% 50%,transparent 23%,white 24%,white 26%,transparent 27%,transparent 49%)," +
      "radial-gradient(circle farthest-side at 0% 50%,transparent 23%,white 24%,white 26%,transparent 27%)," +
      "radial-gradient(circle farthest-side at 100% 50%,transparent 23%,white 24%,white 26%,transparent 27%,transparent 49%)," +
      "radial-gradient(circle farthest-side at 100% 50%,transparent 23%,white 24%,white 26%,transparent 27%)",
    backgroundSize: "18px 10px",
  },
};

// ─── Circular countdown ring ──────────────────────────────────────────────────
function RingCountdown({ total, current }) {
  const r    = 34;
  const circ = 2 * Math.PI * r;
  const dash = circ * (current / total);
  return (
    <svg
      width="88" height="88"
      style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        margin: "auto",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="4" />
      <circle
        cx="44" cy="44" r={r}
        fill="none"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 44 44)"
        style={{ transition: "stroke-dasharray 0.85s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

// ─── Center card (countdown → "Enjoy!") ──────────────────────────────────────
function CenterCard({ card, isExpanded, onClick, onMouseEnter, onMouseLeave }) {
  const TOTAL = 5;
  const [count, setCount]         = useState(TOTAL);
  const [phase, setPhase]         = useState("counting"); // "counting" | "enjoy" | "collapsed"
  const hasExpandedOnce           = useRef(false);

  useEffect(() => {
    if (isExpanded) {
      hasExpandedOnce.current = true;
      setPhase("enjoy");
      return;
    }

    // First time (never expanded yet): run the countdown
    if (!hasExpandedOnce.current) {
      setCount(TOTAL);
      setPhase("counting");
      const interval = setInterval(() => {
        setCount((c) => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }

    // Subsequent collapses: just show "uncollapse" prompt
    setPhase("collapsed");
  }, [isExpanded]);

  return (
    <div
      style={{
        gridColumn: card.gridColumn,
        gridRow:    card.gridRow,
        position:   "relative",
        cursor:     "pointer",
        zIndex:     10,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <style>{`
        @keyframes centerPop {
          0%   { opacity: 0; transform: scale(0.4); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes enjoyPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(0,100,50,0.18); }
          50%       { box-shadow: 0 4px 32px rgba(0,158,96,0.45); }
        }
      `}</style>

      {/* scale wrapper */}
      <div style={{
        width:           "100%",
        height:          "100%",
        transform:       isExpanded ? "scale(1)" : "scale(0.8)",
        transformOrigin: card.transformOrigin || "center",
        transition:      "transform 0.7s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{
          position:       "absolute",
          inset:          0,
          borderRadius:   14,
          overflow:       "hidden",
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          textAlign:      "center",
          padding:        12,
          background:     "#009E60",
          animation:      phase === "enjoy" ? "enjoyPulse 2s ease-in-out infinite" : "none",
          boxShadow:      "0 4px 20px rgba(0,100,50,0.18)",
        }}>
          {/* texture overlay */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.15, zIndex: 0, ...TEXTURE_STYLES[card.texture] }} />

          {phase === "collapsed" ? (
            <>
              <i
                className="fa-solid fa-plus"
                style={{
                  position:     "relative",
                  zIndex:       1,
                  fontSize:     22,
                  color:        "#fff",
                  marginBottom: 6,
                  animation:    "centerPop 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              />
              <span style={{
                position:   "relative",
                zIndex:     1,
                fontWeight: 900,
                fontSize:   11,
                color:      "#fff",
                animation:  "centerPop 0.4s 0.06s both cubic-bezier(0.34,1.56,0.64,1)",
              }}>
                Expand
              </span>
              <span style={{
                position:   "relative",
                zIndex:     1,
                fontSize:   8,
                color:      "rgba(255,255,255,0.65)",
                marginTop:  4,
                animation:  "centerPop 0.4s 0.12s both cubic-bezier(0.34,1.56,0.64,1)",
              }}>
                tap to uncollapse
              </span>
            </>
          ) : phase === "counting" ? (
            <>
              <RingCountdown total={TOTAL} current={count} />
              {/* big number */}
              <span
                key={count}
                style={{
                  position:   "relative",
                  zIndex:     1,
                  fontSize:   34,
                  fontWeight: 900,
                  color:      "#fff",
                  lineHeight: 1,
                  animation:  "centerPop 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                {count}
              </span>

            </>
          ) : phase === "enjoy" ? (
            <>
              <i
                className="fa-solid fa-face-smile-beam"
                style={{
                  position:     "relative",
                  zIndex:       1,
                  fontSize:     26,
                  color:        "#fff",
                  marginBottom: 6,
                  animation:    "centerPop 0.45s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              />
              <span style={{
                position:  "relative",
                zIndex:    1,
                fontWeight: 900,
                fontSize:  15,
                color:     "#fff",
                animation: "centerPop 0.45s 0.06s both cubic-bezier(0.34,1.56,0.64,1)",
              }}>
                Enjoy!
              </span>
              <span style={{
                position:  "relative",
                zIndex:    1,
                fontSize:  8,
                color:     "rgba(255,255,255,0.68)",
                marginTop: 5,
                animation: "centerPop 0.45s 0.12s both cubic-bezier(0.34,1.56,0.64,1)",
              }}>
                tap to collapse
              </span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Direction each outer card slides in from
const OUTER_SLIDE = {
  cardTOP:   { hidden: "translateY(-110%)", visible: "translateY(0)" },
  cardRIGHT: { hidden: "translateX(110%)",  visible: "translateX(0)" },
  cardBOT:   { hidden: "translateY(110%)",  visible: "translateY(0)" },
  cardLEFT:  { hidden: "translateX(-110%)", visible: "translateX(0)" },
};

// ─── Generic card ─────────────────────────────────────────────────────────────
function Card({ card, isFlipped, isRevealed, isExpanded, onClick, onMouseEnter, onMouseLeave }) {
  const isOuter = OUTER_CARDS.some((c) => c.id === card.id);
  const slide   = OUTER_SLIDE[card.id];

  const frontStyle = isFlipped
    ? card.flip === "v"
      ? { opacity: 0, transform: "translateY(50%) rotateX(90deg)" }
      : { opacity: 0, transform: "translateX(50%) rotateY(90deg)" }
    : {};

  const backRest = card.flip === "v"
    ? { transform: "translateY(-50%) rotateX(90deg)", opacity: 0 }
    : { transform: "translateX(-50%) rotateY(-90deg)", opacity: 0 };

  const backActive = isFlipped
    ? { transform: "translateY(0) rotateX(0) translateX(0) rotateY(0)", opacity: 1 }
    : {};

  const wrapperStyle = isOuter
    ? {
        gridColumn:    card.gridColumn,
        gridRow:       card.gridRow,
        opacity:       isRevealed ? 1 : 0,
        transform:     isRevealed ? slide.visible : slide.hidden,
        pointerEvents: isRevealed ? "all" : "none",
        transition:    "transform 0.55s cubic-bezier(0.34,1.3,0.64,1), opacity 0.45s ease",
        position:      "relative",
        cursor:        "pointer",
      }
    : {
        gridColumn: card.gridColumn,
        gridRow:    card.gridRow,
        position:   "relative",
        cursor:     "pointer",
      };

  const innerScaleStyle = !isOuter
    ? {
        width:           "100%",
        height:          "100%",
        transform:       isExpanded ? "scale(1)" : "scale(0.8)",
        transformOrigin: card.transformOrigin || "center",
        transition:      "transform 0.7s cubic-bezier(0.4,0,0.2,1)",
      }
    : { width: "100%", height: "100%" };

  const faceBase = {
    position:       "absolute",
    inset:          0,
    borderRadius:   14,
    backfaceVisibility: "hidden",
    transition:     "0.6s cubic-bezier(0.645,0.045,0.355,1)",
    overflow:       "hidden",
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
    textAlign:      "center",
    padding:        12,
  };

  // Content slide directions:
  // flip="v" → front content exits downward, back content enters from top (opposite)
  // flip="h" → front content exits rightward, back content enters from left (opposite)
  const contentTransition = "transform 0.5s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease";

  const frontContentStyle = isFlipped
    ? card.flip === "v"
      ? { transform: "translateY(40%)", opacity: 0, transition: contentTransition }
      : { transform: "translateX(40%)", opacity: 0, transition: contentTransition }
    : { transform: "translateY(0) translateX(0)", opacity: 1, transition: contentTransition };

  // Back content: rests off-screen on the opposite side, slides to center when flipped
  const backContentStyle = isFlipped
    ? { transform: "translateY(0) translateX(0)", opacity: 1, transition: contentTransition }
    : card.flip === "v"
      ? { transform: "translateY(-40%)", opacity: 0, transition: contentTransition }
      : { transform: "translateX(-40%)", opacity: 0, transition: contentTransition };

  return (
    <div style={wrapperStyle} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div style={innerScaleStyle}>
        {/* FRONT */}
        <div style={{
          ...faceBase,
          background: "#ffffff",
          border:     "1.5px solid rgba(0,158,96,0.15)",
          boxShadow:  "0 2px 14px rgba(0,80,40,0.06)",
          zIndex:     2,
          ...frontStyle,
        }}>
          <div style={{ ...frontContentStyle, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <i className={card.front.icon} style={{ fontSize: 24, color: "#009E60", marginBottom: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 10, color: "#003d25" }}>{card.front.title}</span>
          </div>
        </div>

        {/* BACK */}
        <div style={{
          ...faceBase,
          background: "#009E60",
          zIndex:     1,
          ...backRest,
          ...backActive,
        }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.2, zIndex: 0, ...TEXTURE_STYLES[card.texture] }} />
          <div style={{ ...backContentStyle, position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <i className={card.back.icon} style={{ fontSize: 20, color: "#fff" }} />
            <span style={{ fontWeight: 700, fontSize: 10, color: "#fff", marginTop: 5 }}>
              {card.back.title}
            </span>
            {card.back.desc && (
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.9)" }}>
                {card.back.desc}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PlatformFeatures() {
  const [expanded, setExpanded] = useState(false);
  const [flipped,  setFlipped]  = useState({});
  const [revealed, setRevealed] = useState({});

  const timerRef     = useRef(null);
  const revealedRef  = useRef({});
  const autoFlipRef  = useRef({});
  const historyRef   = useRef([]);
  const hoveredRef   = useRef(null);   // id of card currently hovered
  const HISTORY_SIZE = 5;

  useEffect(() => { revealedRef.current = revealed; }, [revealed]);

  const revealOuter = useCallback(() => {
    setExpanded(true);
    OUTER_CARDS.forEach((c, i) => {
      setTimeout(() => {
        setRevealed((p) => {
          const next = { ...p, [c.id]: true };
          revealedRef.current = next;
          return next;
        });
      }, i * 150);
    });
  }, []);

  const collapseAll = useCallback(() => {
    setExpanded(false);
    setFlipped({});
    setRevealed({});
    revealedRef.current = {};
    autoFlipRef.current = {};
    historyRef.current  = [];
  }, []);

  const handleCardClick = useCallback(
    (card) => {
      if (card.isCenter) {
        if (!expanded) revealOuter();
        else collapseAll();
        return;
      }
      setFlipped((p) => ({ ...p, [card.id]: !p[card.id] }));
    },
    [expanded, revealOuter, collapseAll]
  );

  // Auto-expand after 5 s
  useEffect(() => {
    const t = setTimeout(revealOuter, 5000);
    return () => clearTimeout(t);
  }, [revealOuter]);

  // Auto-flip loop — starts once, never restarts
  useEffect(() => {
    function pickCards(pool, count) {
      const history  = historyRef.current;
      const eligible = pool.filter((c) => !history.includes(c.id));
      const source   = eligible.length >= count ? eligible : pool;
      return [...source].sort(() => Math.random() - 0.5).slice(0, count);
    }

    function autoFlip() {
      const revealedNow  = revealedRef.current;
      const autoFlipping = autoFlipRef.current;

      const pool = [...INNER_CARDS, ...OUTER_CARDS].filter((c) => {
        if (c.isCenter) return false;
        const isOuter   = OUTER_CARDS.some((o) => o.id === c.id);
        const isVisible = isOuter ? !!revealedNow[c.id] : true;
        return isVisible && !autoFlipping[c.id] && hoveredRef.current !== c.id;
      });

      if (pool.length > 0) {
        const maxBatch  = Math.min(pool.length, 3);
        const batchSize = Math.floor(Math.random() * maxBatch) + 1;
        const picks     = pickCards(pool, batchSize);

        picks.forEach((pick, idx) => {
          historyRef.current = [
            ...historyRef.current.slice(-(HISTORY_SIZE - 1)),
            pick.id,
          ];
          setTimeout(() => {
            autoFlipRef.current = { ...autoFlipRef.current, [pick.id]: true };
            setFlipped((p) => ({ ...p, [pick.id]: true }));
            setTimeout(() => {
              autoFlipRef.current = { ...autoFlipRef.current, [pick.id]: false };
              setFlipped((p) => ({ ...p, [pick.id]: false }));
            }, 3000);
          }, idx * 120);
        });
      }

      timerRef.current = setTimeout(autoFlip, Math.floor(Math.random() * 1000) + 2000);
    }

    timerRef.current = setTimeout(autoFlip, 2000);
    return () => clearTimeout(timerRef.current);
  }, []);

  const centerCard  = INNER_CARDS.find((c) => c.isCenter);
  const otherCards  = [...OUTER_CARDS, ...INNER_CARDS.filter((c) => !c.isCenter)];

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet" />

      <div style={{
        minHeight:       "100vh",
        display:         "flex",
        justifyContent:  "center",
        alignItems:      "center",
        background:      "#f4fcf7",
        fontFamily:      "'Cairo', sans-serif",
        overflow:        "hidden",
      }}>
        <div style={{
          display:              "grid",
          gridTemplateColumns:  "repeat(5, 120px)",
          gridTemplateRows:     "repeat(5, 120px)",
          gap:                  10,
          position:             "relative",
        }}>
          {/* All non-center cards */}
          {otherCards.map((card) => (
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

          {/* Center card — always rendered as CenterCard */}
          <CenterCard
            card={centerCard}
            isExpanded={expanded}
            onClick={() => handleCardClick(centerCard)}
            onMouseEnter={() => { hoveredRef.current = centerCard.id; }}
            onMouseLeave={() => { hoveredRef.current = null; }}
          />
        </div>
      </div>
    </>
  );
}
