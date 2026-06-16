import { useState, useEffect } from "react";
import { Check, ShieldCheck, Sparkles, Loader2, RotateCcw, XCircle } from "lucide-react";
import { PlanCard } from "@/components/paywall/PlanCard";
import { useEntitlements } from "@/hooks/useEntitlements";
import { type BillingCycle, FREE_LIMITS, PLAN_META } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const COMPARE: { label: string; free: string; individual: string; family: string }[] = [
  { label: "Briefings", free: `${FREE_LIMITS.briefingsLifetime} (lifetime)`, individual: "Unlimited", family: "Unlimited" },
  { label: "Document uploads", free: `${FREE_LIMITS.docsLifetime} (lifetime)`, individual: "Unlimited", family: "Unlimited" },
  { label: "Family members", free: `${FREE_LIMITS.familyMembers} (you)`, individual: "1", family: "Up to 6" },
  { label: "Health vitals tracked", free: `${FREE_LIMITS.freeVitalsCount} of 33`, individual: "All 33", family: "All 33" },
  { label: "Drug interaction checks", free: "—", individual: "✓", family: "✓" },
  { label: "Clinical intelligence", free: "—", individual: "✓", family: "✓" },
  { label: "Claim assistant", free: "—", individual: "✓", family: "✓" },
  { label: "Doctor sharing links", free: "1 active", individual: "Unlimited", family: "Unlimited" },
  { label: "Emergency family access", free: "Basic", individual: "Full", family: "Full" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "—"; }
}

function ManageSubscription({ ent, onChanged }: { ent: ReturnType<typeof useEntitlements>; onChanged: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const meta = PLAN_META[ent.plan === "family" ? "family" : "individual"];
  const cancelScheduled = (ent as any).cancel_at_period_end as boolean | undefined;
  const cycle = ((ent as any).billing_cycle as string | undefined) ?? "monthly";

  const cancel = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("cancel_subscription" as any);
      if (error) throw error;
      toast({ title: "Subscription canceled", description: "You'll keep Pro access until your current period ends." });
      onChanged();
    } catch (e: any) {
      toast({ title: "Couldn't cancel", description: e?.message ?? "Please try again.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const resume = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("resume_subscription" as any);
      if (error) throw error;
      toast({ title: "Subscription resumed", description: "Renewal is back on." });
      onChanged();
    } catch (e: any) {
      toast({ title: "Couldn't resume", description: e?.message ?? "Please try again.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="px-5 max-w-md mx-auto">
      <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-2">
              <Sparkles className="h-3 w-3" /> Vyana {meta.name}
            </div>
            <h3 className="text-base font-bold">{meta.name} plan · {cycle === "yearly" ? "Yearly" : "Monthly"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{meta.tagline}</p>
          </div>
        </div>

        <dl className="mt-4 space-y-2 text-[13px]">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">
              {cancelScheduled ? "Canceling at period end" : "Active"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{cancelScheduled ? "Access until" : "Renews on"}</dt>
            <dd className="font-medium">{formatDate(ent.current_period_end)}</dd>
          </div>
        </dl>

        <div className="mt-5">
          {cancelScheduled ? (
            <Button onClick={resume} disabled={busy} className="w-full" variant="default">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><RotateCcw className="h-4 w-4 mr-2" /> Resume renewal</>)}
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={busy} variant="outline" className="w-full border-destructive/40 text-destructive hover:bg-destructive/5">
                  <XCircle className="h-4 w-4 mr-2" /> Cancel subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Vyana {meta.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your plan stays active until {formatDate(ent.current_period_end)}. After that, your account falls back to Free. Your records and briefings stay with you.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Pro</AlertDialogCancel>
                  <AlertDialogAction onClick={cancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <p className="text-[11.5px] text-muted-foreground mt-3 text-center">
        Need to switch plans or change billing cycle? Cancel first, then choose a new plan once it ends.
      </p>
    </div>
  );
}

export default function Upgrade() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const ent = useEntitlements();

  useEffect(() => {
    const prev = document.title;
    document.title = ent.is_pro
      ? "Manage subscription · Vyana"
      : "Upgrade Vyana · Protect your family's health story";
    return () => { document.title = prev; };
  }, [ent.is_pro]);

  return (
    <div className="min-h-[calc(100svh-4rem)] pb-24">
      <div className="px-5 pt-6 pb-4 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-3">
          <Sparkles className="h-3 w-3" /> {ent.is_pro ? "Vyana Pro" : "Vyana Pro"}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {ent.is_pro ? "Manage your subscription" : "Never lose a moment of your family's health story."}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          {ent.is_pro
            ? `You're on Vyana ${ent.plan === "family" ? "Family" : "Individual"}. Manage renewal below.`
            : "Free is enough for occasional check-ups. When life moves fast, Pro keeps up."}
        </p>
      </div>

      {ent.is_pro ? (
        <ManageSubscription ent={ent} onChanged={ent.refresh} />
      ) : (
        <>
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
        </>
      )}

      <div className="mt-8 px-5 max-w-md mx-auto">
        <div className="rounded-2xl border border-border bg-muted/30 p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-[12.5px] text-muted-foreground">
            Your records stay yours. Cancel anytime, your data and briefings stay accessible. Payments processed securely by Razorpay. Prices in INR, GST inclusive.
          </div>
        </div>
      </div>

      {!ent.is_pro && (
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
      )}
    </div>
  );
}
