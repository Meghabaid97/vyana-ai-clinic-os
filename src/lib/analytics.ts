import { supabase } from "@/integrations/supabase/client";

/**
 * Vyana product analytics event taxonomy.
 * Keep this list tight — add new names only when you actually use them.
 */
export type AnalyticsEventName =
  | "signup_completed"
  | "doc_uploaded"
  | "doc_extracted"
  | "doc_extraction_failed"
  | "briefing_generated"
  | "briefing_shared"
  | "briefing_regenerated"
  | "paywall_triggered"
  | "paywall_viewed"
  | "checkout_opened"
  | "payment_succeeded"
  | "payment_failed"
  | "invite_sent"
  | "invite_accepted"
  | "family_member_added"
  | "reminder_fired"
  | "reminder_completed"
  | "record_edited"
  | "page_view";

const SESSION_KEY = "vyana_analytics_session";

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "no-session";
  }
}

/**
 * Fire-and-forget event logger. Never throws, never blocks UI.
 */
export async function logEvent(
  event: AnalyticsEventName,
  properties: Record<string, unknown> = {},
  patientId?: string | null,
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("analytics_events").insert({
      user_id: user.id,
      patient_id: patientId ?? null,
      event_name: event,
      properties: properties as never,
      session_id: getSessionId(),
    });
  } catch (err) {
    // Silent — analytics must never break the app.
    if (import.meta.env.DEV) console.warn("[analytics] logEvent failed", err);
  }
}
