import React from "react";
import { Img, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

// Phone frame wrapping a real screenshot with gentle entrance.
// Screenshot dims: 390x844 (mobile viewport).
export const AppPhone: React.FC<{
  src: string;            // path under public/, e.g. "shots/home.png"
  scale?: number;
  rotate?: number;
  delay?: number;
  scrollY?: number;       // pixels of vertical scroll within the screenshot
  children?: React.ReactNode; // overlays (cursor, highlights)
}> = ({ src, scale = 1, rotate = 0, delay = 0, scrollY = 0, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 90 } });
  const ty = interpolate(enter, [0, 1], [30, 0]);

  // Phone shell: 420x860; inner content area approx 396x836; we fit 390x844 screenshot inside.
  const PHONE_W = 420;
  const PHONE_H = 860;
  const SHOT_W = 396;
  const SHOT_H = 836;

  return (
    <div style={{
      width: PHONE_W,
      height: PHONE_H,
      borderRadius: 56,
      background: "#0B0A09",
      padding: 12,
      boxShadow: "0 40px 100px rgba(20,15,10,0.28), 0 12px 30px rgba(20,15,10,0.14)",
      transform: `translateY(${ty}px) scale(${scale * (0.96 + 0.04 * enter)}) rotate(${rotate}deg)`,
      opacity: enter,
      position: "relative",
    }}>
      <div style={{
        width: SHOT_W, height: SHOT_H, borderRadius: 46,
        background: "#FAFAF7", overflow: "hidden", position: "relative",
      }}>
        {/* Notch */}
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          width: 110, height: 28, borderRadius: 20, background: "#0B0A09", zIndex: 30,
        }} />
        {/* Screenshot, scaled to fit width */}
        <div style={{
          position: "absolute", inset: 0,
          transform: `translateY(${-scrollY}px)`,
        }}>
          <Img
            src={staticFile(src)}
            style={{
              width: SHOT_W,
              height: "auto",
              display: "block",
            }}
          />
        </div>
        {/* Overlay layer (cursor, taps, highlights) */}
        <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
          {children}
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
          position: "absolute", inset: 0, width: 44, height: 44, borderRadius: 22,
          border: "2px solid rgba(232,112,77,0.7)", transform: `translate(-50%, -50%) scale(${ringScale})`,
          opacity: ringOp,
        }} />
      )}
      <div style={{
        width: 28, height: 28, borderRadius: 14, background: "rgba(232,112,77,0.85)",
        boxShadow: "0 0 0 6px rgba(232,112,77,0.18)",
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
      border: "2px solid rgba(232,112,77,0.75)", boxShadow: "0 0 0 6px rgba(232,112,77,0.12)",
      opacity: enter, transform: `scale(${0.96 + 0.04 * enter})`,
    }} />
  );
};
