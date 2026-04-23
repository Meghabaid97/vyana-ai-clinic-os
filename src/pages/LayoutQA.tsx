import { useEffect, useState } from "react";
import { Check, Smartphone, Tablet, Monitor } from "lucide-react";

// Tailwind breakpoints used across the app (must mirror tailwind.config.ts defaults)
const BREAKPOINTS = [
  { id: "xs", label: "Phone XS", min: 0, max: 374, device: "iPhone SE / mini", icon: Smartphone },
  { id: "sm", label: "Phone", min: 375, max: 639, device: "iPhone 14 / 15", icon: Smartphone },
  { id: "md", label: "Tablet", min: 640, max: 1023, device: "iPad mini / portrait", icon: Tablet },
  { id: "lg", label: "Desktop", min: 1024, max: 1279, device: "Laptop", icon: Monitor },
  { id: "xl", label: "Desktop XL", min: 1280, max: 9999, device: "Large monitor", icon: Monitor },
] as const;

type RuleStatus = "applies" | "skipped";

type LayoutRule = {
  area: string;
  rule: string;
  appliesAt: Array<(typeof BREAKPOINTS)[number]["id"]>;
  source: string;
};

// Single source of truth: every layout decision currently in the codebase
const RULES: LayoutRule[] = [
  // ── App shell ─────────────────────────────────────────────────────────
  { area: "Shell · Top bar",     rule: "iOS-style 44pt header (page title left, icon cluster right)",     appliesAt: ["xs", "sm", "md"],          source: "AppShell.tsx" },
  { area: "Shell · Top bar",     rule: "Amazon-style two-row header (logo + Ask Vyana + account)",        appliesAt: ["lg", "xl"],                source: "AppShell.tsx" },
  { area: "Shell · Bottom nav",  rule: "Fixed 6-tab bar with safe-area inset (52px tall)",                appliesAt: ["xs", "sm", "md"],          source: "AppShell.tsx" },
  { area: "Shell · Bottom nav",  rule: "Hidden — tabs render in desktop secondary nav row",               appliesAt: ["lg", "xl"],                source: "AppShell.tsx" },
  { area: "Shell · Footer",      rule: "Hidden",                                                          appliesAt: ["xs", "sm", "md"],          source: "AppShell.tsx" },
  { area: "Shell · Footer",      rule: "Visible centered footer (Vyana / Support / Privacy / Story)",     appliesAt: ["lg", "xl"],                source: "AppShell.tsx" },
  { area: "Shell · Container",   rule: "Full-bleed, max-w-100vw, overflow-x-hidden",                      appliesAt: ["xs", "sm", "md"],          source: "AppShell.tsx" },
  { area: "Shell · Container",   rule: "Centered, max-w-1400px, px-6 py-6",                               appliesAt: ["lg", "xl"],                source: "AppShell.tsx" },

  // ── Home (AppHome) ────────────────────────────────────────────────────
  { area: "Home · Hero",         rule: "Single column, 26–32px headline, compact padding",                appliesAt: ["xs", "sm", "md"],          source: "AppHome.tsx" },
  { area: "Home · Hero",         rule: "12-col grid (7 text / 5 briefing CTA), 5xl–6xl headline",         appliesAt: ["lg", "xl"],                source: "AppHome.tsx" },
  { area: "Home · Story beats",  rule: "Horizontal snap-scroll, 84% min-width per card",                  appliesAt: ["xs"],                      source: "AppHome.tsx" },
  { area: "Home · Story beats",  rule: "Vertical stacked list, 1 column",                                 appliesAt: ["sm", "md"],                source: "AppHome.tsx" },
  { area: "Home · Story beats",  rule: "3-column grid, equal cards",                                      appliesAt: ["lg", "xl"],                source: "AppHome.tsx" },
  { area: "Home · Records card", rule: "40px count number, 9–12px stat tiles",                            appliesAt: ["xs", "sm"],                source: "AppHome.tsx" },
  { area: "Home · Records card", rule: "60px count number, 14px stat tiles",                              appliesAt: ["lg", "xl"],                source: "AppHome.tsx" },
  { area: "Home · Side rail",    rule: "Inline below main content (quick actions + Why Vyana)",           appliesAt: ["xs", "sm", "md"],          source: "AppHome.tsx" },
  { area: "Home · Side rail",    rule: "Sticky 4-col aside next to 8-col main",                           appliesAt: ["lg", "xl"],                source: "AppHome.tsx" },

  // ── Profile page ──────────────────────────────────────────────────────
  { area: "Profile · Stats",     rule: "2-column grid, 8px gap",                                          appliesAt: ["xs", "sm"],                source: "PatientProfilePage.tsx" },
  { area: "Profile · Stats",     rule: "4-column grid, 16px gap",                                         appliesAt: ["md", "lg", "xl"],          source: "PatientProfilePage.tsx" },
  { area: "Profile · Tabs",      rule: "5 tabs at 11px text, 4px padding",                                appliesAt: ["xs", "sm"],                source: "PatientProfilePage.tsx" },
  { area: "Profile · Tabs",      rule: "5 tabs at 14px text, full padding",                               appliesAt: ["md", "lg", "xl"],          source: "PatientProfilePage.tsx" },

  // ── Touch & safe-area ─────────────────────────────────────────────────
  { area: "Safe area",           rule: "env(safe-area-inset-top|bottom) applied to header & tab bar",     appliesAt: ["xs", "sm", "md"],          source: "AppShell.tsx" },
  { area: "Touch targets",       rule: "Minimum 44×44pt (iOS HIG)",                                       appliesAt: ["xs", "sm", "md"],          source: "All buttons" },
  { area: "Touch targets",       rule: "Minimum 32×32pt (mouse)",                                         appliesAt: ["lg", "xl"],                source: "All buttons" },
];

