import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { COLORS, sec, SCENES } from "./theme";
import { GrainTexture } from "./components/GrainTexture";
import { S3Story } from "./scenes/S3Story";
import { S4Intro } from "./scenes/S4Intro";
import { S5YourStory } from "./scenes/S5YourStory";
import { S6Upload } from "./scenes/S6Upload";
import { S7Trends } from "./scenes/S7Trends";
import { S8Rx } from "./scenes/S8Rx";
import { S9Share } from "./scenes/S9Share";
import { S10Emergency } from "./scenes/S10Emergency";
import { S11Close } from "./scenes/S11Close";

loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
loadFraunces("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

export const DemoPart: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.bg, fontFamily: "Inter, sans-serif" }}>
    <Series>
      <Series.Sequence durationInFrames={sec(SCENES.story)}><S3Story /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.intro)}><S4Intro /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.yourStory)}><S5YourStory /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.upload)}><S6Upload /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.trends)}><S7Trends /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.rx)}><S8Rx /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.share)}><S9Share /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.emergency)}><S10Emergency /></Series.Sequence>
      <Series.Sequence durationInFrames={sec(SCENES.close)}><S11Close /></Series.Sequence>
    </Series>
    <GrainTexture />
  </AbsoluteFill>
);
