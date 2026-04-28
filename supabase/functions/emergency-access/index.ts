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

    // 1. Try doctor share link (shared_record_links) first — these expire after 24h
    const { data: shareLink } = await adminClient
      .from("shared_record_links")
      .select("id, patient_id, expires_at, recipient_name")
      .eq("token", access_token)
      .maybeSingle();

    let patientId: string | null = null;
    let viewerName = "Doctor";
    let viewerRelationship = "Doctor";
    let logSource: "share_link" | "emergency_contact" = "share_link";
    let shareLinkId: string | null = null;
    let emergencyContactId: string | null = null;

    if (shareLink) {
      if (new Date(shareLink.expires_at).getTime() < Date.now()) {
        return new Response(JSON.stringify({ error: "This share link has expired. Ask the patient to send a fresh link." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      patientId = shareLink.patient_id;
      viewerName = shareLink.recipient_name || "Doctor";
      viewerRelationship = "Doctor";
      shareLinkId = shareLink.id;
    } else {
      // 2. Fall back to emergency contact token
      const { data: contact, error: contactError } = await adminClient
        .from("emergency_contacts")
        .select("id, patient_id, is_active, contact_name, relationship")
        .eq("access_token", access_token)
        .maybeSingle();

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
      patientId = contact.patient_id;
      viewerName = contact.contact_name;
      viewerRelationship = contact.relationship;
      emergencyContactId = contact.id;
      logSource = "emergency_contact";
    }

    // Log the access (best-effort; don't fail request if logging errors)
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null;
    if (logSource === "emergency_contact" && emergencyContactId) {
      await adminClient.from("emergency_access_logs").insert({
        emergency_contact_id: emergencyContactId,
        patient_id: patientId,
        ip_address: ip,
      });
    }

    // Fetch patient info
    const { data: patient } = await adminClient
      .from("patients")
      .select("name, age, phone, national_health_id, weight, city")
      .eq("id", patientId)
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
      .select("id, file_name, file_path, file_type, uploaded_at, category, ai_summary, document_type, important_findings, medications, allergies, diagnoses, extracted_vitals, ai_confidence, radiology_modality, radiology_body_part, radiology_study_date, radiology_impression, radiology_recommendations, radiology_provider, radiology_upload_kind")
      .eq("patient_id", patientId)
      .order("uploaded_at", { ascending: false })
      .limit(50);

    const recordsWithLinks = await Promise.all((healthRecords || []).map(async (record: any) => {
      const { data: signed } = await adminClient.storage
        .from("health-records")
        .createSignedUrl(record.file_path, 60 * 60);
      return { ...record, file_url: signed?.signedUrl || null };
    }));

    const { data: activeMedicationReminders } = await adminClient
      .from("medication_reminders")
      .select("medication_name, dosage, frequency, time_slots, notes")
      .eq("patient_id", patientId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(30);

    const summary = {
      name: patient.name,
      age: patient.age,
      phone: patient.phone,
      weight: patient.weight,
      city: patient.city,
      emergencyContactName: viewerName,
      emergencyContactRelationship: viewerRelationship,
      consultationCount: consultations.length,
      recordCount: healthRecords?.length || 0,
      consultations,
      healthRecords: recordsWithLinks,
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
