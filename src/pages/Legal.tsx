import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { LegalContent } from "@/components/LegalContent";

const Legal = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultSection = location.hash === "#privacy" ? "privacy" : "terms";

  usePageMeta({
    title: "Terms and privacy — Vyana",
    description:
      "Vyana's terms of service and privacy policy. How we collect, store, and protect your health data under India's DPDPA 2023 and IT Act frameworks.",
    path: "/legal",
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="p-1 inline-flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Legal</h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <LegalContent defaultSection={defaultSection} />

        <div className="mt-10 pb-10 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Vyana Health Technologies. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Legal;
