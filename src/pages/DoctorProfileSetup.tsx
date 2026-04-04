import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import LocationSelector from "@/components/LocationSelector";
import {
  Loader2,
  Stethoscope,
  User,
  Phone,
  Building,
  MapPin,
  Award,
  GraduationCap,
  Clock,
  Shield,
  Calendar,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SPECIALIZATIONS = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Endocrinologist",
  "Gastroenterologist",
  "Neurologist",
  "Oncologist",
  "Orthopedic Surgeon",
  "Pediatrician",
  "Psychiatrist",
  "Pulmonologist",
  "Radiologist",
  "Surgeon",
  "Urologist",
  "Other",
];

const DAYS_OF_WEEK = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
];

const DoctorProfileSetup = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    medicalLicenseNumber: "",
    specialization: "",
    clinicName: "",
    clinicAddress: "",
    phone: "",
    yearsOfExperience: "",
    qualification: "",
  });
  const [availabilityData, setAvailabilityData] = useState({
    availabilityDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    availabilityStartTime: "09:00",
    availabilityEndTime: "17:00",
    maxAppointmentsPerDay: "10",
    appointmentDurationMinutes: "30",
  });
  const [locationData, setLocationData] = useState({
    pincode: "",
    city: "",
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user is a doctor
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (!roles || roles.length === 0 || roles[0].role !== "doctor") {
      navigate("/app");
      return;
    }

    // Load existing profile if any
    const { data: profile } = await supabase
      .from("doctor_profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (profile) {
      setExistingProfile(profile);
      setFormData({
        fullName: profile.full_name || "",
        medicalLicenseNumber: profile.medical_license_number || "",
        specialization: profile.specialization || "",
        clinicName: profile.clinic_name || "",
        clinicAddress: profile.clinic_address || "",
        phone: profile.phone || "",
        yearsOfExperience: profile.years_of_experience?.toString() || "",
        qualification: profile.qualification || "",
      });
      setAvailabilityData({
        availabilityDays: profile.availability_days || ["monday", "tuesday", "wednesday", "thursday", "friday"],
        availabilityStartTime: profile.availability_start_time || "09:00",
        availabilityEndTime: profile.availability_end_time || "17:00",
        maxAppointmentsPerDay: profile.max_appointments_per_day?.toString() || "10",
        appointmentDurationMinutes: profile.appointment_duration_minutes?.toString() || "30",
      });
      setLocationData({
        pincode: profile.pincode || "",
        city: profile.city || "",
        latitude: profile.latitude || null,
        longitude: profile.longitude || null,
      });
    } else {
      // Pre-fill name from user metadata
      setFormData(prev => ({
        ...prev,
        fullName: session.user.user_metadata?.name || session.user.email?.split("@")[0] || "",
      }));
    }

    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const profileData = {
        user_id: user.id,
        full_name: formData.fullName,
        medical_license_number: formData.medicalLicenseNumber || null,
        specialization: formData.specialization || null,
        clinic_name: formData.clinicName || null,
        clinic_address: formData.clinicAddress || null,
        phone: formData.phone || null,
        years_of_experience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : null,
        qualification: formData.qualification || null,
        is_profile_complete: true,
        availability_days: availabilityData.availabilityDays,
        availability_start_time: availabilityData.availabilityStartTime,
        availability_end_time: availabilityData.availabilityEndTime,
        max_appointments_per_day: parseInt(availabilityData.maxAppointmentsPerDay) || 10,
        appointment_duration_minutes: parseInt(availabilityData.appointmentDurationMinutes) || 30,
        pincode: locationData.pincode || null,
        city: locationData.city || null,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      };

      if (existingProfile) {
        const { error } = await supabase
          .from("doctor_profiles")
          .update(profileData)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("doctor_profiles")
          .insert(profileData);
        if (error) throw error;
      }

      toast({
        title: "Profile saved!",
        description: "Your profile has been updated successfully.",
      });

      navigate("/doctor-dashboard");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    navigate("/doctor-dashboard");
  };

  const toggleDay = (day: string) => {
    setAvailabilityData(prev => ({
      ...prev,
      availabilityDays: prev.availabilityDays.includes(day)
        ? prev.availabilityDays.filter(d => d !== day)
        : [...prev.availabilityDays, day]
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Stethoscope className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">
            {existingProfile ? "Edit Your Profile" : "Complete Your Profile"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {existingProfile 
              ? "Update your professional information" 
              : "Set up your doctor profile to get started"}
          </p>
        </div>

        <Card className="p-8">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              <TabsContent value="profile" className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Basic Information
                  </h2>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Dr. John Doe"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Info */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Professional Details
                  </h2>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="medicalLicenseNumber" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Medical License Number
                      </Label>
                      <Input
                        id="medicalLicenseNumber"
                        value={formData.medicalLicenseNumber}
                        onChange={(e) => setFormData({ ...formData, medicalLicenseNumber: e.target.value })}
                        placeholder="MCI-123456"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Select 
                        value={formData.specialization} 
                        onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALIZATIONS.map((spec) => (
                            <SelectItem key={spec} value={spec}>
                              {spec}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qualification" className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Qualification
                      </Label>
                      <Input
                        id="qualification"
                        value={formData.qualification}
                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                        placeholder="MBBS, MD"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="yearsOfExperience" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Years of Experience
                      </Label>
                      <Input
                        id="yearsOfExperience"
                        type="number"
                        value={formData.yearsOfExperience}
                        onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                        placeholder="10"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Clinic Info */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    Clinic Information
                  </h2>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="clinicName">Clinic/Hospital Name</Label>
                      <Input
                        id="clinicName"
                        value={formData.clinicName}
                        onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                        placeholder="City Medical Center"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clinicAddress" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Clinic Address
                      </Label>
                      <Textarea
                        id="clinicAddress"
                        value={formData.clinicAddress}
                        onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })}
                        placeholder="123 Medical Street, City, State - 123456"
                        rows={2}
                      />
                    </div>

                    {/* Location */}
                    <LocationSelector
                      pincode={locationData.pincode}
                      city={locationData.city}
                      latitude={locationData.latitude}
                      longitude={locationData.longitude}
                      onLocationChange={setLocationData}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="availability" className="space-y-6">
                {/* Availability Days */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Working Days
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day) => (
                      <div
                        key={day.id}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                          availabilityData.availabilityDays.includes(day.id)
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => toggleDay(day.id)}
                      >
                        <Checkbox
                          checked={availabilityData.availabilityDays.includes(day.id)}
                          onCheckedChange={() => toggleDay(day.id)}
                        />
                        <span className="text-sm font-medium">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Working Hours */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Working Hours
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={availabilityData.availabilityStartTime}
                        onChange={(e) => setAvailabilityData({ ...availabilityData, availabilityStartTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={availabilityData.availabilityEndTime}
                        onChange={(e) => setAvailabilityData({ ...availabilityData, availabilityEndTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Appointment Settings */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Appointment Settings</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Max Appointments Per Day</Label>
                      <Input
                        type="number"
                        value={availabilityData.maxAppointmentsPerDay}
                        onChange={(e) => setAvailabilityData({ ...availabilityData, maxAppointmentsPerDay: e.target.value })}
                        min="1"
                        max="50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Appointment Duration (minutes)</Label>
                      <Select
                        value={availabilityData.appointmentDurationMinutes}
                        onValueChange={(value) => setAvailabilityData({ ...availabilityData, appointmentDurationMinutes: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="20">20 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  {existingProfile ? "Cancel" : "Skip for now"}
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default DoctorProfileSetup;
