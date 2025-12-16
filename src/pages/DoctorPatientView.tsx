import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  AlertTriangle,
  ClipboardList,
  Bell,
  Sparkles,
  Download,
  Send,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { jsPDF } from "jspdf";
import { downloadPrescriptionPdf } from "@/lib/prescriptionPdf";

interface Consultation {
  id: string;
  patient_name: string;
  patient_age: number;
  audio_transcription: string;
  fhir_data: string;
  created_at: string;
}

interface HealthRisk {
  condition: string;
  level: "low" | "medium" | "high";
  reasoning: string;
}

interface HealthAnalysis {
  risks: HealthRisk[];
  recommendations: string[];
  disclaimer: string;
}

interface Prescription {
  medications: string;
  dosage: string;
  duration: string;
  instructions: string;
  notes: string;
  confidence: string;
  warning?: string;
}

interface Reminder {
  id: string;
  consultation_id: string;
  reminder_date: string;
  reminder_message: string;
  patient_phone: string;
  is_sent: boolean;
}

interface DrugInteraction {
  drugs: string[];
  severity: "minor" | "moderate" | "severe" | "contraindicated";
  description: string;
  recommendation: string;
}

interface DrugInteractionResult {
  interactions: DrugInteraction[];
  safetyNotes: string[];
  overallRisk: string;
  disclaimer: string;
}

interface DoctorProfile {
  full_name: string;
  qualification: string | null;
  specialization: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  phone: string | null;
  medical_license_number: string | null;
}

