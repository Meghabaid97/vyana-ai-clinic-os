import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  LogOut,
  Calendar,
  FileText,
  Pill,
  Clock,
  User,
  Activity,
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

interface Consultation {
  id: string;
  patient_name: string;
  patient_age: number;
  patient_national_health_id: string;
  audio_transcription: string;
  fhir_data: string;
  created_at: string;
}

interface PatientProfile {
  name: string;
  age: number | null;
  phone: string | null;
  national_health_id: string | null;
}

const PatientDashboard = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load patient profile
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (patientData) {
        setProfile({
          name: patientData.name,
          age: patientData.age,
          phone: patientData.phone,
          national_health_id: patientData.national_health_id,
        });

        // If patient has a health ID, fetch their consultations
        if (patientData.national_health_id) {
          const { data: consultationsData } = await (supabase as any)
            .from("consultations")
            .select("*")
            .eq("patient_national_health_id", patientData.national_health_id)
            .order("created_at", { ascending: false });

          setConsultations(consultationsData || []);
        }
      }
    } catch (error: any) {
      console.error("Error loading patient data:", error);
      toast({
        title: "Error",
        description: "Failed to load your data",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{profile?.name || "Patient"}</h1>
              <p className="text-sm text-muted-foreground">Patient Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{consultations.length}</p>
                <p className="text-sm text-muted-foreground">Total Visits</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {consultations.length > 0
                    ? new Date(consultations[0].created_at).toLocaleDateString()
                    : "-"}
                </p>
                <p className="text-sm text-muted-foreground">Last Visit</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium">{profile?.national_health_id || "Not set"}</p>
                <p className="text-sm text-muted-foreground">Health ID</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Consultations */}
        <h2 className="text-xl font-semibold mb-4">Your Medical History</h2>

        {consultations.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No consultations yet</h3>
            <p className="text-muted-foreground">
              Your consultation history will appear here after your first visit.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => {
              const fhirData = parseFHIRData(consultation.fhir_data);
              const medications = extractMedications(fhirData);
              const diagnoses = extractDiagnosis(fhirData);
              const isExpanded = expandedId === consultation.id;

              return (
                <Card key={consultation.id} className="p-4">
                  <div
                    className="cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : consultation.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {new Date(consultation.created_at).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
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
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConsultation(consultation);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {medications.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Pill className="h-4 w-4 text-primary" />
                            Prescribed Medications
                          </p>
                          <div className="space-y-1">
                            {medications.map((med, i) => (
                              <div key={i} className="p-2 bg-primary/10 rounded-md text-sm">
                                {med}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Consultation Detail Dialog */}
      <Dialog open={!!selectedConsultation} onOpenChange={() => setSelectedConsultation(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consultation Details</DialogTitle>
            <DialogDescription>
              {selectedConsultation &&
                new Date(selectedConsultation.created_at).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
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

export default PatientDashboard;
