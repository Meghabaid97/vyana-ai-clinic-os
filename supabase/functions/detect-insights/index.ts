import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DetectMode = "on-upload" | "scheduled";

interface NotifPayload {
  user_id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  related_entity_id?: string | null;
  related_entity_type?: string | null;
}

const VITALS_RANGES: Record<string, { low?: number; high?: number; label: string; unit: string }> = {
  bp_systolic: { high: 140, label: "Blood pressure (systolic)", unit: "mmHg" },
  bp_diastolic: { high: 90, label: "Blood pressure (diastolic)", unit: "mmHg" },
  fasting_blood_sugar: { high: 126, low: 70, label: "Fasting blood sugar", unit: "mg/dL" },
  hba1c: { high: 6.5, label: "HbA1c", unit: "%" },
  total_cholesterol: { high: 240, label: "Total cholesterol", unit: "mg/dL" },
  ldl: { high: 160, label: "LDL cholesterol", unit: "mg/dL" },
  triglycerides: { high: 200, label: "Triglycerides", unit: "mg/dL" },
};

async function alreadyNotified(
  admin: ReturnType<typeof createClient>,
  userId: string,
  type: string,
  entityId: string | null,
  hoursWindow = 24,
): Promise<boolean> {
  const since = new Date(Date.now() - hoursWindow * 3600_000).toISOString();
  let q = admin.from("notifications").select("id")
    .eq("user_id", userId)
    .eq("related_entity_type", type)
    .gte("created_at", since)
    .limit(1);
  if (entityId) q = q.eq("related_entity_id", entityId);
  const { data } = await q;
  return !!(data && data.length);
}

async function insertNotif(admin: ReturnType<typeof createClient>, n: NotifPayload) {
  await admin.from("notifications").insert(n);
}

async function detectForRecord(
  admin: ReturnType<typeof createClient>,
  userId: string,
  patient: { id: string; name: string; age: number | null },
  recordId: string,
) {
  // Load this record + previous records to compare
  const { data: records } = await admin
    .from("health_records")
    .select("id, file_name, ai_summary, uploaded_at")
    .eq("patient_id", patient.id)
    .order("uploaded_at", { ascending: false })
    .limit(10);

  if (!records || records.length === 0) return;

  const latest = records.find((r) => r.id === recordId) ?? records[0];
  if (!latest.ai_summary) {
    // Summary not ready yet — skip silently; will be retried on next upload or cron
    return;
  }

  const previous = records.filter((r) => r.id !== latest.id && r.ai_summary);

  // Call analyze-health-risks via service-role to extract vitals
  let vitals: Record<string, number | null> | null = null;
  try {
    const resp = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/analyze-health-risks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        },
        body: JSON.stringify({
          records: [{ file_name: latest.file_name, ai_summary: latest.ai_summary }],
          patientName: patient.name,
          patientAge: patient.age,
          _serviceUserId: userId,
        }),
      },
    );
    if (resp.ok) {
      const json = await resp.json();
      vitals = json?.vitals ?? null;
    }
  } catch (e) {
    console.error("analyze-health-risks failed", e);
  }

  // Tier 1A: New insight detected (always fire on first summary of a new record)
  if (!(await alreadyNotified(admin, userId, "health_record", latest.id, 24 * 365))) {
    await insertNotif(admin, {
      user_id: userId,
      title: "New insight from your latest report",
      message: `We analyzed ${latest.file_name}. Open Trends to see what stood out.`,
      type: "info",
      related_entity_id: latest.id,
      related_entity_type: "health_record",
    });
  }

  // Tier 5: Out-of-range / abnormal signal (with disclaimer, no fear-mongering)
  if (vitals) {
    const flagged: string[] = [];
    for (const [key, range] of Object.entries(VITALS_RANGES)) {
      const v = vitals[key];
      if (v == null || typeof v !== "number") continue;
      if (range.high != null && v > range.high) flagged.push(`${range.label} ${Math.round(v)} ${range.unit}`);
      else if (range.low != null && v < range.low) flagged.push(`${range.label} ${Math.round(v)} ${range.unit}`);
    }
    if (flagged.length > 0 && !(await alreadyNotified(admin, userId, "abnormal_signal", latest.id, 24 * 365))) {
      await insertNotif(admin, {
        user_id: userId,
        title: "Worth a closer look",
        message: `${flagged.slice(0, 2).join(" and ")} appears outside the typical range. This is a discussion point, not a diagnosis. Consider sharing with your doctor.`,
        type: "warning",
        related_entity_id: latest.id,
        related_entity_type: "abnormal_signal",
      });
    }
  }

  // Tier 1B: Comparison insight (needs 2+ reports with vitals)
  if (previous.length > 0 && vitals) {
    // Compare against most recent previous via vital_history
    const { data: history } = await admin
      .from("vital_history")
      .select("vitals, recorded_at")
      .eq("patient_id", patient.id)
      .order("recorded_at", { ascending: false })
      .limit(5);

    if (history && history.length >= 2) {
      const latestVitals = (history[0].vitals ?? {}) as Record<string, number | null>;
      const priorVitals = (history[1].vitals ?? {}) as Record<string, number | null>;
      const changes: string[] = [];
      for (const [key, range] of Object.entries(VITALS_RANGES)) {
        const a = latestVitals[key];
        const b = priorVitals[key];
        if (typeof a !== "number" || typeof b !== "number" || b === 0) continue;
        const pct = ((a - b) / b) * 100;
        if (Math.abs(pct) >= 10) {
          const arrow = pct > 0 ? "up" : "down";
          changes.push(`${range.label} is ${arrow} ${Math.abs(Math.round(pct))}%`);
        }
      }
      if (changes.length > 0 && !(await alreadyNotified(admin, userId, "comparison", latest.id, 24 * 365))) {
        await insertNotif(admin, {
          user_id: userId,
          title: "Your numbers are changing",
          message: `Compared with your last report: ${changes.slice(0, 2).join(", ")}. Open Trends to see the pattern.`,
          type: "info",
          related_entity_id: latest.id,
          related_entity_type: "comparison",
        });
      }
    }
  }
}

