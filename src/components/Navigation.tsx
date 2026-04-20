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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled ? "bg-background/95 backdrop-blur-sm border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12 h-14 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="font-serif text-xl text-foreground tracking-tight">
          Vyana
        </button>

        <div className="hidden md:flex items-center gap-7 text-[13px] tracking-wide text-foreground/70">
          <button onClick={() => scrollTo("story")} className="hover:text-foreground transition-colors">Story</button>
          <button onClick={() => scrollTo("research")} className="hover:text-foreground transition-colors">Research</button>
          <button onClick={() => scrollTo("how")} className="hover:text-foreground transition-colors">How it works</button>
          <button onClick={() => scrollTo("team")} className="hover:text-foreground transition-colors">Team</button>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-[13px] text-foreground/70">
            {tLanding("nav.signIn")}
          </Button>
          <Button size="sm" onClick={() => scrollTo("contact")} className="text-[13px] h-8 px-4 rounded-full">
            Join waitlist
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
