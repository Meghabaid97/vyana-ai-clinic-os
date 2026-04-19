import React from "react";
import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// 161s @ 30fps = 4830
export const RemotionRoot: React.FC = () => (
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={4830}
    fps={30}
    width={1920}
    height={1080}
  />
);
