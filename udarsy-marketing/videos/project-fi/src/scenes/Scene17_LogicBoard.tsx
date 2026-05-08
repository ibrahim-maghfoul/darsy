import { interpolate } from "remotion";
import { COLORS, WIDTH, HEIGHT } from "../constants";

const GRID = 4;
const SPACING = 120;
const TOTAL = GRID * GRID;

function gridPos(i: number): [number, number] {
  const col = i % GRID;
  const row = Math.floor(i / GRID);
  const startX = WIDTH / 2 - ((GRID - 1) * SPACING) / 2;
  const startY = HEIGHT / 2 - ((GRID - 1) * SPACING) / 2;
  return [startX + col * SPACING, startY + row * SPACING];
}

// Predefined sequential connections
const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3],
  [4, 5], [5, 6], [6, 7],
  [8, 9], [9, 10], [10, 11],
  [12, 13], [13, 14], [14, 15],
  [0, 4], [4, 8], [8, 12],
  [1, 5], [5, 9], [9, 13],
  [2, 6], [6, 10], [10, 14],
  [3, 7], [7, 11], [11, 15],
];

export const Scene17_LogicBoard: React.FC<{ frame: number; duration: number }> = ({ frame, duration }) => {
  const framesPerLine = duration / CONNECTIONS.length;

  return (
    <div style={{ width: "100%", height: "100%", background: COLORS.BG_DARK_BLUE, position: "relative", overflow: "hidden" }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0 }}>
        {/* Connections (light up sequentially) */}
        {CONNECTIONS.map(([a, b], i) => {
          const lineStart = i * framesPerLine;
          const lineEnd = lineStart + framesPerLine;
          const opacity = interpolate(frame, [lineStart, lineEnd], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const [ax, ay] = gridPos(a);
          const [bx, by] = gridPos(b);
          return (
            <line
              key={i}
              x1={ax} y1={ay} x2={bx} y2={by}
              stroke={COLORS.GOOGLE_YELLOW}
              strokeWidth={2}
              opacity={opacity}
            />
          );
        })}

        {/* Dots */}
        {Array.from({ length: TOTAL }).map((_, i) => {
          const [cx, cy] = gridPos(i);
          const lit = CONNECTIONS.some(([a, b], ci) => {
            const lineStart = ci * framesPerLine;
            return (a === i || b === i) && frame >= lineStart;
          });
          return <circle key={i} cx={cx} cy={cy} r={10} fill={lit ? "white" : "#4A5568"} />;
        })}
      </svg>
    </div>
  );
};
