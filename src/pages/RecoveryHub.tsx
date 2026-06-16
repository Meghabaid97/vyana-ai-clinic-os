import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { fetchActivePatient, onActivePatientChange } from "@/lib/activePatient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload, FileText, Shield, Heart, Loader2, Send, Bot, User as UserIcon,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Pill, Calendar,
  Building2, IndianRupee, ClipboardList, ArrowLeft, ArrowRight, X,
  Camera, File, Check, Circle, Download, MessageSquare, FolderOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";
import { generateClaimPdf } from "@/lib/claimPdfGenerator";
import {
  saveToHealthRecords,
  summarizeHealthRecord,
  createMedicationReminders,
} from "@/lib/healthRecordsPipeline";
import { mapDocCategoryToRecord } from "@/lib/recordCategories";
import { useLanguage } from "@/lib/i18n";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PaywallSheet } from "@/components/paywall/PaywallSheet";
import { Sparkles, Lock } from "lucide-react";

// ─── Types ───

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

interface UploadedDoc {
  id: string;
  file: File;
  category: DocCategory;
  preview?: string;
  status: "pending" | "uploaded";
  fromHealthRecord?: boolean;
  healthRecordName?: string;
}

type DocCategory =
  | "discharge_summary"
  | "hospital_bill"
  | "investigation_reports"
  | "prescriptions"
  | "insurance_claim_form"
  | "admission_note"
  | "id_proof"
  | "insurance_card"
  | "other";

const DOC_CATEGORIES: { id: DocCategory; labelKey: string; required: boolean; icon: typeof FileText }[] = [
  { id: "discharge_summary", labelKey: "rec.cat.discharge", required: true, icon: FileText },
  { id: "hospital_bill", labelKey: "rec.cat.bill", required: true, icon: IndianRupee },
  { id: "investigation_reports", labelKey: "rec.cat.investigations", required: true, icon: ClipboardList },
  { id: "prescriptions", labelKey: "rec.cat.prescriptions", required: true, icon: Pill },
  { id: "insurance_claim_form", labelKey: "rec.cat.claimForm", required: true, icon: File },
  { id: "admission_note", labelKey: "rec.cat.admission", required: false, icon: FileText },
  { id: "id_proof", labelKey: "rec.cat.idProof", required: false, icon: Shield },
  { id: "insurance_card", labelKey: "rec.cat.insuranceCard", required: false, icon: Heart },
];

interface InsuranceDetails {
  insuranceCompany: string;
  policyNumber: string;
  claimType: "cashless" | "reimbursement" | "";
  policyHolderName: string;
  policyHolderRelation: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  tpaName: string;
}

type ChatMsg = { role: "user" | "assistant"; content: string };

type Step = "upload" | "insurance" | "review" | "chat";

// ─── Component ───

