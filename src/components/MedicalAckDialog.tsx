import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert } from "lucide-react";
import { useCallback, useState } from "react";

const STORAGE_KEY = "vyana_medical_ack_v1";

/**
 * Hook that gates an AI-medical action (briefing, drug check, risk score)
 * behind a one-time disclaimer acknowledgment. Stores ack in localStorage so
 * we only show the dialog the first time a user triggers any such action.
 *
 * Usage:
 *   const ack = useMedicalAck();
 *   <Button onClick={() => ack.run(generateBriefing)} />
 *   <MedicalAckDialog state={ack} />
 */
export function useMedicalAck() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);

  const isAcknowledged = () => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  };

  const run = useCallback((action: () => void) => {
    if (isAcknowledged()) {
      action();
      return;
    }
    setPending(() => action);
    setOpen(true);
  }, []);

  const accept = useCallback(() => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
    const action = pending;
    setPending(null);
    if (action) action();
  }, [pending]);

  const cancel = useCallback(() => {
    setOpen(false);
    setPending(null);
  }, []);

  return { open, accept, cancel, run };
}

interface Props {
  state: ReturnType<typeof useMedicalAck>;
}

const MedicalAckDialog = ({ state }: Props) => (
  <AlertDialog open={state.open} onOpenChange={(o) => { if (!o) state.cancel(); }}>
    <AlertDialogContent className="max-w-md">
      <AlertDialogHeader>
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mb-2">
          <ShieldAlert className="h-6 w-6 text-amber-700 dark:text-amber-300" />
        </div>
        <AlertDialogTitle className="text-center">Before you continue</AlertDialogTitle>
        <AlertDialogDescription className="text-left space-y-3 pt-2">
          <span className="block">
            Vyana uses AI to summarize your health records into discussion
            points for your doctor. These insights are <strong>not a medical
            diagnosis</strong> and are <strong>not a substitute for professional
            medical advice</strong>.
          </span>
          <span className="block">
            By continuing you acknowledge that:
          </span>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>AI summaries can be incomplete or wrong.</li>
            <li>Always verify with a qualified healthcare professional before any treatment decision.</li>
            <li>In an emergency, call your local emergency number, do not rely on this app.</li>
          </ul>
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={state.cancel}>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={state.accept}>I understand, continue</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default MedicalAckDialog;
