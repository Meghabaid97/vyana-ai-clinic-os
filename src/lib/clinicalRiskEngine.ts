/**
 * Clinical Decision Support Engine
 * Rule-based indicators using standard clinical reference ranges.
 * Sources: ACC/AHA, ADA, KDIGO, ATA guidelines for reference ranges only.
 *
 * ⚠️ NOT a diagnostic tool. NOT medical advice. Does NOT prescribe treatments.
 * All outputs are informational indicators to discuss with a healthcare provider.
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
      detail: "Age, total cholesterol, HDL, and systolic BP are needed for this indicator.",
      inputs,
      recommendations: ["Ask your doctor about a lipid panel and blood pressure check."],
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
    recs.push("Your values are in a favorable range. Keep up healthy habits.");
  } else if (risk < 7.5) {
    level = "moderate"; label = "Borderline (5-7.5%)";
    recs.push("Lifestyle factors like diet and exercise may help. Discuss with your doctor.");
    recs.push("Your doctor may want to review your lipid levels at your next visit.");
  } else if (risk < 20) {
    level = "high"; label = "Intermediate (7.5-20%)";
    recs.push("This range suggests a conversation with your doctor about heart health.");
    recs.push("Ask about cholesterol and blood pressure goals for your profile.");
    recs.push("Regular monitoring may be beneficial.");
  } else {
    level = "very-high"; label = "High risk (≥20%)";
    recs.push("This score suggests discussing cardiovascular risk reduction with your doctor soon.");
    recs.push("Ask your doctor about cholesterol targets and blood pressure goals.");
    recs.push("Regular follow-up and monitoring are important at this level.");
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
      detail: "HbA1c or fasting glucose is needed for this indicator.", inputs,
      recommendations: ["Ask your doctor about a fasting blood glucose or HbA1c test."],
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
    recs.push("Blood sugar levels are in a healthy range. Keep it up.");
  } else if (effectiveHbA1c < 6.5) {
    score = 40; level = "moderate"; label = "Pre-diabetes range";
    recs.push("Your levels suggest pre-diabetes. Discuss with your doctor.");
    recs.push("Lifestyle changes (diet + activity) can make a big difference at this stage.");
    recs.push("Your doctor may suggest rechecking HbA1c in 3-6 months.");
  } else if (effectiveHbA1c < 8.0) {
    score = 65; level = "high"; label = "Elevated (managed range)";
    recs.push("Your HbA1c is above the typical target. Discuss goals with your doctor.");
    recs.push("Ask about screening for related conditions at your next visit.");
    recs.push("Medication adherence is important. Talk to your doctor about your regimen.");
  } else {
    score = 90; level = "very-high"; label = "Significantly elevated";
    recs.push("Your HbA1c is notably high. Please consult your doctor soon.");
    recs.push("Your doctor may want to review your current treatment plan.");
    recs.push("Frequent monitoring may be helpful at this level.");
  }

  if (trend === "worsening") {
    score = Math.min(score + 15, 100);
    recs.unshift("⚠ HbA1c is trending upward. Bring this to your doctor's attention.");
  } else if (trend === "improving") {
    recs.unshift("✓ HbA1c is trending downward. Your current approach appears to be working.");
  }

  // Post-prandial spikes
  if (ppg != null && ppg > 200) {
    recs.push("Post-meal glucose is elevated. Your doctor may want to review mealtime management.");
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
      detail: "Serum creatinine and age are needed to estimate kidney function.", inputs,
      recommendations: ["Ask your doctor about a serum creatinine test."],
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
    stage = "G1: Normal"; level = "low"; score = 10;
    recs.push("Kidney function appears normal based on this value.");
  } else if (eGFR >= 60) {
    stage = "G2: Mildly decreased"; level = "moderate"; score = 30;
    recs.push("Mild change detected. Your doctor may want to monitor this annually.");
    recs.push("Ask about blood pressure goals at your next visit.");
  } else if (eGFR >= 45) {
    stage = "G3a: Mild-moderate decrease"; level = "moderate"; score = 50;
    recs.push("Your doctor may want to involve a kidney specialist.");
    recs.push("Discuss which medications to avoid with your doctor.");
  } else if (eGFR >= 30) {
    stage = "G3b: Moderate-severe decrease"; level = "high"; score = 65;
    recs.push("This level typically needs active doctor involvement.");
    recs.push("Discuss blood pressure and blood sugar targets with your doctor.");
    recs.push("Ask about related screening (anemia, bone health).");
  } else if (eGFR >= 15) {
    stage = "G4: Severely decreased"; level = "very-high"; score = 80;
    recs.push("Please consult your doctor about next steps for kidney care.");
    recs.push("Your doctor may discuss dietary adjustments.");
    recs.push("Frequent monitoring is typically recommended at this stage.");
  } else {
    stage = "G5: Kidney failure range"; level = "very-high"; score = 95;
    recs.push("This value indicates a serious concern. Please see your doctor urgently.");
    recs.push("Your doctor will discuss treatment options with you.");
  }

  // BUN/Creatinine ratio for pre-renal assessment
  if (bun != null && creatinine > 0) {
    const ratio = bun / creatinine;
    if (ratio > 20) {
      recs.push(`BUN/Cr ratio is elevated (${Math.round(ratio)}). Mention this to your doctor.`);
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
      detail: "TSH is needed to evaluate thyroid function.", inputs,
      recommendations: ["Ask your doctor about a TSH blood test."],
    };
  }

  let pattern: string;
  let level: RiskScore["level"];
  let score: number;
  const recs: string[] = [];

  // Pattern detection using TSH + T3/T4
  if (tsh > 10) {
    pattern = "Pattern suggests hypothyroidism";
    level = "high"; score = 75;
    recs.push("TSH is significantly elevated. Discuss thyroid management with your doctor.");
    recs.push("Your doctor may want to check thyroid antibodies.");
    recs.push("Follow-up testing is typically done 6-8 weeks after any changes.");
    if (t4 != null && t4 < 5.1) {
      inputs[2].status = "critical";
      recs.push("Low T4 supports this pattern. Share with your doctor.");
    }
  } else if (tsh > 4.0) {
    pattern = "Mildly elevated TSH";
    level = "moderate"; score = 40;
    recs.push("TSH is slightly above range. Your doctor may want to recheck in 6-12 weeks.");
    recs.push("Ask about thyroid antibody testing if not already done.");
  } else if (tsh < 0.1) {
    pattern = "Pattern suggests hyperthyroidism";
    level = "very-high"; score = 85;
    recs.push("TSH is very low. Please discuss with your doctor promptly.");
    recs.push("Your doctor will likely want further thyroid evaluation.");
    recs.push("Mention any symptoms like rapid heartbeat, weight loss, or tremors.");
    if (t3 != null && t3 > 200) {
      inputs[1].status = "critical";
      recs.push("Elevated T3 adds context. Share this with your doctor.");
    }
  } else if (tsh < 0.4) {
    pattern = "Slightly low TSH";
    level = "moderate"; score = 45;
    recs.push("TSH is slightly below range. Recheck in 6-12 weeks may be useful.");
    recs.push("Mention to your doctor, especially if you have heart-related concerns.");
  } else {
    pattern = "Euthyroid (Normal)";
    level = "low"; score = 5;
    recs.push("Thyroid function appears normal based on TSH.");

    if (t3 != null && (t3 > 200 || t3 < 80)) {
      pattern = "Normal TSH with unusual T3";
      level = "moderate"; score = 30;
      recs.push("T3 is outside the typical range despite normal TSH. Mention to your doctor.");
    }
    if (t4 != null && (t4 > 14.1 || t4 < 5.1)) {
      pattern = "Normal TSH with unusual T4";
      level = "moderate"; score = 30;
      recs.push("T4 is outside the typical range despite normal TSH. Mention to your doctor.");
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
              detail = `${vitalKey.replace(/_/g, " ")} decreased by ${Math.abs(Math.round(pctChange))}%. This may reflect your medication working. Discuss with your doctor.`;
            } else if (pctChange > 5) {
              assessment = "not-responding";
              detail = `${vitalKey.replace(/_/g, " ")} increased by ${Math.round(pctChange)}% while on this medication. Mention this to your doctor.`;
            } else {
              assessment = "responding";
              detail = `${vitalKey.replace(/_/g, " ")} is stable. Your current approach may be helping.`;
            }
          } else if (effect.direction === "stabilize") {
            if (Math.abs(pctChange) < 15) {
              assessment = "responding";
              detail = `${vitalKey.replace(/_/g, " ")} is stable. This may reflect your medication helping.`;
            } else {
              assessment = "not-responding";
              detail = `${vitalKey.replace(/_/g, " ")} changed by ${Math.round(pctChange)}%. Discuss with your doctor.`;
            }
          } else {
            assessment = pctChange > 0 ? "responding" : "not-responding";
            detail = `${vitalKey.replace(/_/g, " ")} ${pctChange > 0 ? "moving in expected direction" : "not changing as expected"}. Mention at your next visit.`;
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
