import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, User, Phone, Shield, Save, ChevronRight, LogOut,
  FileText, Heart, Calendar, Bell, HelpCircle, BookOpen, Star,
  Lock, MapPin,
} from "lucide-react";

interface PatientProfileData {
  id: string;
  name: string;
  age: number | null;
  phone: string | null;
  national_health_id: string | null;
  next_visit_date: string | null;
}

const PatientProfileEdit = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<PatientProfileData | null>(null);
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({ name: "", age: "", phone: "", national_health_id: "" });
  const [stats, setStats] = useState({ totalConsultations: 0, totalDoctors: 0, lastVisit: null as string | null });
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setEmail(session.user.email || "");

      const { data: patientData, error } = await supabase.from("patients").select("*").eq("user_id", session.user.id).maybeSingle();
      if (error) throw error;
      if (patientData) {
        setProfile(patientData);
        setFormData({
          name: patientData.name || "", age: patientData.age?.toString() || "",
          phone: patientData.phone || "", national_health_id: patientData.national_health_id || "",
        });
        if (patientData.national_health_id) {
          const { data: consultations } = await supabase.from("consultations").select("doctor_id, created_at")
            .eq("patient_national_health_id", patientData.national_health_id).order("created_at", { ascending: false });
          if (consultations) {
            setStats({
              totalConsultations: consultations.length,
              totalDoctors: new Set(consultations.map(c => c.doctor_id)).size,
              lastVisit: consultations[0]?.created_at || null,
            });
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
    } finally { setIsLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from("patients").update({
        name: formData.name, age: formData.age ? parseInt(formData.age) : null,
        phone: formData.phone || null, national_health_id: formData.national_health_id || null,
      }).eq("id", profile.id);
      if (error) throw error;
      toast({ title: "Profile Updated", description: "Your profile has been saved." });
      setEditMode(false);
      loadProfile();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save", variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  const handleSignOut = async () => {
    const { signOutFully } = await import("@/lib/signOut");
    await signOutFully();
    navigate("/auth");
  };

  const APP_STORE_URL = "https://apps.apple.com/app/vyana/id0000000000"; // TODO: replace with real ID once published
  const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=care.vyana.app"; // TODO: replace once published
  const WEB_APP_URL = "https://www.vyana.care";

  const handleRateApp = async () => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/i.test(ua);

    if (isIOS) { window.open(APP_STORE_URL, "_blank", "noopener,noreferrer"); return; }
    if (isAndroid) { window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer"); return; }

    // Desktop / other: try Web Share, fall back to copying the link.
    const shareData = {
      title: "Vyana",
      text: "I am using Vyana to keep my family's health story in one place. Try it:",
      url: WEB_APP_URL,
    };
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share(shareData);
        return;
      }
    } catch { /* user dismissed share — fall through to copy */ }
    try {
      await navigator.clipboard.writeText(WEB_APP_URL);
      toast({ title: "Link copied", description: "Share Vyana with friends and family." });
    } catch {
      window.open(WEB_APP_URL, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const menuItems = [
    { icon: FileText, label: "Medical History", desc: "View your complete health timeline", path: "/app/medical-history" as string | null, onClick: undefined as undefined | (() => void) },
    { icon: Shield, label: "Emergency Contacts", desc: "Manage your emergency contacts", path: "/app/emergency-contacts" as string | null, onClick: undefined as undefined | (() => void) },
    { icon: Bell, label: "Notifications", desc: "Manage notification preferences", path: null as string | null, onClick: undefined as undefined | (() => void) },
    { icon: Lock, label: "Privacy & Security", desc: "Control your data sharing", path: "/legal" as string | null, onClick: undefined as undefined | (() => void) },
  ];

  const aboutItems = [
    { icon: BookOpen, label: "Our Story", desc: "Why we built Vyana", path: "/app/story" as string | null, onClick: undefined as undefined | (() => void) },
    { icon: HelpCircle, label: "Help & Support", desc: "Raise a ticket or report an issue", path: "/app/support" as string | null, onClick: undefined as undefined | (() => void) },
    { icon: Star, label: "Rate App", desc: "Rate Vyana or share with friends", path: null as string | null, onClick: handleRateApp },
  ];

  return (
    <div className="animate-fade-in">
      {/* Profile Header, Nykaa style */}
      <section className="bg-primary/5 px-5 pt-8 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{profile?.name || "Patient"}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{email}</p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex gap-3 mt-5">
          {[
            { value: stats.totalConsultations, label: "Visits" },
            { value: stats.totalDoctors, label: "Doctors" },
            { value: stats.lastVisit ? new Date(stats.lastVisit).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "-", label: "Last Visit" },
          ].map((s, i) => (
            <div key={i} className="flex-1 rounded-xl bg-card border border-border p-3 text-center">
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABHA Card */}
      {formData.national_health_id ? (
        <section className="px-5 pt-4">
          <div className="rounded-xl bg-card border border-primary/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-primary uppercase tracking-wide">ABHA Health ID</p>
                <p className="text-lg font-bold text-foreground font-mono mt-0.5">{formData.national_health_id}</p>
              </div>
              <Shield className="h-8 w-8 text-primary/30" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">Linked across all healthcare providers</p>
          </div>
        </section>
      ) : (
        <section className="px-5 pt-4">
          <button
            onClick={() => setEditMode(true)}
            className="w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 flex items-center gap-3"
          >
            <Shield className="h-5 w-5 text-primary" />
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Connect ABHA Health ID</p>
              <p className="text-xs text-muted-foreground">Link your records across providers</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
          </button>
        </section>
      )}

      {/* Next doctor visit, drives pre-visit notification */}
      <section className="px-5 pt-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-foreground">Next doctor visit</p>
              <p className="text-xs text-muted-foreground">
                {profile?.next_visit_date
                  ? "We'll prep your summary the day before"
                  : "Add a date and we'll prep your summary the day before"}
              </p>
            </div>
          </div>
          <Input
            type="date"
            aria-label="Next doctor visit date"
            value={profile?.next_visit_date || ""}
            min={new Date().toISOString().slice(0, 10)}
            onChange={async (e) => {
              if (!profile) return;
              const v = e.target.value || null;
              const { error } = await supabase.from("patients").update({ next_visit_date: v }).eq("id", profile.id);
              if (!error) {
                setProfile({ ...profile, next_visit_date: v });
                toast({ title: v ? "Visit saved" : "Visit cleared", description: v ? "We'll remind you the day before." : "" });
              }
            }}
            className="h-11 text-[15px] w-full block max-w-full appearance-none"
          />
          {profile?.next_visit_date && (
            <button
              type="button"
              onClick={async () => {
                if (!profile) return;
                const { error } = await supabase.from("patients").update({ next_visit_date: null }).eq("id", profile.id);
                if (!error) {
                  setProfile({ ...profile, next_visit_date: null });
                  toast({ title: "Visit cleared" });
                }
              }}
              className="mt-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear date
            </button>
          )}
        </div>
      </section>
      <section className="px-5 pt-5">
        <button
          onClick={() => setEditMode(!editMode)}
          className="w-full flex items-center justify-between py-3 border-b border-border"
        >
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div className="text-left">
              <p className="text-[15px] font-medium text-foreground">Edit Profile</p>
              <p className="text-xs text-muted-foreground">Update your personal details</p>
            </div>
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${editMode ? "rotate-90" : ""}`} />
        </button>

        {editMode && (
          <form onSubmit={handleSubmit} className="py-4 space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs text-muted-foreground">Full Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="age" className="text-xs text-muted-foreground">Age</Label>
                <Input id="age" type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs text-muted-foreground">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="health_id" className="text-xs text-muted-foreground">ABHA Health ID</Label>
              <Input id="health_id" value={formData.national_health_id} onChange={(e) => setFormData({ ...formData, national_health_id: e.target.value.replace(/\D/g, '').slice(0, 14) })} placeholder="14-digit ABHA ID" className="font-mono" />
            </div>
            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </form>
        )}
      </section>

      {/* Menu Items, Nykaa style */}
      <section className="px-5 pt-2">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={() => item.path && navigate(item.path)}
            className="w-full flex items-center justify-between py-3.5 border-b border-border"
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-[15px] font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </section>

      {/* About Vyana, like Nykaa's footer section */}
      <section className="px-5 pt-6">
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-2">About Vyana</p>
        {aboutItems.map((item, i) => (
          <button
            key={i}
            onClick={() => { if (item.onClick) item.onClick(); else if (item.path) navigate(item.path); }}
            className="w-full flex items-center justify-between py-3.5 border-b border-border"
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-[15px] font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </section>

      {/* Sign Out */}
      <section className="px-5 py-6">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/20 text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </section>

      {/* App version footer, like Nykaa */}
      <section className="pb-10 text-center">
        <p className="text-lg font-semibold text-foreground">V<span className="text-primary">yana</span></p>
        <p className="text-[11px] text-muted-foreground mt-1">ver 1.0.0</p>
        <div className="flex items-center justify-center gap-6 mt-4">
          {[
            { icon: Lock, label: "Privacy", path: "/legal#privacy" as string | null, onClick: undefined as undefined | (() => void) },
            { icon: FileText, label: "Terms", path: "/legal" as string | null, onClick: undefined as undefined | (() => void) },
            { icon: Star, label: "Rate App", path: null as string | null, onClick: handleRateApp },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => { if (item.onClick) item.onClick(); else if (item.path) navigate(item.path); }}>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PatientProfileEdit;
