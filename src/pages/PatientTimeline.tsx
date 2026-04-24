import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, FileText, Pill, Stethoscope, TrendingUp,
  Calendar, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TimelineEvent {
  id: string;
  date: string;
  type: "record" | "consultation" | "vitals" | "appointment";
  title: string;
  subtitle?: string;
  details?: string[];
  icon: typeof Activity;
  color: string;
}

const PatientTimeline = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { loadTimeline(); }, []);

  const loadTimeline = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: patient } = await supabase
      .from("patients")
      .select("id, national_health_id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (!patient) { setLoading(false); return; }

    const allEvents: TimelineEvent[] = [];

    // Health records
    const { data: records } = await supabase
      .from("health_records")
      .select("id, file_name, uploaded_at, ai_summary, document_type, important_findings, medications, allergies, diagnoses, extracted_vitals")
      .eq("patient_id", patient.id)
      .order("uploaded_at", { ascending: false });

    (records || []).forEach((r) => {
      const details: string[] = [];
      if (r.ai_summary) {
        const lines = r.ai_summary.split("\n").filter((l: string) => l.startsWith("- ")).slice(0, 5);
        details.push(...lines);
      }
      const structured = [
        ...(Array.isArray(r.important_findings) ? r.important_findings.map((x: string) => `• ${x}`) : []),
        ...(Array.isArray(r.diagnoses) ? r.diagnoses.map((x: string) => `🏥 ${x}`) : []),
        ...(Array.isArray(r.medications) ? r.medications.map((x: string) => `💊 ${x}`) : []),
        ...(Array.isArray(r.allergies) ? r.allergies.map((x: string) => `⚠️ Allergy: ${x}`) : []),
        ...(Array.isArray(r.extracted_vitals) ? r.extracted_vitals.map((v: any) => `📈 ${v.name}: ${v.value}${v.unit ? ` ${v.unit}` : ""}`) : []),
      ].slice(0, 8);
      if (structured.length > 0) details.splice(0, details.length, ...structured);
      allEvents.push({
        id: `record-${r.id}`,
        date: r.uploaded_at,
        type: "record",
        title: r.file_name,
        subtitle: r.document_type || (r.ai_summary ? "AI summary available" : "Pending analysis"),
        details: details.length > 0 ? details : undefined,
        icon: FileText,
        color: "bg-primary/10 text-primary",
      });
    });

    // Consultations
    if (patient.national_health_id) {
      const { data: consultations } = await supabase
        .from("consultations")
        .select("id, created_at, fhir_data")
        .eq("patient_national_health_id", patient.national_health_id)
        .order("created_at", { ascending: false });

      (consultations || []).forEach((c) => {
        const details: string[] = [];
        try {
          const fhir = JSON.parse(c.fhir_data);
          const entry = fhir?.entry || [];
          entry.forEach((e: any) => {
            if (e.resource?.resourceType === "MedicationRequest") {
              const med = e.resource?.medicationCodeableConcept?.text;
              if (med) details.push(`💊 ${med}`);
            }
            if (e.resource?.resourceType === "Condition") {
              const diag = e.resource?.code?.text;
              if (diag) details.push(`🏥 ${diag}`);
            }
          });
        } catch { /* ignore parse errors */ }

        allEvents.push({
          id: `consult-${c.id}`,
          date: c.created_at,
          type: "consultation",
          title: "Doctor Consultation",
          subtitle: details.length > 0 ? `${details.length} findings` : "Visit recorded",
          details: details.length > 0 ? details : undefined,
          icon: Stethoscope,
          color: "bg-violet-500/10 text-violet-600",
        });
      });
    }

    // Vital history snapshots
    const { data: vitalHistory } = await supabase
      .from("vital_history")
      .select("id, recorded_at, source_file_name, confidence, vitals")
      .eq("patient_id", patient.id)
      .order("recorded_at", { ascending: false }) as { data: any[] | null };

    (vitalHistory || []).forEach((vh) => {
      const vitals = vh.vitals as Record<string, number | null>;
      const filled = Object.entries(vitals).filter(([, v]) => v !== null);
      const details = filled.slice(0, 6).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`);

      allEvents.push({
        id: `vitals-${vh.id}`,
        date: vh.recorded_at,
        type: "vitals",
        title: `Vitals Snapshot`,
        subtitle: `${filled.length} values extracted from ${vh.source_file_name}`,
        details,
        icon: TrendingUp,
        color: "bg-green-500/10 text-green-600",
      });
    });

    // Appointments
    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, requested_date, requested_time_slot, status, reason")
      .eq("patient_id", patient.id)
      .order("requested_date", { ascending: false });

    (appointments || []).forEach((a) => {
      allEvents.push({
        id: `appt-${a.id}`,
        date: new Date(a.requested_date).toISOString(),
        type: "appointment",
        title: `Appointment, ${a.status}`,
        subtitle: a.reason || a.requested_time_slot,
        icon: Calendar,
        color: a.status === "completed"
          ? "bg-green-500/10 text-green-600"
          : a.status === "approved"
          ? "bg-blue-500/10 text-blue-600"
          : "bg-yellow-500/10 text-yellow-600",
      });
    });

    // Sort by date descending
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEvents(allEvents);
    setLoading(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const typeLabel = (t: string) => {
    switch (t) {
      case "record": return "Record";
      case "consultation": return "Visit";
      case "vitals": return "Vitals";
      case "appointment": return "Appointment";
      default: return t;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <section className="px-5 pt-8 pb-4">
        <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground">
          Your Health Timeline
        </h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed mt-2">
          Every visit, report, and vital, connected in one view.
        </p>
      </section>

      {/* Summary badges */}
      <section className="px-5 pb-5">
        <div className="flex gap-2 flex-wrap">
          {["record", "consultation", "vitals", "appointment"].map((type) => {
            const count = events.filter((e) => e.type === type).length;
            if (count === 0) return null;
            return (
              <Badge key={type} variant="outline" className="text-[11px]">
                {count} {typeLabel(type)}{count > 1 ? "s" : ""}
              </Badge>
            );
          })}
        </div>
      </section>

      {events.length === 0 ? (
        <section className="px-5 pb-8">
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-1">No events yet</h2>
            <p className="text-sm text-muted-foreground">Upload a health record or book an appointment to start building your timeline.</p>
          </div>
        </section>
      ) : (
        <section className="px-5 pb-8">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-1">
              {events.map((event, i) => {
                const isExpanded = expandedId === event.id;
                const showDateHeader = i === 0 || formatDate(events[i - 1].date) !== formatDate(event.date);

                return (
                  <div key={event.id}>
                    {showDateHeader && (
                      <div className="flex items-center gap-3 py-3 pl-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary z-10 ring-4 ring-background" />
                        <span className="text-[12px] font-bold text-primary uppercase tracking-wider">
                          {formatDate(event.date)}
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : event.id)}
                      className="w-full text-left pl-10 pr-0 relative"
                    >
                      {/* Connector dot */}
                      <div className={`absolute left-[14px] top-4 h-3 w-3 rounded-full z-10 ring-2 ring-background ${event.color.split(" ")[0]}`} />

                      <div className={`rounded-xl border border-border bg-card p-3.5 mb-1.5 hover:border-primary/20 transition-colors`}>
                        <div className="flex items-start gap-3">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${event.color}`}>
                            <event.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-medium text-foreground truncate">{event.title}</p>
                              {event.details && (
                                isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            {event.subtitle && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">{event.subtitle}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-[9px] shrink-0">{typeLabel(event.type)}</Badge>
                        </div>

                        {isExpanded && event.details && (
                          <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                            {event.details.map((d, di) => (
                              <p key={di} className="text-[12px] text-foreground">{d}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default PatientTimeline;
