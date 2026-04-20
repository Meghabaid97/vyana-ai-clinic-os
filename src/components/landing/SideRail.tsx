import { useEffect, useState } from "react";

const sections = [
  { id: "hero", numeral: "I", label: "Home" },
  { id: "story", numeral: "II", label: "Story" },
  { id: "research", numeral: "III", label: "Science" },
  { id: "how", numeral: "IV", label: "How" },
  { id: "contact", numeral: "V", label: "Access" },
];

const SideRail = () => {
  const [active, setActive] = useState("hero");

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + 200;
      let current = "hero";
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.offsetTop <= y) current = s.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="hidden lg:block fixed left-6 bottom-6 z-40 text-[11px] tracking-widest uppercase">
      <ul className="space-y-1.5">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={`flex items-center gap-3 transition-colors ${
                active === s.id ? "text-foreground" : "text-muted-foreground/60 hover:text-foreground"
              }`}
            >
              <span className="font-serif italic w-4 text-right">{s.numeral}</span>
              <span className="w-8 h-px bg-current opacity-40" />
              <span>{s.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SideRail;
