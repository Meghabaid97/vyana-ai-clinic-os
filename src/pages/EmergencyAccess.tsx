import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import {
  AlertTriangle, FileText, Heart, Loader2, Shield, Stethoscope,
  Pill, Activity, Calendar, ArrowLeft, Home, ClipboardList, Siren,
  ScanLine, ExternalLink,
} from "lucide-react";

interface PatientSummary {
  name: string;
  age: number | null;
  phone: string | null;
  weight: number | null;
  city: string | null;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  generatedAt: string;
  consultationCount: number;
  recordCount: number;
  consultations: {
    id: string;
    created_at: string;
    fhir_data: string;
    patient_name: string;
  }[];
  healthRecords: {
    id: string;
    file_name: string;
    file_url: string | null;
    file_type: string;
    category: string | null;
    uploaded_at: string;
    ai_summary: string | null;
    document_type: string | null;
    important_findings: unknown;
    medications: unknown;
    allergies: unknown;
    diagnoses: unknown;
    extracted_vitals: unknown;
    ai_confidence: string | null;
    radiology_modality: string | null;
    radiology_body_part: string | null;
    radiology_study_date: string | null;
    radiology_impression: unknown;
    radiology_recommendations: unknown;
    radiology_provider: string | null;
    radiology_upload_kind: string | null;
  }[];
  activeMedications: {
    medication_name: string;
    dosage: string | null;
    frequency: string;
    time_slots: string[];
    notes: string | null;
  }[];
}

const toTextList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return String(record.name || record.finding || record.diagnosis || record.medication || record.value || record.text || "").trim();
    }
    return "";
  }).filter(Boolean);
};

const parseFhirDiagnoses = (fhirData: string): string[] => {
  try {
    const parsed = JSON.parse(fhirData);
    const conditions = parsed?.entry?.filter(
      (e: any) => e?.resource?.resourceType === "Condition"
    ) || [];
    return conditions.map((c: any) =>
      c?.resource?.code?.coding?.[0]?.display ||
      c?.resource?.code?.text || "Unknown"
    );
  } catch { return []; }
};

const parseFhirMedications = (fhirData: string): string[] => {
  try {
    const parsed = JSON.parse(fhirData);
    const meds = parsed?.entry?.filter(
      (e: any) => e?.resource?.resourceType === "MedicationRequest"
    ) || [];
    return meds.map((m: any) =>
      m?.resource?.medicationCodeableConcept?.coding?.[0]?.display ||
      m?.resource?.medicationCodeableConcept?.text || "Unknown"
    );
  } catch { return []; }
};

