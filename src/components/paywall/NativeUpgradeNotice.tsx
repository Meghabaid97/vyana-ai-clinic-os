import { Info } from "lucide-react";

/**
 * iOS / Android notice shown where the web build would render an upsell.
 *
 * Apple Guideline 3.1.1 (and 3.1.3) forbids directing users to any external
 * purchase mechanism from inside the app — no mention of subscriptions,
 * pricing, upgrading, buying, or the vyana.care website. We cannot even
 * imply that the feature can be unlocked elsewhere.
 *
 * If the signed-in account already has entitlements, the feature renders
 * normally; this component is only shown when it does not, and simply
 * states that the feature is not available on this account.
 */
export function NativeUpgradeNotice() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-center">
      <div className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-muted mb-3">
        <Info className="h-4 w-4 text-muted-foreground" />
      </div>
      <h3 className="text-base font-bold">Not available on this account</h3>
      <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
        This feature isn't enabled for your account.
      </p>
    </div>
  );
}
