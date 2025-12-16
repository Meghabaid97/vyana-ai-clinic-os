import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Square, Loader2, Volume2, VolumeX, AlertTriangle } from "lucide-react";
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
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioQuality, setAudioQuality] = useState<"good" | "low" | "high" | "silent">("silent");
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
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

  const analyzeAudio = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume level (0-100)
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 128) * 100);
    setAudioLevel(normalizedLevel);
    
    // Determine audio quality
    if (normalizedLevel < 5) {
      setAudioQuality("silent");
    } else if (normalizedLevel < 15) {
      setAudioQuality("low");
    } else if (normalizedLevel > 85) {
      setAudioQuality("high");
    } else {
      setAudioQuality("good");
    }
    
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up audio analysis
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      // Start analyzing audio levels
      analyzeAudio();
      
      // Start duration timer
      setRecordingDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

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
      
      // Clean up audio analysis
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      setAudioLevel(0);
      setAudioQuality("silent");
      
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

          <div className="flex flex-col items-center py-8 space-y-4">
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
              <>
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  size="lg"
                  className="w-48"
                >
                  <Square className="mr-2 h-5 w-5" />
                  Stop Recording
                </Button>
                
                {/* Recording Duration */}
                <div className="text-sm text-muted-foreground">
                  Recording: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </div>
                
                {/* Audio Quality Indicator */}
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Audio Level</span>
                    <span className={`flex items-center gap-1 font-medium ${
                      audioQuality === "good" ? "text-green-500" :
                      audioQuality === "low" ? "text-yellow-500" :
                      audioQuality === "high" ? "text-red-500" :
                      "text-muted-foreground"
                    }`}>
                      {audioQuality === "good" && <Volume2 className="h-4 w-4" />}
                      {audioQuality === "low" && <VolumeX className="h-4 w-4" />}
                      {audioQuality === "high" && <AlertTriangle className="h-4 w-4" />}
                      {audioQuality === "silent" && <VolumeX className="h-4 w-4" />}
                      {audioQuality === "good" ? "Good" : 
                       audioQuality === "low" ? "Too Quiet" : 
                       audioQuality === "high" ? "Too Loud" : "No Audio"}
                    </span>
                  </div>
                  
                  {/* Level Bar */}
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-100 rounded-full ${
                        audioQuality === "good" ? "bg-green-500" :
                        audioQuality === "low" ? "bg-yellow-500" :
                        audioQuality === "high" ? "bg-red-500" :
                        "bg-muted-foreground"
                      }`}
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                  
                  {/* Quality Tips */}
                  {audioQuality === "low" && (
                    <p className="text-xs text-yellow-500">
                      Speak louder or move closer to the microphone
                    </p>
                  )}
                  {audioQuality === "high" && (
                    <p className="text-xs text-red-500">
                      Audio may clip. Speak softer or move away from the microphone
                    </p>
                  )}
                  {audioQuality === "silent" && (
                    <p className="text-xs text-muted-foreground">
                      No audio detected. Check your microphone
                    </p>
                  )}
                </div>
              </>
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
