// Symptom journal analysis + doctor visit prep.
// Strict positioning: memory + organization + visit prep. NEVER diagnose.
import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

interface ReqBody {
  patientId: string;
  mode: "insights" | "visit_prep";
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

    const tools = body.mode === "insights" ? [{
      type: "function",
      function: {
        name: "return_insights",
        description: "Return factual symptom patterns from the patient's journal.",
        parameters: {
          type: "object",
          properties: {
            patterns: {
              type: "array",
              description: "3-6 factual observations about frequency, severity trends, or co-occurrences.",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Short factual headline, e.g. 'Headaches: 9 logs in 30 days'" },
                  detail: { type: "string", description: "1-2 sentences of neutral, factual context." },
                  symptom: { type: "string" },
                },
                required: ["title", "detail", "symptom"],
                additionalProperties: false,
              },
            },
            disclaimer: { type: "string", description: "A reminder that this is patient-reported data, not a diagnosis." },
          },
          required: ["patterns", "disclaimer"],
          additionalProperties: false,
        },
      },
    }] : [{
      type: "function",
      function: {
        name: "return_visit_prep",
        description: "Generate a doctor visit preparation summary.",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "2-4 sentence factual summary of recent symptoms, frequency, and what changed." },
            recent_symptoms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  symptom: { type: "string" },
                  frequency: { type: "string", description: "e.g. '9 times in 30 days'" },
                  avg_severity: { type: "string", description: "e.g. '7/10'" },
                  notes: { type: "string" },
                },
                required: ["symptom", "frequency", "avg_severity"],
                additionalProperties: false,
              },
            },
            related_medications: {
              type: "array",
              items: { type: "string", description: "Medication name and any patient-noted effect." },
            },
            questions_for_doctor: {
              type: "array",
              description: "4-7 specific, factual questions the patient can ask.",
              items: { type: "string" },
            },
          },
          required: ["summary", "recent_symptoms", "questions_for_doctor", "related_medications"],
          additionalProperties: false,
        },
      },
    }];

    const userPrompt = body.mode === "insights"
      ? `Patient symptom journal (last 90 days, newest first):\n${JSON.stringify(logs, null, 2)}\n\nReturn factual patterns only. Do not diagnose.`
      : `Patient: ${patient.name}, age ${patient.age ?? "unknown"}.\n\nSymptom journal (last 90 days):\n${JSON.stringify(logs, null, 2)}\n\nActive medications:\n${JSON.stringify(medications, null, 2)}\n\nRecent records (summaries):\n${JSON.stringify(recentRecords.map(r => ({ name: r.file_name, type: r.document_type, summary: r.ai_summary, diagnoses: r.diagnoses, date: r.uploaded_at })), null, 2)}\n\nCreate a doctor visit prep. Stick to facts from the data above.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: tools[0].function.name } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Workspace settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No structured response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const result = JSON.parse(toolCall.function.arguments);

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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
