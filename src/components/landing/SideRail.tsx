import { useEffect, useState } from "react";

const sections = [
  { id: "hero", label: "Home" },
  { id: "voices", label: "Voices" },
  { id: "story", label: "Story" },
  { id: "research", label: "Science" },
  { id: "how", label: "How" },
  { id: "contact", label: "Access" },
];

const SideRail = () => {
  const [active, setActive] = useState("hero");
  const [progress, setProgress] = useState(0);

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
      // Snap to last section when near bottom of page
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = sections[sections.length - 1].id;
      }
      setActive(current);

      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      setProgress(total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0);
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
      className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 group"
    >
      <ul className="relative flex flex-col items-end gap-6 py-2">
        {/* Continuous track */}
        <span
          aria-hidden
          className="absolute right-[5px] top-3 bottom-3 w-px bg-foreground/10"
        />
        {/* Progress fill */}
        <span
          aria-hidden
          className="absolute right-[5px] top-3 w-px bg-primary/70 transition-all duration-300 ease-out"
          style={{ height: `calc((100% - 24px) * ${progress})` }}
        />

        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id} className="relative">
              <a
                href={`#${s.id}`}
                onClick={(e) => handleClick(e, s.id)}
                className="flex items-center gap-4 cursor-pointer"
              >
                {/* Label — appears on hover or when active */}
                <span
                  className={`font-serif text-[13px] tracking-[0.02em] whitespace-nowrap transition-all duration-300 ease-out ${
                    isActive
                      ? "opacity-100 translate-x-0 text-foreground italic"
                      : "opacity-0 -translate-x-1 text-foreground/60 group-hover:opacity-100 group-hover:translate-x-0"
                  }`}
                >
                  {s.label}
                </span>

                {/* Dot */}
                <span
                  className={`relative block transition-all duration-300 ease-out ${
                    isActive ? "scale-100" : "scale-90"
                  }`}
                >
                  <span
                    className={`block rounded-full transition-all duration-300 ease-out ${
                      isActive
                        ? "w-[11px] h-[11px] bg-primary"
                        : "w-[7px] h-[7px] bg-foreground/25 group-hover:bg-foreground/50"
                    }`}
                  />
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-primary/30 animate-ping"
                      style={{ animationDuration: "2.4s" }}
                    />
                  )}
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
