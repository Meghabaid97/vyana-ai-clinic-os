// Storage integrity check with detailed per-row audit logging.
// - Never deletes rows or storage files.
// - Only auto-repairs a path when a UNIQUE match exists under the same owner's folder.
// - Every change writes a row to integrity_check_events with old/new path and a
//   post-repair signed-URL visibility probe (proves the app can now open it).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type EventRow = {
  run_id: string;
  entity: string;
  entity_id: string;
  action: string;
  patient_id?: string | null;
  owner_user_id?: string | null;
  bucket?: string | null;
  old_path?: string | null;
  new_path?: string | null;
  visibility_check?: string | null;
  visibility_error?: string | null;
  notes?: Record<string, unknown>;
};

async function objectExists(admin: any, bucket: string, path: string): Promise<boolean> {
  if (!path) return false;
  const slash = path.lastIndexOf("/");
  const dir = slash >= 0 ? path.slice(0, slash) : "";
  const name = slash >= 0 ? path.slice(slash + 1) : path;
  const { data, error } = await admin.storage.from(bucket).list(dir, { limit: 1000, search: name });
  if (error) return false;
  return !!data?.some((o: any) => o.name === name);
}

async function findUniqueMatch(admin: any, bucket: string, ownerId: string, fileName: string) {
  const { data, error } = await admin.storage.from(bucket).list(ownerId, { limit: 1000, search: fileName });
  if (error || !data) return null;
  const matches = data.filter((o: any) => o.name === fileName);
  return matches.length === 1 ? `${ownerId}/${fileName}` : null;
}

