import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LanguageSelector from "./LanguageSelector";
import { useLandingT } from "@/lib/i18n-landing";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const t = useLandingT();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled ? "bg-background/95 backdrop-blur-sm border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12 h-14 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="font-display text-2xl text-foreground tracking-tight leading-none">
          V<span className="text-primary italic">yana</span>
        </button>

        <div className="flex items-center gap-7">
          <div className="hidden md:flex items-center gap-7 text-[13px] tracking-wide text-foreground/70">
            <button onClick={() => navigate("/why-vyana")} className="hover:text-foreground transition-colors">{t("nav.story")}</button>
            <button onClick={() => scrollTo("research")} className="hover:text-foreground transition-colors">{t("nav.research")}</button>
            <button onClick={() => scrollTo("how")} className="hover:text-foreground transition-colors">{t("nav.how")}</button>
            <a href="mailto:mbaid@wharton.upenn.edu" className="hover:text-foreground transition-colors">{t("nav.contact")}</a>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Button size="sm" onClick={() => navigate("/request-access")} className="text-[13px] h-8 px-4 rounded-full">
              Get early access
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
