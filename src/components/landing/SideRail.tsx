import { useEffect, useState } from "react";

const sections = [
  { id: "hero", label: "Opening" },
  { id: "problem", label: "Problem" },
  { id: "voices", label: "Voices" },
  { id: "wedge", label: "Product" },
  { id: "demo", label: "Demo" },
  { id: "how", label: "How" },
  { id: "output", label: "Outcome" },
  { id: "research", label: "Science" },
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
      className="hidden xl:block fixed left-5 top-1/2 -translate-y-1/2 z-40"
    >
      <ul className="flex flex-col gap-3">
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => handleClick(e, s.id)}
                className={`group flex items-baseline cursor-pointer font-serif italic text-[14px] leading-none transition-all duration-300 ${
                  isActive
                    ? "text-primary translate-x-1"
                    : "text-primary/40 hover:text-primary/80 hover:translate-x-0.5"
                }`}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SideRail;
