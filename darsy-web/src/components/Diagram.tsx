"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export function Diagram() {
    const t = useTranslations('Diagram');
    const fanLinesRef = useRef<SVGPathElement[]>([]);
    const [randomDelays, setRandomDelays] = useState<number[]>([]);

    useEffect(() => {
        // Generate random delays for each fan line to make them fill randomly
        const delays = Array.from({ length: 9 }, () => Math.random() * 0.8);
        setRandomDelays(delays);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        fanLinesRef.current.forEach((el) => {
                            if (el) el.classList.add("visible");
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
                    <radialGradient id="gHex" cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor="#7ddba8" />
                        <stop offset="100%" stopColor="#3aaa6a" />
                    </radialGradient>
                    <radialGradient id="gHexH" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#b8f5d8" />
                        <stop offset="100%" stopColor="#5acc88" />
                    </radialGradient>
                    <radialGradient id="gBlob" cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor="#1e3d2c" />
                        <stop offset="100%" stopColor="#0a1810" />
                    </radialGradient>
                    <radialGradient id="gBlobH" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#3d7a56" />
                        <stop offset="100%" stopColor="#1e3d2c" />
                    </radialGradient>
                    <radialGradient id="gCirc" cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor="#2d6044" />
                        <stop offset="100%" stopColor="#142a1e" />
                    </radialGradient>
                    <radialGradient id="gCircH" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#4a9a6e" />
                        <stop offset="100%" stopColor="#2d6044" />
                    </radialGradient>
                    <radialGradient id="gDiam" cx="50%" cy="50%" r="60%">
                        <stop offset="0%" stopColor="#55c988" />
                        <stop offset="100%" stopColor="#28845a" />
                    </radialGradient>
                    <radialGradient id="gDiamH" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#88f0b8" />
                        <stop offset="100%" stopColor="#44aa78" />
                    </radialGradient>

                    <linearGradient id="fanG" x1="0" y1="402" x2="0" y2="565" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
                        <stop offset="65%" stopColor="#4ade80" stopOpacity="0.65" />
                        <stop offset="100%" stopColor="#86efac" stopOpacity="0" />
                    </linearGradient>

                    <filter id="shHex" x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#1a5c38" floodOpacity="0.35" />
                    </filter>
                    <filter id="shBlob" x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#040f08" floodOpacity="0.5" />
                    </filter>
                    <filter id="shCirc" x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0a2016" floodOpacity="0.45" />
                    </filter>
                    <filter id="shDiam" x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="10" stdDeviation="13" floodColor="#0a2a16" floodOpacity="0.4" />
                    </filter>

                    <filter id="fanGlow" x="-30%" y="-5%" width="160%" height="120%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
                        <feMerge>
                            <feMergeNode in="b" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <clipPath id="cHex">
                        <path d="M 239.6,24 Q 250,18 260.4,24 L 302,48 Q 312.4,54 312.4,66 L 312.4,114 Q 312.4,126 302,132 L 260.4,156 Q 250,162 239.6,156 L 198,132 Q 187.6,126 187.6,114 L 187.6,66 Q 187.6,54 198,48 Z" />
                    </clipPath>
                    <clipPath id="cBlob">
                        <path d="M 110,151 C 123,151 122,162 134,169 C 146,176 155,170 161,181 C 168,192 159,197 159,210 C 159,223 168,228 161,239 C 155,250 146,244 134,251 C 122,258 123,269 110,269 C 97,269 98,258 86,251 C 74,244 65,250 59,239 C 52,228 61,223 61,210 C 61,197 52,192 59,181 C 65,170 74,176 86,169 C 98,162 97,151 110,151 Z" />
                    </clipPath>
                    <clipPath id="cCirc">
                        <circle cx="390" cy="210" r="64" />
                    </clipPath>
                    <clipPath id="cDiam">
                        <path d="M 234.4,266 Q 250,250 265.6,266 L 310.4,310.4 Q 326,326 310.4,341.6 L 265.6,386 Q 250,402 234.4,386 L 189.6,341.6 Q 174,326 189.6,310.4 Z" />
                    </clipPath>
                </defs>

                {/* Fan Lines (Trails) */}
                <g filter="url(#fanGlow)">
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
                            className="fan-line fill-none stroke-linecap-round stroke-[8px]"
                            stroke="url(#fanG)"
                            d={d}
                            style={{
                                strokeDasharray: 450,
                                strokeDashoffset: 450,
                                animationDelay: `${randomDelays[i]}s, ${1.8 + (randomDelays[i] || 0)}s`,
                            }}
                        />
                    ))}
                </g>

                {/* Main Shapes */}
                <g className="group cursor-pointer" filter="url(#shHex)">
                    <line className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 stroke-[#3fac72] stroke-[3px] stroke-linecap-round" x1="250" y1="162" x2="250" y2="193" />
                    <path className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[250px_90px]" fill="url(#gHex)" d="M 239.6,24 Q 250,18 260.4,24 L 302,48 Q 312.4,54 312.4,66 L 312.4,114 Q 312.4,126 302,132 L 260.4,156 Q 250,162 239.6,156 L 198,132 Q 187.6,126 187.6,114 L 187.6,66 Q 187.6,54 198,48 Z" />
                    <g clipPath="url(#cHex)" className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[250px_90px]">
                        <circle className="scale-0 group-hover:scale-200 opacity-0 group-hover:opacity-100 transition-all duration-500 origin-[250px_90px]" cx="250" cy="90" r="60" fill="url(#gHexH)" />
                    </g>
                    <text className="origin-[250px_90px] font-roboto text-[13px] font-semibold fill-white text-center pointer-events-none transition-transform duration-[350ms] group-hover:scale-[1.08]">
                        <tspan x="250" y="86" textAnchor="middle">{t('hex1')}</tspan>
                        <tspan x="250" dy="17" textAnchor="middle">{t('hex2')}</tspan>
                    </text>
                </g>

                <g className="group cursor-pointer" filter="url(#shBlob)">
                    <line className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 stroke-[#3fac72] stroke-[3px] stroke-linecap-round" x1="161" y1="210" x2="233" y2="210" />
                    <path className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[110px_210px]" fill="url(#gBlob)" d="M 110,151 C 123,151 122,162 134,169 C 146,176 155,170 161,181 C 168,192 159,197 159,210 C 159,223 168,228 161,239 C 155,250 146,244 134,251 C 122,258 123,269 110,269 C 97,269 98,258 86,251 C 74,244 65,250 59,239 C 52,228 61,223 61,210 C 61,197 52,192 59,181 C 65,170 74,176 86,169 C 98,162 97,151 110,151 Z" />
                    <g clipPath="url(#cBlob)" className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[110px_210px]">
                        <circle className="scale-0 group-hover:scale-200 opacity-0 group-hover:opacity-100 transition-all duration-500 origin-[110px_210px]" cx="110" cy="210" r="60" fill="url(#gBlobH)" />
                    </g>
                    <text className="origin-[110px_210px] font-roboto text-[13px] font-semibold fill-white text-center pointer-events-none transition-transform duration-[350ms] group-hover:scale-[1.08]">
                        <tspan x="110" y="205" textAnchor="middle">{t('blob1')}</tspan>
                        <tspan x="110" dy="17" textAnchor="middle">{t('blob2')}</tspan>
                    </text>
                </g>

                <g className="group cursor-pointer" filter="url(#shCirc)">
                    <line className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 stroke-[#3fac72] stroke-[3px] stroke-linecap-round" x1="326" y1="210" x2="267" y2="210" />
                    <circle className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[390px_210px]" fill="url(#gCirc)" cx="390" cy="210" r="64" />
                    <g clipPath="url(#cCirc)" className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[390px_210px]">
                        <circle className="scale-0 group-hover:scale-200 opacity-0 group-hover:opacity-100 transition-all duration-500 origin-[390px_210px]" cx="390" cy="210" r="64" fill="url(#gCircH)" />
                    </g>
                    <text className="origin-[390px_210px] font-roboto text-[13px] font-semibold fill-white text-center pointer-events-none transition-transform duration-[350ms] group-hover:scale-[1.08]">
                        <tspan x="390" y="205" textAnchor="middle">{t('circ1')}</tspan>
                        <tspan x="390" dy="17" textAnchor="middle">{t('circ2')}</tspan>
                    </text>
                </g>

                <g className="group cursor-pointer" filter="url(#shDiam)">
                    <line className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 stroke-[#3fac72] stroke-[3px] stroke-linecap-round" x1="250" y1="250" x2="250" y2="227" />
                    <path className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[250px_326px]" fill="url(#gDiam)" d="M 234.4,266 Q 250,250 265.6,266 L 310.4,310.4 Q 326,326 310.4,341.6 L 265.6,386 Q 250,402 234.4,386 L 189.6,341.6 Q 174,326 189.6,310.4 Z" />
                    <g clipPath="url(#cDiam)" className="transition-transform duration-[350ms] group-hover:scale-[1.08] origin-[250px_326px]">
                        <circle className="scale-0 group-hover:scale-200 opacity-0 group-hover:opacity-100 transition-all duration-500 origin-[250px_326px]" cx="250" cy="326" r="80" fill="url(#gDiamH)" />
                    </g>
                    <text className="origin-[250px_326px] font-roboto text-[13px] font-semibold fill-white text-center pointer-events-none transition-transform duration-[350ms] group-hover:scale-[1.08]">
                        <tspan x="250" y="320" textAnchor="middle">{t('diam1')}</tspan>
                        <tspan x="250" dy="17" textAnchor="middle">{t('diam2')}</tspan>
                    </text>
                </g>

                <g id="snowflake" transform="translate(233,193)">
                    <circle cx="17" cy="17" r="17" fill="#e4e8e3" stroke="rgba(26,58,42,0.13)" strokeWidth="1.5" className="origin-[17px_17px] shadow-[0_2px_6px_rgba(0,0,0,0.07)]" />
                    <line x1="17" y1="5" x2="17" y2="29" stroke="#3fac72" strokeWidth="2" strokeLinecap="round" />
                    <line x1="5" y1="17" x2="29" y2="17" stroke="#3fac72" strokeWidth="2" strokeLinecap="round" />
                    <line x1="8.5" y1="8.5" x2="25.5" y2="25.5" stroke="#3fac72" strokeWidth="2" strokeLinecap="round" />
                    <line x1="25.5" y1="8.5" x2="8.5" y2="25.5" stroke="#3fac72" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="17" cy="6" r="2" fill="#3fac72" />
                    <circle cx="17" cy="28" r="2" fill="#3fac72" />
                    <circle cx="6" cy="17" r="2" fill="#3fac72" />
                    <circle cx="28" cy="17" r="2" fill="#3fac72" />
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
