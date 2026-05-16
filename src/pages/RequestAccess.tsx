import { useState } from "react";
import { Link } from "react-router-dom";
import { useViewTransitionNavigate } from "@/hooks/use-view-transition-navigate";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/use-page-meta";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.string().trim().email("Invalid email").max(320),
  role: z.string().min(1, "Please select one"),
  city: z.string().trim().max(200).optional(),
  reason: z.string().trim().max(1000).optional(),
});

const RequestAccess = () => {
  const navigate = useViewTransitionNavigate();
  usePageMeta({
    title: "Request early access — Vyana",
    description:
      "Vyana is in invite-only beta. Tell us a little about yourself and we'll send a private invite when your slot opens.",
    path: "/request-access",
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [city, setCity] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ name, email, role, city, reason });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("access_requests").insert({
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
        city: parsed.data.city || null,
        reason: parsed.data.reason || null,
      });
      if (error) throw error;

      // Fire-and-forget admin notification (works once email infra is live)
      supabase.functions
        .invoke("send-transactional-email", {
          body: {
            templateName: "admin-new-access-request",
            recipientEmail: "mbaid@wharton.upenn.edu",
            idempotencyKey: `access-req-${parsed.data.email}-${Date.now()}`,
            templateData: {
              name: parsed.data.name,
              email: parsed.data.email,
              role: parsed.data.role,
              city: parsed.data.city || "",
              reason: parsed.data.reason || "",
            },
          },
        })
        .catch(() => {
          /* silent — admin can still see in /admin/waitlist */
        });

      setDone(true);
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-6">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
          <h1 className="font-serif text-3xl text-foreground">Request received</h1>
          <p className="text-muted-foreground leading-relaxed">
            Thank you. Megha personally reviews each request. If approved,
            you'll receive an email with a sign-up link within a few days.
          </p>
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16 px-6">
      <div className="max-w-[560px] mx-auto">
        <Link to="/" className="vt-wordmark font-display text-2xl text-foreground inline-block mb-12">
          V<span className="text-primary italic">yana</span>
        </Link>

          <h1 className="font-serif text-4xl sm:text-5xl leading-[1.05] tracking-[-0.02em] text-foreground">
          Get early access to <em className="italic text-primary font-normal">Vyana</em>
        </h1>
        <p className="mt-6 text-[15px] text-muted-foreground leading-relaxed">
          Vyana is invite-only while we work closely with our first families.
          Tell us a little about you and we'll be in touch soon.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={320} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">I am a…</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role"><SelectValue placeholder="Select one" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Patient managing my own health</SelectItem>
                <SelectItem value="caregiver">Caregiver (parent, family member)</SelectItem>
                <SelectItem value="doctor">Doctor / clinician</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Why do you want Vyana?</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="One line is enough."
            />
          </div>

          <Button type="submit" disabled={submitting} className="vt-cta-pill group w-full h-11 rounded-full mt-2">
            {submitting ? "Sending…" : "Get early access"}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>

          <p className="text-xs text-muted-foreground text-center pt-4">
            Already have access?{" "}
            <Link to="/auth" className="text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RequestAccess;
