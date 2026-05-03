import { useEffect, useRef } from "react";

let _uid = 0;

export function DarsyLoader({ size = 80, color = "#3aaa6a", style = {} }) {
    const uid = useRef(`dl${++_uid}`).current;
    const arcBackRef  = useRef(null);
    const arcFrontRef = useRef(null);
    const ballRef     = useRef(null);
    const rafRef      = useRef(null);

    useEffect(() => {
        const arcBack  = arcBackRef.current;
        const arcFront = arcFrontRef.current;
        const ball     = ballRef.current;
        if (!arcBack || !arcFront || !ball) return;

        const cx = 100, cy = 100;
        const orbitR     = 52;
        const FILL_START = -Math.PI / 2 + Math.PI / 4;
        const BALL_R     = 11;
        const RING_DUR   = 2200;
        const RISE_DUR   = 900;
        const HOLD_DUR   = 500;
        const EXIT_DUR   = 700;
        const COLL_DUR   = 150;
        const UNFILL_DUR = 2200;
        const LOOP_GAP   = 500;

        let t0 = null, dropT0 = null, phase = "ring";

        function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
        function easeOut(t)   { return 1 - Math.pow(1 - t, 3); }

        function rotPt(x, y, z, ax) {
            return {
                x,
                y: y * Math.cos(ax) - z * Math.sin(ax),
                z: y * Math.sin(ax) + z * Math.cos(ax),
            };
        }

        function buildArcPath(ax, a0, a1, isFront) {
            const steps = 120;
            const thr = isFront ? -8 : 8;
            let d = "", pen = false;
            for (let i = 0; i <= steps; i++) {
                const a = a0 + (a1 - a0) * (i / steps);
                const p = rotPt(orbitR * Math.cos(a), orbitR * Math.sin(a), 0, ax);
                const pass = isFront ? p.z >= thr : p.z <= thr;
                if (pass) {
                    const px = (cx + p.x).toFixed(2);
                    const py = (cy + p.y).toFixed(2);
                    d += pen ? `L${px},${py}` : `M${px},${py}`;
                    pen = true;
                } else {
                    pen = false;
                }
            }
            return d;
        }

        function setRing(ax, sweep) {
            if (sweep < 0.001) {
                arcBack.setAttribute("d", "");
                arcFront.setAttribute("d", "");
                return;
            }
            const a0 = FILL_START - sweep;
            const a1 = FILL_START + sweep;
            arcBack.setAttribute("d",
                buildArcPath(ax, a0, FILL_START, false) +
                buildArcPath(ax, FILL_START, a1, false)
            );
            arcFront.setAttribute("d",
                buildArcPath(ax, a0, FILL_START, true) +
                buildArcPath(ax, FILL_START, a1, true)
            );
        }

        function setBall(ty, r) {
            ball.setAttribute("cy", (cy + ty).toFixed(2));
            ball.setAttribute("r",  Math.max(0, r).toFixed(2));
        }

        function calcDrop(elapsed) {
            const SY = orbitR;
            if (elapsed < RISE_DUR) {
                const p = easeInOut(elapsed / RISE_DUR);
                return { ty: SY * (1 - p), r: BALL_R * (0.5 + 0.5 * p), up: null };
            }
            elapsed -= RISE_DUR;
            if (elapsed < HOLD_DUR) {
                const p = elapsed / HOLD_DUR;
                return { ty: 0, r: BALL_R * (1 + 0.28 * Math.sin(p * Math.PI)), up: null };
            }
            elapsed -= HOLD_DUR;
            if (elapsed < EXIT_DUR) {
                const p = easeInOut(elapsed / EXIT_DUR);
                return { ty: -SY * p, r: BALL_R * (1 - p * 0.45), up: null };
            }
            elapsed -= EXIT_DUR;
            if (elapsed < COLL_DUR) {
                return { ty: -SY, r: BALL_R * 0.55, up: null };
            }
            elapsed -= COLL_DUR;
            const p    = easeInOut(Math.min(1, elapsed / UNFILL_DUR));
            const fade = Math.max(0, 1 - easeOut(Math.min(1, p * 5)));
            return { ty: -SY, r: BALL_R * 0.55 * fade, up: p };
        }

        function tick(ts) {
            if (!t0) t0 = ts;

            if (phase === "ring") {
                const t = Math.min((ts - t0) / RING_DUR, 1);
                const p = easeInOut(t);
                setRing(-p * Math.PI, p * Math.PI);
                setBall(orbitR, 0);
                if (t >= 1) { phase = "drop"; dropT0 = ts; }
            } else if (phase === "drop") {
                const d  = calcDrop(ts - dropT0);
                const up = d.up ?? 0;
                if (up >= 1) {
                    arcBack.setAttribute("d", "");
                    arcFront.setAttribute("d", "");
                    setBall(0, 0);
                    phase = "gap"; dropT0 = ts;
                } else {
                    setRing(-(1 + up) * Math.PI, (1 - up) * Math.PI);
                    setBall(d.ty, d.r);
                }
            } else if (phase === "gap") {
                if (ts - dropT0 >= LOOP_GAP) {
                    t0 = null; dropT0 = null; phase = "ring";
                    arcBack.setAttribute("d", "");
                    arcFront.setAttribute("d", "");
                    setBall(0, 0);
                }
            }

            rafRef.current = requestAnimationFrame(tick);
        }

        rafRef.current = requestAnimationFrame(tick);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, []);

    return (
        <svg
            viewBox="0 0 200 200"
            width={size}
            height={size}
            xmlns="http://www.w3.org/2000/svg"
            style={style}
        >
            <defs>
                <filter id={`lgoo-${uid}`} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                    <feColorMatrix in="blur" type="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 38 -13"
                        result="threshold"
                    />
                    <feComposite in="SourceGraphic" in2="threshold" operator="atop" />
                </filter>
            </defs>
            <g filter={`url(#lgoo-${uid})`}>
                <path ref={arcBackRef}  fill="none" stroke={color} strokeWidth="10" strokeLinecap="butt" />
                <circle ref={ballRef} cx="100" cy="152" r="0" fill={color} />
                <path ref={arcFrontRef} fill="none" stroke={color} strokeWidth="10" strokeLinecap="butt" />
            </g>
        </svg>
    );
}

export function FullPageLoader({ label }) {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff", gap: 12 }}>
            <DarsyLoader size={100} />
            {label && <p style={{ fontSize: 13, fontWeight: 600, color: "#888" }}>{label}</p>}
        </div>
    );
}
