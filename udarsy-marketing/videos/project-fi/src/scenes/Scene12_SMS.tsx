import { interpolate, spring } from "remotion";
import { COLORS, FONT_FAMILY, FONT_SIZE_BODY, WIDTH, HEIGHT } from "../constants";

export const Scene12_SMS: React.FC<{ frame: number }> = ({ frame }) => {
  // Bubble scale springs in
  const bubbleScale = spring({ frame, fps: 60, config: { damping: 14, stiffness: 200 } });

  const cx = WIDTH / 2;
  const cy = HEIGHT / 2 - 40;

  // Typing indicator: each dot bounces with offset
  const bounce = (offset: number) => {
    const t = (frame - offset) / 60;
    return Math.max(0, -Math.sin(t * Math.PI * 2) * 14);
  };

  const showTyping = frame > 3 * 60; // after 3 seconds show typing dots
  const typingOpacity = interpolate(frame, [3 * 60, 3 * 60 + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ width: "100%", height: "100%", background: COLORS.BG_WHITE, position: "relative", overflow: "hidden" }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0 }}>
        <g transform={`translate(${cx}, ${cy}) scale(${bubbleScale}) translate(${-cx}, ${-cy})`}>
          {/* Speech bubble body */}
          <rect
            x={cx - 230}
            y={cy - 80}
            width={460}
            height={160}
            rx={32}
            ry={32}
            fill={COLORS.GOOGLE_GREEN}
          />
          {/* Bubble tail */}
          <polygon
            points={`${cx - 30},${cy + 80} ${cx + 30},${cy + 80} ${cx - 10},${cy + 130}`}
            fill={COLORS.GOOGLE_GREEN}
          />
        </g>
      </svg>

      {/* "Happy B-day!!!" text */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          width: "100%",
          transform: `translateY(calc(-50% - 10px)) scale(${bubbleScale})`,
          textAlign: "center",
          fontFamily: FONT_FAMILY,
          fontSize: 48,
          color: "white",
          letterSpacing: "0.01em",
          zIndex: 10,
          transformOrigin: "center",
        }}
      >
        Happy B-day!!!
      </div>

      {/* Typing indicator dots */}
      {showTyping && (
        <svg
          width={WIDTH}
          height={HEIGHT}
          style={{ position: "absolute", top: 0, left: 0, opacity: typingOpacity }}
        >
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={cx - 30 + i * 30}
              cy={cy + 180 - bounce(i * 10)}
              r={10}
              fill={COLORS.GOOGLE_BLUE}
            />
          ))}
        </svg>
      )}
    </div>
  );
};
