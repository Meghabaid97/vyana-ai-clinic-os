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

    // Build context from health record summaries
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

    const prompt = `You are a medical AI assistant. Analyze the following patient's health records and provide a comprehensive health summary with risk indicators.

Patient: ${patientName || "Unknown"}, Age: ${patientAge || "Unknown"}

Health Records & Summaries:
${healthContext}

Based on all available health data, provide:
1. A clear, personalized health summary (2-3 paragraphs) covering key findings from the records
2. Up to 3 potential health risk indicators with risk levels
3. Actionable recommendations

Respond in JSON format:
{
  "summary": "A comprehensive 2-3 paragraph health summary covering key findings, trends, and overall health status based on the records...",
  "risks": [{ "condition": "...", "level": "low|medium|high", "reasoning": "..." }],
  "recommendations": ["..."],
  "disclaimer": "This is AI-generated analysis and not a substitute for professional medical advice."
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a medical AI assistant that analyzes patient health records for insights and risks. Always respond with valid JSON." },
          { role: "user", content: prompt }
        ],
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let analysis;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysis = JSON.parse(jsonStr.trim());
    } catch {
      analysis = {
        summary: content || "Unable to generate summary.",
        risks: [{ condition: "Unable to parse structured analysis", level: "low", reasoning: "Raw analysis was generated but could not be structured." }],
        recommendations: ["Continue regular health checkups"],
        disclaimer: "Please consult a healthcare professional."
      };
    }

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
