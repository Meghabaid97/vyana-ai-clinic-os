import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthData {
  patientName: string;
  patientAge: number;
  diagnoses: string[];
  medications: string[];
  symptoms: string[];
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

    const { patientName, patientAge, diagnoses, medications, symptoms }: HealthData = await req.json();

    console.log("Analyzing health risks for:", patientName);
    console.log("Data:", { diagnoses, medications, symptoms });

    const prompt = `You are a medical AI assistant. Analyze the following patient's medical history and provide health risk indicators.

Patient: ${patientName}, Age: ${patientAge}

Medical History:
- Past Diagnoses: ${diagnoses.length > 0 ? diagnoses.join(", ") : "None recorded"}
- Current/Past Medications: ${medications.length > 0 ? medications.join(", ") : "None recorded"}
- Reported Symptoms: ${symptoms.length > 0 ? symptoms.join(", ") : "None recorded"}

Based on this medical history, provide:
1. Up to 3 potential health risk indicators (conditions they may be at risk for)
2. Risk level for each (low, medium, high)
3. Brief reasoning (1-2 sentences)
4. General preventive recommendations

IMPORTANT: This is for informational purposes only. Always recommend consulting a healthcare professional.

Respond in this exact JSON format:
{
  "risks": [
    {
      "condition": "Condition name",
      "level": "low|medium|high",
      "reasoning": "Brief explanation"
    }
  ],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "disclaimer": "Brief medical disclaimer"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a medical AI assistant that analyzes patient history for potential health risks. Always provide balanced, evidence-based insights and remind users to consult healthcare professionals." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log("AI response:", content);

    // Parse JSON from response
    let analysis;
    try {
      // Handle markdown-wrapped JSON
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      analysis = {
        risks: [
          {
            condition: "Unable to analyze",
            level: "low",
            reasoning: "Insufficient medical history data for comprehensive analysis."
          }
        ],
        recommendations: ["Continue regular health checkups", "Maintain a balanced lifestyle"],
        disclaimer: "This is an AI-generated analysis. Please consult a healthcare professional for medical advice."
      };
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-health-risks:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
