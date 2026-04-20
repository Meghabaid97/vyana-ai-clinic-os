import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, random } from "remotion";

// Reusable colorful background system: drifting blobs + grid + accent shapes.
// Each scene passes a palette object to set the mood.

export type Palette = {
  bg: string;
  blob1: string;
  blob2: string;
  blob3: string;
  ink: string;
};

export const BackdropKinetic: React.FC<{ palette: Palette; seed?: number }> = ({ palette, seed = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: palette.bg }}>
      {/* Soft moving blobs */}
      {[0, 1, 2].map((i) => {
        const r = random(`b${seed}-${i}`);
        const x = 200 + r * 1500 + Math.sin((frame + i * 60) / 90) * 80;
        const y = 100 + random(`y${seed}-${i}`) * 800 + Math.cos((frame + i * 45) / 110) * 60;
        const size = 600 + random(`s${seed}-${i}`) * 400;
        const color = [palette.blob1, palette.blob2, palette.blob3][i];
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: size, height: size,
            borderRadius: "50%", background: color, opacity: 0.55,
            filter: "blur(80px)", pointerEvents: "none",
          }} />
        );
      })}
      {/* Subtle grid */}
      <AbsoluteFill style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
        opacity: 0.6,
      }} />
    </AbsoluteFill>
  );
};

// Floating decorative shapes (sticker accents)
export const Stickers: React.FC<{ seed: number; count?: number; ink: string }> = ({ seed, count = 6, ink }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const r = random(`stk${seed}-${i}`);
        const x = r * 1920;
        const y = random(`sty${seed}-${i}`) * 1080;
        const rot = (random(`str${seed}-${i}`) - 0.5) * 60 + frame * 0.3;
        const drift = Math.sin((frame + i * 30) / 60) * 12;
        const size = 30 + r * 50;
        const shape = i % 4;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y + drift,
            transform: `rotate(${rot}deg)`,
            opacity: 0.35,
          }}>
            {shape === 0 && <div style={{ width: size, height: size, borderRadius: "50%", border: `4px solid ${ink}` }} />}
            {shape === 1 && <div style={{ width: size, height: 4, background: ink }} />}
            {shape === 2 && (
              <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                <path d="M12 2 L14 9 L21 12 L14 15 L12 22 L10 15 L3 12 L10 9 Z" stroke={ink} strokeWidth="2" />
              </svg>
            )}
            {shape === 3 && <div style={{ width: size * 0.6, height: size * 0.6, background: ink, transform: "rotate(45deg)" }} />}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
