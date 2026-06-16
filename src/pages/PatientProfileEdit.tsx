import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchActivePatient, onActivePatientChange } from "@/lib/activePatient";
import { useLanguage } from "@/lib/i18n";
import {
  Loader2, User, Phone, Shield, Save, ChevronRight, LogOut,
  FileText, Heart, Calendar, HelpCircle, BookOpen, Star,
  Lock, MapPin, Share2, KeyRound, Download, Trash2, Sparkles,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PatientProfileData {
  id: string;
  name: string;
  age: number | null;
  date_of_birth: string | null;
  phone: string | null;
  national_health_id: string | null;
  next_visit_date: string | null;
}

const calculateAgeFromDob = (dob: string | null | undefined): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
};

const PatientProfileEdit = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<PatientProfileData | null>(null);
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({ name: "", date_of_birth: "", phone: "", national_health_id: "" });
  const [stats, setStats] = useState({ totalConsultations: 0, totalDoctors: 0, lastVisit: null as string | null });
  const [editMode, setEditMode] = useState(false);
  const [accountMode, setAccountMode] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({ password: "", confirmPassword: "" });
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
    const off = onActivePatientChange(() => { setIsLoading(true); loadProfile(); });
    return () => off();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setEmail(session.user.email || "");

      const patientData = await fetchActivePatient<any>("*");
      const error = null as any;
      if (error) throw error;
      if (patientData) {
        setProfile(patientData);
        setFormData({
          name: patientData.name || "",
          date_of_birth: patientData.date_of_birth || "",
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
        name: formData.name,
        date_of_birth: formData.date_of_birth || null,
        age: calculateAgeFromDob(formData.date_of_birth),
        phone: formData.phone || null, national_health_id: formData.national_health_id || null,
      }).eq("id", profile.id);
      if (error) throw error;
      toast({ title: t("prof.toast.updated"), description: t("prof.toast.updatedDesc") });
      setEditMode(false);
      loadProfile();
    } catch (error: any) {
      // Friendly mapping for unique-constraint violations on phone / ABHA ID.
      let description = error?.message || t("prof.toast.errorDesc");
      if (error?.code === "23505" || /duplicate key|already exists/i.test(error?.message || "")) {
        if (/national_health_id/i.test(error?.message || "")) {
          description = "This ABHA Health ID is already linked to another account.";
        } else if (/phone/i.test(error?.message || "")) {
          description = "This phone number is already registered.";
        } else {
          description = "This value is already in use by another account.";
        }
      }
      toast({ title: t("prof.toast.error"), description, variant: "destructive" });
    } finally { setIsSaving(false); }
  };

  const handleSignOut = async () => {
    try {
      const { signOutFully } = await import("@/lib/signOut");
      await signOutFully();
    } finally {
      // Hard reload to fully reset in-memory state and avoid stale
      // session listeners bouncing the user back to /app.
      window.location.replace("/auth");
    }
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
      toast({ title: t("prof.share.linkCopied"), description: t("prof.share.linkCopiedDesc") });
    } catch {
      window.open(WEB_APP_URL, "_blank", "noopener,noreferrer");
    }
  };

  const handleReferFriend = async () => {
    const shareData = {
      title: "Vyana",
      text: "I'm using Vyana to keep my family's health story ready for every doctor visit. Try it:",
      url: WEB_APP_URL,
    };
    const fallbackText = `${shareData.text} ${shareData.url}`;

    // Try native share first (mobile / supported browsers)
    if (typeof navigator !== "undefined" && typeof (navigator as any).share === "function") {
      try {
        await (navigator as any).share(shareData);
        return; // success
      } catch (err: any) {
        // User cancelled — exit silently. Any other error → fall through to copy.
        if (err?.name === "AbortError") return;
      }
    }

    // Clipboard fallback
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(fallbackText);
        toast({ title: t("prof.share.inviteCopied"), description: t("prof.share.inviteCopiedDesc") });
        return;
      }
    } catch { /* fall through */ }

    // Last resort — show the link in a toast so the user can copy manually
    toast({ title: t("prof.share.referLink"), description: WEB_APP_URL });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const password = passwordData.password.trim();
    if (password.length < 8) {
      toast({ title: t("prof.pwd.weak"), description: t("prof.pwd.weakDesc"), variant: "destructive" });
      return;
    }
    if (password !== passwordData.confirmPassword.trim()) {
      toast({ title: t("prof.pwd.mismatch"), description: t("prof.pwd.mismatchDesc"), variant: "destructive" });
      return;
    }

    setIsPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPasswordData({ password: "", confirmPassword: "" });
      setAccountMode(false);
      toast({ title: t("prof.pwd.updated"), description: t("prof.pwd.updatedDesc") });
    } catch (error: any) {
      toast({ title: t("prof.pwd.fail"), description: error.message || t("prof.pwd.failDesc"), variant: "destructive" });
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDownloadData = async () => {
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-my-data`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } },
      );
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vyana-my-data-${Date.now()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Download started", description: "Your data export is being downloaded." });
    } catch (e: any) {
      toast({ title: "Export failed", description: "Please try again later.", variant: "destructive" });
    } finally { setIsExporting(false); }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not signed in");
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/request-account-deletion`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ action: "request" }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Request failed");
      toast({
        title: "Deletion scheduled",
        description: json.status === "already_pending"
          ? "Your account is already scheduled for deletion."
          : "Your account will be permanently deleted in 30 days. You can cancel from this screen.",
      });
    } catch (e: any) {
      toast({ title: "Could not schedule deletion", description: "Please try again later.", variant: "destructive" });
    } finally { setIsDeleting(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const menuItems = [
    { icon: KeyRound, label: t("prof.menu.account"), desc: t("prof.menu.accountDesc"), path: null as string | null, onClick: () => setAccountMode(!accountMode) },
    { icon: Shield, label: t("prof.menu.emergency"), desc: t("prof.menu.emergencyDesc"), path: "/app/emergency-contacts" as string | null, onClick: undefined as undefined | (() => void) },
    { icon: Lock, label: t("prof.menu.privacy"), desc: t("prof.menu.privacyDesc"), path: "/legal" as string | null, onClick: undefined as undefined | (() => void) },
  ];

  const aboutItems = [
    { icon: Share2, label: t("prof.about.refer"), desc: t("prof.about.referDesc"), path: null as string | null, onClick: handleReferFriend },
    { icon: BookOpen, label: t("prof.about.story"), desc: t("prof.about.storyDesc"), path: "/app/story" as string | null, onClick: undefined as undefined | (() => void) },
    { icon: HelpCircle, label: t("prof.about.help"), desc: t("prof.about.helpDesc"), path: "/app/support" as string | null, onClick: undefined as undefined | (() => void) },
    { icon: Star, label: t("prof.about.rate"), desc: t("prof.about.rateDesc"), path: null as string | null, onClick: handleRateApp },
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
            <h1 className="text-2xl font-bold text-foreground">{profile?.name || t("prof.patient")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{email}</p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex gap-3 mt-5">
          {[
            { value: stats.totalConsultations, label: t("prof.stats.visits") },
            { value: stats.totalDoctors, label: t("prof.stats.doctors") },
            { value: stats.lastVisit ? new Date(stats.lastVisit).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "-", label: t("prof.stats.lastVisit") },
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
                <p className="text-xs font-medium text-primary uppercase tracking-wide">{t("prof.abha.title")}</p>
                <p className="text-lg font-bold text-foreground font-mono mt-0.5">{formData.national_health_id}</p>
              </div>
              <Shield className="h-8 w-8 text-primary/30" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{t("prof.abha.linked")}</p>
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
              <p className="text-sm font-semibold text-foreground">{t("prof.abha.connect")}</p>
              <p className="text-xs text-muted-foreground">{t("prof.abha.connectDesc")}</p>
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
              <p className="text-[15px] font-medium text-foreground">{t("prof.next.title")}</p>
              <p className="text-xs text-muted-foreground">
                {profile?.next_visit_date
                  ? t("prof.next.descSet")
                  : t("prof.next.descEmpty")}
              </p>
            </div>
          </div>
          <Input
            type="date"
            aria-label={t("prof.next.aria")}
            value={profile?.next_visit_date || ""}
            min={new Date().toISOString().slice(0, 10)}
            onChange={async (e) => {
              if (!profile) return;
              const v = e.target.value || null;
              const { error } = await supabase.from("patients").update({ next_visit_date: v }).eq("id", profile.id);
              if (!error) {
                setProfile({ ...profile, next_visit_date: v });
                toast({ title: v ? t("prof.next.saved") : t("prof.next.cleared"), description: v ? t("prof.next.savedDesc") : "" });
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
                  toast({ title: t("prof.next.cleared") });
                }
              }}
              className="mt-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("prof.next.clear")}
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
              <p className="text-[15px] font-medium text-foreground">{t("prof.edit.title")}</p>
              <p className="text-xs text-muted-foreground">{t("prof.edit.desc")}</p>
            </div>
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${editMode ? "rotate-90" : ""}`} />
        </button>

        {editMode && (
          <form onSubmit={handleSubmit} className="py-4 space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs text-muted-foreground">{t("prof.field.name")}</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dob" className="text-xs text-muted-foreground">Date of birth</Label>
                <Input id="dob" type="date" max={new Date().toISOString().split("T")[0]} value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
                {formData.date_of_birth && calculateAgeFromDob(formData.date_of_birth) !== null && (
                  <p className="text-[10px] text-muted-foreground">Age: {calculateAgeFromDob(formData.date_of_birth)} years</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs text-muted-foreground">{t("prof.field.phone")}</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="health_id" className="text-xs text-muted-foreground">{t("prof.field.abha")}</Label>
              <Input id="health_id" value={formData.national_health_id} onChange={(e) => setFormData({ ...formData, national_health_id: e.target.value.replace(/\D/g, '').slice(0, 14) })} placeholder={t("prof.field.abhaPh")} className="font-mono" />
            </div>
            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {t("prof.btn.save")}
            </Button>
          </form>
        )}
      </section>

      {/* Menu Items, Nykaa style */}
      <section className="px-5 pt-2">
        {menuItems.map((item, i) => (
          <div key={i}>
            <button
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
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${i === 1 && accountMode ? "rotate-90" : ""}`} />
            </button>
            {i === 1 && accountMode && (
              <form onSubmit={handlePasswordChange} className="py-4 space-y-3 border-b border-border animate-fade-in">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-xs text-muted-foreground">{t("prof.pwd.new")}</Label>
                  <Input id="new-password" type="password" value={passwordData.password} onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })} minLength={8} autoComplete="new-password" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">{t("prof.pwd.confirm")}</Label>
                  <Input id="confirm-password" type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} minLength={8} autoComplete="new-password" />
                </div>
                <Button type="submit" disabled={isPasswordSaving} className="w-full">
                  {isPasswordSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <KeyRound className="h-4 w-4 mr-2" />}
                  {t("prof.pwd.update")}
                </Button>
              </form>
            )}
          </div>
        ))}
      </section>

      {/* About Vyana, like Nykaa's footer section */}
      <section className="px-5 pt-6">
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-2">{t("prof.about")}</p>
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

      {/* Privacy & Data Rights (DPDPA 2023) */}
      <section className="px-5 pt-6">
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground mb-2">Your data rights</p>
        <button
          onClick={handleDownloadData}
          disabled={isExporting}
          className="w-full flex items-center justify-between py-3.5 border-b border-border disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            {isExporting ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" /> : <Download className="h-5 w-5 text-muted-foreground" />}
            <div className="text-left">
              <p className="text-[15px] font-medium text-foreground">Download my data</p>
              <p className="text-xs text-muted-foreground">A complete copy of everything Vyana stores about you</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center justify-between py-3.5 border-b border-border">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-destructive" />
                <div className="text-left">
                  <p className="text-[15px] font-medium text-destructive">Delete my account</p>
                  <p className="text-xs text-muted-foreground">Permanent erasure of all your records after a 30 day grace period</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your Vyana account?</AlertDialogTitle>
              <AlertDialogDescription>
                We will schedule permanent deletion of your account and every health record, vital, medication, symptom log, and shared link tied to it. You have 30 days to change your mind before erasure is final. This cannot be undone after that.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep my account</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Scheduling..." : "Yes, schedule deletion"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      {/* Sign Out */}
      <section className="px-5 py-6">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-destructive/20 text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">{t("prof.signOut")}</span>
        </button>
      </section>

      {/* App version footer, like Nykaa */}
      <section className="pb-10 text-center">
        <p className="text-lg font-semibold text-foreground">V<span className="text-primary">yana</span></p>
        <p className="text-[11px] text-muted-foreground mt-1">{t("prof.ver")} 1.0.0</p>
        <div className="flex items-center justify-center gap-6 mt-4">
          {[
            { icon: Lock, label: t("prof.footer.privacy"), path: "/legal#privacy" as string | null, onClick: undefined as undefined | (() => void) },
            { icon: FileText, label: t("prof.footer.terms"), path: "/legal" as string | null, onClick: undefined as undefined | (() => void) },
            { icon: Star, label: t("prof.footer.rate"), path: null as string | null, onClick: handleRateApp },
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
