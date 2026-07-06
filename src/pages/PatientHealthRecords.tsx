import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { fetchActivePatient, onActivePatientChange } from "@/lib/activePatient";
import { Loader2, FolderOpen, Upload, ChevronRight, Shield } from "lucide-react";

import PageHero from "@/components/PageHero";
import { useLanguage } from "@/lib/i18n";

const HealthRecordsTab = lazy(() => import("@/components/HealthRecordsTab"));

interface PatientProfile {
  id: string;
  name: string;
  national_health_id: string | null;
}

interface DoctorInfo {
  doctor_id: string;
  lastVisit: string;
}

const PatientHealthRecords = () => {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    loadData();
    const off = onActivePatientChange(() => { setIsLoading(true); void loadData(); });
    return () => off();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const patientData = await fetchActivePatient<PatientProfile>("*");

      if (patientData) {
        setProfile(patientData);

        if (patientData.national_health_id) {
          const { data: consultationsData } = await supabase
            .from("consultations")
            .select("doctor_id, created_at")
            .eq("patient_national_health_id", patientData.national_health_id)
            .order("created_at", { ascending: false });

          if (consultationsData) {
            const doctorMap = new Map<string, string>();
            consultationsData.forEach(c => {
              if (!doctorMap.has(c.doctor_id)) doctorMap.set(c.doctor_id, c.created_at);
            });
            setDoctors(Array.from(doctorMap.entries()).map(([doctor_id, lastVisit]) => ({ doctor_id, lastVisit })));
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({ title: t("hr.toast.loadFail"), description: t("hr.toast.loadFailDesc"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 sm:px-5 pt-4 pb-6 space-y-4">
      <PageHero
        icon={FolderOpen}
        title={t("hr.title")}
        subtitle={profile ? t("hr.subtitleReady") : t("hr.subtitleEmpty")}
      />

      {profile ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          }
        >
          <HealthRecordsTab patientId={profile.id} doctors={doctors} />
        </Suspense>
      ) : (
        <>
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t("hr.completeFirst")}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t("hr.completeDesc")}
                </p>
              </div>
              <Button onClick={() => navigate("/app/profile")} className="w-full justify-between rounded-xl">
                {t("hr.completeCta")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </section>

          <section className="space-y-2">
            {[t("hr.benefit1"), t("hr.benefit2"), t("hr.benefit3")].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-sm text-foreground">{item}</p>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
};

export default PatientHealthRecords;

