"use client";

// Sphere: pure trig, zero deps, 60fps arcs + slow rotation.
// Dots: depth-shaded (bright center → dim edge) = 3D illusion, no glow.
// City dots: plain solid circles, no radial gradient.
// Base: pre-baked offscreen canvas (gradients drawn once per resize).

import { useEffect, useRef } from "react";

const DEG = Math.PI / 180;
const TAU = Math.PI * 2;
const TS  = Math.sin(-10 * DEG); // tilt sin
const TC  = Math.cos(-10 * DEG); // tilt cos

// Grid dots — module-level, computed once (~115 dots, step 11°)
const DOTS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let lat = -80; lat <= 80; lat += 11) {
    const n = Math.max(4, Math.round(33 * Math.cos(lat * DEG)));
    for (let i = 0; i < n; i++) out.push([(i / n) * 360 - 180, lat]);
  }
  return out;
})();

const CITIES: [number, number][] = [
  [-74, 40.7], [-118.2, 34], [2.35, 48.9], [13.4, 52.5],
  [-7.6, 33.6], [31.2, 30], [55.3, 25.2], [72.9, 19.1],
  [116.4, 39.9], [139.7, 35.7], [151.2, -33.9], [103.8, 1.3],
];

// Orthographic projection — returns screen position + depth z ∈ [-1, 1]
function proj(lon: number, lat: number, rot: number, cx: number, cy: number, r: number) {
  const λ = (lon - rot) * DEG, φ = lat * DEG;
  const cφ = Math.cos(φ), sφ = Math.sin(φ), cλ = Math.cos(λ);
  return {
    sx: cx + r * cφ * Math.sin(λ),
    sy: cy - r * (sφ * TC - cφ * cλ * TS),
    z:         sφ * TS + cφ * cλ * TC,
  };
}

// Great-circle arc via slerp
function slerp(a: [number, number], b: [number, number], steps = 32): [number, number][] {
  const ax = Math.cos(a[1]*DEG)*Math.cos(a[0]*DEG), ay = Math.cos(a[1]*DEG)*Math.sin(a[0]*DEG), az = Math.sin(a[1]*DEG);
  const bx = Math.cos(b[1]*DEG)*Math.cos(b[0]*DEG), by = Math.cos(b[1]*DEG)*Math.sin(b[0]*DEG), bz = Math.sin(b[1]*DEG);
  const dot = Math.max(-1, Math.min(1, ax*bx + ay*by + az*bz));
  const θ = Math.acos(dot); if (θ < 0.001) return [a, b];
  const sθ = Math.sin(θ);
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, wa = Math.sin((1-t)*θ)/sθ, wb = Math.sin(t*θ)/sθ;
    const cx = wa*ax+wb*bx, cy = wa*ay+wb*by, cz = wa*az+wb*bz;
    pts.push([Math.atan2(cy, cx)/DEG, Math.asin(Math.max(-1, Math.min(1, cz)))/DEG]);
  }
  return pts;
}

type Arc = { pts: [number, number][]; t0: number; dur: number; white: boolean };
function newArc(now: number): Arc {
  const a = Math.floor(Math.random() * CITIES.length);
  let b = a; while (b === a) b = Math.floor(Math.random() * CITIES.length);
  return { pts: slerp(CITIES[a], CITIES[b]), t0: now + Math.random() * 2.5, dur: 5 + Math.random() * 4, white: Math.random() > 0.4 };
}

