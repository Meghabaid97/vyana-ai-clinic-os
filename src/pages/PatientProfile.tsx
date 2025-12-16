import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  ArrowLeft,
  User,
  Calendar,
  FileText,
  Clock,
  Activity,
  Pill,
  Stethoscope,
  AlertCircle,
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
  updated_at: string;
}

interface FHIRData {
  resourceType?: string;
  diagnosis?: Array<{
    condition?: {
      display?: string;
    };
  }>;
  reasonCode?: Array<{
    coding?: Array<{
      display?: string;
    }>;
    text?: string;
  }>;
  extension?: Array<{
    url?: string;
    valueString?: string;
  }>;
}

interface TimelineEvent {
  consultation: Consultation;
  diagnosis: string[];
  medications: string[];
  symptoms: string[];
  vitals: { label: string; value: string }[];
  notes: string[];
}

const parseFHIRData = (fhirString: string): FHIRData | null => {
  try {
    return JSON.parse(fhirString);
  } catch {
    return null;
  }
};

const extractTimelineData = (consultation: Consultation): TimelineEvent => {
  const fhirData = parseFHIRData(consultation.fhir_data);
  const event: TimelineEvent = {
    consultation,
    diagnosis: [],
    medications: [],
    symptoms: [],
    vitals: [],
    notes: [],
  };

  if (!fhirData) return event;

  if (fhirData.diagnosis) {
    event.diagnosis = fhirData.diagnosis
      .map((d) => d.condition?.display)
      .filter(Boolean) as string[];
  }

  if (fhirData.reasonCode) {
    const reasons = fhirData.reasonCode
      .map((r) => r.text || r.coding?.[0]?.display)
      .filter(Boolean) as string[];
    event.diagnosis.push(...reasons);
  }

  if (fhirData.extension) {
    fhirData.extension.forEach((ext) => {
      const url = ext.url?.toLowerCase() || "";
      const value = ext.valueString || "";

      if (url.includes("vital") || url.includes("observation")) {
        const label = url.split("/").pop() || url;
        event.vitals.push({ label: label.replace(/_/g, " "), value });
      } else if (url.includes("medication")) {
        event.medications.push(value);
      } else if (url.includes("symptom")) {
        event.symptoms.push(value);
      } else if (url.includes("note") || url.includes("comment")) {
        event.notes.push(value);
      }
    });
  }

  return event;
};

