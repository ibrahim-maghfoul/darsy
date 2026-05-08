import React from "react";
import { interpolate, Easing } from "remotion";
import { COLORS, FONT_FAMILY, FONT_SIZE_BODY, WIDTH, HEIGHT } from "../constants";

const FPS = 60;

export const Scene02_DNAHelix: React.FC<{ frame: number }> = ({ frame }) => {
  // Local frame relative to this scene start (at 4 sec = 240 frames)
  const localFrame = frame;
  const duration = 8 * FPS; // 8 seconds of helix animation

  // Text slide-out to the left
  const textX = interpolate(localFrame, [0, 20], [0, -400], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  // Dots travel from x=1920 to x=200 over the full duration
  const dotX = interpolate(localFrame, [0, duration], [1920, 200], {
    extrapolateRight: "clamp",
  });

  // Sine wave for Y positions
  const sineT = (localFrame / FPS) * Math.PI * 2 * 0.5; // 0.5 Hz
  const greenY = HEIGHT / 2 + Math.sin(sineT) * 120;
  const yellowY = HEIGHT / 2 + Math.sin(sineT + Math.PI) * 120; // Inverse

  // Trail path points – we store last N positions
  const trailLength = 180; // 3 seconds of trail
  const trailPoints: string[] = [];
  for (let i = Math.max(0, localFrame - trailLength); i <= localFrame; i++) {
    const tx = interpolate(i, [0, duration], [1920, 200], { extrapolateRight: "clamp" });
    const tSine = (i / FPS) * Math.PI * 2 * 0.5;
    const ty = HEIGHT / 2 + Math.sin(tSine) * 120;
    trailPoints.push(`${tx},${ty}`);
  }
  const trailPath = trailPoints.length > 1 ? `M ${trailPoints.join(" L ")}` : "";

  // Yellow trail
  const yellowTrailPoints: string[] = [];
  for (let i = Math.max(0, localFrame - trailLength); i <= localFrame; i++) {
    const tx = interpolate(i, [0, duration], [1920, 200], { extrapolateRight: "clamp" });
    const tSine = (i / FPS) * Math.PI * 2 * 0.5;
    const ty = HEIGHT / 2 + Math.sin(tSine + Math.PI) * 120;
    yellowTrailPoints.push(`${tx},${ty}`);
  }
  const yellowTrailPath = yellowTrailPoints.length > 1 ? `M ${yellowTrailPoints.join(" L ")}` : "";

  // "with leading carriers" text fade-in at local frame 5*60 = 300 (scene 04 ~ 00:09)
  const textFadeIn = interpolate(localFrame, [5 * FPS, 5 * FPS + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ width: "100%", height: "100%", background: COLORS.BG_WHITE, position: "relative", overflow: "hidden" }}>
      {/* Slide-out intro text */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(calc(-50% + ${textX}px), -50%)`,
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_BODY,
          color: COLORS.TEXT_DARK_GREY,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        We set out to build a new way to connect.
      </div>

      {/* SVG canvas for trails and dots */}
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Green trail */}
        {trailPath && (
          <path d={trailPath} stroke={COLORS.TRAIL_GREY} strokeWidth={3} fill="none" strokeLinecap="round" />
        )}
        {/* Yellow trail */}
        {yellowTrailPath && (
          <path d={yellowTrailPath} stroke={COLORS.TRAIL_GREY} strokeWidth={3} fill="none" strokeLinecap="round" />
        )}
        {/* Green dot */}
        <circle cx={dotX} cy={greenY} r={21} fill={COLORS.GOOGLE_GREEN} />
        {/* Yellow dot */}
        <circle cx={dotX} cy={yellowY} r={21} fill={COLORS.GOOGLE_YELLOW} />
      </svg>

      {/* "with leading carriers." text */}
      <div
        style={{
          position: "absolute",
          bottom: "30%",
          width: "100%",
          textAlign: "center",
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_BODY,
          color: COLORS.TEXT_DARK_GREY,
          opacity: textFadeIn,
          letterSpacing: "-0.01em",
        }}
      >
        with leading carriers.
      </div>
    </div>
  );
};
