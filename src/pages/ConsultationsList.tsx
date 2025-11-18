import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Search, User, Calendar, FileText } from "lucide-react";
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

interface Consultation {
  id: string;
  patient_name: string;
  patient_age: number;
  patient_national_health_id: string;
  audio_transcription: string;
  fhir_data: string;
  created_at: string;
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
    console.log("No FHIR data to parse");
    return null;
  }

  console.log("Parsing FHIR data:", fhirData);

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

  // Extract diagnosis
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

  // Extract from extensions (custom data)
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

  console.log("Extracted key info:", info);
  
  // Check if we have any data
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
  const [filteredConsultations, setFilteredConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadConsultations();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = consultations.filter(
        (consultation) =>
          consultation.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          consultation.patient_national_health_id.includes(searchQuery)
      );
      setFilteredConsultations(filtered);
    } else {
      setFilteredConsultations(consultations);
    }
  }, [searchQuery, consultations]);

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
      setFilteredConsultations(data || []);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground">My Consultations</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all patient consultations
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => navigate("/consultation")} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              New Consultation
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>

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
          ) : filteredConsultations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No consultations found matching your search"
                  : "No consultations yet. Create your first one!"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Health ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConsultations.map((consultation) => (
                  <TableRow key={consultation.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {consultation.patient_name}
                      </div>
                    </TableCell>
                    <TableCell>{consultation.patient_age} years</TableCell>
                    <TableCell className="font-mono text-sm">
                      {consultation.patient_national_health_id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(consultation.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedConsultation(consultation)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <Dialog open={!!selectedConsultation} onOpenChange={() => setSelectedConsultation(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consultation Details</DialogTitle>
            <DialogDescription>
              {selectedConsultation && formatDate(selectedConsultation.created_at)}
            </DialogDescription>
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
                          ℹ️ This consultation was created with an older format. Structured clinical data (diagnosis, vitals, medications) is only available for new consultations. Create a new consultation to see the enhanced format.
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
