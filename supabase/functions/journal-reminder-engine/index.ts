// Smart journal reminder engine.
// Runs hourly via pg_cron. For each active patient:
//   1. Loads or creates journal_preferences row.
//   2. If auto_cadence, infers cadence from health signals:
//        - active medication_reminders → daily
//        - recent discharge summary in health_records (≤30d) → daily
//        - any chronic diagnosis keyword in health_records → daily
//        - otherwise → frequent (~3x/week)
//   3. Decides if a nudge is due based on cadence + last_nudged_at + preferred_hour.
//   4. Inserts an in-app notification (notifications table) and updates last_nudged_at.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHRONIC_KEYWORDS = [
  "diabetes", "hypertension", "asthma", "copd", "ckd", "chronic kidney",
  "heart failure", "ischemic", "arthritis", "thyroid", "epilepsy",
  "cancer", "lupus", "crohn", "ulcerative colitis", "parkinson",
];

const DISCHARGE_HINTS = ["discharge", "post-op", "post operative", "post-operative"];

type Cadence = "daily" | "frequent" | "weekly" | "off";

interface Pref {
  id: string;
  patient_id: string;
  cadence: Cadence;
  auto_cadence: boolean;
  last_nudged_at: string | null;
  last_logged_date: string | null;
  preferred_hour: number;
  current_streak: number;
}

const CADENCE_LABEL: Record<Cadence, string> = {
  daily: "Daily check-ins",
  frequent: "A few times a week",
  weekly: "Weekly",
  off: "Off",
};

const NUDGE_TITLES = [
  "How are you feeling today?",
  "A quick check-in?",
  "30 seconds for your health story",
];

const NUDGE_MESSAGES = [
  "Log how you're feeling. Vyana spots patterns earlier when you check in.",
  "Even a one-tap log builds your health timeline.",
  "Tap to share today's energy, sleep, or any symptom.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hoursSince(iso: string | null): number {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 36e5;
}

