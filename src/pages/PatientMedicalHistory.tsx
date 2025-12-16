import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PatientHeader from "@/components/PatientHeader";
import {
  Loader2,
  Calendar,
  FileText,
  Pill,
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface Consultation {
  id: string;
  doctor_id: string;
  patient_name: string;
  patient_age: number;
  patient_national_health_id: string;
  audio_transcription: string;
  fhir_data: string;
  created_at: string;
}

interface DoctorGroup {
  doctor_id: string;
  consultations: Consultation[];
  firstVisit: string;
  lastVisit: string;
}

const PatientMedicalHistory = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [expandedDoctors, setExpandedDoctors] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  const doctorGroups = useMemo<DoctorGroup[]>(() => {
    const groups = new Map<string, Consultation[]>();
    
    consultations.forEach((consultation) => {
      const existing = groups.get(consultation.doctor_id) || [];
      groups.set(consultation.doctor_id, [...existing, consultation]);
    });

    return Array.from(groups.entries()).map(([doctor_id, docConsultations]) => {
      const sorted = docConsultations.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return {
        doctor_id,
        consultations: sorted,
        firstVisit: sorted[sorted.length - 1].created_at,
        lastVisit: sorted[0].created_at,
      };
    }).sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
  }, [consultations]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (patientData?.national_health_id) {
        const { data: consultationsData } = await supabase
          .from("consultations")
          .select("*")
          .eq("patient_national_health_id", patientData.national_health_id)
          .order("created_at", { ascending: false });

        setConsultations(consultationsData || []);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load medical history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDoctorExpanded = (doctorId: string) => {
    const newExpanded = new Set(expandedDoctors);
    if (newExpanded.has(doctorId)) {
      newExpanded.delete(doctorId);
    } else {
      newExpanded.add(doctorId);
    }
    setExpandedDoctors(newExpanded);
  };

  const parseFHIRData = (fhirString: string) => {
    try {
      return JSON.parse(fhirString);
    } catch {
      return null;
    }
  };

  const extractMedications = (fhirData: any): string[] => {
    if (!fhirData?.extension) return [];
    return fhirData.extension
      .filter((ext: any) => ext.url?.toLowerCase().includes("medication"))
      .map((ext: any) => ext.valueString)
      .filter(Boolean);
  };

  const extractDiagnosis = (fhirData: any): string[] => {
    const diagnoses: string[] = [];
    if (fhirData?.diagnosis) {
      diagnoses.push(...fhirData.diagnosis.map((d: any) => d.condition?.display).filter(Boolean));
    }
    if (fhirData?.reasonCode) {
      diagnoses.push(...fhirData.reasonCode.map((r: any) => r.text || r.coding?.[0]?.display).filter(Boolean));
    }
    return diagnoses;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-teal-500/5">
      <PatientHeader patientName="Patient" title="Medical History" subtitle="View your consultation records" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/patient-dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Your Consultations</h2>
              <p className="text-sm text-muted-foreground">
                {consultations.length} consultation{consultations.length !== 1 ? "s" : ""} • {doctorGroups.length} provider{doctorGroups.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {doctorGroups.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No consultations yet</h3>
              <p className="text-muted-foreground">
                Your consultation history will appear here after your first visit.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {doctorGroups.map((group) => (
                <Collapsible
                  key={group.doctor_id}
                  open={expandedDoctors.has(group.doctor_id)}
                  onOpenChange={() => toggleDoctorExpanded(group.doctor_id)}
                >
                  <Card className="overflow-hidden bg-muted/30">
                    <CollapsibleTrigger asChild>
                      <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Healthcare Provider</h3>
                              <p className="text-sm text-muted-foreground">
                                {group.consultations.length} consultation{group.consultations.length > 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                              <p className="text-sm font-medium">Last: {formatDate(group.lastVisit)}</p>
                              <p className="text-xs text-muted-foreground">
                                First: {formatDate(group.firstVisit)}
                              </p>
                            </div>
                            {expandedDoctors.has(group.doctor_id) ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t px-4 pb-4">
                        <div className="space-y-3 mt-4">
                          {group.consultations.map((consultation) => {
                            const fhirData = parseFHIRData(consultation.fhir_data);
                            const diagnoses = extractDiagnosis(fhirData);

                            return (
                              <Card
                                key={consultation.id}
                                className="p-4 bg-background cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setSelectedConsultation(consultation)}
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">{formatFullDate(consultation.created_at)}</span>
                                    </div>
                                    {diagnoses.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {diagnoses.slice(0, 2).map((d, i) => (
                                          <span
                                            key={i}
                                            className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-md"
                                          >
                                            {d}
                                          </span>
                                        ))}
                                        {diagnoses.length > 2 && (
                                          <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                                            +{diagnoses.length - 2} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <Button variant="outline" size="sm">
                                    <FileText className="h-4 w-4 mr-1" />
                                    Details
                                  </Button>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Consultation Detail Dialog */}
      <Dialog open={!!selectedConsultation} onOpenChange={() => setSelectedConsultation(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consultation Details</DialogTitle>
            <DialogDescription>
              {selectedConsultation && formatFullDate(selectedConsultation.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedConsultation && (
            <div className="space-y-4">
              {(() => {
                const fhirData = parseFHIRData(selectedConsultation.fhir_data);
                const diagnoses = extractDiagnosis(fhirData);
                const medications = extractMedications(fhirData);

                return (
                  <>
                    {diagnoses.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Diagnosis</p>
                        <div className="space-y-2">
                          {diagnoses.map((d, i) => (
                            <div key={i} className="p-3 bg-destructive/10 rounded-lg text-sm">
                              {d}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {medications.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Medications</p>
                        <div className="space-y-2">
                          {medications.map((m, i) => (
                            <div key={i} className="p-3 bg-primary/10 rounded-lg text-sm">
                              {m}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium mb-2">Consultation Notes</p>
                      <div className="p-3 bg-muted rounded-lg text-sm max-h-40 overflow-y-auto">
                        {selectedConsultation.audio_transcription}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientMedicalHistory;
