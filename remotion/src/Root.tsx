import React from "react";
import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// 14+14+12+14+14+12+15+13+12+6 = 126s @ 30fps = 3780
export const RemotionRoot: React.FC = () => (
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={3780}
    fps={30}
    width={1920}
    height={1080}
  />
);
