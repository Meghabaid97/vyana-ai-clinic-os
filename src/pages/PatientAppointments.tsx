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
import LocationSelector from "@/components/LocationSelector";
import { calculateDistance } from "@/lib/formatters";
import {
  Loader2,
  Calendar,
  ArrowLeft,
  CalendarPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  Star,
  Navigation,
  Stethoscope,
  Search,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <PatientHeader patientName={profile?.name || "Patient"} title="Appointments" subtitle="Book and manage your appointments" />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/patient-dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowLocationDialog(true)}>
              <MapPin className="h-4 w-4 mr-2" />
              {userLocation.city || "Set Location"}
            </Button>
            <Button onClick={() => setShowBookingDialog(true)}>
              <CalendarPlus className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </div>
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

        {/* Nearby Doctors */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {userLocation.city ? `Doctors near ${userLocation.city}` : "Available Doctors"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {sortedDoctors.length} doctor{sortedDoctors.length !== 1 ? "s" : ""} available
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate("/find-doctors")} className="gap-2">
              <Search className="h-4 w-4" />
              Search All Doctors
            </Button>
          </div>

          {sortedDoctors.length === 0 ? (
            <div className="p-8 text-center">
              <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No doctors available</h3>
              <p className="text-muted-foreground">
                Check back later or adjust your location
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sortedDoctors.slice(0, 6).map((doctor) => (
                <Card 
                  key={doctor.user_id} 
                  className="p-4 hover:shadow-soft hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedDoctorId(doctor.user_id);
                    setShowBookingDialog(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">Dr. {doctor.full_name}</h3>
                      {doctor.specialization && (
                        <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                      )}
                    </div>
                    {doctor.avgRating !== undefined && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium text-amber-600">
                          {doctor.avgRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({doctor.totalRatings})
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    {doctor.clinic_name && (
                      <p className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        {doctor.clinic_name}
                        {doctor.city && `, ${doctor.city}`}
                      </p>
                    )}
                    {doctor.distance !== undefined && (
                      <p className="flex items-center gap-2 text-primary">
                        <Navigation className="h-3.5 w-3.5" />
                        {doctor.distance < 1 
                          ? `${Math.round(doctor.distance * 1000)}m away`
                          : `${doctor.distance.toFixed(1)} km away`}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Appointments List */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-accent" />
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
              {appointments.map((appointment) => {
                const doctor = doctors.find(d => d.user_id === appointment.doctor_id);
                return (
                  <Card key={appointment.id} className="p-4 bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="font-medium">{formatDate(appointment.requested_date)}</span>
                          <span className="text-muted-foreground">at</span>
                          <span className="font-medium">{appointment.requested_time_slot}</span>
                        </div>
                        {doctor && (
                          <p className="text-sm text-muted-foreground">
                            Dr. {doctor.full_name} {doctor.specialization && `• ${doctor.specialization}`}
                          </p>
                        )}
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
                );
              })}
            </div>
          )}
        </Card>
      </div>

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