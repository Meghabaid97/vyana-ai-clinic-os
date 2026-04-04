import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  profile: { name: string } | null;
}

const DashboardHero = ({ profile }: Props) => {
  const navigate = useNavigate();
  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <section className="pt-20 pb-12 px-5 sm:px-6">
      <div className="max-w-[640px] mx-auto space-y-4 animate-fade-in">
        <p className="text-sm text-primary font-medium">
          Welcome back, {firstName}.
        </p>

        <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
          Your health story.{" "}
          <span className="text-primary">Always with you.</span>
        </h1>

        <p className="text-[15px] text-muted-foreground leading-relaxed">
          Every prescription, every lab report, every doctor visit builds your complete health picture. Quietly. Securely. So when you need it most, it is there.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={() => navigate("/patient-health-records")}
            className="group h-10 px-5 text-sm rounded-md"
          >
            Upload a record
            <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/patient-medical-history")}
            className="text-sm text-muted-foreground h-10"
          >
            View history
          </Button>
        </div>
      </div>
    </section>
  );
};

export default DashboardHero;
