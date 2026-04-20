import React from "react";
import { AbsoluteFill, Series, Audio, staticFile } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { COLORS, sec, SCENE_SEC } from "./theme";
import { K1Hook } from "./scenes/K1Hook";
import { K2Problem } from "./scenes/K2Problem";
import { K3Founder } from "./scenes/K3Founder";
import { K4Reveal } from "./scenes/K4Reveal";
import { K5Home, K6Records, K7Trends, K8Rx, K9Briefing, K10Share, K11Timeline } from "./scenes/Features";
import { K12Close } from "./scenes/K12Close";

loadInter("normal", { weights: ["400", "500", "600", "700", "800"], subsets: ["latin"] });
loadFraunces("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

const D = sec(SCENE_SEC); // 450 frames per scene

export const MainVideo: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.cream, fontFamily: "Inter, sans-serif" }}>
    <Series>
      <Series.Sequence durationInFrames={D}><K1Hook /></Series.Sequence>
      <Series.Sequence durationInFrames={D}><K2Problem /></Series.Sequence>
      <Series.Sequence durationInFrames={D}><K3Founder /></Series.Sequence>
      <Series.Sequence durationInFrames={D}><K4Reveal /></Series.Sequence>
      <Series.Sequence durationInFrames={D}><K5Home /></Series.Sequence>
      <Series.Sequence durationInFrames={D}><K6Records /></Series.Sequence>
      <Series.Sequence durationInFrames={D}><K7Trends /></Series.Sequence>
      <Series.Sequence durationInFrames={D}><K8Rx /></Series.Sequence>
      <Series.Sequence durationInFrames={D}><K9Briefing /></Series.Sequence>
      <Series.Sequence durationInFrames={D}><K10Share /></Series.Sequence>
      <Series.Sequence durationInFrames={D}><K11Timeline /></Series.Sequence>
      <Series.Sequence durationInFrames={D}><K12Close /></Series.Sequence>
    </Series>
  </AbsoluteFill>
);

// 4-part chunks for chunked rendering (3 scenes per chunk = 1350 frames = 45s)
const Chunk: React.FC<{ start: number; count: number }> = ({ start, count }) => {
  const all = [K1Hook, K2Problem, K3Founder, K4Reveal, K5Home, K6Records, K7Trends, K8Rx, K9Briefing, K10Share, K11Timeline, K12Close];
  const slice = all.slice(start, start + count);
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
