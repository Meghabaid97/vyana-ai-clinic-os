import { useState } from "react";
import { ShieldAlert, ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalDisclaimerProps {
  /** "compact" shows a single-line note; "full" shows the persistent banner. */
  variant?: "compact" | "full";
  className?: string;
  /** Show the expandable "Medical sources & citations" section. Default true on "full". */
  showSources?: boolean;
}

/**
 * Medical guidelines, calculators and reference ranges used by Vyana.
 * Surfaced as citations to satisfy Apple App Review Guideline 1.4.1
 * (Safety - Physical Harm) which requires medical apps to cite their sources.
 */
export const MEDICAL_SOURCES: Array<{
  category: string;
  items: Array<{ label: string; url: string; note?: string }>;
}> = [
  {
    category: "Vital sign reference ranges",
    items: [
      {
        label: "American Heart Association — Blood pressure categories",
        url: "https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings",
      },
      {
        label: "WHO — Body Mass Index (BMI) classification",
        url: "https://www.who.int/data/gho/data/themes/topics/topic-details/GHO/body-mass-index",
      },
      {
        label: "NIH MedlinePlus — Vital signs",
        url: "https://medlineplus.gov/vitalsigns.html",
      },
      {
        label: "Indian Council of Medical Research (ICMR) — Clinical guidelines",
        url: "https://www.icmr.gov.in/guidelines.html",
      },
    ],
  },
  {
    category: "Cardiovascular risk (ASCVD)",
    items: [
      {
        label: "ACC/AHA 2018 Guideline on the Management of Blood Cholesterol",
        url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625",
      },
      {
        label: "ACC ASCVD Risk Estimator Plus",
        url: "https://tools.acc.org/ascvd-risk-estimator-plus/",
      },
    ],
  },
  {
    category: "Diabetes & metabolic",
    items: [
      {
        label: "American Diabetes Association — Standards of Care",
        url: "https://diabetesjournals.org/care/issue/47/Supplement_1",
      },
      {
        label: "WHO — Diabetes diagnostic criteria",
        url: "https://www.who.int/health-topics/diabetes",
      },
    ],
  },
  {
    category: "Kidney function (eGFR)",
    items: [
      {
        label: "KDIGO 2024 Clinical Practice Guideline for CKD",
        url: "https://kdigo.org/guidelines/ckd-evaluation-and-management/",
      },
      {
        label: "NIDDK — Estimating Glomerular Filtration Rate",
        url: "https://www.niddk.nih.gov/health-information/professionals/clinical-tools-patient-management/kidney-disease/laboratory-evaluation/glomerular-filtration-rate/estimating",
      },
    ],
  },
  {
    category: "Thyroid",
    items: [
      {
        label: "American Thyroid Association — Clinical guidelines",
        url: "https://www.thyroid.org/professionals/ata-professional-guidelines/",
      },
    ],
  },
  {
    category: "Medications & drug interactions",
    items: [
      {
        label: "NIH MedlinePlus Drug Information",
        url: "https://medlineplus.gov/druginformation.html",
      },
      {
        label: "FDA — Drug interactions",
        url: "https://www.fda.gov/drugs/drug-interactions-labeling/drug-development-and-drug-interactions-table-substrates-inhibitors-and-inducers",
      },
      {
        label: "British National Formulary (BNF)",
        url: "https://bnf.nice.org.uk/interactions/",
      },
    ],
  },
  {
    category: "Vaccinations & preventive care",
    items: [
      {
        label: "Government of India — National Immunization Schedule (MoHFW)",
        url: "https://www.mohfw.gov.in/?q=en/immunisation-schedule",
      },
      {
        label: "Indian Academy of Pediatrics — Immunization schedule",
        url: "https://iapindia.org/iap-immunization-schedule/",
      },
      {
        label: "CDC — Adult immunization schedule",
        url: "https://www.cdc.gov/vaccines/schedules/hcp/imz/adult.html",
      },
      {
        label: "USPSTF — Recommendations for preventive services",
        url: "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation-topics",
      },
    ],
  },
  {
    category: "General health information",
    items: [
      {
        label: "World Health Organization (WHO)",
        url: "https://www.who.int/",
      },
      {
        label: "Ministry of Health and Family Welfare, India",
        url: "https://www.mohfw.gov.in/",
      },
      {
        label: "NIH MedlinePlus",
        url: "https://medlineplus.gov/",
      },
    ],
  },
];

const SourcesList = () => (
  <div className="mt-3 space-y-3">
    {MEDICAL_SOURCES.map((group) => (
      <div key={group.category}>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-900/80 dark:text-amber-100/80 mb-1">
          {group.category}
        </div>
        <ul className="space-y-1">
          {group.items.map((item) => (
            <li key={item.url} className="text-[12px] leading-snug">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-1 text-amber-900 dark:text-amber-100 underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-200"
              >
                <span>{item.label}</span>
                <ExternalLink className="h-3 w-3 mt-0.5 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
);

const MedicalDisclaimer = ({
  variant = "full",
  className,
  showSources = true,
}: MedicalDisclaimerProps) => {
  const [open, setOpen] = useState(false);

  if (variant === "compact") {
    return (
      <div className={cn("space-y-1", className)}>
        <p className="text-[11px] text-muted-foreground italic leading-snug">
          For informational purposes only. Not a diagnosis. Always consult a
          qualified doctor before acting on this information.
        </p>
        {showSources && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            {open ? "Hide medical sources" : "View medical sources & citations"}
          </button>
        )}
        {open && showSources && (
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <SourcesList />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="note"
      aria-label="Medical disclaimer"
      className={cn(
        "rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20 p-3",
        className,
      )}
    >
      <div className="flex gap-2 items-start">
        <ShieldAlert className="h-4 w-4 text-amber-700 dark:text-amber-300 mt-0.5 shrink-0" />
        <div className="text-[12px] leading-snug text-amber-900 dark:text-amber-100">
          <span className="font-semibold">Not medical advice.</span> Vyana is a
          clinical decision support tool, not a diagnosis engine. AI-generated
          summaries, trends and discussion points are for informational use only
          and must be confirmed with a qualified healthcare professional before
          any treatment decision. Reference ranges, risk calculators and
          medication information are derived from the cited sources below.
        </div>
      </div>

      {showSources && (
        <div className="mt-2 pl-6">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-900 dark:text-amber-100 underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-200"
          >
            {open ? "Hide medical sources" : "View medical sources & citations"}
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
          {open && <SourcesList />}
        </div>
      )}
    </div>
  );
};

export default MedicalDisclaimer;
