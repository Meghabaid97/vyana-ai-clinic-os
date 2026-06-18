import { useEffect, useState, type ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { PlanCard } from "./PlanCard";
import { NativeUpgradeNotice } from "./NativeUpgradeNotice";
import { type RazorpaySuccess } from "@/lib/razorpay";
import { type BillingCycle } from "@/lib/plans";
import { logEvent } from "@/lib/analytics";

export type PaywallReason = "briefing" | "family" | "docs" | "feature";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: PaywallReason;
  /** When set, hides Individual and only shows Family (used for the 2nd family member). */
  familyOnly?: boolean;
  /** Optional element rendered above the plans, e.g. blurred briefing preview. */
  preview?: ReactNode;
  onSuccess?: (p: RazorpaySuccess) => void;
}

const COPY: Record<PaywallReason, { title: string; body: string }> = {
  briefing: {
    title: "You've used this month's free briefing",
    body: "Upgrade to keep generating briefings for every doctor visit, second opinion, or family member.",
  },
  family: {
    title: "Add up to 6 family members",
    body: "Vyana Free covers you and 1 other. Upgrade to Family to bring everyone you care for under one household.",
  },
  docs: {
    title: "You've reached the free upload limit",
    body: "Free covers 5 records. Upgrade to keep uploading every report, prescription, and discharge summary.",
  },
  feature: {
    title: "This is a Pro feature",
    body: "Upgrade to unlock drug interaction checks, clinical intelligence, and the claim assistant.",
  },
};

export function PaywallSheet({ open, onOpenChange, reason, familyOnly, preview, onSuccess }: Props) {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const copy = COPY[reason];
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (open) void logEvent("paywall_viewed", { reason, familyOnly: !!familyOnly, native: isNative });
  }, [open, reason, familyOnly, isNative]);


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92svh] overflow-y-auto rounded-t-2xl p-5">
        <SheetHeader className="text-left space-y-1">
          <SheetTitle className="text-lg">{copy.title}</SheetTitle>
          <SheetDescription className="text-[13px]">{copy.body}</SheetDescription>
        </SheetHeader>

        {preview && <div className="mt-4">{preview}</div>}

        {isNative ? (
          <div className="mt-5 pb-4">
            <NativeUpgradeNotice />
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-1 p-1 rounded-xl bg-muted/50 w-fit mx-auto">
              {(["monthly", "yearly"] as BillingCycle[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    cycle === c ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {c === "monthly" ? "Monthly" : "Yearly · save more"}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3 pb-4">
              {!familyOnly && (
                <PlanCard plan="individual" cycle={cycle} onSuccess={(p) => { onSuccess?.(p); onOpenChange(false); }} />
              )}
              <PlanCard
                plan="family"
                cycle={cycle}
                recommended={!familyOnly}
                onSuccess={(p) => { onSuccess?.(p); onOpenChange(false); }}
              />
            </div>

            <p className="text-[10.5px] text-muted-foreground text-center pb-2">
              Secure payments by Razorpay. Cancel anytime. Pricing in INR, GST inclusive.
            </p>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
