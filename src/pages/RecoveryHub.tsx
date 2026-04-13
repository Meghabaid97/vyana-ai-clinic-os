import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload, FileText, Shield, Heart, Loader2, Send, Bot, User,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Pill, Calendar,
  Building2, IndianRupee, ClipboardList, ArrowLeft,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface MedicalSummary {
  admissionDate?: string;
  dischargeDate?: string;
  primaryDiagnosis?: string;
  secondaryDiagnoses?: string[];
  proceduresPerformed?: string[];
  medicationsAtDischarge?: { name: string; dosage?: string; frequency?: string; duration?: string }[];
  followUpInstructions?: string[];
  keyFindings?: string[];
  allergiesNoted?: string[];
  dietaryInstructions?: string[];
  activityRestrictions?: string[];
}

interface InsuranceClaim {
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  hospitalName?: string;
  hospitalAddress?: string;
  admissionDate?: string;
  dischargeDate?: string;
  daysOfStay?: string;
  admissionType?: string;
  primaryDiagnosis?: string;
  icdCodes?: string[];
  procedureCodes?: string[];
  procedureDescriptions?: string[];
  treatingDoctorName?: string;
  treatingDoctorRegistration?: string;
  roomType?: string;
  billingItems?: { item: string; amount?: string }[];
  totalBillAmount?: string;
  preAuthorizationNumber?: string;
}

interface ExtractedData {
  medicalSummary: MedicalSummary;
  insuranceClaim: InsuranceClaim;
  confidence: string;
}

type ChatMsg = { role: "user" | "assistant"; content: string };

