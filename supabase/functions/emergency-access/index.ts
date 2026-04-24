import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token } = await req.json();
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!access_token || typeof access_token !== "string" || !uuidPattern.test(access_token)) {
      return new Response(JSON.stringify({ error: "Invalid access token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the emergency contact by token
    const { data: contact, error: contactError } = await adminClient
      .from("emergency_contacts")
      .select("id, patient_id, is_active, contact_name, relationship")
      .eq("access_token", access_token)
      .single();

    if (contactError || !contact) {
      return new Response(JSON.stringify({ error: "Invalid or expired access link" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!contact.is_active) {
      return new Response(JSON.stringify({ error: "This emergency access has been deactivated by the patient" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the access
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null;
    await adminClient.from("emergency_access_logs").insert({
      emergency_contact_id: contact.id,
      patient_id: contact.patient_id,
      ip_address: ip,
    });

    // Fetch patient info
    const { data: patient } = await adminClient
      .from("patients")
      .select("name, age, phone, national_health_id, weight, city")
      .eq("id", contact.patient_id)
      .single();

    if (!patient) {
      return new Response(JSON.stringify({ error: "Patient not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch consultations via ABHA ID
    let consultations: any[] = [];
    if (patient.national_health_id) {
      const { data } = await adminClient
        .from("consultations")
        .select("id, created_at, fhir_data, patient_name")
        .eq("patient_national_health_id", patient.national_health_id)
        .order("created_at", { ascending: false })
        .limit(50);
      consultations = data || [];
    }

    // Fetch health records
    const { data: healthRecords } = await adminClient
      .from("health_records")
      .select("id, file_name, file_type, uploaded_at, ai_summary, document_type, important_findings, medications, allergies, diagnoses, extracted_vitals, ai_confidence")
      .eq("patient_id", contact.patient_id)
      .order("uploaded_at", { ascending: false })
      .limit(50);

    const { data: activeMedicationReminders } = await adminClient
      .from("medication_reminders")
      .select("medication_name, dosage, frequency, time_slots, notes")
      .eq("patient_id", contact.patient_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(30);

    const summary = {
      name: patient.name,
      age: patient.age,
      phone: patient.phone,
      weight: patient.weight,
      city: patient.city,
      emergencyContactName: contact.contact_name,
      emergencyContactRelationship: contact.relationship,
      consultationCount: consultations.length,
      recordCount: healthRecords?.length || 0,
      consultations,
      healthRecords: healthRecords || [],
      activeMedications: activeMedicationReminders || [],
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Emergency access error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
