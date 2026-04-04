import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function checkRateLimit(userId: string, functionName: string, maxPerHour = 100) {
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { data } = await adminClient
    .from('api_usage')
    .select('id')
    .eq('user_id', userId)
    .eq('function_name', functionName)
    .gte('created_at', oneHourAgo);

  if (data && data.length >= maxPerHour) {
    throw new Error('RATE_LIMITED');
  }

  await adminClient.from('api_usage').insert({ user_id: userId, function_name: functionName });
}

function validateInput(data: any) {
  if (!data.patientName || typeof data.patientName !== 'string' ||
      data.patientName.length < 1 || data.patientName.length > 200 ||
      !/^[a-zA-Z\s\-']+$/.test(data.patientName)) {
    throw new Error('Invalid patient name');
  }
  const age = parseInt(data.patientAge);
  if (isNaN(age) || age < 0 || age > 150) throw new Error('Invalid patient age');
  if (!data.patientNationalId || typeof data.patientNationalId !== 'string' ||
      data.patientNationalId.length < 5 || data.patientNationalId.length > 50 ||
      !/^[a-zA-Z0-9\-]+$/.test(data.patientNationalId)) {
    throw new Error('Invalid national health ID');
  }
  if (!data.transcription || typeof data.transcription !== 'string' || data.transcription.length > 50000) {
    throw new Error('Invalid or too long transcription');
  }
  return {
    patientName: data.patientName.trim(),
    patientAge: age,
    patientNationalId: data.patientNationalId.trim(),
    transcription: data.transcription.trim()
  };
}

function sanitizeForPrompt(text: string): string {
  return text.replace(/\n\n+/g, '\n').replace(/^(ignore|forget|system|assistant|user):/gim, '').slice(0, 10000);
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

    const { data: roleData } = await supabaseClient
      .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'doctor').single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Requires doctor role' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Rate limit: 100 conversions per hour
    try {
      await checkRateLimit(user.id, 'convert-to-fhir', 100);
    } catch (e) {
      if (e instanceof Error && e.message === 'RATE_LIMITED') {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw e;
    }

    const rawData = await req.json();
    const validatedData = validateInput(rawData);
    const sanitizedTranscription = sanitizeForPrompt(validatedData.transcription);

    console.log('Converting to FHIR format for user:', user.id);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');

    const prompt = `Convert the following medical consultation transcript into FHIR R4 format.

Patient Information:
- Name: ${validatedData.patientName}
- Age: ${validatedData.patientAge}
- National Health ID: ${validatedData.patientNationalId}

Consultation Transcript:
${sanitizedTranscription}

Return ONLY valid FHIR R4 JSON for an Encounter resource with extensions for vitals, medications, symptoms, and clinical observations. No markdown formatting.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a medical data specialist that converts clinical notes into FHIR R4 format. Always return valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    let fhirData = result.choices[0].message.content;
    fhirData = fhirData.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    return new Response(JSON.stringify({ fhir: fhirData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('FHIR conversion error:', error.message);
    return new Response(JSON.stringify({ error: error.message || 'Processing failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
