# Rx OCR Eval Harness

Measures real-world extraction accuracy of `interpret-prescription` on Indian handwritten prescriptions.

## What it measures

For each labeled prescription image, we compare model output vs ground truth across three fields per medication:

- **drug_name_acc** — drug name matched (normalized, brand⇄generic allowed)
- **dosage_acc** — dosage matched (e.g. `500mg` == `500 mg`)
- **frequency_acc** — frequency matched against canonical buckets (`once_daily`, `twice_daily`, ...)

We also report:

- **medication_recall** — fraction of ground-truth meds the model surfaced at all
- **medication_precision** — fraction of model meds that are real (not hallucinated)
- **full_row_accuracy** — name + dosage + frequency all correct in the same row
- **calibration** — when model says `high` confidence, how often is it right?

The headline number is **full_row_accuracy on `high`+`medium` confidence rows**. Anything `low`/`illegible` is excluded because the UI already flags those for human review — counting them against us punishes the system for being honest.

## Layout

```
eval/rx-ocr/
  dataset/
    001/
      image.jpg
      truth.json
    002/
      image.jpg
      truth.json
    ...
  results/
    run-2026-05-26T10-00.json
    run-2026-05-26T10-00.md
  run.ts            # runs the eval
  score.ts          # scoring + normalization
  truth.schema.json # ground-truth JSON schema
```

## Building the test set

Target: **200 real Indian Rx images**, stratified:

- 60% handwritten, 30% mixed print+handwritten, 10% fully printed
- Language mix: 50% English, 20% Hindi+English, 10% Tamil+English, 10% Telugu+English, 10% Bengali+English
- Quality mix: 70% phone-camera clear, 20% creased/folded, 10% poor lighting

For each image, create `dataset/<id>/truth.json` following `truth.schema.json`. Label conservatively — if you can't read it, don't put it in the truth set.

## Running

```bash
# 1. Export your dev login JWT (the edge function requires auth)
export VYANA_AUTH_TOKEN="ey..."

# 2. Run
bun run eval/rx-ocr/run.ts

# Or a single sample for debugging
bun run eval/rx-ocr/run.ts --only 001
```

Results are written to `results/run-<timestamp>.{json,md}`. The markdown file is the one to put in front of investors.

## Defensible number

Once you have ≥150 scored prescriptions, the headline metric in the latest `results/*.md` file is the number you can defend. Until then, **do not put an accuracy percentage in the deck.**
