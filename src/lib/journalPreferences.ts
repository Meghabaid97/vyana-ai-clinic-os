import { supabase } from "@/integrations/supabase/client";

export type Cadence = "daily" | "frequent" | "weekly" | "off";

export interface JournalPreference {
  id: string;
  patient_id: string;
  cadence: Cadence;
  auto_cadence: boolean;
  current_streak: number;
  longest_streak: number;
  last_logged_date: string | null;
  preferred_hour: number;
}

const DEFAULT_PREF = (patientId: string) => ({
  patient_id: patientId,
  cadence: "frequent" as Cadence,
  auto_cadence: true,
  current_streak: 0,
  longest_streak: 0,
  last_logged_date: null,
  preferred_hour: 9,
});

/** Loads the patient's journal preferences, creating a default row if missing. */
export async function loadOrCreatePreference(patientId: string): Promise<JournalPreference | null> {
  const { data: existing } = await supabase
    .from("journal_preferences")
    .select("*")
    .eq("patient_id", patientId)
    .maybeSingle();
  if (existing) return existing as JournalPreference;
  const { data: created } = await supabase
    .from("journal_preferences")
    .insert(DEFAULT_PREF(patientId))
    .select()
    .single();
  return (created as JournalPreference) ?? null;
}

/** Updates the streak after a successful symptom log. Returns the new streak count. */
export async function recordLogForStreak(patientId: string): Promise<number> {
  const pref = await loadOrCreatePreference(patientId);
  if (!pref) return 0;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  if (pref.last_logged_date === todayStr) return pref.current_streak;

  let newStreak = 1;
  if (pref.last_logged_date) {
    const last = new Date(pref.last_logged_date + "T00:00:00");
    const diffDays = Math.round((today.getTime() - last.getTime()) / 86400000);
    if (diffDays === 1) newStreak = pref.current_streak + 1;
    // For "frequent"/"weekly", keep streak alive within a wider window
    else if (pref.cadence === "frequent" && diffDays <= 3) newStreak = pref.current_streak + 1;
    else if (pref.cadence === "weekly" && diffDays <= 8) newStreak = pref.current_streak + 1;
  }

  const longest = Math.max(pref.longest_streak, newStreak);
  await supabase
    .from("journal_preferences")
    .update({
      current_streak: newStreak,
      longest_streak: longest,
      last_logged_date: todayStr,
    })
    .eq("id", pref.id);
  return newStreak;
}

/** Whether the streak is "stale" — user hasn't logged within the cadence window. */
export function isStreakStale(pref: JournalPreference | null): boolean {
  if (!pref || !pref.last_logged_date) return true;
  const last = new Date(pref.last_logged_date + "T00:00:00");
  const diffDays = Math.round((Date.now() - last.getTime()) / 86400000);
  if (pref.cadence === "daily") return diffDays >= 2;
  if (pref.cadence === "frequent") return diffDays >= 4;
  if (pref.cadence === "weekly") return diffDays >= 9;
  return true;
}

export const CADENCE_LABEL: Record<Cadence, string> = {
  daily: "Daily check-ins",
  frequent: "A few times a week",
  weekly: "Weekly",
  off: "Don't remind me",
};
