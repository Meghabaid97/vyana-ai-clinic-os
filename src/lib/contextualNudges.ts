// Trigger-aware nudges — pure, deterministic per patient/day. No external API calls.
// Inputs: diagnoses list, city, current Date. Output: one short, gentle line or null.

export interface NudgeInput {
  diagnoses: string[];   // free-form labels pulled from health_records.diagnoses
  city: string | null;
  now?: Date;
}

export interface Nudge {
  key: string;           // stable id, used for localStorage dedupe
  emoji: string;
  text: string;          // headline question, max ~70 chars
  hint?: string;         // optional 1-line context (e.g. "Bengaluru AQI is high today")
}

const has = (dx: string[], ...needles: string[]) => {
  const hay = dx.join(" ").toLowerCase();
  return needles.some(n => hay.includes(n));
};

// Cities that routinely cross AQI 150+ in winter months (Oct–Feb).
// Keeps the nudge plausible without calling a live API.
const HIGH_AQI_CITIES = ["delhi", "noida", "gurgaon", "gurugram", "ghaziabad", "faridabad", "bengaluru", "bangalore", "mumbai", "kolkata", "patna", "lucknow"];

// Cities where pollen / damp / mould flares peak in monsoon (Jun–Sep).
const MONSOON_CITIES = ["mumbai", "kochi", "thiruvananthapuram", "chennai", "kolkata", "goa", "bengaluru", "bangalore", "pune"];

export function pickContextualNudge({ diagnoses, city, now = new Date() }: NudgeInput): Nudge | null {
  const dx = (diagnoses || []).filter(Boolean);
  const month = now.getMonth(); // 0-11
  const hour = now.getHours();
  const cityLc = (city || "").trim().toLowerCase();
  const isWinterAir = month >= 9 || month <= 1; // Oct–Feb
  const isMonsoon = month >= 5 && month <= 8;   // Jun–Sep
  const isSummer = month >= 2 && month <= 5;    // Mar–Jun

  // 1) Respiratory + bad-air city + winter window
  if (has(dx, "asthma", "copd", "bronchitis", "wheez")) {
    if (isWinterAir && HIGH_AQI_CITIES.includes(cityLc)) {
      return {
        key: `aqi-${cityLc}-${now.toDateString()}`,
        emoji: "🌫️",
        text: "Asthma okay today?",
        hint: `${city} air quality tends to spike this time of year.`,
      };
    }
    if (isMonsoon && MONSOON_CITIES.includes(cityLc)) {
      return {
        key: `monsoon-${cityLc}-${now.toDateString()}`,
        emoji: "🌧️",
        text: "Any wheeze or tightness today?",
        hint: "Monsoon damp can flare airways.",
      };
    }
  }

  // 2) Diabetes — gentle post-lunch sugar check
  if (has(dx, "diabet", "pre-diabet", "prediabet") && hour >= 14 && hour <= 17) {
    return {
      key: `sugar-${now.toDateString()}`,
      emoji: "🩸",
      text: "Logged your post-lunch sugar yet?",
      hint: "A 2-hour reading after lunch helps spot patterns.",
    };
  }

  // 3) Hypertension — morning BP check
  if (has(dx, "hypertens", "bp", "blood pressure") && hour >= 6 && hour <= 11) {
    return {
      key: `bp-${now.toDateString()}`,
      emoji: "❤️",
      text: "Morning BP reading taken?",
      hint: "Mornings give the most consistent baseline.",
    };
  }

  // 4) Migraine — heat or screen-time triggers in summer
  if (has(dx, "migraine", "headache") && isSummer) {
    return {
      key: `migraine-${now.toDateString()}`,
      emoji: "🧠",
      text: "Headache showing up today?",
      hint: "Heat and dehydration are common summer triggers.",
    };
  }

  // 5) Thyroid — gentle weekly reminder window (Monday morning)
  if (has(dx, "thyroid", "hypothyroid", "hyperthyroid") && now.getDay() === 1 && hour <= 11) {
    return {
      key: `thyroid-${now.toDateString()}`,
      emoji: "🦋",
      text: "Took your thyroid tablet on empty stomach?",
      hint: "Best absorbed 30–60 minutes before food.",
    };
  }

  // 6) PCOS / cycle tracking
  if (has(dx, "pcos", "pcod")) {
    return {
      key: `pcos-${now.toDateString()}`,
      emoji: "🌸",
      text: "How's the cycle this week?",
      hint: "Logging mood + flow helps us spot the pattern.",
    };
  }

  return null;
}
