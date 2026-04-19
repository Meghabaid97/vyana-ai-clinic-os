import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// Phone frame with notch, sized 420x860 by default
export const PhoneFrame: React.FC<{ children: React.ReactNode; scale?: number; rotate?: number; delay?: number }> = ({ children, scale = 1, rotate = 0, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 90 } });
  const y = interpolate(enter, [0, 1], [40, 0]);
  return (
    <div
      style={{
        width: 420,
        height: 860,
        borderRadius: 56,
        background: COLORS.ink,
        padding: 12,
        boxShadow: "0 30px 80px rgba(20,15,10,0.25), 0 8px 24px rgba(20,15,10,0.12)",
        transform: `translateY(${y}px) scale(${scale * (0.95 + 0.05 * enter)}) rotate(${rotate}deg)`,
        opacity: enter,
      }}
    >
      <div style={{
        width: "100%", height: "100%", borderRadius: 46, background: COLORS.bg,
        position: "relative", overflow: "hidden",
      }}>
        {/* Notch */}
        <div style={{
          position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
          width: 110, height: 28, borderRadius: 20, background: COLORS.ink, zIndex: 30,
        }} />
        {/* Status bar */}
        <div style={{
          position: "absolute", top: 18, left: 30, right: 30, display: "flex",
          justifyContent: "space-between", alignItems: "center", color: COLORS.ink,
          fontSize: 13, fontWeight: 600, zIndex: 25,
        }}>
          <span>9:41</span>
          <span>•••</span>
        </div>
        <div style={{ position: "absolute", inset: 0, paddingTop: 56 }}>
          {children}
        </div>
      </div>
    </div>
  );
};
