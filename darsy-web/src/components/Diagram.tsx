"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

function AnimatedConnectLine({ x1, y1, x2, y2, delay = 0 }: { x1: number, y1: number, x2: number, y2: number, delay?: number }) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx*dx + dy*dy);
    if (len < 1) return null;
    const nx = -dy/len, ny = dx/len;
    
    // Adjusted freq for a requested slightly smaller wave length
    const freq = Math.max(1.5, len / 40);
    const N = Math.ceil(len); 
    let d1 = "", d2 = "";
    for (let i = 0; i <= N; i++) {
        const f = i / N;
        const bx = x1 + dx * f, by = y1 + dy * f;
        const w1 = Math.sin(f * freq * Math.PI * 2) * 8;
        const w2 = Math.sin(f * freq * Math.PI * 2 + Math.PI) * 8;
        d1 += `${i===0?'M':'L'}${(bx + nx*w1).toFixed(1)},${(by + ny*w1).toFixed(1)} `;
        d2 += `${i===0?'M':'L'}${(bx + nx*w2).toFixed(1)},${(by + ny*w2).toFixed(1)} `;
    }

    // Normalize dynamic sine arc lengths to 100 for perfectly synchronized geometric dash unfilling percent math
    return (
        <g>
            <path d={d1} fill="none" stroke="#23683f" strokeWidth="1" strokeLinecap="round" 
                  pathLength="100" strokeDasharray="100 100" 
                  className="anim-flow" style={{ animationDelay: `${delay + 0.15}s`, opacity: 0.6 }} />
            <path d={d2} fill="none" stroke="#23683f" strokeWidth="1" strokeLinecap="round" 
                  pathLength="100" strokeDasharray="100 100" 
                  className="anim-flow" style={{ animationDelay: `${delay + 0.3}s`, opacity: 0.6 }} />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3aaa6a" strokeWidth="2.5" strokeLinecap="round" 
                  pathLength="100" strokeDasharray="100 100" 
                  className="anim-flow drop-shadow-[0_0_4px_rgba(58,170,106,0.8)]" style={{ animationDelay: `${delay}s` }} />
        </g>
    );
}

function AnimatedShapePop({ x, y, delay }: { x: number, y: number, delay: number }) {
    return (
        <g transform={`translate(${x},${y})`} pointerEvents="none">
            <circle cx="0" cy="0" r="50" fill="#ffffff" className="anim-shape-pop" style={{ animationDelay: `${delay}s`, opacity: 0 }} />
        </g>
    );
}