const EmergencyAccess = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) loadEmergencyData(token);
  }, [token]);

  const loadEmergencyData = async (accessToken: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/emergency-access`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ access_token: accessToken }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Access denied");
      }
      const data = await response.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center safe-area-top safe-area-bottom">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t("ea.verifying")}</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
        <header className="px-4 h-12 flex items-center border-b border-border">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <Home className="h-4 w-4" /> {t("ea.home")}
          </Button>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <h1 className="text-xl font-bold mb-1.5">{t("ea.accessDenied")}</h1>
            <p className="text-sm text-muted-foreground">
              {error || t("ea.linkInvalid")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const recordDiagnoses = Array.from(new Set(summary.healthRecords.flatMap(r => toTextList(r.diagnoses))));
  const recordMedications = Array.from(new Set(summary.healthRecords.flatMap(r => toTextList(r.medications))));
  const recordAllergies = Array.from(new Set(summary.healthRecords.flatMap(r => toTextList(r.allergies))));
  const recordFindings = Array.from(new Set(summary.healthRecords.flatMap(r => toTextList(r.important_findings)))).slice(0, 8);
  const recordVitals = summary.healthRecords.flatMap(r => toTextList(r.extracted_vitals)).slice(0, 8);
  const fhirDiagnoses = Array.from(new Set(summary.consultations.flatMap(c => parseFhirDiagnoses(c.fhir_data))));
  const fhirMedications = Array.from(new Set(summary.consultations.flatMap(c => parseFhirMedications(c.fhir_data))));
  const diagnoses = Array.from(new Set([...recordDiagnoses, ...fhirDiagnoses]));
  const medications = Array.from(new Set([
    ...summary.activeMedications.map(m => [m.medication_name, m.dosage].filter(Boolean).join(" • ")),
    ...recordMedications,
    ...fhirMedications,
  ]));
  const radiologyRecords = summary.healthRecords.filter((r) => r.category === "radiology_imaging");
  const openRecordFile = (url: string | null) => {
    if (!url) return;
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      {/* Top bar */}
      <header className="bg-primary text-primary-foreground px-4 py-2.5 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10 shrink-0"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium truncate">{t("ea.title")}</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 animate-fade-in">
          {/* Patient Info */}
          <div className="mb-5">
            <h1 className="text-xl font-bold text-foreground">{t("ea.recordsOf", { name: summary.name })}</h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {summary.age && <span>{t("ea.age", { age: summary.age })}</span>}
              {summary.phone && <span>{summary.phone}</span>}
              {summary.city && <span>{summary.city}</span>}
              <span>{t(summary.consultationCount === 1 ? "ea.consultations" : "ea.consultationsPlural", { count: summary.consultationCount })}</span>
              <span>{t(summary.recordCount === 1 ? "ea.records" : "ea.recordsPlural", { count: summary.recordCount })}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {t("ea.openedBy", { name: summary.emergencyContactName, rel: summary.emergencyContactRelationship, when: new Date(summary.generatedAt).toLocaleString("en-IN") })}
            </p>
          </div>

          {/* Critical summary */}
          <div className="grid grid-cols-1 gap-3 mb-5">
              <Card className="border-destructive/30">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2.5">
                    <Siren className="h-4 w-4 text-destructive" /> {t("ea.allergies")}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {recordAllergies.map((a, i) => (
                      <span key={i} className="text-[11px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                    {recordAllergies.length === 0 && <p className="text-xs text-muted-foreground">{t("ea.noAllergies")}</p>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2.5">
                    <Stethoscope className="h-4 w-4 text-primary" /> {t("ea.diagnoses")}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {diagnoses.map((d, i) => (
                      <span key={i} className="text-[11px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{d}</span>
                    ))}
                    {diagnoses.length === 0 && (
                      <p className="text-xs text-muted-foreground">{t("ea.noDiagnoses")}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2.5">
                    <Pill className="h-4 w-4 text-primary" /> {t("ea.medications")}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {medications.map((m, i) => (
                      <span key={i} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{m}</span>
                    ))}
                    {medications.length === 0 && (
                      <p className="text-xs text-muted-foreground">{t("ea.noMedications")}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2.5">
                    <ClipboardList className="h-4 w-4 text-primary" /> {t("ea.findings")}
                  </h3>
                  <div className="space-y-1.5">
                    {[...recordFindings, ...recordVitals].map((finding, i) => (
                      <p key={i} className="text-xs text-muted-foreground">• {finding}</p>
                    ))}
                    {recordFindings.length === 0 && recordVitals.length === 0 && (
                      <p className="text-xs text-muted-foreground">{t("ea.noFindings")}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
          </div>

          {/* Consultations */}
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> {t("ea.consultationsHeading")}
          </h2>
          {summary.consultations.length === 0 ? (
            <Card className="mb-5">
              <CardContent className="p-5 text-center text-sm text-muted-foreground">
                {t("ea.noConsultations")}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 mb-5">
              {summary.consultations.map(c => {
                const diagnoses = parseFhirDiagnoses(c.fhir_data);
                return (
                  <Card key={c.id}>
                    <CardContent className="p-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium truncate">{c.patient_name}</span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                          <Calendar className="h-3 w-3" />
                          {new Date(c.created_at).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </span>
                      </div>
                      {diagnoses.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {diagnoses.map((d, i) => (
                            <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{d}</span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Health Records */}
          {radiologyRecords.length > 0 && (
            <>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-primary" /> {t("ea.radiology")}
              </h2>
              <div className="space-y-2 mb-5">
                {radiologyRecords.map(r => {
                  const impression = toTextList(r.radiology_impression);
                  const recommendations = toTextList(r.radiology_recommendations);
                  return (
                    <Card
                      key={r.id}
                      role={r.file_url ? "button" : undefined}
                      tabIndex={r.file_url ? 0 : undefined}
                      onClick={() => openRecordFile(r.file_url)}
                      onKeyDown={(event) => {
                        if (r.file_url && (event.key === "Enter" || event.key === " ")) {
                          event.preventDefault();
                          openRecordFile(r.file_url);
                        }
                      }}
                      className={r.file_url ? "transition-colors hover:border-primary/40 hover:bg-muted/30 cursor-pointer" : ""}
                    >
                      <CardContent className="p-3.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium truncate">
                            {[r.radiology_modality, r.radiology_body_part].filter(Boolean).join(" ") || r.document_type || r.file_name}
                          </span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {new Date(r.radiology_study_date || r.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        {r.radiology_provider && <p className="text-[11px] text-muted-foreground">{r.radiology_provider}</p>}
                        {impression[0] && <p className="text-xs text-muted-foreground">{t("ea.impression", { text: impression[0] })}</p>}
                        {recommendations[0] && <p className="text-xs text-muted-foreground">{t("ea.followUp", { text: recommendations[0] })}</p>}
                        {r.radiology_upload_kind === "film_only" && (
                          <p className="text-[11px] text-muted-foreground">{t("ea.filmOnly")}</p>
                        )}
                        {r.file_url && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                            {t("ea.viewOriginal")} <ExternalLink className="h-3 w-3" />
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> {t("ea.healthRecords")}
          </h2>
          {summary.healthRecords.length === 0 ? (
            <Card className="mb-5">
              <CardContent className="p-5 text-center text-sm text-muted-foreground">
                {t("ea.noHealthRecords")}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 mb-5">
              {summary.healthRecords.map(r => {
                return (
                  <Card
                    key={r.id}
                    role={r.file_url ? "button" : undefined}
                    tabIndex={r.file_url ? 0 : undefined}
                    onClick={() => openRecordFile(r.file_url)}
                    onKeyDown={(event) => {
                      if (r.file_url && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault();
                        openRecordFile(r.file_url);
                      }
                    }}
                    className={r.file_url ? "transition-colors hover:border-primary/40 hover:bg-muted/30 cursor-pointer" : ""}
                  >
                      <CardContent className="p-3.5">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-sm font-medium truncate flex-1">{r.file_name}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {new Date(r.uploaded_at).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric"
                            })}
                          </span>
                        </div>
                        {r.ai_summary && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{r.ai_summary}</p>
                        )}
                        {r.file_url && (
                          <p className="text-xs font-semibold text-primary mt-2 inline-flex items-center gap-1">
                            {t("ea.viewOriginal")} <ExternalLink className="h-3 w-3" />
                          </p>
                        )}
                      </CardContent>
                    </Card>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center border-t border-border pt-4 pb-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">Vyana</span> • {t("ea.footer")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAccess;
