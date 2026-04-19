import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { COLORS } from "./theme";
import { GrainTexture } from "./components/GrainTexture";
import { S0Collage } from "./scenes/S0Collage";

loadInter("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
loadFraunces("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

export const CollagePart: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.bg, fontFamily: "Inter, sans-serif" }}>
    <S0Collage />
    <GrainTexture />
  </AbsoluteFill>
);
