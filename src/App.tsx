import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Consultation from "./pages/Consultation";
import ConsultationsList from "./pages/ConsultationsList";
import PatientProfile from "./pages/PatientProfile";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorAppointments from "./pages/DoctorAppointments";
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
          <Route path="/patient/:healthId" element={<PatientProfile />} />
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
          <Route path="/doctor-appointments" element={<DoctorAppointments />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
