import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { fileName, fileType, fileContent } = await req.json();

    console.log('Summarizing health record:', fileName, fileType);

    let prompt = `You are a medical document analyzer. Analyze this health record and provide a concise summary for healthcare providers.

Document: ${fileName}
File Type: ${fileType}

Please provide:
1. **Document Type**: What type of medical document is this?
2. **Key Findings**: Main medical findings or test results
3. **Diagnoses**: Any diagnoses mentioned
4. **Medications**: Any medications prescribed or mentioned
5. **Recommendations**: Any medical recommendations or follow-ups
6. **Important Notes**: Any critical information the doctor should know

Keep the summary professional and medically accurate.`;

    // If we have file content (for images converted to base64)
    const messages: any[] = [
      { role: "system", content: "You are a medical document analyst helping doctors understand patient health records." },
    ];

    if (fileContent && (fileType.startsWith('image/') || fileType === 'application/pdf')) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: prompt },
          { 
            type: "image_url", 
            image_url: { 
              url: fileContent 
            } 
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: prompt
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content;

    if (!summary) {
      throw new Error('No summary generated');
    }

    console.log('Summary generated successfully');

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in summarize-health-record:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
