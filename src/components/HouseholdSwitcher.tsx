import { useState } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { useActivePatient } from "@/contexts/ActivePatientContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AddFamilyMemberSheet from "./AddFamilyMemberSheet";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  variant?: "mobile" | "desktop";
};

export default function HouseholdSwitcher({ variant = "mobile" }: Props) {
  const { patients, activePatient, setActiveById, loading, refresh } = useActivePatient();
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<null | { id: string; name: string; access: "owned" | "granted" }>(null);
  const [removing, setRemoving] = useState(false);

  if (loading || !activePatient) return null;

  const firstName = activePatient.name.split(" ")[0];

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      if (removeTarget.access === "granted") {
        // Revoke the access grant the inviter gave me
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("not_authenticated");
        const { error } = await supabase
          .from("patient_access_grants")
          .update({ revoked_at: new Date().toISOString() })
          .eq("patient_id", removeTarget.id)
          .eq("grantee_user_id", session.user.id)
          .is("revoked_at", null);
        if (error) throw error;
      } else {
        // Owned dependent — revoke any grants I gave to others, then nothing else (patients table has no DELETE policy)
        const { error } = await supabase
          .from("patient_access_grants")
          .update({ revoked_at: new Date().toISOString() })
          .eq("patient_id", removeTarget.id)
          .is("revoked_at", null);
        if (error) throw error;
        toast.info("Access revoked. Contact support to fully delete this profile.");
      }
      toast.success(`${removeTarget.name} removed`);
      setRemoveTarget(null);
      await refresh();
    } catch (err) {
      console.error("[HouseholdSwitcher] remove failed", err);
      toast.error("Couldn't remove. Please try again.");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Switch family member"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full transition-colors",
              variant === "mobile"
                ? "h-8 px-2 active:bg-muted"
                : "h-9 px-2.5 hover:bg-muted"
            )}
          >
            <span className="h-5 w-5 rounded-full bg-primary/15 text-primary text-[10.5px] font-semibold flex items-center justify-center leading-none">
              {firstName.charAt(0).toUpperCase()}
            </span>
            <span className={cn(
              "font-medium text-foreground truncate max-w-[6.5rem]",
              variant === "mobile" ? "text-[13px]" : "text-sm"
            )}>
              {firstName}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Logging for
          </DropdownMenuLabel>
          {patients.map((p) => {
            const isActive = p.id === activePatient.id;
            const isSelf = p.access === "owned" && p.is_primary;
            return (
              <DropdownMenuItem
                key={p.id}
                onClick={() => setActiveById(p.id)}
                className="gap-3 py-2.5 cursor-pointer"
              >
                <span className="h-7 w-7 rounded-full bg-primary/15 text-primary text-[12px] font-semibold flex items-center justify-center shrink-0 leading-none">
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {p.access === "owned"
                      ? (p.is_primary ? "You" : p.relationship)
                      : "Shared with you"}
                  </div>
                </div>
                {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                {!isSelf && (
                  <button
                    type="button"
                    aria-label={`Remove ${p.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setRemoveTarget({ id: p.id, name: p.name, access: p.access });
                    }}
                    className="ml-1 h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setAddOpen(true)}
            className="gap-3 py-2.5 cursor-pointer text-primary"
          >
            <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Plus className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-medium">Add family member</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddFamilyMemberSheet open={addOpen} onOpenChange={setAddOpen} />

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.access === "granted"
                ? "You'll lose access to their health records. They can re-invite you anytime."
                : "Access to this profile will be revoked from everyone it was shared with."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void handleRemove(); }}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
