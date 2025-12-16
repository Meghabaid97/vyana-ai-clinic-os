import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DoctorBreadcrumb from "@/components/DoctorBreadcrumb";
import { Mic, Square, Loader2, Volume2, VolumeX, AlertTriangle, CheckCircle2, XCircle, Shield, ArrowLeft, Home } from "lucide-react";
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

interface AadhaarVerificationResult {
  verified: boolean;
  data?: {
    name: string;
    age: number;
    gender: string;
    maskedAadhaar: string;
    verificationTimestamp: string;
  };
  error?: string;
  message?: string;
}

const Consultation = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientNationalId, setPatientNationalId] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [language, setLanguage] = useState("");
  const [transcription, setTranscription] = useState("");
  const [fhirData, setFhirData] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioQuality, setAudioQuality] = useState<"good" | "low" | "high" | "silent">("silent");
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Aadhaar verification state
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState<boolean | null>(null);
  const [aadhaarData, setAadhaarData] = useState<AadhaarVerificationResult["data"] | null>(null);
  
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

  // Reset Aadhaar verification when national ID changes
  useEffect(() => {
    setAadhaarVerified(null);
    setAadhaarData(null);
  }, [patientNationalId]);

  const verifyAadhaar = async () => {
    if (!patientNationalId || patientNationalId.length !== 12) {
      toast({
        title: "Invalid Aadhaar",
        description: "Please enter a valid 12-digit Aadhaar number",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingAadhaar(true);
    try {
      const { data, error } = await supabase.functions.invoke<AadhaarVerificationResult>(
        "verify-aadhaar",
        { body: { aadhaarNumber: patientNationalId } }
      );

      if (error) throw error;

      if (data?.verified) {
        setAadhaarVerified(true);
        setAadhaarData(data.data);
        
        // Auto-fill patient details from Aadhaar
        if (data.data) {
          setPatientName(data.data.name);
          setPatientAge(data.data.age.toString());
        }
        
        toast({
          title: "Aadhaar Verified",
          description: data.message || "Patient identity verified successfully",
        });
      } else {
        setAadhaarVerified(false);
        toast({
          title: "Verification Failed",
          description: data?.message || data?.error || "Could not verify Aadhaar",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Aadhaar verification error:", error);
      setAadhaarVerified(false);
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify Aadhaar",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingAadhaar(false);
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 128) * 100);
    setAudioLevel(normalizedLevel);
    
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

      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      analyzeAudio();
      
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
        
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error("Failed to convert audio");
        }

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

        setPatientName("");
        setPatientAge("");
        setPatientNationalId("");
        setPatientPhone("");
        setLanguage("");
        setTranscription("");
        setFhirData("");
        setAadhaarVerified(null);
        setAadhaarData(null);
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

  const canStartRecording = patientName && patientAge && patientNationalId && aadhaarVerified === true;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <DoctorBreadcrumb />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/doctor-dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-4xl font-bold text-foreground">Create Consultation</h1>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => navigate("/consultations")} variant="outline">
              View All Consultations
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Aadhaar Verification Section */}
            <div className="space-y-2">
              <Label htmlFor="patientNationalId" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                National Health ID (Aadhaar)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="patientNationalId"
                  value={patientNationalId}
                  onChange={(e) => setPatientNationalId(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="Enter 12-digit Aadhaar number"
                  disabled={isProcessing || isVerifyingAadhaar}
                  maxLength={12}
                  className={aadhaarVerified === true ? "border-green-500" : aadhaarVerified === false ? "border-red-500" : ""}
                />
                <Button
                  onClick={verifyAadhaar}
                  disabled={isProcessing || isVerifyingAadhaar || patientNationalId.length !== 12}
                  variant={aadhaarVerified === true ? "outline" : "default"}
                >
                  {isVerifyingAadhaar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : aadhaarVerified === true ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : aadhaarVerified === false ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
              
              {/* Verification Status */}
              {aadhaarVerified === true && aadhaarData && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                  <div className="flex items-center gap-2 text-green-600 font-medium mb-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Aadhaar Verified
                  </div>
                  <div className="text-muted-foreground space-y-1">
                    <p>Name: {aadhaarData.name}</p>
                    <p>Age: {aadhaarData.age} | Gender: {aadhaarData.gender}</p>
                    <p>Masked Aadhaar: {aadhaarData.maskedAadhaar}</p>
                  </div>
                </div>
              )}
              
              {aadhaarVerified === false && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm">
                  <div className="flex items-center gap-2 text-red-600 font-medium">
                    <XCircle className="h-4 w-4" />
                    Verification Failed
                  </div>
                  <p className="text-muted-foreground mt-1">
                    For testing, use: 123456789012, 234567890123, 345678901234, or 456789012345
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="patientName">Patient Name</Label>
              <Input
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient name"
                disabled={isProcessing || (aadhaarVerified === true)}
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
                disabled={isProcessing || (aadhaarVerified === true)}
              />
            </div>

            <div>
              <Label htmlFor="patientPhone">Patient Phone Number</Label>
              <Input
                id="patientPhone"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit phone number"
                disabled={isProcessing}
                maxLength={10}
              />
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

          <div className="flex flex-col items-center py-8 space-y-4">
            {!isRecording ? (
              <>
                <Button
                  onClick={startRecording}
                  disabled={isProcessing || !canStartRecording}
                  size="lg"
                  className="w-48"
                >
                  <Mic className="mr-2 h-5 w-5" />
                  Start Recording
                </Button>
                {!aadhaarVerified && patientNationalId.length === 12 && (
                  <p className="text-sm text-muted-foreground">
                    Please verify Aadhaar before recording
                  </p>
                )}
              </>
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
                
                <div className="text-sm text-muted-foreground">
                  Recording: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </div>
                
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
