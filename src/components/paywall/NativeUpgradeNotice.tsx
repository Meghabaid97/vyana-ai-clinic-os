import { Sparkles, Globe } from "lucide-react";

/**
 * iOS / Android "reader app" notice.
 * Per Apple Guideline 3.1.1, native builds must NOT link out to external
 * checkout. We display informational text only — no clickable link, no
 * button that navigates to a web checkout, no pricing CTA.
 *
 * Users manage Vyana Pro by visiting vyana.care in any browser.
 */
export function NativeUpgradeNotice() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-center">
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-3">
        <Sparkles className="h-3 w-3" /> Vyana Pro
      </div>
      <h3 className="text-base font-bold">Pro features are managed on the web</h3>
      <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
        Vyana Pro features can be unlocked by managing your account
        subscription on{" "}
        <span className="font-semibold text-foreground">vyana.care</span>{" "}
        via any desktop or mobile browser.
      </p>
      <div className="mt-4 flex items-center justify-center gap-2 text-[11.5px] text-muted-foreground">
        <Globe className="h-3.5 w-3.5" />
        <span>Sign in with the same account to unlock Pro on this device.</span>
      </div>
    </div>
  );
}
