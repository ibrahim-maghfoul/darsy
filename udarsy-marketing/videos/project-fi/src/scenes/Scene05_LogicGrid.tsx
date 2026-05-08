import React from "react";
import { interpolate } from "remotion";
import { COLORS, FONT_FAMILY, FONT_SIZE_BODY, WIDTH, HEIGHT } from "../constants";

const COLS = 20;
const ROWS = 10;
const SPACING = 90;
const DOT_R = 4;
const GRID_OFFSET_X = (WIDTH - (COLS - 1) * SPACING) / 2;
const GRID_OFFSET_Y = (HEIGHT - (ROWS - 1) * SPACING) / 2;

// Snake path waypoints (in px)
const SNAKE: [number, number][] = [
  [0, 200],
  [400, 200],
  [400, 600],
  [800, 600],
  [800, 300],
  [1200, 300],
  [1200, 700],
  [1600, 700],
  [1920, 400],
];

function totalLength(path: [number, number][]): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i][0] - path[i - 1][0];
    const dy = path[i][1] - path[i - 1][1];
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

function pointAtT(path: [number, number][], t: number): [number, number] {
  const total = totalLength(path);
  const target = t * total;
  let traveled = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i][0] - path[i - 1][0];
    const dy = path[i][1] - path[i - 1][1];
    const seg = Math.sqrt(dx * dx + dy * dy);
    if (traveled + seg >= target) {
      const frac = (target - traveled) / seg;
      return [path[i - 1][0] + dx * frac, path[i - 1][1] + dy * frac];
    }
    traveled += seg;
  }
  return path[path.length - 1];
}

function buildPathD(path: [number, number][]): string {
  return path.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");
}

export const Scene05_LogicGrid: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  const t = Math.min(1, frame / duration);

  // Current snake head position
  const [headX] = pointAtT(SNAKE, t);

  // Trim path length
  const totalLen = totalLength(SNAKE);
  const drawnLen = t * totalLen;

  const pathD = buildPathD(SNAKE);

  return (
    <div style={{ width: "100%", height: "100%", background: COLORS.BG_WHITE, position: "relative", overflow: "hidden" }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Grid dots */}
        {Array.from({ length: ROWS }).map((_, row) =>
          Array.from({ length: COLS }).map((_, col) => {
            const cx = GRID_OFFSET_X + col * SPACING;
            const cy = GRID_OFFSET_Y + row * SPACING;
            const activated = cx <= headX + 20;
            const pulse = activated
              ? interpolate(frame / 60, [0, 0.1, 0.2], [1, 1.8, 1], { extrapolateRight: "clamp" })
              : 1;
            return (
              <circle
                key={`${row}-${col}`}
                cx={cx}
                cy={cy}
                r={DOT_R * pulse}
                fill={activated ? COLORS.GOOGLE_BLUE : COLORS.PATH_LIGHT_GREY}
              />
            );
          })
        )}

        {/* Snake stroke */}
        <path
          d={pathD}
          stroke={COLORS.GOOGLE_GREEN}
          strokeWidth={4}
          fill="none"
          strokeDasharray={`${drawnLen} ${totalLen}`}
          strokeLinecap="square"
        />
      </svg>

      {/* Label */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          width: "100%",
          textAlign: "center",
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_BODY,
          color: COLORS.TEXT_DARK_GREY,
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        hardware makers.
      </div>
    </div>
  );
};
