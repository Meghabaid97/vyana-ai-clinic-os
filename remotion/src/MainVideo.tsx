import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { COLORS, sec, SCENE_SEC } from "./theme";
import { S0Collage } from "./scenes/S0Collage";
import { K4Reveal } from "./scenes/K4Reveal";
import {
  K5Home, K6Records, K7Trends, K8Rx, K9Briefing, K9bClaim,
  K10Share, K11Timeline, K11bEmergency,
} from "./scenes/Features";
import { K12Close } from "./scenes/K12Close";

loadInter("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });
loadFraunces("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

const D = sec(SCENE_SEC); // 420 frames per scene

// Open with a billion-stories collage (the "why"), then the brand reveal,
// then 9 live mock app screens, then close. 12 scenes × 14s = 168s.
const SCENES = [
  S0Collage, K4Reveal,
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

// Chunked rendering — 3 scenes per chunk = 1260 frames = 42s. 12 scenes → 4 chunks of 3.
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

export const Part1: React.FC = () => <Chunk start={0} count={3} />;
export const Part2: React.FC = () => <Chunk start={3} count={3} />;
export const Part3: React.FC = () => <Chunk start={6} count={3} />;
export const Part4: React.FC = () => <Chunk start={9} count={3} />;
export const Part5: React.FC = () => <Chunk start={0} count={0} />; // unused, kept for stable Root composition list
