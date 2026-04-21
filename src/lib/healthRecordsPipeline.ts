import { supabase } from "@/integrations/supabase/client";

/**
 * Shared pipeline: saves a file to health-records storage + health_records table,
 * triggers AI summarization, and returns the inserted record.
 */
export async function saveToHealthRecords(
  file: File,
  patientId: string,
  userId: string,
): Promise<{ recordId: string; filePath: string } | null> {
  const filePath = `${userId}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("health-records")
    .upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data: record, error: dbError } = await supabase
    .from("health_records")
    .insert({
      patient_id: patientId,
      file_name: file.name,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
    })
    .select("id")
    .single();

  if (dbError) throw dbError;
  return { recordId: record.id, filePath };
}

/**
 * Triggers AI summarization for a health record and saves the summary.
 */
export async function summarizeHealthRecord(
  recordId: string,
  filePath: string,
  fileName: string,
  fileType: string,
): Promise<string | null> {
  const { data: urlData } = await supabase.storage
    .from("health-records")
    .createSignedUrl(filePath, 60);

  if (!urlData?.signedUrl) return null;

  let fileContent = urlData.signedUrl;
  if (fileType.startsWith("image/") || fileType === "application/pdf") {
    const response = await fetch(urlData.signedUrl);
    const blob = await response.blob();
    fileContent = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  const { data, error } = await supabase.functions.invoke("summarize-health-record", {
    body: { fileName, fileType, fileContent },
  });

  if (error || !data?.summary) return null;

  await supabase
    .from("health_records")
    .update({ ai_summary: data.summary })
    .eq("id", recordId);

  // Trigger insight detection (non-blocking)
  supabase.functions.invoke("detect-insights", {
    body: { mode: "on-upload", recordId },
  }).catch((e) => console.error("detect-insights failed", e));

  return data.summary;
}

/**
 * Creates medication reminders from extracted discharge medications.
 */
export async function createMedicationReminders(
  patientId: string,
  medications: Array<{ name: string; dosage?: string; frequency?: string; duration?: string }>,
  sourceRecordId?: string,
): Promise<number> {
  if (!medications?.length) return 0;

  let created = 0;
  for (const med of medications) {
    if (!med.name) continue;

    // Check if reminder already exists for this medication
    const { data: existing } = await supabase
      .from("medication_reminders")
      .select("id")
      .eq("patient_id", patientId)
      .eq("medication_name", med.name)
      .eq("is_active", true)
      .maybeSingle();

    if (existing) continue;

    // Map frequency text to time slots
    const timeSlots = mapFrequencyToSlots(med.frequency);

    const { error } = await supabase
      .from("medication_reminders")
      .insert({
        patient_id: patientId,
        medication_name: med.name,
        dosage: med.dosage || null,
        frequency: med.frequency || "as directed",
        time_slots: timeSlots,
        is_active: true,
        notes: med.duration ? `Duration: ${med.duration}` : null,
        source_record_id: sourceRecordId || null,
      });

    if (!error) created++;
  }

  return created;
}

function mapFrequencyToSlots(freq?: string): string[] {
  if (!freq) return ["08:00"];
  const f = freq.toLowerCase();

  if (f.includes("thrice") || f.includes("tid") || f.includes("three times") || f.includes("3 times")) {
    return ["08:00", "14:00", "20:00"];
  }
  if (f.includes("twice") || f.includes("bid") || f.includes("two times") || f.includes("2 times") || f.includes("bd")) {
    return ["08:00", "20:00"];
  }
  if (f.includes("night") || f.includes("hs") || f.includes("bedtime")) {
    return ["21:00"];
  }
  if (f.includes("morning") || f.includes("am")) {
    return ["08:00"];
  }
  if (f.includes("evening") || f.includes("pm")) {
    return ["18:00"];
  }
  if (f.includes("four") || f.includes("qid") || f.includes("4 times")) {
    return ["08:00", "12:00", "16:00", "20:00"];
  }
  // Default: once daily morning
  return ["08:00"];
}
