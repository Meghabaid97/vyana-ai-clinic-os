import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withGuardrails } from "../_shared/guardrails.ts";
import { requirePlan } from "../_shared/plan-gate.ts";

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
      await checkRateLimit(user.id, 'analyze-trends', 50);
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

    const { vitalHistory, medicationReminders, patientName, patientAge, patientId } = await req.json();

    // Server-side ownership check.
    if (!patientId || typeof patientId !== 'string') {
      return new Response(JSON.stringify({ error: 'patientId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { data: canAccess } = await supabaseClient.rpc('user_can_access_patient', {
      _user_id: user.id, _patient_id: patientId,
    });
    if (!canAccess) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }


    if (!vitalHistory || vitalHistory.length < 2) {
      return new Response(JSON.stringify({
        trends: [],
        correlations: [],
        insights: "Need at least 2 health record snapshots for trend analysis. Upload more reports to enable longitudinal tracking.",
        risk_flags: [],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build longitudinal data context
    const timelineContext = vitalHistory.map((vh: any, i: number) => {
      const nonNull = Object.entries(vh.vitals || {}).filter(([_, v]) => v != null);
      return `Snapshot ${i + 1} (${new Date(vh.recorded_at).toLocaleDateString("en-IN")}, source: ${vh.source_file_name}):
  ${nonNull.map(([k, v]) => `${k}=${v}`).join(", ")}`;
    }).join("\n\n");

    const medContext = (medicationReminders || []).map((m: any) =>
      `${m.medication_name} ${m.dosage || ""} - ${m.frequency} (${m.is_active ? "Active" : "Stopped"}, since ${new Date(m.created_at).toLocaleDateString("en-IN")})`
    ).join("\n");

    const systemPrompt = `You are a clinical data analyst. Analyze longitudinal patient data for trends and patterns.
Rules:
- Only report trends visible in the data
- Be precise with numbers
- Flag clinically significant changes
- Look for medication-lab correlations
- Do NOT give generic health advice`;

    const userPrompt = `Analyze longitudinal vital data for ${patientName || "Patient"}, age ${patientAge || "unknown"}.

VITAL HISTORY (chronological snapshots):
${timelineContext}

MEDICATIONS:
${medContext || "None recorded"}

Identify trends, correlations, and risk flags.`;

    const tools = [{
      type: "function",
      function: {
        name: "report_trend_analysis",
        description: "Report longitudinal trend analysis results",
        parameters: {
          type: "object",
          properties: {
            trends: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  vital_name: { type: "string" },
                  vital_key: { type: "string" },
                  direction: { type: "string", enum: ["increasing", "decreasing", "stable", "fluctuating"] },
                  significance: { type: "string", enum: ["normal", "notable", "concerning"] },
                  detail: { type: "string" },
                  values: { type: "array", items: { type: "object", properties: { date: { type: "string" }, value: { type: "number" } }, required: ["date", "value"] } },
                },
                required: ["vital_name", "vital_key", "direction", "significance", "detail"],
              },
            },
            correlations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  observation: { type: "string" },
                  confidence: { type: "string", enum: ["low", "medium", "high"] },
                  medication: { type: "string" },
                  affected_vital: { type: "string" },
                  supporting_data: { type: "string" },
                },
                required: ["observation", "confidence", "supporting_data"],
              },
            },
            risk_flags: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  flag: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high"] },
                  detail: { type: "string" },
                },
                required: ["flag", "severity", "detail"],
              },
            },
            insights: { type: "string", description: "2-3 sentence summary of key findings" },
          },
          required: ["trends", "correlations", "risk_flags", "insights"],
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
          { role: "system", content: withGuardrails(systemPrompt) },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "report_trend_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let analysis;
    try {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        analysis = JSON.parse(toolCall.function.arguments);
      } else {
        throw new Error("No tool call");
      }
    } catch {
      analysis = { trends: [], correlations: [], risk_flags: [], insights: "Could not analyze trends from available data." };
    }

    analysis.disclaimer = "AI-generated trend analysis. Clinical verification required.";

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-trends:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
