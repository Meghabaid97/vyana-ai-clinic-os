import { useState, useEffect } from "react";
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
  ArrowLeft,
  CalendarPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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

interface PatientProfile {
  id: string;
  name: string;
  phone: string | null;
  national_health_id: string | null;
}

interface DoctorProfile {
  user_id: string;
  full_name: string;
  specialization: string | null;
  clinic_name: string | null;
}

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM",
  "04:30 PM", "05:00 PM", "05:30 PM"
];

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Booking state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentReason, setAppointmentReason] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

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

      // Load patient profile
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (patientData) {
        setProfile(patientData);

        // Load appointments
        const { data: appointmentsData } = await supabase
          .from("appointments")
          .select("*")
          .order("requested_date", { ascending: false });

        setAppointments(appointmentsData || []);
      }

      // Load doctors for booking
      const { data: doctorsData } = await supabase
        .from("doctor_profiles")
        .select("user_id, full_name, specialization, clinic_name")
        .eq("is_profile_complete", true);

      setDoctors(doctorsData || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
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
      setSelectedDoctorId("");
      setAppointmentDate("");
      setAppointmentTime("");
      setAppointmentReason("");
      loadData();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
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

  const pendingCount = appointments.filter(a => a.status === "pending").length;
  const upcomingCount = appointments.filter(a => a.status === "approved" && new Date(a.requested_date) >= new Date()).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-500/5">
      <PatientHeader patientName="Patient" title="Appointments" subtitle="Book and manage your appointments" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/patient-dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={() => setShowBookingDialog(true)}>
            <CalendarPlus className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{upcomingCount}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Your Appointments</h2>
              <p className="text-sm text-muted-foreground">
                {appointments.length} total appointment{appointments.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="p-8 text-center">
              <CalendarPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No appointments yet</h3>
              <p className="text-muted-foreground mb-4">
                Book your first appointment with a healthcare provider.
              </p>
              <Button onClick={() => setShowBookingDialog(true)}>
                <CalendarPlus className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
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
        </Card>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Request an appointment with a healthcare provider
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Select Doctor</Label>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.user_id} value={doctor.user_id}>
                      Dr. {doctor.full_name} {doctor.specialization && `- ${doctor.specialization}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              disabled={isBooking || !appointmentDate || !appointmentTime || !selectedDoctorId}
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

export default PatientAppointments;
