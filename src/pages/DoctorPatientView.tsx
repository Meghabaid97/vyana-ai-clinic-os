import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DoctorHeader from "@/components/DoctorHeader";
import {
  Loader2,
  User,
  Phone,
  Shield,
  Calendar,
  Activity,
  FileText,
  Heart,
  ArrowLeft,
  Pill,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface Consultation {
  id: string;
  patient_name: string;
  patient_age: number;
  audio_transcription: string;
  fhir_data: string;
  created_at: string;
}

const DoctorPatientView = () => {
  const { healthId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [expandedConsultations, setExpandedConsultations] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPatientConsultations();
  }, [healthId]);

  const loadPatientConsultations = async () => {
    if (!healthId) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("patient_national_health_id", healthId)
        .eq("doctor_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error: any) {
      console.error("Error loading patient:", error);
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleConsultation = (id: string) => {
    const newExpanded = new Set(expandedConsultations);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedConsultations(newExpanded);
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
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const patientName = consultations.length > 0 ? consultations[0].patient_name : "Patient";
  const patientAge = consultations.length > 0 ? consultations[0].patient_age : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-teal-500/5">
      <DoctorHeader title="Patient Profile" subtitle={`Health ID: ${healthId}`} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/consultations")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Consultations
        </Button>

        {/* Patient Info */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{patientName}</h2>
              <div className="flex items-center gap-4 mt-1 text-muted-foreground">
                {patientAge && (
                  <span className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    {patientAge} years
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  {healthId}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-5 bg-gradient-to-br from-teal-500/10 to-transparent border-teal-500/20">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-teal-600">{consultations.length}</p>
                <p className="text-sm text-muted-foreground">Your Consultations</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-emerald-600">
                  {consultations.length > 0 ? formatDate(consultations[0].created_at).split(",")[0] : "No visits"}
                </p>
                <p className="text-sm text-muted-foreground">Last Visit</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Heart className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-cyan-600">
                  {consultations.length > 0 ? formatDate(consultations[consultations.length - 1].created_at).split(",")[0] : "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">First Visit</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Consultation History */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-600" />
            Consultation History
          </h3>

          {consultations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No consultations found for this patient</p>
            </div>
          ) : (
            <div className="space-y-4">
              {consultations.map((consultation) => {
                const fhirData = parseFHIRData(consultation.fhir_data);
                const diagnoses = extractDiagnosis(fhirData);
                const medications = extractMedications(fhirData);
                const isExpanded = expandedConsultations.has(consultation.id);

                return (
                  <Collapsible
                    key={consultation.id}
                    open={isExpanded}
                    onOpenChange={() => toggleConsultation(consultation.id)}
                  >
                    <Card className="overflow-hidden bg-muted/30">
                      <CollapsibleTrigger asChild>
                        <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{formatDate(consultation.created_at)}</p>
                              {diagnoses.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {diagnoses.slice(0, 2).map((d, i) => (
                                    <Badge key={i} variant="destructive" className="text-xs">
                                      {d}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-4 border-t pt-4 space-y-4">
                          {medications.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Pill className="h-4 w-4 text-primary" />
                                Medications
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
                          <div>
                            <p className="text-sm font-medium mb-2">Notes</p>
                            <div className="p-3 bg-muted rounded-lg text-sm max-h-32 overflow-y-auto">
                              {consultation.audio_transcription}
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DoctorPatientView;
