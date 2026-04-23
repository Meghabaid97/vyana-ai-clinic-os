import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Link2, Copy, Clock, CheckCircle, Plus, Loader2, Share2, QrCode, Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { buildEmergencyAccessUrl } from "@/lib/customerUrls";

interface ShareLink {
  id: string;
  token: string;
  expires_at: string;
  is_used: boolean;
  recipient_name: string | null;
  recipient_email: string | null;
  created_at: string;
}

const ShareRecords = () => {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadLinks(); }, []);

  const loadLinks = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data: patient } = await supabase
      .from("patients").select("id").eq("user_id", session.user.id).maybeSingle();
    if (!patient) { setLoading(false); return; }
    setPatientId(patient.id);

    const { data } = await supabase
      .from("shared_record_links")
      .select("*")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false }) as { data: ShareLink[] | null };

    setLinks(data || []);
    setLoading(false);
  };

  const createLink = async () => {
    if (!patientId) return;
    setCreating(true);
    const { data, error } = await supabase.from("shared_record_links").insert({
      patient_id: patientId,
      recipient_name: recipientName.trim() || null,
    }).select().single() as { data: ShareLink | null; error: any };

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      const shareUrl = buildEmergencyAccessUrl(data.token);
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link created & copied!", description: "Share this link with your doctor. Expires in 24 hours." });
      setShowCreate(false);
      setRecipientName("");
      await loadLinks();
    }
    setCreating(false);
  };

  const copyLink = async (token: string) => {
    const url = buildEmergencyAccessUrl(token);
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: "Share this with your doctor." });
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <section className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-[-0.03em] text-foreground">
              Share Records
            </h1>
            <p className="text-[14px] text-muted-foreground leading-relaxed mt-2">
              Create secure, time-limited links to share your records with any doctor.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreate(true)}
            className="bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-1" /> New Link
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 pb-5">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="text-[14px] font-bold text-foreground mb-2">How it works</h2>
          <div className="space-y-2">
            {[
              { icon: Link2, text: "Create a secure link, valid for 24 hours" },
              { icon: Share2, text: "Share it with your doctor via WhatsApp, email, or in person" },
              { icon: CheckCircle, text: "Doctor opens the link and sees your records, no app needed" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <step.icon className="h-4 w-4 text-primary shrink-0" />
                <span className="text-[12px] text-foreground">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {links.length === 0 ? (
        <section className="px-5 pb-8">
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-1">No shared links yet</h2>
            <p className="text-sm text-muted-foreground mb-4">Create a link to share your health records securely.</p>
            <Button onClick={() => setShowCreate(true)} variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Create share link
            </Button>
          </div>
        </section>
      ) : (
        <section className="px-5 pb-8 space-y-2">
          {links.map((link) => {
            const expired = isExpired(link.expires_at);
            return (
              <div key={link.id} className={`rounded-xl border bg-card p-4 ${expired ? "border-border opacity-60" : "border-primary/20"}`}>
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${expired ? "bg-muted" : "bg-primary/10"}`}>
                    <Link2 className={`h-5 w-5 ${expired ? "text-muted-foreground" : "text-primary"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-foreground">
                        {link.recipient_name || "Share Link"}
                      </p>
                      {expired ? (
                        <Badge variant="outline" className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">Expired</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] bg-green-500/10 text-green-700 border-green-500/20">Active</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        Expires {new Date(link.expires_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  {!expired && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyLink(link.token)}
                      className="shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Create Share Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground">Doctor's Name (optional)</label>
              <Input
                placeholder="e.g. Dr. Sharma"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                This helps you track who you shared with. The link expires in 24 hours.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createLink} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Link2 className="h-4 w-4 mr-1" />}
              Create & Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShareRecords;
