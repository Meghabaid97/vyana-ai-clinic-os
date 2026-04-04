import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PatientHeader from "@/components/PatientHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { t, useLanguage } from "@/lib/i18n";
import {
  Activity, AlertTriangle, Bell, ClipboardList, FileText,
  Heart, Loader2, Pill, Shield, Sparkles, TrendingUp,
  User, Stethoscope, FlaskConical, Building2, ChevronDown,
  ChevronUp, Share2, Phone as PhoneIcon, Calendar, Clock,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from "recharts";

interface HealthValue {
  key: string;
  label: string;
  unit: string;
  refMin: number;
  refMax: number;
  readings: { date: string; value: number }[];
}

interface ConsultationRecord {
  id: string;
  created_at: string;
  patient_name: string;
  fhir_data: string;
  doctor_id: string;
}

const TRACKED_VALUES: Omit<HealthValue, "readings">[] = [
  { key: "hba1c", label: "HbA1c", unit: "%", refMin: 4.0, refMax: 5.6 },
  { key: "glucose", label: "Fasting Glucose", unit: "mg/dL", refMin: 70, refMax: 100 },
  { key: "bpSystolic", label: "BP Systolic", unit: "mmHg", refMin: 90, refMax: 120 },
  { key: "bpDiastolic", label: "BP Diastolic", unit: "mmHg", refMin: 60, refMax: 80 },
  { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", refMin: 12.0, refMax: 17.5 },
  { key: "creatinine", label: "Creatinine", unit: "mg/dL", refMin: 0.7, refMax: 1.3 },
  { key: "vitaminD", label: "Vitamin D", unit: "ng/mL", refMin: 30, refMax: 100 },
  { key: "vitaminB12", label: "Vitamin B12", unit: "pg/mL", refMin: 200, refMax: 900 },
  { key: "tsh", label: "TSH", unit: "mIU/L", refMin: 0.4, refMax: 4.0 },
  { key: "cholesterol", label: "Total Cholesterol", unit: "mg/dL", refMin: 0, refMax: 200 },
  { key: "weight", label: "Weight", unit: "kg", refMin: 0, refMax: 999 },
];

const DOC_TYPE_ICONS: Record<string, any> = {
  prescription: ClipboardList,
  lab: FlaskConical,
  discharge: Building2,
  note: Stethoscope,
  default: FileText,
};

const PatientProfilePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lang } = useLanguage();

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: patient } = await supabase.from("patients").select("*").eq("user_id", session.user.id).single();
      if (!patient) { navigate("/auth"); return; }
      setProfile(patient);

      // Load consultations
      if (patient.national_health_id) {
        const { data: consData } = await supabase.from("consultations")
          .select("*")
          .eq("patient_national_health_id", patient.national_health_id)
          .order("created_at", { ascending: false });
        setConsultations(consData || []);
      }

      // Load health records
      const { data: records } = await supabase.from("health_records")
        .select("*").eq("patient_id", patient.id)
        .order("uploaded_at", { ascending: false });
      setHealthRecords(records || []);

    } catch (err) {
      console.error(err);
    } finally { setIsLoading(false); }
  };

  // Extract health values from FHIR data
  const extractHealthValues = (): HealthValue[] => {
    return TRACKED_VALUES.map(tv => {
      const readings: { date: string; value: number }[] = [];
      consultations.forEach(c => {
        try {
          const fhir = JSON.parse(c.fhir_data);
          const vitalSigns = fhir?.vitalSigns || fhir?.vital_signs || {};
          const labs = fhir?.labResults || fhir?.lab_results || {};
          const allData = { ...vitalSigns, ...labs };
          
          // Try to find matching value
          const keys = Object.keys(allData);
          for (const k of keys) {
            if (k.toLowerCase().includes(tv.key.toLowerCase())) {
              const val = parseFloat(allData[k]);
              if (!isNaN(val)) {
                readings.push({ date: new Date(c.created_at).toLocaleDateString(), value: val });
              }
            }
          }
        } catch {}
      });
      return { ...tv, readings: readings.reverse() };
    });
  };

  // Extract conditions, medications, allergies from latest FHIR
  const extractClinicalData = () => {
    const conditions: string[] = [];
    const medications: string[] = [];
    const allergies: string[] = [];
    const anomalies: string[] = [];

    consultations.forEach(c => {
      try {
        const fhir = JSON.parse(c.fhir_data);
        if (fhir?.diagnoses) {
          (Array.isArray(fhir.diagnoses) ? fhir.diagnoses : [fhir.diagnoses]).forEach((d: any) => {
            const name = typeof d === "string" ? d : d?.name || d?.diagnosis;
            if (name && !conditions.includes(name)) conditions.push(name);
          });
        }
        if (fhir?.medications) {
          (Array.isArray(fhir.medications) ? fhir.medications : [fhir.medications]).forEach((m: any) => {
            const name = typeof m === "string" ? m : m?.name || m?.drug;
            if (name && !medications.includes(name)) medications.push(name);
          });
        }
        if (fhir?.allergies) {
          (Array.isArray(fhir.allergies) ? fhir.allergies : [fhir.allergies]).forEach((a: any) => {
            const name = typeof a === "string" ? a : a?.name;
            if (name && !allergies.includes(name)) allergies.push(name);
          });
        }
      } catch {}
    });

    // Check health value anomalies
    const healthValues = extractHealthValues();
    healthValues.forEach(hv => {
      if (hv.readings.length > 0) {
        const latest = hv.readings[hv.readings.length - 1];
        if (latest.value < hv.refMin || latest.value > hv.refMax) {
          anomalies.push(`${hv.label}: ${latest.value} ${hv.unit} (normal: ${hv.refMin}-${hv.refMax})`);
        }
        if (hv.readings.length >= 2) {
          const prev = hv.readings[hv.readings.length - 2];
          const change = Math.abs((latest.value - prev.value) / prev.value) * 100;
          if (change > 15) {
            anomalies.push(`${hv.label} changed ${change.toFixed(0)}% from previous reading`);
          }
        }
      }
    });

    return { conditions, medications, allergies, anomalies };
  };

  const { conditions, medications, allergies, anomalies } = !isLoading ? extractClinicalData() : { conditions: [], medications: [], allergies: [], anomalies: [] };
  const healthValues = !isLoading ? extractHealthValues() : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PatientHeader patientName={profile?.name || "Patient"} title={t("patient.dashboard")} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard icon={FileText} label={t("patient.totalRecords")} value={healthRecords.length + consultations.length} color="primary" />
          <StatsCard icon={Heart} label={t("patient.activeConditions")} value={conditions.length} color="accent" />
          <StatsCard icon={Pill} label={t("patient.currentMedications")} value={medications.length} color="secondary" />
          <StatsCard icon={AlertTriangle} label={t("patient.flaggedAnomalies")} value={anomalies.length} color={anomalies.length > 0 ? "destructive" : "primary"} alert={anomalies.length > 0} />
        </div>

        {/* Alert Section */}
        {anomalies.length > 0 && (
          <Card className="mb-8 border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {t("patient.alertTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {anomalies.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <div className="h-2 w-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                    <span className="text-foreground">{a}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="records" className="text-xs md:text-sm">{t("patient.healthRecords")}</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs md:text-sm">{t("patient.trends")}</TabsTrigger>
            <TabsTrigger value="summary" className="text-xs md:text-sm">Summary</TabsTrigger>
            <TabsTrigger value="tools" className="text-xs md:text-sm">Tools</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Active Conditions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Active Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                {conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {conditions.map((c, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">{c}</span>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground text-sm">{t("common.noData")}</p>}
              </CardContent>
            </Card>

            {/* Current Medications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Pill className="h-5 w-5 text-primary" /> Current Medications</CardTitle>
              </CardHeader>
              <CardContent>
                {medications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {medications.map((m, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">{m}</span>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground text-sm">{t("common.noData")}</p>}
              </CardContent>
            </Card>

            {/* Known Allergies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-accent" /> Known Allergies</CardTitle>
              </CardHeader>
              <CardContent>
                {allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allergies.map((a, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium border border-accent/20">{a}</span>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground text-sm">No known allergies</p>}
              </CardContent>
            </Card>

            {/* Recent Visits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-secondary" /> Recent Visits</CardTitle>
              </CardHeader>
              <CardContent>
                {consultations.length > 0 ? (
                  <div className="space-y-3">
                    {consultations.slice(0, 5).map(c => {
                      let diagnosis = "";
                      try { const f = JSON.parse(c.fhir_data); diagnosis = Array.isArray(f?.diagnoses) ? f.diagnoses[0]?.name || f.diagnoses[0] || "" : ""; } catch {}
                      return (
                        <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Stethoscope className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{new Date(c.created_at).toLocaleDateString()}</p>
                              <p className="text-xs text-muted-foreground">{diagnosis || "Consultation"}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="text-muted-foreground text-sm">{t("common.noData")}</p>}
              </CardContent>
            </Card>
          </TabsContent>

          {/* RECORDS TAB */}
          <TabsContent value="records" className="space-y-4">
            {/* Filter bar */}
            <div className="flex gap-2 flex-wrap mb-4">
              {["All", "Prescription", "Lab", "Discharge", "Note"].map(type => (
                <Button key={type} variant="outline" size="sm" className="rounded-full">{type}</Button>
              ))}
            </div>

            {consultations.length === 0 && healthRecords.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No records yet</h3>
                <p className="text-muted-foreground mb-4">Upload your first health record to get started</p>
                <Button variant="gradient" onClick={() => navigate("/patient-health-records")}>Upload Record</Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {consultations.map(c => {
                  let fhir: any = {};
                  try { fhir = JSON.parse(c.fhir_data); } catch {}
                  const diagnoses = Array.isArray(fhir?.diagnoses) ? fhir.diagnoses.slice(0, 3) : [];
                  const isExpanded = expandedRecord === c.id;
                  const Icon = DOC_TYPE_ICONS.default;

                  return (
                    <Card key={c.id} className="cursor-pointer hover:shadow-soft transition-all" onClick={() => setExpandedRecord(isExpanded ? null : c.id)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{new Date(c.created_at).toLocaleDateString()}</p>
                              <p className="text-xs text-muted-foreground">
                                {diagnoses.map((d: any) => typeof d === "string" ? d : d?.name).join(", ") || "Consultation"}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                            {fhir?.diagnoses && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Diagnoses</p>
                                <div className="flex flex-wrap gap-1">
                                  {(Array.isArray(fhir.diagnoses) ? fhir.diagnoses : []).map((d: any, i: number) => (
                                    <span key={i} className="px-2 py-1 rounded bg-destructive/10 text-destructive text-xs">{typeof d === "string" ? d : d?.name}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {fhir?.medications && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Medications</p>
                                <div className="flex flex-wrap gap-1">
                                  {(Array.isArray(fhir.medications) ? fhir.medications : []).map((m: any, i: number) => (
                                    <span key={i} className="px-2 py-1 rounded bg-primary/10 text-primary text-xs">{typeof m === "string" ? m : m?.name}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {fhir?.vitalSigns && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Vital Signs</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {Object.entries(fhir.vitalSigns).map(([k, v]) => (
                                    <div key={k} className="px-2 py-1.5 rounded bg-muted/50 text-xs">
                                      <span className="text-muted-foreground">{k}: </span><span className="font-medium">{String(v)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TRENDS TAB */}
          <TabsContent value="trends">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {healthValues.map(hv => (
                <Card key={hv.key} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{hv.label}</span>
                      {hv.readings.length > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          hv.readings[hv.readings.length - 1].value >= hv.refMin && hv.readings[hv.readings.length - 1].value <= hv.refMax
                            ? "bg-green-100 text-green-700"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {hv.readings[hv.readings.length - 1].value} {hv.unit}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {hv.readings.length > 0 ? (
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={hv.readings}>
                            <defs>
                              <linearGradient id={`gradient-${hv.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} domain={[Math.min(hv.refMin * 0.8, hv.readings.reduce((m, r) => Math.min(m, r.value), Infinity) * 0.9), Math.max(hv.refMax * 1.2, hv.readings.reduce((m, r) => Math.max(m, r.value), 0) * 1.1)]} />
                            <Tooltip />
                            <ReferenceLine y={hv.refMin} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Min", fontSize: 9 }} />
                            <ReferenceLine y={hv.refMax} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Max", fontSize: 9 }} />
                            <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill={`url(#gradient-${hv.key})`} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center text-muted-foreground text-xs">{t("common.noData")}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* SUMMARY TAB (Point of Care) */}
          <TabsContent value="summary" className="space-y-6">
            <Card className="border-primary/20 print:shadow-none" id="point-of-care">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{profile?.name}</CardTitle>
                    <CardDescription>
                      Age: {profile?.age || "N/A"} • ABHA: {profile?.national_health_id ? `****${profile.national_health_id.slice(-4)}` : "Not linked"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Share2 className="h-4 w-4" />
                      {t("patient.shareDoctor")}
                    </Button>
                    <Button variant="destructive" size="sm" className="flex items-center gap-1">
                      <PhoneIcon className="h-4 w-4" />
                      {t("patient.emergencyAccess")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Active Conditions */}
                <SummarySection title="Active Conditions" icon={Heart}>
                  {conditions.length > 0 ? conditions.map((c, i) => <SummaryTag key={i} text={c} variant="destructive" />) : <p className="text-sm text-muted-foreground">None recorded</p>}
                </SummarySection>

                {/* Current Medications */}
                <SummarySection title="Current Medications" icon={Pill}>
                  {medications.length > 0 ? medications.map((m, i) => <SummaryTag key={i} text={m} variant="primary" />) : <p className="text-sm text-muted-foreground">None recorded</p>}
                </SummarySection>

                {/* Allergies */}
                <SummarySection title="Known Allergies" icon={AlertTriangle}>
                  {allergies.length > 0 ? allergies.map((a, i) => <SummaryTag key={i} text={a} variant="accent" />) : <p className="text-sm text-muted-foreground">None recorded</p>}
                </SummarySection>

                {/* Recent Visits */}
                <SummarySection title="Recent Visits" icon={Calendar}>
                  {consultations.slice(0, 3).map(c => {
                    let diag = "";
                    try { const f = JSON.parse(c.fhir_data); diag = Array.isArray(f?.diagnoses) ? (typeof f.diagnoses[0] === "string" ? f.diagnoses[0] : f.diagnoses[0]?.name) || "" : ""; } catch {}
                    return (
                      <div key={c.id} className="text-sm py-1">
                        <span className="font-medium">{new Date(c.created_at).toLocaleDateString()}</span>
                        <span className="text-muted-foreground"> — {diag || "Consultation"}</span>
                      </div>
                    );
                  })}
                </SummarySection>

                {/* Flagged Anomalies */}
                {anomalies.length > 0 && (
                  <SummarySection title="Flagged Anomalies" icon={AlertTriangle}>
                    {anomalies.map((a, i) => (
                      <div key={i} className="text-sm text-destructive flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-destructive" />
                        {a}
                      </div>
                    ))}
                  </SummarySection>
                )}

                {/* Key Lab Values */}
                <SummarySection title="Key Lab Values" icon={Activity}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {healthValues.filter(hv => hv.readings.length > 0).map(hv => {
                      const latest = hv.readings[hv.readings.length - 1];
                      const inRange = latest.value >= hv.refMin && latest.value <= hv.refMax;
                      return (
                        <div key={hv.key} className={`p-2 rounded-lg border text-sm ${inRange ? "border-border/50 bg-muted/30" : "border-destructive/30 bg-destructive/5"}`}>
                          <span className="text-muted-foreground">{hv.label}: </span>
                          <span className={`font-semibold ${inRange ? "" : "text-destructive"}`}>{latest.value} {hv.unit}</span>
                        </div>
                      );
                    })}
                  </div>
                </SummarySection>

                <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/50">
                  Generated by Vyana • Last updated {new Date().toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TOOLS TAB */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ToolCard
                icon={Bell}
                title={t("patient.reminders")}
                description="Medication & follow-up reminders"
                onClick={() => toast({ title: "Coming Soon", description: "Reminders feature is under development" })}
              />
              <ToolCard
                icon={TrendingUp}
                title={t("patient.analyzer")}
                description="AI health risk analysis"
                onClick={() => toast({ title: "Coming Soon", description: "Health analyzer is under development" })}
              />
              <ToolCard
                icon={ClipboardList}
                title={t("patient.prescriptions")}
                description="View & manage prescriptions"
                onClick={() => toast({ title: "Coming Soon", description: "Prescription viewer is under development" })}
              />
            </div>

            {/* ABHA ID Section */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  ABHA ID Integration
                </CardTitle>
                <CardDescription>
                  Your ABHA ID is your national health number. Linking it helps doctors across India identify your records instantly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile?.national_health_id ? (
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium border border-green-200">
                      ✓ ABHA Linked
                    </span>
                    <span className="text-sm text-muted-foreground">****{profile.national_health_id.slice(-4)}</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Link your 14-digit ABHA number to enable cross-provider record access.</p>
                    <Button variant="outline" size="sm" onClick={() => navigate("/patient-profile")}>Link ABHA ID</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Helper Components
const StatsCard = ({ icon: Icon, label, value, color, alert }: { icon: any; label: string; value: number; color: string; alert?: boolean }) => (
  <Card className={`p-4 ${alert ? "border-destructive/30 bg-destructive/5" : ""}`}>
    <div className="flex items-center gap-3">
      <div className={`h-10 w-10 rounded-xl bg-${color}/10 flex items-center justify-center`}>
        <Icon className={`h-5 w-5 text-${color}`} />
      </div>
      <div>
        <p className={`text-2xl font-bold ${alert ? "text-destructive" : "text-foreground"}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  </Card>
);

const SummarySection = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div>
    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
      <Icon className="h-4 w-4" />
      {title}
    </h3>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

const SummaryTag = ({ text, variant }: { text: string; variant: "destructive" | "primary" | "accent" }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
    variant === "destructive" ? "bg-destructive/10 text-destructive border-destructive/20" :
    variant === "primary" ? "bg-primary/10 text-primary border-primary/20" :
    "bg-accent/10 text-accent-foreground border-accent/20"
  }`}>{text}</span>
);

const ToolCard = ({ icon: Icon, title, description, onClick }: { icon: any; title: string; description: string; onClick: () => void }) => (
  <Card className="cursor-pointer hover:shadow-soft hover:border-primary/20 transition-all" onClick={onClick}>
    <CardContent className="p-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default PatientProfilePage;
