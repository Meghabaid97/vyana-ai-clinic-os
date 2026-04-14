import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Splash from "./pages/Splash";
import Index from "./pages/Index";
import WhyVyana from "./pages/WhyVyana";
import Auth from "./pages/Auth";
import AppShell from "./components/AppShell";
import AppHome from "./pages/AppHome";
import HealthTrends from "./pages/HealthTrends";
import Consultation from "./pages/Consultation";
import ConsultationsList from "./pages/ConsultationsList";
import DoctorPatientView from "./pages/DoctorPatientView";
import PatientMedicalHistory from "./pages/PatientMedicalHistory";
import PatientAppointments from "./pages/PatientAppointments";
import PatientHealthRecords from "./pages/PatientHealthRecords";
import PatientProfileEdit from "./pages/PatientProfileEdit";
import DoctorDashboard from "./pages/DoctorDashboard";
import PatientBriefing from "./pages/PatientBriefing";
import DoctorAppointments from "./pages/DoctorAppointments";
import SharedHealthRecords from "./pages/SharedHealthRecords";
import DoctorProfileSetup from "./pages/DoctorProfileSetup";
import FindDoctors from "./pages/FindDoctors";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Splash />} />
          <Route path="/landing" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/why-vyana" element={<WhyVyana />} />
          <Route path="/legal" element={<Legal />} />

          {/* Patient app with bottom tabs */}
          <Route path="/app" element={<AppShell />}>
            <Route index element={<AppHome />} />
            <Route path="trends" element={<HealthTrends />} />
            <Route path="records" element={<PatientHealthRecords />} />
            <Route path="appointments" element={<PatientAppointments />} />
            <Route path="story" element={<WhyVyana />} />
            <Route path="profile" element={<PatientProfileEdit />} />
            <Route path="timeline" element={<PatientTimeline />} />
            <Route path="vaccinations" element={<Vaccinations />} />
            <Route path="medications" element={<MedicationReminders />} />
            <Route path="prescription-reader" element={<PrescriptionInterpreter />} />
            <Route path="share" element={<ShareRecords />} />
            <Route path="briefing" element={<PatientBriefing />} />
            <Route path="recovery" element={<ClaimAssistant />} />
          </Route>

          {/* Patient standalone pages */}
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/consultations" element={<ConsultationsList />} />
          <Route path="/patient-medical-history" element={<PatientMedicalHistory />} />
          <Route path="/find-doctors" element={<FindDoctors />} />
          <Route path="/patient-profile-page" element={<PatientProfilePage />} />
          <Route path="/emergency-contacts" element={<EmergencyContacts />} />
          <Route path="/emergency-access/:token" element={<EmergencyAccess />} />

          {/* Doctor */}
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor-appointments" element={<DoctorAppointments />} />
          <Route path="/doctor-profile-setup" element={<DoctorProfileSetup />} />
          <Route path="/patient-view/:patientId" element={<DoctorPatientView />} />
          <Route path="/shared-records" element={<SharedHealthRecords />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