// Pre-bake static sphere layers — called once per resize, blitted every frame
function bakeBase(W: number, H: number, cx: number, cy: number, r: number): HTMLCanvasElement {
  const off = document.createElement("canvas");
  off.width = Math.round(W * 1.5); off.height = Math.round(H * 1.5);
  const c = off.getContext("2d")!;
  c.setTransform(1.5, 0, 0, 1.5, 0, 0);

  // Sphere fill with offset light source
  const g = c.createRadialGradient(cx - r*0.22, cy - r*0.28, r*0.04, cx, cy, r);
  g.addColorStop(0,    "#1e6040");
  g.addColorStop(0.38, "#0f3820");
  g.addColorStop(0.76, "#060e08");
  g.addColorStop(1,    "#020604");
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();

  // Edge vignette — creates the curved-surface illusion
  const v = c.createRadialGradient(cx, cy, r*0.48, cx, cy, r);
  v.addColorStop(0,    "rgba(0,0,0,0)");
  v.addColorStop(0.80, "rgba(0,0,0,0.52)");
  v.addColorStop(1,    "rgba(0,0,0,0.90)");
  c.fillStyle = v; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();

  // Atmosphere glow
  const a = c.createRadialGradient(cx, cy, r*0.96, cx, cy, r*1.09);
  a.addColorStop(0, "rgba(80,200,130,0.13)");
  a.addColorStop(1, "rgba(80,200,130,0)");
  c.fillStyle = a; c.beginPath(); c.arc(cx, cy, r*1.09, 0, TAU); c.fill();

  return off;
}

export type GlobeSphereProps = {
  cyFrac?: number; radiusFrac?: number; bottomMask?: boolean; className?: string;
};

