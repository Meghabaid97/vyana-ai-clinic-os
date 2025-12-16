import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DrugInteractionRequest {
  medications: string[];
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

    const { medications }: DrugInteractionRequest = await req.json();

    if (!medications || medications.length < 2) {
      return new Response(
        JSON.stringify({ 
          interactions: [],
          message: "At least 2 medications required to check interactions" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Checking drug interactions for:", medications);

    const prompt = `You are a pharmacology expert AI. Analyze potential drug interactions between the following medications:

Medications: ${medications.join(", ")}

For each potential interaction, provide:
1. The drugs involved
2. Severity (minor, moderate, severe, contraindicated)
3. Description of the interaction
4. Clinical recommendation

Also provide general safety notes if applicable.

Respond in this exact JSON format:
{
  "interactions": [
    {
      "drugs": ["Drug A", "Drug B"],
      "severity": "moderate",
      "description": "Brief description of the interaction",
      "recommendation": "What to do about it"
    }
  ],
  "safetyNotes": ["General note 1", "General note 2"],
  "overallRisk": "low|moderate|high",
  "disclaimer": "Medical disclaimer"
}

If no significant interactions are found, return an empty interactions array with appropriate message.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a pharmacology expert that checks for drug interactions. Provide accurate, clinically relevant information while always recommending professional medical consultation." },
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

    let result;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      result = {
        interactions: [],
        safetyNotes: ["Unable to analyze interactions. Please consult a pharmacist."],
        overallRisk: "unknown",
        disclaimer: "This AI analysis could not be completed. Please consult a healthcare professional."
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in check-drug-interactions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
