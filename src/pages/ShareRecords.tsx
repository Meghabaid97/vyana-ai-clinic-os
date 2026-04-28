import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import {
  Link2, Copy, Clock, CheckCircle, Plus, Loader2, Share2, QrCode, MessageCircle, Mail,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import ShareCeremonySheet from "@/components/ShareCeremonySheet";
import { buildEmergencyAccessUrl } from "@/lib/share-url";

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
  const [qrLink, setQrLink] = useState<{ url: string; dataUrl: string; recipient: string } | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

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

  const createLink = async (recipientName: string): Promise<string | null> => {
    if (!patientId) return null;
    const { data, error } = await supabase.from("shared_record_links").insert({
      patient_id: patientId,
      recipient_name: recipientName || null,
    }).select().single() as { data: ShareLink | null; error: any };

    if (error) {
      toast({ title: t("share.error"), description: error.message, variant: "destructive" });
      return null;
    }
    if (!data) return null;
    return buildEmergencyAccessUrl(data.token);
  };

  const copyLink = async (token: string) => {
    await navigator.clipboard.writeText(buildEmergencyAccessUrl(token));
    toast({ title: t("share.copied"), description: t("share.copiedDesc") });
  };

  const shareMessage = (token: string) =>
    `Here are my health records (secure link, valid 24 hours): ${buildEmergencyAccessUrl(token)}`;

  const shareWhatsApp = (token: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage(token))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareEmail = (token: string, recipient: string | null) => {
    const subject = encodeURIComponent("My health records from Vyana");
    const body = encodeURIComponent(shareMessage(token));
    window.location.href = `mailto:${recipient ?? ""}?subject=${subject}&body=${body}`;
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
              {t("share.title")}
            </h1>
            <p className="text-[14px] text-muted-foreground leading-relaxed mt-2">
              {t("share.subtitle")}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreate(true)}
            className="bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-1" /> {t("share.newLink")}
          </Button>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 pb-5">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="text-[14px] font-bold text-foreground mb-2">{t("share.how")}</h2>
          <div className="space-y-2">
            {[
              { icon: Link2, text: t("share.step1") },
              { icon: Share2, text: t("share.step2") },
              { icon: CheckCircle, text: t("share.step3") },
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
            <h2 className="text-lg font-semibold text-foreground mb-1">{t("share.empty.title")}</h2>
            <p className="text-sm text-muted-foreground mb-4">{t("share.empty.desc")}</p>
            <Button onClick={() => setShowCreate(true)} variant="outline">
              <Plus className="h-4 w-4 mr-1" /> {t("share.empty.cta")}
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
                        {link.recipient_name || t("share.linkLabel")}
                      </p>
                      {expired ? (
                        <Badge variant="outline" className="text-[9px] bg-destructive/10 text-destructive border-destructive/20">{t("share.expired")}</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] bg-green-500/10 text-green-700 border-green-500/20">{t("share.active")}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        {t("share.expiresOn", { when: new Date(link.expires_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) })}
                      </span>
                    </div>
                  </div>
                  {!expired && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => shareWhatsApp(link.token)}
                        aria-label="Share via WhatsApp"
                        className="h-8 w-8"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => shareEmail(link.token, link.recipient_email)}
                        aria-label="Share via email"
                        className="h-8 w-8"
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => showQr(link.token, link.recipient_name)}
                        aria-label="Show QR code"
                        className="h-8 w-8"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyLink(link.token)}
                        className="h-8"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" /> {t("share.copy")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Ceremony sheet */}
      <ShareCeremonySheet
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreate={createLink}
        onComplete={loadLinks}
      />
    </div>
  );
};

export default ShareRecords;
