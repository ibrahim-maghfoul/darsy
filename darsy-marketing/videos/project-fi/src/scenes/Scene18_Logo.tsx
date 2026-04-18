import { interpolate, spring } from "remotion";
import { COLORS, FONT_FAMILY, FONT_SIZE_BODY, FONT_SIZE_HEADER, WIDTH, HEIGHT } from "../constants";

const SCATTER_ELEMENTS = [
  { x: 200, y: 100 }, { x: 1700, y: 200 }, { x: 400, y: 800 },
  { x: 1600, y: 700 }, { x: 100, y: 500 }, { x: 1800, y: 400 },
  { x: 300, y: 300 }, { x: 1500, y: 900 }, { x: 900, y: 100 },
  { x: 1100, y: 950 },
];

export const Scene18_Logo: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  // Phase 1: Convergence (frames 0 – 120)
  const convergeProgress = interpolate(frame, [0, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => t * t * (3 - 2 * t), // smoothstep
  });

  // Phase 2: Logo assembly (frames 120 – 200)
  const logoSpring = spring({ frame: Math.max(0, frame - 120), fps: 60, config: { damping: 8, stiffness: 120, mass: 0.8 } });

  // Phase 3: Wordmarks (frames 200+)
  const wordmarkOpacity = interpolate(frame, [200, 230], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // F-piece (rounded rect) – starts below-left, springs to position
  const fTargetX = cx - 60;
  const fTargetY = cy - 60;
  const fX = interpolate(logoSpring, [0, 1], [fTargetX - 400, fTargetX]);
  const fY = interpolate(logoSpring, [0, 1], [fTargetY + 200, fTargetY]);
  const fScale = logoSpring;

  // I-piece (rect + dot) – starts above-right
  const iTargetX = cx + 20;
  const iTargetY = cy - 40;
  const iX = interpolate(logoSpring, [0, 1], [iTargetX + 400, iTargetX]);
  const iY = interpolate(logoSpring, [0, 1], [iTargetY - 200, iTargetY]);
  const iScale = logoSpring;

  return (
    <div style={{ width: "100%", height: "100%", background: COLORS.BG_WHITE, position: "relative", overflow: "hidden" }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Converging elements */}
        {SCATTER_ELEMENTS.map((el, i) => {
          const elX = el.x + (cx - el.x) * convergeProgress;
          const elY = el.y + (cy - el.y) * convergeProgress;
          const opacity = interpolate(convergeProgress, [0.8, 1], [0.6, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const colors = [COLORS.GOOGLE_BLUE, COLORS.GOOGLE_GREEN, COLORS.GOOGLE_YELLOW, COLORS.GOOGLE_RED];
          return (
            <circle key={i} cx={elX} cy={elY} r={12} fill={colors[i % 4]} opacity={opacity} />
          );
        })}

        {/* "fi" logo – F piece */}
        {frame >= 120 && (
          <g transform={`translate(${fX}, ${fY}) scale(${fScale})`} style={{ transformOrigin: `${fTargetX}px ${fTargetY}px` }}>
            {/* f stems */}
            <rect x={0} y={0} width={30} height={120} rx={8} fill={COLORS.GOOGLE_GREEN} />
            {/* f crossbar */}
            <rect x={0} y={30} width={50} height={18} rx={6} fill={COLORS.GOOGLE_GREEN} />
            {/* f curve top (simplified as filled arc rect) */}
            <rect x={10} y={-12} width={40} height={24} rx={12} fill={COLORS.GOOGLE_GREEN} />
          </g>
        )}

        {/* "fi" logo – I piece */}
        {frame >= 120 && (
          <g transform={`translate(${iX}, ${iY}) scale(${iScale})`} style={{ transformOrigin: `${iTargetX}px ${iTargetY}px` }}>
            {/* i dot */}
            <circle cx={15} cy={-20} r={15} fill={COLORS.GOOGLE_BLUE} />
            {/* i stem */}
            <rect x={0} y={0} width={30} height={80} rx={8} fill={COLORS.GOOGLE_BLUE} />
          </g>
        )}
      </svg>

      {/* Wordmarks */}
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          width: "100%",
          textAlign: "center",
          opacity: wordmarkOpacity,
        }}
      >
        <div style={{ fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_HEADER, color: COLORS.TEXT_DARK_GREY, letterSpacing: "-0.01em" }}>
          Project Fi
        </div>
        <div style={{ fontFamily: FONT_FAMILY, fontSize: FONT_SIZE_BODY, color: COLORS.PATH_LIGHT_GREY, marginTop: 12 }}>
          by Google
        </div>
      </div>
    </div>
  );
};
