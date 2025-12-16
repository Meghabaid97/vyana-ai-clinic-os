import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PatientHeader from "@/components/PatientHeader";
import {
  Loader2,
  FileText,
  Calendar,
  FolderOpen,
  Sparkles,
  Activity,
  Heart,
  Stethoscope,
  ArrowRight,
  Zap,
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
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
        </div>
      </div>
    );
  }

  const sections = [
    {
      title: "Medical History",
      description: `${stats.consultations} consultation${stats.consultations !== 1 ? "s" : ""} • ${stats.doctors} provider${stats.doctors !== 1 ? "s" : ""}`,
      icon: FileText,
      gradient: "from-emerald-500 to-teal-400",
      glowColor: "emerald",
      path: "/patient-medical-history",
      badge: stats.consultations > 0 ? stats.consultations : undefined,
    },
    {
      title: "Appointments",
      description: "Book and manage appointments",
      icon: Calendar,
      gradient: "from-amber-500 to-orange-400",
      glowColor: "amber",
      path: "/patient-appointments",
      badge: stats.appointments > 0 ? stats.appointments : undefined,
    },
    {
      title: "Health Records",
      description: "Upload & share documents",
      icon: FolderOpen,
      gradient: "from-violet-500 to-purple-400",
      glowColor: "violet",
      path: "/patient-health-records",
      badge: stats.healthRecords > 0 ? stats.healthRecords : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <PatientHeader patientName={profile?.name || "Patient"} />

      <div className="max-w-5xl mx-auto px-6 py-8 relative z-10">
        {/* Hero Welcome Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Your Health Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Welcome back,{" "}
            <span className="text-gradient">{profile?.name?.split(" ")[0] || "Patient"}</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            {stats.consultations > 0 
              ? `You've had ${stats.consultations} digital consultations, saving ~${stats.consultations * 5} sheets of paper 🌿`
              : "Your digital health journey starts here. Everything you need in one place."}
          </p>
        </div>

        {/* Stats Grid - Bento Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Doctors", value: stats.doctors, icon: Stethoscope, color: "from-emerald-500/20 to-emerald-500/5" },
            { label: "Visits", value: stats.consultations, icon: Activity, color: "from-blue-500/20 to-blue-500/5" },
            { label: "Appointments", value: stats.appointments, icon: Calendar, color: "from-amber-500/20 to-amber-500/5" },
            { label: "Records", value: stats.healthRecords, icon: Heart, color: "from-rose-500/20 to-rose-500/5" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`glass glass-hover rounded-2xl p-5 group cursor-default`}
            >
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <stat.icon className="h-6 w-6 text-foreground/80" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {sections.map((section, index) => (
            <button
              key={section.title}
              onClick={() => navigate(section.path)}
              className="group relative overflow-hidden rounded-3xl p-8 text-left transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Card background with gradient border */}
              <div className="absolute inset-0 bg-card rounded-3xl" />
              <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              <div className="absolute inset-[1px] bg-card rounded-3xl" />
              
              {/* Glow effect on hover */}
              <div className={`absolute -inset-px bg-gradient-to-br ${section.gradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm`} />
              <div className="absolute inset-[1px] bg-card rounded-3xl" />

              <div className="relative z-10">
                {section.badge && (
                  <span className={`absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br ${section.gradient} text-white text-sm font-bold flex items-center justify-center shadow-lg`}>
                    {section.badge}
                  </span>
                )}

                <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center mb-6 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500`}>
                  <section.icon className="h-10 w-10 text-white" />
                </div>

                <h3 className="text-2xl font-bold mb-2 group-hover:text-gradient transition-all">
                  {section.title}
                </h3>
                <p className="text-muted-foreground mb-4">{section.description}</p>

                <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                  <span>Explore</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Health ID Notice */}
        {!profile?.national_health_id && (
          <div className="glass rounded-2xl p-6 border-amber-500/30">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6 text-white" />
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

        {/* Footer tagline */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Powered by Vyana AI • Your health, simplified
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;