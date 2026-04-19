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

// Scene durations match VO + buffer. Total ~161s.
export const SCENES = {
  hook: 14,         // Meera at midnight, WhatsApp search
  chaos: 18,        // The photo of a photo
  story: 16,        // Health is a story
  intro: 13,        // Vyana enters - logo + ABHA
  yourStory: 16,    // Dashboard reveal
  upload: 16,       // Records / upload demo
  trends: 14,       // Trends demo
  rx: 17,           // Rx reader demo
  share: 15,        // Share + ABHA
  emergency: 14,    // The 2AM moment
  close: 8,         // Logo close
};

export const sec = (s: number) => Math.round(s * FPS);
