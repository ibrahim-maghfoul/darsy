"use client";

import { FileText, Play, ClipboardList, Search } from "lucide-react";
import "./design-test.css";

/* ─── HERO CARD (inspired by the screenshot) ──────────────── */
function HeroCard() {
  return (
    <div className="hero-card-wrapper">
      {/* inline SVG clipPath — used by the card to cut the notch */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <clipPath id="heroNotch" clipPathUnits="objectBoundingBox">
            {/*
              Rounded rect with a pill-shaped notch at top-center.
              objectBoundingBox means 0–1 coordinates.
              Notch: ~20% wide centered (0.40 → 0.60), ~0.10 deep
            */}
            <path d="
              M 0.015,0.045
              Q 0,0.045 0,0.09
              L 0,0.955
              Q 0,1 0.015,1
              L 0.985,1
              Q 1,1 1,0.955
              L 1,0.09
              Q 1,0.045 0.985,0.045
              L 0.60,0.045
              C 0.59,0.045 0.58,0 0.565,0
              L 0.435,0
              C 0.42,0 0.41,0.045 0.40,0.045
              Z
            " />
          </clipPath>
        </defs>
      </svg>

      {/* resource pill — floats in the notch */}
      <div className="hero-resource-pill">
        <div className="hero-resource-pill-inner">
          <button className="resource-icon" title="PDF">
            <FileText size={16} />
          </button>
          <button className="resource-icon" title="Video">
            <Play size={16} />
          </button>
          <button className="resource-icon" title="Exercise">
            <ClipboardList size={16} />
          </button>
          <button className="resource-icon" title="Resources">
            <Search size={16} />
          </button>
        </div>
      </div>

      <div className="hero-card">
        <div className="hero-card-texture" />
      </div>
    </div>
  );
}

/* ─── PAGE ────────────────────────────────────── */
export default function DesignTestPage() {
  return (
    <main className="design-test-page">
      <div className="dt-header">
        <h1>Design Test</h1>
        <p>Testing news card designs — pick what you like.</p>
      </div>

      <section className="dt-section">
        <h2 className="dt-section-title">Hero Card</h2>
        <HeroCard />
      </section>
    </main>
  );
}
