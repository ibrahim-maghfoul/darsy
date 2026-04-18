import { interpolate } from "remotion";
import { COLORS, WIDTH, HEIGHT } from "../constants";

export const Scene14_Train: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  // Dashed line moves right to left
  const lineOffset = interpolate(frame, [0, duration], [0, -WIDTH], {
    extrapolateRight: "clamp",
  });

  // Block slides along the line
  const blockX = interpolate(frame, [0, duration], [WIDTH + 100, -100], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ width: "100%", height: "100%", background: COLORS.BG_WHITE, position: "relative", overflow: "hidden" }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Moving dashed track line */}
        <line
          x1={-WIDTH}
          y1={HEIGHT / 2}
          x2={WIDTH * 2}
          y2={HEIGHT / 2}
          stroke={COLORS.TRAIL_GREY}
          strokeWidth={3}
          strokeDasharray="20 10"
          strokeDashoffset={lineOffset}
        />

        {/* Blue block (train car) */}
        <rect
          x={blockX - 80}
          y={HEIGHT / 2 - 40}
          width={160}
          height={80}
          rx={8}
          fill={COLORS.GOOGLE_BLUE}
        />
        {/* Windows */}
        {[0, 1].map((i) => (
          <rect
            key={i}
            x={blockX - 55 + i * 60}
            y={HEIGHT / 2 - 22}
            width={36}
            height={28}
            rx={4}
            fill="white"
            opacity={0.8}
          />
        ))}
        {/* Wheels */}
        {[-40, 40].map((offset, i) => (
          <circle
            key={i}
            cx={blockX + offset}
            cy={HEIGHT / 2 + 40}
            r={14}
            fill={COLORS.TEXT_DARK_GREY}
          />
        ))}
      </svg>
    </div>
  );
};
