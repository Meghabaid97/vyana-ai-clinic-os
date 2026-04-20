import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

// All mock screens render native React inside the phone frame at full resolution.
// SIMPLIFIED: bigger type, fewer elements, generous whitespace — readable at any scale.

const Tabs: React.FC<{ active: string }> = ({ active }) => {
  const items = [
    { key: "home", label: "Home" },
    { key: "records", label: "Records" },
    { key: "trends", label: "Trends" },
    { key: "rx", label: "Rx" },
    { key: "share", label: "Share" },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, height: 88,
      background: "rgba(255,255,255,0.96)", borderTop: `1px solid ${COLORS.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-around",
      padding: "0 8px",
    }}>
      {items.map(it => (
        <div key={it.key} style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          color: it.key === active ? COLORS.coral : COLORS.inkSoft,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: 4,
            background: it.key === active ? COLORS.coral : "transparent",
            border: it.key === active ? "none" : `1.5px solid ${COLORS.inkSoft}`,
          }} />
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "Inter" }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
};

// ====================================================================
// HOME — minimal, narrative
// ====================================================================
export const MockHome: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headEnter = spring({ frame: frame - 10, fps, config: { damping: 22 } });
  const storyEnter = spring({ frame: frame - 35, fps, config: { damping: 22 } });
  const statsEnter = spring({ frame: frame - 60, fps, config: { damping: 22 } });
  const abhaEnter = spring({ frame: frame - 90, fps, config: { damping: 22 } });

  return (
    <div style={{ width: "100%", height: "100%", background: "#FAFAF7", position: "relative", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "24px 28px 0", opacity: headEnter, transform: `translateY(${interpolate(headEnter, [0, 1], [10, 0])}px)` }}>
        <div style={{ fontFamily: "Inter", fontSize: 14, color: COLORS.inkSoft, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>Sunday morning</div>
        <div style={{ marginTop: 10, fontFamily: "Fraunces, serif", fontSize: 48, color: COLORS.ink, fontWeight: 500, letterSpacing: -1, lineHeight: 1.05 }}>
          Hello, <em style={{ color: COLORS.coral, fontStyle: "italic" }}>Meera</em>
        </div>
      </div>

      {/* Story card — large, single focal point */}
      <div style={{
        margin: "32px 22px 0", padding: 28, background: "#fff",
        borderRadius: 28, border: `1px solid ${COLORS.border}`,
        boxShadow: "0 12px 40px rgba(20,15,10,0.06)",
        opacity: storyEnter, transform: `translateY(${interpolate(storyEnter, [0, 1], [20, 0])}px)`,
      }}>
        <div style={{ fontSize: 13, color: COLORS.coral, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Your Health Story</div>
        <div style={{ marginTop: 14, fontFamily: "Fraunces, serif", fontSize: 26, color: COLORS.ink, lineHeight: 1.35, fontWeight: 500 }}>
          Sugar and pressure have <em style={{ color: COLORS.sage, fontStyle: "italic" }}>quietly improved</em>.
        </div>
      </div>

      {/* Two big stats */}
      <div style={{
        margin: "20px 22px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14,
        opacity: statsEnter, transform: `translateY(${interpolate(statsEnter, [0, 1], [16, 0])}px)`,
      }}>
        <div style={{ padding: 22, background: "#fff", borderRadius: 22, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>HbA1c</div>
          <div style={{ marginTop: 8, fontFamily: "Fraunces, serif", fontSize: 44, color: COLORS.ink, fontWeight: 600, lineHeight: 1 }}>6.2</div>
          <div style={{ marginTop: 6, fontSize: 13, color: COLORS.sage, fontWeight: 600 }}>↓ 0.8 in 6 mo</div>
        </div>
        <div style={{ padding: 22, background: "#fff", borderRadius: 22, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>BP avg</div>
          <div style={{ marginTop: 8, fontFamily: "Fraunces, serif", fontSize: 44, color: COLORS.ink, fontWeight: 600, lineHeight: 1 }}>122<span style={{ color: COLORS.inkSoft, fontSize: 28 }}>/78</span></div>
          <div style={{ marginTop: 6, fontSize: 13, color: COLORS.sage, fontWeight: 600 }}>Within range</div>
        </div>
      </div>

      {/* ABHA pill */}
      <div style={{
        margin: "20px 22px 0", padding: "16px 20px", background: COLORS.coralSoft,
        borderRadius: 18, opacity: abhaEnter, transform: `translateY(${interpolate(abhaEnter, [0, 1], [10, 0])}px)`,
      }}>
        <div style={{ fontSize: 12, color: COLORS.coralDeep, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Linked to ABHA</div>
        <div style={{ marginTop: 4, fontFamily: "Inter", fontSize: 15, color: COLORS.ink, fontWeight: 500 }}>
          12-3456-•••-1234
        </div>
      </div>

      <Tabs active="home" />
    </div>
  );
};

// ====================================================================
// RECORDS — minimal list
// ====================================================================
export const MockRecords: React.FC<{ pulseUploadAt?: number }> = ({ pulseUploadAt = -1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headEnter = spring({ frame: frame - 10, fps, config: { damping: 22 } });
  const list = [0, 1, 2].map(i => spring({ frame: frame - 40 - i * 12, fps, config: { damping: 22 } }));
  const newCardEnter = spring({ frame: frame - (pulseUploadAt + 25), fps, config: { damping: 22 } });
  const showNew = pulseUploadAt > 0 && frame > pulseUploadAt + 10;

  const items = [
    { name: "Lipid Panel", date: "12 Mar 2025", tag: "Blood test", color: COLORS.coral },
    { name: "Discharge Summary", date: "28 Jan 2025", tag: "Apollo Hospital", color: COLORS.sage },
    { name: "Thyroid Profile", date: "04 Dec 2024", tag: "Blood test", color: COLORS.amber },
  ];

  return (
    <div style={{ width: "100%", height: "100%", background: "#FAFAF7", position: "relative", overflow: "hidden" }}>
      <div style={{ padding: "24px 28px 0", opacity: headEnter, transform: `translateY(${interpolate(headEnter, [0, 1], [10, 0])}px)` }}>
        <div style={{ fontFamily: "Inter", fontSize: 14, color: COLORS.inkSoft, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>Records</div>
        <div style={{ marginTop: 8, fontFamily: "Fraunces, serif", fontSize: 40, color: COLORS.ink, fontWeight: 500, letterSpacing: -1, lineHeight: 1.05 }}>
          Everything,<br/>in <em style={{ color: COLORS.coral, fontStyle: "italic" }}>one place</em>
        </div>
      </div>

      {/* Big upload button */}
      <div style={{
        margin: "28px 22px 0", padding: "22px 24px", background: COLORS.coral, color: "#fff",
        borderRadius: 22, fontFamily: "Inter", fontSize: 19, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        boxShadow: "0 14px 30px rgba(232,112,77,0.32)",
      }}>
        <span style={{ fontSize: 26, fontWeight: 400 }}>+</span> Upload report
      </div>

      {/* New extracted card */}
      {showNew && (
        <div style={{
          margin: "20px 22px 0", padding: 22, borderRadius: 22,
          background: "linear-gradient(135deg, #FBE4DA 0%, #fff 100%)",
          border: `2px solid ${COLORS.coral}`,
          opacity: newCardEnter, transform: `translateY(${interpolate(newCardEnter, [0, 1], [16, 0])}px)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: COLORS.coralDeep, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: COLORS.coral }} /> AI extracted
          </div>
          <div style={{ marginTop: 10, fontFamily: "Fraunces, serif", fontSize: 22, color: COLORS.ink, fontWeight: 600 }}>
            Lipid Panel
          </div>
          <div style={{ marginTop: 4, fontFamily: "Inter", fontSize: 15, color: COLORS.inkSoft, lineHeight: 1.5 }}>
            LDL slightly elevated · 142 mg/dL
          </div>
        </div>
      )}

      {/* Simple list */}
      <div style={{ marginTop: 20, padding: "0 22px" }}>
        {items.map((it, i) => (
          <div key={it.name} style={{
            display: "flex", alignItems: "center", gap: 16, padding: "18px 18px",
            background: "#fff", borderRadius: 18, border: `1px solid ${COLORS.border}`,
            marginBottom: 10,
            opacity: list[i], transform: `translateY(${interpolate(list[i], [0, 1], [10, 0])}px)`,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${it.color}22`, display: "flex", alignItems: "center", justifyContent: "center", color: it.color, fontWeight: 700, fontSize: 22 }}>
              ▢
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Inter", fontSize: 16, color: COLORS.ink, fontWeight: 600 }}>{it.name}</div>
              <div style={{ marginTop: 3, fontFamily: "Inter", fontSize: 13, color: COLORS.inkSoft }}>{it.date}</div>
            </div>
            <div style={{ color: COLORS.inkSoft, fontSize: 22 }}>›</div>
          </div>
        ))}
      </div>

      <Tabs active="records" />
    </div>
  );
};

// ====================================================================
// TRENDS — single hero chart
// ====================================================================
export const MockTrends: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 10, fps, config: { damping: 22 } });
  const numEnter = spring({ frame: frame - 30, fps, config: { damping: 22 } });
  const lineLen = interpolate(frame, [40, 130], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const points = [
    { x: 0,    y: 0.45 },
    { x: 0.16, y: 0.5  },
    { x: 0.32, y: 0.62 },
    { x: 0.48, y: 0.7  },
    { x: 0.64, y: 0.6  },
    { x: 0.80, y: 0.48 },
    { x: 1.0,  y: 0.4  },
  ];
  const W = 360, H = 200;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * W} ${H - p.y * H}`).join(" ");

  return (
    <div style={{ width: "100%", height: "100%", background: "#FAFAF7", position: "relative", overflow: "hidden" }}>
      <div style={{ padding: "24px 28px 0", opacity: head, transform: `translateY(${interpolate(head, [0, 1], [10, 0])}px)` }}>
        <div style={{ fontFamily: "Inter", fontSize: 14, color: COLORS.inkSoft, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>HbA1c · 6 years</div>
      </div>

      {/* Hero number */}
      <div style={{ padding: "16px 28px 0", display: "flex", alignItems: "baseline", gap: 14, opacity: numEnter, transform: `translateY(${interpolate(numEnter, [0, 1], [10, 0])}px)` }}>
        <div style={{ fontFamily: "Fraunces, serif", fontSize: 96, color: COLORS.ink, fontWeight: 600, letterSpacing: -3, lineHeight: 1 }}>6.2</div>
        <div style={{ fontFamily: "Inter", fontSize: 18, color: COLORS.inkSoft }}>%</div>
        <div style={{ marginLeft: "auto", padding: "8px 16px", background: `${COLORS.sage}22`, color: COLORS.sage, borderRadius: 999, fontSize: 14, fontWeight: 700 }}>↓ 0.8</div>
      </div>

      {/* Chart */}
      <div style={{ margin: "24px 22px 0", padding: 24, background: "#fff", borderRadius: 24, border: `1px solid ${COLORS.border}` }}>
        <svg width={W} height={H} style={{ display: "block", width: "100%", height: "auto" }} viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLORS.coral} stopOpacity="0.3" />
              <stop offset="100%" stopColor={COLORS.coral} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(y => (
            <line key={y} x1={0} x2={W} y1={H * y} y2={H * y} stroke={COLORS.border} strokeWidth={1} />
          ))}
          <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill="url(#ga)" opacity={lineLen} />
          <path d={path} fill="none" stroke={COLORS.coral} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={2000} strokeDashoffset={(1 - lineLen) * 2000} />
          {points.map((p, i) => (
            <circle key={i} cx={p.x * W} cy={H - p.y * H} r={6} fill="#fff"
              stroke={COLORS.coral} strokeWidth={3.5}
              opacity={interpolate(lineLen, [i / points.length - 0.05, i / points.length + 0.05], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          ))}
        </svg>
        <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontFamily: "Inter", fontSize: 13, color: COLORS.inkSoft, fontWeight: 600 }}>
          <span>2019</span><span>2021</span><span>2023</span><span>2025</span>
        </div>
      </div>

      <Tabs active="trends" />
    </div>
  );
};

// ====================================================================
// RX READER — multilingual
// ====================================================================
export const MockRx: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 10, fps, config: { damping: 22 } });

  const langs = [
    { name: "Tamil",   rx: "மெட்ஃபார்மின் 500mg",    en: "Metformin 500mg", dose: "Twice daily, after meals" },
    { name: "Hindi",   rx: "थायरॉक्सिन 50mcg",        en: "Thyroxine 50mcg", dose: "Once daily, empty stomach" },
    { name: "Telugu",  rx: "అటోర్వాస్టాటిన్ 10mg",  en: "Atorvastatin 10mg", dose: "At bedtime" },
    { name: "Bengali", rx: "অ্যামলোডিপাইন 5mg",       en: "Amlodipine 5mg", dose: "Once daily, morning" },
  ];
  const cycleLen = 105;
  const idx = Math.floor(Math.max(0, frame - 40) / cycleLen) % langs.length;
  const cur = langs[idx];
  const cardKey = `${idx}`;
  const cardLocal = (frame - 40) % cycleLen;
  const cardEnter = spring({ frame: cardLocal, fps, config: { damping: 22 } });

  return (
    <div style={{ width: "100%", height: "100%", background: "#FAFAF7", position: "relative", overflow: "hidden" }}>
      <div style={{ padding: "24px 28px 0", opacity: head, transform: `translateY(${interpolate(head, [0, 1], [10, 0])}px)` }}>
        <div style={{ fontFamily: "Inter", fontSize: 14, color: COLORS.inkSoft, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>Rx Reader</div>
        <div style={{ marginTop: 8, fontFamily: "Fraunces, serif", fontSize: 36, color: COLORS.ink, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05 }}>
          Even <em style={{ color: COLORS.coral, fontStyle: "italic" }}>handwritten</em>
        </div>
      </div>

      {/* Prescription card mock */}
      <div style={{
        margin: "24px 22px 0", padding: 22, background: "#fff",
        borderRadius: 22, border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Uploaded</div>
        <div style={{
          marginTop: 12, padding: 20, borderRadius: 14,
          background: "repeating-linear-gradient(0deg, #FFFBF3 0, #FFFBF3 28px, #F4ECE0 29px)",
          fontFamily: "'Caveat', 'Comic Sans MS', cursive", fontSize: 32, color: "#3a342c",
          minHeight: 130, lineHeight: 1.4,
        }}>
          Dr. Iyer · 14 Mar<br />
          <span key={cardKey} style={{ opacity: cardEnter }}>{cur.rx}</span>
        </div>
      </div>

      {/* AI translation */}
      <div key={cardKey + "-out"} style={{
        margin: "20px 22px 0", padding: 22, background: "#fff",
        borderRadius: 22, border: `2px solid ${COLORS.coral}`,
        opacity: cardEnter, transform: `translateY(${interpolate(cardEnter, [0, 1], [16, 0])}px)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ padding: "5px 12px", borderRadius: 999, background: COLORS.coralSoft, color: COLORS.coralDeep, fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>
            {cur.name.toUpperCase()}
          </div>
          <div style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>↓ Translated</div>
        </div>
        <div style={{ marginTop: 14, fontFamily: "Fraunces, serif", fontSize: 30, color: COLORS.ink, fontWeight: 600, lineHeight: 1.1 }}>{cur.en}</div>
        <div style={{ marginTop: 8, fontFamily: "Inter", fontSize: 16, color: COLORS.inkSoft }}>{cur.dose}</div>
      </div>

      <Tabs active="rx" />
    </div>
  );
};

// ====================================================================
// SHARE — secure ABHA link
// ====================================================================
export const MockShare: React.FC<{ generateAt?: number }> = ({ generateAt = 50 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 10, fps, config: { damping: 22 } });
  const linkEnter = spring({ frame: frame - generateAt, fps, config: { damping: 22 } });
  const showLink = frame > generateAt - 5;

  return (
    <div style={{ width: "100%", height: "100%", background: "#FAFAF7", position: "relative", overflow: "hidden" }}>
      <div style={{ padding: "24px 28px 0", opacity: head, transform: `translateY(${interpolate(head, [0, 1], [10, 0])}px)` }}>
        <div style={{ fontFamily: "Inter", fontSize: 14, color: COLORS.inkSoft, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>Share</div>
        <div style={{ marginTop: 8, fontFamily: "Fraunces, serif", fontSize: 36, color: COLORS.ink, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05 }}>
          With your <em style={{ color: COLORS.coral, fontStyle: "italic" }}>doctor</em>
        </div>
      </div>

      {/* Recipient card */}
      <div style={{ margin: "24px 22px 0", padding: 22, background: "#fff", borderRadius: 22, border: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Recipient</div>
        <div style={{ marginTop: 8, fontFamily: "Fraunces, serif", fontSize: 24, color: COLORS.ink, fontWeight: 600 }}>Dr. Anand Iyer</div>
        <div style={{ marginTop: 4, fontFamily: "Inter", fontSize: 14, color: COLORS.inkSoft }}>Cardiology · +91 98•••••43</div>
      </div>

      {/* Generate button */}
      <div style={{
        margin: "20px 22px 0", padding: "22px 24px", background: COLORS.coral, color: "#fff",
        borderRadius: 22, fontFamily: "Inter", fontSize: 18, fontWeight: 700, textAlign: "center",
        boxShadow: "0 14px 30px rgba(232,112,77,0.32)",
      }}>
        Generate secure link
      </div>

      {/* Generated link card */}
      {showLink && (
        <div style={{
          margin: "24px 22px 0", padding: 22, background: "linear-gradient(135deg, #E8F0E9 0%, #fff 100%)",
          borderRadius: 22, border: `2px solid ${COLORS.sage}`,
          opacity: linkEnter, transform: `translateY(${interpolate(linkEnter, [0, 1], [16, 0])}px)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: COLORS.sage, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: COLORS.sage }} /> Link ready
          </div>
          <div style={{ marginTop: 12, padding: "14px 16px", background: "#fff", borderRadius: 12, fontFamily: "monospace", fontSize: 16, color: COLORS.ink, fontWeight: 600 }}>
            vyana.in/s/8f3a··e21c
          </div>
          <div style={{ marginTop: 10, fontFamily: "Inter", fontSize: 14, color: COLORS.inkSoft }}>
            Expires in 23h 58m
          </div>
        </div>
      )}

      <Tabs active="share" />
    </div>
  );
};

// ====================================================================
// CLAIM ASSISTANT — insurance claim wizard
// ====================================================================
export const MockClaim: React.FC<{ generateAt?: number }> = ({ generateAt = 70 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 10, fps, config: { damping: 22 } });
  const steps = [0, 1, 2, 3].map(i => spring({ frame: frame - 30 - i * 10, fps, config: { damping: 22 } }));
  const pdfEnter = spring({ frame: frame - generateAt, fps, config: { damping: 22 } });
  const showPdf = frame > generateAt - 5;
  const stepLabels = ["Discharge", "Bills", "Policy", "Claim PDF"];

  return (
    <div style={{ width: "100%", height: "100%", background: "#FAFAF7", position: "relative", overflow: "hidden" }}>
      <div style={{ padding: "24px 28px 0", opacity: head, transform: `translateY(${interpolate(head, [0, 1], [10, 0])}px)` }}>
        <div style={{ fontFamily: "Inter", fontSize: 14, color: COLORS.inkSoft, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>Claim Assistant</div>
        <div style={{ marginTop: 8, fontFamily: "Fraunces, serif", fontSize: 36, color: COLORS.ink, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05 }}>
          Insurance, <em style={{ color: COLORS.coral, fontStyle: "italic" }}>filed for you</em>
        </div>
      </div>

      {/* Wizard step pills */}
      <div style={{ margin: "24px 22px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {stepLabels.map((s, i) => (
          <div key={s} style={{
            padding: 18, background: "#fff", borderRadius: 18,
            border: `2px solid ${i < 3 ? COLORS.sage : COLORS.coral}`,
            opacity: steps[i], transform: `translateY(${interpolate(steps[i], [0, 1], [12, 0])}px)`,
          }}>
            <div style={{ fontSize: 11, color: COLORS.inkSoft, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Step {i + 1}</div>
            <div style={{ marginTop: 6, fontFamily: "Fraunces, serif", fontSize: 20, color: COLORS.ink, fontWeight: 600, lineHeight: 1.1 }}>{s}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: i < 3 ? COLORS.sage : COLORS.coral, fontWeight: 700 }}>
              {i < 3 ? "✓ Uploaded" : "Generating…"}
            </div>
          </div>
        ))}
      </div>

      {/* Generated claim PDF */}
      {showPdf && (
        <div style={{
          margin: "20px 22px 0", padding: 22,
          background: "linear-gradient(135deg, #FBE4DA 0%, #fff 100%)",
          borderRadius: 22, border: `2px solid ${COLORS.coral}`,
          opacity: pdfEnter, transform: `translateY(${interpolate(pdfEnter, [0, 1], [16, 0])}px)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: COLORS.coralDeep, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: COLORS.coral }} /> Claim ready
          </div>
          <div style={{ marginTop: 12, padding: "14px 16px", background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 56, background: COLORS.coral, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "Inter", fontSize: 12, fontWeight: 800 }}>PDF</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Inter", fontSize: 15, color: COLORS.ink, fontWeight: 700 }}>StarHealth_Claim.pdf</div>
              <div style={{ marginTop: 2, fontFamily: "Inter", fontSize: 13, color: COLORS.inkSoft }}>₹ 84,200 · 12 pages</div>
            </div>
          </div>
        </div>
      )}

      <Tabs active="records" />
    </div>
  );
};

// ====================================================================
// BRIEFING — clinical briefing for doctor
// ====================================================================
export const MockBriefing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 10, fps, config: { damping: 22 } });
  const sections = [0, 1, 2].map(i => spring({ frame: frame - 35 - i * 18, fps, config: { damping: 22 } }));

  return (
    <div style={{ width: "100%", height: "100%", background: "#FAFAF7", position: "relative", overflow: "hidden" }}>
      <div style={{ padding: "24px 28px 0", opacity: head, transform: `translateY(${interpolate(head, [0, 1], [10, 0])}px)` }}>
        <div style={{ fontFamily: "Inter", fontSize: 14, color: COLORS.inkSoft, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>Clinical Briefing</div>
        <div style={{ marginTop: 8, fontFamily: "Fraunces, serif", fontSize: 36, color: COLORS.ink, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05 }}>
          For Dr. <em style={{ color: COLORS.coral, fontStyle: "italic" }}>Iyer</em>
        </div>
      </div>

      {[
        { title: "Subjective", body: "Fatigue past 3 weeks. No chest pain. Sleep disrupted." },
        { title: "History", body: "T2DM since 2019. HbA1c trending down: 7.0 → 6.2." },
        { title: "Medications", body: "Metformin 500mg ×2, Telmisartan 40mg AM, Atorvastatin 10mg PM." },
      ].map((s, i) => (
        <div key={s.title} style={{
          margin: "20px 22px 0", padding: 20, background: "#fff", borderRadius: 20,
          border: `1px solid ${COLORS.border}`,
          opacity: sections[i], transform: `translateY(${interpolate(sections[i], [0, 1], [14, 0])}px)`,
        }}>
          <div style={{ fontSize: 12, color: COLORS.coral, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>{s.title}</div>
          <div style={{ marginTop: 8, fontFamily: "Inter", fontSize: 16, color: COLORS.ink, lineHeight: 1.5 }}>{s.body}</div>
        </div>
      ))}

      <Tabs active="home" />
    </div>
  );
};

// ====================================================================
// EMERGENCY BRIEFING
// ====================================================================
export const MockEmergency: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 10, fps, config: { damping: 22 } });
  const items = [0, 1, 2, 3].map(i => spring({ frame: frame - 35 - i * 10, fps, config: { damping: 22 } }));
  const medsEnter = spring({ frame: frame - 80, fps, config: { damping: 22 } });

  return (
    <div style={{ width: "100%", height: "100%", background: "#FFFBF3", position: "relative", overflow: "hidden" }}>
      {/* Coral top bar */}
      <div style={{ background: COLORS.coral, padding: "24px 24px 22px", color: "#fff", opacity: head, transform: `translateY(${interpolate(head, [0, 1], [-10, 0])}px)` }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: 0.9 }}>Emergency Briefing</div>
        <div style={{ marginTop: 8, fontFamily: "Fraunces, serif", fontSize: 32, fontWeight: 600 }}>Rajan Krishnan, 64</div>
        <div style={{ marginTop: 2, fontFamily: "Inter", fontSize: 13, opacity: 0.85 }}>Father · ABHA •••-1234</div>
      </div>

      {/* Critical badges */}
      <div style={{ padding: "20px 22px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { k: "Blood", v: "B+", c: COLORS.coral },
          { k: "Allergies", v: "Penicillin", c: COLORS.coralDeep },
          { k: "Conditions", v: "T2DM, HTN", c: COLORS.amber },
          { k: "Weight", v: "78 kg", c: COLORS.sage },
        ].map((it, i) => (
          <div key={it.k} style={{
            padding: 18, background: "#fff", borderRadius: 18, border: `2px solid ${it.c}`,
            opacity: items[i], transform: `translateY(${interpolate(items[i], [0, 1], [12, 0])}px)`,
          }}>
            <div style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>{it.k}</div>
            <div style={{ marginTop: 6, fontFamily: "Fraunces, serif", fontSize: 24, color: COLORS.ink, fontWeight: 600, lineHeight: 1.05 }}>{it.v}</div>
          </div>
        ))}
      </div>

      {/* Active medications */}
      <div style={{
        margin: "20px 22px 0", padding: 20, background: "#fff", borderRadius: 20,
        border: `1px solid ${COLORS.border}`,
        opacity: medsEnter, transform: `translateY(${interpolate(medsEnter, [0, 1], [12, 0])}px)`,
      }}>
        <div style={{ fontSize: 12, color: COLORS.coral, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Active medications</div>
        {[
          ["Metformin", "500mg · 2x"],
          ["Telmisartan", "40mg · AM"],
          ["Atorvastatin", "10mg · PM"],
        ].map(([n, d]) => (
          <div key={n} style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontFamily: "Inter", fontSize: 17, color: COLORS.ink, fontWeight: 600 }}>{n}</div>
            <div style={{ fontFamily: "Inter", fontSize: 14, color: COLORS.inkSoft }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ====================================================================
// TIMELINE — chronological life graph
// ====================================================================
export const MockTimeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const head = spring({ frame: frame - 10, fps, config: { damping: 22 } });
  const events = [
    { y: "2019", t: "Diagnosed T2DM", c: COLORS.amber },
    { y: "2021", t: "Started Metformin", c: COLORS.coral },
    { y: "2023", t: "BP under control", c: COLORS.sage },
    { y: "2024", t: "HbA1c 6.4", c: COLORS.sage },
    { y: "2025", t: "HbA1c 6.2 ✓", c: COLORS.sage },
  ];
  const items = events.map((_, i) => spring({ frame: frame - 30 - i * 14, fps, config: { damping: 22 } }));

  return (
    <div style={{ width: "100%", height: "100%", background: "#FAFAF7", position: "relative", overflow: "hidden" }}>
      <div style={{ padding: "24px 28px 0", opacity: head, transform: `translateY(${interpolate(head, [0, 1], [10, 0])}px)` }}>
        <div style={{ fontFamily: "Inter", fontSize: 14, color: COLORS.inkSoft, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>Timeline</div>
        <div style={{ marginTop: 8, fontFamily: "Fraunces, serif", fontSize: 36, color: COLORS.ink, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.05 }}>
          Your life, <em style={{ color: COLORS.coral, fontStyle: "italic" }}>in order</em>
        </div>
      </div>

      <div style={{ position: "relative", margin: "30px 22px 0", paddingLeft: 30 }}>
        <div style={{ position: "absolute", left: 38, top: 8, bottom: 8, width: 2, background: COLORS.border }} />
        {events.map((e, i) => (
          <div key={e.y} style={{
            position: "relative", display: "flex", alignItems: "center", gap: 18, marginBottom: 22,
            opacity: items[i], transform: `translateX(${interpolate(items[i], [0, 1], [-12, 0])}px)`,
          }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: e.c, border: "3px solid #fff", boxShadow: `0 0 0 2px ${e.c}66`, flexShrink: 0, marginLeft: -1 }} />
            <div style={{ flex: 1, padding: "14px 18px", background: "#fff", borderRadius: 16, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 700, letterSpacing: 1.5 }}>{e.y}</div>
              <div style={{ marginTop: 4, fontFamily: "Inter", fontSize: 16, color: COLORS.ink, fontWeight: 600 }}>{e.t}</div>
            </div>
          </div>
        ))}
      </div>

      <Tabs active="home" />
    </div>
  );
};
