// Storage integrity check: scans DB rows for storage paths that no longer
// exist, attempts safe auto-repair (only when a unique matching file is found
// for the same owner), and logs orphan storage objects. NEVER deletes rows
// or storage files.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Detail = { table: string; id: string; note: string; from?: string; to?: string };

async function objectExists(admin: any, bucket: string, path: string): Promise<boolean> {
  if (!path) return false;
  const slash = path.lastIndexOf("/");
  const dir = slash >= 0 ? path.slice(0, slash) : "";
  const name = slash >= 0 ? path.slice(slash + 1) : path;
  const { data, error } = await admin.storage.from(bucket).list(dir, {
    limit: 1000,
    search: name,
  });
  if (error) return false;
  return !!data?.some((o: any) => o.name === name);
}

async function findUniqueMatch(
  admin: any,
  bucket: string,
  ownerId: string,
  fileName: string,
): Promise<string | null> {
  // Look under the owner's folder (owner_id/*) for a file with matching name.
  const { data, error } = await admin.storage.from(bucket).list(ownerId, {
    limit: 1000,
    search: fileName,
  });
  if (error || !data) return null;
  const matches = data.filter((o: any) => o.name === fileName);
  if (matches.length === 1) return `${ownerId}/${fileName}`;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const details: Detail[] = [];

  // Create run row
  const { data: runRow, error: runErr } = await admin
    .from("integrity_check_runs")
    .insert({ status: "running" })
    .select("id")
    .single();
  if (runErr) {
    return new Response(JSON.stringify({ error: runErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const runId = runRow.id;

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
    // ---------- health_records ----------
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
      // Try safe auto-repair: unique file match under owner's folder
      const repaired = r.file_name
        ? await findUniqueMatch(admin, "health-records", ownerId, r.file_name)
        : null;

      if (repaired && repaired !== r.file_path) {
        const { error: upErr } = await admin
          .from("health_records")
          .update({ file_path: repaired, extraction_status: "path_repaired" })
          .eq("id", r.id);
        if (!upErr) {
          counters.repaired_health_files++;
          validHealthPaths.add(repaired);
          details.push({ table: "health_records", id: r.id, note: "repaired", from: r.file_path, to: repaired });
          continue;
        }
      }

      // Non-destructive: flag row for review
      await admin
        .from("health_records")
        .update({ extraction_status: "missing_file" })
        .eq("id", r.id);
      details.push({ table: "health_records", id: r.id, note: "missing_file", from: r.file_path });
    }

    // ---------- symptom_logs ----------
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
      const repaired = fname ? await findUniqueMatch(admin, "symptom-photos", ownerId, fname) : null;
      if (repaired && repaired !== r.photo_path) {
        const { error: upErr } = await admin
          .from("symptom_logs")
          .update({ photo_path: repaired })
          .eq("id", r.id);
        if (!upErr) {
          counters.repaired_symptom_files++;
          validSymptomPaths.add(repaired);
          details.push({ table: "symptom_logs", id: r.id, note: "repaired", from: r.photo_path, to: repaired });
          continue;
        }
      }
      details.push({ table: "symptom_logs", id: r.id, note: "missing_file", from: r.photo_path });
    }

    // ---------- orphan storage objects (log only, never delete) ----------
    const listAll = async (bucket: string): Promise<string[]> => {
      const out: string[] = [];
      const { data: rootFolders } = await admin.storage.from(bucket).list("", { limit: 1000 });
      for (const folder of rootFolders ?? []) {
        if (folder.id !== null) {
          // File at root
          out.push(folder.name);
          continue;
        }
        const { data: files } = await admin.storage
          .from(bucket)
          .list(folder.name, { limit: 1000 });
        for (const f of files ?? []) out.push(`${folder.name}/${f.name}`);
      }
      return out;
    };

    const hAll = await listAll("health-records");
    for (const p of hAll) {
      if (!validHealthPaths.has(p)) {
        counters.orphan_health_objects++;
        details.push({ table: "storage:health-records", id: p, note: "orphan_object" });
      }
    }
    const sAll = await listAll("symptom-photos");
    for (const p of sAll) {
      if (!validSymptomPaths.has(p)) {
        counters.orphan_symptom_objects++;
        details.push({ table: "storage:symptom-photos", id: p, note: "orphan_object" });
      }
    }

    await admin
      .from("integrity_check_runs")
      .update({
        ...counters,
        details: { items: details.slice(0, 500), truncated: details.length > 500 },
        finished_at: new Date().toISOString(),
        status: "ok",
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({ ok: true, run_id: runId, ...counters, orphan_examples: details.slice(0, 20) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
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
