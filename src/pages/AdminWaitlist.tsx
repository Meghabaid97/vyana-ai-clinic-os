import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Copy, Loader2 } from "lucide-react";

type Req = {
  id: string;
  name: string;
  email: string;
  role: string;
  city: string | null;
  reason: string | null;
  status: "pending" | "approved" | "denied";
  invite_token: string | null;
  token_expires_at: string | null;
  token_used_at: string | null;
  created_at: string;
};

const AdminWaitlist = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [requests, setRequests] = useState<Req[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      const isAdmin = (roles || []).some((r) => r.role === "admin");
      if (!isAdmin) {
        toast.error("Admin access required");
        navigate("/", { replace: true });
        return;
      }
      setAuthorized(true);
      await load();
      setLoading(false);
    };
    init();
  }, [navigate]);

  const load = async () => {
    const { data, error } = await supabase
      .from("access_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setRequests((data || []) as Req[]);
  };

  const approve = async (req: Req) => {
    setBusyId(req.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("access_requests")
        .update({
          status: "approved",
          invite_token: token,
          token_expires_at: expires,
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq("id", req.id);
      if (error) throw error;

      const inviteUrl = `https://vyana.care/auth?token=${token}`;

      // Send approval email (works once email infra is live)
      supabase.functions
        .invoke("send-transactional-email", {
          body: {
            templateName: "applicant-approved",
            recipientEmail: req.email,
            idempotencyKey: `approve-${req.id}`,
            templateData: { name: req.name, inviteUrl },
          },
        })
        .catch(() => {
          /* silent — admin can copy link manually */
        });

      toast.success(`Approved. Invite link copied for ${req.name}.`);
      try { await navigator.clipboard.writeText(inviteUrl); } catch {}
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve");
    } finally {
      setBusyId(null);
    }
  };

  const deny = async (req: Req) => {
    setBusyId(req.id);
    try {
      const { error } = await supabase
        .from("access_requests")
        .update({ status: "denied" })
        .eq("id", req.id);
      if (error) throw error;
      toast.success("Denied (silent)");
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Failed");
    } finally {
      setBusyId(null);
    }
  };

  const copyInvite = async (token: string) => {
    const url = `https://vyana.care/auth?token=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const denied = requests.filter((r) => r.status === "denied");

  const renderList = (list: Req[]) => {
    if (list.length === 0) {
      return <p className="text-sm text-muted-foreground py-8 text-center">No requests here.</p>;
    }
    return (
      <div className="space-y-3">
        {list.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[260px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-foreground">{r.name}</h3>
                  <Badge variant="outline" className="text-xs">{r.role}</Badge>
                  {r.city && <span className="text-xs text-muted-foreground">· {r.city}</span>}
                </div>
                <a href={`mailto:${r.email}`} className="text-sm text-primary hover:underline">{r.email}</a>
                {r.reason && (
                  <p className="text-sm text-muted-foreground mt-2 italic">"{r.reason}"</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Submitted {new Date(r.created_at).toLocaleString()}
                  {r.token_used_at && <> · Signed up {new Date(r.token_used_at).toLocaleDateString()}</>}
                </p>
              </div>
              <div className="flex gap-2">
                {r.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => approve(r)} disabled={busyId === r.id}>
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deny(r)} disabled={busyId === r.id}>
                      <X className="h-4 w-4" /> Deny
                    </Button>
                  </>
                )}
                {r.status === "approved" && r.invite_token && !r.token_used_at && (
                  <Button size="sm" variant="outline" onClick={() => copyInvite(r.invite_token!)}>
                    <Copy className="h-4 w-4" /> Copy invite
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl text-foreground">Waitlist</h1>
            <p className="text-sm text-muted-foreground">Approve or deny access requests.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/app")}>Back to app</Button>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="denied">Denied ({denied.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-6">{renderList(pending)}</TabsContent>
          <TabsContent value="approved" className="mt-6">{renderList(approved)}</TabsContent>
          <TabsContent value="denied" className="mt-6">{renderList(denied)}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminWaitlist;
