import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// Phone shell — bigger so the UI inside reads clearly. Children render the screen content.
export const AppPhone: React.FC<{
  scale?: number;
  rotate?: number;
  delay?: number;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ scale = 1, rotate = 0, delay = 0, children, overlay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 90 } });
  // Subtle continuous float
  const float = Math.sin((frame - delay) / 30) * 4;
  const ty = interpolate(enter, [0, 1], [60, 0]) + float;

  // Bigger phone for legibility
  const PHONE_W = 560;
  const PHONE_H = 1140;
  const SHOT_W = 532;
  const SHOT_H = 1112;

  return (
    <div style={{
      width: PHONE_W,
      height: PHONE_H,
      borderRadius: 72,
      background: "linear-gradient(160deg, #1a1816 0%, #0B0A09 100%)",
      padding: 14,
      boxShadow: "0 60px 140px rgba(20,15,10,0.36), 0 24px 50px rgba(20,15,10,0.18), inset 0 0 0 2px rgba(255,255,255,0.06)",
      transform: `translateY(${ty}px) scale(${scale * (0.94 + 0.06 * enter)}) rotate(${rotate}deg)`,
      opacity: enter,
      position: "relative",
    }}>
      <div style={{
        width: SHOT_W, height: SHOT_H, borderRadius: 60,
        background: "#FAFAF7", overflow: "hidden", position: "relative",
      }}>
        {/* Status bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 54, zIndex: 25,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 36px", fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 700, color: "#0B0A09",
        }}>
          <span>9:41</span>
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ display: "inline-block", width: 20, height: 12, borderRadius: 2, background: "#0B0A09" }} />
            <span style={{ display: "inline-block", width: 28, height: 12, borderRadius: 2, border: "2px solid #0B0A09" }} />
          </span>
        </div>
        {/* Notch */}
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          width: 150, height: 38, borderRadius: 28, background: "#0B0A09", zIndex: 30,
        }} />
        {/* Screen content */}
        <div style={{ position: "absolute", inset: 0, paddingTop: 54 }}>
          {children}
        </div>
        {/* Overlay */}
        <div style={{ position: "absolute", inset: 0, zIndex: 28 }}>
          {overlay}
        </div>
      </div>
    </div>
  );
};

// Animated touch / cursor dot
export const TouchDot: React.FC<{ x: number; y: number; appear: number; pulse?: boolean }> = ({ x, y, appear, pulse = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - appear, fps, config: { damping: 18, stiffness: 200 } });
  const ringDelay = (frame - appear - 4) / fps;
  const ringScale = 1 + Math.max(0, ringDelay) * 2;
  const ringOp = Math.max(0, 1 - Math.max(0, ringDelay) * 2);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", opacity: enter }}>
      {pulse && (
        <div style={{
          position: "absolute", inset: 0, width: 64, height: 64, borderRadius: 32,
          border: "3px solid rgba(232,112,77,0.7)", transform: `translate(-50%, -50%) scale(${ringScale})`,
          opacity: ringOp,
        }} />
      )}
      <div style={{
        width: 42, height: 42, borderRadius: 21, background: "rgba(232,112,77,0.92)",
        boxShadow: "0 0 0 9px rgba(232,112,77,0.18)",
      }} />
    </div>
  );
};

// Highlight ring
export const Highlight: React.FC<{ x: number; y: number; w: number; h: number; appear: number; r?: number }> = ({ x, y, w, h, appear, r = 18 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - appear, fps, config: { damping: 22 } });
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h, borderRadius: r,
      border: "3px solid rgba(232,112,77,0.85)", boxShadow: "0 0 0 10px rgba(232,112,77,0.14)",
      opacity: enter, transform: `scale(${0.96 + 0.04 * enter})`,
    }} />
  );
};

// Floating accent shapes for parallax energy
export const FloatingAccents: React.FC<{ seed?: number }> = ({ seed = 0 }) => {
  const frame = useCurrentFrame();
  const items = [
    { x: 8, y: 15, size: 240, color: "rgba(232,112,77,0.06)", phase: 0 },
    { x: 88, y: 70, size: 320, color: "rgba(122,155,126,0.06)", phase: 1.5 },
    { x: 75, y: 12, size: 180, color: "rgba(232,169,87,0.05)", phase: 3 },
    { x: 12, y: 80, size: 280, color: "rgba(232,112,77,0.04)", phase: 4.5 },
  ];
  return (
    <>
      {items.map((it, i) => {
        const drift = Math.sin(frame / 60 + it.phase + seed) * 30;
        const driftY = Math.cos(frame / 70 + it.phase + seed) * 20;
        return (
          <div key={i} style={{
            position: "absolute",
            left: `${it.x}%`, top: `${it.y}%`,
            width: it.size, height: it.size, borderRadius: it.size / 2,
            background: it.color, filter: "blur(40px)",
            transform: `translate(${drift}px, ${driftY}px)`,
            pointerEvents: "none",
          }} />
        );
      })}
    </>
  );
};
