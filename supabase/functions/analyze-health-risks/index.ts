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
      await checkRateLimit(user.id, 'analyze-health-risks', 50);
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

    const body = await req.json();
    const { records, patientName, patientAge } = body;

    let healthContext = "";
    if (records && records.length > 0) {
      const summaries = records
        .filter((r: any) => r.ai_summary && !r.ai_summary.includes("I am sorry") && !r.ai_summary.includes("cannot access"))
        .map((r: any) => `Document: ${r.file_name}\nSummary: ${r.ai_summary}`)
        .join("\n\n");
      healthContext = summaries || "No analyzable health record summaries available.";
    } else {
      healthContext = "No health records uploaded.";
    }

    // Use tool calling for structured extraction
    const systemPrompt = `You are a STRICT clinical data extraction assistant. You MUST follow these rules absolutely:

1. ONLY report values, conditions, and findings that are EXPLICITLY stated in the provided health records.
2. NEVER infer, predict, or speculate about conditions not directly mentioned in the records.
3. NEVER diagnose conditions like dysplasia, cancer, or any serious condition unless the record EXPLICITLY states it.
4. If a vital value is not found in any record, omit that key entirely — do NOT estimate or guess.
5. For the summary, ONLY describe what the records actually contain. Do NOT add speculative assessments.
6. For risks, ONLY flag risks that are directly supported by abnormal values found in the records.
7. If records are insufficient for analysis, say so honestly rather than making things up.

This is a healthcare application. Patient safety depends on your accuracy. Hallucinated diagnoses can cause real harm.`;

    const userPrompt = `Extract all clinical data from this patient's health records. Only extract values that are EXPLICITLY written in the records.

Patient: ${patientName || "Unknown"}, Age: ${patientAge || "Unknown"}

Health Records & Summaries:
${healthContext}

Extract every vital/lab value you can find. Omit values not explicitly present in the records. Do NOT guess or estimate missing values.`;

    const tools = [{
      type: "function",
      function: {
        name: "report_health_analysis",
        description: "Report extracted vital values and health analysis from medical records. Only include values explicitly found in records.",
        parameters: {
          type: "object",
          properties: {
            vitals: {
              type: "object",
              description: "Extracted vital/lab values. Only include keys that are explicitly present. Valid keys include bp_systolic, bp_diastolic, heart_rate, total_cholesterol, hdl, ldl, triglycerides, fasting_blood_sugar, hba1c, post_prandial_glucose, weight, bmi, hemoglobin, wbc, platelet_count, rbc, esr, creatinine, bun, uric_acid, sgot, sgpt, bilirubin, albumin, tsh, t3, t4, vitamin_d, vitamin_b12, calcium, iron, ferritin, folate.",
              additionalProperties: { type: "number" },
            },
            vital_sources: {
              type: "object",
              description: "For each vital key that has a non-null value, provide the source citation - exact text from the document where this value was found.",
              additionalProperties: { type: "string" },
            },
            confidence: {
              type: "string",
              enum: ["high", "medium", "low"],
              description: "Overall confidence in the extraction: high = clear typed lab report, medium = handwritten or partial, low = poor quality or ambiguous.",
            },
            summary: { type: "string", description: "2-3 paragraph factual summary of what the records contain. No speculation." },
            risks: {
              type: "array",
              description: "Only risks directly supported by abnormal values in the records.",
              items: {
                type: "object",
                properties: {
                  condition: { type: "string" },
                  level: { type: "string", enum: ["low", "medium", "high"] },
                  reasoning: { type: "string", description: "Must cite specific values from the records." },
                },
                required: ["condition", "level", "reasoning"],
              },
            },
            recommendations: {
              type: "array",
              items: { type: "string" },
              description: "Actionable recommendations based only on findings in the records.",
            },
          },
          required: ["vitals", "vital_sources", "confidence", "summary", "risks", "recommendations"],
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
        tool_choice: { type: "function", function: { name: "report_health_analysis" } },
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
    
    let analysis;
    try {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        analysis = JSON.parse(toolCall.function.arguments);
      } else {
        // Fallback: try parsing content as JSON
        const content = data.choices?.[0]?.message?.content || "";
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : content;
        analysis = JSON.parse(jsonStr.trim());
      }
    } catch {
      analysis = {
        vitals: {},
        summary: "Unable to extract structured data from records. Please ensure records contain readable text.",
        risks: [],
        recommendations: ["Upload clearer health records for better analysis"],
      };
    }

    // Add disclaimer
    analysis.disclaimer = "This analysis is based only on values found in your uploaded records. It is not a substitute for professional medical advice.";

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-health-risks:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
