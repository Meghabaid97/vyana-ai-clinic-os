import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Consultation from "./pages/Consultation";
import ConsultationsList from "./pages/ConsultationsList";
import DoctorPatientView from "./pages/DoctorPatientView";
import PatientDashboard from "./pages/PatientDashboard";
import PatientProfileEdit from "./pages/PatientProfileEdit";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorAppointments from "./pages/DoctorAppointments";
import SharedHealthRecords from "./pages/SharedHealthRecords";
import DoctorProfileSetup from "./pages/DoctorProfileSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/consultations" element={<ConsultationsList />} />
          <Route path="/patient/:healthId" element={<DoctorPatientView />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/patient-profile" element={<PatientProfileEdit />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor-appointments" element={<DoctorAppointments />} />
          <Route path="/shared-records" element={<SharedHealthRecords />} />
          <Route path="/doctor-profile-setup" element={<DoctorProfileSetup />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
