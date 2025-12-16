import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";
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
  Leaf,
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
              <Leaf className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-600">
                {stats.totalConsultations > 0 ? `${stats.totalConsultations * 3} pages saved` : "100% Digital"}
              </span>
            </div>
            <NotificationBell />
            <Button variant="default" size="sm" onClick={() => navigate("/doctor-profile-setup")}>
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
        {/* Stats Row - Enhanced */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">{stats.totalPatients}</p>
                <p className="text-sm text-muted-foreground">Total Patients</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/10 transition-all group">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">{stats.totalConsultations}</p>
                <p className="text-sm text-muted-foreground">Consultations</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20 hover:shadow-lg hover:shadow-orange-500/10 transition-all group">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">{stats.pendingAppointments}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/10 transition-all group">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">{stats.thisMonthConsultations}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions - Enhanced */}
        <div>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.onClick}
                className="group relative flex flex-col items-center p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-2"
              >
                {action.badge && (
                  <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-lg animate-bounce">
                    {action.badge}
                  </span>
                )}
                <div className={`h-16 w-16 rounded-2xl ${action.color} flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <action.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 text-center">{action.title}</h3>
                <p className="text-xs text-muted-foreground text-center line-clamp-2">{action.description}</p>
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
