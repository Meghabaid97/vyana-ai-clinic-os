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

interface HealthRecord {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  ai_summary: string | null;
  consent_shared_with: string[] | null;
  uploaded_at: string;
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

      const { error: dbError } = await supabase
        .from("health_records")
        .insert({
          patient_id: patientId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "File uploaded",
        description: "Your health record has been uploaded successfully",
      });

      loadRecords();

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
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with upload */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-cyan-500/10 border border-teal-500/20">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <FolderOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Health Records</h2>
            <p className="text-sm text-muted-foreground">
              {records.length} document{records.length !== 1 ? "s" : ""} • Securely stored
            </p>
          </div>
        </div>
        <div>
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
            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Upload Record
          </Button>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
        <Shield className="h-4 w-4 text-emerald-600" />
        <span className="text-sm text-emerald-700 dark:text-emerald-400">
          Your records are encrypted and only shared with doctors you explicitly consent to.
        </span>
      </div>

      {records.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-muted/30 to-muted/10">
          <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-teal-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No health records yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Upload your medical documents like prescriptions, lab reports, or X-rays to keep them organized and share securely with doctors.
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="lg"
            className="border-teal-500/30 hover:bg-teal-500/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Your First Record
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <Card key={record.id} className="p-4 hover:shadow-lg transition-all border-border/50 hover:border-teal-500/30">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 ${
                    record.file_type.startsWith("image/")
                      ? "bg-gradient-to-br from-violet-500/20 to-purple-500/20"
                      : "bg-gradient-to-br from-teal-500/20 to-emerald-500/20"
                  }`}>
                    {record.file_type.startsWith("image/") ? (
                      <FileImage className="h-7 w-7 text-violet-600" />
                    ) : (
                      <FileText className="h-7 w-7 text-teal-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{record.file_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(record.file_size)} • {formatDate(record.uploaded_at)}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {record.ai_summary && (
                        <Badge variant="secondary" className="bg-violet-500/10 text-violet-600 border-violet-500/20">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Summary
                        </Badge>
                      )}
                      {record.consent_shared_with && record.consent_shared_with.length > 0 && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          <Share2 className="h-3 w-3 mr-1" />
                          Shared ({record.consent_shared_with.length})
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {record.ai_summary ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewingSummary(record);
                        setShowSummaryDialog(true);
                      }}
                      className="hidden sm:flex"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Summary
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => summarizeRecord(record)}
                      disabled={isSummarizing === record.id}
                      className="hidden sm:flex border-violet-500/30 hover:bg-violet-500/10"
                    >
                      {isSummarizing === record.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-1 text-violet-500" />
                      )}
                      Summarize
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openConsentDialog(record)}
                    className="border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <Share2 className="h-4 w-4 text-emerald-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRecord(record)}
                    className="hover:bg-destructive/10"
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
              <Share2 className="h-5 w-5 text-emerald-500" />
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
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-emerald-500/50"
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
            <Button onClick={saveConsent} className="bg-emerald-500 hover:bg-emerald-600">
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
              <Sparkles className="h-5 w-5 text-violet-500" />
              AI Summary
            </DialogTitle>
            <DialogDescription>
              {viewingSummary?.file_name}
            </DialogDescription>
          </DialogHeader>

          {viewingSummary?.ai_summary && (
            <div className="p-4 rounded-lg bg-violet-500/5 border border-violet-500/20">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
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
