import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DoctorHeader from "@/components/DoctorHeader";
import {
  Loader2,
  FileText,
  Image,
  Download,
  User,
  Calendar,
  Sparkles,
  FolderOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HealthRecord {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  ai_summary: string | null;
  uploaded_at: string;
  patient_id: string;
  patients?: {
    name: string;
    national_health_id: string | null;
  };
}

const SharedHealthRecords = () => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadSharedRecords();
  }, []);

  const loadSharedRecords = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Fetch health records shared with this doctor
      const { data: healthRecords, error } = await supabase
        .from("health_records")
        .select(`
          *,
          patients (
            name,
            national_health_id
          )
        `)
        .contains("consent_shared_with", [session.user.id]);

      if (error) throw error;
      setRecords(healthRecords || []);
    } catch (error: any) {
      console.error("Error loading shared records:", error);
      toast({
        title: "Error",
        description: "Failed to load shared health records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const viewRecord = async (record: HealthRecord) => {
    try {
      const { data } = await supabase.storage
        .from("health-records")
        .createSignedUrl(record.file_path, 3600);

      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
        setSelectedRecord(record);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load file preview",
        variant: "destructive",
      });
    }
  };

  const downloadRecord = async (record: HealthRecord) => {
    try {
      const { data } = await supabase.storage
        .from("health-records")
        .download(record.file_path);

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = record.file_name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return Image;
    return FileText;
  };

  // Group records by patient
  const recordsByPatient = records.reduce((acc, record) => {
    const patientName = record.patients?.name || "Unknown Patient";
    if (!acc[patientName]) {
      acc[patientName] = {
        healthId: record.patients?.national_health_id,
        records: [],
      };
    }
    acc[patientName].records.push(record);
    return acc;
  }, {} as Record<string, { healthId: string | null; records: HealthRecord[] }>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <DoctorHeader
        title="Shared Health Records"
        subtitle="Records shared by patients with your consent"
        icon={<FolderOpen className="h-5 w-5 text-primary-foreground" />}
      />

      <div className="max-w-6xl mx-auto px-6 py-4">
        {records.length === 0 ? (
          <Card className="p-12 text-center">
            <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Shared Records</h3>
            <p className="text-muted-foreground">
              Patients haven't shared any health records with you yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(recordsByPatient).map(([patientName, { healthId, records: patientRecords }]) => (
              <div key={patientName}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">{patientName}</h2>
                    {healthId && (
                      <p className="text-sm text-muted-foreground">Health ID: {healthId}</p>
                    )}
                  </div>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {patientRecords.length} record{patientRecords.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {patientRecords.map((record) => {
                    const FileIcon = getFileIcon(record.file_type);
                    return (
                      <Card
                        key={record.id}
                        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => viewRecord(record)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileIcon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{record.file_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(record.uploaded_at).toLocaleDateString()}
                              <span>•</span>
                              {formatFileSize(record.file_size)}
                            </div>
                          </div>
                        </div>

                        {record.ai_summary && (
                          <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
                            <div className="flex items-center gap-1 text-xs text-primary mb-1">
                              <Sparkles className="h-3 w-3" />
                              AI Summary
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {record.ai_summary}
                            </p>
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadRecord(record);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedRecord?.file_name}
            </DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              {selectedRecord.ai_summary && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-primary font-medium mb-2">
                    <Sparkles className="h-4 w-4" />
                    AI Summary
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedRecord.ai_summary}
                  </p>
                </div>
              )}

              {previewUrl && (
                <div className="border rounded-lg overflow-hidden">
                  {selectedRecord.file_type.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt={selectedRecord.file_name}
                      className="w-full h-auto max-h-[60vh] object-contain"
                    />
                  ) : selectedRecord.file_type === "application/pdf" ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-[60vh]"
                      title={selectedRecord.file_name}
                    />
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      Preview not available for this file type
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => downloadRecord(selectedRecord)} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SharedHealthRecords;
