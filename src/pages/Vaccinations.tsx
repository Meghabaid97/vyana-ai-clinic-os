import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchActivePatient, onActivePatientChange } from "@/lib/activePatient";
import { Shield, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Syringe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";

interface VaccineInfo {
  name: string;
  description: string;
  ageRange: string;
  minAge: number;
  maxAge: number;
  frequency: string;
  importance: "essential" | "recommended" | "optional";
}

const vaccines: VaccineInfo[] = [
  { name: "Influenza (Flu)", description: "Annual flu vaccine protects against seasonal influenza strains. Especially important for elderly, children, and those with chronic conditions.", ageRange: "6 months+", minAge: 0, maxAge: 120, frequency: "Annual", importance: "recommended" },
  { name: "COVID-19", description: "Protects against severe COVID-19 illness. Boosters recommended based on current guidelines.", ageRange: "6 months+", minAge: 0, maxAge: 120, frequency: "As per guidelines", importance: "recommended" },
  { name: "Tdap (Tetanus, Diphtheria, Pertussis)", description: "Booster every 10 years. Critical for wound prevention and protecting newborns from whooping cough.", ageRange: "11+ years", minAge: 11, maxAge: 120, frequency: "Every 10 years", importance: "essential" },
  { name: "Hepatitis B", description: "Prevents liver infection and liver cancer. Usually given as a 3-dose series.", ageRange: "All ages", minAge: 0, maxAge: 120, frequency: "3-dose series", importance: "essential" },
  { name: "HPV (Human Papillomavirus)", description: "Prevents cervical, throat, and other cancers caused by HPV. Most effective when given before age 26.", ageRange: "9-45 years", minAge: 9, maxAge: 45, frequency: "2-3 dose series", importance: "essential" },
  { name: "Pneumococcal (PCV/PPSV)", description: "Prevents pneumonia, meningitis, and bloodstream infections. Especially important for 65+ and those with chronic conditions.", ageRange: "2+ years, 65+", minAge: 2, maxAge: 120, frequency: "1-2 doses", importance: "recommended" },
  { name: "Shingles (Zoster)", description: "Prevents shingles and postherpetic neuralgia. Recommended for adults 50+ even if you had chickenpox.", ageRange: "50+ years", minAge: 50, maxAge: 120, frequency: "2-dose series", importance: "recommended" },
  { name: "MMR (Measles, Mumps, Rubella)", description: "If you haven't been vaccinated or lack immunity, especially important for travel and healthcare workers.", ageRange: "12 months+", minAge: 1, maxAge: 120, frequency: "2 doses", importance: "essential" },
  { name: "Varicella (Chickenpox)", description: "If you haven't had chickenpox or the vaccine, two doses are recommended.", ageRange: "12 months+", minAge: 1, maxAge: 120, frequency: "2 doses", importance: "recommended" },
  { name: "Hepatitis A", description: "Prevents liver infection from Hepatitis A virus. Important for travelers and those in high-risk settings.", ageRange: "12 months+", minAge: 1, maxAge: 120, frequency: "2 doses", importance: "recommended" },
  { name: "Meningococcal", description: "Prevents bacterial meningitis. Recommended for teens, college students, and travelers to endemic areas.", ageRange: "11-23 years", minAge: 11, maxAge: 23, frequency: "1-2 doses + booster", importance: "recommended" },
  { name: "Typhoid", description: "Important in India and South Asia. Recommended for those in endemic areas and travelers.", ageRange: "2+ years", minAge: 2, maxAge: 120, frequency: "Every 2-3 years", importance: "recommended" },
];

const ageBasedScreenings = [
  { minAge: 18, maxAge: 39, tests: ["Blood pressure check (annually)", "Cholesterol screening (every 5 years)", "Diabetes screening if overweight", "Dental checkup (biannual)"] },
  { minAge: 40, maxAge: 49, tests: ["Blood pressure (annually)", "Cholesterol & lipid panel (every 3 years)", "Diabetes screening (every 3 years)", "Eye exam (every 2 years)", "Thyroid check", "Vitamin D & B12 levels"] },
  { minAge: 50, maxAge: 64, tests: ["Colonoscopy (every 10 years)", "Mammogram (annually for women)", "PSA test (discuss with doctor for men)", "Bone density scan (women at 50)", "Lung cancer screening (if smoker)", "Hearing test (every 3 years)"] },
  { minAge: 65, maxAge: 120, tests: ["Annual comprehensive health checkup", "Colonoscopy", "Bone density scan", "Cognitive screening", "Fall risk assessment", "Vision & hearing tests (annually)", "Pneumococcal vaccine"] },
];

const Vaccinations = () => {
  const { t } = useLanguage();
  const [patientAge, setPatientAge] = useState<number | null>(null);
  const [expandedVaccine, setExpandedVaccine] = useState<string | null>(null);

  useEffect(() => {
    const loadAge = async () => {
      const data = await fetchActivePatient<{ age: number | null; date_of_birth: string | null }>(
        "age, date_of_birth"
      );
      if (data?.age) setPatientAge(data.age);
      else if (data?.date_of_birth) {
        const birth = new Date(data.date_of_birth);
        const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        setPatientAge(age);
      } else setPatientAge(null);
    };
    void loadAge();
    const off = onActivePatientChange(() => { setPatientAge(null); void loadAge(); });
    return () => off();
  }, []);

  const relevantVaccines = patientAge
    ? vaccines.filter((v) => patientAge >= v.minAge && patientAge <= v.maxAge)
    : vaccines;

  const relevantScreenings = patientAge
    ? ageBasedScreenings.find((s) => patientAge >= s.minAge && patientAge <= s.maxAge)
    : null;

  const importanceColor = (imp: string) => {
    switch (imp) {
      case "essential": return "bg-destructive/10 text-destructive border-destructive/20";
      case "recommended": return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="animate-fade-in">
      <section className="px-5 pt-8 pb-4">
        <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground">
          {t("vac.title")}
        </h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed mt-2">
          {patientAge
            ? t("vac.subtitle.personal", { age: patientAge })
            : t("vac.subtitle.generic")}
        </p>
      </section>

      {/* Age-based nudges */}
      {patientAge && relevantScreenings && (
        <section className="px-5 pb-6">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <h2 className="text-[15px] font-bold text-foreground">
                {t("vac.screenings.title", { age: patientAge })}
              </h2>
            </div>
            <p className="text-[12px] text-muted-foreground mb-3">
              {t("vac.screenings.intro")}
            </p>
            <div className="space-y-2">
              {relevantScreenings.tests.map((test, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-[13px] text-foreground">{test}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Vaccination list */}
      <section className="px-5 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <Syringe className="h-5 w-5 text-primary" />
          <h2 className="text-[15px] font-bold text-foreground">
            {patientAge ? t("vac.list.titlePersonal") : t("vac.list.titleGeneric")}
          </h2>
          <Badge variant="outline" className="text-[10px]">{relevantVaccines.length}</Badge>
        </div>

        <div className="space-y-2">
          {relevantVaccines.map((vaccine) => {
            const isExpanded = expandedVaccine === vaccine.name;
            return (
              <button
                key={vaccine.name}
                onClick={() => setExpandedVaccine(isExpanded ? null : vaccine.name)}
                className="w-full text-left rounded-xl border border-border bg-card p-3.5 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-foreground truncate">{vaccine.name}</p>
                      {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{vaccine.frequency} · {vaccine.ageRange}</p>
                  </div>
                  <Badge variant="outline" className={`text-[9px] shrink-0 ${importanceColor(vaccine.importance)}`}>
                    {t(`vac.imp.${vaccine.importance}`)}
                  </Badge>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-[12px] text-foreground leading-relaxed">{vaccine.description}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-5 pb-10">
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
          <p className="text-[11px] text-muted-foreground">
            {t("vac.disclaimer")}
          </p>
        </div>
      </section>
    </div>
  );
};

export default Vaccinations;
