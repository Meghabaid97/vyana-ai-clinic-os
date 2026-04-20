import React from "react";
import { Composition } from "remotion";
import { MainVideo, Part1, Part2, Part3, Part4 } from "./MainVideo";
import { sec } from "./theme";

// Per-scene durations (must mirror MainVideo SCENES array)
const DURS = [12, 12, 14, 13, 13, 13, 13, 17, 17, 16, 16, 16, 16];
const sumSec = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

const PART1 = sec(sumSec(DURS.slice(0, 3)));   // 38s
const PART2 = sec(sumSec(DURS.slice(3, 7)));   // 52s
const PART3 = sec(sumSec(DURS.slice(7, 9)));   // 34s
const PART4 = sec(sumSec(DURS.slice(9, 13)));  // 64s
const TOTAL = sec(sumSec(DURS));               // 188s

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="main"  component={MainVideo} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />
    <Composition id="part1" component={Part1} durationInFrames={PART1} fps={30} width={1920} height={1080} />
    <Composition id="part2" component={Part2} durationInFrames={PART2} fps={30} width={1920} height={1080} />
    <Composition id="part3" component={Part3} durationInFrames={PART3} fps={30} width={1920} height={1080} />
    <Composition id="part4" component={Part4} durationInFrames={PART4} fps={30} width={1920} height={1080} />
  </>
);
