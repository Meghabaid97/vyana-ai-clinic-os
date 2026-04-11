import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, FileText, Heart, Loader2, Shield, Stethoscope,
  Pill, Activity, Calendar, ArrowLeft, Home,
} from "lucide-react";

interface PatientSummary {
  name: string;
  age: number | null;
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
    file_type: string;
    uploaded_at: string;
    ai_summary: string | null;
  }[];
}

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
          <p className="text-sm text-muted-foreground">Verifying access…</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
        <header className="px-4 h-12 flex items-center border-b border-border">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <Home className="h-4 w-4" /> Home
          </Button>
        </header>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <h1 className="text-xl font-bold mb-1.5">Access Denied</h1>
            <p className="text-sm text-muted-foreground">
              {error || "This link is invalid or has expired."}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          <span className="text-sm font-medium truncate">Emergency Records — Vyana</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 animate-fade-in">
          {/* Patient Info */}
          <div className="mb-5">
            <h1 className="text-xl font-bold text-foreground">{summary.name}'s Records</h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {summary.age && <span>Age: {summary.age}y</span>}
              <span>{summary.consultationCount} consultation{summary.consultationCount !== 1 ? "s" : ""}</span>
              <span>{summary.recordCount} record{summary.recordCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Diagnoses & Medications */}
          {summary.consultations.length > 0 && (
            <div className="grid grid-cols-1 gap-3 mb-5">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2.5">
                    <Stethoscope className="h-4 w-4 text-primary" /> Diagnoses
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(
                      summary.consultations.flatMap(c => parseFhirDiagnoses(c.fhir_data))
                    )).map((d, i) => (
                      <span key={i} className="text-[11px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{d}</span>
                    ))}
                    {summary.consultations.flatMap(c => parseFhirDiagnoses(c.fhir_data)).length === 0 && (
                      <p className="text-xs text-muted-foreground">No diagnoses on record</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2.5">
                    <Pill className="h-4 w-4 text-primary" /> Medications
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(
                      summary.consultations.flatMap(c => parseFhirMedications(c.fhir_data))
                    )).map((m, i) => (
                      <span key={i} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{m}</span>
                    ))}
                    {summary.consultations.flatMap(c => parseFhirMedications(c.fhir_data)).length === 0 && (
                      <p className="text-xs text-muted-foreground">No medications on record</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Consultations */}
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Consultations
          </h2>
          {summary.consultations.length === 0 ? (
            <Card className="mb-5">
              <CardContent className="p-5 text-center text-sm text-muted-foreground">
                No consultations on record.
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
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Health Records
          </h2>
          {summary.healthRecords.length === 0 ? (
            <Card className="mb-5">
              <CardContent className="p-5 text-center text-sm text-muted-foreground">
                No uploaded health records.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 mb-5">
              {summary.healthRecords.map(r => (
                <Card key={r.id}>
                  <CardContent className="p-3.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium truncate">{r.file_name}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {new Date(r.uploaded_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </span>
                    </div>
                    {r.ai_summary && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{r.ai_summary}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center border-t border-border pt-4 pb-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">Vyana</span> • Every patient deserves a doctor who knows their story.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAccess;
