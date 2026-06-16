// Teaser shown to free users on the Trends page.
// Renders mini sparklines for the 3 free vitals and a list of locked premium vitals,
// driven by the user's REAL vital history (no fake data).
import { useState, useMemo } from "react";
import { Lock, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaywallSheet } from "./PaywallSheet";

type VitalsMap = Record<string, number | null>;
interface HistoryEntry {
  recorded_at: string;
  vitals: VitalsMap;
}

interface Props {
  vitalHistory: HistoryEntry[];
}

const FREE_VITALS: { key: string; label: string; unit: string }[] = [
  { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL" },
  { key: "bp_systolic", label: "Blood Pressure (Systolic)", unit: "mmHg" },
  { key: "fasting_blood_sugar", label: "Fasting Blood Sugar", unit: "mg/dL" },
];

const LOCKED_VITALS: { key: string; label: string; group: string }[] = [
  { key: "hba1c", label: "HbA1c", group: "Diabetes" },
  { key: "post_prandial_glucose", label: "Post-Prandial Glucose", group: "Diabetes" },
  { key: "total_cholesterol", label: "Total Cholesterol", group: "Lipid panel" },
  { key: "hdl", label: "HDL", group: "Lipid panel" },
  { key: "ldl", label: "LDL", group: "Lipid panel" },
  { key: "triglycerides", label: "Triglycerides", group: "Lipid panel" },
  { key: "sgot", label: "SGOT (AST)", group: "Liver panel" },
  { key: "sgpt", label: "SGPT (ALT)", group: "Liver panel" },
  { key: "bilirubin", label: "Bilirubin", group: "Liver panel" },
  { key: "albumin", label: "Albumin", group: "Liver panel" },
  { key: "creatinine", label: "Creatinine", group: "Kidney panel" },
  { key: "bun", label: "Blood Urea (BUN)", group: "Kidney panel" },
  { key: "uric_acid", label: "Uric Acid", group: "Kidney panel" },
  { key: "wbc", label: "White Blood Cells", group: "Complete blood count" },
  { key: "rbc", label: "Red Blood Cells", group: "Complete blood count" },
  { key: "platelet_count", label: "Platelets", group: "Complete blood count" },
  { key: "esr", label: "ESR", group: "Inflammation" },
  { key: "tsh", label: "TSH", group: "Thyroid" },
  { key: "t3", label: "T3", group: "Thyroid" },
  { key: "t4", label: "T4", group: "Thyroid" },
  { key: "vitamin_d", label: "Vitamin D (25-OH)", group: "Vitamins & minerals" },
  { key: "vitamin_b12", label: "Vitamin B12", group: "Vitamins & minerals" },
  { key: "iron", label: "Iron", group: "Vitamins & minerals" },
  { key: "ferritin", label: "Ferritin", group: "Vitamins & minerals" },
  { key: "folate", label: "Folate", group: "Vitamins & minerals" },
  { key: "calcium", label: "Calcium", group: "Vitamins & minerals" },
  { key: "bp_diastolic", label: "Blood Pressure (Diastolic)", group: "Heart" },
  { key: "heart_rate", label: "Heart Rate", group: "Heart" },
  { key: "weight", label: "Weight", group: "Body" },
  { key: "bmi", label: "BMI", group: "Body" },
];

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) {
    return <div className="h-12 flex items-center justify-center text-[11px] text-muted-foreground">No data yet</div>;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 200;
  const h = 48;
  const pts = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M ${pts.join(" L ")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
      <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {values.map((v, i) => {
        const x = (i / Math.max(values.length - 1, 1)) * w;
        const y = h - ((v - min) / range) * h;
        return <circle key={i} cx={x} cy={y} r={2.5} fill="hsl(var(--primary))" />;
      })}
    </svg>
  );
}

export function TrendsTeaser({ vitalHistory }: Props) {
  const [paywallOpen, setPaywallOpen] = useState(false);

  const series = useMemo(() => {
    const sorted = [...vitalHistory].sort((a, b) =>
      new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
    return FREE_VITALS.map((v) => {
      const values: { at: string; value: number }[] = [];
      sorted.forEach((entry) => {
        const raw = entry.vitals?.[v.key];
        if (typeof raw === "number" && Number.isFinite(raw)) {
          values.push({ at: entry.recorded_at, value: raw });
        }
      });
      return { ...v, values };
    });
  }, [vitalHistory]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof LOCKED_VITALS>();
    LOCKED_VITALS.forEach((v) => {
      const arr = map.get(v.group) ?? [];
      arr.push(v);
      map.set(v.group, arr);
    });
    return Array.from(map.entries());
  }, []);

  return (
    <div className="space-y-5">
      {/* 3 free vital cards with real sparklines */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
            Your free vitals
          </h2>
          <Badge variant="outline" className="text-[10px]">3 of 33</Badge>
        </div>
        <div className="space-y-2">
          {series.map((v) => {
            const latest = v.values.at(-1)?.value;
            const first = v.values[0]?.value;
            const delta = latest != null && first != null ? latest - first : null;
            return (
              <div key={v.key} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{v.label}</p>
                    <p className="text-[10.5px] text-muted-foreground">
                      {v.values.length === 0
                        ? "Upload a report to see this trend"
                        : `${v.values.length} reading${v.values.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  {latest != null && (
                    <div className="text-right">
                      <p className="text-base font-bold leading-none">{latest.toFixed(1)}</p>
                      <p className="text-[10px] text-muted-foreground">{v.unit}</p>
                      {delta != null && v.values.length > 1 && (
                        <p className={`text-[10px] mt-0.5 ${delta > 0 ? "text-amber-700" : delta < 0 ? "text-sage-700" : "text-muted-foreground"}`}>
                          {delta > 0 ? "+" : ""}{delta.toFixed(1)} since first
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <Sparkline values={v.values.map((x) => x.value)} />
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-4.5 w-4.5 text-primary" />
          </div>
          <h3 className="text-[15px] font-bold text-foreground">Unlock the full Trends Engine</h3>
        </div>
        <p className="text-[13px] text-foreground/80 leading-snug mb-4">
          Track 33 critical health markers over time. Spot underlying health shifts before your doctor visit, instead of after.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="flex-1" onClick={() => setPaywallOpen(true)}>
            Individual · ₹99/mo
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setPaywallOpen(true)}>
            Family · ₹299/mo
          </Button>
        </div>
      </section>

      {/* Locked rows grouped by panel */}
      <section className="space-y-3">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Lock className="h-3 w-3" /> Premium vitals · {LOCKED_VITALS.length} locked
        </h2>
        {grouped.map(([group, vitals]) => (
          <div key={group} className="rounded-xl border border-border bg-muted/20">
            <p className="px-3 pt-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </p>
            <div className="divide-y divide-border/60">
              {vitals.map((v) => (
                <button
                  key={v.key}
                  onClick={() => setPaywallOpen(true)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[13px] text-foreground/70 truncate">{v.label}</span>
                  </div>
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <p className="text-[11px] text-center text-muted-foreground italic">
        Showing 3 of 33 vitals. Upgrade to track your full health story.
      </p>

      <PaywallSheet
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        reason="feature"
      />
    </div>
  );
}
