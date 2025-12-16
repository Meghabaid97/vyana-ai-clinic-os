import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Square, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  { code: "", label: "Auto-detect", mixed: false },
  { code: "hi-en", label: "Hindi + English (Mixed)", mixed: true },
  { code: "hi", label: "Hindi (हिन्दी)", mixed: false },
  { code: "en", label: "English", mixed: false },
  { code: "bn-en", label: "Bengali + English (Mixed)", mixed: true },
  { code: "bn", label: "Bengali (বাংলা)", mixed: false },
  { code: "ta-en", label: "Tamil + English (Mixed)", mixed: true },
  { code: "ta", label: "Tamil (தமிழ்)", mixed: false },
  { code: "te-en", label: "Telugu + English (Mixed)", mixed: true },
  { code: "te", label: "Telugu (తెలుగు)", mixed: false },
  { code: "mr-en", label: "Marathi + English (Mixed)", mixed: true },
  { code: "mr", label: "Marathi (मराठी)", mixed: false },
  { code: "gu", label: "Gujarati (ગુજરાતી)", mixed: false },
  { code: "kn", label: "Kannada (ಕನ್ನಡ)", mixed: false },
  { code: "ml", label: "Malayalam (മലയാളം)", mixed: false },
  { code: "pa", label: "Punjabi (ਪੰਜਾਬੀ)", mixed: false },
  { code: "ur", label: "Urdu (اردو)", mixed: false },
];

const Consultation = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientNationalId, setPatientNationalId] = useState("");
  const [language, setLanguage] = useState("");
  const [transcription, setTranscription] = useState("");
  const [fhirData, setFhirData] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Speak about the patient consultation",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Failed to access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
        
        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error("Failed to convert audio");
        }

        // Transcribe audio with language preference
        const selectedLang = LANGUAGES.find(l => l.code === language);
        const isMixed = selectedLang?.mixed || false;
        
        const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke(
          "transcribe-audio",
          { 
            body: { 
              audio: base64Audio, 
              language: !isMixed && language && language !== "auto" ? language : undefined,
              mixedLanguage: isMixed ? language : undefined
            } 
          }
        );

        if (transcriptionError) throw transcriptionError;

        setTranscription(transcriptionData.text);

        // Convert to FHIR format with patient details
        const { data: fhirResponse, error: fhirError } = await supabase.functions.invoke(
          "convert-to-fhir",
          {
            body: {
              transcription: transcriptionData.text,
              patientName,
              patientAge,
              patientNationalId,
            },
          }
        );

        if (fhirError) throw fhirError;

        setFhirData(fhirResponse.fhir);

        // Save to database
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error: insertError } = await (supabase as any)
          .from("consultations")
          .insert({
            doctor_id: user.id,
            patient_name: patientName,
            patient_age: parseInt(patientAge),
            patient_national_health_id: patientNationalId,
            audio_transcription: transcriptionData.text,
            fhir_data: fhirResponse.fhir,
          });

        if (insertError) throw insertError;

        toast({
          title: "Success",
          description: "Consultation saved successfully",
        });

        // Reset form
        setPatientName("");
        setPatientAge("");
        setPatientNationalId("");
        setLanguage("");
        setTranscription("");
        setFhirData("");
      };
    } catch (error: any) {
      console.error("Error processing audio:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process consultation",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-foreground">Create Consultation</h1>
          <div className="flex gap-4">
            <Button onClick={() => navigate("/consultations")} variant="outline">
              View All Consultations
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
            </div>

            <div>
              <Label htmlFor="language">Consultation Language</Label>
              <Select value={language} onValueChange={setLanguage} disabled={isProcessing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code || "auto"}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Selecting a language improves transcription accuracy
              </p>
            </div>
          </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="patientName">Patient Name</Label>
              <Input
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient name"
                disabled={isProcessing}
              />
            </div>

            <div>
              <Label htmlFor="patientAge">Patient Age</Label>
              <Input
                id="patientAge"
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                placeholder="Enter patient age"
                disabled={isProcessing}
              />
            </div>

            <div>
              <Label htmlFor="patientNationalId">National Health ID</Label>
              <Input
                id="patientNationalId"
                value={patientNationalId}
                onChange={(e) => setPatientNationalId(e.target.value)}
                placeholder="Enter national health ID"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="flex justify-center py-8">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                disabled={isProcessing || !patientName || !patientAge || !patientNationalId}
                size="lg"
                className="w-48"
              >
                <Mic className="mr-2 h-5 w-5" />
                Start Recording
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="w-48"
              >
                <Square className="mr-2 h-5 w-5" />
                Stop Recording
              </Button>
            )}
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing consultation...</span>
            </div>
          )}

          {transcription && (
            <div className="space-y-2">
              <Label>Transcription</Label>
              <div className="p-4 bg-muted rounded-lg text-sm">
                {transcription}
              </div>
            </div>
          )}

          {fhirData && (
            <div className="space-y-2">
              <Label>FHIR Data</Label>
              <div className="p-4 bg-muted rounded-lg text-sm font-mono overflow-auto max-h-96">
                <pre>{JSON.stringify(JSON.parse(fhirData), null, 2)}</pre>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Consultation;
