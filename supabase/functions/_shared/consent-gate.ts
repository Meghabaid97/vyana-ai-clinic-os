// Server-side consent gate.
// Blocks AI/PHI processing when the user has not (or has withdrawn) consent.
// Checks the LATEST consent_log entry per type for the authenticated user.
//
// Usage in an edge function:
//   const auth = await requireAuthUser(req);
//   if (auth instanceof Response) return auth;
//   const gate = await requireAiConsent(auth.userId);
//   if (gate) return gate;

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const admin = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

/** Verify the request JWT and return the user_id, or a 401 Response. */
export async function requireAuthUser(
  req: Request,
): Promise<{ userId: string; token: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const token = authHeader.replace("Bearer ", "");
  const client = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return { userId: data.claims.sub as string, token };
}

/**
 * Reject the request if the user's latest consent_log entry for any of the
 * required types is not `granted`. Default: AI processing + 18+.
 */
export async function requireAiConsent(
  userId: string,
  requiredTypes: string[] = ["ai_processing", "age_18_confirmation"],
): Promise<Response | null> {
  const sb = admin();
  const { data, error } = await sb
    .from("consent_log")
    .select("consent_type, granted, created_at")
    .eq("user_id", userId)
    .in("consent_type", requiredTypes)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(
      JSON.stringify({ error: "consent_check_failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Take the latest row per type.
  const latest: Record<string, boolean> = {};
  for (const row of data ?? []) {
    if (!(row.consent_type in latest)) {
      latest[row.consent_type] = !!row.granted;
    }
  }

  const missing = requiredTypes.filter((t) => latest[t] !== true);
  if (missing.length > 0) {
    return new Response(
      JSON.stringify({
        error: "consent_required",
        missing,
        message:
          "AI processing consent is required. Re-enable it in Settings → Privacy.",
      }),
      {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
  return null;
}
