// Runs the Rx OCR eval against the deployed `interpret-prescription` edge function.
// Usage:
//   export VYANA_AUTH_TOKEN="<JWT from an authenticated session>"
//   bun run eval/rx-ocr/run.ts            # all samples
//   bun run eval/rx-ocr/run.ts --only 001 # one sample
//
// Optional env:
//   SUPABASE_URL        defaults to project URL
//   SUPABASE_ANON_KEY   defaults to project anon key

import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { aggregate, scoreSample, type PredMed, type TruthMed } from "./score.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATASET = join(HERE, "dataset");
const RESULTS = join(HERE, "results");

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? "https://gnfaxcdapizhfqloiajn.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZmF4Y2RhcGl6aGZxbG9pYWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTQ2NjcsImV4cCI6MjA3OTA3MDY2N30.k_odpJ27FfLU4fBl-01ilOCt1Jg-2Y4blvNJFuJVoq4";
const AUTH = process.env.VYANA_AUTH_TOKEN;

if (!AUTH) {
  console.error("✖ VYANA_AUTH_TOKEN is required. Sign in to the app, then in devtools run:");
  console.error("  copy((await supabase.auth.getSession()).data.session.access_token)");
  process.exit(1);
}

const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1]
  ?? (process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null);

interface Truth {
  id: string;
  image: string;
  language: string[];
  handwriting?: string;
  quality?: string;
  medications: TruthMed[];
}

async function listSamples(): Promise<string[]> {
  try {
    const entries = await readdir(DATASET);
    const dirs: string[] = [];
    for (const e of entries) {
      const s = await stat(join(DATASET, e)).catch(() => null);
      if (s?.isDirectory()) dirs.push(e);
    }
    return dirs.sort();
  } catch {
    return [];
  }
}

function mimeFor(name: string): string {
  const lc = name.toLowerCase();
  if (lc.endsWith(".png")) return "image/png";
  if (lc.endsWith(".webp")) return "image/webp";
  if (lc.endsWith(".pdf")) return "application/pdf";
  return "image/jpeg";
}

async function loadTruth(id: string): Promise<Truth> {
  const raw = await readFile(join(DATASET, id, "truth.json"), "utf8");
  return JSON.parse(raw);
}

async function loadImageDataUrl(id: string, image: string): Promise<string> {
  const bytes = await readFile(join(DATASET, id, image));
  const b64 = bytes.toString("base64");
  return `data:${mimeFor(image)};base64,${b64}`;
}

