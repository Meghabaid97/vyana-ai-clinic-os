/**
 * Clinical Risk Scoring Engine
 * Rule-based detectors using real clinical parameters and thresholds.
 * Sources: ACC/AHA ASCVD guidelines, ADA diabetes standards, KDIGO CKD staging,
 *          ATA thyroid guidelines, standard clinical reference ranges.
 *
 * DISCLAIMER: For informational purposes only. Not a substitute for clinical judgment.
 */

type VitalsMap = Record<string, number | null>;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RiskScore {
  id: string;
  title: string;
  category: string;
  score: number | null;          // 0-100 or null if insufficient data
  level: "low" | "moderate" | "high" | "very-high" | "insufficient";
  label: string;                 // human-readable level
  detail: string;                // clinical explanation
  inputs: { name: string; value: string; status: "normal" | "warning" | "critical" | "missing" }[];
  recommendations: string[];
}

export interface MedicationEffect {
  medication: string;
  expectedEffect: string;
  affectedVitals: string[];
  direction: "decrease" | "increase" | "stabilize";
  assessment: "responding" | "not-responding" | "insufficient-data";
  detail: string;
}

export interface AdherenceSignal {
  medication: string;
  signal: "good" | "poor" | "uncertain";
  reasoning: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const has = (v: VitalsMap, ...keys: string[]): boolean =>
  keys.every(k => v[k] !== null && v[k] !== undefined);

const val = (v: VitalsMap, key: string): number => (v[key] as number) ?? 0;

// ─── 1. ASCVD 10-Year Risk (Pooled Cohort Equations — simplified) ────────────

export function computeASCVD(
  vitals: VitalsMap,
  age: number | null,
  isMale: boolean = true,
  isSmoker: boolean = false,
  isDiabetic: boolean = false,
  onBPMeds: boolean = false,
): RiskScore {
  const inputs: RiskScore["inputs"] = [];
  const push = (name: string, key: string, unit: string) => {
    const v = vitals[key];
    inputs.push({
      name: `${name}`,
      value: v != null ? `${v} ${unit}` : "—",
      status: v != null ? "normal" : "missing",
    });
  };

  push("Age", "__age", "yrs");
  push("Total Cholesterol", "total_cholesterol", "mg/dL");
  push("HDL", "hdl", "mg/dL");
  push("Systolic BP", "bp_systolic", "mmHg");

  const effectiveAge = age ?? (vitals.__age as number | null);

  if (
    effectiveAge == null ||
    !has(vitals, "total_cholesterol", "hdl", "bp_systolic")
  ) {
    return {
      id: "ascvd",
      title: "ASCVD 10-Year Risk",
      category: "Cardiovascular",
      score: null,
      level: "insufficient",
      label: "Insufficient data",
      detail: "Need age, total cholesterol, HDL, and systolic BP to calculate.",
      inputs,
      recommendations: ["Complete a lipid panel and blood pressure measurement."],
    };
  }

  const tc = val(vitals, "total_cholesterol");
  const hdl = val(vitals, "hdl");
  const sbp = val(vitals, "bp_systolic");

  // Simplified risk estimation (directional, not exact PCE)
  // Based on relative contribution weights from pooled cohort equations
  let risk = 0;

  // Age contribution (major factor)
  if (effectiveAge < 40) risk += 1;
  else if (effectiveAge < 50) risk += 4;
  else if (effectiveAge < 60) risk += 8;
  else if (effectiveAge < 70) risk += 14;
  else risk += 20;

  // Cholesterol ratio
  const ratio = tc / Math.max(hdl, 1);
  if (ratio > 6) risk += 8;
  else if (ratio > 5) risk += 5;
  else if (ratio > 4) risk += 3;
  else risk += 1;

  // Systolic BP
  if (sbp >= 180) risk += 10;
  else if (sbp >= 160) risk += 7;
  else if (sbp >= 140) risk += 4;
  else if (sbp >= 130) risk += 2;
  else risk += 0;

  if (onBPMeds) risk += 2;
  if (isSmoker) risk += 5;
  if (isDiabetic) risk += 4;
  if (!isMale) risk = Math.round(risk * 0.7); // Women have lower baseline risk

  // LDL bonus
  if (has(vitals, "ldl")) {
    const ldl = val(vitals, "ldl");
    if (ldl > 190) risk += 6;
    else if (ldl > 160) risk += 3;
    else if (ldl > 130) risk += 1;
    inputs.push({ name: "LDL", value: `${ldl} mg/dL`, status: ldl > 130 ? "warning" : "normal" });
  }

  // Triglycerides
  if (has(vitals, "triglycerides")) {
    const tg = val(vitals, "triglycerides");
    if (tg > 500) risk += 4;
    else if (tg > 200) risk += 2;
    inputs.push({ name: "Triglycerides", value: `${tg} mg/dL`, status: tg > 150 ? "warning" : "normal" });
  }

  // Cap at reasonable range
  risk = Math.min(Math.max(risk, 1), 50);

  // Mark input statuses
  inputs[0] = { ...inputs[0], value: `${effectiveAge} yrs`, status: effectiveAge > 55 ? "warning" : "normal" };
  inputs[1] = { ...inputs[1], status: tc > 200 ? "warning" : "normal" };
  inputs[2] = { ...inputs[2], status: hdl < 40 ? "warning" : "normal" };
  inputs[3] = { ...inputs[3], status: sbp > 130 ? "warning" : "normal" };

  let level: RiskScore["level"];
  let label: string;
  const recs: string[] = [];

  if (risk < 5) {
    level = "low"; label = "Low risk (<5%)";
    recs.push("Continue healthy lifestyle habits.");
  } else if (risk < 7.5) {
    level = "moderate"; label = "Borderline (5–7.5%)";
    recs.push("Consider lifestyle modifications: diet, exercise.");
    recs.push("Discuss statin therapy with your doctor if additional risk factors present.");
  } else if (risk < 20) {
    level = "high"; label = "Intermediate (7.5–20%)";
    recs.push("Moderate-intensity statin therapy may be indicated.");
    recs.push("Target LDL <100 mg/dL.");
    recs.push("Monitor BP closely.");
  } else {
    level = "very-high"; label = "High risk (≥20%)";
    recs.push("High-intensity statin therapy strongly recommended.");
    recs.push("Target LDL <70 mg/dL.");
    recs.push("Consider aspirin therapy if bleeding risk is acceptable.");
    recs.push("Aggressive BP management to <130/80 mmHg.");
  }

  return {
    id: "ascvd",
    title: "ASCVD 10-Year Risk",
    category: "Cardiovascular",
    score: risk,
    level,
    label,
    detail: `Estimated 10-year atherosclerotic cardiovascular disease risk: ~${risk}%. Based on age, cholesterol, BP, and risk factors.`,
    inputs,
    recommendations: recs,
  };
}

// ─── 2. Diabetes Progression ─────────────────────────────────────────────────

export function computeDiabetesRisk(vitals: VitalsMap, vitalHistory: Array<{ vitals: VitalsMap; recorded_at: string }>): RiskScore {
  const inputs: RiskScore["inputs"] = [];

  const hba1c = vitals.hba1c;
  const fbs = vitals.fasting_blood_sugar;
  const ppg = vitals.post_prandial_glucose;

  inputs.push({ name: "HbA1c", value: hba1c != null ? `${hba1c}%` : "—", status: hba1c != null ? (hba1c > 6.5 ? "critical" : hba1c > 5.7 ? "warning" : "normal") : "missing" });
  inputs.push({ name: "Fasting Glucose", value: fbs != null ? `${fbs} mg/dL` : "—", status: fbs != null ? (fbs > 126 ? "critical" : fbs > 100 ? "warning" : "normal") : "missing" });
  inputs.push({ name: "Post-Prandial", value: ppg != null ? `${ppg} mg/dL` : "—", status: ppg != null ? (ppg > 200 ? "critical" : ppg > 140 ? "warning" : "normal") : "missing" });

  if (hba1c == null && fbs == null) {
    return {
      id: "diabetes", title: "Diabetes Progression", category: "Metabolic",
      score: null, level: "insufficient", label: "Insufficient data",
      detail: "Need HbA1c or fasting glucose to assess.", inputs,
      recommendations: ["Get a fasting blood glucose and HbA1c test."],
    };
  }

  // Trend detection
  const hba1cHistory = vitalHistory
    .filter(h => h.vitals.hba1c != null)
    .map(h => ({ value: h.vitals.hba1c as number, date: h.recorded_at }));

  let trend = "stable";
  if (hba1cHistory.length >= 2) {
    const first = hba1cHistory[0].value;
    const last = hba1cHistory[hba1cHistory.length - 1].value;
    const diff = last - first;
    if (diff > 0.5) trend = "worsening";
    else if (diff < -0.3) trend = "improving";
  }

  let score = 0;
  let level: RiskScore["level"];
  let label: string;
  const recs: string[] = [];

  // Classification based on ADA standards
  const effectiveHbA1c = hba1c ?? (fbs != null ? (fbs > 126 ? 7.0 : fbs > 100 ? 6.0 : 5.2) : 5.2);

  if (effectiveHbA1c < 5.7) {
    score = 10; level = "low"; label = "Normal glycemia";
    recs.push("Maintain healthy diet and regular exercise.");
  } else if (effectiveHbA1c < 6.5) {
    score = 40; level = "moderate"; label = "Pre-diabetes";
    recs.push("Structured lifestyle intervention (diet + 150 min/week exercise).");
    recs.push("Consider metformin if BMI ≥35 or age <60.");
    recs.push("Recheck HbA1c in 3–6 months.");
  } else if (effectiveHbA1c < 8.0) {
    score = 65; level = "high"; label = "Diabetes (managed)";
    recs.push("Target HbA1c <7% for most adults.");
    recs.push("Review medication regimen adherence.");
    recs.push("Screen for complications: retinopathy, nephropathy, neuropathy.");
  } else {
    score = 90; level = "very-high"; label = "Diabetes (poorly controlled)";
    recs.push("Urgent medication review needed.");
    recs.push("Consider adding insulin or GLP-1 agonist.");
    recs.push("Screen for diabetic ketoacidosis signs.");
    recs.push("Monthly glucose monitoring recommended.");
  }

  if (trend === "worsening") {
    score = Math.min(score + 15, 100);
    recs.unshift("⚠ HbA1c trending upward — medication adjustment may be needed.");
  } else if (trend === "improving") {
    recs.unshift("✓ HbA1c trending downward — current management appears effective.");
  }

  // Post-prandial spikes
  if (ppg != null && ppg > 200) {
    recs.push("Post-meal glucose very high — consider mealtime insulin or acarbose.");
  }

  return {
    id: "diabetes", title: "Diabetes Progression", category: "Metabolic",
    score, level, label,
    detail: `HbA1c: ${hba1c != null ? hba1c + "%" : "not available"}. Trend: ${trend}. ${fbs != null ? `Fasting glucose: ${fbs} mg/dL.` : ""}`,
    inputs, recommendations: recs,
  };
}

// ─── 3. Kidney Function (eGFR + CKD Staging) ────────────────────────────────

export function computeKidneyRisk(vitals: VitalsMap, age: number | null, isMale: boolean = true): RiskScore {
  const inputs: RiskScore["inputs"] = [];

  const creatinine = vitals.creatinine;
  const bun = vitals.bun;
  const uricAcid = vitals.uric_acid;

  inputs.push({ name: "Creatinine", value: creatinine != null ? `${creatinine} mg/dL` : "—", status: creatinine != null ? (creatinine > 1.3 ? "warning" : "normal") : "missing" });
  inputs.push({ name: "BUN", value: bun != null ? `${bun} mg/dL` : "—", status: bun != null ? (bun > 20 ? "warning" : "normal") : "missing" });
  inputs.push({ name: "Uric Acid", value: uricAcid != null ? `${uricAcid} mg/dL` : "—", status: uricAcid != null ? (uricAcid > 7.2 ? "warning" : "normal") : "missing" });

  if (creatinine == null || age == null) {
    return {
      id: "kidney", title: "Kidney Function (eGFR)", category: "Kidney",
      score: null, level: "insufficient", label: "Insufficient data",
      detail: "Need serum creatinine and age to calculate eGFR.", inputs,
      recommendations: ["Get a serum creatinine test."],
    };
  }

  // CKD-EPI equation (2021, race-free)
  const cr = creatinine;
  let eGFR: number;

  if (isMale) {
    const kappa = 0.9;
    const alpha = cr <= kappa ? -0.302 : -1.200;
    eGFR = 142 * Math.pow(Math.min(cr / kappa, 1), alpha) * Math.pow(Math.max(cr / kappa, 1), -1.200) * Math.pow(0.9938, age);
  } else {
    const kappa = 0.7;
    const alpha = cr <= kappa ? -0.241 : -1.200;
    eGFR = 142 * Math.pow(Math.min(cr / kappa, 1), alpha) * Math.pow(Math.max(cr / kappa, 1), -1.200) * Math.pow(0.9938, age) * 1.012;
  }

  eGFR = Math.round(eGFR);
  inputs.push({ name: "eGFR (calculated)", value: `${eGFR} mL/min/1.73m²`, status: eGFR < 60 ? "critical" : eGFR < 90 ? "warning" : "normal" });

  let stage: string;
  let level: RiskScore["level"];
  let score: number;
  const recs: string[] = [];

  if (eGFR >= 90) {
    stage = "G1 — Normal"; level = "low"; score = 10;
    recs.push("Kidney function normal. Continue routine monitoring.");
  } else if (eGFR >= 60) {
    stage = "G2 — Mildly decreased"; level = "moderate"; score = 30;
    recs.push("Mild kidney function decline. Monitor annually.");
    recs.push("Control blood pressure to <130/80.");
  } else if (eGFR >= 45) {
    stage = "G3a — Mild-moderate decrease"; level = "moderate"; score = 50;
    recs.push("Refer to nephrologist for co-management.");
    recs.push("Avoid NSAIDs and nephrotoxic drugs.");
    recs.push("Monitor electrolytes and phosphate.");
  } else if (eGFR >= 30) {
    stage = "G3b — Moderate-severe decrease"; level = "high"; score = 65;
    recs.push("Active nephrology management needed.");
    recs.push("Strict BP and glucose control.");
    recs.push("Assess for anemia and bone disease.");
  } else if (eGFR >= 15) {
    stage = "G4 — Severely decreased"; level = "very-high"; score = 80;
    recs.push("Prepare for renal replacement therapy.");
    recs.push("Dietary protein restriction may be needed.");
    recs.push("Monthly monitoring recommended.");
  } else {
    stage = "G5 — Kidney failure"; level = "very-high"; score = 95;
    recs.push("Dialysis or transplant evaluation urgently needed.");
    recs.push("Strict fluid and dietary management.");
  }

  // BUN/Creatinine ratio for pre-renal assessment
  if (bun != null && creatinine > 0) {
    const ratio = bun / creatinine;
    if (ratio > 20) {
      recs.push(`BUN/Cr ratio elevated (${Math.round(ratio)}) — evaluate for dehydration or GI bleed.`);
    }
  }

  return {
    id: "kidney", title: "Kidney Function (eGFR)", category: "Kidney",
    score, level, label: `CKD Stage ${stage} — eGFR ${eGFR}`,
    detail: `Estimated GFR: ${eGFR} mL/min/1.73m². CKD Stage: ${stage}.`,
    inputs, recommendations: recs,
  };
}

// ─── 4. Thyroid Pattern Detection ────────────────────────────────────────────

export function computeThyroidRisk(vitals: VitalsMap): RiskScore {
  const inputs: RiskScore["inputs"] = [];

  const tsh = vitals.tsh;
  const t3 = vitals.t3;
  const t4 = vitals.t4;

  inputs.push({ name: "TSH", value: tsh != null ? `${tsh} mIU/L` : "—", status: tsh != null ? (tsh > 10 || tsh < 0.1 ? "critical" : tsh > 4.0 || tsh < 0.4 ? "warning" : "normal") : "missing" });
  inputs.push({ name: "T3", value: t3 != null ? `${t3} ng/dL` : "—", status: t3 != null ? (t3 > 200 || t3 < 80 ? "warning" : "normal") : "missing" });
  inputs.push({ name: "T4", value: t4 != null ? `${t4} μg/dL` : "—", status: t4 != null ? (t4 > 14.1 || t4 < 5.1 ? "warning" : "normal") : "missing" });

  if (tsh == null) {
    return {
      id: "thyroid", title: "Thyroid Pattern", category: "Thyroid",
      score: null, level: "insufficient", label: "Insufficient data",
      detail: "Need TSH to assess thyroid function.", inputs,
      recommendations: ["Get a TSH blood test."],
    };
  }

  let pattern: string;
  let level: RiskScore["level"];
  let score: number;
  const recs: string[] = [];

  // Pattern detection using TSH + T3/T4
  if (tsh > 10) {
    // Overt hypothyroidism
    pattern = "Overt Hypothyroidism";
    level = "high"; score = 75;
    recs.push("Levothyroxine therapy strongly indicated.");
    recs.push("Check anti-TPO antibodies to rule out Hashimoto's.");
    recs.push("Recheck TSH in 6–8 weeks after starting treatment.");
    if (t4 != null && t4 < 5.1) {
      inputs[2].status = "critical";
      recs.push("Low T4 confirms hypothyroidism.");
    }
  } else if (tsh > 4.0) {
    // Subclinical hypothyroidism
    pattern = "Subclinical Hypothyroidism";
    level = "moderate"; score = 40;
    recs.push("Repeat TSH in 6–12 weeks to confirm.");
    recs.push("Consider treatment if TSH >10 or symptomatic.");
    recs.push("Check anti-TPO antibodies.");
  } else if (tsh < 0.1) {
    // Overt hyperthyroidism
    pattern = "Overt Hyperthyroidism";
    level = "very-high"; score = 85;
    recs.push("Urgent evaluation for Graves' disease or toxic nodule.");
    recs.push("Check thyroid uptake scan.");
    recs.push("Consider beta-blockers for symptom control.");
    recs.push("Monitor for thyroid storm in severe cases.");
    if (t3 != null && t3 > 200) {
      inputs[1].status = "critical";
      recs.push("Elevated T3 confirms thyrotoxicosis.");
    }
  } else if (tsh < 0.4) {
    // Subclinical hyperthyroidism
    pattern = "Subclinical Hyperthyroidism";
    level = "moderate"; score = 45;
    recs.push("Repeat TSH in 6–12 weeks.");
    recs.push("Evaluate for atrial fibrillation risk if age >65.");
    recs.push("Assess bone density in postmenopausal women.");
  } else {
    // Normal
    pattern = "Euthyroid (Normal)";
    level = "low"; score = 5;
    recs.push("Thyroid function normal. Routine screening as indicated.");

    // Check for discordance
    if (t3 != null && (t3 > 200 || t3 < 80)) {
      pattern = "Euthyroid with abnormal T3";
      level = "moderate"; score = 30;
      recs.push("Abnormal T3 with normal TSH — consider non-thyroidal illness.");
    }
    if (t4 != null && (t4 > 14.1 || t4 < 5.1)) {
      pattern = "Euthyroid with abnormal T4";
      level = "moderate"; score = 30;
      recs.push("Abnormal T4 with normal TSH — check for binding protein disorders.");
    }
  }

  return {
    id: "thyroid", title: "Thyroid Pattern", category: "Thyroid",
    score, level, label: pattern,
    detail: `TSH: ${tsh} mIU/L. Pattern: ${pattern}.${t3 != null ? ` T3: ${t3} ng/dL.` : ""}${t4 != null ? ` T4: ${t4} μg/dL.` : ""}`,
    inputs, recommendations: recs,
  };
}

// ─── 5. Medication Adherence + Effect Detection ──────────────────────────────

interface MedReminder {
  medication_name: string;
  dosage: string | null;
  frequency: string;
  is_active: boolean;
}

// Map medication classes to expected lab effects
const MEDICATION_EFFECTS: Record<string, { pattern: RegExp; affectedVitals: string[]; direction: "decrease" | "increase" | "stabilize"; expectedEffect: string }[]> = {
  statins: [
    { pattern: /atorvastatin|rosuvastatin|simvastatin|pravastatin|statin/i, affectedVitals: ["total_cholesterol", "ldl", "triglycerides"], direction: "decrease", expectedEffect: "Lower LDL and total cholesterol" },
  ],
  antihypertensives: [
    { pattern: /amlodipine|telmisartan|losartan|enalapril|ramipril|metoprolol|atenolol/i, affectedVitals: ["bp_systolic", "bp_diastolic"], direction: "decrease", expectedEffect: "Lower blood pressure" },
  ],
  antidiabetics: [
    { pattern: /metformin|glimepiride|glipizide|sitagliptin|vildagliptin|insulin|dapagliflozin|empagliflozin/i, affectedVitals: ["hba1c", "fasting_blood_sugar", "post_prandial_glucose"], direction: "decrease", expectedEffect: "Lower blood glucose and HbA1c" },
  ],
  thyroid: [
    { pattern: /levothyroxine|thyroxine|eltroxin|thyronorm/i, affectedVitals: ["tsh"], direction: "stabilize", expectedEffect: "Normalize TSH levels" },
  ],
  anticoagulants: [
    { pattern: /warfarin|aspirin|clopidogrel|rivaroxaban|apixaban/i, affectedVitals: ["platelet_count"], direction: "decrease", expectedEffect: "Anticoagulation effect" },
  ],
};

export function detectMedicationEffects(
  medications: MedReminder[],
  vitalHistory: Array<{ vitals: VitalsMap; recorded_at: string }>,
): MedicationEffect[] {
  if (medications.length === 0 || vitalHistory.length < 2) return [];

  const results: MedicationEffect[] = [];
  const activeMeds = medications.filter(m => m.is_active);

  for (const med of activeMeds) {
    for (const [, effects] of Object.entries(MEDICATION_EFFECTS)) {
      for (const effect of effects) {
        if (!effect.pattern.test(med.medication_name)) continue;

        // Check if affected vitals are trending in expected direction
        for (const vitalKey of effect.affectedVitals) {
          const readings = vitalHistory
            .filter(h => h.vitals[vitalKey] != null)
            .map(h => ({ value: h.vitals[vitalKey] as number, date: h.recorded_at }));

          if (readings.length < 2) {
            results.push({
              medication: med.medication_name,
              expectedEffect: effect.expectedEffect,
              affectedVitals: [vitalKey],
              direction: effect.direction,
              assessment: "insufficient-data",
              detail: `Not enough ${vitalKey.replace(/_/g, " ")} readings to assess response.`,
            });
            continue;
          }

          const first = readings[0].value;
          const last = readings[readings.length - 1].value;
          const change = last - first;
          const pctChange = (change / Math.max(first, 1)) * 100;

          let assessment: MedicationEffect["assessment"];
          let detail: string;

          if (effect.direction === "decrease") {
            if (pctChange < -5) {
              assessment = "responding";
              detail = `${vitalKey.replace(/_/g, " ")} decreased by ${Math.abs(Math.round(pctChange))}% — medication appears effective.`;
            } else if (pctChange > 5) {
              assessment = "not-responding";
              detail = `${vitalKey.replace(/_/g, " ")} increased by ${Math.round(pctChange)}% despite medication — review adherence or dosage.`;
            } else {
              assessment = "responding";
              detail = `${vitalKey.replace(/_/g, " ")} stable — medication maintaining control.`;
            }
          } else if (effect.direction === "stabilize") {
            if (Math.abs(pctChange) < 15) {
              assessment = "responding";
              detail = `${vitalKey.replace(/_/g, " ")} stable — medication maintaining levels.`;
            } else {
              assessment = "not-responding";
              detail = `${vitalKey.replace(/_/g, " ")} changed by ${Math.round(pctChange)}% — dose adjustment may be needed.`;
            }
          } else {
            assessment = pctChange > 0 ? "responding" : "not-responding";
            detail = `${vitalKey.replace(/_/g, " ")} ${pctChange > 0 ? "increasing" : "not improving"} as expected.`;
          }

          results.push({
            medication: med.medication_name,
            expectedEffect: effect.expectedEffect,
            affectedVitals: [vitalKey],
            direction: effect.direction,
            assessment,
            detail,
          });
        }
      }
    }
  }

  return results;
}

// ─── Aggregate All Scores ────────────────────────────────────────────────────

export function computeAllRiskScores(
  vitals: VitalsMap,
  vitalHistory: Array<{ vitals: VitalsMap; recorded_at: string }>,
  age: number | null,
  isMale: boolean = true,
): RiskScore[] {
  return [
    computeASCVD(vitals, age, isMale),
    computeDiabetesRisk(vitals, vitalHistory),
    computeKidneyRisk(vitals, age, isMale),
    computeThyroidRisk(vitals),
  ];
}
