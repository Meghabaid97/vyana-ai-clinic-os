import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { COLORS, sec, SCENE_SEC } from "./theme";
import { S0Collage } from "./scenes/S0Collage";
import { S0bFounder } from "./scenes/S0bFounder";
import { K4Reveal } from "./scenes/K4Reveal";
import {
  K5Home, K6Records, K7Trends, K8Rx, K9Briefing, K9bClaim,
  K10Share, K11Timeline, K11bEmergency,
} from "./scenes/Features";
import { K12Close } from "./scenes/K12Close";

loadInter("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });
loadFraunces("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

const D = sec(SCENE_SEC); // 420 frames per scene

// 13 scenes × 14s = 182s
// Open: collage (the everyday struggle) → founder beat (why we built this) → brand reveal
// Middle: 9 product mocks
// Close: declarative pitch line + Vyana
const SCENES = [
  S0Collage, S0bFounder, K4Reveal,
  K5Home, K6Records, K7Trends, K8Rx,
  K9Briefing, K9bClaim, K10Share, K11Timeline, K11bEmergency,
  K12Close,
];

export const MainVideo: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.cream, fontFamily: "Inter, sans-serif" }}>
    <Series>
      {SCENES.map((Comp, i) => (
        <Series.Sequence key={i} durationInFrames={D}><Comp /></Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

// Chunked rendering — keeps each render under sandbox timeout.
// 13 scenes split as 3 + 3 + 3 + 4 across parts 1-4.
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

export const Part1: React.FC = () => <Chunk start={0} count={3} />;   // S0, S0b, K4
export const Part2: React.FC = () => <Chunk start={3} count={3} />;   // K5, K6, K7
export const Part3: React.FC = () => <Chunk start={6} count={3} />;   // K8, K9, K9b
export const Part4: React.FC = () => <Chunk start={9} count={4} />;   // K10, K11, K11b, K12
export const Part5: React.FC = () => <Chunk start={0} count={0} />;   // unused, kept for stable Root composition list
