import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Upload,
  FileText,
  Trash2,
  Share2,
  Eye,
  Sparkles,
  FileImage,
  FolderOpen,
  Shield,
  Camera,
  ImagePlus,
  ScanLine,
  Link2,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatefulButton, ButtonState } from "@/components/ui/stateful-button";
import { RecordsTabSkeleton } from "@/components/ui/page-skeletons";
import { RECORD_CATEGORIES, type RecordCategory } from "@/lib/recordCategories";
import { jsPDF } from "jspdf";

interface HealthRecord {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  ai_summary: string | null;
  consent_shared_with: string[] | null;
  uploaded_at: string;
  category: string;
  document_type?: string | null;
  important_findings?: any;
  medications?: any;
  allergies?: any;
  diagnoses?: any;
  extracted_vitals?: any;
  ai_confidence?: string | null;
  radiology_modality?: string | null;
  radiology_body_part?: string | null;
  radiology_study_date?: string | null;
  radiology_impression?: string[] | null;
  radiology_recommendations?: string[] | null;
  radiology_provider?: string | null;
  radiology_upload_kind?: string | null;
}

interface DoctorForConsent {
  doctor_id: string;
  lastVisit: string;
}

interface HealthRecordsTabProps {
  patientId: string;
  userId: string;
  doctors: DoctorForConsent[];
}

interface BatchScanItem {
  name: string;
  size: number;
  type: string;
  status: "queued" | "uploading" | "analyzing" | "done" | "error";
}

const RADIOLOGY_MODALITIES = ["X-ray", "CT", "MRI", "Ultrasound", "PET", "Other"] as const;
type RadiologyUploadKind = "report_with_optional_films" | "film_only";

