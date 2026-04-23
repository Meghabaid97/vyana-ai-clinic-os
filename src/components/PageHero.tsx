import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeroProps {
  icon: LucideIcon;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}

/**
 * Consistent page hero used across the patient app shell (Briefing, Records,
 * Trends, etc). Keeps icon-block, title and subtitle scaling identical on
 * mobile and desktop so each tab feels like the same product.
 */
const PageHero = ({ icon: Icon, eyebrow, title, subtitle, action }: PageHeroProps) => {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-primary leading-none mb-1.5">
              {eyebrow}
            </p>
          )}
          <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-[13px] sm:text-sm leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
};

export default PageHero;
