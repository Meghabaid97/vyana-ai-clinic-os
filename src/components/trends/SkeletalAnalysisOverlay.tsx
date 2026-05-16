import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import skeletalMeshHuman from "@/assets/skeletal-mesh-human.png";

interface Props {
  open: boolean;
  isAnalyzing: boolean;
  onClose: () => void;
  /** Optional context — fed into the progress steps */
  recordsCount?: number;
  snapshotsCount?: number;
  sourceFileName?: string | null;
}

const STEPS = [
  "Loading your latest report",
  "Scanning vitals & biomarkers",
  "Cross-checking medications",
  "Comparing against your history",
  "Flagging risks & recommendations",
  "Finalising your health snapshot",
];

const SkeletalAnalysisOverlay = ({
  open,
  isAnalyzing,
  onClose,
  recordsCount = 0,
  snapshotsCount = 0,
  sourceFileName,
}: Props) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);

  // Drive progress while analyzing. When analyzing ends, snap to "done".
  useEffect(() => {
    if (!open) return;
    if (!isAnalyzing) {
      setStepIdx(STEPS.length - 1);
      const t = setTimeout(() => setDone(true), 350);
      return () => clearTimeout(t);
    }
    setDone(false);
    setStepIdx(0);
    const interval = setInterval(() => {
      setStepIdx((i) => (i < STEPS.length - 2 ? i + 1 : i));
    }, 1100);
    return () => clearInterval(interval);
  }, [open, isAnalyzing]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStepIdx(0);
      setDone(false);
    }
  }, [open]);

  const progressPct = useMemo(() => {
    if (done) return 100;
    return Math.round(((stepIdx + 1) / STEPS.length) * 100);
  }, [stepIdx, done]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden border-primary/20 bg-background"
      >

        {/* Header */}
        <div className="px-5 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-bold tracking-tight text-foreground">
              {done ? "Analysis complete" : "Analyzing your health"}
            </h2>
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            {done
              ? "Snapshot ready. Scroll the report below."
              : "Reading every report, vital and medication. Just a moment."}
          </p>
        </div>

        {/* Skeletal mesh stage */}
        <div className="relative mx-5 mt-3 rounded-xl bg-gradient-to-b from-primary/5 via-background to-primary/5 border border-border overflow-hidden h-[280px]">
          {/* Scan beam */}
          {!done && (
            <div
              className="absolute inset-x-0 h-12 pointer-events-none z-10"
              style={{
                background:
                  "linear-gradient(180deg, transparent 0%, hsl(var(--primary)/0.18) 45%, hsl(var(--primary)/0.35) 50%, hsl(var(--primary)/0.18) 55%, transparent 100%)",
                animation: "vy-scan 2.4s ease-in-out infinite",
              }}
            />
          )}

          {/* Grid mesh background */}
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary)/0.18) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.18) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
              maskImage:
                "radial-gradient(ellipse at center, black 55%, transparent 80%)",
            }}
          />

          {/* Skeletal mesh human */}
          <img
            src={skeletalMeshHuman}
            alt="Skeletal mesh body scan"
            loading="lazy"
            width={512}
            height={896}
            className="absolute inset-0 m-auto h-[92%] w-auto object-contain select-none pointer-events-none"
            style={{
              filter: "drop-shadow(0 0 14px hsl(var(--primary)/0.45))",
            }}
          />

          {/* Pulsing focus dots — moving across regions */}
          {!done && (
            <>
              <span
                className="absolute h-2.5 w-2.5 rounded-full bg-primary"
                style={{
                  left: "50%",
                  top: "12%",
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 0 6px hsl(var(--primary)/0.18)",
                  animation: "vy-pulse 1.6s ease-out infinite",
                }}
              />
              <span
                className="absolute h-2.5 w-2.5 rounded-full bg-primary"
                style={{
                  left: "50%",
                  top: "38%",
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 0 6px hsl(var(--primary)/0.18)",
                  animation: "vy-pulse 1.6s ease-out 0.4s infinite",
                }}
              />
              <span
                className="absolute h-2.5 w-2.5 rounded-full bg-primary"
                style={{
                  left: "50%",
                  top: "70%",
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 0 6px hsl(var(--primary)/0.18)",
                  animation: "vy-pulse 1.6s ease-out 0.8s infinite",
                }}
              />
            </>
          )}

          {/* Done overlay */}
          {done && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
              <div className="flex flex-col items-center gap-1">
                <CheckCircle2 className="h-10 w-10 text-primary" />
                <p className="text-[12px] font-semibold text-foreground">Snapshot ready</p>
              </div>
            </div>
          )}

          {/* Inline keyframes (scoped via style tag) */}
          <style>{`
            @keyframes vy-scan {
              0%   { transform: translateY(-20%); opacity: 0.4; }
              50%  { transform: translateY(110%); opacity: 1; }
              100% { transform: translateY(-20%); opacity: 0.4; }
            }
            @keyframes vy-pulse {
              0%   { transform: translate(-50%, -50%) scale(0.6); opacity: 0.9; }
              70%  { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
              100% { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
            }
          `}</style>
        </div>

        {/* Progress bar */}
        <div className="px-5 pt-4">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-muted-foreground">
            <span>{progressPct}%</span>
            <span>
              {recordsCount} records · {snapshotsCount} snapshots
            </span>
          </div>
        </div>

        {/* Live steps */}
        <ul className="px-5 pt-3 pb-5 space-y-1.5">
          {STEPS.map((label, i) => {
            const active = !done && i === stepIdx;
            const complete = done || i < stepIdx;
            return (
              <li
                key={label}
                className={`flex items-center gap-2 text-[12.5px] transition-colors ${
                  complete
                    ? "text-foreground"
                    : active
                    ? "text-foreground"
                    : "text-muted-foreground/60"
                }`}
              >
                {complete ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-border shrink-0" />
                )}
                <span className="truncate">
                  {label}
                  {active && sourceFileName && i === 0 ? ` — ${sourceFileName}` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

export default SkeletalAnalysisOverlay;