const HealthRecordsTab = ({ patientId, userId, doctors }: HealthRecordsTabProps) => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadState, setUploadState] = useState<ButtonState>("idle");
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const [batchScanItems, setBatchScanItems] = useState<BatchScanItem[]>([]);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [selectedDoctors, setSelectedDoctors] = useState<Set<string>>(new Set());
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [viewingSummary, setViewingSummary] = useState<HealthRecord | null>(null);
  const [activeCategory, setActiveCategory] = useState<RecordCategory>("discharge_summary");
  const [uploadCategory, setUploadCategory] = useState<RecordCategory>("discharge_summary");
  const [radiologyModality, setRadiologyModality] = useState<string>("CT");
  const [radiologyUploadKind, setRadiologyUploadKind] = useState<RadiologyUploadKind>("report_with_optional_films");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isRadiologyUpload = uploadCategory === "radiology_imaging";

  const cleanupScannedImage = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    const maxSide = 2200;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.filter = isRadiologyUpload ? "contrast(1.12) brightness(1.04) saturate(0.92)" : "contrast(1.06) brightness(1.02)";
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.9);
  };

  const imageFilesToPdf = async (files: File[]) => {
    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < files.length; i++) {
      if (i > 0) pdf.addPage();
      const dataUrl = await cleanupScannedImage(files[i]);
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
      });
      const margin = isRadiologyUpload ? 22 : 28;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;
      const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      pdf.addImage(dataUrl, files[i].type === "image/png" ? "PNG" : "JPEG", (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
    }

    const blob = pdf.output("blob");
    const name = files.length === 1
      ? `${files[0].name.replace(/\.[^.]+$/, "")}.pdf`
      : `${isRadiologyUpload ? "radiology-hardcopy-scan" : "medical-images"}-${Date.now()}.pdf`;
    return new File([blob], name, { type: "application/pdf" });
  };

  // Load records on mount - FIXED: was useState, should be useEffect
  useEffect(() => {
    loadRecords();
  }, [patientId]);

  const loadRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("health_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setRecords((data || []) as HealthRecord[]);
    } catch (error: any) {
      console.error("Error loading health records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (selectedFiles.some((file) => !allowedTypes.includes(file.type))) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF or image files only",
        variant: "destructive",
      });
      return;
    }

    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Upload up to 20MB at a time",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadState("loading");
    setBatchScanItems(selectedFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      status: "queued",
    })));
    try {
      const pdfFiles = selectedFiles.filter((file) => file.type === "application/pdf");
      const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));
      const uploadFiles: File[] = [
        ...pdfFiles,
        ...(imageFiles.length > 0 ? [await imageFilesToPdf(imageFiles)] : []),
      ];

      const uploadedRecords: HealthRecord[] = [];
      for (const [index, file] of uploadFiles.entries()) {
        setBatchScanItems((items) => items.map((item, itemIndex) => {
          if (pdfFiles.length > 0 && item.name === file.name) return { ...item, status: "uploading" };
          if (file.type === "application/pdf" && imageFiles.length > 0 && itemIndex >= pdfFiles.length) return { ...item, status: "uploading" };
          return item;
        }));

        const filePath = `${userId}/${Date.now()}_${index}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("health-records")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: insertedRecord, error: dbError } = await supabase
          .from("health_records")
          .insert({
            patient_id: patientId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            category: uploadCategory,
            radiology_modality: isRadiologyUpload ? radiologyModality : null,
            radiology_upload_kind: isRadiologyUpload ? radiologyUploadKind : "standard",
          })
          .select()
          .single();

        if (dbError) throw dbError;
        uploadedRecords.push(insertedRecord as unknown as HealthRecord);
      }

      toast({
        title: "File uploaded",
        description: "Your health record has been uploaded successfully",
      });

      setUploadState("success");
      setTimeout(() => setUploadState("idle"), 1800);

      await loadRecords();
      for (const record of uploadedRecords) {
        setBatchScanItems((items) => items.map((item) => ({ ...item, status: item.status === "uploading" ? "analyzing" : item.status })));
        await summarizeRecord(record);
      }
      setBatchScanItems((items) => items.map((item) => ({ ...item, status: "done" })));

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setBatchScanItems((items) => items.map((item) => item.status === "done" ? item : { ...item, status: "error" }));
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      setUploadState("error");
      setTimeout(() => setUploadState("idle"), 2200);
    } finally {
      setIsUploading(false);
    }
  };

  const summarizeRecord = async (record: HealthRecord) => {
    setIsSummarizing(record.id);
    try {
      const { data: urlData } = await supabase.storage
        .from("health-records")
        .createSignedUrl(record.file_path, 60);

      if (!urlData?.signedUrl) {
        throw new Error("Could not get file URL");
      }

      let fileContent = urlData.signedUrl;
      // For both images and PDFs, fetch and convert to base64 data URL
      if (record.file_type.startsWith("image/") || record.file_type === "application/pdf") {
        const response = await fetch(urlData.signedUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        fileContent = base64;
      }

      const { data, error } = await supabase.functions.invoke("summarize-health-record", {
        body: {
          fileName: record.file_name,
          fileType: record.file_type,
          fileContent,
          category: record.category,
          radiologyModality: record.radiology_modality,
          radiologyUploadKind: record.radiology_upload_kind,
        },
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from("health_records")
        .update({
          ai_summary: data.summary,
          document_type: data.documentType,
          important_findings: data.importantFindings || [],
          medications: data.medications || [],
          allergies: data.allergies || [],
          diagnoses: data.diagnoses || [],
          extracted_vitals: data.vitals || [],
          ai_confidence: data.confidence,
          radiology_modality: data.radiology?.modality || record.radiology_modality || null,
          radiology_body_part: data.radiology?.bodyPart || null,
          radiology_study_date: data.radiology?.studyDate || null,
          radiology_impression: data.radiology?.impression || [],
          radiology_recommendations: data.radiology?.recommendations || [],
          radiology_provider: data.radiology?.provider || null,
        })
        .eq("id", record.id);

      if (updateError) throw updateError;

      toast({
        title: "Summary generated",
        description: "AI has analyzed your health record",
      });

      // Trigger insight detection (non-blocking)
      supabase.functions.invoke("detect-insights", {
        body: { mode: "on-upload", recordId: record.id },
      }).catch((e) => console.error("detect-insights failed", e));

      loadRecords();
    } catch (error: any) {
      console.error("Error summarizing record:", error);
      toast({
        title: "Summarization failed",
        description: error.message || "Failed to analyze the document",
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(null);
    }
  };

  const openConsentDialog = (record: HealthRecord) => {
    setSelectedRecord(record);
    setSelectedDoctors(new Set(record.consent_shared_with || []));
    setShowConsentDialog(true);
  };

  const saveConsent = async () => {
    if (!selectedRecord) return;

    try {
      const { error } = await supabase
        .from("health_records")
        .update({ consent_shared_with: Array.from(selectedDoctors) })
        .eq("id", selectedRecord.id);

      if (error) throw error;

      toast({
        title: "Consent updated",
        description: "Your sharing preferences have been saved",
      });

      setShowConsentDialog(false);
      loadRecords();
    } catch (error: any) {
      console.error("Error saving consent:", error);
      toast({
        title: "Error",
        description: "Failed to update consent",
        variant: "destructive",
      });
    }
  };

  const deleteRecord = async (record: HealthRecord) => {
    try {
      await supabase.storage.from("health-records").remove([record.file_path]);

      const { error } = await supabase
        .from("health_records")
        .delete()
        .eq("id", record.id);

      if (error) throw error;

      toast({
        title: "Record deleted",
        description: "Health record has been removed",
      });

      loadRecords();
    } catch (error: any) {
      console.error("Error deleting record:", error);
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return <RecordsTabSkeleton />;
  }

  const filteredRecords = records.filter(r => (r.category || "other") === activeCategory);
  const countsByCategory = RECORD_CATEGORIES.reduce<Record<string, number>>((acc, c) => {
    acc[c.id] = records.filter(r => (r.category || "other") === c.id).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header with category select + upload */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Your records</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {records.length} document{records.length !== 1 ? "s" : ""} stored securely
            </p>
          </div>
          <div className="shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <StatefulButton
              state={uploadState}
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              className="rounded-xl min-w-[110px]"
              loadingLabel="Uploading"
              successLabel="Uploaded"
              errorLabel="Retry"
              idleIcon={<Upload className="h-4 w-4" />}
            >
              Upload
            </StatefulButton>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground shrink-0">Save as:</span>
          <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as RecordCategory)}>
            <SelectTrigger className="h-8 rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECORD_CATEGORIES.map(c => (
                <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isRadiologyUpload && (
          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={radiologyUploadKind === "report_with_optional_films" ? "default" : "outline"}
                size="sm"
                onClick={() => setRadiologyUploadKind("report_with_optional_films")}
                className="rounded-lg justify-start text-xs h-9"
              >
                <ScanLine className="h-3.5 w-3.5 mr-1.5" /> Report first
              </Button>
              <Button
                type="button"
                variant={radiologyUploadKind === "film_only" ? "default" : "outline"}
                size="sm"
                onClick={() => setRadiologyUploadKind("film_only")}
                className="rounded-lg justify-start text-xs h-9"
              >
                <ImagePlus className="h-3.5 w-3.5 mr-1.5" /> Film only
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground shrink-0">Type:</span>
              <Select value={radiologyModality} onValueChange={setRadiologyModality}>
                <SelectTrigger className="h-8 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RADIOLOGY_MODALITIES.map((modality) => (
                    <SelectItem key={modality} value={modality} className="text-xs">{modality}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Upload written report pages first, then optional film photos. Film-only uploads are stored for viewing and are not interpreted.
            </p>
          </div>
        )}
        {batchScanItems.length > 1 && (
          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-foreground">Batch scan</span>
              <Badge variant="secondary" className="rounded-full text-[10px]">
                {batchScanItems.length} files
              </Badge>
            </div>
            <div className="space-y-1.5">
              {batchScanItems.slice(0, 5).map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-muted-foreground">{item.name}</span>
                  <span className="shrink-0 capitalize text-primary">{item.status}</span>
                </div>
              ))}
              {batchScanItems.length > 5 && (
                <p className="text-[11px] text-muted-foreground">+{batchScanItems.length - 5} more files</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
        <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <span className="text-xs text-muted-foreground leading-relaxed">
          Your records are encrypted. Only doctors you explicitly consent to can view them.
        </span>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as RecordCategory)}>
        <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-muted/60 p-1 rounded-xl">
          {RECORD_CATEGORIES.map(c => (
            <TabsTrigger
              key={c.id}
              value={c.id}
              className="flex-1 min-w-[68px] rounded-lg text-[11px] font-medium px-2 py-1.5 data-[state=active]:bg-background"
            >
              <c.icon className="h-3 w-3 mr-1" />
              {c.shortLabel}
              {countsByCategory[c.id] > 0 && (
                <span className="ml-1 text-[10px] text-muted-foreground">({countsByCategory[c.id]})</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {RECORD_CATEGORIES.map(c => (
          <TabsContent key={c.id} value={c.id} className="mt-3">
            {filteredRecords.length === 0 ? (
              <Card className="p-8 text-center rounded-2xl border-border bg-card shadow-none">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                  <c.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">No {c.label.toLowerCase()} yet</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                  Upload to keep this category organized and ready to share with doctors.
                </p>
                <Button
                  onClick={() => { setUploadCategory(c.id); fileInputRef.current?.click(); }}
                  variant="outline"
                  className="rounded-xl"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {c.shortLabel.toLowerCase()}
                </Button>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {filteredRecords.map((record) => (
                  <Card key={record.id} className="p-3.5 rounded-2xl border-border bg-card shadow-none transition-colors hover:bg-muted/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                          {record.file_type.startsWith("image/") ? (
                            <FileImage className="h-5 w-5 text-primary" />
                          ) : (
                            <FileText className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">{record.file_name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatFileSize(record.file_size)} • {formatDate(record.uploaded_at)}
                          </p>
                          {record.category === "radiology_imaging" && (
                            <div className="mt-2 rounded-lg border border-border bg-muted/30 p-2 space-y-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                                <Camera className="h-3.5 w-3.5 text-primary" /> Radiology Details
                              </div>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                                <span>Type: {[record.radiology_modality, record.radiology_body_part].filter(Boolean).join(" ") || record.document_type || "Pending"}</span>
                                <span>Date: {record.radiology_study_date ? formatDate(record.radiology_study_date) : formatDate(record.uploaded_at)}</span>
                                {record.radiology_provider && <span className="col-span-2 truncate">Provider: {record.radiology_provider}</span>}
                                {record.radiology_impression?.[0] && <span className="col-span-2 line-clamp-2">Impression: {record.radiology_impression[0]}</span>}
                                {record.radiology_recommendations?.[0] && <span className="col-span-2 line-clamp-2">Follow-up: {record.radiology_recommendations[0]}</span>}
                              </div>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {record.ai_summary && (
                              <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-0 h-5">
                                <Sparkles className="h-2.5 w-2.5 mr-1" />
                                Summary
                              </Badge>
                            )}
                            {record.document_type && (
                              <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0 h-5">
                                {record.document_type}
                              </Badge>
                            )}
                            {record.consent_shared_with && record.consent_shared_with.length > 0 && (
                              <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0 h-5">
                                <Share2 className="h-2.5 w-2.5 mr-1" />
                                Shared ({record.consent_shared_with.length})
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {record.ai_summary ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setViewingSummary(record);
                              setShowSummaryDialog(true);
                            }}
                            className="h-8 w-8 rounded-full"
                            aria-label="View summary"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => summarizeRecord(record)}
                            disabled={isSummarizing === record.id}
                            className="h-8 w-8 rounded-full"
                            aria-label="Summarize"
                          >
                            {isSummarizing === record.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openConsentDialog(record)}
                          className="h-8 w-8 rounded-full"
                          aria-label="Share"
                        >
                          <Share2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRecord(record)}
                          className="h-8 w-8 rounded-full hover:bg-destructive/10"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>


      {/* Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share Health Record
            </DialogTitle>
            <DialogDescription>
              Select which doctors can view "{selectedRecord?.file_name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {doctors.length === 0 ? (
              <div className="text-center py-8">
                <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                  <Share2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  No doctors to share with yet. Visit a doctor first to share records.
                </p>
              </div>
            ) : (
              doctors.map((doctor) => (
                <div
                  key={doctor.doctor_id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedDoctors.has(doctor.doctor_id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => {
                    const newSet = new Set(selectedDoctors);
                    if (selectedDoctors.has(doctor.doctor_id)) {
                      newSet.delete(doctor.doctor_id);
                    } else {
                      newSet.add(doctor.doctor_id);
                    }
                    setSelectedDoctors(newSet);
                  }}
                >
                  <Checkbox
                    id={doctor.doctor_id}
                    checked={selectedDoctors.has(doctor.doctor_id)}
                    onCheckedChange={(checked) => {
                      const newSet = new Set(selectedDoctors);
                      if (checked) {
                        newSet.add(doctor.doctor_id);
                      } else {
                        newSet.delete(doctor.doctor_id);
                      }
                      setSelectedDoctors(newSet);
                    }}
                  />
                  <label htmlFor={doctor.doctor_id} className="text-sm cursor-pointer flex-1">
                    <span className="font-medium">Healthcare Provider</span>
                    <span className="text-muted-foreground ml-2">
                      (Last visit: {formatDate(doctor.lastVisit)})
                    </span>
                  </label>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveConsent}>
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Summary
            </DialogTitle>
            <DialogDescription>
              {viewingSummary?.file_name}
            </DialogDescription>
          </DialogHeader>

          {viewingSummary?.ai_summary && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {viewingSummary.document_type && <Badge variant="outline">{viewingSummary.document_type}</Badge>}
                {viewingSummary.ai_confidence && <Badge variant="secondary">{viewingSummary.ai_confidence} confidence</Badge>}
              </div>
              <div className="p-4 rounded-lg bg-muted/40 border border-border whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {viewingSummary.ai_summary}
              </div>
              {viewingSummary.category === "radiology_imaging" && (
                <div className="p-4 rounded-lg border border-border bg-card space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Radiology Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <p>Type: {[viewingSummary.radiology_modality, viewingSummary.radiology_body_part].filter(Boolean).join(" ") || "Not extracted"}</p>
                    <p>Date: {viewingSummary.radiology_study_date ? formatDate(viewingSummary.radiology_study_date) : "Not extracted"}</p>
                    <p className="sm:col-span-2">Provider: {viewingSummary.radiology_provider || "Not extracted"}</p>
                    <p className="sm:col-span-2">Impression: {viewingSummary.radiology_impression?.join(" • ") || "Not extracted"}</p>
                    <p className="sm:col-span-2">Follow-up advice: {viewingSummary.radiology_recommendations?.join(" • ") || "Not extracted"}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HealthRecordsTab;
