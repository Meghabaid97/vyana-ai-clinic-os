import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
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
  Download,
  FileEdit,
  HeartPulse,
  ShieldAlert,
  Sparkles,
  Mic,
  MicOff,
  Wand2,
  MessageCircle,
  Phone,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false);
  const [prescription, setPrescription] = useState({
    medications: "",
    dosage: "",
    instructions: "",
    duration: "",
    notes: "",
  });
  const [healthRisks, setHealthRisks] = useState<{
    risks: Array<{ condition: string; level: string; reasoning: string }>;
    recommendations: string[];
    disclaimer: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isGeneratingPrescription, setIsGeneratingPrescription] = useState(false);
  const [selectedConsultationForPrescription, setSelectedConsultationForPrescription] = useState<string>("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [prescriptionWarning, setPrescriptionWarning] = useState<string>("");
  const [drugInteractions, setDrugInteractions] = useState<{
    interactions: Array<{ drugs: string[]; severity: string; description: string; recommendation: string }>;
    safetyNotes: string[];
    overallRisk: string;
    disclaimer: string;
  } | null>(null);
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [patientPhone, setPatientPhone] = useState("");
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderDate, setReminderDate] = useState("");
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

  const analyzeHealthRisks = async () => {
    if (!patientInfo || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke("analyze-health-risks", {
        body: {
          patientName: patientInfo.name,
          patientAge: patientInfo.age,
          diagnoses: uniqueDiagnoses,
          medications: uniqueMedications,
          symptoms: uniqueSymptoms,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setHealthRisks(response.data);
      toast({
        title: "Analysis Complete",
        description: "Health risk indicators have been generated",
      });
    } catch (error: any) {
      console.error("Error analyzing health risks:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze health risks",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
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

  const exportToPDF = () => {
    if (!patientInfo) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Medical Record", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Patient Info
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Information", 20, yPos);
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${patientInfo.name}`, 20, yPos);
    yPos += 6;
    doc.text(`Age: ${patientInfo.age} years`, 20, yPos);
    yPos += 6;
    doc.text(`Health ID: ${patientInfo.healthId}`, 20, yPos);
    yPos += 6;
    doc.text(`Total Visits: ${consultations.length}`, 20, yPos);
    yPos += 12;

    // Medical Summary
    if (uniqueDiagnoses.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Past Diagnoses:", 20, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      uniqueDiagnoses.forEach((diagnosis) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`• ${diagnosis}`, 25, yPos);
        yPos += 6;
      });
      yPos += 6;
    }

    if (uniqueMedications.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Medications History:", 20, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      uniqueMedications.forEach((med) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`• ${med}`, 25, yPos);
        yPos += 6;
      });
      yPos += 6;
    }

    // Consultation History
    doc.setFont("helvetica", "bold");
    doc.text("Consultation History:", 20, yPos);
    yPos += 8;

    consultations.forEach((consultation, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      const event = extractTimelineData(consultation);
      doc.setFont("helvetica", "bold");
      doc.text(`Visit ${index + 1} - ${formatDate(consultation.created_at)}`, 20, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");

      if (event.diagnosis.length > 0) {
        doc.text(`Diagnosis: ${event.diagnosis.join(", ")}`, 25, yPos);
        yPos += 6;
      }

      if (event.medications.length > 0) {
        doc.text(`Medications: ${event.medications.join(", ")}`, 25, yPos);
        yPos += 6;
      }

      yPos += 4;
    });

    // Footer
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, 285, { align: "center" });

    doc.save(`${patientInfo.name.replace(/\s+/g, "_")}_medical_record.pdf`);
    toast({
      title: "PDF Exported",
      description: "Patient medical record has been downloaded",
    });
  };

  const generatePrescription = () => {
    if (!patientInfo) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("PRESCRIPTION", pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Divider
    doc.setDrawColor(0);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    // Patient Info
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Details:", 20, yPos);
    yPos += 7;
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${patientInfo.name}`, 20, yPos);
    yPos += 6;
    doc.text(`Age: ${patientInfo.age} years`, 20, yPos);
    yPos += 6;
    doc.text(`Health ID: ${patientInfo.healthId}`, 20, yPos);
    yPos += 12;

    // Divider
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;

    // Rx Symbol
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Rx", 20, yPos);
    yPos += 10;

    // Medications
    doc.setFontSize(12);
    if (prescription.medications) {
      doc.setFont("helvetica", "bold");
      doc.text("Medications:", 20, yPos);
      yPos += 7;
      doc.setFont("helvetica", "normal");
      const medLines = doc.splitTextToSize(prescription.medications, pageWidth - 40);
      doc.text(medLines, 25, yPos);
      yPos += medLines.length * 6 + 6;
    }

    if (prescription.dosage) {
      doc.setFont("helvetica", "bold");
      doc.text("Dosage:", 20, yPos);
      yPos += 7;
      doc.setFont("helvetica", "normal");
      doc.text(prescription.dosage, 25, yPos);
      yPos += 10;
    }

    if (prescription.duration) {
      doc.setFont("helvetica", "bold");
      doc.text("Duration:", 20, yPos);
      yPos += 7;
      doc.setFont("helvetica", "normal");
      doc.text(prescription.duration, 25, yPos);
      yPos += 10;
    }

    if (prescription.instructions) {
      doc.setFont("helvetica", "bold");
      doc.text("Instructions:", 20, yPos);
      yPos += 7;
      doc.setFont("helvetica", "normal");
      const instrLines = doc.splitTextToSize(prescription.instructions, pageWidth - 40);
      doc.text(instrLines, 25, yPos);
      yPos += instrLines.length * 6 + 6;
    }

    if (prescription.notes) {
      doc.setFont("helvetica", "bold");
      doc.text("Additional Notes:", 20, yPos);
      yPos += 7;
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(prescription.notes, pageWidth - 40);
      doc.text(noteLines, 25, yPos);
      yPos += noteLines.length * 6 + 6;
    }

    // Signature line
    yPos = Math.max(yPos + 20, 220);
    doc.line(pageWidth - 80, yPos, pageWidth - 20, yPos);
    doc.setFontSize(10);
    doc.text("Doctor's Signature", pageWidth - 50, yPos + 5, { align: "center" });

    // Footer
    doc.setFontSize(8);
    doc.text("This prescription is valid for 30 days from the date of issue.", pageWidth / 2, 280, { align: "center" });

    doc.save(`${patientInfo.name.replace(/\s+/g, "_")}_prescription_${new Date().toISOString().split("T")[0]}.pdf`);
    
    toast({
      title: "Prescription Generated",
      description: "Prescription PDF has been downloaded",
    });
    
    setShowPrescriptionDialog(false);
    setPrescription({ medications: "", dosage: "", instructions: "", duration: "", notes: "" });
    setPrescriptionWarning("");
    setSelectedConsultationForPrescription("");
  };

  const autoFillFromConsultation = async () => {
    if (!selectedConsultationForPrescription) {
      toast({
        title: "Select a consultation",
        description: "Please select a consultation to auto-fill from",
        variant: "destructive",
      });
      return;
    }

    const consultation = consultations.find(c => c.id === selectedConsultationForPrescription);
    if (!consultation) return;

    setIsGeneratingPrescription(true);
    setPrescriptionWarning("");

    try {
      const response = await supabase.functions.invoke("generate-prescription", {
        body: {
          type: "from_consultation",
          transcription: consultation.audio_transcription,
          fhirData: consultation.fhir_data,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const data = response.data;
      setPrescription({
        medications: data.medications || "",
        dosage: data.dosage || "",
        duration: data.duration || "",
        instructions: data.instructions || "",
        notes: data.notes || "",
      });

      if (data.warning) {
        setPrescriptionWarning(data.warning);
      }

      toast({
        title: "Auto-fill Complete",
        description: `Prescription data extracted (${data.confidence} confidence)`,
      });
    } catch (error: any) {
      console.error("Error auto-filling prescription:", error);
      toast({
        title: "Auto-fill Failed",
        description: error.message || "Could not extract prescription data",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPrescription(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        await processVoicePrescription(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      setAudioChunks([]);
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      toast({
        title: "Recording Started",
        description: "Dictate your prescription...",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice input",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const processVoicePrescription = async (audioBlob: Blob) => {
    setIsGeneratingPrescription(true);
    setPrescriptionWarning("");

    try {
      // First transcribe the audio
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const transcribeResponse = await supabase.functions.invoke("transcribe-audio", {
        body: { audio: base64Audio },
      });

      if (transcribeResponse.error) throw new Error(transcribeResponse.error.message);

      const transcription = transcribeResponse.data.text;

      // Now generate prescription from transcription
      const prescriptionResponse = await supabase.functions.invoke("generate-prescription", {
        body: {
          type: "from_audio",
          audioTranscription: transcription,
        },
      });

      if (prescriptionResponse.error) throw new Error(prescriptionResponse.error.message);

      const data = prescriptionResponse.data;
      setPrescription({
        medications: data.medications || "",
        dosage: data.dosage || "",
        duration: data.duration || "",
        instructions: data.instructions || "",
        notes: data.notes || "",
      });

      if (data.warning) {
        setPrescriptionWarning(data.warning);
      }

      toast({
        title: "Voice Input Processed",
        description: `Prescription extracted from your dictation (${data.confidence} confidence)`,
      });
    } catch (error: any) {
      console.error("Error processing voice prescription:", error);
      toast({
        title: "Voice Processing Failed",
        description: error.message || "Could not process voice input",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPrescription(false);
    }
  };

  const checkDrugInteractions = async () => {
    if (uniqueMedications.length < 2) {
      toast({
        title: "Not enough medications",
        description: "At least 2 medications are required to check interactions",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingInteractions(true);
    try {
      const response = await supabase.functions.invoke("check-drug-interactions", {
        body: { medications: uniqueMedications },
      });

      if (response.error) throw new Error(response.error.message);

      setDrugInteractions(response.data);
      toast({
        title: "Analysis Complete",
        description: `Found ${response.data.interactions?.length || 0} potential interactions`,
      });
    } catch (error: any) {
      console.error("Error checking drug interactions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to check drug interactions",
        variant: "destructive",
      });
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  const openWhatsAppReminder = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = phone.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const generateReminderMessage = () => {
    const latestConsultation = consultations[0];
    const event = latestConsultation ? extractTimelineData(latestConsultation) : null;
    
    let message = `Hi ${patientInfo?.name},\n\nThis is a follow-up reminder from your recent consultation at Vyana AI Clinic.\n\n`;
    
    if (event?.diagnosis.length) {
      message += `Diagnosis: ${event.diagnosis.join(", ")}\n`;
    }
    if (event?.medications.length) {
      message += `\nMedications:\n${event.medications.map(m => `• ${m}`).join("\n")}\n`;
    }
    
    message += `\nPlease ensure you're following the prescribed treatment. Feel free to reach out if you have any questions.\n\nBest regards,\nYour Healthcare Team`;
    
    return message;
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => setShowPrescriptionDialog(true)}>
                <FileEdit className="mr-2 h-4 w-4" />
                Prescription
              </Button>
              <Button onClick={() => navigate("/consultation")}>
                New Consultation
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Medical Summary */}
          <div className="space-y-6">
            {/* AI Health Risk Indicators - TOP */}
            <Card className="p-5 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <h3 className="font-semibold flex items-center gap-2 mb-4 text-primary">
                <HeartPulse className="h-5 w-5" />
                AI Health Risk Analysis
              </h3>
              
              {!healthRisks ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    AI-powered analysis of patient's medical history to identify potential health risks.
                  </p>
                  <Button 
                    onClick={analyzeHealthRisks} 
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analyze Health Risks
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Overall Risk Badge */}
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    healthRisks.risks.some(r => r.level === "high")
                      ? "bg-destructive/20 text-destructive"
                      : healthRisks.risks.some(r => r.level === "medium")
                      ? "bg-yellow-500/20 text-yellow-600"
                      : "bg-green-500/20 text-green-600"
                  }`}>
                    Overall Risk: {healthRisks.risks.some(r => r.level === "high") ? "High" : healthRisks.risks.some(r => r.level === "medium") ? "Moderate" : "Low"}
                  </div>

                  {healthRisks.risks.map((risk, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        risk.level === "high" 
                          ? "bg-destructive/10 border-destructive/30" 
                          : risk.level === "medium"
                          ? "bg-yellow-500/10 border-yellow-500/30"
                          : "bg-green-500/10 border-green-500/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className={`h-4 w-4 flex-shrink-0 ${
                            risk.level === "high" 
                              ? "text-destructive" 
                              : risk.level === "medium"
                              ? "text-yellow-500"
                              : "text-green-500"
                          }`} />
                          <span className="font-medium text-sm">{risk.condition}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          risk.level === "high" 
                            ? "bg-destructive/20 text-destructive" 
                            : risk.level === "medium"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-green-500/20 text-green-600"
                        }`}>
                          {risk.level}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{risk.reasoning}</p>
                    </div>
                  ))}

                  {healthRisks.recommendations.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium mb-2">Recommendations:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {healthRisks.recommendations.map((rec, idx) => (
                          <li key={idx}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={analyzeHealthRisks}
                    disabled={isAnalyzing}
                    className="w-full"
                  >
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Re-analyze
                  </Button>
                </div>
              )}
            </Card>

            {/* WhatsApp Follow-up Reminder */}
            <Card className="p-5 border-green-500/30">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <MessageCircle className="h-4 w-4 text-green-500" />
                Follow-up Reminder
              </h3>
              <div className="space-y-3">
                <Input
                  placeholder="Patient phone (+91...)"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-green-600 border-green-500/50 hover:bg-green-500/10"
                  onClick={() => {
                    const message = generateReminderMessage();
                    if (patientPhone) {
                      openWhatsAppReminder(patientPhone, message);
                    } else {
                      toast({
                        title: "Phone required",
                        description: "Please enter patient phone number",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Send WhatsApp Reminder
                </Button>
              </div>
            </Card>

            {/* Drug Interaction Checker */}
            {uniqueMedications.length >= 2 && (
              <Card className="p-5 border-orange-500/30">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Drug Interaction Checker
                </h3>
                
                {!drugInteractions ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Check for potential interactions between {uniqueMedications.length} medications.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={checkDrugInteractions}
                      disabled={isCheckingInteractions}
                    >
                      {isCheckingInteractions ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Check Interactions
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      drugInteractions.overallRisk === "high"
                        ? "bg-destructive/20 text-destructive"
                        : drugInteractions.overallRisk === "moderate"
                        ? "bg-yellow-500/20 text-yellow-600"
                        : "bg-green-500/20 text-green-600"
                    }`}>
                      {drugInteractions.interactions.length} interaction(s) found
                    </div>

                    {drugInteractions.interactions.map((interaction, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          interaction.severity === "severe" || interaction.severity === "contraindicated"
                            ? "bg-destructive/10 border-destructive/30"
                            : interaction.severity === "moderate"
                            ? "bg-yellow-500/10 border-yellow-500/30"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-xs font-medium">{interaction.drugs.join(" + ")}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          interaction.severity === "severe" || interaction.severity === "contraindicated"
                            ? "bg-destructive/20 text-destructive"
                            : interaction.severity === "moderate"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {interaction.severity}
                        </span>
                        <p className="text-xs text-muted-foreground mt-2">{interaction.description}</p>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={checkDrugInteractions}
                      disabled={isCheckingInteractions}
                    >
                      Re-check
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* Visit Summary */}
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

      {/* Prescription Generator Dialog */}
      <Dialog open={showPrescriptionDialog} onOpenChange={(open) => {
        setShowPrescriptionDialog(open);
        if (!open) {
          setPrescriptionWarning("");
          setSelectedConsultationForPrescription("");
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Prescription</DialogTitle>
            <DialogDescription>
              Create a prescription for {patientInfo?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* AI Auto-fill Section */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-primary" />
                AI-Assisted Generation
              </h4>
              
              <div className="space-y-3">
                {/* Auto-fill from consultation */}
                <div className="flex gap-2">
                  <Select
                    value={selectedConsultationForPrescription}
                    onValueChange={setSelectedConsultationForPrescription}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select consultation" />
                    </SelectTrigger>
                    <SelectContent>
                      {consultations.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {new Date(c.created_at).toLocaleDateString()} - Visit
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={autoFillFromConsultation}
                    disabled={isGeneratingPrescription || !selectedConsultationForPrescription}
                  >
                    {isGeneratingPrescription ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Voice input */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    disabled={isGeneratingPrescription}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="mr-2 h-4 w-4" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" />
                        Dictate Prescription
                      </>
                    )}
                  </Button>
                </div>

                {isGeneratingPrescription && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing...
                  </p>
                )}
              </div>
            </Card>

            {prescriptionWarning && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {prescriptionWarning}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="medications">Medications *</Label>
              <Textarea
                id="medications"
                placeholder="Enter medications (one per line)"
                value={prescription.medications}
                onChange={(e) => setPrescription({ ...prescription, medications: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                placeholder="e.g., 1 tablet twice daily"
                value={prescription.dosage}
                onChange={(e) => setPrescription({ ...prescription, dosage: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g., 7 days, 2 weeks"
                value={prescription.duration}
                onChange={(e) => setPrescription({ ...prescription, duration: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Special instructions for the patient"
                value={prescription.instructions}
                onChange={(e) => setPrescription({ ...prescription, instructions: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes"
                value={prescription.notes}
                onChange={(e) => setPrescription({ ...prescription, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={generatePrescription} disabled={!prescription.medications.trim()}>
              <Download className="mr-2 h-4 w-4" />
              Generate PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientProfile;
