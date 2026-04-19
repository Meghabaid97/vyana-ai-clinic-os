import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

// Subtle film-grain layer that runs through the whole film for texture
export const GrainTexture: React.FC = () => {
  const frame = useCurrentFrame();
  // Stationary SVG noise but shifted each frame
  const tx = (frame * 7) % 40;
  const ty = (frame * 11) % 40;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity: 0.07,
        mixBlendMode: "multiply",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        backgroundSize: "200px 200px",
        transform: `translate(${tx}px, ${ty}px)`,
      }}
    />
  );
};
