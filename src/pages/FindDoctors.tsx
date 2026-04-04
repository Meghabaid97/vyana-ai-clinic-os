import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PatientHeader from "@/components/PatientHeader";
import StarRating from "@/components/StarRating";
import { calculateDistance } from "@/lib/formatters";
import {
  Loader2,
  Search,
  MapPin,
  Stethoscope,
  Clock,
  Calendar,
  Building2,
  Filter,
  ArrowLeft,
  Star,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface DoctorProfile {
  id: string;
  user_id: string;
  full_name: string;
  specialization: string | null;
  qualification: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  city: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  years_of_experience: number | null;
  availability_days: string[] | null;
  availability_start_time: string | null;
  availability_end_time: string | null;
}

interface DoctorWithRating extends DoctorProfile {
  avgRating: number;
  totalRatings: number;
  distance: number | null;
}

const SPECIALIZATIONS = [
  "All Specialties",
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Orthopedic",
  "Pediatrician",
  "Gynecologist",
  "ENT Specialist",
  "Neurologist",
  "Psychiatrist",
  "Ophthalmologist",
  "Dentist",
];

const EXPERIENCE_FILTERS = [
  { label: "Any Experience", value: "all" },
  { label: "1-5 years", value: "1-5" },
  { label: "5-10 years", value: "5-10" },
  { label: "10+ years", value: "10+" },
];

const FindDoctors = () => {
  const [doctors, setDoctors] = useState<DoctorWithRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("All Specialties");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [userLocation, setUserLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    pincode: string | null;
  }>({ latitude: null, longitude: null, pincode: null });
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadUserLocation();
    loadDoctors();
  }, []);

  const loadUserLocation = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: patient } = await supabase
        .from("patients")
        .select("latitude, longitude, pincode")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (patient) {
        setUserLocation({
          latitude: patient.latitude,
          longitude: patient.longitude,
          pincode: patient.pincode,
        });
      }
    } catch (error) {
      console.error("Error loading user location:", error);
    }
  };

  const loadDoctors = async () => {
    try {
      // Load all doctors with complete profiles
      const { data: doctorsData, error } = await supabase
        .from("doctor_profiles")
        .select("*")
        .eq("is_profile_complete", true);

      if (error) throw error;

      // Load ratings for all doctors
      const { data: ratingsData } = await supabase
        .from("doctor_ratings")
        .select("doctor_id, rating");

      // Calculate average ratings
      const ratingsByDoctor = new Map<string, { total: number; count: number }>();
      ratingsData?.forEach((r) => {
        const existing = ratingsByDoctor.get(r.doctor_id) || { total: 0, count: 0 };
        existing.total += r.rating;
        existing.count += 1;
        ratingsByDoctor.set(r.doctor_id, existing);
      });

      const doctorsWithRatings: DoctorWithRating[] = (doctorsData || []).map((doc) => {
        const ratingInfo = ratingsByDoctor.get(doc.user_id);
        return {
          ...doc,
          avgRating: ratingInfo ? ratingInfo.total / ratingInfo.count : 0,
          totalRatings: ratingInfo?.count || 0,
          distance: null,
        };
      });

      setDoctors(doctorsWithRatings);
    } catch (error: any) {
      console.error("Error loading doctors:", error);
      toast({
        title: "Error",
        description: "Failed to load doctors",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort doctors
  const filteredDoctors = useMemo(() => {
    let result = doctors;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (doc) =>
          doc.full_name.toLowerCase().includes(query) ||
          doc.specialization?.toLowerCase().includes(query) ||
          doc.clinic_name?.toLowerCase().includes(query) ||
          doc.city?.toLowerCase().includes(query)
      );
    }

    // Specialty filter
    if (specialtyFilter && specialtyFilter !== "All Specialties") {
      result = result.filter(
        (doc) => doc.specialization?.toLowerCase() === specialtyFilter.toLowerCase()
      );
    }

    // Experience filter
    if (experienceFilter !== "all") {
      result = result.filter((doc) => {
        const exp = doc.years_of_experience || 0;
        switch (experienceFilter) {
          case "1-5":
            return exp >= 1 && exp <= 5;
          case "5-10":
            return exp > 5 && exp <= 10;
          case "10+":
            return exp > 10;
          default:
            return true;
        }
      });
    }

    // Calculate distances and sort
    result = result.map((doc) => {
      let distance: number | null = null;
      if (
        userLocation.latitude &&
        userLocation.longitude &&
        doc.latitude &&
        doc.longitude
      ) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          doc.latitude,
          doc.longitude
        );
      }
      return { ...doc, distance };
    });

    // Sort by distance (if available), then by rating
    result.sort((a, b) => {
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return b.avgRating - a.avgRating;
    });

    return result;
  }, [doctors, searchQuery, specialtyFilter, experienceFilter, userLocation]);

  const isAvailableNow = (doc: DoctorProfile): boolean => {
    if (!doc.availability_days || !doc.availability_start_time || !doc.availability_end_time) {
      return false;
    }
    
    const now = new Date();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const currentDay = dayNames[now.getDay()];
    
    if (!doc.availability_days.map(d => d.toLowerCase()).includes(currentDay)) {
      return false;
    }
    
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = doc.availability_start_time.split(":").map(Number);
    const [endHour, endMin] = doc.availability_end_time.split(":").map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    return currentTime >= startTime && currentTime <= endTime;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PatientHeader patientName="Patient" title="Find Doctors" subtitle="Search nearby healthcare providers" />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/app")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Search and Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search doctors, specialties, clinics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(specialtyFilter !== "All Specialties" || experienceFilter !== "all") && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {(specialtyFilter !== "All Specialties" ? 1 : 0) + (experienceFilter !== "all" ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Specialty</label>
                <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                  <SelectTrigger>
                    <SelectValue />
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
              <div>
                <label className="text-sm font-medium mb-2 block">Experience</label>
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_FILTERS.map((exp) => (
                      <SelectItem key={exp.value} value={exp.value}>
                        {exp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? "s" : ""} found
            {userLocation.pincode && ` near ${userLocation.pincode}`}
          </p>

          {filteredDoctors.length === 0 ? (
            <Card className="p-8 text-center">
              <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No doctors found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </Card>
          ) : (
            filteredDoctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/patient-appointments?doctor=${doctor.user_id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Stethoscope className="h-8 w-8 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">
                          Dr. {doctor.full_name}
                          {doctor.qualification && (
                            <span className="text-muted-foreground font-normal">, {doctor.qualification}</span>
                          )}
                        </h3>
                        {doctor.specialization && (
                          <Badge variant="secondary" className="mt-1">
                            {doctor.specialization}
                          </Badge>
                        )}
                      </div>
                      {isAvailableNow(doctor) && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          Available Now
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {doctor.clinic_name && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {doctor.clinic_name}
                        </span>
                      )}
                      {doctor.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {doctor.city}
                          {doctor.distance !== null && (
                            <span className="text-primary font-medium">
                              ({doctor.distance.toFixed(1)} km)
                            </span>
                          )}
                        </span>
                      )}
                      {doctor.years_of_experience && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {doctor.years_of_experience} yrs exp
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <StarRating rating={doctor.avgRating} size="sm" readonly />
                        <span className="text-sm text-muted-foreground">
                          {doctor.totalRatings > 0
                            ? `(${doctor.totalRatings} review${doctor.totalRatings > 1 ? "s" : ""})`
                            : "No reviews yet"}
                        </span>
                      </div>
                      <Button size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Appointment
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FindDoctors;
