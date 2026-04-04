import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PatientHeader from "@/components/PatientHeader";
import {
  Loader2,
  ArrowLeft,
  FolderOpen,
} from "lucide-react";
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
        setProfile(patientData);

        // Get doctors from consultations
        if (patientData.national_health_id) {
          const { data: consultationsData } = await supabase
            .from("consultations")
            .select("doctor_id, created_at")
            .eq("patient_national_health_id", patientData.national_health_id)
            .order("created_at", { ascending: false });

          if (consultationsData) {
            const doctorMap = new Map<string, string>();
            consultationsData.forEach(c => {
              if (!doctorMap.has(c.doctor_id)) {
                doctorMap.set(c.doctor_id, c.created_at);
              }
            });
            setDoctors(Array.from(doctorMap.entries()).map(([doctor_id, lastVisit]) => ({
              doctor_id,
              lastVisit,
            })));
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load health records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
      <PatientHeader patientName="Patient" title="Health Records" subtitle="Upload and manage your medical documents" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/patient-dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Your Health Records</h2>
              <p className="text-sm text-muted-foreground">
                Upload prescriptions, lab reports, and medical documents
              </p>
            </div>
          </div>

          {profile && userId && (
            <HealthRecordsTab
              patientId={profile.id}
              userId={userId}
              doctors={doctors}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default PatientHealthRecords;
