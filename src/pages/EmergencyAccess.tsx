import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle, FileText, Heart, Loader2, Shield, Stethoscope,
  Pill, Activity, Calendar,
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

const EmergencyAccess = () => {
  const { token } = useParams<{ token: string }>();
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) loadEmergencyData(token);
  }, [token]);

  const loadEmergencyData = async (accessToken: string) => {
    try {
      // Use edge function for unauthenticated access
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying emergency access...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              {error || "This emergency access link is invalid or has been deactivated."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Emergency banner */}
      <div className="bg-primary text-primary-foreground py-3 px-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">
            Emergency Medical Records Access — Vyana
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Patient Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {summary.name}'s Medical Records
          </h1>
          {summary.age && (
            <p className="text-muted-foreground">Age: {summary.age} years</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            {summary.consultationCount} consultation{summary.consultationCount !== 1 ? "s" : ""} •{" "}
            {summary.recordCount} health record{summary.recordCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Quick Diagnoses & Medications Summary */}
        {summary.consultations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  Diagnoses
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(
                    summary.consultations.flatMap(c => parseFhirDiagnoses(c.fhir_data))
                  )).map((d, i) => (
                    <span key={i} className="text-xs bg-destructive/10 text-destructive px-2.5 py-1 rounded-full">
                      {d}
                    </span>
                  ))}
                  {summary.consultations.flatMap(c => parseFhirDiagnoses(c.fhir_data)).length === 0 && (
                    <p className="text-sm text-muted-foreground">No diagnoses on record</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Pill className="h-4 w-4 text-primary" />
                  Medications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(
                    summary.consultations.flatMap(c => parseFhirMedications(c.fhir_data))
                  )).map((m, i) => (
                    <span key={i} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                      {m}
                    </span>
                  ))}
                  {summary.consultations.flatMap(c => parseFhirMedications(c.fhir_data)).length === 0 && (
                    <p className="text-sm text-muted-foreground">No medications on record</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Consultations */}
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Consultation History
        </h2>
        {summary.consultations.length === 0 ? (
          <Card className="mb-8">
            <CardContent className="p-8 text-center text-muted-foreground">
              No consultations on record.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 mb-8">
            {summary.consultations.map(c => {
              const diagnoses = parseFhirDiagnoses(c.fhir_data);
              return (
                <Card key={c.id}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{c.patient_name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(c.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </span>
                    </div>
                    {diagnoses.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {diagnoses.map((d, i) => (
                          <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded">
                            {d}
                          </span>
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
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Health Records
        </h2>
        {summary.healthRecords.length === 0 ? (
          <Card className="mb-8">
            <CardContent className="p-8 text-center text-muted-foreground">
              No uploaded health records.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 mb-8">
            {summary.healthRecords.map(r => (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{r.file_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.uploaded_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </span>
                  </div>
                  {r.ai_summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.ai_summary}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            <span className="text-gradient font-semibold">Vyana</span> • Every patient deserves a doctor who knows their story.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAccess;
