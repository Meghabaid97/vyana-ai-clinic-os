import React from "react";
import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { CollagePart } from "./CollagePart";
import { DemoPart } from "./DemoPart";

// Full: 14+14+12+14+14+12+15+13+12+6 = 126s @ 30fps = 3780
// Collage: 14s = 420
// Demo: 112s = 3360
export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="main" component={MainVideo} durationInFrames={3780} fps={30} width={1920} height={1080} />
    <Composition id="collage" component={CollagePart} durationInFrames={420} fps={30} width={1920} height={1080} />
    <Composition id="demo" component={DemoPart} durationInFrames={3360} fps={30} width={1920} height={1080} />
  </>
);
