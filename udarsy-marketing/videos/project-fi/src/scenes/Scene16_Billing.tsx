import { COLORS, FONT_FAMILY, FONT_SIZE_BODY, WIDTH, HEIGHT } from "../constants";

export const Scene16_Billing: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / 60;
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const orbitR = 110;
  const dotX = cx + Math.cos(t * Math.PI * 2 * 0.7) * orbitR;
  const dotY = cy + Math.sin(t * Math.PI * 2 * 0.7) * orbitR;

  return (
    <div style={{ width: "100%", height: "100%", background: COLORS.BG_DARK_GREEN, position: "relative", overflow: "hidden" }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Orbit ring */}
        <circle cx={cx} cy={cy} r={orbitR} stroke="white" strokeWidth={2} fill="none" opacity={0.3} />
        {/* Center circle */}
        <circle cx={cx} cy={cy} r={30} stroke="white" strokeWidth={3} fill="none" />
        {/* Orbiting dot */}
        <circle cx={dotX} cy={dotY} r={14} fill="white" />
      </svg>
      <div
        style={{
          position: "absolute",
          bottom: "30%",
          width: "100%",
          textAlign: "center",
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_BODY,
          color: "white",
          letterSpacing: "-0.01em",
        }}
      >
        prices that make sense.
      </div>
    </div>
  );
};
