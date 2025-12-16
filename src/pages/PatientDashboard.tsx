import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PatientHeader from "@/components/PatientHeader";
import TreeProgressIndicator from "@/components/TreeProgressIndicator";
import { getEcoMessage } from "@/lib/formatters";
import {
  Loader2,
  FileText,
  Calendar,
  FolderOpen,
  Sparkles,
  Heart,
  Stethoscope,
  ArrowRight,
  Activity,
} from "lucide-react";

interface PatientProfile {
  id: string;
  name: string;
  age: number | null;
  phone: string | null;
  national_health_id: string | null;
}

const PatientDashboard = () => {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [stats, setStats] = useState({
    consultations: 0,
    appointments: 0,
    healthRecords: 0,
    doctors: 0,
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
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (patientData) {
        setProfile(patientData);

        let consultationsCount = 0;
        let doctorsCount = 0;

        if (patientData.national_health_id) {
          const { data: consultationsData } = await supabase
            .from("consultations")
            .select("doctor_id")
            .eq("patient_national_health_id", patientData.national_health_id);

          if (consultationsData) {
            consultationsCount = consultationsData.length;
            doctorsCount = new Set(consultationsData.map(c => c.doctor_id)).size;
          }
        }

        const { data: appointmentsData } = await supabase
          .from("appointments")
          .select("id")
          .eq("patient_id", patientData.id);

        const { data: recordsData } = await supabase
          .from("health_records")
          .select("id")
          .eq("patient_id", patientData.id);

        setStats({
          consultations: consultationsCount,
          appointments: appointmentsData?.length || 0,
          healthRecords: recordsData?.length || 0,
          doctors: doctorsCount,
        });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: "Medical History",
      description: `${stats.consultations} consultation${stats.consultations !== 1 ? "s" : ""} • ${stats.doctors} provider${stats.doctors !== 1 ? "s" : ""}`,
      icon: FileText,
      gradient: "from-primary to-accent",
      bgGradient: "from-primary/10 via-primary/5 to-transparent",
      path: "/patient-medical-history",
      badge: stats.consultations > 0 ? stats.consultations : undefined,
    },
    {
      title: "Appointments",
      description: "Book and manage appointments",
      icon: Calendar,
      gradient: "from-accent to-secondary",
      bgGradient: "from-accent/10 via-accent/5 to-transparent",
      path: "/patient-appointments",
      badge: stats.appointments > 0 ? stats.appointments : undefined,
    },
    {
      title: "Health Records",
      description: "Upload & share documents",
      icon: FolderOpen,
      gradient: "from-secondary to-primary",
      bgGradient: "from-secondary/10 via-secondary/5 to-transparent",
      path: "/patient-health-records",
      badge: stats.healthRecords > 0 ? stats.healthRecords : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 -left-32 w-96 h-96 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <PatientHeader patientName={profile?.name || "Patient"} />

      <div className="max-w-5xl mx-auto px-6 py-10 relative z-10">
        {/* Hero Welcome */}
        <div className="mb-12 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Your Health Dashboard</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome back,{" "}
            <span className="text-gradient">{profile?.name?.split(" ")[0] || "Patient"}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            {getEcoMessage(stats.consultations, "patient")}
          </p>
          <TreeProgressIndicator consultations={stats.consultations} />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Doctors", value: stats.doctors, icon: Stethoscope, color: "primary" },
            { label: "Visits", value: stats.consultations, icon: Activity, color: "accent" },
            { label: "Appointments", value: stats.appointments, icon: Calendar, color: "secondary" },
            { label: "Records", value: stats.healthRecords, icon: Heart, color: "primary" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="group bg-card rounded-2xl p-5 shadow-card border border-border/50 hover:shadow-soft hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br from-${stat.color}/20 to-${stat.color}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}`} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {sections.map((section, index) => (
            <button
              key={section.title}
              onClick={() => navigate(section.path)}
              className="group relative overflow-hidden rounded-3xl bg-card border border-border/50 p-8 text-left shadow-card hover:shadow-glow hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: `${(index + 4) * 100}ms` }}
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${section.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                {section.badge && (
                  <span className={`absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br ${section.gradient} text-white text-sm font-bold flex items-center justify-center shadow-lg`}>
                    {section.badge}
                  </span>
                )}

                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center mb-6 shadow-soft group-hover:scale-110 group-hover:shadow-glow transition-all duration-300`}>
                  <section.icon className="h-8 w-8 text-white" />
                </div>

                <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-gradient transition-all">
                  {section.title}
                </h3>
                <p className="text-muted-foreground mb-4">{section.description}</p>

                <div className="flex items-center gap-2 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                  <span>Open</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Health ID Notice */}
        {!profile?.national_health_id && (
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-2xl p-6 border border-primary/20 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-soft">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Link Your Health ID</h3>
                <p className="text-muted-foreground">
                  Add your National Health ID in your profile to automatically sync all your medical records.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="text-gradient font-semibold">Vyana AI</span> • Your health, simplified
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;