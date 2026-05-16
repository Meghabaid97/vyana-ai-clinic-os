import { useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useActivePatient } from "@/contexts/ActivePatientContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AddFamilyMemberSheet from "./AddFamilyMemberSheet";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "mobile" | "desktop";
};

export default function HouseholdSwitcher({ variant = "mobile" }: Props) {
  const { patients, activePatient, setActiveById, loading } = useActivePatient();
  const [addOpen, setAddOpen] = useState(false);

  if (loading || !activePatient) return null;

  const firstName = activePatient.name.split(" ")[0];

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

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Logging for
          </DropdownMenuLabel>
          {patients.map((p) => {
            const isActive = p.id === activePatient.id;
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
                    {p.is_primary ? "You" : p.relationship}
                  </div>
                </div>
                {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
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
    </>
  );
}