export default function LayoutQA() {
  const [width, setWidth] = useState<number>(typeof window !== "undefined" ? window.innerWidth : 0);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const activeBp = BREAKPOINTS.find((b) => width >= b.min && width <= b.max) ?? BREAKPOINTS[0];

  const statusFor = (rule: LayoutRule, bpId: (typeof BREAKPOINTS)[number]["id"]): RuleStatus =>
    rule.appliesAt.includes(bpId) ? "applies" : "skipped";

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <header className="mb-6 sm:mb-10">
          <p className="text-[10.5px] sm:text-xs font-semibold tracking-[0.18em] uppercase text-primary mb-2">
            Internal · Layout QA
          </p>
          <h1 className="text-[24px] sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
            Device-based layout checklist
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] sm:text-sm text-muted-foreground leading-relaxed">
            Live audit of every responsive rule the app currently applies. Resize the window — the column for the active breakpoint highlights in real time.
          </p>
        </header>

        {/* Live breakpoint indicator */}
        <section className="mb-6 sm:mb-8 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <activeBp.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Currently rendering at
                </p>
                <p className="text-[15px] sm:text-base font-semibold text-foreground truncate">
                  {activeBp.label} <span className="text-muted-foreground">· {activeBp.device}</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10.5px] font-semibold tracking-widest uppercase text-muted-foreground">
                Viewport
              </p>
              <p className="text-[15px] sm:text-base font-mono font-semibold text-foreground">
                {width}px
              </p>
            </div>
          </div>

          {/* Breakpoint legend */}
          <div className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-2">
            {BREAKPOINTS.map((bp) => {
              const isActive = bp.id === activeBp.id;
              return (
                <div
                  key={bp.id}
                  className={`rounded-lg border text-center py-1.5 sm:py-2 px-1 transition-colors ${
                    isActive
                      ? "border-primary bg-primary/10"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <p className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {bp.id}
                  </p>
                  <p className={`text-[10px] sm:text-[11px] font-medium mt-0.5 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {bp.min}{bp.max < 9999 ? `–${bp.max}` : "+"}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Rules table */}
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border bg-muted/30">
            <h2 className="text-[13px] sm:text-sm font-semibold text-foreground">
              {RULES.length} responsive rules tracked
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
              ✓ = applied at that breakpoint · empty = inactive
            </p>
          </div>

          {/* Mobile: card list. Desktop: matrix */}
          <div className="lg:hidden divide-y divide-border">
            {RULES.map((rule, i) => {
              const isActiveRule = rule.appliesAt.includes(activeBp.id);
              return (
                <div key={i} className={`p-4 ${isActiveRule ? "bg-primary/5" : ""}`}>
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className="text-[10.5px] font-semibold tracking-widest uppercase text-muted-foreground">
                      {rule.area}
                    </p>
                    {isActiveRule && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        <Check className="h-3 w-3" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-foreground leading-snug mb-2">{rule.rule}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {BREAKPOINTS.map((bp) => {
                      const on = statusFor(rule, bp.id) === "applies";
                      return (
                        <span
                          key={bp.id}
                          className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded border ${
                            on
                              ? "border-primary/40 bg-primary/10 text-primary font-semibold"
                              : "border-border bg-muted text-muted-foreground/60"
                          }`}
                        >
                          {on ? "✓ " : ""}{bp.id}
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[10px] font-mono text-muted-foreground/70">{rule.source}</p>
                </div>
              );
            })}
          </div>

          <table className="hidden lg:table w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr className="text-left">
                <th className="px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider w-44">Area</th>
                <th className="px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Rule</th>
                {BREAKPOINTS.map((bp) => (
                  <th
                    key={bp.id}
                    className={`px-3 py-3 text-center font-semibold text-xs uppercase tracking-wider w-20 ${
                      bp.id === activeBp.id ? "text-primary bg-primary/5" : "text-muted-foreground"
                    }`}
                  >
                    {bp.id}
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider w-44">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {RULES.map((rule, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 text-xs font-semibold tracking-wider uppercase text-muted-foreground align-top">
                    {rule.area}
                  </td>
                  <td className="px-5 py-3 text-foreground align-top">{rule.rule}</td>
                  {BREAKPOINTS.map((bp) => {
                    const on = statusFor(rule, bp.id) === "applies";
                    const isActiveCol = bp.id === activeBp.id;
                    return (
                      <td
                        key={bp.id}
                        className={`px-3 py-3 text-center align-top ${isActiveCol ? "bg-primary/5" : ""}`}
                      >
                        {on ? (
                          <Check className={`h-4 w-4 mx-auto ${isActiveCol ? "text-primary" : "text-foreground/70"}`} strokeWidth={2.5} />
                        ) : (
                          <span className="text-muted-foreground/30">·</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground align-top">{rule.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <p className="mt-6 text-[11px] text-muted-foreground text-center">
          Resize this window or rotate your device to see how the matrix updates. This page is internal — not linked from the public app.
        </p>
      </div>
    </div>
  );
}
