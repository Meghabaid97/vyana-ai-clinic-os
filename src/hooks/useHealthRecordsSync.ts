import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Cross-device sync for any page that reads `public.health_records`.
 *
 * Fires `onChange` whenever:
 *   - the tab becomes visible again (user switched back from another app),
 *   - the window regains focus,
 *   - Postgres emits an INSERT / UPDATE / DELETE on health_records for the
 *     given patient (realtime channel, RLS-scoped by the active session).
 *
 * This is what makes a record uploaded on web appear on iOS (and vice
 * versa) without the user having to hard-reload the app. The Supabase
 * client already attaches the current session token to REST and realtime
 * connections, so RLS is enforced automatically — we don't send tokens
 * manually here.
 *
 * Pass a nullish `patientId` (e.g. while the active patient is still
 * loading) and the hook stays inert until the id resolves.
 *
 * Requires `health_records` to be in the `supabase_realtime` publication
 * (already enabled via migration).
 */
export function useHealthRecordsSync(
  patientId: string | null | undefined,
  onChange: () => void,
) {
  // Keep a live ref to the latest callback so we don't tear down the
  // realtime channel every render just because the closure changed.
  const cbRef = useRef(onChange);
  useEffect(() => { cbRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!patientId) return;

    const fire = () => { try { cbRef.current(); } catch { /* ignore */ } };

    const onVisible = () => {
      if (document.visibilityState === "visible") fire();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", fire);

    const channel = supabase
      .channel(`health_records:${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "health_records",
          filter: `patient_id=eq.${patientId}`,
        },
        () => fire(),
      )
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", fire);
      void supabase.removeChannel(channel);
    };
  }, [patientId]);
}
