import { interpolate } from "remotion";
import { COLORS, FONT_FAMILY, WIDTH, HEIGHT } from "../constants";

export const Scene09_Devices: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  const appear = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  // Dash animation offset (250px/sec)
  const dashOffset = -(frame / 60) * 250;

  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  return (
    <div style={{ width: "100%", height: "100%", background: COLORS.BG_WHITE, position: "relative", overflow: "hidden" }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* ── Laptop (center) ── */}
        <g opacity={appear} transform={`translate(${cx - 120}, ${cy - 90})`}>
          {/* Screen */}
          <rect x={0} y={0} width={240} height={140} rx={8} ry={8} stroke={COLORS.TEXT_DARK_GREY} strokeWidth={2} fill="none" />
          {/* Base */}
          <rect x={-20} y={140} width={280} height={10} rx={4} stroke={COLORS.TEXT_DARK_GREY} strokeWidth={2} fill="none" />
        </g>

        {/* ── Phone (right, 15° tilt) ── */}
        <g opacity={appear} transform={`translate(${cx + 220}, ${cy - 55}) rotate(15, 30, 55)`}>
          <rect x={0} y={0} width={60} height={110} rx={10} ry={10} stroke={COLORS.TEXT_DARK_GREY} strokeWidth={2} fill="none" />
          <rect x={20} y={100} width={20} height={4} rx={2} fill={COLORS.PATH_LIGHT_GREY} />
        </g>

        {/* ── Tablet (left) ── */}
        <g opacity={appear} transform={`translate(${cx - 380}, ${cy - 75})`}>
          <rect x={0} y={0} width={160} height={120} rx={10} ry={10} stroke={COLORS.TEXT_DARK_GREY} strokeWidth={2} fill="none" />
          <circle cx={80} cy={112} r={5} stroke={COLORS.TEXT_DARK_GREY} strokeWidth={1.5} fill="none" />
        </g>

        {/* ── Connection dashed line through all 3 devices ── */}
        <line
          x1={cx - 400}
          y1={cy}
          x2={cx + 420}
          y2={cy}
          stroke={COLORS.GOOGLE_BLUE}
          strokeWidth={3}
          strokeDasharray="8 12"
          strokeDashoffset={dashOffset}
          opacity={appear}
        />
      </svg>
    </div>
  );
};
