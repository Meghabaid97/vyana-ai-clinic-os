// DPDPA 2023 — Data Principal Right to Erasure.
// Schedules account deletion with a 30-day grace period.
// Action: "request" creates a pending row; "cancel" cancels a pending row;
// "confirm_now" deletes immediately (requires fresh re-auth on client).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function purgeUser(admin: ReturnType<typeof createClient>, userId: string) {
  // Find patient + storage paths first
  const { data: patient } = await admin.from("patients").select("id").eq("user_id", userId).maybeSingle();
  const patientId = patient?.id ?? null;

  if (patientId) {
    // Collect file paths to remove from storage
    const { data: records } = await admin.from("health_records").select("file_path").eq("patient_id", patientId);
    const recordPaths = (records ?? []).map((r: any) => r.file_path).filter(Boolean);
    if (recordPaths.length) await admin.storage.from("health-records").remove(recordPaths);

    const { data: symptoms } = await admin.from("symptom_logs").select("photo_path").eq("patient_id", patientId);
    const symptomPaths = (symptoms ?? []).map((r: any) => r.photo_path).filter(Boolean);
    if (symptomPaths.length) await admin.storage.from("symptom-photos").remove(symptomPaths);

    // Cascade child tables
    const childTables = [
      "health_records", "vital_history", "symptom_logs", "medication_reminders",
      "emergency_contacts", "emergency_access_logs", "shared_record_links",
      "journal_preferences", "doctor_visit_prep",
    ];
    for (const t of childTables) {
      await admin.from(t).delete().eq("patient_id", patientId);
    }
    await admin.from("patients").delete().eq("user_id", userId);
  }

  // User-scoped tables
  for (const t of ["notifications", "support_tickets", "user_roles", "api_usage"]) {
    await admin.from(t).delete().eq("user_id", userId);
  }

  // Finally, the auth user
  await admin.auth.admin.deleteUser(userId);
}

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

    const body = await req.json().catch(() => ({}));
    const action = (body?.action ?? "request") as "request" | "cancel" | "confirm_now";
    const reason = typeof body?.reason === "string" ? body.reason.slice(0, 1000) : null;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "cancel") {
      await admin.from("data_deletion_requests")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("status", "pending");
      return new Response(JSON.stringify({ ok: true, status: "cancelled" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "confirm_now") {
      await admin.from("data_deletion_requests").insert({
        user_id: userId, status: "completed", completed_at: new Date().toISOString(),
        scheduled_for: new Date().toISOString(), reason, ip_address: ip,
      });
      await purgeUser(admin, userId);
      return new Response(JSON.stringify({ ok: true, status: "deleted" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // default: schedule with 30-day grace
    const { data: existing } = await admin
      .from("data_deletion_requests")
      .select("id, scheduled_for")
      .eq("user_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ ok: true, status: "already_pending", scheduled_for: existing.scheduled_for }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: row, error: insertError } = await admin.from("data_deletion_requests").insert({
      user_id: userId, status: "pending", reason, ip_address: ip,
    }).select("scheduled_for").single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ ok: true, status: "pending", scheduled_for: row.scheduled_for }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("request-account-deletion error:", error);
    return new Response(JSON.stringify({ error: "Request failed. Please try again later." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
