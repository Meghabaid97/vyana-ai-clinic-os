import { supabase } from "@/integrations/supabase/client";

/**
 * Fire-and-forget call to detect insights after a record is uploaded.
 * Waits a short delay so the AI summary has a chance to populate.
 */
export function triggerInsightDetection(recordId: string, delayMs = 8000) {
  setTimeout(async () => {
    try {
      await supabase.functions.invoke("detect-insights", {
        body: { mode: "on-upload", recordId },
      });
    } catch (e) {
      console.error("detect-insights trigger failed", e);
    }
  }, delayMs);
}
