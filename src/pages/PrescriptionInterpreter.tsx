import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchActivePatient, onActivePatientChange } from "@/lib/activePatient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera, Upload, Pen, Loader2, Sparkles, AlertTriangle, CheckCircle2,
  XCircle, Pill, Clock, Plus, Trash2, Undo2, Info, FolderOpen, FileText,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { saveToHealthRecords } from "@/lib/healthRecordsPipeline";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";

interface ExtractedMedication {
  name: string;
  name_original?: string | null;
  brand_name?: string | null;
  dosage?: string | null;
  route: string;
  frequency: string;
  frequency_original?: string | null;
  duration?: string | null;
  timing?: string | null;
  instructions?: string | null;
  instructions_original?: string | null;
  confidence: "high" | "medium" | "low" | "illegible";
  confidence_notes?: string | null;
  possible_alternatives?: string[];
}

interface PrescriptionResult {
  detected_languages: string[];
  doctor_name?: string | null;
  patient_name?: string | null;
  date?: string | null;
  diagnosis?: string | null;
  medications: ExtractedMedication[];
  additional_instructions?: string | null;
  illegible_sections: Array<{ location: string; description: string }>;
  overall_confidence: "high" | "medium" | "low";
  warnings: string[];
  disclaimer?: string;
}

const confidenceStyles = {
  high: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-500/10 border-green-500/20", label: "High" },
  medium: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-500/10 border-yellow-500/20", label: "Medium" },
  low: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", label: "Low" },
  illegible: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", label: "Illegible" },
};

const frequencyLabels: Record<string, string> = {
  once_daily: "Once daily",
  twice_daily: "Twice daily",
  thrice_daily: "Three times daily",
  four_times_daily: "Four times daily",
  as_needed: "As needed (SOS)",
  at_bedtime: "At bedtime",
  weekly: "Weekly",
};

const frequencyToTimeSlots: Record<string, string[]> = {
  once_daily: ["08:00"],
  twice_daily: ["08:00", "20:00"],
  thrice_daily: ["08:00", "14:00", "20:00"],
  four_times_daily: ["08:00", "12:00", "16:00", "20:00"],
  at_bedtime: ["22:00"],
  as_needed: ["08:00"],
  weekly: ["08:00"],
};

