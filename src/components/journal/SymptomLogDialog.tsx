import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Camera, X, Loader2, Mic, Square, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SYMPTOM_CATALOG, symptomById } from "@/lib/symptomCatalog";

const VALID_IDS = new Set(SYMPTOM_CATALOG.map((s) => s.id));

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string | null;
  onLogged?: () => void;
}

const SymptomLogDialog = ({ open, onClose, patientId, onLogged }: Props) => {
  const { toast } = useToast();
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [symptomId, setSymptomId] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState("");
  const [bodyLocation, setBodyLocation] = useState("");
  const [triggers, setTriggers] = useState<string[]>([]);
  const [associated, setAssociated] = useState<string[]>([]);
  const [medsTaken, setMedsTaken] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Voice capture
  const [recording, setRecording] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!open) {
      setStep("pick");
      setSymptomId(""); setCustomName(""); setSeverity(5); setDuration("");
      setBodyLocation(""); setTriggers([]); setAssociated([]); setMedsTaken("");
      setNotes(""); setPhotoFile(null);
      setTranscript(""); setRecording(false); setParsing(false);
      try { mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop()); } catch {}
      mediaRecorderRef.current = null;
    }
  }, [open]);

  const def = symptomId ? symptomById(symptomId) : null;

  const pickSymptom = (id: string) => {
    const d = symptomById(id);
    setSymptomId(id);
    setBodyLocation(d.defaultLocation || "");
    setStep("details");
  };

  const toggle = (arr: string[], setArr: (s: string[]) => void, v: string) => {
    setArr(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        await parseVoice(blob);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          setRecording(false);
        }
      }, 30000);
    } catch {
      toast({ title: "Mic blocked", description: "Allow microphone access to use voice.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const parseVoice = async (blob: Blob) => {
    setParsing(true);
    try {
      const buf = await blob.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
      }
      const audioBase64 = btoa(binary);
      const { data, error } = await supabase.functions.invoke("voice-symptom-parse", {
        body: { audioBase64, mimeType: blob.type },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const id = VALID_IDS.has(data?.symptom_type) ? data.symptom_type : "other";
      const d = symptomById(id);
      setSymptomId(id);
      if (id === "other") setCustomName(String(data?.custom_symptom_name || "").slice(0, 80));
      const sev = Number(data?.severity);
      setSeverity(Number.isFinite(sev) ? Math.min(10, Math.max(1, Math.round(sev))) : 5);
      setDuration(String(data?.duration || "").slice(0, 50));
      setBodyLocation(String(data?.body_location || d.defaultLocation || "").slice(0, 50));
      const filt = (arr: any, pool: string[]) =>
        Array.isArray(arr) ? arr.map(String).filter((x) => pool.includes(x)) : [];
      setTriggers(filt(data?.triggers, d.commonTriggers));
      setAssociated(filt(data?.associated_symptoms, d.commonAssociated));
      setMedsTaken(Array.isArray(data?.medications_taken) ? data.medications_taken.join(", ") : "");
      setNotes(String(data?.notes || data?.transcript || "").slice(0, 500));
      setTranscript(String(data?.transcript || ""));
      setStep("details");
      toast({ title: "Filled from your voice", description: "Review and edit before saving." });
    } catch (e) {
      toast({ title: "Couldn't parse voice", description: e instanceof Error ? e.message : "Try typing instead", variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  const save = async () => {
    if (!patientId) return;
    if (symptomId === "other" && customName.trim().length < 2) {
      toast({ title: "Add a symptom name", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      let photo_path: string | null = null;
      if (photoFile) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const ext = photoFile.name.split(".").pop() || "jpg";
          const path = `${session.user.id}/${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage.from("symptom-photos").upload(path, photoFile);
          if (!upErr) photo_path = path;
        }
      }
      const meds = medsTaken.split(",").map(m => m.trim()).filter(Boolean);
      const { error } = await supabase.from("symptom_logs").insert({
        patient_id: patientId,
        symptom_type: symptomId,
        custom_symptom_name: symptomId === "other" ? customName.trim() : null,
        severity,
        duration: duration.trim() || null,
        body_location: bodyLocation.trim() || null,
        triggers, associated_symptoms: associated, medications_taken: meds,
        notes: notes.trim() || null,
        photo_path,
      });
      if (error) throw error;
      toast({ title: "Logged ✓", description: "Vyana will look for patterns over time." });
      onLogged?.();
      onClose();
    } catch (e) {
      toast({ title: "Could not save", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step === "pick" ? "How are you feeling?" : `Log ${def?.label.toLowerCase()}`}</DialogTitle>
          <DialogDescription>
            {step === "pick"
              ? "Pick a symptom to log. Vyana stores this safely — never a diagnosis."
              : "Add as much or as little as you want."}
          </DialogDescription>
        </DialogHeader>

        {step === "pick" && (
          <div className="grid grid-cols-3 gap-2 py-2">
            {SYMPTOM_CATALOG.map((s) => (
              <button
                key={s.id}
                onClick={() => pickSymptom(s.id)}
                className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-[12px] font-medium text-foreground text-center leading-tight">{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {step === "details" && def && (
          <div className="space-y-4 py-2">
            {symptomId === "other" && (
              <div>
                <Label htmlFor="custom">Symptom name</Label>
                <Input id="custom" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Joint stiffness" maxLength={80} />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Severity</Label>
                <span className="text-sm font-bold text-primary">{severity}/10</span>
              </div>
              <Slider min={1} max={10} step={1} value={[severity]} onValueChange={(v) => setSeverity(v[0])} />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Mild</span><span>Severe</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dur">Duration</Label>
                <Input id="dur" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 2 hours" maxLength={50} />
              </div>
              <div>
                <Label htmlFor="loc">Body location</Label>
                <Input id="loc" value={bodyLocation} onChange={(e) => setBodyLocation(e.target.value)} placeholder="e.g. Forehead" maxLength={50} />
              </div>
            </div>

            {def.commonTriggers.length > 0 && (
              <div>
                <Label className="mb-1.5 block">Triggers</Label>
                <div className="flex flex-wrap gap-1.5">
                  {def.commonTriggers.map((t) => (
                    <Badge
                      key={t}
                      variant={triggers.includes(t) ? "default" : "outline"}
                      onClick={() => toggle(triggers, setTriggers, t)}
                      className="cursor-pointer"
                    >{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            {def.commonAssociated.length > 0 && (
              <div>
                <Label className="mb-1.5 block">Other symptoms</Label>
                <div className="flex flex-wrap gap-1.5">
                  {def.commonAssociated.map((t) => (
                    <Badge
                      key={t}
                      variant={associated.includes(t) ? "default" : "outline"}
                      onClick={() => toggle(associated, setAssociated, t)}
                      className="cursor-pointer"
                    >{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="meds">Medications taken (comma separated)</Label>
              <Input id="meds" value={medsTaken} onChange={(e) => setMedsTaken(e.target.value)} placeholder="e.g. Crocin 500mg" maxLength={200} />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything else worth remembering" rows={2} maxLength={500} />
            </div>

            <div>
              <Label className="mb-1.5 block">Photo (optional)</Label>
              {photoFile ? (
                <div className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <span className="text-xs text-foreground truncate">{photoFile.name}</span>
                  <button onClick={() => setPhotoFile(null)} aria-label="Remove">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary/40">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add photo (rash, swelling, etc.)</span>
                  <input
                    type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && f.size <= 8 * 1024 * 1024) setPhotoFile(f);
                      else if (f) toast({ title: "Photo too large", description: "Max 8MB", variant: "destructive" });
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "details" && (
            <>
              <Button variant="ghost" onClick={() => setStep("pick")} disabled={saving}>Back</Button>
              <Button onClick={save} disabled={saving} className="flex-1">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving</> : "Save log"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SymptomLogDialog;
