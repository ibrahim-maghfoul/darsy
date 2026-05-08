import { interpolate } from "remotion";
import { COLORS, FONT_FAMILY, FONT_SIZE_BODY, WIDTH, HEIGHT } from "../constants";

export const Scene07_GreenMorph: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  // Expanding circle: 0 -> cover full screen
  const maxRadius = Math.sqrt(WIDTH * WIDTH + HEIGHT * HEIGHT);
  const radius = interpolate(frame, [0, duration * 0.4], [0, maxRadius], {
    extrapolateRight: "clamp",
  });

  // Arcs appear after green fills
  const arcOpacity = interpolate(frame, [duration * 0.4, duration * 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Rotation angles (degrees -> applied via transform)
  const arc1Rotation = (frame / 60) * 120; // 120 deg/s
  const arc2Rotation = -(frame / 60) * 90; // -90 deg/s

  // Text fade in
  const textOpacity = interpolate(frame, [duration * 0.5, duration * 0.7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  function arcPath(radius: number, startAngle: number, endAngle: number): string {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(toRad(startAngle));
    const y1 = cy + radius * Math.sin(toRad(startAngle));
    const x2 = cx + radius * Math.cos(toRad(endAngle));
    const y2 = cy + radius * Math.sin(toRad(endAngle));
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  return (
    <div style={{ width: "100%", height: "100%", background: COLORS.BG_WHITE, position: "relative", overflow: "hidden" }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Expanding green circle */}
        <circle cx={cx} cy={cy} r={radius} fill={COLORS.BG_GREEN} />

        {/* Arc 1 – White */}
        <g opacity={arcOpacity} transform={`rotate(${arc1Rotation}, ${cx}, ${cy})`}>
          <path d={arcPath(150, 0, 220)} stroke="white" strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>

        {/* Arc 2 – Yellow */}
        <g opacity={arcOpacity} transform={`rotate(${arc2Rotation}, ${cx}, ${cy})`}>
          <path d={arcPath(300, 90, 270)} stroke={COLORS.GOOGLE_YELLOW} strokeWidth={6} fill="none" strokeLinecap="round" />
        </g>
      </svg>

      {/* Center text */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          width: "100%",
          transform: "translateY(-50%)",
          textAlign: "center",
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_BODY,
          color: "white",
          opacity: textOpacity,
          letterSpacing: "-0.01em",
          zIndex: 10,
        }}
      >
        network that connects across networks.
      </div>
    </div>
  );
};
