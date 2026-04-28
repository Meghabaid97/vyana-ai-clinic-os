import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, X, ExternalLink, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

interface Citation {
  url: string;
  title: string;
  host: string;
  tier: 1 | 2 | 3;
}

interface AskVyanaResult {
  answer: string;
  citations: Citation[];
  confidence: "high" | "moderate" | "low";
  disclaimer: string;
}

interface Props {
  open: boolean;
  initialQuestion: string;
  onClose: () => void;
}

const SUGGESTIONS = [
  "What does HbA1c 8.1 mean?",
  "Is atorvastatin safe with grapefruit?",
  "How can I lower LDL cholesterol naturally?",
  "What are early signs of kidney problems?",
];

const confidenceStyle = {
  high: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", label: "High confidence" },
  moderate: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200", label: "Moderate confidence" },
  low: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200", label: "Low confidence" },
} as const;

const AskVyanaModal = ({ open, initialQuestion, onClose }: Props) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskVyanaResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuestion(initialQuestion);
      setResult(null);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, initialQuestion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const ask = async (q: string) => {
    if (q.trim().length < 3) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Lightweight personalization: pass conditions and active meds if available
      const { data: { session } } = await supabase.auth.getSession();
      let context = "";
      if (session) {
        const { data: patient } = await supabase
          .from("patients").select("id, age").eq("user_id", session.user.id).maybeSingle();
        if (patient) {
          const { data: meds } = await supabase
            .from("medication_reminders")
            .select("medication_name, dosage")
            .eq("patient_id", patient.id)
            .eq("is_active", true)
            .limit(8);
          const medList = (meds ?? []).map((m) => `${m.medication_name}${m.dosage ? ` ${m.dosage}` : ""}`).join(", ");
          const parts: string[] = [];
          if (patient.age) parts.push(`age ${patient.age}`);
          if (medList) parts.push(`meds: ${medList}`);
          context = parts.join("; ");
        }
      }

      const { data, error: fnErr } = await supabase.functions.invoke("ask-vyana", {
        body: { question: q, context },
      });
      if (fnErr) throw fnErr;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setResult(data as AskVyanaResult);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void ask(question);
  };

  if (!open) return null;
  const conf = result ? confidenceStyle[result.confidence] : null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] h-[100svh] w-screen overflow-hidden bg-foreground/40 backdrop-blur-sm flex items-stretch justify-center lg:items-start lg:px-4 lg:pt-[6vh]"
      onClick={onClose}
    >
      <div
        className="w-full bg-background shadow-2xl border-0 h-[100svh] overflow-hidden flex flex-col lg:h-auto lg:max-h-[88vh] lg:max-w-2xl lg:rounded-2xl lg:border lg:border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / input */}
        <form onSubmit={onSubmit} className="border-b border-border p-4 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <input
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about your health…"
            maxLength={500}
            className="flex-1 bg-transparent outline-none text-[15px] text-foreground placeholder:text-muted-foreground"
          />
          <Button type="submit" size="sm" disabled={loading || question.trim().length < 3} className="h-8">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
          </Button>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center" aria-label="Close">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </form>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Empty state */}
          {!loading && !result && !error && (
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/15 p-3">
                <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                  Answers are grounded in trusted medical sources (PubMed, NIH, WHO, Mayo, CDC, NHS, ICMR, AIIMS).
                  Educational information only, never a substitute for your doctor.
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">Try asking</p>
                <div className="grid gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setQuestion(s); void ask(s); }}
                      className="text-left text-[13px] text-foreground rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 px-3 py-2 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Searching trusted medical sources…</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="p-5">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Couldn't get an answer</p>
                  <p className="text-[13px] text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="p-5 space-y-5">
              {/* Confidence + disclaimer */}
              <div className="flex flex-wrap items-center gap-2">
                {conf && (
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ring-1 ${conf.bg} ${conf.text} ${conf.ring}`}>
                    <ShieldCheck className="h-3 w-3" />
                    {conf.label}
                  </span>
                )}
                <span className="text-[11px] text-muted-foreground">{result.citations.length} sources</span>
              </div>

              {/* Answer */}
              <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-headings:font-bold prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                <ReactMarkdown>{result.answer}</ReactMarkdown>
              </div>

              {/* Citations */}
              {result.citations.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">Sources</p>
                  <div className="space-y-2">
                    {result.citations.map((c, i) => (
                      <a
                        key={c.url + i}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 rounded-lg border border-border hover:border-primary/40 p-3 transition-colors group"
                      >
                        <span className={`shrink-0 mt-0.5 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded text-[10px] font-bold ${
                          c.tier === 1 ? "bg-emerald-100 text-emerald-700"
                          : c.tier === 2 ? "bg-amber-100 text-amber-700"
                          : "bg-muted text-muted-foreground"
                        }`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">{c.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{c.host}</p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-3">
                {result.disclaimer}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AskVyanaModal;
