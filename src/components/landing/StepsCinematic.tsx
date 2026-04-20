import { useReveal } from "@/hooks/use-reveal";
import { Upload, LineChart, FileText, Smartphone, Activity, Stethoscope, Lock } from "lucide-react";
import bg from "@/assets/landing-steps-hands.jpg";

type Step = {
  icon: typeof Upload;
  eyebrow: string;
  title: string;
  italic: string;
  body: string;
  pillIcon: typeof Smartphone;
  pillLabel: string;
  calloutTitle: string;
  calloutBody: string;
  mockup: "upload" | "trends" | "briefing";
};

const steps: Step[] = [
  {
    icon: Upload,
    eyebrow: "Step 01",
    title: "Hand us the paper.",
    italic: "Every yellowed prescription, every lab from a clinic you've forgotten the name of.",
    body: "Snap a photo. Drop a PDF. Forward the email. We read handwritten Hindi, printed Tamil, smudged Bengali. Five languages, twelve formats, one calm record.",
    pillIcon: Smartphone,
    pillLabel: "Mobile First",
    calloutTitle: "Private by default.",
    calloutBody: "Your records never train AI models. Encrypted at rest, only ever shared on your explicit consent.",
    mockup: "upload",
  },
  {
    icon: LineChart,
    eyebrow: "Step 02",
    title: "Watch the story emerge.",
    italic: "Thirty-three vitals, gathered patiently, year after year.",
    body: "HbA1c climbing in slow degrees. BP nudging upward each winter. The signals a fifteen-minute consult cannot see, finally where you can see them too.",
    pillIcon: Activity,
    pillLabel: "33 Vitals Tracked",
    calloutTitle: "Patterns, not predictions.",
    calloutBody: "We surface what's drifting and where to ask. Diagnosis stays with your doctor, always.",
    mockup: "trends",
  },
  {
    icon: FileText,
    eyebrow: "Step 03",
    title: "Walk in already understood.",
    italic: "One page. Thirty seconds. Your doctor reads it before you sit down.",
    body: "Diagnoses, medications, allergies, recent labs, last consult. A WhatsApp link the doctor opens on the way to the clinic, so the consultation begins with answers, not paperwork.",
    pillIcon: Stethoscope,
    pillLabel: "Doctor Ready",
    calloutTitle: "Shareable for 24 hours.",
    calloutBody: "Single-use links expire automatically. The doctor reads the briefing once and access closes itself.",
    mockup: "briefing",
  },
];