const RecoveryHub = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [uploading, setUploading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "claim" | "chat">("summary");
  const [showMedDetails, setShowMedDetails] = useState(true);
  const [showClaimDetails, setShowClaimDetails] = useState(true);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "File too large", description: "Max 10 MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    setExtracted(null);
    setChatMessages([]);

    try {
      const reader = new FileReader();
      const fileContent = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("process-discharge", {
        body: { fileName: file.name, fileType: file.type, fileContent },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setExtracted(data);
      toast({ title: "Discharge summary processed", description: "Medical summary and claim data extracted." });

      // Seed chat with welcome
      setChatMessages([{
        role: "assistant",
        content: `I've reviewed your discharge summary. Here's what I can help you with:\n\n- **Understanding your claim data** — what each field means\n- **Missing documents** — what you'll need to file\n- **Claim process** — cashless vs reimbursement steps\n- **Corrections** — if any extracted data looks wrong\n\nWhat would you like help with?`
      }]);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Processing failed", description: err.message || "Could not process discharge summary", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMsg = { role: "user", content: text };
    setChatInput("");
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    let assistantSoFar = "";
    const allMessages = [...chatMessages, userMsg];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insurance-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
            claimData: extracted?.insuranceClaim || {},
          }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setChatMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length > chatMessages.length + 1) {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      let done = false;
      while (!done) {
        const { done: rd, value } = await reader.read();
        if (rd) break;
        textBuffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nl);
          textBuffer = textBuffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch { textBuffer = line + "\n" + textBuffer; break; }
        }
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: "assistant", content: `Sorry, I ran into an error: ${err.message}. Please try again.` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const renderList = (items: string[] | undefined, fallback = "Not mentioned in document") => {
    if (!items?.length) return <p className="text-sm text-muted-foreground italic">{fallback}</p>;
    return (
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-foreground flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  };

  // ----------- RENDER -----------

  if (!extracted) {
    return (
      <div className="animate-fade-in px-4 sm:px-5 pt-4 pb-6 space-y-4">
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">Recovery Hub</h1>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                Upload your discharge summary — we'll prepare your insurance claim and a medical summary for every future visit.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
          <div className="flex flex-col items-center gap-4 py-6">
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-semibold text-foreground">Processing your discharge summary…</p>
                  <p className="text-sm text-muted-foreground mt-1">Extracting medical data and claim information</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Upload discharge summary</p>
                  <p className="text-sm text-muted-foreground mt-1">Photo or PDF · Max 10 MB</p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()} className="rounded-xl">
                  <Upload className="h-4 w-4 mr-2" /> Choose file
                </Button>
              </>
            )}
          </div>
        </section>

        <section className="space-y-2">
          {[
            { icon: FileText, text: "Get a doctor-ready medical summary for your next visit" },
            { icon: IndianRupee, text: "Auto-extract insurance claim data — no manual entry" },
            { icon: Bot, text: "Chat with AI to complete your claim filing" },
            { icon: Shield, text: "Your data stays private and is never shared without consent" },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <item.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-sm text-foreground">{item.text}</p>
            </div>
          ))}
        </section>
      </div>
    );
  }

  const { medicalSummary: ms, insuranceClaim: ic } = extracted;

  return (
    <div className="animate-fade-in flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => { setExtracted(null); setChatMessages([]); }} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Recovery Hub</h1>
          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${
            extracted.confidence === "high" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
            extracted.confidence === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {extracted.confidence} confidence
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {([
            { id: "summary" as const, label: "Medical Summary", icon: FileText },
            { id: "claim" as const, label: "Insurance Claim", icon: IndianRupee },
            { id: "chat" as const, label: "Claims Chat", icon: Bot },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden min-[400px]:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-6">
        {activeTab === "summary" && (
          <div className="space-y-3 pt-2">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground mb-1">Primary Diagnosis</p>
              <p className="font-semibold text-foreground">{ms.primaryDiagnosis || "—"}</p>
              {ms.admissionDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  {ms.admissionDate} → {ms.dischargeDate || "—"}
                </p>
              )}
            </div>

            {ms.secondaryDiagnoses?.length ? (
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Other Diagnoses</p>
                {renderList(ms.secondaryDiagnoses)}
              </div>
            ) : null}

            <div className="rounded-xl border border-border bg-card p-3">
              <button onClick={() => setShowMedDetails(!showMedDetails)} className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Medications at Discharge</span>
                  {ms.medicationsAtDischarge?.length ? (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{ms.medicationsAtDischarge.length}</span>
                  ) : null}
                </div>
                {showMedDetails ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {showMedDetails && ms.medicationsAtDischarge?.length ? (
                <div className="mt-2 space-y-2">
                  {ms.medicationsAtDischarge.map((med, i) => (
                    <div key={i} className="rounded-lg bg-muted/50 p-2.5">
                      <p className="text-sm font-medium text-foreground">{med.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {med.dosage && <span className="text-[11px] text-muted-foreground">{med.dosage}</span>}
                        {med.frequency && <span className="text-[11px] text-muted-foreground">· {med.frequency}</span>}
                        {med.duration && <span className="text-[11px] text-muted-foreground">· {med.duration}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Follow-up Instructions</span>
              </div>
              {renderList(ms.followUpInstructions)}
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Key Findings</p>
              {renderList(ms.keyFindings)}
            </div>

            {ms.dietaryInstructions?.length || ms.activityRestrictions?.length ? (
              <div className="rounded-xl border border-border bg-card p-3 space-y-3">
                {ms.dietaryInstructions?.length ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Diet</p>
                    {renderList(ms.dietaryInstructions)}
                  </div>
                ) : null}
                {ms.activityRestrictions?.length ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Activity Restrictions</p>
                    {renderList(ms.activityRestrictions)}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-xl border border-border bg-muted/50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  This summary contains only information extracted from your discharge document. It is not medical advice. Always consult your doctor for clinical decisions.
                </p>
              </div>
            </div>

            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full rounded-xl">
              <Upload className="h-4 w-4 mr-2" /> Upload another discharge summary
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUpload} />
          </div>
        )}

        {activeTab === "claim" && (
          <div className="space-y-3 pt-2">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Hospital Details</span>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-foreground font-medium">{ic.hospitalName || "—"}</p>
                {ic.hospitalAddress && <p className="text-muted-foreground text-xs">{ic.hospitalAddress}</p>}
                {ic.treatingDoctorName && (
                  <p className="text-muted-foreground text-xs">
                    Dr. {ic.treatingDoctorName} {ic.treatingDoctorRegistration ? `(${ic.treatingDoctorRegistration})` : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3">
              <button onClick={() => setShowClaimDetails(!showClaimDetails)} className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Claim Details</span>
                </div>
                {showClaimDetails ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {showClaimDetails && (
                <div className="mt-2 space-y-2">
                  {([
                    ["Patient", ic.patientName],
                    ["Age / Gender", [ic.patientAge, ic.patientGender].filter(Boolean).join(" / ") || null],
                    ["Admission", ic.admissionDate],
                    ["Discharge", ic.dischargeDate],
                    ["Stay", ic.daysOfStay ? `${ic.daysOfStay} days` : null],
                    ["Type", ic.admissionType],
                    ["Room", ic.roomType],
                    ["Diagnosis", ic.primaryDiagnosis],
                    ["Pre-Auth #", ic.preAuthorizationNumber],
                  ] as [string, string | null | undefined][]).filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-foreground font-medium text-right max-w-[60%]">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {ic.icdCodes?.length || ic.procedureCodes?.length ? (
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                {ic.icdCodes?.length ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">ICD Codes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ic.icdCodes.map((c, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-foreground">{c}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {ic.procedureDescriptions?.length ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Procedures</p>
                    {renderList(ic.procedureDescriptions)}
                  </div>
                ) : null}
              </div>
            ) : null}

            {ic.billingItems?.length ? (
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Billing Items</p>
                <div className="space-y-1.5">
                  {ic.billingItems.map((b, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-foreground">{b.item}</span>
                      {b.amount && <span className="text-foreground font-medium">₹{b.amount}</span>}
                    </div>
                  ))}
                  {ic.totalBillAmount && (
                    <div className="flex justify-between text-sm pt-1.5 border-t border-border">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-bold text-primary">₹{ic.totalBillAmount}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="rounded-xl border border-border bg-muted/50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  This claim data is auto-extracted and may contain errors. Please verify all details before submitting to your insurer. Use the Claims Chat for assistance.
                </p>
              </div>
            </div>

            <Button onClick={() => setActiveTab("chat")} className="w-full rounded-xl">
              <Bot className="h-4 w-4 mr-2" /> Get help filing your claim
            </Button>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="flex flex-col pt-2" style={{ minHeight: "calc(100vh - 260px)" }}>
            <div className="flex-1 space-y-3 pb-3">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="sticky bottom-0 pt-2 pb-1 bg-background">
              <div className="flex gap-2">
                <Textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                  placeholder="Ask about your claim process…"
                  className="min-h-[44px] max-h-[120px] rounded-xl resize-none text-sm"
                  rows={1}
                />
                <Button
                  onClick={sendChat}
                  disabled={!chatInput.trim() || chatLoading}
                  size="icon"
                  className="h-11 w-11 rounded-xl shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                AI assistant · Not legal or medical advice · Verify all details with your insurer
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecoveryHub;
