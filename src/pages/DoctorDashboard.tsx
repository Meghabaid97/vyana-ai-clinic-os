import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import NotificationBell from "@/components/NotificationBell";
import {
  Loader2,
  LogOut,
  Users,
  CalendarCheck,
  Plus,
  Clock,
  TrendingUp,
  Activity,
  FolderOpen,
  Sparkles,
  ArrowRight,
  FileText,
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

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (!roles || roles.length === 0 || (roles[0].role !== "doctor" && roles[0].role !== "admin")) {
        navigate("/patient-dashboard");
        return;
      }

      const { data: profile } = await supabase
        .from("doctor_profiles")
        .select("full_name")
        .eq("user_id", session.user.id)
        .single();

      setDoctorName(profile?.full_name || session.user.email?.split("@")[0] || "Doctor");

      const { data: consultations } = await supabase
        .from("consultations")
        .select("patient_national_health_id, created_at")
        .eq("doctor_id", session.user.id);

      const { data: appointments } = await supabase
        .from("appointments")
        .select("id")
        .eq("doctor_id", session.user.id)
        .eq("status", "pending");

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
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 animate-spin text-primary relative" />
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "New Consultation",
      description: "Start recording",
      icon: Plus,
      gradient: "from-primary to-accent",
      onClick: () => navigate("/consultation"),
    },
    {
      title: "My Patients",
      description: `${stats.totalPatients} patients`,
      icon: Users,
      gradient: "from-accent to-secondary",
      onClick: () => navigate("/consultations"),
      badge: stats.totalConsultations,
    },
    {
      title: "Appointments",
      description: stats.pendingAppointments > 0 ? `${stats.pendingAppointments} pending` : "Manage schedule",
      icon: CalendarCheck,
      gradient: "from-secondary to-primary",
      onClick: () => navigate("/doctor-appointments"),
      badge: stats.pendingAppointments > 0 ? stats.pendingAppointments : undefined,
    },
    {
      title: "Shared Records",
      description: `${stats.sharedRecords} files`,
      icon: FolderOpen,
      gradient: "from-primary to-secondary",
      onClick: () => navigate("/shared-records"),
      badge: stats.sharedRecords > 0 ? stats.sharedRecords : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-32 w-96 h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 -left-32 w-96 h-96 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      {/* Header */}
      <header className="bg-background/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-soft">
              <span className="text-lg font-bold text-white">V</span>
            </div>
            <div>
              <span className="text-xl font-bold text-gradient">Vyana AI</span>
              <p className="text-xs text-muted-foreground">Clinical Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">100% Digital</span>
            </div>
            <NotificationBell />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/doctor-profile-setup")}
            >
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 relative z-10">
        {/* Hero Section */}
        <div className="mb-12 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Welcome Back</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Dr. <span className="text-gradient">{doctorName}</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            {stats.totalConsultations > 0 
              ? `${stats.totalConsultations} consultations completed • ${stats.totalConsultations * 3} pages saved digitally 🌿`
              : "Ready to start your first digital consultation?"}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "Total Patients", value: stats.totalPatients, icon: Users, gradient: "from-primary/20 to-primary/10" },
            { label: "Consultations", value: stats.totalConsultations, icon: FileText, gradient: "from-accent/20 to-accent/10" },
            { label: "Pending", value: stats.pendingAppointments, icon: Clock, gradient: "from-secondary/20 to-secondary/10" },
            { label: "This Month", value: stats.thisMonthConsultations, icon: TrendingUp, gradient: "from-primary/20 to-primary/10" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="group bg-card rounded-2xl p-5 shadow-card border border-border/50 hover:shadow-soft hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, i) => (
              <button
                key={action.title}
                onClick={action.onClick}
                className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 p-6 text-left shadow-card hover:shadow-glow hover:border-primary/30 transition-all duration-300 hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${(i + 4) * 100}ms` }}
              >
                {/* Hover gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />

                <div className="relative z-10">
                  {action.badge && (
                    <span className={`absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br ${action.gradient} text-white text-xs font-bold flex items-center justify-center shadow-lg`}>
                      {action.badge > 99 ? "99+" : action.badge}
                    </span>
                  )}

                  <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 shadow-soft group-hover:scale-110 group-hover:shadow-glow transition-all`}>
                    <action.icon className="h-7 w-7 text-white" />
                  </div>

                  <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>

                  <div className="flex items-center gap-1 mt-3 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-all">
                    <span>Open</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {stats.totalConsultations === 0 && (
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 rounded-3xl p-10 text-center border border-primary/20 animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Ready to get started?</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first digital consultation and experience the future of healthcare documentation.
            </p>
            <Button 
              onClick={() => navigate("/consultation")} 
              size="lg"
              variant="gradient"
            >
              <Plus className="mr-2 h-5 w-5" />
              New Consultation
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="text-gradient font-semibold">Vyana AI</span> • The future of clinical documentation
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;