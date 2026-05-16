// Ask Vyana — grounded medical Q&A using Lovable AI (Gemini) with Google Search grounding.
// Returns: { answer, citations[], confidence: "high"|"moderate"|"low", disclaimer }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Domain quality tiers for confidence scoring
const TIER_1 = [
  "pubmed.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov", "nih.gov", "who.int",
  "cochrane.org", "cochranelibrary.com", "nejm.org", "thelancet.com",
  "bmj.com", "jamanetwork.com", "nature.com", "cell.com",
  "icmr.gov.in", "aiims.edu", "mohfw.gov.in",
];
const TIER_2 = [
  "mayoclinic.org", "clevelandclinic.org", "hopkinsmedicine.org",
  "cdc.gov", "fda.gov", "nhs.uk", "medlineplus.gov", "drugs.com",
  "uptodate.com", "merckmanuals.com", "ada.org", "heart.org",
  "diabetes.org", "cancer.org", "kidney.org",
];

type Tier = 1 | 2 | 3;
function scoreDomain(url: string): Tier {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (TIER_1.some((d) => host === d || host.endsWith("." + d))) return 1;
    if (TIER_2.some((d) => host === d || host.endsWith("." + d))) return 2;
    return 3;
  } catch { return 3; }
}

function computeConfidence(tiers: Tier[]): "high" | "moderate" | "low" {
  if (tiers.length === 0) return "low";
  const tier1 = tiers.filter((t) => t === 1).length;
  const tier2 = tiers.filter((t) => t === 2).length;
  if (tier1 >= 2) return "high";
  if (tier1 >= 1 || tier2 >= 2) return "moderate";
  return "low";
}

const SYSTEM_PROMPT = `You are Vyana, an educational health information assistant for Indian patients.

STRICT RULES:
- You provide EDUCATIONAL information only. You do NOT diagnose, prescribe, or replace a doctor.
- Always cite reputable medical sources (PubMed, NIH, WHO, Mayo Clinic, CDC, NHS, ICMR, AIIMS, MoHFW, peer-reviewed journals).
- Prefer Indian clinical context (ICMR/AIIMS guidelines) when relevant.
- If the question is outside health/medicine, politely decline.
- If the question seeks a specific diagnosis or treatment plan, redirect to "discuss with your doctor".
- Use plain language. Avoid jargon. 3-6 short paragraphs maximum.
- Use markdown for structure (short headings, bullet lists where helpful).
- Never invent statistics or sources. If unsure, say so.

FORMAT:
- Open with a 1-2 sentence direct answer.
- Then expand with key points.
- End with: "Always discuss with your doctor before making changes."`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth guard
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { question, context } = await req.json();
    if (!question || typeof question !== "string" || question.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Please enter a question." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (question.length > 500) {
      return new Response(JSON.stringify({ error: "Question is too long (max 500 chars)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userMsg = context
      ? `Patient context (use only if relevant, do not echo back): ${context}\n\nQuestion: ${question}`
      : question;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        // Enable Google Search grounding for citations
        tools: [{ type: "google_search" } as unknown as Record<string, unknown>],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return new Response(JSON.stringify({ error: "Too many questions right now. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (res.status === 402) {
        return new Response(JSON.stringify({ error: "AI quota exhausted. Please add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      throw new Error(`AI gateway error ${res.status}`);
    }

    const data = await res.json();
    const choice = data?.choices?.[0];
    const answer: string = choice?.message?.content ?? "";

    // Extract grounding citations (Gemini exposes them via grounding_metadata or annotations)
    const rawCitations: Array<{ url?: string; title?: string }> =
      choice?.message?.annotations?.map((a: any) => ({
        url: a?.url || a?.url_citation?.url,
        title: a?.title || a?.url_citation?.title,
      })) ??
      choice?.grounding_metadata?.grounding_chunks?.map((c: any) => ({
        url: c?.web?.uri,
        title: c?.web?.title,
      })) ??
      [];

    // Dedupe by host + path
    const seen = new Set<string>();
    const citations = rawCitations
      .filter((c) => c.url && typeof c.url === "string")
      .map((c) => {
        const url = c.url as string;
        let host = "";
        try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
        return { url, title: c.title || host || url, host, tier: scoreDomain(url) };
      })
      .filter((c) => {
        const key = c.host + new URL(c.url).pathname;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);

    const confidence = computeConfidence(citations.map((c) => c.tier as Tier));

    return new Response(
      JSON.stringify({
        answer,
        citations,
        confidence,
        disclaimer:
          "Educational information only. Not a substitute for professional medical advice. Always consult your doctor.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ask-vyana error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
