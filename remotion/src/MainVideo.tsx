import React from "react";
import { AbsoluteFill, Audio, Series, staticFile } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { COLORS, sec, SCENES } from "./theme";
import { GrainTexture } from "./components/GrainTexture";
import { S1Hook } from "./scenes/S1Hook";
import { S2Chaos } from "./scenes/S2Chaos";
import { S3Clinic } from "./scenes/S3Clinic";
import { S4Emergency } from "./scenes/S4Emergency";
import { S5Intro } from "./scenes/S5Intro";
import { S6DemoUpload } from "./scenes/S6DemoUpload";
import { S7DemoTimeline } from "./scenes/S7DemoTimeline";
import { S8DemoRx } from "./scenes/S8DemoRx";
import { S9DemoShare } from "./scenes/S9DemoShare";
import { S10Promise } from "./scenes/S10Promise";
import { S11Close } from "./scenes/S11Close";

loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
loadFraunces("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

const VO = (name: string) => {
  try { return staticFile(`audio/${name}.mp3`); } catch { return null; }
};

const voScene: { key: keyof typeof SCENES; file: string }[] = [
  { key: "hook", file: "s1" },
  { key: "chaos", file: "s2" },
  { key: "clinic", file: "s3" },
  { key: "emergency", file: "s4" },
  { key: "intro", file: "s5" },
  { key: "demoUpload", file: "s6" },
  { key: "demoTimeline", file: "s7" },
  { key: "demoRx", file: "s8" },
  { key: "demoShare", file: "s9" },
  { key: "promise", file: "s10" },
  { key: "close", file: "s11" },
];

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: COLORS.bg, fontFamily: "Inter, sans-serif" }}>
      <Series>
        <Series.Sequence durationInFrames={sec(SCENES.hook)}>
          <S1Hook />
          {VO("s1") && <Audio src={VO("s1")!} volume={0.95} />}
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(SCENES.chaos)}>
          <S2Chaos />
          {VO("s2") && <Audio src={VO("s2")!} volume={0.95} />}
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(SCENES.clinic)}>
          <S3Clinic />
          {VO("s3") && <Audio src={VO("s3")!} volume={0.95} />}
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(SCENES.emergency)}>
          <S4Emergency />
          {VO("s4") && <Audio src={VO("s4")!} volume={0.95} />}
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(SCENES.intro)}>
          <S5Intro />
          {VO("s5") && <Audio src={VO("s5")!} volume={0.95} />}
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(SCENES.demoUpload)}>
          <S6DemoUpload />
          {VO("s6") && <Audio src={VO("s6")!} volume={0.95} />}
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(SCENES.demoTimeline)}>
          <S7DemoTimeline />
          {VO("s7") && <Audio src={VO("s7")!} volume={0.95} />}
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(SCENES.demoRx)}>
          <S8DemoRx />
          {VO("s8") && <Audio src={VO("s8")!} volume={0.95} />}
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(SCENES.demoShare)}>
          <S9DemoShare />
          {VO("s9") && <Audio src={VO("s9")!} volume={0.95} />}
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(SCENES.promise)}>
          <S10Promise />
          {VO("s10") && <Audio src={VO("s10")!} volume={0.95} />}
        </Series.Sequence>
        <Series.Sequence durationInFrames={sec(SCENES.close)}>
          <S11Close />
          {VO("s11") && <Audio src={VO("s11")!} volume={0.95} />}
        </Series.Sequence>
      </Series>
      <GrainTexture />
    </AbsoluteFill>
  );
};
