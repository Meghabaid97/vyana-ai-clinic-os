import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PatientHeader from "@/components/PatientHeader";
import {
  Loader2,
  User,
  Phone,
  Shield,
  Save,
  Calendar,
  Activity,
  FileText,
  Heart,
} from "lucide-react";

interface PatientProfileData {
  id: string;
  name: string;
  age: number | null;
  phone: string | null;
  national_health_id: string | null;
}

const PatientProfilePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<PatientProfileData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    phone: "",
    national_health_id: "",
  });
  const [stats, setStats] = useState({
    totalConsultations: 0,
    totalDoctors: 0,
    lastVisit: null as string | null,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load patient profile
      const { data: patientData, error } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error) throw error;

      if (patientData) {
        setProfile(patientData);
        setFormData({
          name: patientData.name || "",
          age: patientData.age?.toString() || "",
          phone: patientData.phone || "",
          national_health_id: patientData.national_health_id || "",
        });

        // Load consultation stats
        if (patientData.national_health_id) {
          const { data: consultations } = await supabase
            .from("consultations")
            .select("doctor_id, created_at")
            .eq("patient_national_health_id", patientData.national_health_id)
            .order("created_at", { ascending: false });

          if (consultations) {
            const uniqueDoctors = new Set(consultations.map(c => c.doctor_id));
            setStats({
              totalConsultations: consultations.length,
              totalDoctors: uniqueDoctors.size,
              lastVisit: consultations[0]?.created_at || null,
            });
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load your profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("patients")
        .update({
          name: formData.name,
          age: formData.age ? parseInt(formData.age) : null,
          phone: formData.phone || null,
          national_health_id: formData.national_health_id || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully",
      });

      // Reload profile data
      loadProfile();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-teal-500/5">
      <PatientHeader
        patientName={profile?.name || "Patient"}
        title="My Profile"
        subtitle="Manage your health information"
      />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-5 bg-gradient-to-br from-teal-500/10 to-transparent border-teal-500/20">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-teal-600">{stats.totalConsultations}</p>
                <p className="text-sm text-muted-foreground">Total Consultations</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Heart className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-600">{stats.totalDoctors}</p>
                <p className="text-sm text-muted-foreground">Healthcare Providers</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-cyan-600">
                  {stats.lastVisit ? formatDate(stats.lastVisit) : "No visits"}
                </p>
                <p className="text-sm text-muted-foreground">Last Visit</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Profile Form */}
        <Card className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Personal Information</h2>
              <p className="text-sm text-muted-foreground">Update your profile details</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age" className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Age
                </Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Enter your age"
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="health_id" className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  National Health ID (Aadhaar)
                </Label>
                <Input
                  id="health_id"
                  value={formData.national_health_id}
                  onChange={(e) => setFormData({ ...formData, national_health_id: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                  placeholder="12-digit Aadhaar number"
                  maxLength={12}
                  className="bg-background/50 font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  This ID links your medical records across healthcare providers
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={isSaving} className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600">
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Health ID Info */}
        {!formData.national_health_id && (
          <Card className="mt-6 p-6 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-700">Add Your Health ID</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Adding your National Health ID (Aadhaar) will automatically link all your past and future consultations from any healthcare provider in the Vyana network.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PatientProfilePage;
