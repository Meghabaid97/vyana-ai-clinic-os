import { supabase } from "@/integrations/supabase/client";
import { getActivePatientId } from "@/contexts/ActivePatientContext";

/**
 * Fetch the currently active household member's row.
 * Honours the HouseholdSwitcher selection persisted in localStorage.
 * Falls back to the primary (is_primary=true) patient when no selection exists
 * or the selected id no longer belongs to the signed-in user.
 *
 * RLS guarantees we only ever see rows the signed-in user can access.
 */
export async function fetchActivePatient<T = { id: string }>(
  select: string = "id"
): Promise<T | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const activeId = getActivePatientId();
  if (activeId) {
    const { data } = await supabase
      .from("patients")
      .select(select)
      .eq("id", activeId)
      .maybeSingle();
    if (data) return data as T;
  }

  const { data } = await supabase
    .from("patients")
    .select(select)
    .eq("user_id", session.user.id)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as T) ?? null;
}

/** Subscribe to household-switch events. Returns an unsubscribe fn. */
export function onActivePatientChange(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener("vyana:active-patient-changed", handler);
  return () => window.removeEventListener("vyana:active-patient-changed", handler);
}
