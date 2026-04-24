import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { patientHealthId, consultations, healthRecordSummaries, vitalHistory, medicationReminders, symptomLogs } = await req.json();

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

    const medContext = (medicationReminders || []).map((m: any) =>
      `${m.medication_name} ${m.dosage || ""} - ${m.frequency} (${m.is_active ? "Active" : "Stopped"})`
    ).join("\n");

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "generate_clinical_briefing" } },
      }),
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
    try {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        briefing = JSON.parse(toolCall.function.arguments);
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
    }

    briefing.disclaimer = "AI-generated briefing based on available records. Verify all findings clinically.";

    return new Response(JSON.stringify(briefing), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in clinical-briefing:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
