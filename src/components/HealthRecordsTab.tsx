import { useState, useRef, useEffect } from "react";
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
import { RECORD_CATEGORIES, type RecordCategory } from "@/lib/recordCategories";

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

const HealthRecordsTab = ({ patientId, userId, doctors }: HealthRecordsTabProps) => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [selectedDoctors, setSelectedDoctors] = useState<Set<string>>(new Set());
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [viewingSummary, setViewingSummary] = useState<HealthRecord | null>(null);
  const [activeCategory, setActiveCategory] = useState<RecordCategory>("discharge_summary");
  const [uploadCategory, setUploadCategory] = useState<RecordCategory>("discharge_summary");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      setRecords(data || []);
    } catch (error: any) {
      console.error("Error loading health records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF or image files only",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const filePath = `${userId}/${Date.now()}_${file.name}`;
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
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "File uploaded",
        description: "Your health record has been uploaded successfully",
      });

      await loadRecords();
      await summarizeRecord(insertedRecord as HealthRecord);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
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
        },
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from("health_records")
        .update({ ai_summary: data.summary })
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
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with upload */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
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
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            size="sm"
            className="rounded-xl"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1.5" />
            )}
            Upload
          </Button>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
        <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <span className="text-xs text-muted-foreground leading-relaxed">
          Your records are encrypted. Only doctors you explicitly consent to can view them.
        </span>
      </div>

      {records.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border-border bg-card shadow-none">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">No records yet</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
            Upload prescriptions, lab reports, or scans to keep them organized in one place.
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="rounded-xl"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload your first record
          </Button>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {records.map((record) => (
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
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {record.ai_summary && (
                        <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-0 h-5">
                          <Sparkles className="h-2.5 w-2.5 mr-1" />
                          Summary
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
            <div className="p-4 rounded-lg bg-muted/40 border border-border">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {viewingSummary.ai_summary}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HealthRecordsTab;