export function Diagram() {
    const t = useTranslations('Diagram');
    const rawId = useId();
    const uid = rawId.replace(/[^a-zA-Z0-9]/g, '');
    const fanLinesRef = useRef<SVGPathElement[]>([]);
    const [randomDelays, setRandomDelays] = useState<number[]>([]);

    useEffect(() => {
        const delays = Array.from({ length: 9 }, () => Math.random() * 0.8);
        setRandomDelays(delays);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        fanLinesRef.current.forEach((el, i) => {
                            if (!el) return;
                            el.classList.add("visible");
                            setTimeout(() => {
                                el.style.opacity = '1';
                                el.style.strokeDashoffset = '0';
                            }, (delays[i] || 0) * 1000);
                        });
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.2 }
        );

        const fanGroup = fanLinesRef.current[0]?.parentElement;
        if (fanGroup) observer.observe(fanGroup);

        return () => observer.disconnect();
    }, []);

    return (
        <div className="w-[clamp(300px,44vw,500px)] relative shrink-0 z-3">
            <svg viewBox="0 0 500 580" xmlns="http://www.w3.org/2000/svg" className="block w-full h-auto overflow-visible font-roboto">
                <defs>
                    <radialGradient id={`gHex${uid}`} cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor="#7ddba8" />
                        <stop offset="100%" stopColor="#3aaa6a" />
                    </radialGradient>
                    <radialGradient id={`gHexH${uid}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#b8f5d8" />
                        <stop offset="100%" stopColor="#5acc88" />
                    </radialGradient>
                    <radialGradient id={`gBlob${uid}`} cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor="#1e3d2c" />
                        <stop offset="100%" stopColor="#0a1810" />
                    </radialGradient>
                    <radialGradient id={`gBlobH${uid}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#3d7a56" />
                        <stop offset="100%" stopColor="#1e3d2c" />
                    </radialGradient>
                    <radialGradient id={`gCirc${uid}`} cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor="#2d6044" />
                        <stop offset="100%" stopColor="#142a1e" />
                    </radialGradient>
                    <radialGradient id={`gCircH${uid}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#4a9a6e" />
                        <stop offset="100%" stopColor="#2d6044" />
                    </radialGradient>
                    <radialGradient id={`gDiam${uid}`} cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor="#55c988" />
                        <stop offset="100%" stopColor="#28845a" />
                    </radialGradient>
                    <radialGradient id={`gDiamH${uid}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#88f0b8" />
                        <stop offset="100%" stopColor="#44aa78" />
                    </radialGradient>

                    <linearGradient id={`fanG${uid}`} x1="0" y1="402" x2="0" y2="565" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
                        <stop offset="65%" stopColor="#4ade80" stopOpacity="0.65" />
                        <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
                    </linearGradient>

                    <filter id={`shHex${uid}`} x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#1a5c38" floodOpacity="0.35" />
                    </filter>
                    <filter id={`shBlob${uid}`} x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#040f08" floodOpacity="0.5" />
                    </filter>
                    <filter id={`shCirc${uid}`} x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0a2016" floodOpacity="0.45" />
                    </filter>
                    <filter id={`shDiam${uid}`} x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="10" stdDeviation="13" floodColor="#0a2a16" floodOpacity="0.4" />
                    </filter>

                    <pattern id={`patLines${uid}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="8" stroke="#062210" strokeWidth="1.5" strokeOpacity="0.15" />
                    </pattern>
                    <pattern id={`patDots${uid}`} width="10" height="10" patternUnits="userSpaceOnUse">
                        <circle cx="3" cy="3" r="1.5" fill="#ffffff" fillOpacity="0.12" />
                        <circle cx="8" cy="8" r="1" fill="#ffffff" fillOpacity="0.08" />
                    </pattern>
                    <pattern id={`patGrid${uid}`} width="12" height="12" patternUnits="userSpaceOnUse">
                        <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#062210" strokeWidth="1" strokeOpacity="0.15" />
                    </pattern>
                    <pattern id={`patHive${uid}`} width="16" height="27.71" patternUnits="userSpaceOnUse" patternTransform="scale(0.6)">
                        <path d="M8 4.62L16 0V9.24L8 13.86L0 9.24V0Z M0 27.71L8 23.09L16 27.71V18.47L8 13.86L0 18.47Z" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.15" />
                    </pattern>

                    <filter id={`fanGlow${uid}`} x="-30%" y="-5%" width="160%" height="120%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
                        <feMerge>
                            <feMergeNode in="b" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <clipPath id={`cHex${uid}`}>
                        <path d="M 239.6,24 Q 250,18 260.4,24 L 302,48 Q 312.4,54 312.4,66 L 312.4,114 Q 312.4,126 302,132 L 260.4,156 Q 250,162 239.6,156 L 198,132 Q 187.6,126 187.6,114 L 187.6,66 Q 187.6,54 198,48 Z" />
                    </clipPath>
                    <clipPath id={`cBlob${uid}`}>
                        <path d="M 110,151 C 123,151 122,162 134,169 C 146,176 155,170 161,181 C 168,192 159,197 159,210 C 159,223 168,228 161,239 C 155,250 146,244 134,251 C 122,258 123,269 110,269 C 97,269 98,258 86,251 C 74,244 65,250 59,239 C 52,228 61,223 61,210 C 61,197 52,192 59,181 C 65,170 74,176 86,169 C 98,162 97,151 110,151 Z" />
                    </clipPath>
                    <clipPath id={`cCirc${uid}`}>
                        <circle cx="390" cy="210" r="64" />
                    </clipPath>
                    <clipPath id={`cDiam${uid}`}>
                        <path d="M 234.4,266 Q 250,250 265.6,266 L 310.4,310.4 Q 326,326 310.4,341.6 L 265.6,386 Q 250,402 234.4,386 L 189.6,341.6 Q 174,326 189.6,310.4 Z" />
                    </clipPath>
                </defs>

                {/* Fan Lines (Trails) */}
                <g filter={`url(#fanGlow${uid})`}>
                    {[
                        "M 250,402 Q 250,472  40,525",
                        "M 250,402 Q 250,474 100,525",
                        "M 250,402 Q 250,476 168,525",
                        "M 250,402 Q 250,477 222,525",
                        "M 250,402 Q 250,477 250,525",
                        "M 250,402 Q 250,477 278,525",
                        "M 250,402 Q 250,476 332,525",
                        "M 250,402 Q 250,474 400,525",
                        "M 250,402 Q 250,472 460,525",
                    ].map((d, i) => (
                        <path
                            key={i}
                            ref={(el) => { if (el) fanLinesRef.current[i] = el; }}
                            className="fan-line"
                            fill="none"
                            stroke={`url(#fanG${uid})`}
                            strokeWidth="8"
                            strokeLinecap="round"
                            d={d}
                            style={{
                                animationDelay: `${randomDelays[i]}s, ${1.8 + (randomDelays[i] || 0)}s`,
                            }}
                        />
                    ))}
                </g>

                {/* Main Shapes */}
                <g className="group cursor-pointer" filter={`url(#shHex${uid})`}>
                    <AnimatedConnectLine x1={250} y1={210} x2={250} y2={90} delay={0} />
                    <path className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[250px_90px]" fill={`url(#gHex${uid})`} d="M 239.6,24 Q 250,18 260.4,24 L 302,48 Q 312.4,54 312.4,66 L 312.4,114 Q 312.4,126 302,132 L 260.4,156 Q 250,162 239.6,156 L 198,132 Q 187.6,126 187.6,114 L 187.6,66 Q 187.6,54 198,48 Z" />
                    <path className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[250px_90px] pointer-events-none" fill={`url(#patLines${uid})`} d="M 239.6,24 Q 250,18 260.4,24 L 302,48 Q 312.4,54 312.4,66 L 312.4,114 Q 312.4,126 302,132 L 260.4,156 Q 250,162 239.6,156 L 198,132 Q 187.6,126 187.6,114 L 187.6,66 Q 187.6,54 198,48 Z" />
                    <g clipPath={`url(#cHex${uid})`} className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[250px_90px]">
                        <circle className="scale-0 group-hover:scale-200 opacity-0 group-hover:opacity-100 transition-all duration-500 origin-[250px_90px]" cx="250" cy="90" r="60" fill={`url(#gHexH${uid})`} />
                        <circle className="scale-0 group-hover:scale-200 opacity-0 group-hover:opacity-100 transition-all duration-500 origin-[250px_90px] pointer-events-none" cx="250" cy="90" r="60" fill={`url(#patLines${uid})`} />
                    </g>
                    <text className="origin-[250px_90px] font-roboto text-[13px] font-semibold fill-white text-center pointer-events-none transition-transform duration-[350ms] group-hover:scale-[1.08]">
                        <tspan x="250" y="86" textAnchor="middle">{t('hex1')}</tspan>
                        <tspan x="250" dy="17" textAnchor="middle">{t('hex2')}</tspan>
                    </text>
                    <AnimatedShapePop x={250} y={90} delay={0} />
                </g>

                <g className="group cursor-pointer" filter={`url(#shBlob${uid})`}>
                    <AnimatedConnectLine x1={250} y1={210} x2={110} y2={210} delay={1.2} />
                    <path className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[110px_210px]" fill={`url(#gBlob${uid})`} d="M 110,151 C 123,151 122,162 134,169 C 146,176 155,170 161,181 C 168,192 159,197 159,210 C 159,223 168,228 161,239 C 155,250 146,244 134,251 C 122,258 123,269 110,269 C 97,269 98,258 86,251 C 74,244 65,250 59,239 C 52,228 61,223 61,210 C 61,197 52,192 59,181 C 65,170 74,176 86,169 C 98,162 97,151 110,151 Z" />
                    <path className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[110px_210px] pointer-events-none" fill={`url(#patHive${uid})`} d="M 110,151 C 123,151 122,162 134,169 C 146,176 155,170 161,181 C 168,192 159,197 159,210 C 159,223 168,228 161,239 C 155,250 146,244 134,251 C 122,258 123,269 110,269 C 97,269 98,258 86,251 C 74,244 65,250 59,239 C 52,228 61,223 61,210 C 61,197 52,192 59,181 C 65,170 74,176 86,169 C 98,162 97,151 110,151 Z" />
                    <g clipPath={`url(#cBlob${uid})`} className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[110px_210px]">
                        <circle className="scale-0 group-hover:scale-200 opacity-0 group-hover:opacity-100 transition-all duration-500 origin-[110px_210px]" cx="110" cy="210" r="60" fill={`url(#gBlobH${uid})`} />
                        <circle className="scale-0 group-hover:scale-200 opacity-0 group-hover:opacity-100 transition-all duration-500 origin-[110px_210px] pointer-events-none" cx="110" cy="210" r="60" fill={`url(#patHive${uid})`} />
                    </g>
                    <text className="origin-[110px_210px] font-roboto text-[13px] font-semibold fill-white text-center pointer-events-none transition-transform duration-[350ms] group-hover:scale-[1.08]">
                        <tspan x="110" y="205" textAnchor="middle">{t('blob1')}</tspan>
                        <tspan x="110" dy="17" textAnchor="middle">{t('blob2')}</tspan>
                    </text>
                    <AnimatedShapePop x={110} y={210} delay={1.2} />
                </g>

                <g className="group cursor-pointer" filter={`url(#shCirc${uid})`}>
                    <AnimatedConnectLine x1={250} y1={210} x2={390} y2={210} delay={2.4} />
                    <circle className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[390px_210px]" fill={`url(#gCirc${uid})`} cx="390" cy="210" r="64" />
                    <circle className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[390px_210px] pointer-events-none" fill={`url(#patDots${uid})`} cx="390" cy="210" r="64" />
                    <g clipPath={`url(#cCirc${uid})`} className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[390px_210px]">
                        <circle className="scale-0 group-hover:scale-200 opacity-0 group-hover:opacity-100 transition-all duration-500 origin-[390px_210px]" cx="390" cy="210" r="64" fill={`url(#gCircH${uid})`} />
                        <circle className="scale-0 group-hover:scale-200 opacity-0 group-hover:opacity-100 transition-all duration-500 origin-[390px_210px] pointer-events-none" cx="390" cy="210" r="64" fill={`url(#patDots${uid})`} />
                    </g>
                    <text className="origin-[390px_210px] font-roboto text-[13px] font-semibold fill-white text-center pointer-events-none transition-transform duration-[350ms] group-hover:scale-[1.08]">
                        <tspan x="390" y="205" textAnchor="middle">{t('circ1')}</tspan>
                        <tspan x="390" dy="17" textAnchor="middle">{t('circ2')}</tspan>
                    </text>
                    <AnimatedShapePop x={390} y={210} delay={2.4} />
                </g>

                <g className="group cursor-pointer" filter={`url(#shDiam${uid})`}>
                    <AnimatedConnectLine x1={250} y1={210} x2={250} y2={326} delay={3.6} />
                    <path className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[250px_326px]" fill={`url(#gDiam${uid})`} d="M 234.4,266 Q 250,250 265.6,266 L 310.4,310.4 Q 326,326 310.4,341.6 L 265.6,386 Q 250,402 234.4,386 L 189.6,341.6 Q 174,326 189.6,310.4 Z" />
                    <path className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[250px_326px] pointer-events-none" fill={`url(#patGrid${uid})`} d="M 234.4,266 Q 250,250 265.6,266 L 310.4,310.4 Q 326,326 310.4,341.6 L 265.6,386 Q 250,402 234.4,386 L 189.6,341.6 Q 174,326 189.6,310.4 Z" />
                    <g clipPath={`url(#cDiam${uid})`} className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[250px_326px]">
                        <circle className="scale-0 group-hover:scale-200 opacity-0 group-hover:opacity-100 transition-all duration-500 origin-[250px_326px]" cx="250" cy="326" r="80" fill={`url(#gDiamH${uid})`} />
                        <circle className="scale-0 group-hover:scale-200 opacity-0 group-hover:opacity-100 transition-all duration-500 origin-[250px_326px] pointer-events-none" cx="250" cy="326" r="80" fill={`url(#patGrid${uid})`} />
                    </g>
                    <text className="origin-[250px_326px] font-roboto text-[13px] font-semibold fill-white text-center pointer-events-none transition-transform duration-[350ms] group-hover:scale-[1.08]">
                        <tspan x="250" y="320" textAnchor="middle">{t('diam1')}</tspan>
                        <tspan x="250" dy="17" textAnchor="middle">{t('diam2')}</tspan>
                    </text>
                    <AnimatedShapePop x={250} y={326} delay={3.6} />
                </g>

                {/* Darsy logo — center hub */}
                <g id={`logo${uid}`} transform="translate(233,193)">
                    <rect x="0" y="0" width="34" height="34" rx="9" fill="white" filter={`url(#shHex${uid})`} opacity="0.95" />
                    <defs>
                        <linearGradient id={`lgD${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3aaa6a" />
                            <stop offset="100%" stopColor="#1a6640" />
                        </linearGradient>
                    </defs>
                    {/* Actual Darsy SVG logo — paths mapped to 30×30 with 2px padding */}
                    <g transform="translate(2,32) scale(0.005,-0.005)" fill={`url(#lgD${uid})`} stroke="none">
                        <path d="M2737 5989 c-1019 -90 -1928 -698 -2399 -1604 -215 -416 -322 -835 -335 -1320 l-6 -220 109 -104 c339 -325 739 -559 1174 -690 99 -30 390 -94 397 -87 2 1 -2 63 -8 137 -33 399 43 894 197 1286 268 682 784 1252 1431 1581 257 130 479 209 749 266 226 47 360 60 631 60 138 0 249 4 247 8 -10 16 -234 179 -328 238 -484 304 -1045 464 -1616 459 -85 -1 -194 -5 -243 -10z"/>
                        <path d="M4480 5144 c-19 -2 -86 -9 -147 -15 -62 -6 -113 -15 -113 -19 0 -5 17 -19 37 -31 21 -13 82 -59 135 -101 361 -287 628 -617 828 -1023 164 -330 253 -629 296 -986 19 -160 22 -498 5 -649 -73 -651 -330 -1228 -762 -1710 l-94 -105 55 39 c210 149 510 435 651 621 366 482 570 1011 618 1608 68 817 -220 1644 -784 2261 l-71 76 -109 15 c-107 15 -474 27 -545 19z"/>
                        <path d="M3511 4631 c-313 -176 -428 -245 -438 -265 -12 -23 -5 -71 77 -488 50 -255 96 -478 101 -496 6 -18 21 -39 32 -46 26 -16 976 -131 1011 -122 13 3 30 16 38 28 37 58 411 886 411 910 0 15 -8 37 -19 49 -10 12 -176 168 -368 345 -327 304 -351 324 -385 323 -28 0 -131 -53 -460 -238z m667 -317 c122 -113 222 -212 222 -220 0 -23 -239 -536 -259 -557 -17 -17 -29 -16 -317 18 -184 22 -304 41 -312 48 -18 18 -127 576 -119 607 5 20 57 53 259 167 139 77 264 142 278 142 20 1 75 -45 248 -205z"/>
                        <path d="M2686 4349 c-161 -156 -274 -290 -394 -467 -62 -91 -74 -116 -66 -130 19 -31 187 -163 324 -254 121 -80 467 -265 477 -254 3 2 0 13 -5 23 -23 43 -95 298 -122 433 -43 214 -52 300 -59 559 l-6 235 -149 -145z"/>
                        <path d="M4971 3938 c-91 -320 -266 -668 -473 -945 -607 -812 -1577 -1265 -2575 -1203 -683 42 -1304 297 -1813 743 -41 36 -77 64 -79 62 -16 -17 70 -386 134 -575 322 -940 1110 -1669 2075 -1921 487 -127 1016 -128 1505 -2 204 52 236 65 358 146 695 457 1160 1206 1261 2027 61 500 -6 992 -198 1453 -37 91 -111 243 -144 297 l-19 30 -32 -112z"/>
                        <path d="M2087 3522 c-133 -283 -216 -571 -258 -897 -15 -113 -17 -550 -3 -630 l9 -50 120 -9 c146 -10 419 5 595 34 453 74 883 257 1245 528 128 96 294 244 370 330 l47 52 -149 0 c-656 0 -1356 261 -1869 697 -28 23 -53 43 -56 43 -3 0 -26 -44 -51 -98z"/>
                    </g>
                </g>

                {[
                    { x: 15, y: 500, color: "#b07040", shirt: "#8b5530", skin: "#d4a06a", hair: "#2d1a0e" },
                    { x: 95, y: 502, color: "#e05535", shirt: "#b83820", skin: "#f4b090", hair: "#8b1a10" },
                    { x: 196, y: 497, color: "#c88830", shirt: "#8a5518", skin: "#e0a860", hair: "#3d1f0a" },
                    { x: 308, y: 502, color: "#5a8a6a", shirt: "#3a6048", skin: "#90c0a0", hair: "#1e3826" },
                    { x: 435, y: 500, color: "#4a6e9a", shirt: "#2a4e7a", skin: "#a0c0d8", hair: "#1a2f48" },
                ].map((av, i) => (
                    <g key={i} transform={`translate(${av.x},${av.y})`} className="drop-shadow-[0_3px_8px_rgba(0,0,0,0.18)]">
                        <circle cx="25" cy="25" r="25" fill={av.color} />
                        <ellipse cx="25" cy="42" rx="14" ry="10" fill={av.shirt} />
                        <circle cx="25" cy="20" r="9" fill={av.skin} />
                        <ellipse cx="25" cy="12" rx="10" ry="7" fill={av.hair} />
                        <circle cx="25" cy="25" r="25" fill="none" stroke="white" strokeWidth="3" />
                    </g>
                ))}
            </svg>
        </div>
    );
}