const DoctorPatientView = () => {
  const { healthId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [expandedConsultations, setExpandedConsultations] = useState<Set<string>>(new Set());
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  
  // Health Risk Analyzer
  const [showRiskDialog, setShowRiskDialog] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [healthAnalysis, setHealthAnalysis] = useState<HealthAnalysis | null>(null);
  
  // Prescription Generator
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [selectedConsultationForRx, setSelectedConsultationForRx] = useState<Consultation | null>(null);
  const [isGeneratingRx, setIsGeneratingRx] = useState(false);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  
  // Follow-up Reminder
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [isCreatingReminder, setIsCreatingReminder] = useState(false);
  
  // Drug Interactions
  const [showDrugDialog, setShowDrugDialog] = useState(false);
  const [isCheckingDrugs, setIsCheckingDrugs] = useState(false);
  const [drugInteractions, setDrugInteractions] = useState<DrugInteractionResult | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPatientData();
  }, [healthId]);

  const loadPatientData = async () => {
    if (!healthId) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load doctor profile
      const { data: profileData } = await supabase
        .from("doctor_profiles")
        .select("full_name, qualification, specialization, clinic_name, clinic_address, phone, medical_license_number")
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      if (profileData) {
        setDoctorProfile(profileData);
      }

      // Load consultations
      const { data: consultData, error: consultError } = await supabase
        .from("consultations")
        .select("*")
        .eq("patient_national_health_id", healthId)
        .eq("doctor_id", session.user.id)
        .order("created_at", { ascending: false });

      if (consultError) throw consultError;
      setConsultations(consultData || []);

      // Load reminders for this patient's consultations
      if (consultData && consultData.length > 0) {
        const consultIds = consultData.map(c => c.id);
        const { data: reminderData } = await supabase
          .from("follow_up_reminders")
          .select("*")
          .in("consultation_id", consultIds)
          .order("reminder_date", { ascending: true });
        
        setReminders(reminderData || []);
      }
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

  const extractSymptoms = (fhirData: any): string[] => {
    if (!fhirData?.extension) return [];
    return fhirData.extension
      .filter((ext: any) => ext.url?.toLowerCase().includes("symptom"))
      .map((ext: any) => ext.valueString)
      .filter(Boolean);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Health Risk Analyzer
  const analyzeHealthRisks = async () => {
    setIsAnalyzing(true);
    setHealthAnalysis(null);
    
    try {
      const allDiagnoses: string[] = [];
      const allMedications: string[] = [];
      const allSymptoms: string[] = [];
      
      consultations.forEach(c => {
        const fhir = parseFHIRData(c.fhir_data);
        if (fhir) {
          allDiagnoses.push(...extractDiagnosis(fhir));
          allMedications.push(...extractMedications(fhir));
          allSymptoms.push(...extractSymptoms(fhir));
        }
      });

      const { data, error } = await supabase.functions.invoke("analyze-health-risks", {
        body: {
          patientName: patientName,
          patientAge: patientAge || 0,
          diagnoses: [...new Set(allDiagnoses)],
          medications: [...new Set(allMedications)],
          symptoms: [...new Set(allSymptoms)],
        },
      });

      if (error) throw error;
      setHealthAnalysis(data);
    } catch (error: any) {
      console.error("Error analyzing health risks:", error);
      toast({
        title: "Error",
        description: "Failed to analyze health risks",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Drug Interaction Checker
  const checkDrugInteractions = async () => {
    setIsCheckingDrugs(true);
    setDrugInteractions(null);
    
    try {
      const allMedications: string[] = [];
      
      consultations.forEach(c => {
        const fhir = parseFHIRData(c.fhir_data);
        if (fhir) {
          allMedications.push(...extractMedications(fhir));
        }
      });

      const uniqueMeds = [...new Set(allMedications)];
      
      if (uniqueMeds.length < 2) {
        setDrugInteractions({
          interactions: [],
          safetyNotes: ["Patient has fewer than 2 recorded medications. No interaction check needed."],
          overallRisk: "low",
          disclaimer: "Please consult a healthcare professional for medical advice."
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-drug-interactions", {
        body: { medications: uniqueMeds },
      });

      if (error) throw error;
      setDrugInteractions(data);
    } catch (error: any) {
      console.error("Error checking drug interactions:", error);
      toast({
        title: "Error",
        description: "Failed to check drug interactions",
        variant: "destructive",
      });
    } finally {
      setIsCheckingDrugs(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "contraindicated": return "bg-red-600/10 text-red-700 border-red-600/30";
      case "severe": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "moderate": return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "minor": return "bg-green-500/10 text-green-600 border-green-500/30";
      default: return "bg-muted";
    }
  };

  const generatePrescription = async (consultation: Consultation) => {
    setSelectedConsultationForRx(consultation);
    setShowPrescriptionDialog(true);
    setIsGeneratingRx(true);
    setPrescription(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-prescription", {
        body: {
          type: "from_consultation",
          transcription: consultation.audio_transcription,
          fhirData: consultation.fhir_data,
        },
      });

      if (error) throw error;
      setPrescription(data);
    } catch (error: any) {
      console.error("Error generating prescription:", error);
      toast({
        title: "Error",
        description: "Failed to generate prescription",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingRx(false);
    }
  };

  const downloadPrescription = () => {
    if (!prescription || !selectedConsultationForRx) return;

    // Parse medications into structured format
    const medLines = prescription.medications.split("\n").filter(Boolean);
    const medications = medLines.map(med => {
      // Try to parse medication line (format: "MedicationName - Dosage - Instructions")
      const parts = med.split(/[-–]/).map(p => p.trim());
      return {
        name: parts[0] || med,
        dosage: prescription.dosage || parts[1] || "As prescribed",
        instruction: prescription.instructions || parts[2] || "As directed",
        duration: prescription.duration || "As needed",
      };
    });

    // Extract diagnosis from FHIR data
    const fhirData = parseFHIRData(selectedConsultationForRx.fhir_data);
    const diagnoses = extractDiagnosis(fhirData);

    const visitDate = new Date(selectedConsultationForRx.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
    });

    downloadPrescriptionPdf({
      clinicName: doctorProfile?.clinic_name || "Healthcare Clinic",
      clinicAddress: doctorProfile?.clinic_address || "",
      clinicPhone: doctorProfile?.phone || "",
      clinicEmail: undefined,
      doctorName: doctorProfile?.full_name || "Doctor",
      doctorQualification: doctorProfile?.qualification || doctorProfile?.specialization || "Medical Professional",
      doctorLicenseNumber: doctorProfile?.medical_license_number || undefined,
      patientName: selectedConsultationForRx.patient_name,
      patientAge: selectedConsultationForRx.patient_age,
      patientGender: undefined,
      patientPhone: undefined,
      healthId: healthId || "",
      visitDate: visitDate,
      visitType: "Consultation Visit",
      diagnosis: diagnoses.join(", ") || "As noted in consultation",
      medications: medications,
      advice: prescription.notes || undefined,
    });
  };

  // Follow-up Reminder
  const createReminder = async () => {
    if (!consultations.length || !reminderDate || !reminderMessage) {
      toast({
        title: "Missing Information",
        description: "Please fill in all reminder fields",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingReminder(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("follow_up_reminders")
        .insert({
          consultation_id: consultations[0].id,
          doctor_id: session.user.id,
          reminder_date: reminderDate,
          reminder_message: reminderMessage,
          patient_phone: patientPhone,
        });

      if (error) throw error;

      toast({
        title: "Reminder Created",
        description: "Follow-up reminder has been scheduled",
      });

      setShowReminderDialog(false);
      setReminderDate("");
      setReminderMessage("");
      loadPatientData();
    } catch (error: any) {
      console.error("Error creating reminder:", error);
      toast({
        title: "Error",
        description: "Failed to create reminder",
        variant: "destructive",
      });
    } finally {
      setIsCreatingReminder(false);
    }
  };

  const sendWhatsAppReminder = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, "_blank");
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "medium": return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "low": return "bg-green-500/10 text-green-600 border-green-500/30";
      default: return "bg-muted";
    }
  };

  // Export Patient Profile to PDF
  const exportPatientProfile = () => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    // Header
    doc.setFontSize(20);
    doc.text("Patient Profile", margin, y);
    y += 15;

    doc.setFontSize(12);
    doc.text(`Name: ${patientName}`, margin, y);
    y += 8;
    if (patientAge) {
      doc.text(`Age: ${patientAge} years`, margin, y);
      y += 8;
    }
    doc.text(`Health ID: ${healthId}`, margin, y);
    y += 8;
    doc.text(`Total Consultations: ${consultations.length}`, margin, y);
    y += 15;

    // Consultation History
    doc.setFontSize(14);
    doc.text("Consultation History", margin, y);
    y += 10;

    consultations.forEach((consultation, index) => {
      if (y > 260) {
        doc.addPage();
        y = margin;
      }

      const fhirData = parseFHIRData(consultation.fhir_data);
      const diagnoses = extractDiagnosis(fhirData);
      const medications = extractMedications(fhirData);

      doc.setFontSize(11);
      doc.text(`${index + 1}. ${formatDate(consultation.created_at)}`, margin, y);
      y += 6;

      if (diagnoses.length > 0) {
        doc.setFontSize(10);
        doc.text(`   Diagnosis: ${diagnoses.join(", ")}`, margin, y);
        y += 5;
      }

      if (medications.length > 0) {
        doc.text(`   Medications: ${medications.join(", ")}`, margin, y);
        y += 5;
      }

      y += 5;
    });

    doc.save(`patient_profile_${patientName.replace(/\s+/g, "_")}.pdf`);
    
    toast({
      title: "PDF Exported",
      description: "Patient profile has been downloaded",
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

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/consultations")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </Button>

        {/* Patient Info & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
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

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setShowRiskDialog(true);
                  analyzeHealthRisks();
                }}
              >
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                Health Risk Analysis
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setShowDrugDialog(true);
                  checkDrugInteractions();
                }}
              >
                <Pill className="h-4 w-4 mr-2 text-purple-500" />
                Drug Interactions
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowReminderDialog(true)}
              >
                <Bell className="h-4 w-4 mr-2 text-blue-500" />
                Schedule Follow-up
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={exportPatientProfile}
              >
                <Download className="h-4 w-4 mr-2 text-green-500" />
                Export PDF
              </Button>
            </div>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-teal-500/10 to-transparent border-teal-500/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-600">{consultations.length}</p>
                <p className="text-xs text-muted-foreground">Consultations</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-600">
                  {consultations.length > 0 ? formatDate(consultations[0].created_at).split(",")[0] : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">Last Visit</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Heart className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-cyan-600">
                  {consultations.length > 0 ? formatDate(consultations[consultations.length - 1].created_at).split(",")[0] : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground">First Visit</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-violet-500/10 to-transparent border-violet-500/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Bell className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-600">
                  {reminders.filter(r => !r.is_sent).length}
                </p>
                <p className="text-xs text-muted-foreground">Pending Reminders</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Pending Reminders */}
        {reminders.filter(r => !r.is_sent).length > 0 && (
          <Card className="p-4 mb-6 border-amber-500/30 bg-amber-500/5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-600" />
              Upcoming Follow-ups
            </h3>
            <div className="space-y-2">
              {reminders.filter(r => !r.is_sent).map(reminder => (
                <div key={reminder.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{formatDate(reminder.reminder_date)}</p>
                    <p className="text-xs text-muted-foreground">{reminder.reminder_message}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => sendWhatsAppReminder(reminder.patient_phone, reminder.reminder_message)}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    WhatsApp
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

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
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generatePrescription(consultation);
                                }}
                              >
                                <ClipboardList className="h-3 w-3 mr-1" />
                                Rx
                              </Button>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
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

      {/* Health Risk Analysis Dialog */}
      <Dialog open={showRiskDialog} onOpenChange={setShowRiskDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              AI Health Risk Analysis
            </DialogTitle>
            <DialogDescription>
              AI-powered analysis based on patient's medical history
            </DialogDescription>
          </DialogHeader>

          {isAnalyzing ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Analyzing health data...</p>
            </div>
          ) : healthAnalysis ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Risk Indicators</h4>
                <div className="space-y-2">
                  {healthAnalysis.risks.map((risk, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${getRiskLevelColor(risk.level)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{risk.condition}</span>
                        <Badge variant="outline" className={getRiskLevelColor(risk.level)}>
                          {risk.level.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm opacity-80">{risk.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {healthAnalysis.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-muted-foreground italic">
                {healthAnalysis.disclaimer}
              </p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No analysis available
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Prescription Dialog */}
      <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Generate Prescription
            </DialogTitle>
            <DialogDescription>
              AI-extracted prescription from consultation
            </DialogDescription>
          </DialogHeader>

          {isGeneratingRx ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Extracting prescription data...</p>
            </div>
          ) : prescription ? (
            <div className="space-y-4">
              {prescription.warning && (
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                  <p className="text-sm text-amber-700">{prescription.warning}</p>
                </div>
              )}

              <div>
                <Label>Medications</Label>
                <Textarea
                  value={prescription.medications}
                  onChange={(e) => setPrescription({ ...prescription, medications: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dosage</Label>
                  <Input
                    value={prescription.dosage}
                    onChange={(e) => setPrescription({ ...prescription, dosage: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Duration</Label>
                  <Input
                    value={prescription.duration}
                    onChange={(e) => setPrescription({ ...prescription, duration: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Instructions</Label>
                <Textarea
                  value={prescription.instructions}
                  onChange={(e) => setPrescription({ ...prescription, instructions: e.target.value })}
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={prescription.notes}
                  onChange={(e) => setPrescription({ ...prescription, notes: e.target.value })}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={downloadPrescription} disabled={!prescription}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Follow-up Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Schedule Follow-up Reminder
            </DialogTitle>
            <DialogDescription>
              Create a reminder to follow up with this patient
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Reminder Date</Label>
              <Input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Patient Phone (for WhatsApp)</Label>
              <Input
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Reminder Message</Label>
              <Textarea
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="Hi! This is a reminder for your follow-up appointment..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createReminder} disabled={isCreatingReminder}>
              {isCreatingReminder && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drug Interaction Dialog */}
      <Dialog open={showDrugDialog} onOpenChange={setShowDrugDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-purple-500" />
              Drug Interaction Check
            </DialogTitle>
            <DialogDescription>
              AI-powered analysis of potential medication interactions
            </DialogDescription>
          </DialogHeader>

          {isCheckingDrugs ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Checking drug interactions...</p>
            </div>
          ) : drugInteractions ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {drugInteractions.interactions.length > 0 ? (
                <div>
                  <h4 className="font-semibold mb-2">Potential Interactions</h4>
                  <div className="space-y-2">
                    {drugInteractions.interactions.map((interaction, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${getSeverityColor(interaction.severity)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{interaction.drugs.join(" + ")}</span>
                          <Badge variant="outline" className={getSeverityColor(interaction.severity)}>
                            {interaction.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm opacity-80 mb-2">{interaction.description}</p>
                        <p className="text-xs font-medium">Recommendation: {interaction.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30 text-center">
                  <p className="text-green-600 font-medium">No significant interactions found</p>
                </div>
              )}

              {drugInteractions.safetyNotes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Safety Notes</h4>
                  <ul className="space-y-1">
                    {drugInteractions.safetyNotes.map((note, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-muted-foreground italic">
                {drugInteractions.disclaimer}
              </p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No interaction data available
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorPatientView;
