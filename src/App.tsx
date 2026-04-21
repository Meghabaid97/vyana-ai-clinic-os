import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { initShareIntent } from "@/lib/shareIntent";
import ShareReceive from "./pages/ShareReceive";
import Splash from "./pages/Splash";
import Index from "./pages/Index";
import WhyVyana from "./pages/WhyVyana";
import Auth from "./pages/Auth";
import AppShell from "./components/AppShell";
import AppHome from "./pages/AppHome";
import HealthTrends from "./pages/HealthTrends";
import PatientMedicalHistory from "./pages/PatientMedicalHistory";

import PatientHealthRecords from "./pages/PatientHealthRecords";
import PatientProfileEdit from "./pages/PatientProfileEdit";
import PatientBriefing from "./pages/PatientBriefing";
import DoctorVisitMode from "./pages/DoctorVisitMode";
import PatientProfilePage from "./pages/PatientProfilePage";
import EmergencyContacts from "./pages/EmergencyContacts";
import EmergencyAccess from "./pages/EmergencyAccess";
import PatientTimeline from "./pages/PatientTimeline";
import Vaccinations from "./pages/Vaccinations";
import MedicationReminders from "./pages/MedicationReminders";
import PrescriptionInterpreter from "./pages/PrescriptionInterpreter";
import ShareRecords from "./pages/ShareRecords";
import ClaimAssistant from "./pages/RecoveryHub";
import Legal from "./pages/Legal";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ShareIntentBridge = () => {
  const navigate = useNavigate();
  useEffect(() => {
    void initShareIntent((path) => navigate(path));
  }, [navigate]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ShareIntentBridge />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/splash" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/why-vyana" element={<WhyVyana />} />
          <Route path="/legal" element={<Legal />} />

          {/* Patient app with bottom tabs */}
          <Route path="/app" element={<AppShell />}>
            <Route index element={<AppHome />} />
            <Route path="trends" element={<HealthTrends />} />
            <Route path="records" element={<PatientHealthRecords />} />
            <Route path="story" element={<WhyVyana />} />
            <Route path="profile" element={<PatientProfileEdit />} />
            <Route path="timeline" element={<PatientTimeline />} />
            <Route path="vaccinations" element={<Vaccinations />} />
            <Route path="medications" element={<MedicationReminders />} />
            <Route path="prescription-reader" element={<PrescriptionInterpreter />} />
            <Route path="share" element={<ShareRecords />} />
            <Route path="briefing" element={<PatientBriefing />} />
            <Route path="visit" element={<DoctorVisitMode />} />
            <Route path="recovery" element={<ClaimAssistant />} />
            <Route path="support" element={<Support />} />
            <Route path="medical-history" element={<PatientMedicalHistory />} />
            <Route path="emergency-contacts" element={<EmergencyContacts />} />
            <Route path="share-receive" element={<ShareReceive />} />
          </Route>

          {/* Patient standalone pages */}
          <Route path="/patient-medical-history" element={<PatientMedicalHistory />} />
          <Route path="/patient-profile-page" element={<PatientProfilePage />} />
          <Route path="/emergency-contacts" element={<EmergencyContacts />} />
          <Route path="/emergency-access/:token" element={<EmergencyAccess />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
