import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PrescriptionRequest {
  type: "from_consultation" | "from_audio";
  transcription?: string;
  fhirData?: string;
  audioTranscription?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { type, transcription, fhirData, audioTranscription }: PrescriptionRequest = await req.json();

    console.log("Generating prescription from:", type);

    let prompt = "";

    if (type === "from_consultation") {
      prompt = `You are a medical AI assistant. Analyze the following consultation data and extract prescription information.

Consultation Transcription:
${transcription || "Not available"}

FHIR Data:
${fhirData || "Not available"}

Extract and structure the prescription data including:
1. Medications mentioned (with dosages if stated)
2. Dosage instructions
3. Duration of treatment
4. Special instructions for the patient
5. Any additional notes

Respond in this exact JSON format:
{
  "medications": "List of medications, one per line",
  "dosage": "Dosage instructions",
  "duration": "Treatment duration",
  "instructions": "Instructions for the patient",
  "notes": "Additional notes",
  "confidence": "high|medium|low",
  "warning": "Any warnings or missing information"
}`;
    } else if (type === "from_audio") {
      prompt = `You are a medical AI assistant. A doctor has dictated a prescription. Parse the following transcription and structure it properly.

Doctor's dictation:
${audioTranscription}

Extract and structure the prescription data. If the doctor mentions specific medications, dosages, or instructions, include them.

Respond in this exact JSON format:
{
  "medications": "List of medications, one per line",
  "dosage": "Dosage instructions",
  "duration": "Treatment duration",
  "instructions": "Instructions for the patient",
  "notes": "Additional notes",
  "confidence": "high|medium|low",
  "warning": "Any warnings or unclear parts"
}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a medical AI assistant that helps doctors generate prescriptions from consultation data or voice dictation. Extract medications, dosages, and instructions accurately." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("AI response:", content);

    let prescription;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      prescription = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      prescription = {
        medications: "",
        dosage: "",
        duration: "",
        instructions: "",
        notes: "",
        confidence: "low",
        warning: "Could not parse prescription data. Please enter manually."
      };
    }

    return new Response(JSON.stringify(prescription), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-prescription:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