const PatientProfile = () => {
  const { healthId } = useParams<{ healthId: string }>();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  const patientInfo = consultations.length > 0
    ? {
        name: consultations[0].patient_name,
        age: consultations[0].patient_age,
        healthId: consultations[0].patient_national_health_id,
      }
    : null;

  // Aggregate medical history
  const medicalSummary = consultations.reduce(
    (acc, consultation) => {
      const event = extractTimelineData(consultation);
      acc.allDiagnoses.push(...event.diagnosis);
      acc.allMedications.push(...event.medications);
      acc.allSymptoms.push(...event.symptoms);
      return acc;
    },
    { allDiagnoses: [] as string[], allMedications: [] as string[], allSymptoms: [] as string[] }
  );

  const uniqueDiagnoses = [...new Set(medicalSummary.allDiagnoses)];
  const uniqueMedications = [...new Set(medicalSummary.allMedications)];
  const uniqueSymptoms = [...new Set(medicalSummary.allSymptoms)];

  useEffect(() => {
    if (healthId) {
      loadPatientConsultations(decodeURIComponent(healthId));
    }
  }, [healthId]);

  const loadPatientConsultations = async (patientHealthId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await (supabase as any)
        .from("consultations")
        .select("*")
        .eq("doctor_id", session.user.id)
        .eq("patient_national_health_id", patientHealthId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setConsultations(data || []);
    } catch (error: any) {
      console.error("Error loading patient consultations:", error);
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEvent = (id: string) => {
    setExpandedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patientInfo) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-muted-foreground">Patient not found</p>
          <Button onClick={() => navigate("/consultations")} className="mt-4">
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/consultations")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{patientInfo.name}</h1>
                <p className="text-muted-foreground mt-1">
                  {patientInfo.age} years old
                </p>
                <p className="text-sm font-mono text-muted-foreground">
                  Health ID: {patientInfo.healthId}
                </p>
              </div>
            </div>
            <Button onClick={() => navigate("/consultation")}>
              New Consultation
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Medical Summary */}
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-primary" />
                Visit Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Visits</span>
                  <span className="font-semibold">{consultations.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Visit</span>
                  <span className="text-sm">
                    {consultations.length > 0
                      ? new Date(consultations[consultations.length - 1].created_at).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Visit</span>
                  <span className="text-sm">
                    {consultations.length > 0
                      ? new Date(consultations[0].created_at).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </div>
            </Card>

            {uniqueDiagnoses.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Stethoscope className="h-4 w-4 text-destructive" />
                  Past Diagnoses
                </h3>
                <div className="space-y-2">
                  {uniqueDiagnoses.map((diagnosis, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-destructive/10 rounded-md text-sm"
                    >
                      {diagnosis}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {uniqueMedications.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Pill className="h-4 w-4 text-primary" />
                  Medications History
                </h3>
                <div className="space-y-2">
                  {uniqueMedications.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-primary/10 rounded-md text-sm"
                    >
                      {med}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {uniqueSymptoms.length > 0 && (
              <Card className="p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Reported Symptoms
                </h3>
                <div className="flex flex-wrap gap-2">
                  {uniqueSymptoms.map((symptom, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-muted rounded-full text-xs"
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Main Content - Timeline */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Medical History Timeline
            </h2>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-6">
                {consultations.map((consultation, index) => {
                  const event = extractTimelineData(consultation);
                  const isExpanded = expandedEvents.has(consultation.id);
                  const hasDetails =
                    event.diagnosis.length > 0 ||
                    event.medications.length > 0 ||
                    event.symptoms.length > 0 ||
                    event.vitals.length > 0;

                  return (
                    <div key={consultation.id} className="relative pl-14">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-4 w-5 h-5 rounded-full border-2 ${
                          index === 0
                            ? "bg-primary border-primary"
                            : "bg-background border-muted-foreground"
                        }`}
                      />

                      <Card className="p-5">
                        <div
                          className="cursor-pointer"
                          onClick={() => toggleEvent(consultation.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {formatDate(consultation.created_at)}
                                </span>
                                {index === 0 && (
                                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                                    Latest
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {formatTime(consultation.created_at)}
                              </p>
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
                                <FileText className="mr-2 h-4 w-4" />
                                Details
                              </Button>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {/* Quick preview */}
                          {event.diagnosis.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {event.diagnosis.slice(0, 3).map((d, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-md"
                                >
                                  {d}
                                </span>
                              ))}
                              {event.diagnosis.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{event.diagnosis.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Expanded content */}
                        {isExpanded && hasDetails && (
                          <div className="mt-4 pt-4 border-t space-y-4">
                            {event.vitals.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Vital Signs</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {event.vitals.map((vital, i) => (
                                    <div
                                      key={i}
                                      className="p-2 bg-muted rounded-md text-sm"
                                    >
                                      <span className="text-muted-foreground capitalize">
                                        {vital.label}:
                                      </span>{" "}
                                      {vital.value}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {event.medications.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Medications</p>
                                <div className="space-y-1">
                                  {event.medications.map((med, i) => (
                                    <div
                                      key={i}
                                      className="p-2 bg-primary/10 rounded-md text-sm"
                                    >
                                      {med}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {event.symptoms.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Symptoms</p>
                                <div className="flex flex-wrap gap-2">
                                  {event.symptoms.map((symptom, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 bg-muted rounded-full text-xs"
                                    >
                                      {symptom}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {event.notes.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Notes</p>
                                {event.notes.map((note, i) => (
                                  <p key={i} className="text-sm text-muted-foreground">
                                    {note}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Transcription preview */}
                        {!isExpanded && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                            {consultation.audio_transcription.substring(0, 150)}...
                          </p>
                        )}
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consultation Detail Dialog */}
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
              {(() => {
                const event = extractTimelineData(selectedConsultation);
                const hasDetails =
                  event.diagnosis.length > 0 ||
                  event.medications.length > 0 ||
                  event.symptoms.length > 0 ||
                  event.vitals.length > 0;

                return (
                  <>
                    {hasDetails ? (
                      <>
                        {event.diagnosis.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                              <Stethoscope className="h-4 w-4" />
                              Diagnosis
                            </p>
                            <div className="space-y-2">
                              {event.diagnosis.map((diag, idx) => (
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

                        {event.vitals.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Vital Signs
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              {event.vitals.map((vital, idx) => (
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

                        {event.medications.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Medications
                            </p>
                            <div className="space-y-2">
                              {event.medications.map((med, idx) => (
                                <div key={idx} className="p-3 bg-primary/10 rounded-lg">
                                  <p className="text-sm">{med}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {event.symptoms.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Symptoms
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {event.symptoms.map((symptom, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-muted rounded-full text-sm"
                                >
                                  {symptom}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {event.notes.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Clinical Notes
                            </p>
                            <div className="space-y-2">
                              {event.notes.map((note, idx) => (
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
                          ℹ️ Structured clinical data not available for this consultation.
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
                <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
                  View Raw FHIR Data
                </summary>
                <div className="mt-2 p-4 bg-muted rounded-lg text-xs font-mono overflow-auto max-h-96">
                  <pre>
                    {JSON.stringify(parseFHIRData(selectedConsultation.fhir_data), null, 2)}
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

export default PatientProfile;
