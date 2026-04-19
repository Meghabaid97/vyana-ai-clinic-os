import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// S2: WhatsApp gallery scrolling slowly past. She finds a faded report - photo of a photo.
export const S2Chaos: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  // Gentle, slow scroll — not chaotic
  const scroll = interpolate(frame, [0, durationInFrames], [0, -680], { extrapolateRight: "clamp" });

  // Found photo: zooms in around frame 240
  const findEnter = spring({ frame: frame - 230, fps, config: { damping: 22 } });
  const findScale = interpolate(findEnter, [0, 1], [0.92, 1.04]);

  const titleEnter = spring({ frame: frame - 90, fps, config: { damping: 26 } });

  // Tiles — WhatsApp gallery look
  const tiles = Array.from({ length: 24 }, (_, i) => ({
    label: ["IMG_2019", "Lab_final", "Rx_dad", "ECG", "Sugar", "Thyroid", "Xray", "Discharge"][i % 8],
    sub: ["Amma", "Dr Sharma", "Apollo", "Family", "Cousin"][i % 5],
    tone: i % 3,
  }));

  return (
    <AbsoluteFill style={{ background: "#0E0D0B", opacity: op }}>
      {/* warm vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 30% 40%, rgba(232,169,87,0.08) 0%, transparent 55%)" }} />

      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 100, paddingLeft: 80 }}>
        {/* Left: gallery on phone */}
        <div style={{
          width: 380, height: 760, borderRadius: 48, background: "#000", padding: 10,
          boxShadow: "0 40px 100px rgba(0,0,0,0.6)", transform: "rotate(-2deg)",
        }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 40, background: "#0B141A", overflow: "hidden", position: "relative" }}>
            <div style={{
              padding: "22px 20px 14px", color: "#fff", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 10, fontSize: 15,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              <span style={{ color: "#25D366" }}>●</span> Family ❤️ — Media
            </div>

            {/* Gallery grid scrolling */}
            <div style={{ position: "absolute", left: 8, right: 8, top: 60, transform: `translateY(${scroll}px)` }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                {[...tiles, ...tiles].map((t, i) => {
                  const colors = ["#2a2a28", "#3a2e22", "#1f2c34"];
                  return (
                    <div key={i} style={{
                      aspectRatio: "1", background: colors[t.tone],
                      display: "flex", alignItems: "flex-end", padding: 6,
                      fontSize: 8, color: "rgba(255,255,255,0.5)",
                      backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.5) 100%)",
                    }}>
                      <div>{t.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* The found photo — appears highlighted */}
            <div style={{
              position: "absolute", left: "50%", top: "50%",
              transform: `translate(-50%, -50%) scale(${findScale})`,
              width: 240, height: 320, borderRadius: 6,
              background: "linear-gradient(180deg, #d4c8b0 0%, #a89878 100%)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 3px rgba(232,112,77,0.8)",
              opacity: findEnter,
              padding: 16, fontFamily: "Fraunces, serif", fontSize: 11, color: "#3a2e22",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>LAB REPORT</div>
              <div style={{ height: 1, background: "#3a2e22", opacity: 0.4 }} />
              <div style={{ opacity: 0.6 }}>Patient: __________</div>
              <div style={{ opacity: 0.4, fontStyle: "italic" }}>(half cut off)</div>
              <div style={{ marginTop: "auto", fontSize: 9, opacity: 0.5 }}>Forwarded · 3 years ago</div>
            </div>
          </div>
        </div>

        {/* Right text */}
        <div style={{ maxWidth: 760 }}>
          <div style={{
            fontFamily: "Fraunces, serif", fontSize: 64, lineHeight: 1.1, color: "#F4ECE0",
            opacity: titleEnter, transform: `translateY(${interpolate(titleEnter, [0, 1], [16, 0])}px)`,
            letterSpacing: -1, fontWeight: 400,
          }}>
            A photograph<br />
            of a <em style={{ color: COLORS.coral, fontStyle: "italic" }}>photograph.</em>
          </div>
          <div style={{
            marginTop: 32, fontSize: 22, color: "rgba(244,236,224,0.6)", lineHeight: 1.55,
            opacity: spring({ frame: frame - 200, fps, config: { damping: 22 } }),
            fontFamily: "Inter, sans-serif", maxWidth: 600,
          }}>
            This is how most of us carry our health.<br />
            In screenshots. In WhatsApp threads.<br />
            In a parent's memory.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
