import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useEntitlements } from "@/hooks/useEntitlements";

export default function PastDueBanner() {
  const ent = useEntitlements();
  const navigate = useNavigate();

  if (!ent.authenticated || ent.status !== "past_due") return null;

  return (
    <div className="mx-3 mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-3">
      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground">
          Your AutoPay didn't go through
        </p>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Pro features stay on for a short grace period. Update your payment
          method or re-approve the UPI mandate to keep things uninterrupted.
        </p>
        <button
          type="button"
          onClick={() => navigate("/app/billing")}
          className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-destructive hover:underline"
        >
          Fix payment method <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
