import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LanguageSelector from "./LanguageSelector";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          <span className="text-2xl font-bold text-gradient-warm">Vyana</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection("about")}
            className="text-foreground/70 hover:text-foreground transition-colors"
          >
            About
          </button>
          <button
            onClick={() => scrollToSection("features")}
            className="text-foreground/70 hover:text-foreground transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => navigate("/why-vyana")}
            className="text-foreground/70 hover:text-foreground transition-colors"
          >
            Our Story
          </button>
          <button
            onClick={() => scrollToSection("contact")}
            className="text-foreground/70 hover:text-foreground transition-colors"
          >
            Contact
          </button>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector />
          <Button
            variant="outline"
            onClick={() => navigate("/auth")}
          >
            Sign In
          </Button>
          <Button
            variant="gradient"
            onClick={() => scrollToSection("contact")}
          >
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