const UploadMockup = () => (
  <div
    className="rounded-2xl p-6 border w-full"
    style={{
      background: "hsl(22 25% 10% / 0.95)",
      borderColor: "hsl(36 25% 70% / 0.18)",
    }}
  >
    <p className="text-[10px] tracking-[0.25em] uppercase text-[hsl(155_45%_70%)] font-semibold mb-4">
      Records · Recently added
    </p>
    {[
      { name: "Discharge_Apollo_Mar24.pdf", tag: "Cardiology", tone: "hsl(14 70% 60%)" },
      { name: "HbA1c_lab_report.jpg", tag: "Lab · Diabetes", tone: "hsl(40 75% 60%)" },
      { name: "Rx_Dr_Iyer_handwritten.png", tag: "Prescription", tone: "hsl(155 45% 60%)" },
      { name: "MRI_lumbar_spine.pdf", tag: "Radiology", tone: "hsl(220 50% 65%)" },
    ].map((f, i) => (
      <div
        key={i}
        className="flex items-center justify-between py-3 border-t"
        style={{ borderColor: "hsl(36 25% 70% / 0.1)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center"
            style={{ background: f.tone.replace(")", " / 0.18)") }}
          >
            <FileText className="w-3.5 h-3.5" style={{ color: f.tone }} />
          </div>
          <p className="text-[12.5px] text-white truncate">{f.name}</p>
        </div>
        <span className="text-[10px] tracking-wider uppercase" style={{ color: f.tone }}>
          {f.tag}
        </span>
      </div>
    ))}
    <div
      className="mt-4 pt-3 border-t text-[11px] text-[hsl(36_20%_75%)]"
      style={{ borderColor: "hsl(36 25% 70% / 0.1)" }}
    >
      <span className="text-primary">●</span> Extracted 24 vitals · 6 medications · 2 diagnoses
    </div>
  </div>
);

const TrendsMockup = () => {
  const trends = [
    { label: "HbA1c", value: "6.4%", pct: 64, tone: "hsl(14 70% 60%)" },
    { label: "Systolic BP", value: "128", pct: 52, tone: "hsl(155 45% 60%)" },
    { label: "LDL", value: "118 mg/dL", pct: 71, tone: "hsl(40 75% 60%)" },
    { label: "eGFR", value: "82", pct: 78, tone: "hsl(155 45% 60%)" },
    { label: "TSH", value: "3.1", pct: 45, tone: "hsl(220 50% 65%)" },
    { label: "Vitamin D", value: "22 ng/mL", pct: 38, tone: "hsl(280 35% 65%)" },
  ];
  return (
    <div
      className="rounded-2xl p-6 border w-full"
      style={{
        background: "hsl(22 25% 10% / 0.95)",
        borderColor: "hsl(36 25% 70% / 0.18)",
      }}
    >
      <p className="text-[10px] tracking-[0.25em] uppercase text-[hsl(40_80%_72%)] font-semibold mb-5">
        Health trends · Last 24 months
      </p>
      <div className="space-y-4">
        {trends.map((t, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12.5px] text-[hsl(36_25%_82%)]">{t.label}</span>
              <span className="text-[12px] text-white font-medium tabular-nums">{t.value}</span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "hsl(36 25% 70% / 0.1)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${t.pct}%`, background: t.tone }}
              />
            </div>
          </div>
        ))}
      </div>
      <div
        className="mt-5 pt-4 border-t text-[11px] text-[hsl(36_20%_75%)] leading-relaxed"
        style={{ borderColor: "hsl(36 25% 70% / 0.1)" }}
      >
        <span className="text-primary font-medium">Pattern noted:</span> HbA1c trending up
        0.4 over six months. Worth a conversation at your next visit.
      </div>
    </div>
  );
};

const BriefingMockup = () => (
  <div
    className="rounded-2xl p-6 border w-full"
    style={{
      background: "hsl(22 25% 10% / 0.95)",
      borderColor: "hsl(36 25% 70% / 0.18)",
    }}
  >
    <div className="flex items-center justify-between mb-5">
      <p className="text-[10px] tracking-[0.25em] uppercase text-[hsl(14_70%_72%)] font-semibold">
        Clinical Briefing · Mrs. R. Iyer, 67
      </p>
      <span className="text-[10px] text-[hsl(36_20%_60%)]">1 page</span>
    </div>
    {[
      { h: "Active diagnoses", b: "Type 2 Diabetes (2018) · Hypertension (2020) · Hypothyroidism (2015)" },
      { h: "Current medications", b: "Metformin 500mg BD · Telmisartan 40mg OD · Levothyroxine 50mcg OD" },
      { h: "Recent labs", b: "HbA1c 6.4% (Mar) · LDL 118 · eGFR 82 · TSH 3.1" },
      { h: "Allergies", b: "Sulfa drugs (rash, 2012)" },
      { h: "Last consult", b: "Dr. Iyer, Apollo · 12 Mar · BP review" },
    ].map((s, i) => (
      <div
        key={i}
        className="py-2.5 border-t"
        style={{ borderColor: "hsl(36 25% 70% / 0.1)" }}
      >
        <p className="text-[10px] tracking-[0.2em] uppercase text-[hsl(155_45%_70%)] mb-1">
          {s.h}
        </p>
        <p className="text-[12px] text-[hsl(36_25%_88%)] leading-relaxed">{s.b}</p>
      </div>
    ))}
    <div
      className="mt-3 pt-3 border-t flex items-center gap-2 text-[11px] text-primary"
      style={{ borderColor: "hsl(36 25% 70% / 0.1)" }}
    >
      ● Shareable · 24-hour secure link
    </div>
  </div>
);

const Mockup = ({ kind }: { kind: Step["mockup"] }) => {
  if (kind === "upload") return <UploadMockup />;
  if (kind === "trends") return <TrendsMockup />;
  return <BriefingMockup />;
};

const StepRow = ({ step, index }: { step: Step; index: number }) => {
  const reveal = useReveal<HTMLDivElement>();
  const Icon = step.icon;
  const PillIcon = step.pillIcon;
  const reverse = index % 2 === 1;
  return (
    <div
      ref={reveal.ref}
      className={`reveal ${reveal.visible ? "is-visible" : ""} grid lg:grid-cols-2 gap-12 lg:gap-20 items-center py-20 lg:py-32`}
    >
      {/* Text */}
      <div className={reverse ? "lg:order-2" : ""}>
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-6 border"
          style={{
            background: "hsl(22 25% 12% / 0.7)",
            borderColor: "hsl(36 25% 70% / 0.25)",
          }}
        >
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <p className="font-mono text-[11px] tracking-wider text-primary mb-5">
          {step.eyebrow.replace(/^Step\s*0?/, "0").replace(/^0(\d)/, "0$1 —")}
        </p>
        <h3 className="font-serif text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.05] tracking-[-0.02em] text-white mb-5">
          {step.title}
        </h3>
        <p className="font-serif italic text-[19px] text-[hsl(36_30%_88%)] leading-relaxed max-w-[460px] mb-4">
          {step.italic}
        </p>
        <p className="text-[15px] text-[hsl(36_22%_75%)] leading-[1.7] max-w-[460px]">
          {step.body}
        </p>
      </div>

      {/* Mockup column */}
      <div className={`${reverse ? "lg:order-1" : ""} space-y-5`}>
        {/* Centered colored pill — like "iPad First" in the reference */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-[12px] font-medium shadow-lg shadow-primary/30">
            <PillIcon className="w-3.5 h-3.5" />
            {step.pillLabel}
          </div>
        </div>

        {/* Ivory callout banner — like the TestFlight callout in the reference */}
        <div className="max-w-[460px] mx-auto rounded-xl bg-[hsl(36_30%_96%)] px-4 py-3 flex items-start gap-3 shadow-xl">
          <div className="w-7 h-7 rounded-md bg-[hsl(22_28%_9%)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lock className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-[12.5px] text-[hsl(22_28%_15%)] leading-[1.5]">
            <span className="font-semibold">{step.calloutTitle}</span>{" "}
            <span className="text-[hsl(22_15%_40%)]">{step.calloutBody}</span>
          </p>
        </div>

        {/* The mockup itself */}
        <div
          className="max-w-[460px] mx-auto"
          style={{ filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.55))" }}
        >
          <Mockup kind={step.mockup} />
        </div>
      </div>
    </div>
  );
};

const StepsCinematic = () => {
  const header = useReveal<HTMLDivElement>();

  return (
    <section
      id="steps"
      className="relative overflow-hidden bg-[hsl(22_28%_9%)]"
    >
      {/* Sepia statue backdrop — fixed parallax, warm veil */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
          backgroundAttachment: "fixed",
        }}
        aria-hidden
      >
        <div className="absolute inset-0 bg-[hsl(22_28%_9%/0.9)]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 75% 65% at 50% 50%, transparent 0%, hsl(22 28% 6% / 0.55) 100%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[hsl(22_28%_9%)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[hsl(22_28%_9%)] to-transparent" />
      </div>

      {/* Starfield */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => {
          const seed = (i * 9301 + 49297) % 233280;
          const top = seed % 100;
          const left = (seed * 7) % 100;
          const size = ((seed % 3) + 1) * 0.6;
          const delay = (seed % 40) / 10;
          const isAmber = i % 8 === 0;
          return (
            <div
              key={i}
              className="absolute rounded-full animate-soft-float"
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: `${size * 2}px`,
                height: `${size * 2}px`,
                background: isAmber ? "hsl(14 62% 60%)" : "hsl(36 30% 88%)",
                opacity: isAmber ? 0.85 : 0.5,
                animationDelay: `${delay}s`,
                boxShadow: isAmber
                  ? "0 0 8px hsl(14 62% 54% / 0.7)"
                  : "0 0 4px hsl(36 30% 90% / 0.4)",
              }}
            />
          );
        })}
      </div>

      <div className="relative z-10 max-w-[1240px] mx-auto px-6 lg:px-12 pt-28 pb-20">
        {/* Header */}
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-12`}
        >
          <p className="font-serif italic text-[15px] text-[hsl(36_25%_85%)] mb-5">
            In action
          </p>
          <h2 className="font-serif text-4xl sm:text-6xl lg:text-[72px] leading-[1.0] tracking-[-0.02em] text-white">
            Pick a moment.
            <br />
            <em className="italic text-primary font-normal">Live it together.</em>
          </h2>
          <p className="mt-6 font-serif italic text-[18px] text-[hsl(36_25%_85%)] leading-relaxed max-w-[560px]">
            Three small acts, repeated quietly across the years, become the
            difference between a panicked midnight and a calm conversation.
          </p>
        </div>

        {steps.map((s, i) => (
          <StepRow key={i} step={s} index={i} />
        ))}
      </div>
    </section>
  );
};

export default StepsCinematic;
