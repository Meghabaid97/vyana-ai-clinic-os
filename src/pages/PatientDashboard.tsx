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
  Heart,
  Stethoscope,
  ArrowRight,
  Activity,
  Upload,
  Shield,
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
  const [recordDates, setRecordDates] = useState<string[]>([]);
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
          .select("id, uploaded_at")
          .eq("patient_id", patientData.id)
          .order("uploaded_at", { ascending: true });

        const dates = (recordsData || []).map(r =>
          new Date(r.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        );
        setRecordDates(dates);

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

  const totalRecords = stats.healthRecords + stats.consultations;

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
    {
      title: "My Health Profile",
      description: "Trends, summary & tools",
      icon: Activity,
      gradient: "from-primary to-secondary",
      bgGradient: "from-primary/10 via-secondary/5 to-transparent",
      path: "/patient-profile-page",
    },
    {
      title: "Emergency Access",
      description: "Family safety net for emergencies",
      icon: Shield,
      gradient: "from-secondary to-accent",
      bgGradient: "from-secondary/10 via-accent/5 to-transparent",
      path: "/emergency-contacts",
    },
  ];

  return (
    <div className="min-h-screen bg-background">

      <PatientHeader patientName={profile?.name || "Patient"} />

      <div className="max-w-5xl mx-auto px-6 py-10 relative z-10">
        {/* Hero Welcome */}
        <div className="mb-6 animate-fade-in">
          <p className="text-sm text-primary font-medium mb-2">
            {profile?.name?.split(" ")[0] || "Patient"}'s health story
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
            Your health story.{" "}
            <span className="text-primary">Always with you.</span>
          </h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed max-w-[520px] mt-4">
            Somewhere in India, a family rushes to a hospital with nothing. No records, no history, no context. Five minutes to explain a lifetime to a stranger.{" "}
            <span className="text-foreground">That will never be you.</span>
          </p>
        </div>

        {/* Health Story Card */}
        <div className="rounded-lg border border-border p-6 md:p-8 mb-10 animate-fade-in">
          <p className="text-muted-foreground text-[15px] leading-relaxed max-w-xl mb-6">
            Every prescription you upload, every lab report, every doctor visit builds your complete health picture. Quietly. Securely. So when you need it most, it is there.
          </p>
          <div>
            {totalRecords === 0 ? (
              <button onClick={() => navigate("/patient-health-records")}
                className="group flex items-center gap-3 px-4 py-2.5 rounded-md bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span className="font-medium text-sm">Upload your first record</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative flex items-center gap-0 overflow-x-auto pb-2">
                  <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-border" />
                  {recordDates.map((date, i) => (
                    <div key={i} className="relative flex flex-col items-center shrink-0" style={{ minWidth: "56px" }}>
                      <div className="h-3 w-3 rounded-full z-10 bg-primary" />
                      <span className="mt-2 text-xs whitespace-nowrap text-muted-foreground">
                        {date}
                      </span>
                    </div>
                  ))}

                  <div className="relative flex flex-col items-center shrink-0" style={{ minWidth: "56px" }}>
                    <div className="h-4 w-4 rounded-full z-10 bg-primary ring-4 ring-primary/20" />
                    <span className="mt-2 text-xs font-semibold whitespace-nowrap text-primary">
                      Today
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {totalRecords} record{totalRecords !== 1 ? "s" : ""} held. <span className="text-foreground font-medium">Your story is growing.</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Doctors", value: stats.doctors, icon: Stethoscope, color: "primary" },
            { label: "Visits", value: stats.consultations, icon: Activity, color: "accent" },
            { label: "Appointments", value: stats.appointments, icon: Calendar, color: "secondary" },
            { label: "Records", value: stats.healthRecords, icon: Heart, color: "primary" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="bg-card rounded-lg p-4 border border-border hover:border-primary/20 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Not features. Promises. */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">
            Not features. <span className="text-primary">Your safety net.</span>
          </h2>
          <p className="text-muted-foreground text-[13px] mt-1">Everything your family needs, in one place.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {sections.map((section, index) => (
            <button
              key={section.title}
              onClick={() => navigate(section.path)}
              className="group relative rounded-lg bg-card border border-border p-6 text-left hover:border-primary/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${(index + 4) * 50}ms` }}
            >
              <div>
                {section.badge && (
                  <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {section.badge}
                  </span>
                )}

                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <section.icon className="h-6 w-6 text-primary" />
                </div>

                <h3 className="text-lg font-semibold mb-1 text-foreground">
                  {section.title}
                </h3>
                <p className="text-muted-foreground mb-4">{section.description}</p>

              </div>
            </button>
          ))}
        </div>

        {/* Health ID Notice */}
        {!profile?.national_health_id && (
          <div className="rounded-lg p-5 border border-primary/20 bg-primary/5 animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">One step to connect everything</h3>
                <p className="text-muted-foreground">
                  Add your ABHA Health ID and every past and future consultation across any provider links automatically. Your records follow you, not the other way around.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Vyana</span> · Every patient deserves a doctor who already knows their story.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
