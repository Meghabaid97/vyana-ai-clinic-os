import React from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

// Phone frame holding a real Vyana app screenshot with parallax + bounce-in.
export const PhoneShot: React.FC<{
  shot: string;
  delay?: number;
  rotate?: number;
  scale?: number;
  scrollSpeed?: number;
}> = ({ shot, delay = 0, rotate = 0, scale = 1, scrollSpeed = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - delay, fps,
    config: { damping: 12, stiffness: 110, mass: 0.9 },
  });
  const float = Math.sin(frame / 40) * 8;
  const scroll = scrollSpeed > 0
    ? Math.min(((frame - delay) / fps) * scrollSpeed, 600)
    : 0;

  // Phone dimensions tuned for 1080p hero
  const W = 380, H = 822;
  return (
    <div style={{
      width: W, height: H,
      transform: `scale(${enter * scale}) rotate(${rotate}deg) translateY(${(1 - enter) * 60 + float}px)`,
      opacity: enter,
      filter: "drop-shadow(0 60px 120px rgba(23,21,20,0.32)) drop-shadow(0 20px 40px rgba(23,21,20,0.18))",
    }}>
      <div style={{
        width: "100%", height: "100%",
        borderRadius: 52,
        background: "#0F0E0C",
        padding: 10,
        position: "relative",
      }}>
        {/* Screen */}
        <div style={{
          width: "100%", height: "100%",
          borderRadius: 42, overflow: "hidden",
          background: "#FFFFFF", position: "relative",
        }}>
          <Img src={staticFile(`shots/${shot}.png`)} style={{
            width: "100%", height: "auto", display: "block",
            transform: `translateY(${-scroll}px)`,
            imageRendering: "auto" as any,
          }} />
        </div>
        {/* Notch */}
        <div style={{
          position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)",
          width: 110, height: 28, background: "#0F0E0C", borderRadius: 14,
        }} />
      </div>
    </div>
  );
};