const PrescriptionInterpreter = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [result, setResult] = useState<PrescriptionResult | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSavingReminders, setIsSavingReminders] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState<Set<number>>(new Set());
  const [showRecordsPicker, setShowRecordsPicker] = useState(false);
  const [savedRxRecords, setSavedRxRecords] = useState<Array<{ id: string; file_name: string; file_path: string; file_type: string; uploaded_at: string }>>([]);
  const [loadingSavedRx, setLoadingSavedRx] = useState(false);
  const [patientCtx, setPatientCtx] = useState<{ patientId: string; userId: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const patient = await fetchActivePatient<{ id: string }>("id");
      if (patient) setPatientCtx({ patientId: patient.id, userId: session.user.id });
      else setPatientCtx(null);
    };
    void init();
    const off = onActivePatientChange(() => { void init(); });
    return () => off();
  }, []);

  const openSavedRxPicker = async () => {
    setShowRecordsPicker(true);
    if (savedRxRecords.length === 0 && patientCtx) {
      setLoadingSavedRx(true);
      try {
        const { data } = await supabase
          .from("health_records")
          .select("id, file_name, file_path, file_type, uploaded_at")
          .eq("patient_id", patientCtx.patientId)
          .eq("category", "prescription")
          .order("uploaded_at", { ascending: false });
        setSavedRxRecords(data || []);
      } finally {
        setLoadingSavedRx(false);
      }
    }
  };

  const pickSavedRx = async (rec: { id: string; file_name: string; file_path: string; file_type: string }) => {
    try {
      const { data } = await supabase.storage.from("health-records").download(rec.file_path);
      if (!data) throw new Error("Could not load record");
      const file = new window.File([data], rec.file_name, { type: rec.file_type });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageFile(file);
        setResult(null);
        setShowRecordsPicker(false);
      };
      reader.readAsDataURL(data);
    } catch (err: any) {
      toast({ title: "Failed to load", description: err.message, variant: "destructive" });
    }
  };

  // Camera / file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  // Canvas drawing
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    lastPosRef.current = getCanvasPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPosRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
  };

  const endDraw = () => {
    setIsDrawing(false);
    lastPosRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
  };

  const submitCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setImagePreview(dataUrl);
    // Convert dataURL to a File so it can be saved as a prescription record
    canvas.toBlob((blob) => {
      if (blob) setImageFile(new window.File([blob], `handwritten-rx-${Date.now()}.png`, { type: "image/png" }));
    }, "image/png");
    setShowCanvas(false);
    setResult(null);
  };

  // Interpret prescription
  const interpretPrescription = async () => {
    if (!imagePreview) return;
    setIsInterpreting(true);
    setResult(null);
    try {
      const sourceType = showCanvas ? "canvas" : "camera";
      const { data, error } = await supabase.functions.invoke("interpret-prescription", {
        body: { imageData: imagePreview, sourceType },
      });
      if (error) throw error;

      // Persist this prescription to Health Records under the "prescription" category (background, non-blocking).
      if (imageFile && patientCtx) {
        saveToHealthRecords(imageFile, patientCtx.patientId, patientCtx.userId, "prescription")
          .catch(err => console.error("Failed to save prescription to records:", err));
      }

      // Defensive: backend can return partial / null fields. Normalize before render so we never crash on missing keys.
      const safeConf = (c: any): "high" | "medium" | "low" | "illegible" =>
        c === "high" || c === "medium" || c === "low" || c === "illegible" ? c : "low";
      const normalized: PrescriptionResult = {
        detected_languages: Array.isArray(data?.detected_languages) ? data.detected_languages : [],
        doctor_name: data?.doctor_name ?? null,
        patient_name: data?.patient_name ?? null,
        date: data?.date ?? null,
        diagnosis: data?.diagnosis ?? null,
        medications: Array.isArray(data?.medications)
          ? data.medications.map((m: any) => ({
              name: m?.name ?? "Unknown",
              name_original: m?.name_original ?? null,
              brand_name: m?.brand_name ?? null,
              dosage: m?.dosage ?? null,
              route: m?.route ?? "oral",
              frequency: m?.frequency ?? "once_daily",
              frequency_original: m?.frequency_original ?? null,
              duration: m?.duration ?? null,
              timing: m?.timing ?? null,
              instructions: m?.instructions ?? null,
              instructions_original: m?.instructions_original ?? null,
              confidence: safeConf(m?.confidence),
              confidence_notes: m?.confidence_notes ?? null,
              possible_alternatives: Array.isArray(m?.possible_alternatives) ? m.possible_alternatives : [],
            }))
          : [],
        additional_instructions: data?.additional_instructions ?? null,
        illegible_sections: Array.isArray(data?.illegible_sections) ? data.illegible_sections : [],
        overall_confidence: (data?.overall_confidence === "high" || data?.overall_confidence === "medium" || data?.overall_confidence === "low") ? data.overall_confidence : "low",
        warnings: Array.isArray(data?.warnings) ? data.warnings : [],
        disclaimer: data?.disclaimer,
      };
      setResult(normalized);
      // Auto-select high-confidence meds
      const autoSelected = new Set<number>();
      normalized.medications.forEach((med, i) => {
        if (med.confidence === "high" || med.confidence === "medium") autoSelected.add(i);
      });
      setSelectedMeds(autoSelected);
    } catch (err: any) {
      console.error("Interpret error:", err);
      toast({ title: "Error", description: err.message || "Failed to interpret prescription", variant: "destructive" });
    } finally {
      setIsInterpreting(false);
    }
  };

  // Save selected meds as reminders
  const saveAsReminders = async () => {
    if (!result || selectedMeds.size === 0) return;
    setIsSavingReminders(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const patient = await fetchActivePatient<{ id: string }>("id");
      if (!patient) throw new Error("Patient profile not found");

      const reminders = Array.from(selectedMeds).map(i => {
        const med = result.medications[i];
        return {
          patient_id: patient.id,
          medication_name: med.brand_name || med.name,
          dosage: med.dosage || null,
          frequency: med.frequency === "once_daily" ? "daily" : med.frequency === "twice_daily" ? "daily" : med.frequency === "weekly" ? "weekly" : "daily",
          time_slots: frequencyToTimeSlots[med.frequency] || ["08:00"],
          notes: [
            med.timing ? `Timing: ${med.timing.replace(/_/g, " ")}` : null,
            med.instructions ? `Instructions: ${med.instructions}` : null,
            med.duration ? `Duration: ${med.duration}` : null,
            `Source: AI-interpreted prescription`,
          ].filter(Boolean).join(". "),
          is_active: true,
        };
      });

      const { error } = await supabase.from("medication_reminders").insert(reminders);
      if (error) throw error;

      toast({ title: "Reminders Created", description: `${reminders.length} medication reminder(s) added` });
    } catch (err: any) {
      console.error("Save reminders error:", err);
      toast({ title: "Error", description: err.message || "Failed to save reminders", variant: "destructive" });
    } finally {
      setIsSavingReminders(false);
    }
  };

  const toggleMed = (index: number) => {
    setSelectedMeds(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="animate-fade-in">
      <section className="px-5 pt-8 pb-4">
        <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground">
          Prescription Reader
        </h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed mt-2">
          Photograph or write a prescription, AI interprets it across English, Hindi, Tamil, Telugu & Bengali.
        </p>
      </section>

      <section className="px-5 pb-4">
        <MedicalDisclaimer />
      </section>



      {/* Input Methods */}
      {!imagePreview && !result && (
        <section className="px-5 pb-6 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 flex flex-col items-center gap-3 hover:border-primary/50 transition-colors"
          >
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Camera className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Take Photo or Upload</p>
              <p className="text-xs text-muted-foreground mt-0.5">Capture a prescription with your camera or select from gallery</p>
            </div>
          </button>

          <button
            onClick={() => {
              setShowCanvas(true);
              setTimeout(initCanvas, 100);
            }}
            className="w-full rounded-xl border border-border bg-card p-5 flex items-center gap-4 hover:border-primary/30 transition-colors"
          >
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Pen className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Write Prescription</p>
              <p className="text-xs text-muted-foreground">Use the digital writing pad</p>
            </div>
          </button>

          <button
            onClick={openSavedRxPicker}
            className="w-full rounded-xl border border-border bg-card p-5 flex items-center gap-4 hover:border-primary/30 transition-colors"
          >
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <FolderOpen className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Use saved prescription</p>
              <p className="text-xs text-muted-foreground">Pick from your prescription records</p>
            </div>
          </button>
        </section>
      )}

      {/* Image Preview */}
      {imagePreview && !result && (
        <section className="px-5 pb-6">
          <div className="rounded-xl border border-border overflow-hidden">
            <img src={imagePreview} alt="Prescription" className="w-full max-h-80 object-contain bg-muted" />
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setImagePreview(null); setImageFile(null); setResult(null); }}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Retake
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={interpretPrescription}
              disabled={isInterpreting}
            >
              {isInterpreting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Interpreting...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Interpret</>
              )}
            </Button>
          </div>
        </section>
      )}

      {/* Canvas Dialog */}
      <Dialog open={showCanvas} onOpenChange={setShowCanvas}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pen className="h-5 w-5 text-primary" /> Write Prescription
            </DialogTitle>
            <DialogDescription>Write in any language, English, Hindi, Tamil, Telugu, Bengali</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border overflow-hidden bg-background">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair touch-none"
              style={{ height: 300 }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={clearCanvas}>
              <Undo2 className="h-4 w-4 mr-1" /> Clear
            </Button>
            <Button onClick={submitCanvas} size="sm">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results */}
      {result && (
        <section className="px-5 pb-8 space-y-4">
          {/* Header */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Interpretation Result
              </h2>
              <Badge variant="outline" className={confidenceStyles[result.overall_confidence].bg}>
                {confidenceStyles[result.overall_confidence].label} confidence
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {result.detected_languages.map((lang, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{lang}</Badge>
              ))}
            </div>

            {(result.doctor_name || result.patient_name || result.date || result.diagnosis) && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                {result.doctor_name && <p><span className="font-medium">Doctor:</span> {result.doctor_name}</p>}
                {result.patient_name && <p><span className="font-medium">Patient:</span> {result.patient_name}</p>}
                {result.date && <p><span className="font-medium">Date:</span> {result.date}</p>}
                {result.diagnosis && <p><span className="font-medium">Diagnosis:</span> {result.diagnosis}</p>}
              </div>
            )}
          </Card>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <Card className="p-4 border-yellow-500/30 bg-yellow-500/5">
              <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Warnings
              </p>
              <ul className="space-y-1">
                {result.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-foreground flex gap-1.5">
                    <span className="text-yellow-600">⚠</span> {w}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Medications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Pill className="h-3 w-3" /> Medications ({result.medications.length})
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  if (selectedMeds.size === result.medications.length) setSelectedMeds(new Set());
                  else setSelectedMeds(new Set(result.medications.map((_, i) => i)));
                }}
              >
                {selectedMeds.size === result.medications.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            <div className="space-y-2">
              {result.medications.map((med, i) => {
                const conf = confidenceStyles[med.confidence];
                const ConfIcon = conf.icon;
                const isSelected = selectedMeds.has(i);

                return (
                  <Card
                    key={i}
                    className={`p-4 cursor-pointer transition-colors ${isSelected ? "border-primary/40 bg-primary/5" : ""}`}
                    onClick={() => toggleMed(i)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? "bg-primary border-primary" : "border-border"}`}>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{med.name}</span>
                          {med.brand_name && <Badge variant="outline" className="text-[10px]">{med.brand_name}</Badge>}
                          <Badge variant="outline" className={`text-[10px] ${conf.bg}`}>
                            <ConfIcon className={`h-2.5 w-2.5 mr-0.5 ${conf.color}`} /> {conf.label}
                          </Badge>
                        </div>

                        {med.name_original && (
                          <p className="text-xs text-muted-foreground mt-0.5">Original: {med.name_original}</p>
                        )}

                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                          {med.dosage && <span>💊 {med.dosage}</span>}
                          <span>🔄 {frequencyLabels[med.frequency] || med.frequency}</span>
                          {med.frequency_original && <span className="italic">({med.frequency_original})</span>}
                          {med.duration && <span>📅 {med.duration}</span>}
                          {med.timing && <span>⏰ {med.timing.replace(/_/g, " ")}</span>}
                          <span>💉 {med.route}</span>
                        </div>

                        {med.instructions && (
                          <p className="text-xs text-foreground mt-1.5 bg-muted/50 rounded px-2 py-1">
                            {med.instructions}
                          </p>
                        )}

                        {med.confidence_notes && (
                          <p className="text-[11px] text-destructive mt-1 flex items-start gap-1">
                            <Info className="h-3 w-3 mt-0.5 shrink-0" /> {med.confidence_notes}
                          </p>
                        )}

                        {med.possible_alternatives && med.possible_alternatives.length > 0 && (
                          <div className="mt-1.5">
                            <p className="text-[10px] text-muted-foreground font-medium">Could also be:</p>
                            <div className="flex gap-1 mt-0.5">
                              {med.possible_alternatives.map((alt, ai) => (
                                <Badge key={ai} variant="outline" className="text-[10px] border-yellow-500/30">{alt}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Illegible Sections */}
          {result.illegible_sections.length > 0 && (
            <Card className="p-4 border-destructive/20 bg-destructive/5">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-2 flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Could Not Read
              </p>
              {result.illegible_sections.map((sec, i) => (
                <div key={i} className="text-xs text-foreground mb-1">
                  <span className="font-medium">{sec.location}:</span> {sec.description}
                </div>
              ))}
            </Card>
          )}

          {/* Additional Instructions */}
          {result.additional_instructions && (
            <Card className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Additional Instructions</p>
              <p className="text-sm text-foreground">{result.additional_instructions}</p>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              className="w-full gap-2"
              onClick={saveAsReminders}
              disabled={selectedMeds.size === 0 || isSavingReminders}
            >
              {isSavingReminders ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Plus className="h-4 w-4" /> Create {selectedMeds.size} Medication Reminder{selectedMeds.size !== 1 ? "s" : ""}</>
              )}
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setImagePreview(null); setImageFile(null); setResult(null); setSelectedMeds(new Set()); }}
              >
                Scan Another
              </Button>
            </div>
          </div>

          {result.disclaimer && (
            <p className="text-[10px] text-muted-foreground italic text-center">{result.disclaimer}</p>
          )}
        </section>
      )}

      {/* Saved Prescriptions Picker */}
      <Dialog open={showRecordsPicker} onOpenChange={setShowRecordsPicker}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" /> Saved Prescriptions
            </DialogTitle>
            <DialogDescription>Pick a prescription record to interpret</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {loadingSavedRx ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : savedRxRecords.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No saved prescriptions yet. Upload one in Records under the Prescriptions tab.</p>
              </div>
            ) : (
              savedRxRecords.map(rec => (
                <button
                  key={rec.id}
                  onClick={() => pickSavedRx(rec)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{rec.file_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(rec.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrescriptionInterpreter;
