import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withGuardrails } from "../_shared/guardrails.ts";
import { requirePlan } from "../_shared/plan-gate.ts";
import { requireAiConsent } from "../_shared/consent-gate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function checkRateLimit(userId: string, functionName: string, maxPerHour = 30) {
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { data } = await adminClient
    .from("api_usage").select("id")
    .eq("user_id", userId).eq("function_name", functionName)
    .gte("created_at", oneHourAgo);
  if (data && data.length >= maxPerHour) throw new Error("RATE_LIMITED");
  await adminClient.from("api_usage").insert({ user_id: userId, function_name: functionName });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const _consentBlock = await requireAiConsent(user.id);
    if (_consentBlock) return _consentBlock;

    try {
      await checkRateLimit(user.id, "analyze-imaging-discussion-points", 30);
    } catch (e) {
      if (e instanceof Error && e.message === "RATE_LIMITED") {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    // Pro-only: imaging discussion-point AI.
    const planGate = await requirePlan(supabaseClient, { feature: "pro", featureLabel: "Imaging discussion points" });
    if (planGate) return planGate;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { fileName, fileType, fileContent, modality, bodyPart, userNotes } = await req.json();

    if (!fileContent || !(fileType?.startsWith("image/") || fileType === "application/pdf")) {
      return new Response(JSON.stringify({
        points: [],
        disclaimer: "We could not preview this file as an image, so no discussion points were generated.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const trimmedNotes = typeof userNotes === "string" ? userNotes.trim().slice(0, 1000) : "";

    const systemPrompt = `You are a careful clinical AI assistant that helps PATIENTS prepare for a doctor visit.

You are looking at a medical image (X-ray, CT, MRI, ultrasound, dental scan, photo of a scan film, etc.) the patient uploaded.

YOUR JOB: Suggest a SHORT list of "things this patient may want to ask the doctor about" based on what is visible in the image. These are DISCUSSION POINTS, not diagnoses.

HARD RULES — never break these:
- You are NOT diagnosing. You are NOT a doctor. You are NOT giving medical advice.
- Phrase every point as a question or observation to discuss with a doctor, not as a finding. Examples:
  - "Ask the doctor whether the lower right molar shows signs of decay"
  - "Discuss whether the bone density on the left wrist looks normal"
- Only suggest points you can visually observe with reasonable confidence. If the image is unreadable, blurry, or you cannot see the relevant area, return an empty list.
- Never invent values, measurements, or specific diagnoses (no "stage 2", no "5mm tumor", no "fracture confirmed").
- If you are uncertain, lower the confidence. Do not pad the list. 0-5 items is fine; quality over quantity.
- Confidence is your visual confidence that the area is worth discussing, on a 0-1 scale (e.g. 0.4 = worth a quick mention, 0.85 = clearly visible and notable). Never above 0.95.

Return your answer by calling the tool.`;

    const userPrompt = `Patient-uploaded medical image.
File: ${fileName}
${modality ? `Modality (patient indicated): ${modality}` : ""}
${bodyPart ? `Body part (extracted): ${bodyPart}` : ""}
${trimmedNotes ? `\nPatient's own notes about this image:\n"""${trimmedNotes}"""` : ""}

Suggest discussion points the patient may want to raise with their doctor when reviewing this image. Do not diagnose. If nothing is visually clear, return an empty list and explain briefly in the disclaimer.`;

    const tools = [{
      type: "function",
      function: {
        name: "suggest_discussion_points",
        description: "Suggest discussion points for a patient to raise with their doctor about an uploaded medical image.",
        parameters: {
          type: "object",
          properties: {
            points: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  point: { type: "string", description: "Short discussion question or observation, phrased as something to ask the doctor." },
                  confidence: { type: "number", description: "Visual confidence 0-1 that this is worth discussing. Never above 0.95." },
                  rationale: { type: "string", description: "Brief plain-language reason, what you visually noticed. Max 1 sentence." },
                },
                required: ["point", "confidence", "rationale"],
                additionalProperties: false,
              },
            },
            disclaimer: {
              type: "string",
              description: "Short safety note for the patient. Always include the words 'not a diagnosis'.",
            },
          },
          required: ["points", "disclaimer"],
          additionalProperties: false,
        },
      },
    }];

    const messages: any[] = [
      { role: "system", content: withGuardrails(systemPrompt) },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: fileContent } },
        ],
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        tools,
        tool_choice: { type: "function", function: { name: "suggest_discussion_points" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolArgs = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!toolArgs) {
      return new Response(JSON.stringify({
        points: [],
        disclaimer: "We were not able to read this image clearly. This is not a diagnosis. Please review with your doctor.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const parsed = JSON.parse(toolArgs);
    const cleanPoints = (parsed.points || [])
      .filter((p: any) => typeof p?.point === "string" && p.point.trim().length > 0)
      .map((p: any) => ({
        point: String(p.point).slice(0, 280),
        confidence: Math.max(0, Math.min(0.95, Number(p.confidence) || 0)),
        rationale: typeof p.rationale === "string" ? p.rationale.slice(0, 280) : "",
      }))
      .slice(0, 6);

    const disclaimer = typeof parsed.disclaimer === "string" && parsed.disclaimer.trim().length > 0
      ? parsed.disclaimer.slice(0, 400)
      : "These are AI-suggested discussion points, not a diagnosis. Please review with your doctor.";

    return new Response(JSON.stringify({ points: cleanPoints, disclaimer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in analyze-imaging-discussion-points:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
