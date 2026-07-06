/**
 * Client-side audit logging for every health_records access.
 *
 * Purpose: give us a structured, greppable trail of {auth.uid, patient_id,
 * op, count, error} for every request the browser sends against
 * health_records, plus a hard runtime assertion that every row returned
 * actually belongs to the patient we asked for. If a cross-account leak
 * ever reappears, `[hr-audit] LEAK` in the console pinpoints the exact
 * component + patient + owner within a single session.
 *
 * Server-side writes are audited authoritatively by the
 * `trg_audit_health_records_access` trigger into
 * `public.health_records_access_audit` (see the matching migration).
 */

import { supabase } from "@/integrations/supabase/client";

export type HealthRecordsOp =
  | "select"
  | "insert"
  | "update"
  | "delete"
  | "storage-upload"
  | "storage-remove"
  | "storage-signed-url"
  | "rpc";

interface AuditPayload {
  op: HealthRecordsOp;
  patientId: string | null | undefined;
  where: string; // e.g. "HealthRecordsTab.loadRecords"
  recordId?: string | null;
  count?: number;
  error?: unknown;
  extra?: Record<string, unknown>;
}

// Cached so we don't call getUser() on every log line — it hits the auth
// endpoint. Refreshed by the auth listener below.
let cachedUid: string | null | undefined = undefined;

supabase.auth.onAuthStateChange((_event, session) => {
  cachedUid = session?.user?.id ?? null;
});

async function currentUid(): Promise<string | null> {
  if (cachedUid !== undefined) return cachedUid;
  const { data } = await supabase.auth.getSession();
  cachedUid = data.session?.user?.id ?? null;
  return cachedUid;
}

/**
 * Fire-and-forget structured log. Safe to await or ignore.
 */
export async function logHealthRecordsAccess(payload: AuditPayload): Promise<void> {
  const auth_uid = await currentUid().catch(() => null);
  const line = {
    tag: "hr-audit",
    ts: new Date().toISOString(),
    auth_uid,
    patient_id: payload.patientId ?? null,
    op: payload.op,
    where: payload.where,
    record_id: payload.recordId ?? null,
    count: payload.count ?? null,
    error: payload.error
      ? {
          message: (payload.error as { message?: string })?.message ?? String(payload.error),
          code: (payload.error as { code?: string })?.code ?? null,
        }
      : null,
    ...(payload.extra ?? {}),
  };

  if (line.error) {
    console.warn("[hr-audit]", line);
  } else {
    console.info("[hr-audit]", line);
  }
}

/**
 * Runtime tripwire: every row returned MUST belong to `patientId`. If any
 * row's patient_id differs, we log a LEAK event AND drop the offending
 * rows from the returned array so the UI never renders foreign data even
 * if RLS somehow regressed. Returns the filtered list.
 */
export function assertRecordsBelongToPatient<T extends { patient_id?: string | null; id?: string }>(
  rows: T[] | null | undefined,
  patientId: string | null | undefined,
  where: string,
): T[] {
  if (!rows || rows.length === 0) return rows ?? [];
  if (!patientId) return rows;

  const leaked: T[] = [];
  const clean: T[] = [];
  for (const r of rows) {
    if (r.patient_id && r.patient_id !== patientId) leaked.push(r);
    else clean.push(r);
  }

  if (leaked.length > 0) {
    // Loud, structured, greppable. Also ships to console.error so Sentry-
    // style collectors would page on it in prod.
    console.error("[hr-audit] LEAK", {
      tag: "hr-audit",
      severity: "critical",
      where,
      requested_patient_id: patientId,
      leaked_count: leaked.length,
      leaked_ids: leaked.map((r) => r.id).filter(Boolean),
      leaked_patient_ids: Array.from(new Set(leaked.map((r) => r.patient_id))),
    });
    void logHealthRecordsAccess({
      op: "select",
      patientId,
      where: `${where}::LEAK`,
      count: leaked.length,
      extra: {
        leaked_patient_ids: Array.from(new Set(leaked.map((r) => r.patient_id))),
      },
    });
  }

  return clean;
}