export function GlobeSphere({
  cyFrac = 0.92, radiusFrac = 0.50, bottomMask = true, className = "absolute inset-0",
}: GlobeSphereProps) {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    let dead = false, raf = 0;
    let W = 0, H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const arcs: Arc[] = [];
    let base: HTMLCanvasElement | null = null, bKey = "";

    // Separate timers: sphere rotation throttled to 22fps, arcs at full 60fps
    let lastSphere = 0;
    const SPHERE_MS = 1000 / 22;

    const resize = () => {
      const rc = wrap.getBoundingClientRect();
      W = rc.width; H = rc.height;
      canvas.width  = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      base = null;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap);

    let visible = false;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    const t0 = performance.now();

    // Cache projected dot positions — recomputed only when sphere updates (22fps)
    let cachedDots: { sx: number; sy: number; z: number }[] = [];
    let cachedCities: { sx: number; sy: number; z: number }[] = [];
    let cachedRot = -9999;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible || document.hidden) return;

      const t   = (now - t0) / 1000;
      const r   = Math.min(W * radiusFrac, H * 0.88);
      const cx  = W / 2, cy = H * cyFrac;
      // Slow rotation: full turn in ~72s
      const rot = (t * 1.8) % 360;

      const key = `${Math.round(r)}`;
      if (!base || bKey !== key) { base = bakeBase(W, H, cx, cy, r); bKey = key; }

      // ── Sphere dots: throttled to 22fps (imperceptible at slow rotation) ──
      const redrawSphere = now - lastSphere >= SPHERE_MS;
      if (redrawSphere) {
        lastSphere = now;
        cachedRot = rot;
        cachedDots   = DOTS.map(([lon, lat]) => proj(lon, lat, rot, cx, cy, r));
        cachedCities = CITIES.map(([lon, lat]) => proj(lon, lat, rot, cx, cy, r));
      }

      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(base, 0, 0, W, H);

      // ── Depth-shaded dot batches — 4 fills total ──────────────────────────
      // Back hemisphere: ghost-faint (depth cue through sphere)
      ctx.fillStyle = "rgba(150,210,180,0.08)";
      ctx.beginPath();
      for (const p of cachedDots) {
        if (p.z >= 0) continue;
        ctx.moveTo(p.sx + 0.65, p.sy); ctx.arc(p.sx, p.sy, 0.65, 0, TAU);
      }
      ctx.fill();

      // Front edge (z 0–0.3): dim, curving away
      ctx.fillStyle = "rgba(255,255,255,0.26)";
      ctx.beginPath();
      for (const p of cachedDots) {
        if (p.z < 0 || p.z >= 0.3) continue;
        ctx.moveTo(p.sx + 0.7, p.sy); ctx.arc(p.sx, p.sy, 0.7, 0, TAU);
      }
      ctx.fill();

      // Front mid (z 0.3–0.65)
      ctx.fillStyle = "rgba(255,255,255,0.56)";
      ctx.beginPath();
      for (const p of cachedDots) {
        if (p.z < 0.3 || p.z >= 0.65) continue;
        ctx.moveTo(p.sx + 0.9, p.sy); ctx.arc(p.sx, p.sy, 0.9, 0, TAU);
      }
      ctx.fill();

      // Front bright (z > 0.65): fully lit center
      ctx.fillStyle = "rgba(255,255,255,0.80)";
      ctx.beginPath();
      for (const p of cachedDots) {
        if (p.z < 0.65) continue;
        ctx.moveTo(p.sx + 1.05, p.sy); ctx.arc(p.sx, p.sy, 1.05, 0, TAU);
      }
      ctx.fill();

      // City dots — plain solid circles, no glow
      for (const p of cachedCities) {
        if (p.z < 0) continue;
        ctx.fillStyle = "rgba(255,255,255,0.88)";
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 2.0, 0, TAU); ctx.fill();
        ctx.fillStyle = "#7dd3a8";
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 1.0, 0, TAU); ctx.fill();
      }

      // ── Arcs: full 60fps — smooth progressive drawing ─────────────────────
      while (arcs.length < 3) arcs.push(newArc(t));
      ctx.lineWidth = 1.2; ctx.lineCap = "round";
      for (let i = 0; i < arcs.length; i++) {
        const arc = arcs[i];
        const el = t - arc.t0; if (el < 0) continue;
        const ph = el / arc.dur;
        if (ph > 1.05) { arcs[i] = newArc(t); continue; }
        const drawP = Math.min(1, ph / 0.38);
        const alpha = ph < 0.68 ? 1 : Math.max(0, 1 - (ph - 0.68) / 0.32);
        const n = arc.pts.length;
        // Fractional end so the arc tip advances continuously (no per-frame jump)
        const endF = drawP * (n - 1);
        const end  = Math.floor(endF);
        const frac = endF - end;

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = arc.white ? "rgba(255,255,255,0.85)" : "rgba(125,211,168,0.85)";
        ctx.beginPath();
        let drawing = false;
        for (let j = 0; j <= end; j++) {
          const p = proj(arc.pts[j][0], arc.pts[j][1], rot, cx, cy, r);
          // Fade out slightly as a segment dips behind the sphere instead of hard-clipping
          if (p.z < -0.08) { drawing = false; continue; }
          const lift = Math.sin((j / (n - 1)) * Math.PI) * r * 0.09;
          const sy = p.sy - lift;
          if (!drawing) { ctx.moveTo(p.sx, sy); drawing = true; }
          else ctx.lineTo(p.sx, sy);
        }
        // Interpolate to the fractional tip for sub-pixel smooth progress
        if (drawing && frac > 0 && end + 1 < n) {
          const pA = proj(arc.pts[end][0],   arc.pts[end][1],   rot, cx, cy, r);
          const pB = proj(arc.pts[end+1][0], arc.pts[end+1][1], rot, cx, cy, r);
          if (pA.z >= -0.08 && pB.z >= -0.08) {
            const liftA = Math.sin((end   / (n-1)) * Math.PI) * r * 0.09;
            const liftB = Math.sin(((end+1)/(n-1)) * Math.PI) * r * 0.09;
            ctx.lineTo(
              pA.sx + (pB.sx - pA.sx) * frac,
              (pA.sy - liftA) + ((pB.sy - liftB) - (pA.sy - liftA)) * frac
            );
          }
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };

    raf = requestAnimationFrame(draw);
    return () => { dead = true; void dead; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, [cyFrac, radiusFrac]);

  const maskStyle = bottomMask
    ? { maskImage: "linear-gradient(to bottom,#000 0%,#000 68%,transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom,#000 0%,#000 68%,transparent 100%)" }
    : undefined;

  return (
    <div ref={wrapRef} className={`${className} overflow-hidden`}>
      <canvas ref={canvasRef} className="absolute inset-0"
        style={{ ...maskStyle, transform: "translateZ(0)", willChange: "transform" }} />
    </div>
  );
}