const ClaimAssistant = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [activeCategory, setActiveCategory] = useState<DocCategory>("discharge_summary");
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [savingToRecords, setSavingToRecords] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedRecordIds, setSavedRecordIds] = useState<Set<string>>(new Set());
  const [remindersCreated, setRemindersCreated] = useState(0);

  const [insurance, setInsurance] = useState<InsuranceDetails>({
    insuranceCompany: "", policyNumber: "", claimType: "",
    policyHolderName: "", policyHolderRelation: "self",
    bankName: "", bankAccountNumber: "", bankIfsc: "", tpaName: "",
  });

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Health records picker
  const [showRecordsPicker, setShowRecordsPicker] = useState(false);
  const [pickerCategory, setPickerCategory] = useState<DocCategory>("discharge_summary");
  const [healthRecords, setHealthRecords] = useState<Array<{ id: string; file_name: string; file_path: string; file_type: string; file_size: number; uploaded_at: string; category: string }>>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [downloadingRecord, setDownloadingRecord] = useState<string | null>(null);

  // Load patient context
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);
      const patient = await fetchActivePatient<{ id: string }>("id");
      if (patient) setPatientId(patient.id);
      else setPatientId(null);
    };
    void load();
    const off = onActivePatientChange(() => { void load(); });
    return () => off();
  }, [navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ─── Document upload ───

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newDocs: UploadedDoc[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      category: activeCategory,
      status: "uploaded" as const,
    }));

    // Generate previews for images
    for (const doc of newDocs) {
      if (doc.file.type.startsWith("image/")) {
        doc.preview = URL.createObjectURL(doc.file);
      }
    }

    setDocs(prev => [...prev, ...newDocs]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Auto-save each file to health records in background, tagged with the chosen category
    if (patientId && userId) {
      for (const doc of newDocs) {
        const recordCategory = mapDocCategoryToRecord(doc.category);
        saveToHealthRecords(doc.file, patientId, userId, recordCategory)
          .then(async (result) => {
            if (!result) return;
            setSavedRecordIds(prev => new Set([...prev, doc.id]));
            // Trigger AI summary in background
            summarizeHealthRecord(result.recordId, result.filePath, doc.file.name, doc.file.type)
              .catch(err => console.error("Background summary failed:", err));
          })
          .catch(err => console.error("Background save failed:", err));
      }
    }
  };

  const removeDoc = (id: string) => {
    setDocs(prev => {
      const doc = prev.find(d => d.id === id);
      if (doc?.preview) URL.revokeObjectURL(doc.preview);
      return prev.filter(d => d.id !== id);
    });
  };

  const openRecordsPicker = async (category: DocCategory) => {
    setPickerCategory(category);
    setShowRecordsPicker(true);
    if (healthRecords.length === 0 && patientId) {
      setLoadingRecords(true);
      try {
        const { data } = await supabase
          .from("health_records")
          .select("id, file_name, file_path, file_type, file_size, uploaded_at, category")
          .eq("patient_id", patientId)
          .order("uploaded_at", { ascending: false });
        setHealthRecords(data || []);
      } catch (err) {
        console.error("Failed to load health records:", err);
      } finally {
        setLoadingRecords(false);
      }
    }
  };

  const pickHealthRecord = async (record: { id: string; file_name: string; file_path: string; file_type: string; file_size: number }) => {
    setDownloadingRecord(record.id);
    try {
      const { data } = await supabase.storage
        .from("health-records")
        .download(record.file_path);
      if (!data) throw new Error("Could not download file");

      const file = new window.File([data], record.file_name, { type: record.file_type });
      const newDoc: UploadedDoc = {
        id: crypto.randomUUID(),
        file,
        category: pickerCategory,
        status: "uploaded",
        fromHealthRecord: true,
        healthRecordName: record.file_name,
      };
      if (file.type.startsWith("image/")) {
        newDoc.preview = URL.createObjectURL(data);
      }
      setDocs(prev => [...prev, newDoc]);
      setShowRecordsPicker(false);
      toast({ title: t("rec.toast.attachedTitle"), description: `${record.file_name} → ${t(DOC_CATEGORIES.find(c => c.id === pickerCategory)?.labelKey || "")}` });
    } catch (err: any) {
      console.error(err);
      toast({ title: t("rec.toast.attachFailTitle"), description: err.message, variant: "destructive" });
    } finally {
      setDownloadingRecord(null);
    }
  };

  const getDocsForCategory = (cat: DocCategory) => docs.filter(d => d.category === cat);
  const hasDischarge = docs.some(d => d.category === "discharge_summary");

  // ─── Extract from discharge summary ───

  const extractDischargeData = async () => {
    const dischargeDocs = getDocsForCategory("discharge_summary");
    if (!dischargeDocs.length) {
      toast({ title: t("rec.toast.noDischargeTitle"), description: t("rec.toast.noDischargeDesc"), variant: "destructive" });
      return;
    }

    setExtracting(true);
    try {
      const file = dischargeDocs[0].file;
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
      toast({ title: t("rec.toast.gotItTitle"), description: t("rec.toast.gotItDesc") });

      // Auto-create medication reminders from extracted medications
      if (patientId && data?.medicalSummary?.medicationsAtDischarge?.length) {
        try {
          const count = await createMedicationReminders(
            patientId,
            data.medicalSummary.medicationsAtDischarge,
          );
          if (count > 0) {
            setRemindersCreated(count);
            toast({
              title: t(count === 1 ? "rec.reminders.created" : "rec.reminders.createdPlural", { count }),
              description: t("rec.reminders.desc"),
            });
          }
        } catch (err) {
          console.error("Failed to create medication reminders:", err);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: t("rec.toast.cantReadTitle"), description: err.message || t("rec.toast.cantReadDesc"), variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  // ─── Missing items detection ───

  const getMissingItems = () => {
    const missing: string[] = [];

    // Required docs
    const requiredCats = DOC_CATEGORIES.filter(c => c.required);
    for (const cat of requiredCats) {
      if (!docs.some(d => d.category === cat.id)) {
        missing.push(t(cat.labelKey));
      }
    }

    // Insurance details
    if (!insurance.insuranceCompany) missing.push(t("rec.miss.company"));
    if (!insurance.policyNumber) missing.push(t("rec.miss.policyNum"));
    if (!insurance.claimType) missing.push(t("rec.miss.claimType"));

    // Bank details for reimbursement
    if (insurance.claimType === "reimbursement") {
      if (!insurance.bankName) missing.push(t("rec.miss.bankName"));
      if (!insurance.bankAccountNumber) missing.push(t("rec.miss.bankAccount"));
      if (!insurance.bankIfsc) missing.push(t("rec.miss.bankIfsc"));
    }

    return missing;
  };

  // ─── Chat ───

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
            claimData: {
              ...(extracted?.insuranceClaim || {}),
              insurance: insurance,
              uploadedDocuments: docs.map(d => d.category),
              missingItems: getMissingItems(),
            },
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
      setChatMessages(prev => [...prev, { role: "assistant", content: t("rec.chat.error", { msg: err.message }) }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ─── PDF generation ───

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      await generateClaimPdf({
        extracted: extracted || undefined,
        insurance,
        uploadedCategories: docs.map(d => d.category),
      });
      toast({ title: t("rec.toast.pdfReadyTitle"), description: t("rec.toast.pdfReadyDesc") });
    } catch (err: any) {
      console.error(err);
      toast({ title: t("rec.toast.pdfFailTitle"), description: err.message, variant: "destructive" });
    } finally {
      setGeneratingPdf(false);
    }
  };

  // ─── Render helpers ───

  const renderList = (items: string[] | undefined, fallback = "Not mentioned") => {
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

  const stepIndex = ["upload", "insurance", "review", "chat"].indexOf(step);
  const steps = [
    { id: "upload", label: t("rec.step.documents") },
    { id: "insurance", label: t("rec.step.insurance") },
    { id: "review", label: t("rec.step.review") },
    { id: "chat", label: t("rec.step.assistant") },
  ];

  const missingItems = getMissingItems();

  // ═══════════════════════════════════════
  // STEP 1: UPLOAD DOCUMENTS
  // ═══════════════════════════════════════

  if (step === "upload") {
    return (
      <div className="animate-fade-in px-4 sm:px-5 pt-4 pb-6 space-y-4">
        {/* Header */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">{t("rec.title")}</h1>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                {t("rec.subtitle")}
              </p>
            </div>
          </div>
        </section>

        {/* Progress */}
        <StepIndicator steps={steps} currentIndex={stepIndex} />

        {/* Document categories */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">{t("rec.required")}</h2>
          {DOC_CATEGORIES.filter(c => c.required).map(cat => {
            const catDocs = getDocsForCategory(cat.id);
            const hasDoc = catDocs.length > 0;
            return (
              <div key={cat.id} className={`rounded-xl border bg-card p-3 transition-colors ${hasDoc ? "border-primary/30" : "border-border"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                     <div className="relative h-7 w-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                       <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                       {hasDoc && (
                         <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center ring-2 ring-card">
                           <Check className="h-2 w-2 text-primary-foreground" strokeWidth={3} />
                         </span>
                       )}
                     </div>
                     <div>
                       <p className="text-sm font-medium text-foreground">{t(cat.labelKey)}</p>
                      {catDocs.length > 0 && (
                        <p className="text-[11px] text-muted-foreground">{t(catDocs.length === 1 ? "rec.files" : "rec.filesPlural", { count: catDocs.length })}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg h-8 text-xs text-muted-foreground"
                      onClick={() => openRecordsPicker(cat.id)}
                    >
                      <FolderOpen className="h-3.5 w-3.5 mr-1" /> {t("rec.btn.records")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg h-8 text-xs"
                      onClick={() => { setActiveCategory(cat.id); fileInputRef.current?.click(); }}
                    >
                      <Camera className="h-3.5 w-3.5 mr-1" /> {hasDoc ? t("rec.btn.addMore") : t("rec.btn.upload")}
                    </Button>
                  </div>
                </div>
                {catDocs.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {catDocs.map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                        {doc.preview ? (
                          <img src={doc.preview} alt="" className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <File className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-xs text-foreground flex-1 truncate">{doc.file.name}</span>
                        <button onClick={() => removeDoc(doc.id)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <h2 className="text-sm font-semibold text-foreground pt-2">{t("rec.optional")}</h2>
          {DOC_CATEGORIES.filter(c => !c.required).map(cat => {
            const catDocs = getDocsForCategory(cat.id);
            const hasDoc = catDocs.length > 0;
            return (
              <div key={cat.id} className={`rounded-xl border bg-card p-3 transition-colors ${hasDoc ? "border-primary/30" : "border-border"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                     <div className="relative h-7 w-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                       <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                       {hasDoc && (
                         <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center ring-2 ring-card">
                           <Check className="h-2 w-2 text-primary-foreground" strokeWidth={3} />
                         </span>
                       )}
                     </div>
                     <p className="text-sm font-medium text-foreground">{t(cat.labelKey)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg h-8 text-xs text-muted-foreground"
                      onClick={() => openRecordsPicker(cat.id)}
                    >
                      <FolderOpen className="h-3.5 w-3.5 mr-1" /> {t("rec.btn.records")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg h-8 text-xs"
                      onClick={() => { setActiveCategory(cat.id); fileInputRef.current?.click(); }}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" /> {t("rec.btn.upload")}
                    </Button>
                  </div>
                </div>
                {catDocs.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {catDocs.map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
                        <span className="text-xs text-foreground flex-1 truncate">{doc.file.name}</span>
                        <button onClick={() => removeDoc(doc.id)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Extract + Continue */}
        {hasDischarge && !extracted && (
          <Button
            onClick={extractDischargeData}
            disabled={extracting}
            className="w-full rounded-xl"
            variant="outline"
          >
            {extracting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
            {extracting ? t("rec.btn.extracting") : t("rec.btn.extract")}
          </Button>
        )}

        {extracted && (
          <div className="space-y-2">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{t("rec.extracted.title")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("rec.extracted.line", { diagnosis: extracted.insuranceClaim.primaryDiagnosis || t("rec.diagnosis"), hospital: extracted.insuranceClaim.hospitalName || t("rec.hospital"), confidence: extracted.confidence })}
                </p>
              </div>
            </div>
            {remindersCreated > 0 && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
                <Pill className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t(remindersCreated === 1 ? "rec.reminders.created" : "rec.reminders.createdPlural", { count: remindersCreated })}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("rec.reminders.desc")} <button onClick={() => navigate("/app/medications")} className="text-primary underline">{t("rec.reminders.link")}</button>
                  </p>
                </div>
              </div>
            )}
            <div className="rounded-xl border border-border bg-muted/50 p-3 flex items-start gap-2">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {t("rec.records.savedNote")} <button onClick={() => navigate("/app/records")} className="text-primary underline">{t("rec.records.link")}</button> {t("rec.records.savedTail")}
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={() => {
            if (hasDischarge && !extracted) {
              toast({ title: t("rec.toast.extractFirstTitle"), description: t("rec.toast.extractFirstDesc"), variant: "destructive" });
              return;
            }
            setStep("insurance");
          }}
          disabled={docs.length === 0}
          className="w-full rounded-xl"
        >
          {t("rec.btn.continueIns")} <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFileSelect} />

        {/* Health Records Picker Dialog */}
        <Dialog open={showRecordsPicker} onOpenChange={setShowRecordsPicker}>
          <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                {t("rec.picker.title")}
              </DialogTitle>
              <DialogDescription>
                {t("rec.picker.attachAs", { label: t(DOC_CATEGORIES.find(c => c.id === pickerCategory)?.labelKey || "") })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              {loadingRecords ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : healthRecords.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t("rec.picker.empty")}</p>
                </div>
              ) : (() => {
                const targetCategory = mapDocCategoryToRecord(pickerCategory);
                const filtered = healthRecords.filter(r => r.category === targetCategory || r.category === "other");
                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">{t("rec.picker.emptyMatch")}</p>
                    </div>
                  );
                }
                return filtered.map(record => (
                  <button
                    key={record.id}
                    onClick={() => pickHealthRecord(record)}
                    disabled={downloadingRecord === record.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {record.file_type.startsWith("image/") ? (
                        <Camera className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{record.file_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {(record.file_size / 1024).toFixed(0)} KB • {new Date(record.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    {downloadingRecord === record.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                    ) : (
                      <Check className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                ));
              })()
              }
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // STEP 2: INSURANCE DETAILS
  // ═══════════════════════════════════════

  if (step === "insurance") {
    return (
      <div className="animate-fade-in px-4 sm:px-5 pt-4 pb-6 space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setStep("upload")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t("rec.ins.heading")}</h1>
        </div>

        <StepIndicator steps={steps} currentIndex={stepIndex} />

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">{t("rec.ins.policyInfo")}</h2>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("rec.ins.company")} *</label>
              <Input
                value={insurance.insuranceCompany}
                onChange={e => setInsurance(p => ({ ...p, insuranceCompany: e.target.value }))}
                placeholder={t("rec.ins.companyPh")}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("rec.ins.policyNum")} *</label>
              <Input
                value={insurance.policyNumber}
                onChange={e => setInsurance(p => ({ ...p, policyNumber: e.target.value }))}
                placeholder={t("rec.ins.policyNumPh")}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("rec.ins.tpa")}</label>
              <Input
                value={insurance.tpaName}
                onChange={e => setInsurance(p => ({ ...p, tpaName: e.target.value }))}
                placeholder={t("rec.ins.tpaPh")}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("rec.ins.claimType")} *</label>
              <div className="grid grid-cols-2 gap-2">
                {(["cashless", "reimbursement"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setInsurance(p => ({ ...p, claimType: type }))}
                    className={`rounded-xl border p-3 text-center transition-colors ${
                      insurance.claimType === type
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <p className="text-sm font-medium">{type === "cashless" ? t("rec.ins.cashless") : t("rec.ins.reimbursement")}</p>
                    <p className="text-[10px] mt-0.5">
                      {type === "cashless" ? t("rec.ins.cashlessDesc") : t("rec.ins.reimbursementDesc")}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">{t("rec.ins.holder")}</h2>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("rec.ins.holderName")}</label>
              <Input
                value={insurance.policyHolderName}
                onChange={e => setInsurance(p => ({ ...p, policyHolderName: e.target.value }))}
                placeholder={t("rec.ins.holderNamePh")}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{t("rec.ins.relation")}</label>
              <div className="flex flex-wrap gap-1.5">
                {["self", "spouse", "child", "parent", "other"].map(rel => (
                  <button
                    key={rel}
                    onClick={() => setInsurance(p => ({ ...p, policyHolderRelation: rel }))}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      insurance.policyHolderRelation === rel
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {t(`rec.rel.${rel}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {insurance.claimType === "reimbursement" && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                {t("rec.bank.heading")}
                <span className="text-[10px] font-normal text-muted-foreground">{t("rec.bank.note")}</span>
              </h2>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("rec.bank.name")}</label>
                <Input
                  value={insurance.bankName}
                  onChange={e => setInsurance(p => ({ ...p, bankName: e.target.value }))}
                  placeholder={t("rec.bank.namePh")}
                  className="rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("rec.bank.account")}</label>
                <Input
                  value={insurance.bankAccountNumber}
                  onChange={e => setInsurance(p => ({ ...p, bankAccountNumber: e.target.value }))}
                  placeholder={t("rec.bank.accountPh")}
                  className="rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("rec.bank.ifsc")}</label>
                <Input
                  value={insurance.bankIfsc}
                  onChange={e => setInsurance(p => ({ ...p, bankIfsc: e.target.value.toUpperCase() }))}
                  placeholder={t("rec.bank.ifscPh")}
                  className="rounded-lg"
                  maxLength={11}
                />
              </div>
            </div>
          )}
        </div>

        <Button onClick={() => setStep("review")} className="w-full rounded-xl">
          {t("rec.btn.review")} <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // STEP 3: REVIEW & GENERATE
  // ═══════════════════════════════════════

  if (step === "review") {
    const ic = extracted?.insuranceClaim;
    const ms = extracted?.medicalSummary;

    return (
      <div className="animate-fade-in px-4 sm:px-5 pt-4 pb-6 space-y-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setStep("insurance")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t("rec.review.heading")}</h1>
        </div>

        <StepIndicator steps={steps} currentIndex={stepIndex} />

        {/* Missing items warning */}
        {missingItems.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">{t("rec.review.missing")}</span>
            </div>
            <ul className="space-y-1">
              {missingItems.map((item, i) => (
                <li key={i} className="text-sm text-destructive/80 flex items-start gap-2">
                  <Circle className="h-3 w-3 mt-1 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Document checklist */}
        <div className="rounded-xl border border-border bg-card p-3">
          <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> {t("rec.review.checklist")}
          </h2>
          <div className="space-y-1.5">
            {DOC_CATEGORIES.map(cat => {
              const has = docs.some(d => d.category === cat.id);
              return (
                <div key={cat.id} className="flex items-center gap-2 text-sm">
                  {has ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  ) : (
                    <Circle className={`h-3.5 w-3.5 shrink-0 ${cat.required ? "text-destructive" : "text-muted-foreground"}`} />
                  )}
                  <span className={has ? "text-foreground" : "text-muted-foreground"}>
                    {t(cat.labelKey)}
                    {cat.required && !has && <span className="text-destructive text-[10px] ml-1">{t("rec.requiredTag")}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Extracted claim data */}
        {ic && (
          <div className="rounded-xl border border-border bg-card p-3 space-y-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> {t("rec.review.extracted")}
            </h2>
            {([
              [t("rec.f.patient"), ic.patientName],
              [t("rec.f.hospital"), ic.hospitalName],
              [t("rec.f.admission"), ic.admissionDate],
              [t("rec.f.discharge"), ic.dischargeDate],
              [t("rec.f.days"), ic.daysOfStay],
              [t("rec.f.diagnosis"), ic.primaryDiagnosis],
              [t("rec.f.doctor"), ic.treatingDoctorName],
              [t("rec.f.totalBill"), ic.totalBillAmount ? `₹${ic.totalBillAmount}` : null],
            ] as [string, string | null | undefined][]).filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground font-medium text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Insurance details summary */}
        <div className="rounded-xl border border-border bg-card p-3 space-y-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> {t("rec.ins.heading")}
          </h2>
          {([
            [t("rec.f.company"), insurance.insuranceCompany],
            [t("rec.f.policyHash"), insurance.policyNumber],
            [t("rec.f.claimType"), insurance.claimType === "cashless" ? t("rec.ins.cashless") : insurance.claimType === "reimbursement" ? t("rec.ins.reimbursement") : ""],
            [t("rec.f.tpa"), insurance.tpaName],
            [t("rec.f.holder"), insurance.policyHolderName],
            [t("rec.f.relation"), insurance.policyHolderRelation ? t(`rec.rel.${insurance.policyHolderRelation}`) : ""],
          ] as [string, string][]).filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-foreground font-medium">{value}</span>
            </div>
          ))}
        </div>

        {/* Medical summary preview */}
        {ms && (
          <div className="rounded-xl border border-border bg-card p-3 space-y-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> {t("rec.review.medSummary")}
            </h2>
            <p className="text-sm text-foreground"><strong>{t("rec.f.diagnosis")}:</strong> {ms.primaryDiagnosis}</p>
            {ms.medicationsAtDischarge?.length ? (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("rec.review.medsAtDischarge")}</p>
                {ms.medicationsAtDischarge.map((med, i) => (
                  <p key={i} className="text-sm text-foreground">• {med.name} {med.dosage || ""} {med.frequency || ""}</p>
                ))}
              </div>
            ) : null}
            {ms.followUpInstructions?.length ? (
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("rec.review.followUp")}</p>
                {renderList(ms.followUpInstructions)}
              </div>
            ) : null}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <Button
            onClick={handleGeneratePdf}
            disabled={generatingPdf}
            className="w-full rounded-xl"
          >
            {generatingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {generatingPdf ? t("rec.btn.genPdfLoading") : t("rec.btn.genPdf")}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              if (!chatMessages.length) {
                setChatMessages([{
                  role: "assistant",
                  content: `I've reviewed your claim details. Here's what I can help with:\n\n${
                    missingItems.length > 0
                      ? `⚠️ **${missingItems.length} items still missing**, I can guide you on where to get them.\n\n`
                      : "✅ All required items look complete!\n\n"
                  }- **Filing process**, step-by-step for ${insurance.claimType || "your claim type"}\n- **Document corrections**, if anything extracted looks wrong\n- **Timeframes**, IRDA deadlines you should know\n- **TPA process**, how to follow up\n\nWhat would you like help with?`
                }]);
              }
              setStep("chat");
            }}
            className="w-full rounded-xl"
          >
            <MessageSquare className="h-4 w-4 mr-2" /> {t("rec.btn.chatHelp")}
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-muted/50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t("rec.disclaimer")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // STEP 4: CHAT ASSISTANT
  // ═══════════════════════════════════════

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="px-4 sm:px-5 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setStep("review")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">{t("rec.chat.heading")}</h1>
        </div>
        <StepIndicator steps={steps} currentIndex={stepIndex} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-2">
        <div className="space-y-3 pt-2">
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
                  <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
              {msg.role === "user" && (
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
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
      </div>

      <div className="px-4 sm:px-5 pt-2 pb-4 bg-background">
        <div className="flex gap-2">
          <Textarea
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
            placeholder={t("rec.chat.placeholder")}
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
          {t("rec.chat.footer")}
        </p>
      </div>
    </div>
  );
};

// ─── Step Indicator ───

const StepIndicator = ({ steps, currentIndex }: { steps: { id: string; label: string }[]; currentIndex: number }) => (
  <div className="flex items-center gap-1">
    {steps.map((s, i) => (
      <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
        <div className={`h-1.5 w-full rounded-full transition-colors ${
          i <= currentIndex ? "bg-primary" : "bg-muted"
        }`} />
        <span className={`text-[10px] font-medium ${
          i <= currentIndex ? "text-primary" : "text-muted-foreground"
        }`}>
          {s.label}
        </span>
      </div>
    ))}
  </div>
);

export default ClaimAssistant;
