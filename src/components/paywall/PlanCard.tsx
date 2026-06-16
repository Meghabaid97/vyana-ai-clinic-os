import { useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { startPlanCheckout, type RazorpaySuccess } from "@/lib/razorpay";
import {
  PLAN_META, PLAN_PRICES, formatINR, yearlyMonthlyEquivalent, yearlySavingsPct,
  type BillingCycle,
} from "@/lib/plans";

interface Props {
  plan: "individual" | "family";
  cycle: BillingCycle;
  recommended?: boolean;
  compact?: boolean;
  onSuccess?: (p: RazorpaySuccess) => void;
}

export function PlanCard({ plan, cycle, recommended, compact, onSuccess }: Props) {
  const meta = PLAN_META[plan];
  const price = PLAN_PRICES[plan][cycle];
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleBuy = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: patient } = user
        ? await supabase.from("patients").select("name, phone").eq("user_id", user.id).eq("is_primary", true).maybeSingle()
        : { data: null } as any;

      const res = await startPlanCheckout({
        plan,
        cycle,
        prefill: {
          name: patient?.name ?? user?.user_metadata?.name ?? undefined,
          email: user?.email ?? undefined,
          contact: patient?.phone?.replace(/\D/g, "") ?? user?.phone?.replace(/\D/g, "") ?? undefined,
        },
      });
      toast({ title: "You're in 🎉", description: `${meta.name} plan active.` });
      onSuccess?.(res);
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Payment failed");
      if (e.message !== "Payment cancelled") {
        toast({ title: "Payment failed", description: e.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative rounded-2xl border p-5 ${recommended ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
      {(recommended || meta.highlight) && (
        <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground gap-1">
          <Sparkles className="h-3 w-3" /> {meta.highlight ?? "Recommended"}
        </Badge>
      )}
      <div className="flex items-baseline justify-between">
        <div>
          <h3 className="text-base font-bold">{meta.name}</h3>
          <p className="text-xs text-muted-foreground">{meta.tagline}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold leading-none">
            {cycle === "yearly" ? yearlyMonthlyEquivalent(price) : formatINR(price)}
            <span className="text-xs font-normal text-muted-foreground">/mo</span>
          </div>
          {cycle === "yearly" && (
            <p className="text-[10px] text-green-700 mt-0.5">
              {formatINR(price)}/yr · save {yearlySavingsPct(plan)}%
            </p>
          )}
        </div>
      </div>

      {!compact && (
        <ul className="mt-4 space-y-1.5">
          {meta.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[13px] text-foreground/90">
              <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      <Button onClick={handleBuy} disabled={loading} className="w-full mt-4">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ${formatINR(price)} · ${cycle === "yearly" ? "year" : "month"}`}
      </Button>
    </div>
  );
}
