// Transcribe a short voice note and extract structured symptom fields.
// Uses Lovable AI (Gemini) which supports audio input + JSON output.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You convert a patient's spoken symptom note into structured JSON for a health journal.
You are NOT a doctor. Do NOT diagnose. Only extract what the user said.

Allowed symptom_type values: headache, fatigue, fever, cough, stomach_pain, skin, menstrual, mental, other.
If none clearly match, use "other" and put the user's term in custom_symptom_name.

Return ONLY valid JSON matching this shape:
{
  "symptom_type": "headache" | "fatigue" | "fever" | "cough" | "stomach_pain" | "skin" | "menstrual" | "mental" | "other",
  "custom_symptom_name": string | null,
  "severity": number,            // 1-10, infer from words like "mild"=3, "moderate"=5, "bad"=7, "severe"=9. Default 5.
  "duration": string | null,     // e.g. "2 hours", "since morning"
  "body_location": string | null,
  "triggers": string[],          // short tags
  "associated_symptoms": string[],
  "medications_taken": string[], // names only
  "notes": string | null,        // a short clean version of what they said
  "transcript": string           // the raw transcript
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit: 30/hour
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { data: usage } = await adminClient
      .from("api_usage").select("id")
      .eq("user_id", user.id).eq("function_name", "voice-symptom-parse")
      .gte("created_at", oneHourAgo);
    if (usage && usage.length >= 30) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    await adminClient.from("api_usage").insert({ user_id: user.id, function_name: "voice-symptom-parse" });

    const { audioBase64, mimeType } = await req.json();
    if (!audioBase64 || typeof audioBase64 !== "string") {
      return new Response(JSON.stringify({ error: "audioBase64 required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (audioBase64.length > 8_000_000) {
      return new Response(JSON.stringify({ error: "Audio too large (keep under ~30s)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe this voice note and extract symptom fields as JSON." },
              { type: "input_audio", input_audio: { data: audioBase64, format: (mimeType || "audio/webm").includes("mp4") ? "mp4" : "webm" } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit, please try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI failed: ${resp.status}`);
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-symptom-parse error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
