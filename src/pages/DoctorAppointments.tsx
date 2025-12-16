import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DoctorHeader from "@/components/DoctorHeader";
import {
  Loader2,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle,
  XCircle,
  FileText,
  Filter,
  CalendarCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Appointment {
  id: string;
  patient_id: string;
  requested_date: string;
  requested_time_slot: string;
  reason: string | null;
  status: string;
  doctor_notes: string | null;
  patient_phone: string;
  created_at: string;
  patients?: {
    name: string;
    age: number | null;
    national_health_id: string | null;
  };
}

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  const loadAppointments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      let query = supabase
        .from("appointments")
        .select(`
          *,
          patients (
            name,
            age,
            national_health_id
          )
        `)
        .eq("doctor_id", session.user.id)
        .order("requested_date", { ascending: true });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      console.error("Error loading appointments:", error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (status: "approved" | "rejected") => {
    if (!selectedAppointment) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status,
          doctor_notes: doctorNotes || null,
        })
        .eq("id", selectedAppointment.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Appointment ${status}`,
      });

      setSelectedAppointment(null);
      setDoctorNotes("");
      loadAppointments();
    } catch (error: any) {
      console.error("Error updating appointment:", error);
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      rejected: { variant: "destructive", label: "Rejected" },
      completed: { variant: "outline", label: "Completed" },
      cancelled: { variant: "outline", label: "Cancelled" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-500/5">
      <DoctorHeader
        title="Appointment Requests"
        subtitle="Manage patient appointment requests"
        icon={<CalendarCheck className="h-5 w-5 text-primary-foreground" />}
        actions={
          pendingCount > 0 ? (
            <Badge className="bg-orange-500 text-white border-0 shadow-lg">
              {pendingCount} pending
            </Badge>
          ) : null
        }
      />

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Filter */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-card/50 border border-border/50">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Appointments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {appointments.length === 0 ? (
          <Card className="p-12 text-center bg-gradient-to-br from-muted/30 to-muted/10">
            <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center mb-4">
              <Calendar className="h-10 w-10 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No appointments</h3>
            <p className="text-muted-foreground">
              {statusFilter === "pending"
                ? "No pending appointment requests"
                : "No appointments found"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="p-5 hover:shadow-lg transition-all border-border/50 hover:border-orange-500/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                        <User className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {appointment.patients?.name || "Unknown Patient"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {appointment.patients?.age ? `${appointment.patients.age} years` : ""} 
                          {appointment.patients?.national_health_id && ` • ID: ${appointment.patients.national_health_id}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{formatDate(appointment.requested_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{appointment.requested_time_slot}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{appointment.patient_phone}</span>
                      </div>
                    </div>

                    {appointment.reason && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{appointment.reason}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {getStatusBadge(appointment.status)}
                    {appointment.status === "pending" && (
                      <Button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setDoctorNotes("");
                        }}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg"
                      >
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Appointment Request</DialogTitle>
            <DialogDescription>
              Approve or reject this appointment request
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">{selectedAppointment.patients?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedAppointment.requested_date)} at {selectedAppointment.requested_time_slot}
                </p>
                {selectedAppointment.reason && (
                  <p className="text-sm">Reason: {selectedAppointment.reason}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Add notes for the patient..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => updateAppointmentStatus("rejected")}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
              Reject
            </Button>
            <Button
              onClick={() => updateAppointmentStatus("approved")}
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorAppointments;
