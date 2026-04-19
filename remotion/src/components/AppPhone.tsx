import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// Phone shell. Children render the screen content (use MockScreen wrappers below for real fidelity).
export const AppPhone: React.FC<{
  scale?: number;
  rotate?: number;
  delay?: number;
  children?: React.ReactNode;
  overlay?: React.ReactNode; // separate layer for taps/highlights above content
}> = ({ scale = 1, rotate = 0, delay = 0, children, overlay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 90 } });
  const ty = interpolate(enter, [0, 1], [40, 0]);

  const PHONE_W = 440;
  const PHONE_H = 900;
  const SHOT_W = 416;
  const SHOT_H = 876;

  return (
    <div style={{
      width: PHONE_W,
      height: PHONE_H,
      borderRadius: 58,
      background: "linear-gradient(160deg, #1a1816 0%, #0B0A09 100%)",
      padding: 12,
      boxShadow: "0 50px 120px rgba(20,15,10,0.32), 0 16px 40px rgba(20,15,10,0.16), inset 0 0 0 1.5px rgba(255,255,255,0.06)",
      transform: `translateY(${ty}px) scale(${scale * (0.96 + 0.04 * enter)}) rotate(${rotate}deg)`,
      opacity: enter,
      position: "relative",
    }}>
      <div style={{
        width: SHOT_W, height: SHOT_H, borderRadius: 48,
        background: "#FAFAF7", overflow: "hidden", position: "relative",
      }}>
        {/* Status bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 44, zIndex: 25,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px 0 28px", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, color: "#0B0A09",
        }}>
          <span>9:41</span>
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ display: "inline-block", width: 16, height: 10, borderRadius: 1, background: "#0B0A09" }} />
            <span style={{ display: "inline-block", width: 22, height: 10, borderRadius: 2, border: "1.5px solid #0B0A09" }} />
          </span>
        </div>
        {/* Notch */}
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          width: 118, height: 30, borderRadius: 22, background: "#0B0A09", zIndex: 30,
        }} />
        {/* Screen content */}
        <div style={{ position: "absolute", inset: 0, paddingTop: 44 }}>
          {children}
        </div>
        {/* Overlay layer (cursor, taps, highlights) */}
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
          position: "absolute", inset: 0, width: 50, height: 50, borderRadius: 25,
          border: "2.5px solid rgba(232,112,77,0.7)", transform: `translate(-50%, -50%) scale(${ringScale})`,
          opacity: ringOp,
        }} />
      )}
      <div style={{
        width: 32, height: 32, borderRadius: 16, background: "rgba(232,112,77,0.9)",
        boxShadow: "0 0 0 7px rgba(232,112,77,0.18)",
      }} />
    </div>
  );
};

// Subtle highlight ring around a UI region
export const Highlight: React.FC<{ x: number; y: number; w: number; h: number; appear: number; r?: number }> = ({ x, y, w, h, appear, r = 14 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - appear, fps, config: { damping: 22 } });
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h, borderRadius: r,
      border: "2.5px solid rgba(232,112,77,0.85)", boxShadow: "0 0 0 8px rgba(232,112,77,0.14)",
      opacity: enter, transform: `scale(${0.96 + 0.04 * enter})`,
    }} />
  );
};
