// Vyana brand tokens
export const COLORS = {
  bg: "#FAFAF7",
  bgDark: "#0F0E0C",
  ink: "#171514",
  inkSoft: "#5A524C",
  paper: "#FFFFFF",
  border: "#E8E3DD",
  coral: "#E8704D",
  coralSoft: "#FBE4DA",
  coralDeep: "#C4502E",
  amber: "#E8A957",
  sage: "#7A9B7E",
  cream: "#F4ECE0",
  shadow: "rgba(23, 21, 20, 0.08)",
};

export const FPS = 30;

// Scene durations.
export const SCENES = {
  collage: 14,      // S0 collage (no VO, ambient music only)
  story: 14,        // s3 VO ~13.5s
  intro: 12,        // s4 VO ~10.8s
  yourStory: 14,    // s5 VO ~13.4s
  upload: 14,       // s6 VO ~13.7s
  trends: 12,       // s7 VO ~11.7s
  rx: 15,           // s8 VO ~14.7s
  share: 13,        // s9 VO ~12.9s
  emergency: 12,    // s10 VO ~11.8s
  close: 6,         // s11 VO ~5.4s
};

export const sec = (s: number) => Math.round(s * FPS);
