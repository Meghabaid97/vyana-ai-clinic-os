import { useState, useEffect } from "react";
import {
  Heart, Zap, Bone, Brain, Pill,
  ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, XCircle, HelpCircle, TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  computeAllRiskScores,
  detectMedicationEffects,
  type RiskScore,
  type MedicationEffect,
} from "@/lib/clinicalRiskEngine";

type VitalsMap = Record<string, number | null>;

interface ClinicalRiskDashboardProps {
  vitals: VitalsMap;
  vitalHistory: Array<{ vitals: VitalsMap; recorded_at: string }>;
  medications: Array<{ medication_name: string; dosage: string | null; frequency: string; is_active: boolean }>;
  age: number | null;
}

const CATEGORY_ICONS: Record<string, typeof Heart> = {
  Cardiovascular: Heart,
  Metabolic: Zap,
  Kidney: Bone,
  Thyroid: Brain,
};

const LEVEL_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  low:          { bg: "bg-green-500/10", text: "text-green-700", ring: "ring-green-500/20" },
  moderate:     { bg: "bg-yellow-500/10", text: "text-yellow-700", ring: "ring-yellow-500/20" },
  high:         { bg: "bg-destructive/10", text: "text-destructive", ring: "ring-destructive/20" },
  "very-high":  { bg: "bg-destructive/15", text: "text-destructive", ring: "ring-destructive/30" },
  insufficient: { bg: "bg-muted/50", text: "text-muted-foreground", ring: "ring-border" },
};

const INPUT_STATUS_DOT: Record<string, string> = {
  normal: "bg-green-500",
  warning: "bg-yellow-500",
  critical: "bg-destructive",
  missing: "bg-muted-foreground/30",
};

const RiskCard = ({ risk }: { risk: RiskScore }) => {
  const [open, setOpen] = useState(false);
  const Icon = CATEGORY_ICONS[risk.category] || Heart;
  const style = LEVEL_STYLES[risk.level] || LEVEL_STYLES.insufficient;

  return (
    <div className={`rounded-xl border border-border bg-card overflow-hidden transition-all ${risk.level === "high" || risk.level === "very-high" ? "border-destructive/30" : ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${style.bg}`}>
          <Icon className={`h-5 w-5 ${style.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-foreground">{risk.title}</p>
          <p className={`text-[12px] font-medium ${style.text}`}>{risk.label}</p>
        </div>
        {risk.score != null && (
          <div className="flex flex-col items-center shrink-0 mr-2">
            <span className={`text-2xl font-bold ${style.text}`}>{risk.score}</span>
            <span className="text-[9px] text-muted-foreground uppercase">Score</span>
          </div>
        )}
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3 animate-fade-in">
          <p className="text-[12px] text-muted-foreground">{risk.detail}</p>

          {/* Inputs */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Inputs Used</p>
            <div className="flex flex-wrap gap-1.5">
              {risk.inputs.map((input, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${INPUT_STATUS_DOT[input.status]}`} />
                  <span className="text-[11px] text-foreground">{input.name}:</span>
                  <span className={`text-[11px] font-medium ${input.status === "missing" ? "text-muted-foreground" : "text-foreground"}`}>{input.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {risk.recommendations.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Recommendations</p>
              <ul className="space-y-1">
                {risk.recommendations.map((rec, i) => (
                  <li key={i} className="text-[12px] text-foreground flex gap-2 items-start">
                    <span className="text-primary mt-0.5">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MedEffectCard = ({ effect }: { effect: MedicationEffect }) => {
  const Icon = effect.assessment === "responding" ? CheckCircle2 : effect.assessment === "not-responding" ? XCircle : HelpCircle;
  const color = effect.assessment === "responding" ? "text-green-600" : effect.assessment === "not-responding" ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="rounded-lg border border-border bg-card p-3 flex items-start gap-3">
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${color}`} />
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13px] font-medium text-foreground">{effect.medication}</p>
          <Badge variant="outline" className={`text-[9px] ${effect.assessment === "responding" ? "border-green-500/30 text-green-600" : effect.assessment === "not-responding" ? "border-destructive/30 text-destructive" : ""}`}>
            {effect.assessment.replace("-", " ")}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">{effect.detail}</p>
      </div>
    </div>
  );
};

const ClinicalRiskDashboard = ({ vitals, vitalHistory, medications, age }: ClinicalRiskDashboardProps) => {
  const [scores, setScores] = useState<RiskScore[]>([]);
  const [medEffects, setMedEffects] = useState<MedicationEffect[]>([]);

  useEffect(() => {
    const allScores = computeAllRiskScores(vitals, vitalHistory, age);
    setScores(allScores);

    const effects = detectMedicationEffects(medications, vitalHistory);
    setMedEffects(effects);
  }, [vitals, vitalHistory, medications, age]);

  const activeScores = scores.filter(s => s.level !== "insufficient");
  const insufficientScores = scores.filter(s => s.level === "insufficient");
  const criticalScores = activeScores.filter(s => s.level === "high" || s.level === "very-high");

  return (
    <section className="px-5 pb-6">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="h-5 w-5 text-primary" />
        <h2 className="text-[15px] font-bold text-foreground">Clinical Risk Scores</h2>
      </div>
      <p className="text-[11px] text-muted-foreground mb-4">
        Rule-based scoring using real clinical parameters. Not a diagnosis.
      </p>

      {/* Alert banner for critical scores */}
      {criticalScores.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-destructive">
              {criticalScores.length} elevated risk{criticalScores.length > 1 ? "s" : ""} detected
            </p>
            <p className="text-[11px] text-muted-foreground">
              {criticalScores.map(s => s.title).join(", ")} — review recommendations below.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {activeScores.map(score => (
          <RiskCard key={score.id} risk={score} />
        ))}
        {insufficientScores.map(score => (
          <RiskCard key={score.id} risk={score} />
        ))}
      </div>

      {/* Medication effect tracking */}
      {medEffects.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-1">
            <Pill className="h-5 w-5 text-primary" />
            <h2 className="text-[15px] font-bold text-foreground">Medication Response</h2>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">
            Tracking whether your medications are achieving their expected effects.
          </p>
          <div className="space-y-2">
            {medEffects.map((effect, i) => (
              <MedEffectCard key={i} effect={effect} />
            ))}
          </div>
        </div>
      )}

      <p className="text-[9px] text-muted-foreground mt-4 italic">
        ⚕️ These scores use standard clinical thresholds (ACC/AHA, ADA, KDIGO, ATA). They are informational — always consult your healthcare provider.
      </p>
    </section>
  );
};

export default ClinicalRiskDashboard;
