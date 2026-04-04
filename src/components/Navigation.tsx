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
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    const handleLang = () => setLangTick((t) => t + 1);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("vyana-lang-change", handleLang);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("vyana-lang-change", handleLang);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled ? "bg-background/95 backdrop-blur-sm border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between">
        <span className="text-xl font-semibold tracking-tight text-foreground">Vyana</span>

        <div className="hidden md:flex items-center gap-6 text-[15px]">
          <button onClick={() => scrollToSection("about")} className="text-muted-foreground hover:text-foreground transition-colors">
            {tLanding("nav.about")}
          </button>
          <button onClick={() => scrollToSection("features")} className="text-muted-foreground hover:text-foreground transition-colors">
            {tLanding("nav.features")}
          </button>
          <button onClick={() => navigate("/why-vyana")} className="text-muted-foreground hover:text-foreground transition-colors">
            {tLanding("nav.ourStory")}
          </button>
          <button onClick={() => scrollToSection("contact")} className="text-muted-foreground hover:text-foreground transition-colors">
            {tLanding("nav.contact")}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground text-[14px]">
            {tLanding("nav.signIn")}
          </Button>
          <Button size="sm" onClick={() => scrollToSection("contact")} className="text-[14px] rounded-lg">
            {tLanding("nav.getStarted")}
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
