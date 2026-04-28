import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock, Check, MessageCircle, Copy, Loader2, QrCode, Mail, Link2, ArrowLeft,
} from "lucide-react";

type Stage = "form" | "creating" | "ready" | "qr";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Async creator. Should return the share URL once persisted. */
  onCreate: (recipientName: string) => Promise<string | null>;
  /** Called once the link is created successfully. */
  onComplete?: () => void;
}

const ShareCeremonySheet = ({ open, onOpenChange, onCreate, onComplete }: Props) => {
  const [stage, setStage] = useState<Stage>("form");
  const [recipientName, setRecipientName] = useState("");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Reset whenever the sheet closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStage("form");
        setRecipientName("");
        setShareUrl(null);
        setError(null);
        setCopied(false);
        setQrDataUrl(null);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Generate QR whenever we enter the qr stage
  useEffect(() => {
    if (stage !== "qr" || !shareUrl) return;
    let cancelled = false;
    QRCode.toDataURL(shareUrl, {
      margin: 1,
      width: 480,
      color: { dark: "#0f172a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); });
    return () => { cancelled = true; };
  }, [stage, shareUrl]);

  const createLink = async () => {
    setError(null);
    setStage("creating");
    const url = await onCreate(recipientName.trim());
    if (!url) {
      setError("Could not create your share link. Please try again.");
      setStage("form");
      return;
    }
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
    setStage("ready");
    onComplete?.();
  };

  const shareMessage = (url: string) =>
    `Here are my health records (secure link, valid 24 hours): ${url}`;

  const openWhatsApp = () => {
    if (!shareUrl) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage(shareUrl))}`, "_blank", "noopener,noreferrer");
  };

  const openEmail = () => {
    if (!shareUrl) return;
    const subject = encodeURIComponent("My health records from Vyana");
    const body = encodeURIComponent(shareMessage(shareUrl));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
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

        {/* ============ FORM ============ */}
        {stage === "form" && (
          <div className="px-6">
            <SheetHeader className="text-left space-y-1.5">
              <SheetTitle className="text-[20px] font-bold tracking-[-0.01em]">
                Share with your doctor
              </SheetTitle>
              <SheetDescription className="text-[13px] text-muted-foreground leading-relaxed">
                We'll create a secure link to your briefing that expires in 24 hours.
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
              {error && <p className="text-[12px] text-destructive">{error}</p>}
            </div>

            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={createLink}>
                Create secure link
              </Button>
            </div>
          </div>
        )}

        {/* ============ CREATING ============ */}
        {stage === "creating" && (
          <div className="px-6 py-10 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-[13px] text-muted-foreground">Creating your secure link…</p>
          </div>
        )}

        {/* ============ READY ============ */}
        {stage === "ready" && shareUrl && (
          <div className="px-6">
            {/* Link card — same visual language as Share Records list */}
            <div className="rounded-xl border border-primary/20 bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Link2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-foreground truncate">
                      {recipientName.trim() || "Secure link"}
                    </p>
                    <span className="text-[9px] font-semibold uppercase tracking-wide bg-green-500/10 text-green-700 border border-green-500/20 rounded px-1.5 py-0.5">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">Expires in 24 hours</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action row — mirrors /app/share buttons */}
            <div className="mt-4 grid grid-cols-4 gap-2">
              <Button variant="outline" size="sm" onClick={openWhatsApp} className="h-10 flex-col gap-0.5 text-[10px] font-medium">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={openEmail} className="h-10 flex-col gap-0.5 text-[10px] font-medium">
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStage("qr")} className="h-10 flex-col gap-0.5 text-[10px] font-medium">
                <QrCode className="h-4 w-4" />
                QR
              </Button>
              <Button variant="outline" size="sm" onClick={copyAgain} className="h-10 flex-col gap-0.5 text-[10px] font-medium">
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              {copied ? "Link copied to your clipboard." : "Choose how you want to share."}
            </p>

            <Button className="mt-5 w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        )}

        {/* ============ QR ============ */}
        {stage === "qr" && (
          <div className="px-6">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setStage("ready")}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                <Clock className="h-3 w-3" /> Expires in 24h
              </span>
            </div>

            <div className="mx-auto flex h-[260px] w-[260px] items-center justify-center rounded-2xl border border-border bg-background p-4 shadow-sm">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Scan to open the secure share link"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
            </div>

            <p className="mt-4 text-center text-[13px] font-medium text-foreground">
              Ask the doctor to scan
            </p>
            <p className="mt-1 text-center text-[12px] text-muted-foreground">
              Their phone camera will open your records. No app needed.
            </p>

            <Button className="mt-5 w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ShareCeremonySheet;
