import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Whitelist of allowed ElevenLabs voice IDs
const ALLOWED_VOICES = new Set<string>([
  "EXAVITQu4vr4xnSDxMaL", // Sarah
  "9BWtsMINqrJLrRacOk9x", // Aria
  "CwhRBWXzGAHq8TQ4Fs17", // Roger
  "FGY2WhTYpPnrIDTdsKH5", // Laura
  "IKne3meq5aSn9XLyUdCD", // Charlie
  "JBFqnCBsd6RMkjVDRZzb", // George
  "TX3LPaxmHKxFdv7VOQHJ", // Liam
  "XB0fDUnXU5powFXDhCwa", // Charlotte
  "Xb7hH8MSUJpSbSDYk0k2", // Alice
  "cgSgspJ2msm6clMCkdW9", // Jessica
]);

const MAX_TEXT_LENGTH = 2000;

async function checkRateLimit(adminClient: ReturnType<typeof createClient>, userId: string, maxPerHour = 20) {
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { data } = await adminClient
    .from("api_usage")
    .select("id")
    .eq("user_id", userId)
    .eq("function_name", "elevenlabs-tts")
    .gte("created_at", oneHourAgo);
  if (data && data.length >= maxPerHour) throw new Error("RATE_LIMITED");
  await adminClient.from("api_usage").insert({ user_id: userId, function_name: "elevenlabs-tts" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Rate limit (20/hour)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    try {
      await checkRateLimit(adminClient, user.id, 20);
    } catch (e) {
      if (e instanceof Error && e.message === "RATE_LIMITED") {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw e;
    }

    const { text, voiceId } = await req.json();

    // Input validation
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return new Response(JSON.stringify({ error: `text exceeds ${MAX_TEXT_LENGTH} character limit` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const voice = voiceId && ALLOWED_VOICES.has(voiceId) ? voiceId : "EXAVITQu4vr4xnSDxMaL";

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing");

    const resp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.7, similarity_boost: 0.85, style: 0.15, use_speaker_boost: true, speed: 0.88 },
        }),
      }
    );
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: t }), { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const buf = await resp.arrayBuffer();
    const audioContent = base64Encode(new Uint8Array(buf));
    return new Response(JSON.stringify({ audioContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
