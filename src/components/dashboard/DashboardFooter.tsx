import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  hasHealthId: boolean;
}

const DashboardFooter = ({ hasHealthId }: Props) => {
  const navigate = useNavigate();

  return (
    <section className="py-12 px-5 sm:px-6 bg-muted/40">
      <div className="max-w-[640px] mx-auto text-center space-y-5">
        {!hasHealthId && (
          <div className="rounded-lg p-4 sm:p-5 border border-primary/20 bg-primary/5 text-left mb-8">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1 text-foreground">One step to connect everything</h3>
                <p className="text-muted-foreground text-[13px] leading-relaxed">
                  Add your ABHA Health ID and every past and future consultation across any provider links automatically. Your records follow you, not the other way around.
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Vyana</span> · Every patient deserves a doctor who already knows their story.
        </p>
      </div>
    </section>
  );
};

export default DashboardFooter;
