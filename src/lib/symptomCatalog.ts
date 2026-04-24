// Common-8 symptoms with quick metadata. Free text supported via "other".
export interface SymptomDef {
  id: string;
  label: string;
  emoji: string;
  commonTriggers: string[];
  commonAssociated: string[];
  defaultLocation?: string;
}

export const SYMPTOM_CATALOG: SymptomDef[] = [
  { id: "headache", label: "Headache", emoji: "🤕",
    commonTriggers: ["Stress", "Lack of sleep", "Skipped meal", "Screen time", "Dehydration"],
    commonAssociated: ["Nausea", "Blurred vision", "Light sensitivity"], defaultLocation: "Head" },
  { id: "fatigue", label: "Fatigue", emoji: "😴",
    commonTriggers: ["Poor sleep", "Stress", "Overwork", "Skipped meal"],
    commonAssociated: ["Brain fog", "Body ache", "Low mood"] },
  { id: "fever", label: "Fever", emoji: "🌡️",
    commonTriggers: ["Recent travel", "Sick contact"],
    commonAssociated: ["Chills", "Body ache", "Headache", "Cough"] },
  { id: "cough", label: "Cough", emoji: "🤧",
    commonTriggers: ["Cold weather", "Dust", "Allergens"],
    commonAssociated: ["Sore throat", "Phlegm", "Chest tightness"], defaultLocation: "Chest/Throat" },
  { id: "stomach_pain", label: "Stomach pain", emoji: "🤢",
    commonTriggers: ["After meals", "Spicy food", "Dairy", "Stress"],
    commonAssociated: ["Bloating", "Nausea", "Loose motion"], defaultLocation: "Abdomen" },
  { id: "skin", label: "Skin issue", emoji: "🩹",
    commonTriggers: ["New product", "Heat", "Food", "Stress"],
    commonAssociated: ["Itching", "Redness", "Swelling"] },
  { id: "menstrual", label: "Menstrual", emoji: "🌸",
    commonTriggers: ["Cycle day"],
    commonAssociated: ["Cramps", "Mood swings", "Heavy flow", "Back pain"], defaultLocation: "Lower abdomen" },
  { id: "mental", label: "Mental health", emoji: "🧠",
    commonTriggers: ["Stress", "Sleep change", "Workload"],
    commonAssociated: ["Anxiety", "Low mood", "Irritability", "Sleep change"] },
  { id: "other", label: "Other", emoji: "✏️",
    commonTriggers: [], commonAssociated: [] },
];

export const symptomById = (id: string) =>
  SYMPTOM_CATALOG.find((s) => s.id === id) ?? SYMPTOM_CATALOG[SYMPTOM_CATALOG.length - 1];
