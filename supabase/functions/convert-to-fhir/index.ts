import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function validateInput(data: any) {
  // Validate patient name (1-200 chars, letters, spaces, hyphens, apostrophes)
  if (!data.patientName || typeof data.patientName !== 'string' ||
      data.patientName.length < 1 || data.patientName.length > 200 ||
      !/^[a-zA-Z\s\-']+$/.test(data.patientName)) {
    throw new Error('Invalid patient name');
  }

  // Validate age (0-150)
  const age = parseInt(data.patientAge);
  if (isNaN(age) || age < 0 || age > 150) {
    throw new Error('Invalid patient age');
  }

  // Validate national health ID (5-50 chars, alphanumeric and hyphens)
  if (!data.patientNationalId || typeof data.patientNationalId !== 'string' ||
      data.patientNationalId.length < 5 || data.patientNationalId.length > 50 ||
      !/^[a-zA-Z0-9\-]+$/.test(data.patientNationalId)) {
    throw new Error('Invalid national health ID');
  }

  // Validate transcription length (max 50000 chars)
  if (!data.transcription || typeof data.transcription !== 'string' ||
      data.transcription.length > 50000) {
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
  // Remove potential prompt manipulation patterns and limit length
  return text
    .replace(/\n\n+/g, '\n')
    .replace(/^(ignore|forget|system|assistant|user):/gim, '')
    .slice(0, 10000);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify doctor role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'doctor')
      .single();

    if (!roleData) {
      console.error('User lacks doctor role:', user.id);
      return new Response(JSON.stringify({ error: 'Requires doctor role' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const rawData = await req.json();
    
    // Validate and sanitize input
    const validatedData = validateInput(rawData);
    const sanitizedTranscription = sanitizeForPrompt(validatedData.transcription);

    console.log('Converting to FHIR format for user:', user.id);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Convert the following medical consultation transcript into FHIR R4 format. Create a proper FHIR Encounter resource with the patient information and clinical notes.

Patient Information:
- Name: ${validatedData.patientName}
- Age: ${validatedData.patientAge}
- National Health ID: ${validatedData.patientNationalId}

Consultation Transcript:
${sanitizedTranscription}

Please return ONLY valid FHIR R4 JSON format for an Encounter resource. Include structured extensions for any vitals (blood pressure, temperature, heart rate), medications, symptoms, and clinical observations mentioned in the transcript. Use the following structure:

{
  "resourceType": "Encounter",
  "status": "finished",
  "class": { "code": "AMB" },
  "subject": {
    "display": "${validatedData.patientName}"
  },
  "period": {
    "start": "${new Date().toISOString()}"
  },
  "diagnosis": [
    {
      "condition": {
        "display": "Primary diagnosis from transcript"
      }
    }
  ],
  "extension": [
    {
      "url": "http://example.org/fhir/vital/blood_pressure",
      "valueString": "120/80 mmHg"
    },
    {
      "url": "http://example.org/fhir/vital/temperature",
      "valueString": "98.6°F"
    },
    {
      "url": "http://example.org/fhir/vital/heart_rate",
      "valueString": "72 bpm"
    },
    {
      "url": "http://example.org/fhir/medication",
      "valueString": "Medication name and dosage"
    },
    {
      "url": "http://example.org/fhir/symptom",
      "valueString": "Symptom description"
    },
    {
      "url": "http://example.org/fhir/note",
      "valueString": "Additional clinical notes"
    }
  ]
}

Extract all relevant medical information from the transcript and structure it using the extensions array. Return ONLY the JSON without any markdown formatting.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a medical data specialist that converts clinical notes into FHIR R4 format. Always return valid JSON in FHIR R4 Encounter resource format.',
          },
          {
            role: 'user',
            content: prompt,
          },
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

    // Remove markdown code blocks if present
    fhirData = fhirData.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    console.log('FHIR conversion successful for user:', user.id);

    return new Response(
      JSON.stringify({ fhir: fhirData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('FHIR conversion error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Processing failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
