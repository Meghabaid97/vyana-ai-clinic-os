// Server-side invite token validation for Vyana's gated beta.
// This function is the source of truth for whether a user is permitted to
// sign up. It is intentionally callable without a JWT (verify_jwt = false in
// config.toml) because it's invoked BEFORE the user has a Supabase session.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ valid: false, error: "Method not allowed" }, 405);
  }

  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ valid: false, error: "Invalid JSON body" }, 400);
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";

  // Basic UUID v4-ish shape check before we hit the database.
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!token || !uuidRe.test(token)) {
    return json({ valid: false, reason: "malformed" }, 200);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json(
      { valid: false, error: "Server misconfigured" },
      500,
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("access_requests")
    .select(
      "email, name, status, token_used_at, token_expires_at",
    )
    .eq("invite_token", token)
    .maybeSingle();

  if (error) {
    return json({ valid: false, error: "Lookup failed" }, 500);
  }

  if (!data) {
    return json({ valid: false, reason: "not_found" }, 200);
  }
  if (data.status !== "approved") {
    return json({ valid: false, reason: "not_approved" }, 200);
  }
  if (data.token_used_at) {
    return json({ valid: false, reason: "already_used" }, 200);
  }
  if (
    data.token_expires_at &&
    new Date(data.token_expires_at).getTime() < Date.now()
  ) {
    return json({ valid: false, reason: "expired" }, 200);
  }

  return json({
    valid: true,
    email: data.email,
    name: data.name,
  });
});
