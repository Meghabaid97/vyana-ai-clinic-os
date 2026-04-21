// Demo briefing for "Try with sample data" activation moment.
// Persona: Ramesh Kumar, 58, T2 diabetic + hypertensive, recent ER visit for chest pain.

export const SAMPLE_PATIENT = {
  name: "Ramesh Kumar (Sample)",
  age: 58,
};

export const SAMPLE_BRIEFING = {
  patient_overview: {
    key_conditions: [
      "Type 2 Diabetes (12 yrs)",
      "Hypertension",
      "Hyperlipidemia",
      "Recent chest pain workup",
    ],
    summary:
      "58-year-old male with long-standing T2 diabetes and hypertension. HbA1c trending upward over last 6 months. Presented to ER 2 weeks ago with atypical chest pain, cardiac workup negative, discharged on revised statin dose.",
  },
  key_trends: [
    { vital: "HbA1c", direction: "increasing", detail: "7.2% → 7.6% → 8.1% over last 6 months", concern_level: "action_needed" },
    { vital: "Blood Pressure", direction: "decreasing", detail: "148/94 → 132/84 since amlodipine added", concern_level: "monitor" },
    { vital: "LDL Cholesterol", direction: "decreasing", detail: "142 → 98 mg/dL after statin uptitration", concern_level: "stable" },
    { vital: "Creatinine", direction: "stable", detail: "1.1 mg/dL, kidney function preserved", concern_level: "stable" },
  ],
  current_medications: [
    { name: "Metformin 1000mg BD", status: "active", note: "12 yrs, well tolerated" },
    { name: "Glimepiride 2mg OD", status: "active" },
    { name: "Amlodipine 5mg OD", status: "recently_started", note: "Added 6 weeks ago for BP" },
    { name: "Atorvastatin 40mg HS", status: "active", note: "Uptitrated from 20mg post-ER visit" },
    { name: "Aspirin 75mg OD", status: "active" },
  ],
  red_flags: [
    {
      flag: "HbA1c rising despite dual oral therapy",
      severity: "critical",
      detail: "Consider GLP-1 agonist or insulin. Patient reports increased thirst and nocturia.",
    },
    {
      flag: "Recent atypical chest pain",
      severity: "warning",
      detail: "ER troponin negative 2 weeks ago. No ETT done yet. Consider stress test if recurs.",
    },
  ],
  recent_changes: [
    "ER visit 2 weeks ago, chest pain, cardiac workup negative",
    "Statin uptitrated 20mg → 40mg",
    "Amlodipine 5mg added 6 weeks ago",
    "HbA1c rose from 7.6% to 8.1% at last visit",
    "Reports increased thirst and nighttime urination",
  ],
  soap_note: {
    subjective:
      "58M with T2DM x12y, HTN, HLD. C/o increased thirst, nocturia x4 weeks. Denies chest pain since ER visit. Adherent to medications.",
    objective:
      "BP 132/84, HR 78, BMI 28.4. Recent labs: HbA1c 8.1, LDL 98, Cr 1.1, eGFR 72. ECG NSR. ER troponin x2 negative (2 wks ago).",
    assessment:
      "1) T2DM, uncontrolled, rising HbA1c despite dual oral agents. 2) HTN, improved on amlodipine. 3) HLD, at goal on atorva 40. 4) S/p chest pain workup, non-cardiac.",
    plan:
      "Intensify diabetes therapy (consider GLP-1 RA). Continue current BP/lipid regimen. Repeat HbA1c in 3 months. Stress test if chest pain recurs. Diabetes educator referral.",
  },
  medication_correlations: [
    {
      observation: "BP improvement correlates with amlodipine initiation",
      confidence: "high",
      supporting_data: "BP dropped 16/10 mmHg in 6 weeks after starting amlodipine 5mg",
    },
    {
      observation: "LDL response to statin uptitration",
      confidence: "high",
      supporting_data: "LDL fell from 142 to 98 mg/dL within 8 weeks of dose increase to 40mg",
    },
  ],
  disclaimer:
    "This is a demo briefing using sample patient data. AI-generated content for illustration only, not real clinical data.",
} as const;
