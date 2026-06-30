import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withGuardrails } from "../_shared/guardrails.ts";
import { callLovableAi, logFunctionCall, newRequestId } from "../_shared/observability.ts";
import { requireAiConsent } from "../_shared/consent-gate.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function checkRateLimit(userId: string, functionName: string, maxPerHour = 50) {
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { data } = await adminClient
    .from('api_usage').select('id')
    .eq('user_id', userId).eq('function_name', functionName)
    .gte('created_at', oneHourAgo);
  if (data && data.length >= maxPerHour) throw new Error('RATE_LIMITED');
  await adminClient.from('api_usage').insert({ user_id: userId, function_name: functionName });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const _consentBlock = await requireAiConsent(user.id);
    if (_consentBlock) return _consentBlock;

    try {
      await checkRateLimit(user.id, 'clinical-briefing', 50);
    } catch (e) {
      if (e instanceof Error && e.message === 'RATE_LIMITED') {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw e;
    }

    // Plan gate: enforce briefing entitlements server-side so no client path can bypass.
    const { data: entRes, error: entErr } = await supabaseClient.rpc('get_entitlements');
    if (entErr) {
      console.error('get_entitlements failed:', entErr);
      return new Response(JSON.stringify({ error: 'Could not verify subscription' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const ent = (entRes ?? {}) as Record<string, unknown>;
    const isPro = ent.is_pro === true;
    const remaining = typeof ent.briefings_remaining === 'number' ? ent.briefings_remaining : 0;
    if (!isPro && remaining <= 0) {
      return new Response(JSON.stringify({
        error: 'PLAN_LIMIT_REACHED',
        message: "You've used your free briefing. Upgrade to Vyana Pro for unlimited briefings.",
        reason: 'briefing',
      }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }


    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { patientHealthId, consultations, healthRecordSummaries, vitalHistory, medicationReminders, symptomLogs, patientId } = await req.json();

    // Server-side ownership check: refuse to build a briefing for a patient the
    // caller does not own or have a non-revoked grant on. Prevents leaking AI-
    // generated insight about arbitrary PHI submitted in the request body.
    if (!patientId || typeof patientId !== 'string') {
      return new Response(JSON.stringify({ error: 'patientId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // Caller must own the patient, hold a non-revoked family grant, or be a
    // doctor with explicit consent / a booked appointment.
    const [{ data: userAccess }, { data: doctorAccess }] = await Promise.all([
      supabaseClient.rpc('user_can_access_patient', { _user_id: user.id, _patient_id: patientId }),
      supabaseClient.rpc('doctor_can_access_patient', { _doctor_user: user.id, _patient_id: patientId }),
    ]);
    if (!userAccess && !doctorAccess) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }



    // Build patient context
    const consultationContext = (consultations || []).map((c: any, i: number) => {
      let fhir: any = null;
      try { fhir = JSON.parse(c.fhir_data); } catch {}
      const diagnoses = fhir?.diagnosis?.map((d: any) => d.condition?.display).filter(Boolean) || [];
      const meds = fhir?.extension?.filter((e: any) => e.url?.toLowerCase().includes("medication")).map((e: any) => e.valueString).filter(Boolean) || [];
      const symptoms = fhir?.extension?.filter((e: any) => e.url?.toLowerCase().includes("symptom")).map((e: any) => e.valueString).filter(Boolean) || [];
      return `Visit ${i + 1} (${new Date(c.created_at).toLocaleDateString("en-IN")}):
  Diagnoses: ${diagnoses.join(", ") || "None recorded"}
  Medications: ${meds.join(", ") || "None"}
  Symptoms: ${symptoms.join(", ") || "None"}
  Notes: ${c.audio_transcription?.substring(0, 300) || "None"}`;
    }).join("\n\n");

    const vitalContext = (vitalHistory || []).map((vh: any) => {
      const nonNull = Object.entries(vh.vitals || {}).filter(([_, v]) => v != null);
      if (nonNull.length === 0) return null;
      return `Report: ${vh.source_file_name} (${new Date(vh.recorded_at).toLocaleDateString("en-IN")})\n  ${nonNull.map(([k, v]) => `${k}: ${v}`).join(", ")}`;
    }).filter(Boolean).join("\n\n");

    const recordSummaryContext = (healthRecordSummaries || []).map((r: any) =>
      `${r.file_name}: ${r.ai_summary?.substring(0, 200) || "No summary"}`
    ).join("\n\n");

    const reminderMeds = (medicationReminders || []).map((m: any) =>
      `${m.medication_name} ${m.dosage || ""} - ${m.frequency} (${m.is_active ? "Active reminder" : "Stopped"}) [source: reminders]`
    );

    // Medications extracted from uploaded prescriptions / Rx Reader (health_records.medications jsonb)
    const prescriptionMeds: string[] = [];
    (healthRecordSummaries || []).forEach((r: any) => {
      const meds = Array.isArray(r.medications) ? r.medications : [];
      const date = r.uploaded_at ? new Date(r.uploaded_at).toLocaleDateString("en-IN") : "";
      meds.forEach((m: any) => {
        if (!m) return;
        if (typeof m === "string") {
          prescriptionMeds.push(`${m} [source: prescription ${r.file_name || ""} ${date}]`);
        } else {
          const name = m.name || m.medication_name || m.drug || "Unknown";
          const dose = m.dosage || m.dose || "";
          const freq = m.frequency || m.schedule || "";
          const dur = m.duration ? ` × ${m.duration}` : "";
          const cond = m.condition ? ` for ${m.condition}` : "";
          prescriptionMeds.push(`${name} ${dose} ${freq}${dur}${cond} [source: prescription ${r.file_name || ""} ${date}]`.trim());
        }
      });
    });

    const medContext = [...reminderMeds, ...prescriptionMeds].join("\n");

    // Patient-reported symptom journal (last 90 days)
    const symptomContext = (symptomLogs || []).map((s: any) => {
      const name = s.custom_symptom_name || s.symptom_type;
      const date = new Date(s.logged_at).toLocaleDateString("en-IN");
      const parts = [
        `${date} — ${name} (severity ${s.severity}/10)`,
        s.duration ? `duration ${s.duration}` : null,
        s.body_location ? `at ${s.body_location}` : null,
        s.triggers?.length ? `triggers: ${s.triggers.join(", ")}` : null,
        s.associated_symptoms?.length ? `with ${s.associated_symptoms.join(", ")}` : null,
        s.medications_taken?.length ? `took ${s.medications_taken.join(", ")}` : null,
        s.notes ? `note: ${s.notes}` : null,
      ].filter(Boolean);
      return `  • ${parts.join(" · ")}`;
    }).join("\n");

    // Aggregate counts for quick frequency framing
    const symptomCounts: Record<string, { count: number; sevSum: number }> = {};
    (symptomLogs || []).forEach((s: any) => {
      const key = s.custom_symptom_name || s.symptom_type;
      symptomCounts[key] ||= { count: 0, sevSum: 0 };
      symptomCounts[key].count += 1;
      symptomCounts[key].sevSum += Number(s.severity) || 0;
    });
    const symptomSummary = Object.entries(symptomCounts)
      .map(([k, v]) => `${k}: ${v.count}× (avg ${(v.sevSum / v.count).toFixed(1)}/10)`)
      .join("; ");

    const systemPrompt = `You are a clinical decision support system. Generate a concise patient summary for doctor review.
Rules:
- Only state facts from the provided data
- Never give medical advice, prescribe treatments, or make diagnoses
- Frame findings as observations and patterns, not recommendations
- Use phrases like "values suggest", "pattern consistent with", "may warrant discussion"
- Flag concerning trends or values for the doctor to evaluate
- Be precise with numbers and dates
- Patient-reported symptoms are subjective; weave them into Subjective and recent_changes, not Objective
- For current_medications: merge entries from medication reminders AND medications extracted from uploaded prescriptions. Deduplicate by drug name (case-insensitive). Mark status as "active" if there is an active reminder OR a prescription dated within the last 90 days; "recently_started" if first appearance is within 30 days; "stopped" only if explicitly stopped. Always include dosage/frequency in note when available.
- ALWAYS produce a complete SOAP note, even when only uploaded reports / vitals / medications are available (no consultation transcripts). Synthesize Subjective from history, active conditions and patient-reported symptoms; Objective from latest vitals/labs; Assessment from observed patterns; Plan as discussion points for the doctor. Never leave any SOAP field empty or "N/A".`;

    const userPrompt = `Generate a clinical briefing for this patient.

CONSULTATION HISTORY:
${consultationContext || "No consultations recorded"}

VITAL HISTORY (longitudinal):
${vitalContext || "No vital history"}

HEALTH RECORDS:
${recordSummaryContext || "No health records"}

CURRENT MEDICATIONS:
${medContext || "None recorded"}

PATIENT-REPORTED SYMPTOMS (last 90 days, from health journal):
${symptomSummary ? `Frequency: ${symptomSummary}\n\nDetail:\n${symptomContext}` : "No symptoms logged"}`;

    const tools = [{
      type: "function",
      function: {
        name: "generate_clinical_briefing",
        description: "Generate a structured 30-second clinical briefing for a doctor",
        parameters: {
          type: "object",
          properties: {
            patient_overview: {
              type: "object",
              properties: {
                key_conditions: { type: "array", items: { type: "string" }, description: "Active/historical conditions" },
                summary: { type: "string", description: "1-2 sentence patient overview" },
              },
              required: ["key_conditions", "summary"],
            },
            key_trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  vital: { type: "string" },
                  direction: { type: "string", enum: ["increasing", "decreasing", "stable", "fluctuating"] },
                  detail: { type: "string" },
                  concern_level: { type: "string", enum: ["none", "monitor", "action_needed"] },
                },
                required: ["vital", "direction", "detail", "concern_level"],
              },
              description: "Important trends in lab values over time",
            },
            current_medications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  status: { type: "string", enum: ["active", "recently_stopped", "recently_started"] },
                  note: { type: "string" },
                },
                required: ["name", "status"],
              },
            },
            red_flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  flag: { type: "string" },
                  severity: { type: "string", enum: ["warning", "critical"] },
                  detail: { type: "string" },
                },
                required: ["flag", "severity", "detail"],
              },
              description: "Abnormal or worsening values needing attention",
            },
            recent_changes: {
              type: "array",
              items: { type: "string" },
              description: "What changed since the last visit",
            },
            soap_note: {
              type: "object",
              properties: {
                subjective: { type: "string" },
                objective: { type: "string" },
                assessment: { type: "string" },
                plan: { type: "string" },
              },
              required: ["subjective", "objective", "assessment", "plan"],
            },
            medication_correlations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  observation: { type: "string" },
                  confidence: { type: "string", enum: ["low", "medium", "high"] },
                  supporting_data: { type: "string" },
                },
                required: ["observation", "confidence", "supporting_data"],
              },
              description: "Correlations between medication changes and lab value changes",
            },
            recent_symptoms: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  symptom: { type: "string", description: "Symptom name" },
                  frequency: { type: "string", description: "e.g. '6× in 30 days'" },
                  avg_severity: { type: "string", description: "e.g. '7/10'" },
                  pattern: { type: "string", description: "Triggers or timing patterns observed, if any" },
                },
                required: ["symptom", "frequency", "avg_severity"],
              },
              description: "Patient-reported symptoms from health journal, summarized for the doctor. Empty array if none.",
            },
          },
          required: ["patient_overview", "key_trends", "current_medications", "red_flags", "recent_changes", "soap_note", "medication_correlations", "recent_symptoms"],
        },
      },
    }];

    const __reqId = newRequestId();
    const response = await callLovableAi({
      functionName: "clinical-briefing",
      userId: user.id,
      requestId: __reqId,
      model: "google/gemini-2.5-flash",
      body: {
        messages: [
          { role: "system", content: withGuardrails(systemPrompt) },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "generate_clinical_briefing" } },
      },
    });
    void logFunctionCall({
      functionName: "clinical-briefing",
      requestId: __reqId,
      userId: user.id,
      method: req.method,
      statusCode: response.status,
      latencyMs: 0,
    });


    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let briefing;
    let briefingValid = false;
    try {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        briefing = JSON.parse(toolCall.function.arguments);
        // Validate the AI actually returned a usable SOAP-shaped payload before
        // it counts against the user's free-tier quota.
        briefingValid = !!(
          briefing &&
          briefing.patient_overview &&
          typeof briefing.patient_overview.summary === "string" &&
          briefing.patient_overview.summary.trim().length > 0 &&
          briefing.soap_note &&
          typeof briefing.soap_note.subjective === "string" &&
          briefing.soap_note.subjective.trim().length > 0 &&
          briefing.soap_note.subjective.trim().toUpperCase() !== "N/A"
        );
      } else {
        throw new Error("No tool call response");
      }
    } catch {
      briefing = {
        patient_overview: { key_conditions: [], summary: "Unable to generate briefing from available data." },
        key_trends: [],
        current_medications: [],
        red_flags: [],
        recent_changes: [],
        soap_note: { subjective: "N/A", objective: "N/A", assessment: "N/A", plan: "N/A" },
        medication_correlations: [],
        recent_symptoms: [],
      };
      briefingValid = false;
    }

    briefing.disclaimer = "AI-generated briefing based on available records. Verify all findings clinically.";

    // If the AI did not return a usable briefing, do NOT charge it against the
    // user's free-tier quota. Surface a clear failure so the client can retry.
    if (!briefingValid) {
      console.warn('[clinical-briefing] invalid briefing payload, skipping usage increment');
      return new Response(
        JSON.stringify({ error: "BRIEFING_GENERATION_FAILED", message: "Couldn't generate a complete briefing from your records. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only after we've confirmed a successful, complete briefing do we count it
    // against the user's lifetime usage. Pro users are unaffected by the limit
    // but we still record usage for analytics.
    if (!isPro) {
      const { error: incErr } = await supabaseClient.rpc('increment_briefing_usage');
      if (incErr) console.error('increment_briefing_usage failed:', incErr);
    }

    return new Response(JSON.stringify(briefing), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });


  } catch (error) {
    console.error("Error in clinical-briefing:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
