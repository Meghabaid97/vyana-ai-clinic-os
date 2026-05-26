// Scoring + normalization for Rx extraction eval.
// Pure functions, no I/O.

export type Frequency =
  | "once_daily" | "twice_daily" | "thrice_daily" | "four_times_daily"
  | "as_needed" | "at_bedtime" | "weekly" | "unknown";

export interface TruthMed {
  name: string;
  name_aliases?: string[];
  dosage?: string | null;
  frequency: Frequency;
  duration?: string | null;
}

export interface PredMed {
  name: string;
  brand_name?: string | null;
  dosage?: string | null;
  frequency?: string | null;
  confidence?: "high" | "medium" | "low" | "illegible";
  possible_alternatives?: string[];
}

export const normName = (s: string | null | undefined): string =>
  (s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(tab|tablet|cap|capsule|syr|syrup|inj|injection|susp)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const normDosage = (s: string | null | undefined): string => {
  if (!s) return "";
  // 500 mg -> 500mg ; 1 g -> 1000mg ; 10 ml -> 10ml
  let v = s.toLowerCase().replace(/\s+/g, "");
  v = v.replace(/(\d+(?:\.\d+)?)g\b/g, (_m, n) => `${parseFloat(n) * 1000}mg`);
  v = v.replace(/(\d+(?:\.\d+)?)mcg\b/g, (_m, n) => `${parseFloat(n) / 1000}mg`);
  return v;
};

export const normFrequency = (s: string | null | undefined): Frequency => {
  if (!s) return "unknown";
  const v = s.toLowerCase().trim();
  if (["once_daily", "od", "qd", "1-0-0", "0-0-1", "0-1-0"].includes(v)) return "once_daily";
  if (["twice_daily", "bd", "bid", "1-0-1"].includes(v)) return "twice_daily";
  if (["thrice_daily", "tds", "tid", "1-1-1"].includes(v)) return "thrice_daily";
  if (["four_times_daily", "qid", "qds"].includes(v)) return "four_times_daily";
  if (["as_needed", "sos", "prn"].includes(v)) return "as_needed";
  if (["at_bedtime", "hs", "qhs"].includes(v)) return "at_bedtime";
  if (v === "weekly") return "weekly";
  return "unknown";
};

const nameMatches = (pred: PredMed, truth: TruthMed): boolean => {
  const candidates = new Set<string>([
    normName(pred.name),
    normName(pred.brand_name),
    ...(pred.possible_alternatives ?? []).map(normName),
  ].filter(Boolean));
  const accepted = new Set<string>([
    normName(truth.name),
    ...(truth.name_aliases ?? []).map(normName),
  ].filter(Boolean));
  for (const c of candidates) if (accepted.has(c)) return true;
  return false;
};

export interface PairScore {
  truth: TruthMed;
  pred: PredMed | null;
  drug_name_correct: boolean;
  dosage_correct: boolean;
  frequency_correct: boolean;
  full_row_correct: boolean;
}

export interface SampleScore {
  id: string;
  pairs: PairScore[];
  hallucinated: PredMed[]; // pred meds not matched to any truth
  medication_recall: number;
  medication_precision: number;
}

export function scoreSample(
  id: string,
  truths: TruthMed[],
  preds: PredMed[],
): SampleScore {
  const used = new Set<number>();
  const pairs: PairScore[] = [];

  for (const t of truths) {
    let matchedIdx = -1;
    for (let i = 0; i < preds.length; i++) {
      if (used.has(i)) continue;
      if (nameMatches(preds[i], t)) { matchedIdx = i; break; }
    }
    const pred = matchedIdx >= 0 ? preds[matchedIdx] : null;
    if (matchedIdx >= 0) used.add(matchedIdx);

    const drug_name_correct = !!pred;
    const dosage_correct = !!pred && normDosage(pred.dosage) === normDosage(t.dosage);
    const frequency_correct = !!pred && normFrequency(pred.frequency) === t.frequency;
    pairs.push({
      truth: t,
      pred,
      drug_name_correct,
      dosage_correct,
      frequency_correct,
      full_row_correct: drug_name_correct && dosage_correct && frequency_correct,
    });
  }

  const hallucinated = preds.filter((_, i) => !used.has(i));
  const matched = pairs.filter(p => p.drug_name_correct).length;
  return {
    id,
    pairs,
    hallucinated,
    medication_recall: truths.length ? matched / truths.length : 1,
    medication_precision: preds.length ? matched / preds.length : 1,
  };
}

export interface Aggregate {
  samples: number;
  truth_meds: number;
  pred_meds: number;
  hallucinated_meds: number;
  drug_name_accuracy: number;
  dosage_accuracy: number;
  frequency_accuracy: number;
  full_row_accuracy_all: number;
  full_row_accuracy_committed: number; // excludes low/illegible confidence
  medication_recall: number;
  medication_precision: number;
  calibration_high: number; // P(correct | pred.confidence == 'high')
  by_language: Record<string, { samples: number; full_row_accuracy: number }>;
  by_handwriting: Record<string, { samples: number; full_row_accuracy: number }>;
}

export function aggregate(
  scored: { score: SampleScore; truth: { language: string[]; handwriting?: string } }[],
): Aggregate {
  let truthMeds = 0, predMeds = 0, halluc = 0;
  let nameOK = 0, dosOK = 0, freqOK = 0, fullOK = 0, fullOKCommitted = 0, committed = 0;
  let highTotal = 0, highCorrect = 0;
  let recallSum = 0, precSum = 0;

  const byLang: Record<string, { n: number; ok: number; tot: number }> = {};
  const byHw: Record<string, { n: number; ok: number; tot: number }> = {};

  for (const { score, truth } of scored) {
    truthMeds += score.pairs.length;
    predMeds += score.pairs.filter(p => p.pred).length + score.hallucinated.length;
    halluc += score.hallucinated.length;
    recallSum += score.medication_recall;
    precSum += score.medication_precision;

    for (const p of score.pairs) {
      if (p.drug_name_correct) nameOK++;
      if (p.dosage_correct) dosOK++;
      if (p.frequency_correct) freqOK++;
      if (p.full_row_correct) fullOK++;

      const conf = p.pred?.confidence ?? "illegible";
      if (conf === "high" || conf === "medium") {
        committed++;
        if (p.full_row_correct) fullOKCommitted++;
      }
      if (conf === "high") {
        highTotal++;
        if (p.full_row_correct) highCorrect++;
      }
    }

    const sampleFull = score.pairs.length
      ? score.pairs.filter(p => p.full_row_correct).length / score.pairs.length
      : 1;
    for (const lang of truth.language) {
      const k = lang;
      byLang[k] ??= { n: 0, ok: 0, tot: 0 };
      byLang[k].n++; byLang[k].ok += sampleFull;
    }
    const hw = truth.handwriting ?? "unknown";
    byHw[hw] ??= { n: 0, ok: 0, tot: 0 };
    byHw[hw].n++; byHw[hw].ok += sampleFull;
  }

  const n = scored.length || 1;
  const safe = (a: number, b: number) => (b ? a / b : 0);

  return {
    samples: scored.length,
    truth_meds: truthMeds,
    pred_meds: predMeds,
    hallucinated_meds: halluc,
    drug_name_accuracy: safe(nameOK, truthMeds),
    dosage_accuracy: safe(dosOK, truthMeds),
    frequency_accuracy: safe(freqOK, truthMeds),
    full_row_accuracy_all: safe(fullOK, truthMeds),
    full_row_accuracy_committed: safe(fullOKCommitted, committed),
    medication_recall: recallSum / n,
    medication_precision: precSum / n,
    calibration_high: safe(highCorrect, highTotal),
    by_language: Object.fromEntries(
      Object.entries(byLang).map(([k, v]) => [k, { samples: v.n, full_row_accuracy: v.ok / v.n }])
    ),
    by_handwriting: Object.fromEntries(
      Object.entries(byHw).map(([k, v]) => [k, { samples: v.n, full_row_accuracy: v.ok / v.n }])
    ),
  };
}
