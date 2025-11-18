import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { transcription, patientName, patientAge, patientNationalId } = await req.json();
    
    if (!transcription || !patientName || !patientAge || !patientNationalId) {
      throw new Error('Missing required fields');
    }

    console.log('Converting to FHIR format...');

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Convert the following medical consultation transcript into FHIR R4 format. Create a proper FHIR Encounter resource with the patient information and clinical notes.

Patient Information:
- Name: ${patientName}
- Age: ${patientAge}
- National Health ID: ${patientNationalId}

Consultation Transcript:
${transcription}

Please return ONLY valid FHIR R4 JSON format for an Encounter resource. Include structured extensions for any vitals (blood pressure, temperature, heart rate), medications, symptoms, and clinical observations mentioned in the transcript. Use the following structure:

{
  "resourceType": "Encounter",
  "status": "finished",
  "class": { "code": "AMB" },
  "subject": {
    "display": "${patientName}"
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
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json();
    let fhirData = result.choices[0].message.content;

    // Remove markdown code blocks if present
    fhirData = fhirData.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    console.log('FHIR conversion successful');

    return new Response(
      JSON.stringify({ fhir: fhirData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('FHIR conversion error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
