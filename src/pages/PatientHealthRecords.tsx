import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FolderOpen, Upload } from "lucide-react";
import HealthRecordsTab from "@/components/HealthRecordsTab";

interface PatientProfile {
  id: string;
  name: string;
  national_health_id: string | null;
}

interface DoctorInfo {
  doctor_id: string;
  lastVisit: string;
}

const PatientHealthRecords = () => {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);

      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (patientData) {
        setProfile(patientData);

        if (patientData.national_health_id) {
          const { data: consultationsData } = await supabase
            .from("consultations")
            .select("doctor_id, created_at")
            .eq("patient_national_health_id", patientData.national_health_id)
            .order("created_at", { ascending: false });

          if (consultationsData) {
            const doctorMap = new Map<string, string>();
            consultationsData.forEach(c => {
              if (!doctorMap.has(c.doctor_id)) doctorMap.set(c.doctor_id, c.created_at);
            });
            setDoctors(Array.from(doctorMap.entries()).map(([doctor_id, lastVisit]) => ({ doctor_id, lastVisit })));
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({ title: "Error", description: "Failed to load health records", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 sm:px-5 pt-4 pb-4">
      {/* Page title */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <FolderOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-foreground leading-tight">Health Records</h1>
          <p className="text-[13px] text-muted-foreground">Upload and manage your documents</p>
        </div>
      </div>

      {/* Records content */}
      {profile && userId ? (
        <HealthRecordsTab patientId={profile.id} userId={userId} doctors={doctors} />
      ) : (
        <div className="rounded-xl border border-border p-8 text-center">
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Complete your profile to start uploading records.</p>
        </div>
      )}
    </div>
  );
};

export default PatientHealthRecords;
