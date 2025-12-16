import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  LogOut,
  Stethoscope,
  Users,
  CalendarCheck,
  FileText,
  Plus,
  Clock,
  TrendingUp,
  Activity,
  FolderOpen,
  Settings,
} from "lucide-react";

const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalConsultations: 0,
    pendingAppointments: 0,
    thisMonthConsultations: 0,
    sharedRecords: 0,
  });
  const [doctorName, setDoctorName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
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

      if (!roles || roles.length === 0 || (roles[0].role !== "doctor" && roles[0].role !== "admin")) {
        navigate("/patient-dashboard");
        return;
      }

      // Fetch doctor profile name
      const { data: profile } = await supabase
        .from("doctor_profiles")
        .select("full_name")
        .eq("user_id", session.user.id)
        .single();

      setDoctorName(profile?.full_name || session.user.email?.split("@")[0] || "Doctor");

      // Load consultations
      const { data: consultations } = await supabase
        .from("consultations")
        .select("patient_national_health_id, created_at")
        .eq("doctor_id", session.user.id);

      // Load pending appointments
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id")
        .eq("doctor_id", session.user.id)
        .eq("status", "pending");

      // Load shared health records count
      const { data: sharedRecords } = await supabase
        .from("health_records")
        .select("id")
        .contains("consent_shared_with", [session.user.id]);

      const uniquePatients = new Set(consultations?.map(c => c.patient_national_health_id) || []);
      const thisMonth = consultations?.filter(c => {
        const created = new Date(c.created_at);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length || 0;

      setStats({
        totalPatients: uniquePatients.size,
        totalConsultations: consultations?.length || 0,
        pendingAppointments: appointments?.length || 0,
        thisMonthConsultations: thisMonth,
        sharedRecords: sharedRecords?.length || 0,
      });
    } catch (error: any) {
      console.error("Error loading dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const quickActions = [
    {
      title: "New Consultation",
      description: "Start a new patient consultation",
      icon: Plus,
      color: "bg-emerald-500",
      hoverColor: "hover:bg-emerald-600",
      onClick: () => navigate("/consultation"),
    },
    {
      title: "My Patients",
      description: `${stats.totalPatients} registered patients`,
      icon: Users,
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      onClick: () => navigate("/consultations"),
    },
    {
      title: "Appointments",
      description: stats.pendingAppointments > 0 
        ? `${stats.pendingAppointments} pending requests` 
        : "Manage appointments",
      icon: CalendarCheck,
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600",
      onClick: () => navigate("/doctor-appointments"),
      badge: stats.pendingAppointments > 0 ? stats.pendingAppointments : undefined,
    },
    {
      title: "Consultations",
      description: `${stats.totalConsultations} total records`,
      icon: FileText,
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
      onClick: () => navigate("/consultations"),
    },
    {
      title: "Shared Records",
      description: stats.sharedRecords > 0
        ? `${stats.sharedRecords} patient records`
        : "View patient files",
      icon: FolderOpen,
      color: "bg-teal-500",
      hoverColor: "hover:bg-teal-600",
      onClick: () => navigate("/shared-records"),
      badge: stats.sharedRecords > 0 ? stats.sharedRecords : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Stethoscope className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Welcome, Dr. {doctorName}</h1>
              <p className="text-sm text-muted-foreground">Vyana AI Clinical Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Eco indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-600">
                {stats.totalConsultations > 0 ? `${stats.totalConsultations * 3} pages saved` : "100% Digital"}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/doctor-profile-setup")}>
              <Settings className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPatients}</p>
                <p className="text-xs text-muted-foreground">Patients</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalConsultations}</p>
                <p className="text-xs text-muted-foreground">Consultations</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingAppointments}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.thisMonthConsultations}</p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions - Big Icons */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.onClick}
                className="group relative flex flex-col items-center p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {action.badge && (
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center animate-pulse">
                    {action.badge}
                  </span>
                )}
                <div className={`h-16 w-16 rounded-2xl ${action.color} ${action.hoverColor} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <action.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{action.title}</h3>
                <p className="text-xs text-muted-foreground text-center">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity Prompt */}
        {stats.totalConsultations === 0 && (
          <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <Stethoscope className="h-12 w-12 mx-auto text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Ready to start?</h3>
            <p className="text-muted-foreground mb-4">
              Create your first consultation to begin building patient records
            </p>
            <Button onClick={() => navigate("/consultation")} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              New Consultation
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
