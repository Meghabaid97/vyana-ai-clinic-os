import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withGuardrails } from "../_shared/guardrails.ts";
import { requirePlan } from "../_shared/plan-gate.ts";
import { aiCacheGet, aiCacheKey, aiCachePut } from "../_shared/ai-cache.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (req.method === 'OPTIONS') {
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
      await checkRateLimit(user.id, 'summarize-health-record', 50);
    } catch (e) {
      if (e instanceof Error && e.message === 'RATE_LIMITED') {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw e;
    }

    // Quota gate: free users get a limited number of document summaries; Pro is unlimited.
    const planGate = await requirePlan(supabaseClient, { feature: "docs", featureLabel: "document uploads" });
    if (planGate) return planGate;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const { fileName, fileType, fileContent, category, radiologyModality, radiologyUploadKind, userNotes } = await req.json();
    const trimmedNotes = typeof userNotes === 'string' ? userNotes.trim().slice(0, 2000) : '';

    console.log('Summarizing health record:', fileName, fileType);

    const isRadiology = category === 'radiology_imaging' || /\b(x[-\s]?ray|ct|mri|ultrasound|sonography|radiology|imaging|scan)\b/i.test(fileName || '');

    const isFilmOnlyRadiology = isRadiology && radiologyUploadKind === 'film_only';

    if (isFilmOnlyRadiology) {
      const filmOnlySummary = [
        `Document Type: Radiology film/photo only`,
        radiologyModality ? `Modality: ${radiologyModality}` : null,
        `Safety Note: This upload appears to be a scan film/photo without a written radiology report. Vyana stored the image for doctors or family to view later, but did not interpret the medical image or attempt diagnosis.`,
        `Confidence: low`,
      ].filter(Boolean).join('\n\n');

      return new Response(JSON.stringify({
        summary: filmOnlySummary,
        documentType: 'Radiology film/photo only',
        importantFindings: [],
        diagnoses: [],
        medications: [],
        allergies: [],
        vitals: [],
        confidence: 'low',
        radiology: {
          modality: radiologyModality || null,
          bodyPart: null,
          studyDate: null,
          impression: [],
          recommendations: [],
          provider: null,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are a STRICT healthcare document extraction assistant.

Follow these rules with zero exceptions:
1. Only state facts explicitly visible in the document.
2. Never infer, predict, speculate, or add medical interpretation beyond the document.
3. If a diagnosis, condition, medication, or value is not clearly present, return an empty array or null instead of guessing.
4. Do not add recommendations unless they are explicitly written in the document.
5. If the document is non-diagnostic (for example pathology specimen notes without broad vitals), say that clearly.
6. This is healthcare: hallucinations are unacceptable.
7. For radiology/imaging files, never diagnose from raw X-ray, CT, MRI, PET, or ultrasound pixels. Only extract written report text, visible labels, dates, modality/body-part, radiologist findings, impression, doctor/hospital name, and recommendations when explicitly present.

Return the result by calling the tool.`;

    const userPrompt = `Extract a factual summary from this medical document.

Document: ${fileName}
Category: ${category || 'unknown'}${isRadiology ? `\nRadiology safety mode: report pages come first, film photos may be attached second. Extract written report findings/impression only, and do not interpret scan imagery. User-selected modality: ${radiologyModality || 'unknown'}.` : ''}${trimmedNotes ? `\n\nPatient's personal notes about this document (use these for context, e.g. when/why it was taken, related symptoms, but never invent clinical findings from them):\n"""${trimmedNotes}"""\nIf the notes contain explicit dates, symptoms, or context that aren't in the document, include them in the "notes" field of the output. Do not treat patient notes as diagnostic findings.` : ''}

Need these fields:
- documentType
- findings: only explicitly stated findings
- radiologyImpression: only the radiologist/doctor impression if explicitly written
- modality: only if explicitly visible or clear from report text, such as X-ray, CT, MRI, ultrasound
- bodyPart: only if explicitly visible or written
- diagnoses: only explicitly written diagnoses
- medications: only explicitly listed medications or dosages
- allergies: only explicitly listed allergies or adverse reactions
- vitals: only numerical measurements explicitly written in the document
- recommendations: only explicitly written follow-up or recommendations
- studyDate: the date printed on the report itself (study date, collection date, report date, sample date) in YYYY-MM-DD if visible, otherwise null. This is the clinical date of the report, NOT today's date and NOT the upload date.
- provider: doctor, radiologist, clinic, hospital, or imaging centre name if visible
- patientName: the full name of the patient the document is about, exactly as written on the document (e.g. "Mr. Rajesh Kumar", "Patient Name: Anita Sharma" -> "Anita Sharma"). Strip salutations like Mr/Mrs/Ms/Dr. Return null if no patient name is visible. Do NOT confuse with doctor or provider names.
- notes: any other explicit notes needed for context
- confidence: high, medium, or low based on readability only

Do not guess. Do not fill missing data. Do not add generalized medical advice.`;

    const messages: any[] = [
      { role: "system", content: withGuardrails(systemPrompt) },
    ];

    if (fileContent && (fileType.startsWith('image/') || fileType === 'application/pdf')) {
      const contentParts: any[] = [{ type: "text", text: userPrompt }];
      contentParts.push({ type: "image_url", image_url: { url: fileContent } });
      messages.push({ role: "user", content: contentParts });
    } else {
      messages.push({ role: "user", content: userPrompt });
    }

    const tools = [{
      type: "function",
      function: {
        name: "extract_medical_document",
        description: "Extract only explicit information from a healthcare document.",
        parameters: {
          type: "object",
          properties: {
            documentType: { type: "string" },
            findings: { type: "array", items: { type: "string" } },
            radiologyImpression: { type: "array", items: { type: "string" } },
            modality: { type: "string" },
            bodyPart: { type: "string" },
            diagnoses: { type: "array", items: { type: "string" } },
            medications: { type: "array", items: { type: "string" } },
            allergies: { type: "array", items: { type: "string" } },
            vitals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "string" },
                  unit: { type: "string" },
                  referenceRange: { type: "string" }
                },
                required: ["name", "value", "unit", "referenceRange"],
                additionalProperties: false
              }
            },
            recommendations: { type: "array", items: { type: "string" } },
            studyDate: { type: ["string", "null"] },
            provider: { type: ["string", "null"] },
            patientName: { type: ["string", "null"] },
            notes: { type: "array", items: { type: "string" } },
            confidence: { type: "string", enum: ["high", "medium", "low"] }
          },
          required: ["documentType", "findings", "radiologyImpression", "modality", "bodyPart", "diagnoses", "medications", "allergies", "vitals", "recommendations", "studyDate", "provider", "patientName", "notes", "confidence"],
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
        model: "google/gemini-3-flash-preview",
        messages,
        tools,
        tool_choice: { type: "function", function: { name: "extract_medical_document" } }
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolArgs = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!toolArgs) throw new Error('No structured summary generated');

    const extracted = JSON.parse(toolArgs);
    const normalizedStudyDate = typeof extracted.studyDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(extracted.studyDate) ? extracted.studyDate : null;
    const radiologyDetails = [
      extracted.modality ? `Modality: ${extracted.modality}` : null,
      extracted.bodyPart ? `Body Part: ${extracted.bodyPart}` : null,
      normalizedStudyDate ? `Study Date: ${normalizedStudyDate}` : null,
      extracted.provider ? `Doctor / Hospital: ${extracted.provider}` : null,
      extracted.radiologyImpression?.length ? `Radiologist Impression:
${extracted.radiologyImpression.map((item: string) => `- ${item}`).join('\n')}` : null,
    ].filter(Boolean);
    const sections = [
      `Document Type: ${extracted.documentType || 'Unknown'}`,
      radiologyDetails.length ? radiologyDetails.join('\n') : null,
      extracted.findings?.length ? `Key Findings:\n${extracted.findings.map((item: string) => `- ${item}`).join('\n')}` : null,
      extracted.diagnoses?.length ? `Diagnoses:\n${extracted.diagnoses.map((item: string) => `- ${item}`).join('\n')}` : null,
      extracted.medications?.length ? `Medications:\n${extracted.medications.map((item: string) => `- ${item}`).join('\n')}` : null,
      extracted.allergies?.length ? `Allergies:\n${extracted.allergies.map((item: string) => `- ${item}`).join('\n')}` : null,
      extracted.vitals?.length ? `Vitals / Lab Values:\n${extracted.vitals.map((item: { name: string; value: string; unit: string; referenceRange: string }) => `- ${item.name}: ${item.value}${item.unit ? ` ${item.unit}` : ''}${item.referenceRange ? ` (Ref: ${item.referenceRange})` : ''}`).join('\n')}` : null,
      extracted.recommendations?.length ? `Recommendations in Document:\n${extracted.recommendations.map((item: string) => `- ${item}`).join('\n')}` : null,
      extracted.notes?.length ? `Notes:\n${extracted.notes.map((item: string) => `- ${item}`).join('\n')}` : null,
      `Confidence: ${extracted.confidence || 'low'}`,
      `Safety Note: This summary contains only information explicitly extracted from the uploaded document.`
    ].filter(Boolean);

    const summary = sections.join('\n\n');

    return new Response(JSON.stringify({
      summary,
      documentType: extracted.documentType || null,
      reportDate: normalizedStudyDate,
      importantFindings: [...(extracted.radiologyImpression || []), ...(extracted.findings || [])],
      diagnoses: extracted.diagnoses || [],
      medications: extracted.medications || [],
      allergies: extracted.allergies || [],
      vitals: extracted.vitals || [],
      confidence: extracted.confidence || 'low',
      patientName: typeof extracted.patientName === 'string' ? extracted.patientName.trim() || null : null,
      radiology: {
        modality: extracted.modality || radiologyModality || null,
        bodyPart: extracted.bodyPart || null,
        studyDate: normalizedStudyDate,
        impression: extracted.radiologyImpression || [],
        recommendations: extracted.recommendations || [],
        provider: extracted.provider || null,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in summarize-health-record:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
