import { useEffect, useState } from "react";

// Roman-numeral chapter rail. Treats the page as a manuscript, not a SaaS landing.
const sections = [
  { id: "hero", label: "Hook", numeral: "I" },
  { id: "problem", label: "Why", numeral: "II" },
  { id: "wedge", label: "Product", numeral: "III" },
  { id: "how", label: "How", numeral: "IV" },
  { id: "research", label: "Science", numeral: "V" },
  { id: "trust", label: "Founders", numeral: "VI" },
  { id: "faq", label: "Access", numeral: "VII" },
];

const ChapterRail = () => {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const onScroll = () => {
      const probe = window.innerHeight * 0.35;
      let current = sections[0].id;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - probe <= 0) current = s.id;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = sections[sections.length - 1].id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Chapter navigation"
      className="hidden xl:block fixed left-6 top-1/2 -translate-y-1/2 z-40"
    >
      <ul className="flex flex-col gap-4">
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => handleClick(e, s.id)}
                className={`group flex items-baseline gap-3 cursor-pointer leading-none transition-all duration-300 ${
                  isActive ? "translate-x-1" : "hover:translate-x-0.5"
                }`}
              >
                <span
                  className={`font-serif text-[13px] tabular-nums w-5 transition-colors ${
                    isActive ? "text-primary" : "text-foreground/30 group-hover:text-foreground/60"
                  }`}
                >
                  {s.numeral}
                </span>
                <span
                  className={`text-[10px] tracking-[0.22em] uppercase transition-colors ${
                    isActive ? "text-primary" : "text-foreground/30 group-hover:text-foreground/60"
                  }`}
                >
                  {s.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default ChapterRail;
