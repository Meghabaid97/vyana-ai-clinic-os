import { useNavigate } from "react-router-dom";
import { Mail, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const AccessPending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          You're not on the list — yet
        </h1>

        <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
          Vyana is in <span className="font-medium text-foreground">gated beta</span>. We're
          onboarding new families a few at a time so every account gets the care it deserves.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-left">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[14px] font-semibold text-foreground">
                Request an invite
              </p>
              <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                Share a few details and we'll reach out as soon as a spot opens up. Most
                approvals happen within a few days.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            onClick={() => navigate("/auth?signup=1")}
            className="w-full h-11 rounded-xl"
          >
            Request access
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            onClick={() => navigate("/auth")}
            variant="ghost"
            className="w-full h-10 rounded-xl text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </div>

        <p className="mt-8 text-[12px] text-muted-foreground">
          Already approved?{" "}
          <button
            onClick={() => navigate("/auth")}
            className="text-primary hover:underline font-medium"
          >
            Use the email you applied with
          </button>
        </p>
      </div>
    </div>
  );
};

export default AccessPending;
