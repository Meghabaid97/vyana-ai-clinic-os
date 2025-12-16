import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PatientHeader from "@/components/PatientHeader";
import {
  Loader2,
  FileText,
  Calendar,
  FolderOpen,
  TrendingUp,
  Leaf,
  Heart,
  Stethoscope,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

      // Load patient profile
      const { data: patientData } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (patientData) {
        setProfile(patientData);

        // Load stats
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sections = [
    {
      title: "Medical History",
      description: `${stats.consultations} consultation${stats.consultations !== 1 ? "s" : ""} • ${stats.doctors} provider${stats.doctors !== 1 ? "s" : ""}`,
      icon: FileText,
      color: "from-teal-500 to-emerald-500",
      bgColor: "from-teal-500/10 to-emerald-500/10",
      borderColor: "border-teal-500/30",
      iconColor: "text-teal-600",
      path: "/patient-medical-history",
      badge: stats.consultations > 0 ? stats.consultations : undefined,
    },
    {
      title: "Appointments",
      description: "Book and manage appointments",
      icon: Calendar,
      color: "from-orange-500 to-amber-500",
      bgColor: "from-orange-500/10 to-amber-500/10",
      borderColor: "border-orange-500/30",
      iconColor: "text-orange-600",
      path: "/patient-appointments",
      badge: stats.appointments > 0 ? stats.appointments : undefined,
    },
    {
      title: "Health Records",
      description: "Upload & share documents",
      icon: FolderOpen,
      color: "from-violet-500 to-purple-500",
      bgColor: "from-violet-500/10 to-purple-500/10",
      borderColor: "border-violet-500/30",
      iconColor: "text-violet-600",
      path: "/patient-health-records",
      badge: stats.healthRecords > 0 ? stats.healthRecords : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-teal-500/5">
      <PatientHeader patientName={profile?.name || "Patient"} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome & Eco Banner */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-emerald-700 dark:text-emerald-400">
                  Welcome, {profile?.name?.split(" ")[0] || "Patient"}!
                </h2>
                <p className="text-sm text-muted-foreground">
                  {stats.consultations > 0 
                    ? `Your ${stats.consultations} digital records saved ~${stats.consultations * 5} sheets of paper 🌱`
                    : "Going digital helps save trees and the environment 🌱"}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 hidden sm:flex">
              <Leaf className="h-3 w-3 mr-1" />
              Eco-Friendly
            </Badge>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-gradient-to-br from-teal-500/10 to-transparent border-teal-500/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-600">{stats.doctors}</p>
                <p className="text-xs text-muted-foreground">Doctors</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{stats.consultations}</p>
                <p className="text-xs text-muted-foreground">Visits</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.appointments}</p>
                <p className="text-xs text-muted-foreground">Appointments</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-violet-500/10 to-transparent border-violet-500/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Heart className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-600">{stats.healthRecords}</p>
                <p className="text-xs text-muted-foreground">Records</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Big 3 Section Icons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section) => (
            <button
              key={section.title}
              onClick={() => navigate(section.path)}
              className={`group relative flex flex-col items-center p-8 rounded-2xl bg-gradient-to-br ${section.bgColor} border ${section.borderColor} hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-2 text-left w-full`}
            >
              {section.badge && (
                <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-bold flex items-center justify-center shadow-lg">
                  {section.badge}
                </span>
              )}
              <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center mb-5 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <section.icon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{section.title}</h3>
              <p className="text-sm text-muted-foreground text-center">{section.description}</p>
            </button>
          ))}
        </div>

        {/* Health ID Notice */}
        {!profile?.national_health_id && (
          <Card className="mt-8 p-6 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Heart className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-700">Add Your Health ID</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your National Health ID in your profile to automatically link all your medical records.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
