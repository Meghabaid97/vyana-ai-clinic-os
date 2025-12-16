import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PatientHeader from "@/components/PatientHeader";
import {
  Loader2,
  Calendar,
  FileText,
  Pill,
  Clock,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
  Building2,
  Stethoscope,
  CalendarPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  FolderOpen,
  Heart,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
// Tabs removed - using collapsible sections instead
import HealthRecordsTab from "@/components/HealthRecordsTab";

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

interface PatientProfile {
  id: string;
  name: string;
  age: number | null;
  phone: string | null;
  national_health_id: string | null;
}

interface DoctorGroup {
  doctor_id: string;
  consultations: Consultation[];
  firstVisit: string;
  lastVisit: string;
}

interface Appointment {
  id: string;
  doctor_id: string;
  requested_date: string;
  requested_time_slot: string;
  reason: string | null;
  status: string;
  doctor_notes: string | null;
  patient_phone: string;
  created_at: string;
}

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM",
  "04:30 PM", "05:00 PM", "05:30 PM"
];

const PatientDashboard = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [expandedDoctors, setExpandedDoctors] = useState<Set<string>>(new Set());
  const [expandedConsultations, setExpandedConsultations] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["history", "appointments", "records"]));
  
  // Appointment booking state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentReason, setAppointmentReason] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Group consultations by doctor
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
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Load patient profile
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (patientData) {
        setProfile({
          id: patientData.id,
          name: patientData.name,
          age: patientData.age,
          phone: patientData.phone,
          national_health_id: patientData.national_health_id,
        });

        // If patient has a health ID, fetch their consultations
        if (patientData.national_health_id) {
          const { data: consultationsData, error } = await supabase
            .from("consultations")
            .select("*")
            .eq("patient_national_health_id", patientData.national_health_id)
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Error fetching consultations:", error);
          } else {
            setConsultations(consultationsData || []);
          }
        }

        // Load patient appointments
        const { data: appointmentsData } = await supabase
          .from("appointments")
          .select("*")
          .order("requested_date", { ascending: false });

        setAppointments(appointmentsData || []);
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

  const bookAppointment = async () => {
    if (!profile?.id || !selectedDoctorId || !appointmentDate || !appointmentTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .insert({
          patient_id: profile.id,
          doctor_id: selectedDoctorId,
          requested_date: appointmentDate,
          requested_time_slot: appointmentTime,
          reason: appointmentReason || null,
          patient_phone: profile.phone || "",
        });

      if (error) throw error;

      toast({
        title: "Appointment Requested",
        description: "Your appointment request has been sent to the doctor",
      });

      setShowBookingDialog(false);
      setSelectedDoctorId(null);
      setAppointmentDate("");
      setAppointmentTime("");
      setAppointmentReason("");

      // Reload appointments
      const { data: appointmentsData } = await supabase
        .from("appointments")
        .select("*")
        .order("requested_date", { ascending: false });
      setAppointments(appointmentsData || []);
    } catch (error: any) {
      console.error("Error booking appointment:", error);
      toast({
        title: "Error",
        description: "Failed to book appointment",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };


  const openBookingDialog = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    setShowBookingDialog(true);
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

  const toggleConsultationExpanded = (consultationId: string) => {
    const newExpanded = new Set(expandedConsultations);
    if (newExpanded.has(consultationId)) {
      newExpanded.delete(consultationId);
    } else {
      newExpanded.add(consultationId);
    }
    setExpandedConsultations(newExpanded);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
      pending: { variant: "secondary", icon: <AlertCircle className="h-3 w-3" /> },
      approved: { variant: "default", icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
      completed: { variant: "outline", icon: <CheckCircle className="h-3 w-3" /> },
      cancelled: { variant: "outline", icon: <XCircle className="h-3 w-3" /> },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingAppointments = appointments.filter((a) => a.status === "pending").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-teal-500/5">
      <PatientHeader patientName={profile?.name || "Patient"} />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Eco Banner */}
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-emerald-700 dark:text-emerald-400">Going Paperless Saves Trees!</p>
                <p className="text-sm text-muted-foreground">
                  Your {consultations.length} digital records saved ~{consultations.length * 5} sheets of paper
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600">
              🌱 Eco-Friendly
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-5 bg-gradient-to-br from-teal-500/10 to-transparent border-teal-500/20 hover:shadow-lg hover:shadow-teal-500/5 transition-all">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-teal-600">{doctorGroups.length}</p>
                <p className="text-xs text-muted-foreground">Doctors</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5 transition-all">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-600">{consultations.length}</p>
                <p className="text-xs text-muted-foreground">Visits</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20 hover:shadow-lg hover:shadow-cyan-500/5 transition-all">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-cyan-600">
                  {consultations.length > 0 ? formatDate(consultations[0].created_at) : "No visits"}
                </p>
                <p className="text-xs text-muted-foreground">Last Visit</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-violet-500/10 to-transparent border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/5 transition-all">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Heart className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-violet-600 truncate max-w-[100px]">
                  {profile?.national_health_id ? `...${profile.national_health_id.slice(-4)}` : "Not set"}
                </p>
                <p className="text-xs text-muted-foreground">Health ID</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Side-by-Side Layout: Medical History & Health Records */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Medical History Section */}
          <Card className="overflow-hidden h-fit">
            <div className="p-4 border-b bg-gradient-to-r from-teal-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Medical History</h2>
                  <p className="text-sm text-muted-foreground">
                    {consultations.length} consultation{consultations.length !== 1 ? "s" : ""} • {doctorGroups.length} provider{doctorGroups.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {doctorGroups.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No consultations yet</h3>
                  <p className="text-muted-foreground">
                    Your consultation history will appear here after your first visit.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {doctorGroups.map((group) => (
                    <Collapsible
                      key={group.doctor_id}
                      open={expandedDoctors.has(group.doctor_id)}
                      onOpenChange={() => toggleDoctorExpanded(group.doctor_id)}
                    >
                      <Card className="overflow-hidden bg-muted/30">
                        <CollapsibleTrigger asChild>
                          <div className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-sm">Healthcare Provider</h3>
                                  <p className="text-xs text-muted-foreground">
                                    {group.consultations.length} visit{group.consultations.length > 1 ? "s" : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openBookingDialog(group.doctor_id);
                                  }}
                                >
                                  <CalendarPlus className="h-3 w-3 mr-1" />
                                  Book
                                </Button>
                                {expandedDoctors.has(group.doctor_id) ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="border-t px-3 pb-3">
                            <div className="space-y-2 mt-3">
                              {group.consultations.map((consultation) => {
                                const fhirData = parseFHIRData(consultation.fhir_data);
                                const diagnoses = extractDiagnosis(fhirData);

                                return (
                                  <div
                                    key={consultation.id}
                                    className="p-3 bg-background rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => setSelectedConsultation(consultation)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-sm font-medium">{formatDate(consultation.created_at)}</span>
                                        </div>
                                        {diagnoses.length > 0 && (
                                          <div className="mt-1 flex flex-wrap gap-1">
                                            {diagnoses.slice(0, 2).map((d, i) => (
                                              <span
                                                key={i}
                                                className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs rounded"
                                              >
                                                {d}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  </div>
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
            </div>
          </Card>

          {/* Health Records Section */}
          <Card className="overflow-hidden h-fit">
            <div className="p-4 border-b bg-gradient-to-r from-violet-500/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Health Records</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload and manage your medical documents
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto">
              {profile && userId && (
                <HealthRecordsTab
                  patientId={profile.id}
                  userId={userId}
                  doctors={doctorGroups.map((g) => ({
                    doctor_id: g.doctor_id,
                    lastVisit: g.lastVisit,
                  }))}
                />
              )}
            </div>
          </Card>
        </div>

        {/* Appointments Section - Full Width */}
        <Card className="overflow-hidden">
          <Collapsible
            open={expandedSections.has("appointments")}
            onOpenChange={() => toggleSection("appointments")}
          >
            <CollapsibleTrigger asChild>
              <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <CalendarPlus className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Appointments</h2>
                      <p className="text-sm text-muted-foreground">
                        View and manage your appointment requests
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pendingAppointments > 0 && (
                      <Badge className="bg-orange-500 text-white">
                        {pendingAppointments} pending
                      </Badge>
                    )}
                    <Badge variant="outline" className="bg-orange-500/10 border-orange-500/30 text-orange-600">
                      {appointments.length}
                    </Badge>
                    {expandedSections.has("appointments") ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="animate-accordion-down">
              <div className="p-4">
                {appointments.length === 0 ? (
                  <div className="p-8 text-center">
                    <CalendarPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No appointments yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Book an appointment with a doctor from your medical history.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appointments.map((appointment) => (
                      <Card key={appointment.id} className="p-4 bg-muted/30">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <span className="font-medium">{formatDate(appointment.requested_date)}</span>
                              <span className="text-muted-foreground">at</span>
                              <span className="font-medium">{appointment.requested_time_slot}</span>
                            </div>
                            {appointment.reason && (
                              <p className="text-sm text-muted-foreground">
                                Reason: {appointment.reason}
                              </p>
                            )}
                            {appointment.doctor_notes && appointment.status !== "pending" && (
                              <p className="text-sm bg-muted p-2 rounded">
                                Doctor&apos;s note: {appointment.doctor_notes}
                              </p>
                            )}
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
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

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Request an appointment with this healthcare provider
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Preferred Date</Label>
              <Input
                id="date"
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={getTodayDate()}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="time">Preferred Time</Label>
              <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Visit (optional)</Label>
              <Textarea
                id="reason"
                value={appointmentReason}
                onChange={(e) => setAppointmentReason(e.target.value)}
                placeholder="Describe your symptoms or reason for the visit..."
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={bookAppointment} 
              disabled={isBooking || !appointmentDate || !appointmentTime}
            >
              {isBooking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Request Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientDashboard;
