import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalDisclaimerProps {
  /** "compact" shows a single-line note; "full" shows the persistent banner. */
  variant?: "compact" | "full";
  className?: string;
}

/**
 * Persistent medical disclaimer required by Apple App Review and Google Play
 * Personal Health policy. Surfaces clearly on briefing, trends, and any AI
 * insight surface so users understand Vyana is clinical decision support, not
 * a diagnosis engine.
 */
const MedicalDisclaimer = ({ variant = "full", className }: MedicalDisclaimerProps) => {
  if (variant === "compact") {
    return (
      <p
        className={cn(
          "text-[11px] text-muted-foreground italic leading-snug",
          className,
        )}
      >
        For informational purposes only. Not a diagnosis. Always consult a
        qualified doctor before acting on this information.
      </p>
    );
  }

  return (
    <div
      role="note"
      aria-label="Medical disclaimer"
      className={cn(
        "rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20 p-3 flex gap-2 items-start",
        className,
      )}
    >
      <ShieldAlert className="h-4 w-4 text-amber-700 dark:text-amber-300 mt-0.5 shrink-0" />
      <div className="text-[12px] leading-snug text-amber-900 dark:text-amber-100">
        <span className="font-semibold">Not medical advice.</span> Vyana is a
        clinical decision support tool, not a diagnosis engine. AI-generated
        summaries, trends and discussion points are for informational use only
        and must be confirmed with a qualified healthcare professional before
        any treatment decision.
      </div>
    </div>
  );
};

export default MedicalDisclaimer;
