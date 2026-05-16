// DPDPA 2023 — Data Principal Right to Access.
// Returns a JSON bundle of every row the authenticated user owns.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Record the request (audit trail)
    await admin.from("data_export_requests").insert({
      user_id: userId,
      status: "processing",
      ip_address: ip,
    });

    const { data: user } = await admin.auth.admin.getUserById(userId);

    // Find the patient row (most child tables reference patients.id, not user_id)
    const { data: patient } = await admin.from("patients").select("*").eq("user_id", userId).maybeSingle();
    const patientId = patient?.id ?? null;

    const childTables = [
      "health_records",
      "vital_history",
      "symptom_logs",
      "medication_reminders",
      "emergency_contacts",
      "emergency_access_logs",
      "shared_record_links",
      "journal_preferences",
      "doctor_visit_prep",
    ] as const;

    const childData: Record<string, unknown> = {};
    if (patientId) {
      for (const t of childTables) {
        const { data } = await admin.from(t).select("*").eq("patient_id", patientId);
        childData[t] = data ?? [];
      }
    }

    const { data: notifications } = await admin.from("notifications").select("*").eq("user_id", userId);
    const { data: supportTickets } = await admin.from("support_tickets").select("*").eq("user_id", userId);
    const { data: roles } = await admin.from("user_roles").select("*").eq("user_id", userId);
    const { data: consents } = await admin.from("consent_log").select("*").eq("user_id", userId);
    const { data: apiUsage } = await admin.from("api_usage").select("*").eq("user_id", userId);

    const bundle = {
      exported_at: new Date().toISOString(),
      data_principal: {
        id: userId,
        email: user?.user?.email ?? null,
        created_at: user?.user?.created_at ?? null,
      },
      profile: patient,
      roles: roles ?? [],
      consents: consents ?? [],
      notifications: notifications ?? [],
      support_tickets: supportTickets ?? [],
      api_usage: apiUsage ?? [],
      ...childData,
    };

    // Mark the request completed
    await admin
      .from("data_export_requests")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("status", "processing");

    return new Response(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="vyana-my-data-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("export-my-data error:", error);
    return new Response(JSON.stringify({ error: "Export failed. Please try again later." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
