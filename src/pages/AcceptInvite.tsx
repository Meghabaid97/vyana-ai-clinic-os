import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Check, X, ShieldCheck } from "lucide-react";
import { fetchInviteByToken, acceptInvite, declineInvite, type InvitePreview } from "@/lib/familyInvites";
import { useActivePatient } from "@/contexts/ActivePatientContext";

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useActivePatient();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [emailMismatch, setEmailMismatch] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        setAuthed(!!session);
        const inv = await fetchInviteByToken(token);
        if (cancelled) return;
        setInvite(inv);
        if (session && inv?.invitee_email && session.user.email &&
            inv.invitee_email.toLowerCase() !== session.user.email.toLowerCase()) {
          setEmailMismatch(true);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not load invite");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setBusy("accept");
    try {
      await acceptInvite(token);
      await refresh();
      toast.success("Family access linked. You can now share records.");
      navigate("/app");
    } catch (e) {
      toast.error(e instanceof Error ? e.message.replace(/^invite_/, "Invite ") : "Could not accept");
    } finally {
      setBusy(null);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    setBusy("decline");
    try {
      await declineInvite(token);
      toast.success("Invite declined");
      navigate("/app");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not decline");
    } finally {
      setBusy(null);
    }
  };

  const goSignIn = () => {
    const back = encodeURIComponent(location.pathname);
    navigate(`/auth?next=${back}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="px-5 py-10 text-center">
        <h1 className="text-xl font-bold text-foreground">Invite not found</h1>
        <p className="text-[13px] text-muted-foreground mt-2">This link may have been revoked or already used.</p>
        <Button className="mt-6" onClick={() => navigate("/app")}>Go to app</Button>
      </div>
    );
  }

  const expired = new Date(invite.expires_at) < new Date();
  const inactive = invite.status !== "pending" || expired;

  return (
    <div className="max-w-md mx-auto px-5 py-8 sm:py-12">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl">
          {invite.avatar_emoji}
        </div>
        <h1 className="mt-4 text-[20px] font-bold text-foreground leading-tight">
          {invite.inviter_name} invited you to Vyana
        </h1>
        <p className="mt-1.5 text-[13.5px] text-muted-foreground leading-snug">
          They'd like to help manage your health records as your <span className="text-foreground font-medium">{invite.relationship.toLowerCase()}</span>.
        </p>

        {invite.message && (
          <div className="mt-4 rounded-lg bg-muted/40 p-3 text-left">
            <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">Their note</p>
            <p className="text-[13px] text-foreground/90 mt-0.5 italic">"{invite.message}"</p>
          </div>
        )}

        <div className="mt-5 rounded-lg border border-border p-3 text-left flex gap-2.5">
          <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-[11.5px] text-muted-foreground leading-snug">
            If you accept, {invite.inviter_name.split(" ")[0]} will be able to view, upload, and log entries on your profile. You can remove their access from Settings anytime.
          </p>
        </div>

        {inactive && (
          <div className="mt-4 rounded-lg bg-destructive/10 text-destructive p-3 text-[12.5px] font-medium">
            This invite is no longer active ({expired ? "expired" : invite.status}).
          </div>
        )}

        {!inactive && !authed && (
          <div className="mt-6 space-y-2">
            <p className="text-[12.5px] text-muted-foreground">Sign in to your Vyana account to accept.</p>
            <Button className="w-full" onClick={goSignIn}>Sign in to continue</Button>
          </div>
        )}

        {!inactive && authed && emailMismatch && (
          <div className="mt-5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 p-3 text-[12.5px] text-left">
            This invite was sent to <span className="font-semibold">{invite.invitee_email}</span>. Please sign in with that email to accept.
            <Button variant="outline" className="w-full mt-2" onClick={async () => { await supabase.auth.signOut(); goSignIn(); }}>
              Switch account
            </Button>
          </div>
        )}

        {!inactive && authed && !emailMismatch && (
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleDecline} disabled={!!busy}>
              {busy === "decline" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4 mr-1.5" /> Decline</>}
            </Button>
            <Button onClick={handleAccept} disabled={!!busy}>
              {busy === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1.5" /> Accept</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
