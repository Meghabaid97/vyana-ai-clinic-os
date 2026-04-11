import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import LocationSelector from "@/components/LocationSelector";
import { calculateDistance } from "@/lib/formatters";
import {
  Loader2,
  Calendar,
  CalendarPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  Star,
  Navigation,
  Stethoscope,
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
  pincode: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface DoctorProfile {
  user_id: string;
  full_name: string;
  specialization: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  pincode: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  avgRating?: number;
  totalRatings?: number;
  distance?: number;
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
  const [userLocation, setUserLocation] = useState({
    pincode: "",
    city: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  
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

  // Sort doctors by distance when location changes
  const sortedDoctors = useMemo(() => {
    if (!userLocation.latitude || !userLocation.longitude) {
      return doctors;
    }

    return [...doctors].map(doctor => {
      if (doctor.latitude && doctor.longitude) {
        doctor.distance = calculateDistance(
          userLocation.latitude!,
          userLocation.longitude!,
          doctor.latitude,
          doctor.longitude
        );
      }
      return doctor;
    }).sort((a, b) => {
      // Prioritize doctors with ratings and distance
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      if (a.distance !== undefined) return -1;
      if (b.distance !== undefined) return 1;
      return 0;
    });
  }, [doctors, userLocation]);

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
        
        // Set user location from profile
        if (patientData.latitude && patientData.longitude) {
          setUserLocation({
            pincode: patientData.pincode || "",
            city: patientData.city || "",
            latitude: patientData.latitude,
            longitude: patientData.longitude,
          });
        }

        // Load appointments
        const { data: appointmentsData } = await supabase
          .from("appointments")
          .select("*")
          .order("requested_date", { ascending: false });

        setAppointments(appointmentsData || []);
      }

      // Load doctors with their ratings
      const { data: doctorsData } = await supabase
        .from("doctor_profiles")
        .select("user_id, full_name, specialization, clinic_name, clinic_address, pincode, city, latitude, longitude")
        .eq("is_profile_complete", true);

      if (doctorsData) {
        // Load ratings for doctors
        const { data: ratingsData } = await supabase
          .from("doctor_ratings")
          .select("doctor_id, rating");

        // Calculate average ratings
        const ratingsByDoctor = new Map<string, { total: number; count: number }>();
        ratingsData?.forEach(r => {
          const existing = ratingsByDoctor.get(r.doctor_id) || { total: 0, count: 0 };
          ratingsByDoctor.set(r.doctor_id, {
            total: existing.total + r.rating,
            count: existing.count + 1,
          });
        });

        const doctorsWithRatings = doctorsData.map(doc => ({
          ...doc,
          avgRating: ratingsByDoctor.has(doc.user_id) 
            ? ratingsByDoctor.get(doc.user_id)!.total / ratingsByDoctor.get(doc.user_id)!.count
            : undefined,
          totalRatings: ratingsByDoctor.get(doc.user_id)?.count || 0,
        }));

        setDoctors(doctorsWithRatings);
      }
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

  const saveUserLocation = async () => {
    if (!profile) return;
    
    try {
      await supabase
        .from("patients")
        .update({
          pincode: userLocation.pincode,
          city: userLocation.city,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        })
        .eq("id", profile.id);

      toast({
        title: "Location Saved",
        description: "Your location preferences have been updated",
      });
      setShowLocationDialog(false);
    } catch (error) {
      console.error("Error saving location:", error);
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
  const hasLocation = Boolean(userLocation.city || userLocation.pincode);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 sm:px-5 pt-4 pb-6 space-y-5">
      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-foreground leading-tight">Appointments</h1>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                Book, track, and manage your visits without leaving the app.
              </p>
            </div>
          </div>
          <Button
            size="icon"
            onClick={() => setShowBookingDialog(true)}
            className="h-10 w-10 shrink-0 rounded-xl"
            aria-label="Book appointment"
          >
            <CalendarPlus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-border bg-background p-3 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{pendingCount}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Pending</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background p-3 flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{upcomingCount}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Upcoming</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-bold text-foreground">Available Doctors</h2>
          <Button
            variant={hasLocation ? "outline" : "secondary"}
            size="sm"
            onClick={() => setShowLocationDialog(true)}
            className="h-8 rounded-full px-3 text-xs"
          >
            <MapPin className="mr-1 h-3.5 w-3.5" />
            <span className="max-w-[7.5rem] truncate">{userLocation.city || userLocation.pincode || "Set location"}</span>
          </Button>
        </div>

        {sortedDoctors.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {hasLocation ? "No doctors found nearby yet" : "Set your location to see nearby doctors"}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {hasLocation
                ? "Try another area or check back later when more doctors are available."
                : "Add your city or pincode first so we can show the most relevant doctors for you."}
            </p>
            <Button onClick={() => setShowLocationDialog(true)} variant="outline" className="mt-4 w-full rounded-xl">
              <MapPin className="mr-2 h-4 w-4" />
              {hasLocation ? "Change location" : "Set location"}
            </Button>
          </div>
        ) : (
          <div className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-2 sm:overflow-visible sm:px-0">
            {sortedDoctors.slice(0, 6).map((doctor) => (
              <button
                key={doctor.user_id}
                onClick={() => { setSelectedDoctorId(doctor.user_id); setShowBookingDialog(true); }}
                className="min-w-[82%] snap-start rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30 sm:min-w-0"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-foreground truncate">Dr. {doctor.full_name}</h3>
                    {doctor.specialization && <p className="text-[12px] text-muted-foreground truncate">{doctor.specialization}</p>}
                  </div>
                  {doctor.avgRating !== undefined && (
                    <span className="shrink-0 flex items-center gap-0.5 text-[12px] font-medium text-primary">
                      <Star className="h-3 w-3 fill-primary" /> {doctor.avgRating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-[12px] text-muted-foreground">
                  {doctor.clinic_name && <p className="flex items-center gap-1.5 truncate"><MapPin className="h-3 w-3 shrink-0" />{doctor.clinic_name}{doctor.city && `, ${doctor.city}`}</p>}
                  {doctor.distance !== undefined && (
                    <p className="flex items-center gap-1.5 text-primary"><Navigation className="h-3 w-3 shrink-0" />{doctor.distance < 1 ? `${Math.round(doctor.distance * 1000)}m` : `${doctor.distance.toFixed(1)} km`}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[15px] font-bold text-foreground">
          Your Appointments
          {appointments.length > 0 && <span className="ml-1.5 text-[12px] font-normal text-muted-foreground">({appointments.length})</span>}
        </h2>

        {appointments.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <CalendarPlus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No appointments yet</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Book your first visit and track approvals, upcoming times, and doctor notes here.
            </p>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => setShowBookingDialog(true)} className="w-full rounded-xl" disabled={!sortedDoctors.length}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Book appointment
              </Button>
              {!hasLocation && (
                <Button variant="outline" onClick={() => setShowLocationDialog(true)} className="w-full rounded-xl">
                  <MapPin className="mr-2 h-4 w-4" />
                  Add location first
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((appointment) => {
              const doctor = doctors.find(d => d.user_id === appointment.doctor_id);
              return (
                <div key={appointment.id} className="rounded-2xl border border-border bg-card p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
                        <span className="font-semibold text-foreground">{formatDate(appointment.requested_date)}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-foreground">{appointment.requested_time_slot}</span>
                      </div>
                      {doctor && (
                        <p className="text-[12px] text-muted-foreground truncate">
                          Dr. {doctor.full_name}{doctor.specialization && ` · ${doctor.specialization}`}
                        </p>
                      )}
                      {appointment.reason && <p className="text-[12px] text-muted-foreground truncate">{appointment.reason}</p>}
                      {appointment.doctor_notes && appointment.status !== "pending" && (
                        <p className="mt-1 rounded-lg bg-muted/50 p-2 text-[12px]">Note: {appointment.doctor_notes}</p>
                      )}
                    </div>
                    <div className="shrink-0">{getStatusBadge(appointment.status)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {appointments.length === 0 && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground">How booking works</h3>
          <div className="mt-3 space-y-3">
            {[
              { icon: MapPin, title: "Set your location", copy: "We show doctors nearest to your city or pincode." },
              { icon: CalendarPlus, title: "Request a slot", copy: "Pick a doctor, date, and time that works for you." },
              { icon: CheckCircle, title: "Track updates", copy: "See approvals, upcoming visits, and notes in one place." },
            ].map((step) => (
              <div key={step.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{step.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Your Location</DialogTitle>
            <DialogDescription>
              We'll show you doctors near your location
            </DialogDescription>
          </DialogHeader>

          <LocationSelector
            pincode={userLocation.pincode}
            city={userLocation.city}
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            onLocationChange={setUserLocation}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveUserLocation}>
              Save Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  {sortedDoctors.map((doctor) => (
                    <SelectItem key={doctor.user_id} value={doctor.user_id}>
                      <div className="flex items-center gap-2">
                        <span>Dr. {doctor.full_name}</span>
                        {doctor.specialization && (
                          <span className="text-muted-foreground">- {doctor.specialization}</span>
                        )}
                        {doctor.avgRating !== undefined && (
                          <span className="flex items-center gap-1 text-amber-600">
                            <Star className="h-3 w-3 fill-amber-500" />
                            {doctor.avgRating.toFixed(1)}
                          </span>
                        )}
                        {doctor.distance !== undefined && (
                          <span className="text-muted-foreground text-xs">
                            ({doctor.distance.toFixed(1)} km)
                          </span>
                        )}
                      </div>
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