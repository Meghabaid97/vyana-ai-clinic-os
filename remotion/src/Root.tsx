import React from "react";
import { Composition } from "remotion";
import { MainVideo, Part1, Part2, Part3, Part4 } from "./MainVideo";
import { sec, SCENE_SEC } from "./theme";

const D = sec(SCENE_SEC);
const PART3 = D * 3;
const PART4 = D * 4;
const TOTAL = D * 13; // 13 scenes

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="main"  component={MainVideo} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />
    <Composition id="part1" component={Part1} durationInFrames={PART3} fps={30} width={1920} height={1080} />
    <Composition id="part2" component={Part2} durationInFrames={PART3} fps={30} width={1920} height={1080} />
    <Composition id="part3" component={Part3} durationInFrames={PART3} fps={30} width={1920} height={1080} />
    <Composition id="part4" component={Part4} durationInFrames={PART4} fps={30} width={1920} height={1080} />
  </>
);