async function callInterpret(imageData: string): Promise<PredMed[]> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/interpret-prescription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${AUTH}`,
    },
    body: JSON.stringify({ imageData, sourceType: "photo" }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`interpret-prescription ${res.status}: ${t}`);
  }
  const json = await res.json();
  return (json.medications ?? []) as PredMed[];
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function renderMarkdown(agg: ReturnType<typeof aggregate>, perSample: unknown[]): string {
  const headline = agg.full_row_accuracy_committed;
  const lines: string[] = [];
  lines.push(`# Rx OCR Eval — ${new Date().toISOString()}`);
  lines.push("");
  lines.push(`**Headline: ${fmtPct(headline)} full-row accuracy on committed extractions**`);
  lines.push("");
  lines.push(`> Full-row = drug name + dosage + frequency all correct. Committed = model returned`);
  lines.push(`> high or medium confidence. Low/illegible rows are excluded because the UI flags`);
  lines.push(`> them for human verification before they enter the patient record.`);
  lines.push("");
  lines.push(`## Corpus`);
  lines.push(`- Samples: **${agg.samples}**`);
  lines.push(`- Ground-truth medications: ${agg.truth_meds}`);
  lines.push(`- Model-predicted medications: ${agg.pred_meds}`);
  lines.push(`- Hallucinated medications (no truth match): ${agg.hallucinated_meds}`);
  lines.push("");
  lines.push(`## Field-level accuracy (over all truth meds)`);
  lines.push(`| Field | Accuracy |`);
  lines.push(`|---|---|`);
  lines.push(`| Drug name | ${fmtPct(agg.drug_name_accuracy)} |`);
  lines.push(`| Dosage | ${fmtPct(agg.dosage_accuracy)} |`);
  lines.push(`| Frequency | ${fmtPct(agg.frequency_accuracy)} |`);
  lines.push(`| **Full row (all)** | **${fmtPct(agg.full_row_accuracy_all)}** |`);
  lines.push(`| **Full row (committed only)** | **${fmtPct(agg.full_row_accuracy_committed)}** |`);
  lines.push("");
  lines.push(`## Retrieval`);
  lines.push(`- Recall (avg per sample): ${fmtPct(agg.medication_recall)}`);
  lines.push(`- Precision (avg per sample): ${fmtPct(agg.medication_precision)}`);
  lines.push("");
  lines.push(`## Confidence calibration`);
  lines.push(`When the model marks a row as **high** confidence, it is fully correct ${fmtPct(agg.calibration_high)} of the time.`);
  lines.push("");
  lines.push(`## By handwriting type`);
  lines.push(`| Type | Samples | Full-row accuracy |`);
  lines.push(`|---|---|---|`);
  for (const [k, v] of Object.entries(agg.by_handwriting)) {
    lines.push(`| ${k} | ${v.samples} | ${fmtPct(v.full_row_accuracy)} |`);
  }
  lines.push("");
  lines.push(`## By language`);
  lines.push(`| Language | Samples | Full-row accuracy |`);
  lines.push(`|---|---|---|`);
  for (const [k, v] of Object.entries(agg.by_language)) {
    lines.push(`| ${k} | ${v.samples} | ${fmtPct(v.full_row_accuracy)} |`);
  }
  lines.push("");
  lines.push(`## Raw per-sample`);
  lines.push("See companion `*.json` for per-row diffs.");
  return lines.join("\n");
}

async function main() {
  await mkdir(RESULTS, { recursive: true });
  let ids = await listSamples();
  if (onlyArg) ids = ids.filter((i) => i === onlyArg);
  if (!ids.length) {
    console.error(`✖ No samples found in ${DATASET}.`);
    console.error(`  Create dataset/<id>/{image.jpg, truth.json} (see truth.schema.json).`);
    process.exit(1);
  }

  console.log(`Running ${ids.length} sample(s) against ${SUPABASE_URL}`);
  const scored: Parameters<typeof aggregate>[0] = [];
  const perSample: unknown[] = [];

  for (const id of ids) {
    try {
      const truth = await loadTruth(id);
      const dataUrl = await loadImageDataUrl(id, truth.image);
      process.stdout.write(`  ${id} ... `);
      const t0 = Date.now();
      const preds = await callInterpret(dataUrl);
      const dt = Date.now() - t0;
      const score = scoreSample(id, truth.medications, preds);
      scored.push({ score, truth });
      perSample.push({ id, latency_ms: dt, score, preds });
      const full = score.pairs.filter((p) => p.full_row_correct).length;
      console.log(
        `${full}/${score.pairs.length} full | recall ${(score.medication_recall * 100).toFixed(0)}% | ${dt}ms`,
      );
    } catch (e) {
      console.log(`ERROR ${(e as Error).message}`);
      perSample.push({ id, error: (e as Error).message });
    }
  }

  const agg = aggregate(scored);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const jsonPath = join(RESULTS, `run-${stamp}.json`);
  const mdPath = join(RESULTS, `run-${stamp}.md`);
  await writeFile(jsonPath, JSON.stringify({ aggregate: agg, perSample }, null, 2));
  await writeFile(mdPath, renderMarkdown(agg, perSample));

  console.log("");
  console.log(`Headline: ${(agg.full_row_accuracy_committed * 100).toFixed(1)}% full-row accuracy (committed rows)`);
  console.log(`         ${(agg.drug_name_accuracy * 100).toFixed(1)}% drug-name | ${(agg.dosage_accuracy * 100).toFixed(1)}% dosage | ${(agg.frequency_accuracy * 100).toFixed(1)}% frequency`);
  console.log(`Reports: ${mdPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
