// ─── Color Palette ────────────────────────────────────────────────────
export const COLORS = {
  BG_WHITE: "#FFFFFF",
  BG_GREEN: "#34A853",
  BG_DARK_GREEN: "#1E7E34",
  BG_BLUE: "#4285F4",
  BG_DARK_BLUE: "#1A3A7A",
  GOOGLE_BLUE: "#4285F4",
  GOOGLE_GREEN: "#34A853",
  GOOGLE_RED: "#EA4335",
  GOOGLE_YELLOW: "#FBBC05",
  TEXT_DARK_GREY: "#5F6368",
  PATH_LIGHT_GREY: "#E8EAED",
  TRAIL_GREY: "#BDC1C6",
};

// ─── Timing Helpers ────────────────────────────────────────────────────
export const FPS = 60;
export const TOTAL_DURATION_S = 59;
export const TOTAL_FRAMES = TOTAL_DURATION_S * FPS; // 3540

/** Convert seconds to frame number */
export const s = (sec: number) => Math.round(sec * FPS);

// ─── Scene frame ranges ────────────────────────────────────────────────
export const SCENES = {
  S01: { start: s(0), end: s(4) },
  S02_03: { start: s(4), end: s(12) },
  S04: { start: s(9), end: s(13) },
  S05: { start: s(12.5), end: s(14) },
  S06: { start: s(14), end: s(16) },
  S07: { start: s(16), end: s(18) },
  S08: { start: s(18), end: s(22) },
  S09: { start: s(22), end: s(24) },
  S10: { start: s(24), end: s(27) },
  S11: { start: s(27), end: s(30) },
  S12: { start: s(30), end: s(33) },
  S13: { start: s(33), end: s(35) },
  S14: { start: s(35), end: s(39) },
  S15: { start: s(39), end: s(42) },
  S16: { start: s(42), end: s(46) },
  S17: { start: s(46), end: s(55) },
  S18_19: { start: s(55), end: s(59) },
  S20: { start: s(59), end: s(59) },
};

// ─── Typography ────────────────────────────────────────────────────────
export const FONT_FAMILY = "'Roboto Medium', 'Product Sans', sans-serif";
export const FONT_SIZE_HEADER = 64;
export const FONT_SIZE_BODY = 38;

// ─── Canvas ────────────────────────────────────────────────────────────
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const CX = WIDTH / 2;
export const CY = HEIGHT / 2;

// ─── Easing helpers ───────────────────────────────────────────────────
/** Simple linear interpolation (Remotion's interpolate handles easing) */
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Map a frame offset [0..duration] to [0..1] clamped */
export const progress = (frame: number, startFrame: number, durationFrames: number) =>
  Math.min(1, Math.max(0, (frame - startFrame) / durationFrames));
