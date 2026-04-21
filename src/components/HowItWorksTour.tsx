import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Sparkles, TrendingUp, Stethoscope, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish?: () => void;
}

const steps = [
  {
    icon: Upload,
    eyebrow: "Step 1",
    title: "Upload anything",
    body: "A prescription photo, a lab PDF, a discharge summary. Snap it or upload it. That is all you do.",
    visual: (
      <div className="space-y-2">
        {["Lab report.pdf", "Prescription.jpg", "Discharge summary.pdf"].map((f, i) => (
          <div
            key={f}
            className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5 animate-fade-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
              <Upload className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-[12px] text-foreground truncate">{f}</span>
            <span className="ml-auto text-[10px] text-primary font-medium">Uploaded</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Sparkles,
    eyebrow: "Step 2",
    title: "AI extracts the details",
    body: "Medications, vitals, diagnoses, allergies. Pulled out and organized. You never type a thing.",
    visual: (
      <div className="space-y-2">
        {[
          { label: "Diagnosis", value: "Type 2 Diabetes" },
          { label: "Medication", value: "Metformin 500mg" },
          { label: "HbA1c", value: "5.8%" },
          { label: "BP", value: "128/82 mmHg" },
        ].map((item, i) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/10 px-3 py-2 animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <span className="text-[11px] text-muted-foreground">{item.label}</span>
            <span className="text-[12px] font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: TrendingUp,
    eyebrow: "Step 3",
    title: "Track what changes",
    body: "Upload more reports over time. We compare them and flag what is moving. Quietly, before it becomes a problem.",
    visual: (
      <div className="rounded-lg border border-border bg-card p-3.5">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-[11px] text-muted-foreground">HbA1c trend</span>
          <span className="text-[10px] text-primary font-medium">↑ Rising</span>
        </div>
        <div className="flex items-end gap-2 h-16">
          {[40, 50, 55, 65, 78].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-primary/30 rounded-t animate-fade-in"
              style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>Jan</span><span>Apr</span><span>Jul</span><span>Oct</span><span>Now</span>
        </div>
      </div>
    ),
  },
  {
    icon: Stethoscope,
    eyebrow: "Step 4",
    title: "Any doctor, in 30 seconds",
    body: "Generate a clean clinical summary. Share a secure 24-hour link. No app needed on their end.",
    visual: (
      <div className="rounded-lg border border-border bg-card p-3.5 space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Stethoscope className="h-4 w-4 text-primary" />
          <span className="text-[12px] font-semibold text-foreground">Doctor Summary</span>
        </div>
        {[
          "5 conditions tracked",
          "3 active medications",
          "12 vitals recorded",
          "Last visit: 2 weeks ago",
        ].map((line, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-[12px] text-foreground animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="h-1 w-1 rounded-full bg-primary" />
            {line}
          </div>
        ))}
      </div>
    ),
  },
];

const HowItWorksTour = ({ open, onOpenChange, onFinish }: Props) => {
  const [step, setStep] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      onOpenChange(false);
      onFinish?.();
    }
  };
  const prev = () => step > 0 && setStep(step - 1);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40) next();
    else if (dx > 40) prev();
    touchStartX.current = null;
  };

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-border">
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close tour"
          className="absolute right-3 top-3 z-10 h-8 w-8 rounded-full bg-background/80 hover:bg-muted flex items-center justify-center text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div
          className="bg-gradient-to-b from-primary/5 to-background p-6 pt-8"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-6">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={cn(
                  "h-1 rounded-full transition-all",
                  i === step ? "w-8 bg-primary" : "w-4 bg-muted"
                )}
              />
            ))}
          </div>

          {/* Animated content */}
          <div key={step} className="animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-primary">
                {current.eyebrow}
              </span>
            </div>

            <h2 className="text-[22px] font-bold text-foreground leading-tight tracking-tight mb-2">
              {current.title}
            </h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-5">
              {current.body}
            </p>

            <div className="mb-6">{current.visual}</div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={prev}
              disabled={step === 0}
              className="text-muted-foreground disabled:opacity-0"
            >
              Back
            </Button>
            <Button onClick={next} size="sm" className="px-5">
              {isLast ? "Start uploading" : "Next"}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksTour;
