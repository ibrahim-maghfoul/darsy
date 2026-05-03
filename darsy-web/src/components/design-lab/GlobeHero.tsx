"use client";

import { GlobeSphere } from "./GlobeSphere";

export function GlobeHero() {
  return (
    <div
      className="relative h-screen w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #0e2418 0%, #06120c 60%, #02080a 100%)",
      }}
    >
      <GlobeSphere className="absolute inset-0 z-10" />

      {/* Hero copy */}
      <div className="absolute top-1/4 left-1/2 z-30 -translate-x-1/2 text-center px-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300/70 mb-3">
          A Global Platform
        </div>
        <h1 className="text-[clamp(40px,7vw,84px)] font-bold tracking-[-0.03em] leading-[1.05]">
          Connect <span className="text-emerald-400">users</span> across
          <br /> every corner of the world
        </h1>
        <p className="mt-5 text-sm md:text-base text-white/55 max-w-xl mx-auto leading-relaxed">
          One platform. Every continent. Real-time learning that travels with
          your students.
        </p>
      </div>

      {/* Bottom-edge fade */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, #06120c 90%)",
        }}
      />
    </div>
  );
}