async function runScheduled(admin: ReturnType<typeof createClient>) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Tier 2: Pre-visit prep — fire at 7d, 3d, 1d, and same-day windows.
  // We use a unique related_entity_type per window so dedupe doesn't suppress
  // later reminders after the first one fires.
  const visitWindows: Array<{ days: number; type: string; title: string; message: string }> = [
    {
      days: 7,
      type: "pre_visit_7d",
      title: "Doctor visit in a week",
      message: "Your visit is 7 days away. Start logging any symptoms so your briefing is ready.",
    },
    {
      days: 3,
      type: "pre_visit_3d",
      title: "Doctor visit in 3 days",
      message: "Upload any new reports now so your clinical briefing reflects them.",
    },
    {
      days: 1,
      type: "pre_visit",
      title: "Doctor visit tomorrow. Your summary is ready.",
      message: "Don't explain everything again. Tap to open your 30-second clinical briefing before you walk in.",
    },
    {
      days: 0,
      type: "pre_visit_today",
      title: "Doctor visit today",
      message: "Open your briefing before you walk in. Share the secure link with your doctor in one tap.",
    },
  ];

  for (const w of visitWindows) {
    const target = new Date(today);
    target.setDate(target.getDate() + w.days);
    const targetStr = target.toISOString().slice(0, 10);
    const { data: visits } = await admin
      .from("patients")
      .select("id, user_id, name, next_visit_date")
      .eq("next_visit_date", targetStr);

    for (const p of visits ?? []) {
      if (await alreadyNotified(admin, p.user_id, w.type, p.id, 36)) continue;
      await insertNotif(admin, {
        user_id: p.user_id,
        title: w.title,
        message: w.message,
        type: "info",
        related_entity_id: p.id,
        related_entity_type: w.type,
      });
    }
  }

  // Tier 4: Re-engagement — inactive 7+ days, has at least 1 record
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 3600_000).toISOString();
  const { data: inactive } = await admin
    .from("patients")
    .select("id, user_id, last_app_open_at")
    .lt("last_app_open_at", sevenDaysAgo)
    .gt("last_app_open_at", tenDaysAgo); // narrow window, avoid spamming

  for (const p of inactive ?? []) {
    if (await alreadyNotified(admin, p.user_id, "re_engagement", p.id, 24 * 7)) continue;
    const { data: recs } = await admin
      .from("health_records")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", p.id);
    const count = (recs as unknown as { length?: number })?.length ?? 0;
    const msg = count >= 2
      ? `You've uploaded ${count} reports. One more unlocks a deeper trend view.`
      : "Add one more report to start seeing your health trends over time.";
    await insertNotif(admin, {
      user_id: p.user_id,
      title: "Your story is waiting",
      message: msg,
      type: "info",
      related_entity_id: p.id,
      related_entity_type: "re_engagement",
    });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const body = await req.json().catch(() => ({}));
    const mode: DetectMode = body?.mode ?? "on-upload";

    if (mode === "scheduled") {
      // Cron-triggered: no per-user auth required (called with service key)
      await runScheduled(admin);
      return new Response(JSON.stringify({ ok: true, mode }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // on-upload: needs authenticated user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { recordId } = body ?? {};
    if (!recordId || typeof recordId !== "string") {
      return new Response(JSON.stringify({ error: "recordId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: patient } = await admin
      .from("patients")
      .select("id, user_id, name, age")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!patient) {
      return new Response(JSON.stringify({ error: "Patient not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await detectForRecord(admin, user.id, patient as { id: string; name: string; age: number | null }, recordId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-insights error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
