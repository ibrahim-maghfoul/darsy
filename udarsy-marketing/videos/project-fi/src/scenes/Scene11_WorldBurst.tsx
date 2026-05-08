import { interpolate, spring } from "remotion";
import { COLORS, WIDTH, HEIGHT } from "../constants";

const COLORS_BURST = [
  "#4285F4", "#34A853", "#FBBC05", "#EA4335",
  "#8AB4F8", "#81C995", "#FDD663", "#F28B82",
  "#A8C7FA", "#CCFF90", "#FFD966", "#FF8BCB",
  "#C58AF9", "#78D9EC", "#FF6D00", "#00BCD4",
  "#9C27B0", "#FF5722", "#009688", "#607D8B",
  "#795548", "#E91E63",
];

export const Scene11_WorldBurst: React.FC<{ frame: number }> = ({ frame }) => {
  return (
    <div style={{ width: "100%", height: "100%", background: COLORS.BG_WHITE, position: "relative", overflow: "hidden" }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0 }}>
        {COLORS_BURST.map((color, i) => {
          const angle = (i / COLORS_BURST.length) * Math.PI * 2;
          const targetR = 280 + (i % 4) * 60;
          const s = spring({ frame, fps: 60, config: { damping: 12, stiffness: 150 }, delay: i * 3 });
          const r = s * targetR;
          const cx = WIDTH / 2 + Math.cos(angle) * r;
          const cy = HEIGHT / 2 + Math.sin(angle) * r;
          const radius = 18 + (i % 3) * 8;
          return <circle key={i} cx={cx} cy={cy} r={radius * s} fill={color} opacity={0.9} />;
        })}
      </svg>
    </div>
  );
};
