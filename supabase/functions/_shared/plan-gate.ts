// Shared server-side plan/entitlement gate.
// Use this in every edge function that exposes a Pro-only or quota-limited
// feature. NEVER trust client-side `is_pro` flags — the client can lie.
//
// Usage:
//   const gate = await requirePlan(supabaseClient, { feature: 'pro' });
//   if (gate) return gate; // Response (401/402)
//
//   const gate = await requirePlan(supabaseClient, { feature: 'docs' });
//   if (gate) return gate;

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Entitlements = {
  authenticated?: boolean;
  is_pro?: boolean;
  plan?: string;
  briefings_remaining?: number | null;
  docs_remaining?: number | null;
  family_remaining?: number | null;
};

export type GateFeature =
  | "pro"        // Pro-only AI feature (no free quota)
  | "briefing"   // Counts against briefings_remaining
  | "docs"       // Counts against docs_remaining
  | "family";    // Counts against family_remaining

export async function getEntitlements(
  supabaseClient: SupabaseClient,
): Promise<Entitlements | null> {
  const { data, error } = await supabaseClient.rpc("get_entitlements");
  if (error) {
    console.error("get_entitlements failed:", error);
    return null;
  }
  return (data ?? {}) as Entitlements;
}

export async function requirePlan(
  supabaseClient: SupabaseClient,
  opts: { feature: GateFeature; featureLabel?: string },
): Promise<Response | null> {
  const ent = await getEntitlements(supabaseClient);
  if (!ent) {
    return new Response(
      JSON.stringify({ error: "Could not verify subscription" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  if (ent.authenticated === false) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const isPro = ent.is_pro === true;
  const label = opts.featureLabel ?? "this feature";

  // Pro-only feature: no free quota at all.
  if (opts.feature === "pro" && !isPro) {
    return new Response(
      JSON.stringify({
        error: "PLAN_LIMIT_REACHED",
        message: `${label} is a Vyana Pro feature. Upgrade to continue.`,
        reason: "pro_only",
      }),
      { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Quota-style features: Pro is unlimited, free has a remaining counter.
  if (!isPro) {
    const remaining =
      opts.feature === "briefing" ? ent.briefings_remaining :
      opts.feature === "docs"     ? ent.docs_remaining :
      opts.feature === "family"   ? ent.family_remaining : 0;
    if (typeof remaining === "number" && remaining <= 0) {
      return new Response(
        JSON.stringify({
          error: "PLAN_LIMIT_REACHED",
          message: `You've reached the free limit for ${label}. Upgrade to Vyana Pro to continue.`,
          reason: opts.feature,
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  return null;
}
