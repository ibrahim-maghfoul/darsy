import React from "react";
import { Sequence, useCurrentFrame } from "remotion";
import { s } from "./constants";

import { Scene01_TextReveal } from "./scenes/Scene01_TextReveal";
import { Scene02_DNAHelix } from "./scenes/Scene02_DNAHelix";
import { Scene05_LogicGrid } from "./scenes/Scene05_LogicGrid";
import { Scene07_GreenMorph } from "./scenes/Scene07_GreenMorph";
import { Scene09_Devices } from "./scenes/Scene09_Devices";
import { Scene11_WorldBurst } from "./scenes/Scene11_WorldBurst";
import { Scene12_SMS } from "./scenes/Scene12_SMS";
import { Scene14_Train } from "./scenes/Scene14_Train";
import { Scene15_AudioWave } from "./scenes/Scene15_AudioWave";
import { Scene16_Billing } from "./scenes/Scene16_Billing";
import { Scene17_LogicBoard } from "./scenes/Scene17_LogicBoard";
import { Scene18_Logo } from "./scenes/Scene18_Logo";

export const ProjectFi: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      {/* SECTION 1 – THE VISION */}
      {/* Scene 01: Text Reveal (0–4s) */}
      <Sequence from={s(0)} durationInFrames={s(4)}>
        <Scene01_TextReveal />
      </Sequence>

      {/* Scenes 02–04: DNA Helix (4–12s) */}
      <Sequence from={s(4)} durationInFrames={s(8)}>
        <Scene02_DNAHelix frame={frame - s(4)} />
      </Sequence>

      {/* SECTION 2 – INFRASTRUCTURE */}
      {/* Scenes 05–06: Logic Grid + Snake (12.5–16s) */}
      <Sequence from={s(12.5)} durationInFrames={s(3.5)}>
        <Scene05_LogicGrid frame={frame - s(12.5)} duration={s(3.5)} />
      </Sequence>

      {/* Scenes 07–08: Green Morph + Arcs (16–22s) */}
      <Sequence from={s(16)} durationInFrames={s(6)}>
        <Scene07_GreenMorph frame={frame - s(16)} duration={s(6)} />
      </Sequence>

      {/* SECTION 3 – DEVICES */}
      {/* Scenes 09–10: Devices + Connection Line (22–27s) */}
      <Sequence from={s(22)} durationInFrames={s(5)}>
        <Scene09_Devices frame={frame - s(22)} duration={s(5)} />
      </Sequence>

      {/* Scene 11: World Burst (27–30s) */}
      <Sequence from={s(27)} durationInFrames={s(3)}>
        <Scene11_WorldBurst frame={frame - s(27)} />
      </Sequence>

      {/* SECTION 4 – REAL-WORLD UTILITY */}
      {/* Scenes 12–13: SMS Pop + Typing Indicator (30–35s) */}
      <Sequence from={s(30)} durationInFrames={s(5)}>
        <Scene12_SMS frame={frame - s(30)} />
      </Sequence>

      {/* Scene 14: The Train (35–39s) */}
      <Sequence from={s(35)} durationInFrames={s(4)}>
        <Scene14_Train frame={frame - s(35)} duration={s(4)} />
      </Sequence>

      {/* Scene 15: Audio Wave (39–42s) */}
      <Sequence from={s(39)} durationInFrames={s(3)}>
        <Scene15_AudioWave frame={frame - s(39)} />
      </Sequence>

      {/* SECTION 5 – COST & RELIABILITY */}
      {/* Scene 16: Billing Loop (42–46s) */}
      <Sequence from={s(42)} durationInFrames={s(4)}>
        <Scene16_Billing frame={frame - s(42)} />
      </Sequence>

      {/* Scene 17: Logic Board (46–55s) */}
      <Sequence from={s(46)} durationInFrames={s(9)}>
        <Scene17_LogicBoard frame={frame - s(46)} duration={s(9)} />
      </Sequence>

      {/* SECTION 6 – THE BRAND */}
      {/* Scenes 18–20: Convergence + Logo + Wordmarks (55–59s) */}
      <Sequence from={s(55)} durationInFrames={s(4)}>
        <Scene18_Logo frame={frame - s(55)} duration={s(4)} />
      </Sequence>
    </div>
  );
};
