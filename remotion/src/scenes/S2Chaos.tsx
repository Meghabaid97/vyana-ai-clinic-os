import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// S2: WhatsApp scroll chaos — phone with rapidly scrolling forwarded reports
export const S2Chaos: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const op = fadeIn * fadeOut;

  // Continuously scrolling list
  const scroll = interpolate(frame, [0, durationInFrames], [0, -1800]);

  const items = [
    { name: "Amma 💕", msg: "📎 Lab_Report_Final.pdf", time: "08:42", img: "📄" },
    { name: "Dr Sharma's Office", msg: "📎 IMG_20191103_142.jpg", time: "Yest", img: "🖼️" },
    { name: "Appa", msg: "📎 IMG-20231201-WA0034.jpg", time: "Mon", img: "🖼️" },
    { name: "Sis 🌸", msg: "📎 ECG_dad_2022.pdf", time: "Sun", img: "📄" },
    { name: "Apollo Pharmacy", msg: "Your prescription is ready", time: "Sat", img: "💊" },
    { name: "Amma 💕", msg: "📎 Sugar_test_again.jpeg", time: "Fri", img: "🖼️" },
    { name: "Dr Mehta WhatsApp", msg: "📎 thyroid_panel.pdf", time: "Thu", img: "📄" },
    { name: "Mama Kaka", msg: "📎 IMG-20180815-WA0099.jpg", time: "Wed", img: "🖼️" },
    { name: "Cousin Riya", msg: "📎 grandfather_xray.jpg", time: "Tue", img: "🖼️" },
    { name: "Family Group ❤️", msg: "📎 ECG_2017_old.pdf", time: "Mon", img: "📄" },
    { name: "Amma 💕", msg: "📎 Final_lab.pdf", time: "Mon", img: "📄" },
    { name: "Dr Iyer", msg: "📎 prescription_handwritten.jpg", time: "Sun", img: "🖼️" },
  ];

  // Floating words
  const words = ["WhatsApp", "Gallery", "Drawer", "Folder", "Email", "Forwarded", "Screenshot"];
  const titleEnter = spring({ frame: frame - 60, fps, config: { damping: 22 } });

  return (
    <AbsoluteFill style={{ background: COLORS.bgDark, opacity: op, color: "#F4ECE0" }}>
      {/* Floating chaos words */}
      {words.map((w, i) => {
        const wf = (frame * 0.4 + i * 30) % 200;
        const x = (i * 280 + 100) % 1900;
        const y = 80 + (i * 120) % 900;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y + Math.sin((frame + i * 10) * 0.03) * 12,
            fontSize: 28, fontFamily: "Fraunces, serif", fontStyle: "italic",
            color: COLORS.coral, opacity: 0.18,
          }}>{w}</div>
        );
      })}

      <AbsoluteFill style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 80 }}>
        {/* Phone */}
        <div style={{
          width: 380, height: 760, borderRadius: 48, background: "#000",
          padding: 10, boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          transform: `rotate(-3deg)`,
        }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 40, background: "#0B141A", overflow: "hidden", position: "relative" }}>
            {/* WA header */}
            <div style={{
              padding: "20px 18px 12px", background: "#1F2C34", color: "#fff",
              display: "flex", alignItems: "center", gap: 12, fontWeight: 600,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: "#25D366" }} />
              <span style={{ fontSize: 16 }}>WhatsApp</span>
              <span style={{ marginLeft: "auto", fontSize: 12, opacity: 0.6 }}>347 chats</span>
            </div>
            {/* Scrolling list */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 56, transform: `translateY(${scroll}px)` }}>
              {[...items, ...items, ...items].map((it, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12, padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)", color: "#E9EDF0",
                }}>
                  <div style={{ width: 42, height: 42, borderRadius: 21, background: "#374248", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{it.img}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                      <span style={{ color: "#fff" }}>{it.name}</span>
                      <span style={{ fontSize: 10, color: "#8696A0" }}>{it.time}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#8696A0", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side text */}
        <div style={{ maxWidth: 620 }}>
          <div style={{
            fontFamily: "Fraunces, serif", fontSize: 64, lineHeight: 1.1, color: "#F4ECE0",
            opacity: titleEnter,
            transform: `translateY(${interpolate(titleEnter, [0, 1], [16, 0])}px)`,
          }}>
            Always <span style={{ color: COLORS.coral }}>somewhere.</span><br />
            Never <em style={{ fontStyle: "italic" }}>together.</em>
          </div>
          <div style={{ marginTop: 24, fontSize: 22, color: "#A89F94", lineHeight: 1.5, opacity: titleEnter }}>
            347 forwards. 12,000 photos.<br />
            One missing thyroid report.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
