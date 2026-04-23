// Compute meaningful deltas across the two most recent vital_history snapshots,
// plus recent medication and record activity. Used by Home "What changed" card
// and HealthTrends "What changed since last visit" section.
import { supabase } from "@/integrations/supabase/client";
import { normalizeVital, formatVital } from "@/lib/vitalStatus";

export type ChangeKind = "vital_up" | "vital_down" | "vital_stable" | "new_med" | "new_record";
export type ChangeSeverity = "info" | "monitor" | "alert";

export interface Change {
  kind: ChangeKind;
  severity: ChangeSeverity;
  label: string;       // "HbA1c"
  detail: string;      // "7.6 → 8.1 (↑ 0.5)"
  when: string;        // "today" | "3d ago" | "Jun 12"
}

interface VitalsMap { [k: string]: number | null }

interface VitalHistoryRow {
  recorded_at: string;
  source_file_name: string;
  vitals: VitalsMap;
}

const VITAL_LABELS: Record<string, { label: string; unit: string; alertDelta?: number; monitorDelta?: number; decimals?: number }> = {
  hba1c: { label: "HbA1c", unit: "%", alertDelta: 0.5, monitorDelta: 0.2, decimals: 1 },
  bp_systolic: { label: "BP (Systolic)", unit: "mmHg", alertDelta: 15, monitorDelta: 8 },
  bp_diastolic: { label: "BP (Diastolic)", unit: "mmHg", alertDelta: 10, monitorDelta: 5 },
  fasting_blood_sugar: { label: "Fasting Glucose", unit: "mg/dL", alertDelta: 30, monitorDelta: 15 },
  ldl: { label: "LDL", unit: "mg/dL", alertDelta: 30, monitorDelta: 15 },
  hdl: { label: "HDL", unit: "mg/dL", alertDelta: 10, monitorDelta: 5 },
  total_cholesterol: { label: "Cholesterol", unit: "mg/dL", alertDelta: 30, monitorDelta: 15 },
  triglycerides: { label: "Triglycerides", unit: "mg/dL", alertDelta: 50, monitorDelta: 25 },
  creatinine: { label: "Creatinine", unit: "mg/dL", alertDelta: 0.3, monitorDelta: 0.15, decimals: 2 },
  hemoglobin: { label: "Hemoglobin", unit: "g/dL", alertDelta: 1.5, monitorDelta: 0.7, decimals: 1 },
  tsh: { label: "TSH", unit: "mIU/L", alertDelta: 1.5, monitorDelta: 0.7, decimals: 2 },
  weight: { label: "Weight", unit: "kg", alertDelta: 4, monitorDelta: 2, decimals: 1 },
};

const fmtNum = (key: string, v: number, decimals = 0) => formatVital(key, v, decimals);

const relativeWhen = (iso: string): string => {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export async function computeChangesSinceLastVisit(patientId: string, limit = 6): Promise<Change[]> {
  const changes: Change[] = [];

  // Vitals: compare two most recent snapshots
  const { data: vh } = await supabase
    .from("vital_history")
    .select("recorded_at, source_file_name, vitals")
    .eq("patient_id", patientId)
    .order("recorded_at", { ascending: false })
    .limit(2) as { data: VitalHistoryRow[] | null };

  if (vh && vh.length >= 2) {
    const [latest, prev] = vh;
    for (const key of Object.keys(VITAL_LABELS)) {
      const cfg = VITAL_LABELS[key];
      const aRaw = latest.vitals?.[key];
      const bRaw = prev.vitals?.[key];
      if (aRaw == null || bRaw == null) continue;
      // Normalize both readings into canonical units before comparing,
      // so unit-entry mistakes (e.g. HbA1c 0.075 vs 7.5) don't trip alerts.
      const a = normalizeVital(key, aRaw);
      const b = normalizeVital(key, bRaw);
      const delta = a - b;
      const abs = Math.abs(delta);
      const monitor = cfg.monitorDelta ?? 0;
      const alert = cfg.alertDelta ?? Infinity;
      if (abs < monitor) continue;
      const arrow = delta > 0 ? "↑" : "↓";
      const severity: ChangeSeverity = abs >= alert ? "alert" : "monitor";
      const kind: ChangeKind = delta > 0 ? "vital_up" : "vital_down";
      changes.push({
        kind,
        severity,
        label: cfg.label,
        detail: `${fmtNum(key, b, cfg.decimals)} → ${fmtNum(key, a, cfg.decimals)} ${cfg.unit} (${arrow} ${fmtNum(key, abs, cfg.decimals)})`,
        when: relativeWhen(latest.recorded_at),
      });
    }
  }

  // New medications in last 30 days
  const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: meds } = await supabase
    .from("medication_reminders")
    .select("medication_name, created_at")
    .eq("patient_id", patientId)
    .gte("created_at", since30)
    .order("created_at", { ascending: false })
    .limit(3);

  (meds || []).forEach((m) => {
    changes.push({
      kind: "new_med",
      severity: "info",
      label: "New medication",
      detail: m.medication_name,
      when: relativeWhen(m.created_at),
    });
  });

  // Sort: alerts first, then monitor, then info
  const rank: Record<ChangeSeverity, number> = { alert: 0, monitor: 1, info: 2 };
  changes.sort((a, b) => rank[a.severity] - rank[b.severity]);

  return changes.slice(0, limit);
}

// Demo deltas for empty-state preview
export const SAMPLE_CHANGES: Change[] = [
  { kind: "vital_up", severity: "alert", label: "HbA1c", detail: "7.6 → 8.1 % (↑ 0.5)", when: "today" },
  { kind: "new_med", severity: "info", label: "New medication", detail: "Atorvastatin 40mg", when: "5d ago" },
  { kind: "vital_down", severity: "monitor", label: "BP (Systolic)", detail: "148 → 132 mmHg (↓ 16)", when: "today" },
  { kind: "new_record", severity: "info", label: "New record", detail: "ER discharge summary", when: "2w ago" },
];
