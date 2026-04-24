// Transcribe a short voice note and extract structured symptom fields.
// Uses Lovable AI (Gemini) which supports audio input + JSON output.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You convert a patient's spoken symptom note into structured JSON for a health journal.
You are NOT a doctor. Do NOT diagnose. Only extract what the user said.

LANGUAGE HANDLING (critical):
- The patient may speak in English, Hindi, Hinglish, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Urdu, or any mix.
- First, auto-detect the spoken language. Do NOT assume English.
- Transcribe faithfully in the ORIGINAL language and script in "transcript".
- Always also produce an English version in "transcript_en" so downstream analytics work.
- All structured fields (triggers, body_location, associated_symptoms, medications_taken, notes, custom_symptom_name) MUST be in English. Translate native terms (e.g. "सिरदर्द" → "headache", "बुखार" → "fever", "पेट दर्द" → "stomach pain", "जी मिचलाना" → "nausea", "चक्कर" → "dizziness", "थकान" → "fatigue", "खांसी" → "cough", "क्रोसिन" → "Crocin", "पैरासिटामोल" → "Paracetamol").
- Map severity words across languages: mild / हल्का / थोड़ा ≈ 3, moderate / सामान्य ≈ 5, bad / तेज़ / ज़्यादा ≈ 7, severe / बहुत तेज़ / असहनीय ≈ 9. Default 5 if unsure.
- Keep medication brand names as commonly written (Crocin, Dolo, Combiflam, Paracetamol, etc.).

Allowed symptom_type values: headache, fatigue, fever, cough, stomach_pain, skin, menstrual, mental, other.
If none clearly match, use "other" and put the user's term (translated to English) in custom_symptom_name.

Return ONLY valid JSON matching this shape:
{
  "symptom_type": "headache" | "fatigue" | "fever" | "cough" | "stomach_pain" | "skin" | "menstrual" | "mental" | "other",
  "custom_symptom_name": string | null,
  "severity": number,            // 1-10
  "duration": string | null,     // English, e.g. "2 hours", "since morning"
  "body_location": string | null,// English
  "triggers": string[],          // English short tags
  "associated_symptoms": string[], // English
  "medications_taken": string[], // English / brand names
  "notes": string | null,        // short clean English summary of what they said
  "transcript": string,          // raw transcript in the original language and script
  "transcript_en": string,       // English translation of the transcript
  "detected_language": string    // BCP-47 like "en", "hi", "hi-Latn" (Hinglish), "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa", "ur"
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
              { type: "text", text: "Detect the spoken language, transcribe in original script, then extract symptom fields as JSON per the schema. Translate all structured fields to English." },
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
