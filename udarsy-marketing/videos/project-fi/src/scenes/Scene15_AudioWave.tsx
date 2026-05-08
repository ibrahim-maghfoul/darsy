import { COLORS, WIDTH, HEIGHT } from "../constants";

const BAR_COUNT = 10;
const BAR_WIDTH = 48;
const BAR_GAP = 24;
const TOTAL_WIDTH = BAR_COUNT * (BAR_WIDTH + BAR_GAP) - BAR_GAP;
const START_X = (WIDTH - TOTAL_WIDTH) / 2;
const BASE_Y = HEIGHT / 2 + 100;
const MAX_HEIGHT = 300;

export const Scene15_AudioWave: React.FC<{ frame: number }> = ({ frame }) => {
  const t = frame / 60;

  return (
    <div style={{ width: "100%", height: "100%", background: COLORS.BG_WHITE, position: "relative", overflow: "hidden" }}>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0 }}>
        {Array.from({ length: BAR_COUNT }).map((_, i) => {
          // Center bars get highest amplitude
          const centerWeight = 1 - Math.abs(i - (BAR_COUNT - 1) / 2) / ((BAR_COUNT - 1) / 2);
          const phase = i * 0.4;
          const h = (0.3 + centerWeight * 0.7) * MAX_HEIGHT * (0.5 + 0.5 * Math.sin(t * Math.PI * 3 + phase));
          const x = START_X + i * (BAR_WIDTH + BAR_GAP);
          const color = i % 2 === 0 ? COLORS.GOOGLE_GREEN : COLORS.GOOGLE_YELLOW;
          return (
            <rect
              key={i}
              x={x}
              y={BASE_Y - h}
              width={BAR_WIDTH}
              height={h}
              rx={6}
              fill={color}
            />
          );
        })}
      </svg>
    </div>
  );
};
