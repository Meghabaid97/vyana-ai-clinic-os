import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Check, X, ShieldCheck, AlertTriangle, Clock, Link2Off, Ban } from "lucide-react";
import { fetchInviteByToken, acceptInvite, declineInvite, type InvitePreview } from "@/lib/familyInvites";
import { useActivePatient } from "@/contexts/ActivePatientContext";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ErrorKind = "invalid" | "not_found" | "expired" | "revoked" | "accepted" | "declined" | "load_failed";

const ERROR_COPY: Record<ErrorKind, { icon: typeof AlertTriangle; title: string; body: string }> = {
  invalid:     { icon: Link2Off,      title: "This invite link looks broken",   body: "The link you opened isn't a valid Vyana invite. Please double-check the link your family member sent you." },
  not_found:   { icon: Link2Off,      title: "Invite not found",                 body: "We couldn't find this invite. It may have been removed, or the link was mistyped." },
  expired:     { icon: Clock,         title: "This invite has expired",          body: "Vyana invites are valid for 14 days. Ask your family member to send a fresh invite." },
  revoked:     { icon: Ban,           title: "This invite was cancelled",        body: "The person who invited you withdrew this invite. Ask them to send a new one if you'd still like to connect." },
  accepted:    { icon: Check,         title: "Already accepted",                 body: "This invite has already been accepted. You should see the shared profile in your family switcher." },
  declined:    { icon: X,             title: "Already declined",                 body: "This invite was declined earlier. Ask your family member to send a new one if that was a mistake." },
  load_failed: { icon: AlertTriangle, title: "Something went wrong",             body: "We couldn't load this invite right now. Please check your connection and try again." },
};

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useActivePatient();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [emailMismatch, setEmailMismatch] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token || !UUID_RE.test(token)) {
        setErrorKind("invalid");
        setLoading(false);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        setAuthed(!!session);
        const inv = await fetchInviteByToken(token);
        if (cancelled) return;
        if (!inv) {
          setErrorKind("not_found");
        } else {
          setInvite(inv);
          const expired = new Date(inv.expires_at) < new Date();
          if (expired) setErrorKind("expired");
          else if (inv.status === "revoked") setErrorKind("revoked");
          else if (inv.status === "expired") setErrorKind("expired");
          else if (inv.status === "accepted") setErrorKind("accepted");
          else if (inv.status === "declined") setErrorKind("declined");
          else if (session && inv.invitee_email && session.user.email &&
              inv.invitee_email.toLowerCase() !== session.user.email.toLowerCase()) {
            setEmailMismatch(true);
          }
        }
      } catch {
        if (!cancelled) setErrorKind("load_failed");
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
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("invite_expired")) setErrorKind("expired");
      else if (msg.includes("invite_revoked")) setErrorKind("revoked");
      else if (msg.includes("invite_accepted")) setErrorKind("accepted");
      else if (msg.includes("invite_declined")) setErrorKind("declined");
      else if (msg.includes("invite_not_found")) setErrorKind("not_found");
      else toast.error(msg ? msg.replace(/^invite_/, "Invite ") : "Could not accept");
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

  if (errorKind) {
    const { icon: Icon, title, body } = ERROR_COPY[errorKind];
    const canRetry = errorKind === "load_failed";
    return (
      <div className="max-w-md mx-auto px-5 py-10 sm:py-14">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="mt-4 text-[20px] font-bold text-foreground leading-tight">{title}</h1>
          <p className="mt-2 text-[13.5px] text-muted-foreground leading-snug">{body}</p>
          <div className="mt-6 grid gap-2">
            {canRetry && (
              <Button onClick={() => window.location.reload()}>Try again</Button>
            )}
            <Button variant={canRetry ? "outline" : "default"} onClick={() => navigate("/app")}>
              Go to Vyana
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!invite) return null;

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

        {!authed && (
          <div className="mt-6 space-y-2">
            <p className="text-[12.5px] text-muted-foreground">Sign in to your Vyana account to accept.</p>
            <Button className="w-full" onClick={goSignIn}>Sign in to continue</Button>
          </div>
        )}

        {authed && emailMismatch && (
          <div className="mt-5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 p-3 text-[12.5px] text-left">
            This invite was sent to <span className="font-semibold">{invite.invitee_email}</span>. Please sign in with that email to accept.
            <Button variant="outline" className="w-full mt-2" onClick={async () => { await supabase.auth.signOut(); goSignIn(); }}>
              Switch account
            </Button>
          </div>
        )}

        {authed && !emailMismatch && (
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
