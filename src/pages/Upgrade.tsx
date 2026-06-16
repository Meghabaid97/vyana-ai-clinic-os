import { useState } from "react";
import { useEffect } from "react";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { PlanCard } from "@/components/paywall/PlanCard";
import { useEntitlements } from "@/hooks/useEntitlements";
import { type BillingCycle, FREE_LIMITS } from "@/lib/plans";

const COMPARE: { label: string; free: string; individual: string; family: string }[] = [
  { label: "Briefings per month", free: `${FREE_LIMITS.briefingsPerMonth}`, individual: "Unlimited", family: "Unlimited" },
  { label: "Document uploads", free: `${FREE_LIMITS.docsTotal} total`, individual: "Unlimited", family: "Unlimited" },
  { label: "Family members", free: `${FREE_LIMITS.familyMembers}`, individual: "1", family: "Up to 6" },
  { label: "Drug interaction checks", free: "—", individual: "✓", family: "✓" },
  { label: "Clinical intelligence", free: "—", individual: "✓", family: "✓" },
  { label: "Claim assistant", free: "—", individual: "✓", family: "✓" },
  { label: "Doctor sharing links", free: "1 active", individual: "Unlimited", family: "Unlimited" },
  { label: "Emergency family access", free: "Basic", individual: "Full", family: "Full" },
];

export default function Upgrade() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const ent = useEntitlements();

  return (
    <div className="min-h-[calc(100svh-4rem)] pb-24">
      <Helmet>
        <title>Upgrade Vyana · Protect your family's health story</title>
        <meta name="description" content="Upgrade to Vyana Pro or Family. Unlimited briefings, drug interaction checks, clinical intelligence, and up to 6 family members." />
      </Helmet>

      <div className="px-5 pt-6 pb-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-3">
          <Sparkles className="h-3 w-3" /> Vyana Pro
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Never lose a moment of your family's health story.</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          {ent.is_pro
            ? `You're on Vyana ${ent.plan === "family" ? "Family" : "Individual"}. Manage seats and renewals below.`
            : "Free is enough for occasional check-ups. When life moves fast, Pro keeps up."}
        </p>
      </div>

      <div className="flex items-center justify-center mb-5">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/50">
          {(["monthly", "yearly"] as BillingCycle[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCycle(c)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                cycle === c ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {c === "monthly" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4 max-w-md mx-auto">
        <PlanCard plan="individual" cycle={cycle} />
        <PlanCard plan="family" cycle={cycle} recommended />
      </div>

      <div className="mt-10 px-5 max-w-2xl mx-auto">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Compare plans</h2>
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-4 text-[11.5px] font-semibold bg-muted/50 px-3 py-2">
            <div></div>
            <div className="text-center">Free</div>
            <div className="text-center">Individual</div>
            <div className="text-center">Family</div>
          </div>
          {COMPARE.map((row, i) => (
            <div key={row.label} className={`grid grid-cols-4 text-[12px] px-3 py-2.5 ${i % 2 === 0 ? "bg-background" : "bg-muted/20"}`}>
              <div className="text-foreground/90">{row.label}</div>
              <div className="text-center text-muted-foreground">{row.free}</div>
              <div className="text-center">{row.individual}</div>
              <div className="text-center font-medium">{row.family}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 px-5 max-w-md mx-auto">
        <div className="rounded-2xl border border-border bg-muted/30 p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-[12.5px] text-muted-foreground">
            Your records stay yours. Cancel anytime, your data and briefings stay accessible. Payments processed securely by Razorpay. Prices in INR, GST inclusive.
          </div>
        </div>
      </div>

      <div className="mt-8 px-5 max-w-md mx-auto space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">FAQ</h2>
        {[
          { q: "Can I cancel anytime?", a: "Yes. Your subscription stays active until the end of the period you've paid for. After that, you fall back to Free." },
          { q: "Does Family cover my parents who don't use phones?", a: "Yes. Add them as dependents in your household. You manage everything on their behalf." },
          { q: "Is my health data ever sold?", a: "No. Never. We make money from subscriptions, not data. Read more in our privacy notice." },
        ].map((f) => (
          <div key={f.q} className="rounded-xl border border-border p-3">
            <div className="flex items-start gap-2">
              <Check className="h-3.5 w-3.5 text-primary mt-1 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold">{f.q}</p>
                <p className="text-[12px] text-muted-foreground mt-1">{f.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
