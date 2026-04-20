import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { COLORS, sec, SCENE_SEC } from "./theme";
import { K1Hook } from "./scenes/K1Hook";
import { K2Problem } from "./scenes/K2Problem";
import { K3Founder } from "./scenes/K3Founder";
import { K4Reveal } from "./scenes/K4Reveal";
import {
  K5Home, K6Records, K7Trends, K8Rx, K9Briefing, K9bClaim,
  K10Share, K11Timeline, K11bEmergency,
} from "./scenes/Features";
import { K12Close } from "./scenes/K12Close";

loadInter("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });
loadFraunces("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

const D = sec(SCENE_SEC); // 420 frames per scene

const SCENES = [
  K1Hook, K2Problem, K3Founder, K4Reveal,
  K5Home, K6Records, K7Trends, K8Rx,
  K9Briefing, K9bClaim, K10Share, K11Timeline, K11bEmergency,
  K12Close,
];
// 14 scenes total — 14 × 14s = 196s. Music is 180s, we'll trim final mux.

export const MainVideo: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.cream, fontFamily: "Inter, sans-serif" }}>
    <Series>
      {SCENES.map((Comp, i) => (
        <Series.Sequence key={i} durationInFrames={D}><Comp /></Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

// Chunked rendering — 3 scenes per chunk = 1260 frames = 42s. 14 scenes → 5 chunks (3,3,3,3,2).
const Chunk: React.FC<{ start: number; count: number }> = ({ start, count }) => {
  const slice = SCENES.slice(start, start + count);
  return (
    <AbsoluteFill style={{ background: COLORS.cream, fontFamily: "Inter, sans-serif" }}>
      <Series>
        {slice.map((Comp, i) => (
          <Series.Sequence key={i} durationInFrames={D}><Comp /></Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

export const Part1: React.FC = () => <Chunk start={0}  count={3} />;
export const Part2: React.FC = () => <Chunk start={3}  count={3} />;
export const Part3: React.FC = () => <Chunk start={6}  count={3} />;
export const Part4: React.FC = () => <Chunk start={9}  count={3} />;
export const Part5: React.FC = () => <Chunk start={12} count={2} />;
