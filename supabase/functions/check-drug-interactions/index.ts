import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withGuardrails } from "../_shared/guardrails.ts";
import { requirePlan } from "../_shared/plan-gate.ts";
import { callLovableAi, logFunctionCall, newRequestId } from "../_shared/observability.ts";
import { requireAiConsent } from "../_shared/consent-gate.ts";

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

  const started = Date.now();
  const requestId = newRequestId();
  const fnName = "check-drug-interactions";
  let userId: string | null = null;
  let errMsg: string | null = null;

  const finish = (resp: Response) => {
    void logFunctionCall({
      functionName: fnName, requestId, userId, method: req.method,
      statusCode: resp.status, latencyMs: Date.now() - started, error: errMsg,
    });
    return resp;
  };

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      errMsg = "Unauthorized";
      return finish(new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }));
    }
    userId = user.id;

    const _consentBlock = await requireAiConsent(user.id);
    if (_consentBlock) return finish(_consentBlock);

    try {
      await checkRateLimit(user.id, fnName, 50);
    } catch (e) {
      if (e instanceof Error && e.message === 'RATE_LIMITED') {
        errMsg = "rate_limited";
        return finish(new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }));
      }
      throw e;
    }

    const planGate = await requirePlan(supabaseClient, { feature: "pro", featureLabel: "Drug interaction checker" });
    if (planGate) { errMsg = "plan_gate"; return finish(planGate); }

    const { medications } = await req.json();

    if (!medications || medications.length < 2) {
      return finish(new Response(
        JSON.stringify({ interactions: [], message: "At least 2 medications required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ));
    }

    const prompt = `You are a pharmacology expert. Analyze potential drug interactions between: ${medications.join(", ")}

Respond in JSON:
{
  "interactions": [{ "drugs": ["A", "B"], "severity": "minor|moderate|severe|contraindicated", "description": "...", "recommendation": "..." }],
  "safetyNotes": ["..."],
  "overallRisk": "low|moderate|high",
  "disclaimer": "..."
}`;

    const response = await callLovableAi({
      functionName: fnName, userId, requestId,
      model: "google/gemini-2.5-flash",
      body: {
        messages: [
          { role: "system", content: withGuardrails("You are a pharmacology expert that checks for drug interactions.") },
          { role: "user", content: prompt }
        ],
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        errMsg = "ai_rate_limited";
        return finish(new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        }));
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let result;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr.trim());
    } catch {
      result = {
        interactions: [],
        safetyNotes: ["Unable to analyze. Please consult a pharmacist."],
        overallRisk: "unknown",
        disclaimer: "Please consult a healthcare professional."
      };
    }

    return finish(new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }));
  } catch (error) {
    console.error("Error in check-drug-interactions:", error);
    errMsg = error instanceof Error ? error.message : String(error);
    return finish(new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    ));
  }
});
