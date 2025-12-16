import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Building2,
  Stethoscope,
  CalendarPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [expandedDoctors, setExpandedDoctors] = useState<Set<string>>(new Set());
  const [expandedConsultations, setExpandedConsultations] = useState<Set<string>>(new Set());
  
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{doctorGroups.length}</p>
                <p className="text-sm text-muted-foreground">Doctors Visited</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{consultations.length}</p>
                <p className="text-sm text-muted-foreground">Total Visits</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {consultations.length > 0 ? formatDate(consultations[0].created_at) : "-"}
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
                <p className="text-sm font-medium truncate">{profile?.national_health_id || "Not set"}</p>
                <p className="text-sm text-muted-foreground">Health ID</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Medical History</TabsTrigger>
            <TabsTrigger value="appointments" className="relative">
              Appointments
              {pendingAppointments > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {pendingAppointments}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Medical History Tab */}
          <TabsContent value="history" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Your Medical History</h2>
              <p className="text-muted-foreground">Consultations grouped by healthcare provider</p>
            </div>

            {doctorGroups.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No consultations yet</h3>
                <p className="text-muted-foreground">
                  Your consultation history will appear here after your first visit.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {doctorGroups.map((group) => (
                  <Card key={group.doctor_id} className="overflow-hidden">
                    <Collapsible
                      open={expandedDoctors.has(group.doctor_id)}
                      onOpenChange={() => toggleDoctorExpanded(group.doctor_id)}
                    >
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openBookingDialog(group.doctor_id);
                                }}
                              >
                                <CalendarPlus className="h-4 w-4 mr-1" />
                                Book
                              </Button>
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
                              const medications = extractMedications(fhirData);
                              const diagnoses = extractDiagnosis(fhirData);
                              const isExpanded = expandedConsultations.has(consultation.id);

                              return (
                                <Card key={consultation.id} className="p-4 bg-muted/30">
                                  <div
                                    className="cursor-pointer"
                                    onClick={() => toggleConsultationExpanded(consultation.id)}
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

                                  {isExpanded && medications.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
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
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Your Appointments</h2>
                <p className="text-muted-foreground">View and manage your appointment requests</p>
              </div>
            </div>

            {appointments.length === 0 ? (
              <Card className="p-8 text-center">
                <CalendarPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No appointments yet</h3>
                <p className="text-muted-foreground mb-4">
                  Book an appointment with a doctor from your medical history.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.id} className="p-4">
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
                            Doctor's note: {appointment.doctor_notes}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
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
