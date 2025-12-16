import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DoctorHeader from "@/components/DoctorHeader";
import { maskHealthId, encodePatientId } from "@/lib/formatters";
import { Loader2, Plus, Search, User, Calendar, FileText, Clock, Trash2, ChevronDown, ChevronRight, FolderOpen, Folder, ExternalLink, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Consultation {
  id: string;
  patient_name: string;
  patient_age: number;
  patient_national_health_id: string;
  audio_transcription: string;
  fhir_data: string;
  created_at: string;
  updated_at: string;
}

interface PatientGroup {
  healthId: string;
  patientName: string;
  patientAge: number;
  consultations: Consultation[];
  lastVisit: string;
}

interface FHIRData {
  resourceType?: string;
  status?: string;
  class?: any;
  subject?: {
    reference?: string;
    display?: string;
  };
  period?: {
    start?: string;
    end?: string;
  };
  reasonCode?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  }>;
  diagnosis?: Array<{
    condition?: {
      display?: string;
    };
  }>;
  extension?: Array<{
    url?: string;
    valueString?: string;
  }>;
}

const parseFHIRData = (fhirString: string): FHIRData | null => {
  try {
    return JSON.parse(fhirString);
  } catch (error) {
    console.error("Error parsing FHIR data:", error);
    return null;
  }
};

const extractKeyInfo = (fhirData: FHIRData | null) => {
  if (!fhirData) {
    return null;
  }

  const info: {
    diagnosis: string[];
    vitals: { label: string; value: string }[];
    medications: string[];
    symptoms: string[];
    notes: string[];
  } = {
    diagnosis: [],
    vitals: [],
    medications: [],
    symptoms: [],
    notes: [],
  };

  if (fhirData.diagnosis) {
    info.diagnosis = fhirData.diagnosis
      .map((d) => d.condition?.display)
      .filter(Boolean) as string[];
  }

  if (fhirData.reasonCode) {
    const reasons = fhirData.reasonCode
      .map((r) => r.text || r.coding?.[0]?.display)
      .filter(Boolean) as string[];
    info.diagnosis.push(...reasons);
  }

  if (fhirData.extension) {
    fhirData.extension.forEach((ext) => {
      const url = ext.url?.toLowerCase() || "";
      const value = ext.valueString || "";

      if (url.includes("vital") || url.includes("observation")) {
        const label = url.split("/").pop() || url;
        info.vitals.push({ label: label.replace(/_/g, " "), value });
      } else if (url.includes("medication")) {
        info.medications.push(value);
      } else if (url.includes("symptom")) {
        info.symptoms.push(value);
      } else if (url.includes("note") || url.includes("comment")) {
        info.notes.push(value);
      }
    });
  }

  const hasData = 
    info.diagnosis.length > 0 ||
    info.vitals.length > 0 ||
    info.medications.length > 0 ||
    info.symptoms.length > 0 ||
    info.notes.length > 0;

  return hasData ? info : null;
};

