import { useState, useRef } from "react";
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
  Check,
  X,
  FileImage,
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

  // Load records on mount
  useState(() => {
    loadRecords();
  });

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

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF or image files only",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
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
      // Upload to storage
      const filePath = `${userId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("health-records")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data: record, error: dbError } = await supabase
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

      // Refresh records
      loadRecords();

      // Reset file input
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
      // Get file URL for AI to analyze
      const { data: urlData } = await supabase.storage
        .from("health-records")
        .createSignedUrl(record.file_path, 60);

      if (!urlData?.signedUrl) {
        throw new Error("Could not get file URL");
      }

      // For images, convert to base64
      let fileContent = urlData.signedUrl;
      if (record.file_type.startsWith("image/")) {
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

      // Update record with summary
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
      // Delete from storage
      await supabase.storage.from("health-records").remove([record.file_path]);

      // Delete from database
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-2">Health Records</h2>
          <p className="text-muted-foreground">
            Upload and manage your medical documents
          </p>
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

      {records.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No health records yet</h3>
          <p className="text-muted-foreground mb-4">
            Upload your medical documents to keep them organized and share with doctors.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    {record.file_type.startsWith("image/") ? (
                      <FileImage className="h-6 w-6 text-primary" />
                    ) : (
                      <FileText className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{record.file_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(record.file_size)} • Uploaded {formatDate(record.uploaded_at)}
                    </p>
                    {record.ai_summary && (
                      <Badge variant="secondary" className="mt-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Summary Available
                      </Badge>
                    )}
                    {record.consent_shared_with && record.consent_shared_with.length > 0 && (
                      <Badge variant="outline" className="mt-2 ml-2">
                        <Share2 className="h-3 w-3 mr-1" />
                        Shared with {record.consent_shared_with.length} doctor(s)
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {record.ai_summary ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewingSummary(record);
                        setShowSummaryDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Summary
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => summarizeRecord(record)}
                      disabled={isSummarizing === record.id}
                    >
                      {isSummarizing === record.id ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-1" />
                      )}
                      Summarize
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openConsentDialog(record)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRecord(record)}
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
            <DialogTitle>Share Health Record</DialogTitle>
            <DialogDescription>
              Select which doctors can view this record
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {doctors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No doctors to share with. Visit a doctor first to share records.
              </p>
            ) : (
              doctors.map((doctor) => (
                <div key={doctor.doctor_id} className="flex items-center space-x-3">
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
                  <label htmlFor={doctor.doctor_id} className="text-sm cursor-pointer">
                    Healthcare Provider (Last visit: {formatDate(doctor.lastVisit)})
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
            <DialogTitle>AI Summary</DialogTitle>
            <DialogDescription>
              {viewingSummary?.file_name}
            </DialogDescription>
          </DialogHeader>

          {viewingSummary?.ai_summary && (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm">
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
