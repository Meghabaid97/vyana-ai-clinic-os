import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withGuardrails } from "../_shared/guardrails.ts";
import { requireAiConsent } from "../_shared/consent-gate.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cap base64 payload size to prevent single-request resource exhaustion
// (10 MB of base64 ~= 7.5 MB raw, which covers any realistic discharge PDF).
const MAX_FILE_CONTENT_CHARS = 10 * 1024 * 1024;

async function checkRateLimit(userId: string, functionName: string, maxPerHour = 20) {
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
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

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

    const _consentBlock = await requireAiConsent(user.id);
    if (_consentBlock) return _consentBlock;

    try {
      await checkRateLimit(user.id, 'process-discharge', 20);
    } catch (e) {
      if (e instanceof Error && e.message === 'RATE_LIMITED') {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw e;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const { fileName, fileType, fileContent } = await req.json();
    if (!fileName || !fileContent) {
      return new Response(JSON.stringify({ error: 'fileName and fileContent are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (typeof fileContent === 'string' && fileContent.length > MAX_FILE_CONTENT_CHARS) {
      return new Response(JSON.stringify({ error: 'File too large. Maximum size is ~7.5 MB.' }), {
        status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }


    const systemPrompt = `You are a healthcare document extraction assistant specializing in discharge summaries.

STRICT RULES:
1. Only extract facts explicitly visible in the document.
2. Never infer, predict, or add information not present.
3. Return empty arrays or null for missing fields.
4. This is healthcare data — hallucinations are unacceptable.
5. Do NOT provide medical advice or recommendations beyond what the document states.

Extract two outputs:
A) MEDICAL SUMMARY for future doctor visits — key diagnoses, procedures, medications at discharge, follow-up instructions as written.
B) INSURANCE CLAIM DATA — patient details, admission/discharge dates, diagnoses (with ICD codes if present), procedures, hospital details, billing items, treating doctor info.`;

    const userPrompt = `Extract data from this discharge summary document: ${fileName}

Return structured data by calling the tool.`;

    const messages: any[] = [{ role: "system", content: withGuardrails(systemPrompt) }];

    if (fileContent && (fileType?.startsWith('image/') || fileType === 'application/pdf')) {
      messages.push({ role: "user", content: [
        { type: "text", text: userPrompt },
        { type: "image_url", image_url: { url: fileContent } }
      ]});
    } else {
      messages.push({ role: "user", content: userPrompt });
    }

    const tools = [{
      type: "function",
      function: {
        name: "extract_discharge_data",
        description: "Extract medical summary and insurance claim data from a discharge summary.",
        parameters: {
          type: "object",
          properties: {
            medicalSummary: {
              type: "object",
              properties: {
                admissionDate: { type: "string" },
                dischargeDate: { type: "string" },
                primaryDiagnosis: { type: "string" },
                secondaryDiagnoses: { type: "array", items: { type: "string" } },
                proceduresPerformed: { type: "array", items: { type: "string" } },
                medicationsAtDischarge: { type: "array", items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    dosage: { type: "string" },
                    frequency: { type: "string" },
                    duration: { type: "string" }
                  },
                  required: ["name"],
                  additionalProperties: false
                }},
                followUpInstructions: { type: "array", items: { type: "string" } },
                keyFindings: { type: "array", items: { type: "string" } },
                allergiesNoted: { type: "array", items: { type: "string" } },
                dietaryInstructions: { type: "array", items: { type: "string" } },
                activityRestrictions: { type: "array", items: { type: "string" } }
              },
              required: ["primaryDiagnosis", "medicationsAtDischarge", "followUpInstructions", "keyFindings"],
              additionalProperties: false
            },
            insuranceClaim: {
              type: "object",
              properties: {
                patientName: { type: "string" },
                patientAge: { type: "string" },
                patientGender: { type: "string" },
                hospitalName: { type: "string" },
                hospitalAddress: { type: "string" },
                admissionDate: { type: "string" },
                dischargeDate: { type: "string" },
                daysOfStay: { type: "string" },
                admissionType: { type: "string" },
                primaryDiagnosis: { type: "string" },
                icdCodes: { type: "array", items: { type: "string" } },
                procedureCodes: { type: "array", items: { type: "string" } },
                procedureDescriptions: { type: "array", items: { type: "string" } },
                treatingDoctorName: { type: "string" },
                treatingDoctorRegistration: { type: "string" },
                roomType: { type: "string" },
                billingItems: { type: "array", items: {
                  type: "object",
                  properties: {
                    item: { type: "string" },
                    amount: { type: "string" }
                  },
                  required: ["item"],
                  additionalProperties: false
                }},
                totalBillAmount: { type: "string" },
                preAuthorizationNumber: { type: "string" }
              },
              required: ["patientName", "hospitalName", "admissionDate", "dischargeDate", "primaryDiagnosis"],
              additionalProperties: false
            },
            confidence: { type: "string", enum: ["high", "medium", "low"] }
          },
          required: ["medicalSummary", "insuranceClaim", "confidence"],
          additionalProperties: false
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
        messages,
        tools,
        tool_choice: { type: "function", function: { name: "extract_discharge_data" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolArgs = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!toolArgs) throw new Error('No structured data extracted');

    const extracted = JSON.parse(toolArgs);

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in process-discharge:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