const ConsultationsList = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  // Group consultations by patient health ID
  const patientGroups = useMemo(() => {
    const groups = new Map<string, PatientGroup>();
    
    consultations.forEach((consultation) => {
      const healthId = consultation.patient_national_health_id;
      
      if (!groups.has(healthId)) {
        groups.set(healthId, {
          healthId,
          patientName: consultation.patient_name,
          patientAge: consultation.patient_age,
          consultations: [],
          lastVisit: consultation.created_at,
        });
      }
      
      const group = groups.get(healthId)!;
      group.consultations.push(consultation);
      
      // Update to most recent name/age and last visit
      if (new Date(consultation.created_at) > new Date(group.lastVisit)) {
        group.lastVisit = consultation.created_at;
        group.patientName = consultation.patient_name;
        group.patientAge = consultation.patient_age;
      }
    });
    
    // Sort groups by last visit (most recent first)
    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
    );
  }, [consultations]);

  // Filter patient groups based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return patientGroups;
    
    const query = searchQuery.toLowerCase();
    return patientGroups.filter(
      (group) =>
        group.patientName.toLowerCase().includes(query) ||
        group.healthId.includes(searchQuery)
    );
  }, [patientGroups, searchQuery]);

  const calculateAvgTimePerVisit = () => {
    if (consultations.length === 0) return null;
    
    const durations = consultations.map((c) => {
      const created = new Date(c.created_at).getTime();
      const updated = new Date(c.updated_at).getTime();
      return updated - created;
    });
    
    const avgMs = durations.reduce((a, b) => a + b, 0) / durations.length;
    const avgMinutes = Math.round(avgMs / 60000);
    
    if (avgMinutes < 1) return "< 1 min";
    if (avgMinutes < 60) return `${avgMinutes} min`;
    const hours = Math.floor(avgMinutes / 60);
    const mins = avgMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  useEffect(() => {
    checkAuthAndLoadConsultations();
  }, []);

  const checkAuthAndLoadConsultations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    await loadConsultations(session.user.id);
  };

  const loadConsultations = async (doctorId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from("consultations")
        .select("*")
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setConsultations(data || []);
    } catch (error: any) {
      console.error("Error loading consultations:", error);
      toast({
        title: "Error",
        description: "Failed to load consultations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const archiveConsultation = async (consultationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("consultations")
        .update({ is_archived: true })
        .eq("id", consultationId);

      if (error) throw error;

      setConsultations(prev => prev.filter(c => c.id !== consultationId));
      setSelectedConsultation(null);

      toast({
        title: "Consultation archived",
        description: "The consultation has been removed from your list",
      });
    } catch (error: any) {
      console.error("Error archiving consultation:", error);
      toast({
        title: "Error",
        description: "Failed to archive consultation",
        variant: "destructive",
      });
    }
  };

  const togglePatient = (healthId: string) => {
    setExpandedPatients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(healthId)) {
        newSet.delete(healthId);
      } else {
        newSet.add(healthId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <DoctorHeader
        title="My Patients"
        subtitle="View patient records and consultation history"
        icon={<Users className="h-5 w-5 text-primary-foreground" />}
        actions={
          <>
            <Button onClick={() => navigate("/doctor-appointments")} variant="outline" size="sm">
              Appointments
            </Button>
            <Button onClick={() => navigate("/consultation")} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Consultation
            </Button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-4 space-y-8">

        {consultations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Patients</p>
                  <p className="text-2xl font-bold">{patientGroups.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Consultations</p>
                  <p className="text-2xl font-bold">{consultations.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Time per Visit</p>
                  <p className="text-2xl font-bold">{calculateAvgTimePerVisit()}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">
                    {consultations.filter((c) => {
                      const created = new Date(c.created_at);
                      const now = new Date();
                      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient name or health ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No patients found matching your search"
                  : "No consultations yet. Create your first one!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGroups.map((group) => (
                <Collapsible
                  key={group.healthId}
                  open={expandedPatients.has(group.healthId)}
                  onOpenChange={() => togglePatient(group.healthId)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted rounded-lg cursor-pointer transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {expandedPatients.has(group.healthId) ? (
                            <FolderOpen className="h-5 w-5 text-primary" />
                          ) : (
                            <Folder className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{group.patientName}</h3>
                            <span className="text-sm text-muted-foreground">
                              ({group.patientAge} years)
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            ID: {maskHealthId(group.healthId)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {group.consultations.length} visit{group.consultations.length !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last: {formatShortDate(group.lastVisit)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/patient-view/${encodePatientId(group.healthId)}`);
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                        {expandedPatients.has(group.healthId) ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-6 mt-2 border-l-2 border-muted pl-4 space-y-2">
                      {group.consultations.map((consultation) => (
                        <div
                          key={consultation.id}
                          className="flex items-center justify-between p-3 bg-background border rounded-lg hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                Consultation - {formatDate(consultation.created_at)}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                                {consultation.audio_transcription.substring(0, 100)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedConsultation(consultation)}
                            >
                              View
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Archive Consultation?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove the consultation from your view. The data will be preserved for compliance purposes.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => archiveConsultation(consultation.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Archive
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={!!selectedConsultation} onOpenChange={() => setSelectedConsultation(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle>Consultation Details</DialogTitle>
              <DialogDescription>
                {selectedConsultation && formatDate(selectedConsultation.created_at)}
              </DialogDescription>
            </div>
            {selectedConsultation && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Archive Consultation?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the consultation from your view. The data will be preserved for compliance purposes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => archiveConsultation(selectedConsultation.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Archive
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </DialogHeader>

          {selectedConsultation && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Patient Name</p>
                  <p className="text-lg font-semibold">{selectedConsultation.patient_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Age</p>
                  <p className="text-lg font-semibold">{selectedConsultation.patient_age} years</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Health ID</p>
                  <p className="text-lg font-semibold font-mono">
                    {selectedConsultation.patient_national_health_id}
                  </p>
                </div>
              </div>

              {(() => {
                const fhirData = parseFHIRData(selectedConsultation.fhir_data);
                const keyInfo = extractKeyInfo(fhirData);

                return (
                  <>
                    {keyInfo ? (
                      <>
                        {keyInfo.diagnosis.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Diagnosis
                            </p>
                            <div className="space-y-2">
                              {keyInfo.diagnosis.map((diag, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                                >
                                  <p className="text-sm font-medium">{diag}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {keyInfo.vitals.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Vital Signs
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              {keyInfo.vitals.map((vital, idx) => (
                                <div key={idx} className="p-3 bg-muted rounded-lg">
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {vital.label}
                                  </p>
                                  <p className="text-lg font-semibold">{vital.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {keyInfo.medications.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Medications
                            </p>
                            <div className="space-y-2">
                              {keyInfo.medications.map((med, idx) => (
                                <div key={idx} className="p-3 bg-primary/10 rounded-lg">
                                  <p className="text-sm">{med}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {keyInfo.symptoms.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Symptoms
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {keyInfo.symptoms.map((symptom, idx) => (
                                <div
                                  key={idx}
                                  className="px-3 py-1 bg-muted rounded-full text-sm"
                                >
                                  {symptom}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {keyInfo.notes.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Clinical Notes
                            </p>
                            <div className="space-y-2">
                              {keyInfo.notes.map((note, idx) => (
                                <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                                  {note}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-4 bg-muted/50 border border-border rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          ℹ️ This consultation was created with an older format. Structured clinical data (diagnosis, vitals, medications) is only available for new consultations.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Transcription
                </p>
                <div className="p-4 bg-muted rounded-lg text-sm max-h-48 overflow-y-auto">
                  {selectedConsultation.audio_transcription}
                </div>
              </div>

              <details className="group">
                <summary className="text-sm font-medium text-muted-foreground mb-2 cursor-pointer hover:text-foreground">
                  View Raw FHIR Data
                </summary>
                <div className="mt-2 p-4 bg-muted rounded-lg text-xs font-mono overflow-auto max-h-96">
                  <pre>
                    {JSON.stringify(
                      parseFHIRData(selectedConsultation.fhir_data),
                      null,
                      2
                    )}
                  </pre>
                </div>
              </details>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsultationsList;
