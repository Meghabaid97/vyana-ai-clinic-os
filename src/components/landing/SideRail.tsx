import { useEffect, useState } from "react";

const sections = [
  { id: "hero", label: "Opening" },
  { id: "voices", label: "Voices" },
  { id: "story", label: "Film" },
  { id: "research", label: "Science" },
  { id: "how", label: "Method" },
  { id: "contact", label: "Begin" },
];

const SideRail = () => {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const onScroll = () => {
      const probe = window.innerHeight * 0.4;
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
      aria-label="Section navigation"
      className="hidden lg:block fixed left-6 xl:left-10 top-1/2 -translate-y-1/2 z-40"
    >
      {/* Italic word-ladder — no dots, no roman numerals, no track */}
      <ul className="flex flex-col gap-3">
        {sections.map((s, i) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => handleClick(e, s.id)}
                className="group flex items-baseline gap-3 cursor-pointer"
              >
                <span
                  className={`font-mono text-[10px] tabular-nums tracking-wider transition-colors duration-300 ${
                    isActive ? "text-primary" : "text-foreground/30 group-hover:text-foreground/55"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`font-serif italic text-[14px] leading-none transition-all duration-300 ${
                    isActive
                      ? "text-foreground translate-x-1"
                      : "text-foreground/35 group-hover:text-foreground/70 group-hover:translate-x-0.5"
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

export default SideRail;