async function verifyVisibility(admin: any, bucket: string, path: string) {
  // Attempts to sign the URL as service role would. If it succeeds, the object
  // is reachable; app-level visibility further depends on RLS which is
  // unchanged by this job.
  try {
    const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 60);
    if (error || !data?.signedUrl) return { ok: false, err: error?.message ?? "no url" };
    const head = await fetch(data.signedUrl, { method: "HEAD" });
    if (!head.ok) return { ok: false, err: `HTTP ${head.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, err: String((e as Error).message ?? e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const events: EventRow[] = [];

  const { data: runRow, error: runErr } = await admin
    .from("integrity_check_runs")
    .insert({ status: "running" })
    .select("id")
    .single();
  if (runErr) {
    console.error("[integrity] run insert failed", runErr);
    return new Response(JSON.stringify({ error: runErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const runId = runRow.id as string;
  console.log(`[integrity] run ${runId} started`);

  const log = (e: EventRow) => {
    events.push({ ...e, run_id: runId });
    console.log(
      `[integrity] ${e.action} entity=${e.entity} id=${e.entity_id} bucket=${e.bucket ?? "-"} ` +
        `owner=${e.owner_user_id ?? "-"} patient=${e.patient_id ?? "-"} ` +
        `old=${e.old_path ?? "-"} new=${e.new_path ?? "-"} visibility=${e.visibility_check ?? "-"}` +
        (e.visibility_error ? ` err=${e.visibility_error}` : ""),
    );
  };

  const counters = {
    scanned_records: 0,
    scanned_symptom_photos: 0,
    missing_health_files: 0,
    missing_symptom_files: 0,
    repaired_health_files: 0,
    repaired_symptom_files: 0,
    orphan_health_objects: 0,
    orphan_symptom_objects: 0,
  };

  try {
    // -------------------- health_records --------------------
    const { data: hrs } = await admin
      .from("health_records")
      .select("id, file_path, file_name, patient_id, patients(user_id)")
      .not("file_path", "is", null);

    const validHealthPaths = new Set<string>();

    for (const r of hrs ?? []) {
      counters.scanned_records++;
      const ownerId = (r as any).patients?.user_id as string | undefined;
      if (!ownerId || !r.file_path) continue;

      const exists = await objectExists(admin, "health-records", r.file_path);
      if (exists) {
        validHealthPaths.add(r.file_path);
        continue;
      }

      counters.missing_health_files++;
      const candidate = r.file_name
        ? await findUniqueMatch(admin, "health-records", ownerId, r.file_name)
        : null;

      if (candidate && candidate !== r.file_path) {
        const { error: upErr } = await admin
          .from("health_records")
          .update({ file_path: candidate, extraction_status: "path_repaired" })
          .eq("id", r.id);
        if (upErr) {
          log({
            run_id: runId, entity: "health_records", entity_id: r.id, action: "repair_failed",
            patient_id: r.patient_id, owner_user_id: ownerId, bucket: "health-records",
            old_path: r.file_path, new_path: candidate,
            notes: { db_error: upErr.message },
          });
        } else {
          const vis = await verifyVisibility(admin, "health-records", candidate);
          counters.repaired_health_files++;
          validHealthPaths.add(candidate);
          log({
            run_id: runId, entity: "health_records", entity_id: r.id, action: "repaired",
            patient_id: r.patient_id, owner_user_id: ownerId, bucket: "health-records",
            old_path: r.file_path, new_path: candidate,
            visibility_check: vis.ok ? "ok" : "failed",
            visibility_error: vis.ok ? null : vis.err,
          });
        }
        continue;
      }

      await admin
        .from("health_records")
        .update({ extraction_status: "missing_file" })
        .eq("id", r.id);
      log({
        run_id: runId, entity: "health_records", entity_id: r.id, action: "flagged_missing",
        patient_id: r.patient_id, owner_user_id: ownerId, bucket: "health-records",
        old_path: r.file_path, visibility_check: "skipped",
      });
    }

    // -------------------- symptom_logs --------------------
    const { data: sls } = await admin
      .from("symptom_logs")
      .select("id, photo_path, patient_id, patients(user_id)")
      .not("photo_path", "is", null);

    const validSymptomPaths = new Set<string>();

    for (const r of sls ?? []) {
      counters.scanned_symptom_photos++;
      const ownerId = (r as any).patients?.user_id as string | undefined;
      if (!ownerId || !r.photo_path) continue;

      const exists = await objectExists(admin, "symptom-photos", r.photo_path);
      if (exists) {
        validSymptomPaths.add(r.photo_path);
        continue;
      }

      counters.missing_symptom_files++;
      const fname = r.photo_path.split("/").pop() ?? "";
      const candidate = fname ? await findUniqueMatch(admin, "symptom-photos", ownerId, fname) : null;

      if (candidate && candidate !== r.photo_path) {
        const { error: upErr } = await admin
          .from("symptom_logs")
          .update({ photo_path: candidate })
          .eq("id", r.id);
        if (upErr) {
          log({
            run_id: runId, entity: "symptom_logs", entity_id: r.id, action: "repair_failed",
            patient_id: r.patient_id, owner_user_id: ownerId, bucket: "symptom-photos",
            old_path: r.photo_path, new_path: candidate,
            notes: { db_error: upErr.message },
          });
        } else {
          const vis = await verifyVisibility(admin, "symptom-photos", candidate);
          counters.repaired_symptom_files++;
          validSymptomPaths.add(candidate);
          log({
            run_id: runId, entity: "symptom_logs", entity_id: r.id, action: "repaired",
            patient_id: r.patient_id, owner_user_id: ownerId, bucket: "symptom-photos",
            old_path: r.photo_path, new_path: candidate,
            visibility_check: vis.ok ? "ok" : "failed",
            visibility_error: vis.ok ? null : vis.err,
          });
        }
        continue;
      }

      log({
        run_id: runId, entity: "symptom_logs", entity_id: r.id, action: "flagged_missing",
        patient_id: r.patient_id, owner_user_id: ownerId, bucket: "symptom-photos",
        old_path: r.photo_path, visibility_check: "skipped",
      });
    }

    // -------------------- orphan storage objects (log only) --------------------
    const listAll = async (bucket: string): Promise<string[]> => {
      const out: string[] = [];
      const { data: rootFolders } = await admin.storage.from(bucket).list("", { limit: 1000 });
      for (const folder of rootFolders ?? []) {
        if (folder.id !== null) { out.push(folder.name); continue; }
        const { data: files } = await admin.storage.from(bucket).list(folder.name, { limit: 1000 });
        for (const f of files ?? []) out.push(`${folder.name}/${f.name}`);
      }
      return out;
    };

    for (const p of await listAll("health-records")) {
      if (!validHealthPaths.has(p)) {
        counters.orphan_health_objects++;
        log({
          run_id: runId, entity: "storage:health-records", entity_id: p, action: "orphan_object",
          bucket: "health-records", old_path: p, visibility_check: "skipped",
        });
      }
    }
    for (const p of await listAll("symptom-photos")) {
      if (!validSymptomPaths.has(p)) {
        counters.orphan_symptom_objects++;
        log({
          run_id: runId, entity: "storage:symptom-photos", entity_id: p, action: "orphan_object",
          bucket: "symptom-photos", old_path: p, visibility_check: "skipped",
        });
      }
    }

    // Persist events in chunks
    for (let i = 0; i < events.length; i += 500) {
      const chunk = events.slice(i, i + 500);
      const { error: evErr } = await admin.from("integrity_check_events").insert(chunk);
      if (evErr) console.error("[integrity] event insert error", evErr);
    }

    await admin
      .from("integrity_check_runs")
      .update({
        ...counters,
        details: { event_count: events.length },
        finished_at: new Date().toISOString(),
        status: "ok",
      })
      .eq("id", runId);

    console.log(`[integrity] run ${runId} ok`, counters);
    return new Response(
      JSON.stringify({ ok: true, run_id: runId, ...counters, event_count: events.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[integrity] run failed", e);
    await admin
      .from("integrity_check_runs")
      .update({
        status: "error",
        error: String((e as Error).message ?? e),
        finished_at: new Date().toISOString(),
        ...counters,
      })
      .eq("id", runId);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
