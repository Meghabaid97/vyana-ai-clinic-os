import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PatientHeader from "@/components/PatientHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import {
  AlertTriangle, Copy, Loader2, Plus, Shield, Trash2, UserPlus,
  Heart, Clock, ExternalLink, Users, Share2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

interface EmergencyContact {
  id: string;
  patient_id: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  relationship: string;
  is_active: boolean;
  access_token: string;
  created_at: string;
}

interface AccessLog {
  id: string;
  emergency_contact_id: string;
  accessed_at: string;
  ip_address: string | null;
}

const RELATIONSHIPS = [
  "Spouse", "Parent", "Child", "Sibling", "Grandparent",
  "Grandchild", "Friend", "Caregiver", "Other",
];

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState("Patient");
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newContact, setNewContact] = useState({
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    relationship: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setHasSession(false); setIsLoading(false); return; }
      setHasSession(true);

      const { data: patient } = await supabase
        .from("patients")
        .select("id, name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!patient) { setPatientId(null); setIsLoading(false); return; }
      setPatientId(patient.id);
      setPatientName(patient.name);

      const { data: contactsData } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false });

      setContacts((contactsData as EmergencyContact[]) || []);

      const { data: logsData } = await supabase
        .from("emergency_access_logs")
        .select("*")
        .eq("patient_id", patient.id)
        .order("accessed_at", { ascending: false })
        .limit(20);

      setAccessLogs((logsData as AccessLog[]) || []);
    } catch (error) {
      console.error("Error loading emergency contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addContact = async () => {
    if (!patientId || !newContact.contact_name || !newContact.contact_phone || !newContact.relationship) {
      toast({ title: "Missing fields", description: "Name, phone and relationship are required.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from("emergency_contacts").insert({
        patient_id: patientId,
        contact_name: newContact.contact_name,
        contact_phone: newContact.contact_phone,
        contact_email: newContact.contact_email || null,
        relationship: newContact.relationship,
      });
      if (error) throw error;
      toast({ title: "Contact added", description: `${newContact.contact_name} can now access your records in an emergency.` });
      setNewContact({ contact_name: "", contact_phone: "", contact_email: "", relationship: "" });
      setShowAddDialog(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleContact = async (contact: EmergencyContact) => {
    try {
      const { error } = await supabase
        .from("emergency_contacts")
        .update({ is_active: !contact.is_active })
        .eq("id", contact.id);
      if (error) throw error;
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, is_active: !c.is_active } : c));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const regenerateAccessLink = async (contact: EmergencyContact) => {
    try {
      const nextToken = crypto.randomUUID();
      const { error } = await supabase
        .from("emergency_contacts")
        .update({ access_token: nextToken })
        .eq("id", contact.id);
      if (error) throw error;
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, access_token: nextToken } : c));
      await navigator.clipboard.writeText(buildAccessLink(nextToken));
      toast({ title: "New link copied", description: "The old emergency link no longer works." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
      if (error) throw error;
      setContacts(prev => prev.filter(c => c.id !== id));
      toast({ title: "Contact removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const buildAccessLink = (token: string) =>
    `${window.location.origin}/emergency-access/${token}`;

  const copyAccessLink = (token: string) => {
    navigator.clipboard.writeText(buildAccessLink(token));
    toast({ title: "Link copied", description: "Share this link with your emergency contact." });
  };

  const shareViaWhatsApp = (contact: EmergencyContact) => {
    const link = buildAccessLink(contact.access_token);
    const message =
      `🚨 Emergency Health Access\n\n` +
      `${contact.contact_name}, you have been added as my emergency contact on Vyana.\n\n` +
      `In case of an emergency, open this link to view my health records (medications, conditions, allergies, recent visits):\n${link}\n\n` +
      `Please save this message. The link works 24/7 and does not need an account.\n\n` +
      `- ${patientName}`;
    // If the contact has a phone number, prefill the recipient (E.164: strip non-digits, keep leading +)
    const cleanedPhone = contact.contact_phone.replace(/[^\d+]/g, "").replace(/^\++/, "+");
    const target = cleanedPhone.startsWith("+") ? cleanedPhone.slice(1) : cleanedPhone;
    const url = target
      ? `https://wa.me/${target}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-xl font-semibold">Sign in to manage emergency contacts</h2>
            <p className="text-sm text-muted-foreground">
              You need an account so we can securely link contacts to your records.
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full">Sign in</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!patientId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Heart className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-xl font-semibold">Finish your profile first</h2>
            <p className="text-sm text-muted-foreground">
              We need your basic profile before adding emergency contacts. It only takes a minute.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/app/profile/edit")} className="w-full">Complete profile</Button>
              <Button variant="outline" onClick={() => navigate("/app")} className="w-full">Back to home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="px-5 pt-3 pb-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Emergency Access</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Family <span className="text-gradient">Safety Net</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            When an emergency happens, your family shouldn't have to explain everything in five minutes.
            Give the people you trust instant access to your medical history.
          </p>
        </div>

        {/* How it works */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              How it works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold">1</div>
                <p className="text-muted-foreground">Add trusted family members or caregivers as emergency contacts.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold">2</div>
                <p className="text-muted-foreground">Share their unique access link, no account needed.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-bold">3</div>
                <p className="text-muted-foreground">In an emergency, they open the link to see your records instantly.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Contact Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Your Emergency Contacts
          </h2>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Emergency Contact</DialogTitle>
                <DialogDescription>
                  This person will be able to view your health records in an emergency.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={newContact.contact_name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, contact_name: e.target.value }))}
                    placeholder="e.g. Priya Sharma"
                  />
                </div>
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    value={newContact.contact_phone}
                    onChange={(e) => setNewContact(prev => ({ ...prev, contact_phone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <Label>Email (optional)</Label>
                  <Input
                    type="email"
                    value={newContact.contact_email}
                    onChange={(e) => setNewContact(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="priya@email.com"
                  />
                </div>
                <div>
                  <Label>Relationship *</Label>
                  <Select
                    value={newContact.relationship}
                    onValueChange={(val) => setNewContact(prev => ({ ...prev, relationship: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIPS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={addContact} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Contact
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Contacts List */}
        {contacts.length === 0 ? (
          <Card className="border-dashed border-2 border-muted-foreground/20">
            <CardContent className="p-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No emergency contacts yet</h3>
              <p className="text-muted-foreground mb-4">
                Add someone you trust so they can access your records when it matters most.
              </p>
              <Button onClick={() => setShowAddDialog(true)} variant="outline" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add your first contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 mb-10">
            {contacts.map(contact => (
              <Card key={contact.id} className={`transition-all ${!contact.is_active ? "opacity-60" : ""}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold">{contact.contact_name}</h3>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                          {contact.relationship}
                        </span>
                        {contact.is_active && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{contact.contact_phone}</p>
                      {contact.contact_email && (
                        <p className="text-sm text-muted-foreground">{contact.contact_email}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Button size="sm" onClick={() => shareViaWhatsApp(contact)} className="gap-1.5">
                        <Share2 className="h-3.5 w-3.5" />
                        WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyAccessLink(contact.access_token)}
                        className="gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => regenerateAccessLink(contact)}
                        className="gap-1.5"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        Regenerate
                      </Button>
                      <Switch
                        checked={contact.is_active}
                        onCheckedChange={() => toggleContact(contact)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteContact(contact.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Access Logs */}
        {accessLogs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Access History
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {accessLogs.map(log => {
                    const contact = contacts.find(c => c.id === log.emergency_contact_id);
                    return (
                      <div key={log.id} className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{contact?.contact_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.accessed_at).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          Records viewed
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Warning */}
        <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Important</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Anyone with the access link can view your health records. Only share it with people you trust.
                You can revoke access at any time by toggling the contact off or deleting them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContacts;
