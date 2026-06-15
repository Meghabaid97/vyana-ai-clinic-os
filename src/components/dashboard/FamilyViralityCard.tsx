import { useState } from "react";
import { Users, ArrowRight } from "lucide-react";
import AddFamilyMemberSheet from "@/components/AddFamilyMemberSheet";
import { useActivePatient } from "@/contexts/ActivePatientContext";

/**
 * Post-onboarding nudge: once a patient has uploaded their first record but has
 * no family on the household yet, invite them to bring a parent or sibling in.
 * This is the consumer-to-consumer virality moment: each family that joins
 * surfaces Vyana to the next family naturally.
 *
 * Renders nothing when the household already has 2+ members, or when the user
 * has not uploaded any record yet (no value to share).
 */
type Props = {
  recordCount: number;
};

export default function FamilyViralityCard({ recordCount }: Props) {
  const [open, setOpen] = useState(false);
  const { patients, loading } = useActivePatient();

  if (loading) return null;
  // Only show after the user has felt the product (1+ record) and is still solo
  if (recordCount < 1) return null;
  if (patients.length > 1) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-0 pb-4">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-foreground leading-snug">
            Keep Mom and Dad&apos;s records here too
          </p>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground leading-snug">
            Invite a parent or sibling. One family, one health story, shared safely.
          </p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
      </button>

      <AddFamilyMemberSheet open={open} onOpenChange={setOpen} />
    </section>
  );
}
