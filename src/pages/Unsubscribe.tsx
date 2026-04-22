import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type State =
  | { kind: "loading" }
  | { kind: "valid" }
  | { kind: "already" }
  | { kind: "invalid" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid" });
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } }
        );
        const data = await res.json();
        if (!res.ok) {
          setState({ kind: "invalid" });
          return;
        }
        if (data.valid === false && data.reason === "already_unsubscribed") {
          setState({ kind: "already" });
          return;
        }
        if (data.valid) {
          setState({ kind: "valid" });
          return;
        }
        setState({ kind: "invalid" });
      } catch {
        setState({ kind: "error", message: "Could not reach server." });
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState({ kind: "submitting" });
    const { data, error } = await supabase.functions.invoke(
      "handle-email-unsubscribe",
      { body: { token } }
    );
    if (error) {
      setState({ kind: "error", message: error.message });
      return;
    }
    if (data?.success || data?.reason === "already_unsubscribed") {
      setState({ kind: "success" });
    } else {
      setState({ kind: "error", message: "Something went wrong." });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md p-8 text-center">
        <h1 className="font-serif text-2xl text-foreground mb-2">Unsubscribe</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Manage your email preferences for Vyana.
        </p>

        {state.kind === "loading" && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {state.kind === "valid" && (
          <>
            <p className="text-sm text-foreground mb-6">
              Confirm you want to stop receiving emails from Vyana.
            </p>
            <Button onClick={confirm} className="w-full">
              Confirm unsubscribe
            </Button>
          </>
        )}

        {state.kind === "submitting" && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {state.kind === "success" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="text-sm text-foreground">
              You have been unsubscribed. We won't email you again.
            </p>
          </div>
        )}

        {state.kind === "already" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-foreground">
              You are already unsubscribed.
            </p>
          </div>
        )}

        {state.kind === "invalid" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-foreground">
              This unsubscribe link is invalid or expired.
            </p>
          </div>
        )}

        {state.kind === "error" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-foreground">{state.message}</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Unsubscribe;
