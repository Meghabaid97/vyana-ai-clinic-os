import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, MessageCircle, Clock, CheckCircle2, Trash2 } from "lucide-react";

interface Ticket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: string;
  created_at: string;
  expires_at: string;
}

const CATEGORIES = [
  { value: "general", label: "General question" },
  { value: "bug", label: "Something is broken" },
  { value: "feature", label: "Feature request" },
  { value: "data", label: "Wrong data / records issue" },
  { value: "billing", label: "Billing or account" },
  { value: "other", label: "Other" },
];

const Support = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [form, setForm] = useState({ subject: "", category: "general", message: "" });

  const load = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subject = form.subject.trim();
    const message = form.message.trim();
    if (!subject || !message) {
      toast({ title: "Please fill in both fields", variant: "destructive" });
      return;
    }
    if (subject.length > 200 || message.length > 5000) {
      toast({ title: "Too long", description: "Keep subject under 200 and message under 5000 characters.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSubmitting(false); return; }
    const { error } = await supabase.from("support_tickets").insert({
      user_id: session.user.id,
      subject, message, category: form.category,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ticket raised", description: "We will review and get back within 48 hours." });
    setForm({ subject: "", category: "general", message: "" });
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("support_tickets").delete().eq("id", id);
    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
      return;
    }
    setTickets(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="animate-fade-in pb-8">
      <section className="px-5 pt-6">
        <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Raise a ticket and we will get back to you. Tickets are kept for 30 days.
        </p>
      </section>

      <section className="px-5 pt-6">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs text-muted-foreground">Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger id="category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs text-muted-foreground">Subject</Label>
            <Input
              id="subject" value={form.subject} maxLength={200}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Short summary of the issue"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message" className="text-xs text-muted-foreground">Describe your issue</Label>
            <Textarea
              id="message" value={form.message} maxLength={5000} rows={5}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us what happened, what you expected, and any steps to reproduce."
              required
            />
            <p className="text-[10px] text-muted-foreground text-right">{form.message.length}/5000</p>
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Submit ticket
          </Button>
        </form>
      </section>

      <section className="px-5 pt-8">
        <h2 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">Your tickets</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-border">
            <MessageCircle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No tickets yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => {
              const daysLeft = Math.max(0, Math.ceil((new Date(t.expires_at).getTime() - Date.now()) / 86400000));
              return (
                <div key={t.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{t.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{t.category}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      t.status === "resolved"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {t.status === "resolved" ? <CheckCircle2 className="h-3 w-3 inline mr-0.5" /> : <Clock className="h-3 w-3 inline mr-0.5" />}
                      {t.status}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{t.message}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}Expires in {daysLeft}d
                    </p>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-[11px] text-destructive hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Support;
