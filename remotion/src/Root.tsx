import React from "react";
import { Composition } from "remotion";
import { MainVideo, Part1, Part2, Part3, Part4 } from "./MainVideo";
import { TOTAL_FRAMES, sec, SCENE_SEC } from "./theme";

const PART = sec(SCENE_SEC) * 3; // 1350 frames per part

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="main"  component={MainVideo} durationInFrames={TOTAL_FRAMES} fps={30} width={1920} height={1080} />
    <Composition id="part1" component={Part1} durationInFrames={PART} fps={30} width={1920} height={1080} />
    <Composition id="part2" component={Part2} durationInFrames={PART} fps={30} width={1920} height={1080} />
    <Composition id="part3" component={Part3} durationInFrames={PART} fps={30} width={1920} height={1080} />
    <Composition id="part4" component={Part4} durationInFrames={PART} fps={30} width={1920} height={1080} />
  </>
);
