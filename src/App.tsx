import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { initShareIntent } from "@/lib/shareIntent";
import NativeBootGuard from "@/components/NativeBootGuard";
import ChunkErrorBoundary from "@/components/ChunkErrorBoundary";

// Eager: minimal route shell only
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AppShell = lazy(() => import("./components/AppShell"));
const AppHome = lazy(() => import("./pages/AppHome"));

// Lazy: everything else (loaded on demand → smaller initial bundle, faster start)
const Splash = lazy(() => import("./pages/Splash"));
const WhyVyana = lazy(() => import("./pages/WhyVyana"));
const RequestAccess = lazy(() => import("./pages/RequestAccess"));
const AccessPending = lazy(() => import("./pages/AccessPending"));
const AdminWaitlist = lazy(() => import("./pages/AdminWaitlist"));
const ShareReceive = lazy(() => import("./pages/ShareReceive"));
const HealthTrends = lazy(() => import("./pages/HealthTrends"));

const PatientHealthRecords = lazy(() => import("./pages/PatientHealthRecords"));
const PatientProfileEdit = lazy(() => import("./pages/PatientProfileEdit"));
const PatientBriefing = lazy(() => import("./pages/PatientBriefing"));
const DoctorVisitMode = lazy(() => import("./pages/DoctorVisitMode"));

const EmergencyContacts = lazy(() => import("./pages/EmergencyContacts"));
const EmergencyAccess = lazy(() => import("./pages/EmergencyAccess"));
const PatientTimeline = lazy(() => import("./pages/PatientTimeline"));
const Vaccinations = lazy(() => import("./pages/Vaccinations"));
const MedicationReminders = lazy(() => import("./pages/MedicationReminders"));
const PrescriptionInterpreter = lazy(() => import("./pages/PrescriptionInterpreter"));
const ShareRecords = lazy(() => import("./pages/ShareRecords"));
const ClaimAssistant = lazy(() => import("./pages/RecoveryHub"));
const Legal = lazy(() => import("./pages/Legal"));
const Support = lazy(() => import("./pages/Support"));
const DomainChecklist = lazy(() => import("./pages/DomainChecklist"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LayoutQA = lazy(() => import("./pages/LayoutQA"));
const SymptomJournal = lazy(() => import("./pages/SymptomJournal"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));

const queryClient = new QueryClient();

const ShareIntentBridge = () => {
  const navigate = useNavigate();
  useEffect(() => {
    void initShareIntent((path) => navigate(path));
  }, [navigate]);
  return null;
};

const RouteFallback = () => (
  <div className="min-h-[40vh] w-full flex items-center justify-center">
    <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <NativeBootGuard />
        <ShareIntentBridge />
        <ChunkErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/splash" element={<Splash />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/request-access" element={<RequestAccess />} />
            <Route path="/access-pending" element={<AccessPending />} />
            <Route path="/admin/waitlist" element={<AdminWaitlist />} />
            <Route path="/why-vyana" element={<WhyVyana />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/layout-qa" element={<LayoutQA />} />

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
              <Route path="briefing" element={<DoctorVisitMode />} />
              <Route path="visit" element={<DoctorVisitMode />} />
              <Route path="recovery" element={<ClaimAssistant />} />
              <Route path="support" element={<Support />} />
              <Route path="domain-checklist" element={<DomainChecklist />} />
              <Route path="journal" element={<SymptomJournal />} />
              <Route path="emergency-contacts" element={<EmergencyContacts />} />
              <Route path="share-receive" element={<ShareReceive />} />
            </Route>

            {/* Patient standalone pages */}
            <Route path="/emergency-access/:token" element={<EmergencyAccess />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </ChunkErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
