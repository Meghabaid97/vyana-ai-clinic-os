import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Clock, Check, FileText, MessageCircle, Copy, Loader2 } from "lucide-react";

type Stage =
  | "form"        // ask for recipient name
  | "packaging"   // card folds
  | "locking"    // lock clicks shut
  | "timing"      // 24h timer starts ticking
  | "ready";     // copied to WhatsApp

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Async creator. Should return the share URL once persisted. */
  onCreate: (recipientName: string) => Promise<string | null>;
  /** Called once the ceremony completes successfully. */
  onComplete?: () => void;
}

const ShareCeremonySheet = ({ open, onOpenChange, onCreate, onComplete }: Props) => {
  const [stage, setStage] = useState<Stage>("form");
  const [recipientName, setRecipientName] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset whenever the sheet closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStage("form");
        setRecipientName("");
        setShareUrl(null);
        setError(null);
        setCopied(false);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  const runCeremony = async () => {
    setError(null);
    setStage("packaging");

    // 1. Card folds (packaging) — 700ms
    await new Promise((r) => setTimeout(r, 700));

    // Kick off the actual create in parallel with the ceremony
    const createPromise = onCreate(recipientName.trim());

    // 2. Lock clicks shut — 600ms
    setStage("locking");
    await new Promise((r) => setTimeout(r, 600));

    // 3. Timer starts ticking — 700ms
    setStage("timing");
    await new Promise((r) => setTimeout(r, 700));

    // Wait for the actual link to be ready (already running in background)
    const url = await createPromise;
    if (!url) {
      setError("Could not create your share link. Please try again.");
      setStage("form");
      return;
    }
    setShareUrl(url);

    // Try to copy to clipboard so the user can paste into WhatsApp
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }

    setStage("ready");
    onComplete?.();
  };

  const openWhatsApp = () => {
    if (!shareUrl) return;
    const msg = encodeURIComponent(
      `Here are my health records, valid for 24 hours:\n${shareUrl}`,
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const copyAgain = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      /* noop */
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-border bg-background px-0 pb-6 pt-5 max-h-[92svh]"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-muted mb-4" aria-hidden />

        {stage === "form" ? (
          <div className="px-6">
            <SheetHeader className="text-left space-y-1.5">
              <SheetTitle className="text-[20px] font-bold tracking-[-0.01em]">
                Share with your doctor
              </SheetTitle>
              <SheetDescription className="text-[13px] text-muted-foreground leading-relaxed">
                We'll package your briefing into a secure link that expires in 24 hours.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 space-y-2">
              <label className="text-[12px] font-medium text-foreground">
                Doctor's name <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                placeholder="e.g. Dr. Sharma"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                autoFocus
              />
              {error && (
                <p className="text-[12px] text-destructive">{error}</p>
              )}
            </div>

            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={runCeremony}>
                Package & share
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-6">
            {/* Stage visual */}
            <div className="relative mx-auto h-[180px] w-full max-w-[280px] flex items-center justify-center">
              {/* Card folding */}
              <div
                className="absolute inset-x-6 top-2 rounded-2xl border border-primary/20 bg-card shadow-sm transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  transformOrigin: "top center",
                  transform:
                    stage === "packaging"
                      ? "scaleY(1) translateY(0)"
                      : "scaleY(0.45) translateY(-6px)",
                  opacity: stage === "packaging" ? 1 : 0.55,
                  height: 120,
                }}
                aria-hidden
              >
                <div className="flex items-center gap-2 px-4 pt-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-[11px] font-semibold text-foreground">
                    Clinical briefing
                  </span>
                </div>
                <div className="px-4 pt-3 space-y-1.5">
                  <div className="h-1.5 w-3/4 rounded-full bg-muted" />
                  <div className="h-1.5 w-1/2 rounded-full bg-muted" />
                  <div className="h-1.5 w-2/3 rounded-full bg-muted" />
                </div>
              </div>

              {/* Lock */}
              <div
                className="absolute inset-x-0 top-[60px] flex justify-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  opacity: stage === "locking" || stage === "timing" || stage === "ready" ? 1 : 0,
                  transform:
                    stage === "locking" || stage === "timing" || stage === "ready"
                      ? "scale(1) translateY(0)"
                      : "scale(0.7) translateY(8px)",
                }}
                aria-hidden
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
              </div>

              {/* Timer ring */}
              <div
                className="absolute inset-x-0 bottom-2 flex justify-center transition-all duration-500 ease-out"
                style={{
                  opacity: stage === "timing" || stage === "ready" ? 1 : 0,
                  transform:
                    stage === "timing" || stage === "ready"
                      ? "translateY(0)"
                      : "translateY(8px)",
                }}
                aria-hidden
              >
                <div className="flex items-center gap-1.5 rounded-full bg-muted/70 border border-border px-3 py-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary share-timer-tick" />
                  <span className="text-[11px] font-semibold text-foreground tabular-nums">
                    24:00:00 left
                  </span>
                </div>
              </div>

              {/* Success check */}
              <div
                className="absolute inset-0 flex items-center justify-center transition-all duration-400 ease-out"
                style={{
                  opacity: stage === "ready" ? 1 : 0,
                  transform: stage === "ready" ? "scale(1)" : "scale(0.6)",
                }}
                aria-hidden
              >
                <div className="h-16 w-16 rounded-full bg-status-normal/15 border border-status-normal/40 flex items-center justify-center">
                  <Check className="h-8 w-8 text-status-normal" strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Stage label */}
            <p className="mt-2 text-center text-[13px] font-medium text-foreground min-h-[20px]">
              {stage === "packaging" && "Packaging your briefing…"}
              {stage === "locking" && "Locking it down…"}
              {stage === "timing" && "Starting 24-hour timer…"}
              {stage === "ready" && (copied ? "Copied. Ready to share on WhatsApp." : "Ready to share.")}
            </p>

            {stage === "ready" && (
              <div className="mt-5 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={copyAgain}>
                  {copied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
                <Button className="flex-1" onClick={openWhatsApp}>
                  <MessageCircle className="h-4 w-4 mr-1.5" />
                  Open WhatsApp
                </Button>
              </div>
            )}

            {(stage === "packaging" || stage === "locking" || stage === "timing") && (
              <div className="mt-5 flex items-center justify-center gap-2 text-[12px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Securing the link
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ShareCeremonySheet;