function isDueByCadence(cadence: Cadence, lastNudgedAt: string | null): boolean {
  if (cadence === "off") return false;
  const h = hoursSince(lastNudgedAt);
  if (cadence === "daily") return h >= 22;
  if (cadence === "frequent") return h >= 56; // ~3x/week
  if (cadence === "weekly") return h >= 160;
  return false;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Pick recently active patients (opened app in last 60 days) to limit fanout.
    const cutoff = new Date(Date.now() - 60 * 24 * 36e5).toISOString();
    const { data: patients, error: pErr } = await supabase
      .from("patients")
      .select("id, user_id, name, last_app_open_at")
      .gte("last_app_open_at", cutoff);

    if (pErr) throw pErr;

    const now = new Date();
    // preferred_hour is interpreted as IST (UTC+5:30) since Vyana is India-only.
    // IST hour = (UTC hour + 5) when minutes >= 30, else (UTC hour + 5).
    // Simpler: add 330 minutes to UTC and read the hour.
    const istNow = new Date(now.getTime() + 330 * 60 * 1000);
    const currentHourIST = istNow.getUTCHours();
    let nudged = 0;
    let skipped = 0;
    let emailed = 0;

    for (const patient of patients ?? []) {
      // Load or create preferences
      const { data: existing } = await supabase
        .from("journal_preferences")
        .select("id, patient_id, cadence, auto_cadence, last_nudged_at, last_logged_date, preferred_hour, current_streak")
        .eq("patient_id", patient.id)
        .maybeSingle();

      let pref: Pref;
      if (!existing) {
        const { data: created, error: cErr } = await supabase
          .from("journal_preferences")
          .insert({ patient_id: patient.id })
          .select()
          .single();
        if (cErr) { skipped++; continue; }
        pref = created as Pref;
      } else {
        pref = existing as Pref;
      }

      // Hour gate (IST): only nudge in a ±1h window around preferred_hour (IST).
      const hourDiff = Math.abs(currentHourIST - pref.preferred_hour);
      const wrappedDiff = Math.min(hourDiff, 24 - hourDiff);
      if (wrappedDiff > 1) { skipped++; continue; }

      // Resolve effective cadence
      let cadence: Cadence = pref.cadence;
      if (pref.auto_cadence) {
        // Active medication reminders → daily
        const { count: medCount } = await supabase
          .from("medication_reminders")
          .select("id", { count: "exact", head: true })
          .eq("patient_id", patient.id)
          .eq("is_active", true);

        let inferred: Cadence = "frequent";
        if ((medCount ?? 0) > 0) inferred = "daily";

        if (inferred !== "daily") {
          // Look at recent health records for discharge / chronic hints
          const since = new Date(Date.now() - 30 * 24 * 36e5).toISOString();
          const { data: recs } = await supabase
            .from("health_records")
            .select("document_type, ai_summary, diagnoses, uploaded_at")
            .eq("patient_id", patient.id)
            .gte("uploaded_at", since)
            .limit(20);

          const blob = (recs ?? [])
            .map((r: any) => `${r.document_type ?? ""} ${r.ai_summary ?? ""} ${JSON.stringify(r.diagnoses ?? [])}`.toLowerCase())
            .join(" ");

          if (DISCHARGE_HINTS.some((k) => blob.includes(k))) inferred = "daily";
          else if (CHRONIC_KEYWORDS.some((k) => blob.includes(k))) inferred = "daily";
        }

        cadence = inferred;
      }

      if (!isDueByCadence(cadence, pref.last_nudged_at)) { skipped++; continue; }

      // Suppress if user already logged in the last cadence-window
      const sinceLog = cadence === "daily" ? 20 : cadence === "frequent" ? 48 : 144;
      const sinceIso = new Date(Date.now() - sinceLog * 36e5).toISOString();
      const { count: recentLogs } = await supabase
        .from("symptom_logs")
        .select("id", { count: "exact", head: true })
        .eq("patient_id", patient.id)
        .gte("logged_at", sinceIso);
      if ((recentLogs ?? 0) > 0) {
        // Update last_nudged_at so we don't keep checking; treat the log as the nudge satisfied
        await supabase
          .from("journal_preferences")
          .update({ last_nudged_at: now.toISOString() })
          .eq("id", pref.id);
        skipped++;
        continue;
      }

      // Insert in-app notification
      const { error: nErr } = await supabase.from("notifications").insert({
        user_id: patient.user_id,
        title: pick(NUDGE_TITLES),
        message: pick(NUDGE_MESSAGES),
        type: "journal_reminder",
        related_entity_type: "journal_preferences",
        related_entity_id: pref.id,
      });
      if (nErr) { skipped++; continue; }

      // Resolve email via auth admin and dispatch a transactional email.
      // Suppression + queueing + retries are handled by send-transactional-email.
      try {
        const { data: userResp } = await supabase.auth.admin.getUserById(patient.user_id);
        const email = userResp?.user?.email;
        if (email) {
          const todayKey = istNow.toISOString().slice(0, 10);
          await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "journal-reminder",
              recipientEmail: email,
              idempotencyKey: `journal-reminder-${pref.id}-${todayKey}`,
              templateData: {
                name: (patient as any).name?.split(" ")?.[0] ?? undefined,
                streakDays: pref.current_streak ?? 0,
                cadenceLabel: CADENCE_LABEL[cadence],
              },
            },
          });
          emailed++;
        }
      } catch (emailErr) {
        console.warn("journal-reminder email failed", { patientId: patient.id, err: String(emailErr) });
        // Non-fatal — in-app notification still landed.
      }

      await supabase
        .from("journal_preferences")
        .update({ last_nudged_at: now.toISOString() })
        .eq("id", pref.id);
      nudged++;
    }

    return new Response(
      JSON.stringify({ ok: true, nudged, emailed, skipped, scanned: patients?.length ?? 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("journal-reminder-engine error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
