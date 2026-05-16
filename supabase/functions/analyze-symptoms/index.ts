// Symptom journal analysis + doctor visit prep.
// Strict positioning: memory + organization + visit prep. NEVER diagnose.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
import { createClient } from "jsr:@supabase/supabase-js@2";
import { withGuardrails } from "../_shared/guardrails.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

interface ReqBody {
  patientId: string;
  mode: "insights" | "visit_prep";
}

const symptomLabel = (log: any) => log.custom_symptom_name || String(log.symptom_type || "symptom").replace(/_/g, " ");

function buildLocalInsights(logs: any[]) {
  const groups = new Map<string, any[]>();
  for (const log of logs) {
    const label = symptomLabel(log);
    groups.set(label, [...(groups.get(label) || []), log]);
  }

  const patterns = [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6)
    .map(([symptom, entries]) => {
      const avg = entries.reduce((sum, log) => sum + Number(log.severity || 0), 0) / Math.max(entries.length, 1);
      const latest = new Date(entries[0]?.logged_at || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const triggers = [...new Set(entries.flatMap((log) => Array.isArray(log.triggers) ? log.triggers : []))].slice(0, 3);
      return {
        title: `${symptom}: ${entries.length} log${entries.length === 1 ? "" : "s"}`,
        detail: `Average severity ${avg.toFixed(1)}/10. Latest log ${latest}${triggers.length ? `. Often noted with: ${triggers.join(", ")}` : ""}. Discuss patterns with your doctor.`,
        symptom,
      };
    });

  return {
    patterns,
    disclaimer: "This is based on patient-reported journal entries only. It is not a diagnosis. Discuss with your doctor.",
  };
}

function buildLocalVisitPrep(patient: any, logs: any[], medications: any[]) {
  const insights = buildLocalInsights(logs);
  return {
    summary: `${patient.name || "Patient"} logged ${logs.length} symptom entr${logs.length === 1 ? "y" : "ies"} in the last 90 days. The most frequent items are ${insights.patterns.slice(0, 3).map((p: any) => p.symptom).join(", ") || "recent symptoms"}. Use this as a factual discussion note for the doctor.`,
    recent_symptoms: insights.patterns.slice(0, 5).map((p: any) => ({
      symptom: p.symptom,
      frequency: p.title.split(": ")[1] || "recently logged",
      avg_severity: p.detail.match(/Average severity ([\d.]+\/10)/)?.[1] || "not available",
      notes: p.detail,
    })),
    related_medications: medications.map((m: any) => [m.medication_name, m.dosage, m.frequency].filter(Boolean).join(" · ")),
    questions_for_doctor: [
      "Do these symptom patterns need any tests or examination?",
      "Could any current medication or routine be related to these symptoms?",
      "What warning signs should make me seek urgent care?",
      "What should I track before the next visit?",
    ],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as ReqBody;
    if (!body.patientId || !["insights", "visit_prep"].includes(body.mode)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify patient ownership
    const { data: patient } = await admin
      .from("patients").select("id, user_id, name, age")
      .eq("id", body.patientId).maybeSingle();
    if (!patient || patient.user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull last 90 days of symptom logs
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: logs } = await admin
      .from("symptom_logs")
      .select("symptom_type, custom_symptom_name, severity, duration, body_location, triggers, associated_symptoms, medications_taken, notes, logged_at")
      .eq("patient_id", body.patientId)
      .gte("logged_at", since)
      .order("logged_at", { ascending: false })
      .limit(200);

    if (!logs || logs.length === 0) {
      return new Response(JSON.stringify({
        error: "no_data",
        message: "Log a few symptoms first so Vyana can find patterns.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let medications: any[] = [];
    let recentRecords: any[] = [];
    if (body.mode === "visit_prep") {
      const { data: meds } = await admin
        .from("medication_reminders")
        .select("medication_name, dosage, frequency, notes")
        .eq("patient_id", body.patientId).eq("is_active", true).limit(20);
      medications = meds || [];

      const { data: records } = await admin
        .from("health_records")
        .select("file_name, document_type, ai_summary, important_findings, diagnoses, uploaded_at")
        .eq("patient_id", body.patientId)
        .order("uploaded_at", { ascending: false }).limit(10);
      recentRecords = records || [];
    }

    const systemPrompt = `You are Vyana, a longitudinal health memory assistant. You ORGANIZE and SUMMARIZE patient-reported data — you NEVER diagnose, you NEVER suggest treatments, and you NEVER recommend medications. Your role is to help patients see patterns in their own data and prepare for doctor visits.

ABSOLUTE RULES:
- Never say "you have X condition" or "this is caused by Y".
- Use neutral language: "logged", "reported", "noted", "appears alongside".
- Always remind: "Discuss with your doctor."
- Numbers and frequencies are facts; interpretations belong to clinicians.`;

    const userPrompt = body.mode === "insights"
      ? `Patient symptom journal (last 90 days, newest first):\n${JSON.stringify(logs, null, 2)}\n\nReturn ONLY valid JSON in this shape: {"patterns":[{"title":"","detail":"","symptom":""}],"disclaimer":""}. Return factual patterns only. Do not diagnose.`
      : `Patient: ${patient.name}, age ${patient.age ?? "unknown"}.\n\nSymptom journal (last 90 days):\n${JSON.stringify(logs, null, 2)}\n\nActive medications:\n${JSON.stringify(medications, null, 2)}\n\nRecent records (summaries):\n${JSON.stringify(recentRecords.map(r => ({ name: r.file_name, type: r.document_type, summary: r.ai_summary, diagnoses: r.diagnoses, date: r.uploaded_at })), null, 2)}\n\nReturn ONLY valid JSON in this shape: {"summary":"","recent_symptoms":[{"symptom":"","frequency":"","avg_severity":"","notes":""}],"related_medications":[],"questions_for_doctor":[]}. Create a doctor visit prep. Stick to facts from the data above.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: withGuardrails(systemPrompt) },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      const fallback = body.mode === "insights" ? buildLocalInsights(logs) : buildLocalVisitPrep(patient, logs, medications);
      return new Response(JSON.stringify(fallback), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiResp.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let result: any;
    try {
      result = JSON.parse(raw);
    } catch {
      result = body.mode === "insights" ? buildLocalInsights(logs) : buildLocalVisitPrep(patient, logs, medications);
    }

    // Persist visit prep
    if (body.mode === "visit_prep") {
      await admin.from("doctor_visit_prep").insert({
        patient_id: body.patientId,
        summary: result.summary,
        questions_for_doctor: result.questions_for_doctor,
        related_medications: result.related_medications,
        related_symptoms: result.recent_symptoms,
        date_range_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        date_range_end: new Date().toISOString().slice(0, 10),
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-symptoms error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
