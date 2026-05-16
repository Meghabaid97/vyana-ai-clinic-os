import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Mail, Send, UserPlus, Check, Trash2, Loader2, X } from "lucide-react";
import { useActivePatient } from "@/contexts/ActivePatientContext";
import {
  createFamilyInvite,
  inviteLink,
  listMySentInvites,
  revokeInvite,
  listGrantsOnMyProfiles,
  revokeGrant,
  type FamilyInviteRow,
} from "@/lib/familyInvites";

const RELATIONSHIPS = [
  { value: "Spouse",  emoji: "💑" },
  { value: "Parent",  emoji: "👴" },
  { value: "Child",   emoji: "🧒" },
  { value: "Sibling", emoji: "🧑" },
  { value: "Other",   emoji: "👤" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Mode = "invite" | "dependent" | "manage";

export default function AddFamilyMemberSheet({ open, onOpenChange }: Props) {
  const { refresh, setActiveById } = useActivePatient();
  const [mode, setMode] = useState<Mode>("invite");

  // Shared
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Parent");

  // Invite mode
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  // Dependent mode
  const [dob, setDob] = useState("");
  const [abha, setAbha] = useState("");

  // Manage mode
  const [sentInvites, setSentInvites] = useState<FamilyInviteRow[]>([]);
  const [grants, setGrants] = useState<Awaited<ReturnType<typeof listGrantsOnMyProfiles>>>([]);
  const [loadingManage, setLoadingManage] = useState(false);

  const resetForm = () => {
    setName(""); setRelationship("Parent");
    setEmail(""); setMessage(""); setCreatedLink(null);
    setDob(""); setAbha("");
  };

  useEffect(() => {
    if (!open) { resetForm(); setMode("invite"); }
  }, [open]);

  useEffect(() => {
    if (mode !== "manage" || !open) return;
    setLoadingManage(true);
    Promise.all([listMySentInvites(), listGrantsOnMyProfiles()])
      .then(([invites, gs]) => { setSentInvites(invites); setGrants(gs); })
      .catch((e) => toast.error(e?.message || "Could not load access"))
      .finally(() => setLoadingManage(false));
  }, [mode, open]);

  // ---------- INVITE ----------
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter their name");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return toast.error("Please enter a valid email");
    }
    setSubmitting(true);
    try {
      const emoji = RELATIONSHIPS.find((r) => r.value === relationship)?.emoji ?? "👤";
      const { token } = await createFamilyInvite({
        invitee_name: name.trim(),
        invitee_email: email.trim(),
        relationship,
        avatar_emoji: emoji,
        message: message.trim() || null,
      });
      const link = inviteLink(token);
      setCreatedLink(link);
      toast.success("Invite created. Share the link with them.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create invite";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy — long-press to select");
    }
  };

  const shareWhatsApp = () => {
    if (!createdLink) return;
    const text = encodeURIComponent(
      `Hi ${name.split(" ")[0]}, I'd like you to join my Vyana family so we can keep your health records together. Open this link to accept (valid 14 days): ${createdLink}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // ---------- DEPENDENT ----------
  const handleAddDependent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter their name");
    if (abha && abha.replace(/\s/g, "").length !== 14) return toast.error("ABHA Health ID must be 14 digits");
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please sign in again"); return; }
      const emoji = RELATIONSHIPS.find((r) => r.value === relationship)?.emoji ?? "👤";
      const { data, error } = await supabase
        .from("patients")
        .insert({
          user_id: session.user.id,
          name: name.trim(),
          relationship,
          avatar_emoji: emoji,
          is_primary: false,
          date_of_birth: dob || null,
          national_health_id: abha ? abha.replace(/\s/g, "") : null,
        })
        .select("id")
        .single();
      if (error) throw error;
      await refresh();
      if (data?.id) setActiveById(data.id);
      toast.success(`${name.split(" ")[0]} added as a dependent`);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not add dependent";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- MANAGE ----------
  const onRevokeInvite = async (id: string) => {
    try {
      await revokeInvite(id);
      setSentInvites((prev) => prev.map((i) => i.id === id ? { ...i, status: "revoked" } : i));
      toast.success("Invite revoked");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not revoke";
      toast.error(msg);
    }
  };

  const onRevokeGrant = async (id: string) => {
    try {
      await revokeGrant(id);
      setGrants((prev) => prev.filter((g) => g.id !== id));
      toast.success("Access removed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not remove access";
      toast.error(msg);
    }
  };

  const tabBtn = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      className={`flex-1 text-[12.5px] font-semibold py-2 rounded-lg transition-colors ${
        mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70 hover:bg-muted/80"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92svh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Family access</SheetTitle>
          <SheetDescription>
            Invite adults to share their records with you, or add a dependent you manage directly.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex gap-1.5 p-1 rounded-xl bg-muted/40">
          {tabBtn("invite", "Invite adult")}
          {tabBtn("dependent", "Add dependent")}
          {tabBtn("manage", "Manage")}
        </div>

        {/* INVITE */}
        {mode === "invite" && !createdLink && (
          <form onSubmit={handleSendInvite} className="mt-5 space-y-4 pb-4">
            <p className="text-[12px] text-muted-foreground leading-snug rounded-lg bg-muted/40 p-2.5">
              They will get their own login. When they accept, they grant you full access to view, upload, and log on their behalf. They can revoke anytime.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="inv-name">Their name</Label>
              <Input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lakshmi Iyer" autoFocus maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-email">Their email</Label>
              <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="lakshmi@example.com" maxLength={320} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-rel">Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger id="inv-rel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className="mr-2">{r.emoji}</span>{r.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-msg">Personal note <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea id="inv-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hey Ma, let's keep your reports in one place." rows={2} maxLength={300} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" /> Create invite</>}
              </Button>
            </div>
          </form>
        )}

        {mode === "invite" && createdLink && (
          <div className="mt-5 space-y-4 pb-4">
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold text-foreground">Invite ready for {name.split(" ")[0]}</p>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">Link is valid for 14 days. Share it any way you like.</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10.5px] uppercase tracking-wider text-muted-foreground font-semibold">Invite link</p>
              <p className="text-[12px] text-foreground/90 mt-1 break-all leading-snug">{createdLink}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={copyLink}><Copy className="h-4 w-4 mr-1.5" /> Copy</Button>
              <Button onClick={shareWhatsApp}><Mail className="h-4 w-4 mr-1.5" /> WhatsApp</Button>
            </div>
            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        )}

        {/* DEPENDENT */}
        {mode === "dependent" && (
          <form onSubmit={handleAddDependent} className="mt-5 space-y-4 pb-4">
            <p className="text-[12px] text-muted-foreground leading-snug rounded-lg bg-muted/40 p-2.5">
              For people who can't log in themselves (a young child, an elderly parent without a phone). You manage everything from your account.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="dep-name">Full name</Label>
              <Input id="dep-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aarav Iyer" autoFocus maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dep-rel">Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger id="dep-rel"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      <span className="mr-2">{r.emoji}</span>{r.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dep-dob">Date of birth <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input id="dep-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dep-abha">ABHA Health ID <span className="text-muted-foreground font-normal">(optional, 14 digits)</span></Label>
              <Input id="dep-abha" inputMode="numeric" value={abha} onChange={(e) => setAbha(e.target.value.replace(/[^0-9]/g, "").slice(0, 14))} placeholder="14-digit ABHA ID" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4 mr-1" /> Add dependent</>}
              </Button>
            </div>
          </form>
        )}

        {/* MANAGE */}
        {mode === "manage" && (
          <div className="mt-5 space-y-5 pb-4">
            {loadingManage && <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}

            {!loadingManage && (
              <>
                <section>
                  <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Invites you sent</h3>
                  {sentInvites.length === 0 ? (
                    <p className="text-[12.5px] text-muted-foreground">No invites yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {sentInvites.map((i) => (
                        <div key={i.id} className="rounded-lg border border-border p-2.5 flex items-center gap-2">
                          <span className="text-lg">{i.avatar_emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-foreground truncate">{i.invitee_name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {i.invitee_email || i.invitee_phone} · {i.relationship} · <span className="capitalize">{i.status}</span>
                            </p>
                          </div>
                          {i.status === "pending" && (
                            <>
                              <button
                                onClick={async () => {
                                  try { await navigator.clipboard.writeText(inviteLink(i.token)); toast.success("Link copied"); }
                                  catch { toast.error("Could not copy"); }
                                }}
                                className="p-1.5 text-muted-foreground hover:text-foreground"
                                aria-label="Copy link"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => onRevokeInvite(i.id)} className="p-1.5 text-muted-foreground hover:text-destructive" aria-label="Revoke">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Who can access your profiles</h3>
                  {grants.length === 0 ? (
                    <p className="text-[12.5px] text-muted-foreground">Nobody has access to your profiles yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {grants.map((g) => (
                        <div key={g.id} className="rounded-lg border border-border p-2.5 flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-foreground truncate">{g.patient_name}</p>
                            <p className="text-[11px] text-muted-foreground">Shared with a family member · {g.permission}</p>
                          </div>
                          <button onClick={() => onRevokeGrant(g.id)} className="p-1.5 text-muted-foreground hover:text-destructive" aria-label="Remove access">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
