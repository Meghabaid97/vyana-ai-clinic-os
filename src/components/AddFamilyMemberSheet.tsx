import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useActivePatient } from "@/contexts/ActivePatientContext";

const RELATIONSHIPS = [
  { value: "Spouse", emoji: "💑" },
  { value: "Parent", emoji: "👴" },
  { value: "Child", emoji: "🧒" },
  { value: "Sibling", emoji: "🧑" },
  { value: "Other", emoji: "👤" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AddFamilyMemberSheet({ open, onOpenChange }: Props) {
  const { refresh, setActiveById } = useActivePatient();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Parent");
  const [dob, setDob] = useState("");
  const [abha, setAbha] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setRelationship("Parent");
    setDob("");
    setAbha("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter their name");
      return;
    }
    if (abha && abha.replace(/\s/g, "").length !== 14) {
      toast.error("ABHA Health ID must be 14 digits");
      return;
    }
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in again");
        return;
      }
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
      toast.success(`${name.split(" ")[0]} added to your household`);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      console.error("[AddFamilyMember] insert error", err);
      toast.error(err?.message || "Could not add family member");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90svh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Add a family member</SheetTitle>
          <SheetDescription>
            Manage their health from your account. They will not get a separate login.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="fm-name">Full name</Label>
            <Input
              id="fm-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lakshmi Iyer"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fm-rel">Relationship</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger id="fm-rel"><SelectValue /></SelectTrigger>
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
            <Label htmlFor="fm-dob">Date of birth <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="fm-dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fm-abha">ABHA Health ID <span className="text-muted-foreground font-normal">(optional, 14 digits)</span></Label>
            <Input
              id="fm-abha"
              inputMode="numeric"
              value={abha}
              onChange={(e) => setAbha(e.target.value.replace(/[^0-9]/g, "").slice(0, 14))}
              placeholder="14-digit ABHA ID"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Adding..." : "Add member"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
