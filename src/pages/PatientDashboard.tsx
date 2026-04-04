import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PatientHeader from "@/components/PatientHeader";
import DashboardHero from "@/components/dashboard/DashboardHero";
import DashboardStory from "@/components/dashboard/DashboardStory";
import DashboardActions from "@/components/dashboard/DashboardActions";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import { Loader2 } from "lucide-react";

interface PatientProfile {
  id: string;
  name: string;
  age: number | null;
  phone: string | null;
  national_health_id: string | null;
}

export interface DashboardData {
  profile: PatientProfile | null;
  stats: { consultations: number; appointments: number; healthRecords: number; doctors: number };
  recordDates: string[];
}

const PatientDashboard = () => {
  const [data, setData] = useState<DashboardData>({
    profile: null,
    stats: { consultations: 0, appointments: 0, healthRecords: 0, doctors: 0 },
    recordDates: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: patientData } = await supabase
        .from("patients").select("*").eq("user_id", session.user.id).single();

      if (patientData) {
        let consultationsCount = 0;
        let doctorsCount = 0;

        if (patientData.national_health_id) {
          const { data: consultationsData } = await supabase
            .from("consultations").select("doctor_id")
            .eq("patient_national_health_id", patientData.national_health_id);
          if (consultationsData) {
            consultationsCount = consultationsData.length;
            doctorsCount = new Set(consultationsData.map(c => c.doctor_id)).size;
          }
        }

        const { data: appointmentsData } = await supabase
          .from("appointments").select("id").eq("patient_id", patientData.id);

        const { data: recordsData } = await supabase
          .from("health_records").select("id, uploaded_at").eq("patient_id", patientData.id)
          .order("uploaded_at", { ascending: true });

        const dates = (recordsData || []).map(r =>
          new Date(r.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        );

        setData({
          profile: patientData,
          stats: {
            consultations: consultationsCount,
            appointments: appointmentsData?.length || 0,
            healthRecords: recordsData?.length || 0,
            doctors: doctorsCount,
          },
          recordDates: dates,
        });
      }
    } catch (error: any) {
      console.error("Error loading patient data:", error);
      toast({ title: "Error", description: "Failed to load your data", variant: "destructive" });
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
      <PatientHeader patientName={data.profile?.name || "Patient"} />
      <DashboardHero profile={data.profile} />
      <DashboardStory data={data} />
      <DashboardActions stats={data.stats} />
      <DashboardStats stats={data.stats} />
      <DashboardFooter hasHealthId={!!data.profile?.national_health_id} />
    </div>
  );
};

export default PatientDashboard;
