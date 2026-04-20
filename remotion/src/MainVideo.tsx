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

// Per-scene durations in seconds. Back-half feature mocks (Briefing, Claim, Share,
// Timeline, Emergency) get extra time so their wizards/checklists land clearly.
// Total: 12+12+14 + 13+13+13+13 + 17+17+16+16+16 + 16 = 188s. Music bed loops to cover.
const SCENES: Array<{ Comp: React.FC; sec: number }> = [
  { Comp: S0Collage,    sec: 12 },
  { Comp: S0bFounder,   sec: 12 },
  { Comp: K4Reveal,     sec: 14 },
  { Comp: K5Home,       sec: 13 },
  { Comp: K6Records,    sec: 13 },
  { Comp: K7Trends,     sec: 13 },
  { Comp: K8Rx,         sec: 13 },
  { Comp: K9Briefing,   sec: 17 },
  { Comp: K9bClaim,     sec: 17 },
  { Comp: K10Share,     sec: 16 },
  { Comp: K11Timeline,  sec: 16 },
  { Comp: K11bEmergency,sec: 16 },
  { Comp: K12Close,     sec: 16 },
];

export const MainVideo: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.cream, fontFamily: "Inter, sans-serif" }}>
    <Series>
      {SCENES.map(({ Comp, sec: s }, i) => (
        <Series.Sequence key={i} durationInFrames={sec(s)}><Comp /></Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

// Chunked rendering — keeps each render under sandbox timeout.
const Chunk: React.FC<{ start: number; count: number }> = ({ start, count }) => {
  const slice = SCENES.slice(start, start + count);
  return (
    <AbsoluteFill style={{ background: COLORS.cream, fontFamily: "Inter, sans-serif" }}>
      <Series>
        {slice.map(({ Comp, sec: s }, i) => (
          <Series.Sequence key={i} durationInFrames={sec(s)}><Comp /></Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};

export const Part1: React.FC = () => <Chunk start={0} count={3} />;   // S0, S0b, K4
export const Part2: React.FC = () => <Chunk start={3} count={4} />;   // K5, K6, K7, K8
export const Part3: React.FC = () => <Chunk start={7} count={2} />;   // K9, K9b (the slow wizards)
export const Part4: React.FC = () => <Chunk start={9} count={4} />;   // K10, K11, K11b, K12
export const Part5: React.FC = () => <Chunk start={0} count={0} />;   // unused, kept for stable Root composition list
