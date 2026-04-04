import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LanguageSelector from "./LanguageSelector";
import { tLanding } from "@/lib/i18n-landing";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [, setLangTick] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    const handleLang = () => setLangTick((t) => t + 1);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("vyana-lang-change", handleLang);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("vyana-lang-change", handleLang);
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-150 ${
        isScrolled ? "bg-background border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-[980px] mx-auto px-6 h-12 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="text-lg font-semibold text-foreground tracking-tight">
          Vyana
        </button>

        <div className="hidden md:flex items-center gap-5 text-sm text-muted-foreground">
          <button onClick={() => scrollTo("about")} className="hover:text-foreground transition-colors">{tLanding("nav.about")}</button>
          <button onClick={() => scrollTo("features")} className="hover:text-foreground transition-colors">{tLanding("nav.features")}</button>
          <button onClick={() => navigate("/why-vyana")} className="hover:text-foreground transition-colors">{tLanding("nav.ourStory")}</button>
          <button onClick={() => scrollTo("contact")} className="hover:text-foreground transition-colors">{tLanding("nav.contact")}</button>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-sm text-muted-foreground">
            {tLanding("nav.signIn")}
          </Button>
          <Button size="sm" onClick={() => scrollTo("contact")} className="text-sm h-7 px-3 rounded-md">
            {tLanding("nav.getStarted")}
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
