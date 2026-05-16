import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withGuardrails } from "../_shared/guardrails.ts";

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
      await checkRateLimit(user.id, 'interpret-prescription', 30);
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

    const { imageData, sourceType } = await req.json();
    if (!imageData) {
      return new Response(JSON.stringify({ error: "No image data provided" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const systemPrompt = `You are a clinical OCR specialist trained on Indian medical prescriptions.

You MUST handle:
- Handwritten prescriptions in English, Hindi (हिंदी), Tamil (தமிழ்), Telugu (తెలుగు), and Bengali (বাংলা)
- Mixed-language prescriptions (e.g., drug names in English, instructions in Hindi)
- Common medical abbreviations: OD (once daily), BD (twice daily), TDS (thrice daily), QID (four times), SOS (as needed), HS (at bedtime), AC (before meals), PC (after meals), stat (immediately)
- Messy handwriting, crossed-out words, arrows, abbreviations
- Indian brand names of medications

Rules:
1. Extract every medication you can identify, even partially
2. For each medication, flag your confidence level honestly
3. If a word is illegible, say "illegible" — do NOT guess
4. Translate all instructions to English for the structured output
5. Preserve the original script text alongside English translation
6. Flag any potential drug name ambiguity (e.g., similar-sounding drugs)
7. Note the detected language(s) of the prescription`;

    const userPrompt = `Interpret this ${sourceType === "canvas" ? "digitally written" : "photographed"} prescription image.

Extract all medications with dosage, frequency, duration, and instructions. Handle mixed languages. Flag anything unclear.`;

    const tools = [{
      type: "function",
      function: {
        name: "extract_prescription",
        description: "Extract structured prescription data from a handwritten prescription image",
        parameters: {
          type: "object",
          properties: {
            detected_languages: {
              type: "array",
              items: { type: "string" },
              description: "Languages detected in the prescription (e.g., English, Hindi, Tamil)"
            },
            doctor_name: { type: ["string", "null"], description: "Doctor name if readable" },
            patient_name: { type: ["string", "null"], description: "Patient name if readable" },
            date: { type: ["string", "null"], description: "Prescription date if readable" },
            diagnosis: { type: ["string", "null"], description: "Diagnosis/condition if mentioned" },
            medications: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Medication name (English). Use generic name if identifiable." },
                  name_original: { type: ["string", "null"], description: "Medication name as written in original script" },
                  brand_name: { type: ["string", "null"], description: "Brand name if different from generic" },
                  dosage: { type: ["string", "null"], description: "Dosage (e.g., 500mg, 10ml)" },
                  route: { type: "string", description: "Route: oral, topical, IV, IM, SC, inhaled, etc." },
                  frequency: { type: "string", description: "Standardized: once_daily, twice_daily, thrice_daily, four_times_daily, as_needed, at_bedtime, weekly" },
                  frequency_original: { type: ["string", "null"], description: "Frequency as written (e.g., 'दिन में दो बार', 'BD')" },
                  duration: { type: ["string", "null"], description: "Duration (e.g., '5 days', '2 weeks')" },
                  timing: { type: ["string", "null"], description: "before_meals, after_meals, with_meals, empty_stomach, at_bedtime" },
                  instructions: { type: ["string", "null"], description: "Additional instructions in English" },
                  instructions_original: { type: ["string", "null"], description: "Instructions in original script" },
                  confidence: { type: "string", enum: ["high", "medium", "low", "illegible"], description: "How confident you are in reading this medication" },
                  confidence_notes: { type: ["string", "null"], description: "Why confidence is low, what's unclear" },
                  possible_alternatives: {
                    type: "array",
                    items: { type: "string" },
                    description: "If name is ambiguous, list similar drug names it could be"
                  }
                },
                required: ["name", "route", "frequency", "confidence"]
              }
            },
            additional_instructions: { type: ["string", "null"], description: "General instructions (diet, follow-up, etc.)" },
            illegible_sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  location: { type: "string", description: "Where on the prescription (top, middle, bottom, etc.)" },
                  description: { type: "string", description: "What you can partially read or context clues" }
                },
                required: ["location", "description"]
              },
              description: "Parts of the prescription that could not be read"
            },
            overall_confidence: {
              type: "string",
              enum: ["high", "medium", "low"],
              description: "Overall confidence in the interpretation"
            },
            warnings: {
              type: "array",
              items: { type: "string" },
              description: "Any safety warnings: unusual doses, potential interactions, ambiguous drug names"
            }
          },
          required: ["detected_languages", "medications", "illegible_sections", "overall_confidence", "warnings"]
        }
      }
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
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageData } },
            ],
          },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "extract_prescription" } },
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
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let result;
    try {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        result = JSON.parse(toolCall.function.arguments);
      } else {
        throw new Error("No tool call response");
      }
    } catch {
      result = {
        detected_languages: ["Unknown"],
        medications: [],
        illegible_sections: [{ location: "entire", description: "Could not interpret the prescription image" }],
        overall_confidence: "low",
        warnings: ["Failed to extract prescription data. Please try a clearer image."],
      };
    }

    result.disclaimer = "AI-interpreted prescription. Always verify with the prescribing doctor before use.";

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in interpret-prescription:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
