import { useRef, useState, useEffect, useCallback } from "react";
import { Heart, Flame, Zap, Sun, Cloud, Moon, Smile, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Mood = {
  id: string;
  label: string;
  icon: typeof Heart;
  /** gradient for the active filled state */
  gradient: string;
};

const MOODS: Mood[] = [
  { id: "calm",    label: "Calm",    icon: Cloud,    gradient: "linear-gradient(180deg,#A3C9F7,#6C8FE0)" },
  { id: "happy",   label: "Happy",   icon: Sun,      gradient: "linear-gradient(180deg,#FFD27A,#F39A5A)" },
  { id: "fired",   label: "Fired up",icon: Flame,    gradient: "linear-gradient(180deg,#FFB39A,#E8704A)" },
  { id: "loving",  label: "Loving",  icon: Heart,    gradient: "linear-gradient(180deg,#FFA8C8,#E84E92)" },
  { id: "focused", label: "Focused", icon: Zap,      gradient: "linear-gradient(180deg,#C8B6FF,#7C5BE8)" },
  { id: "grateful",label: "Grateful",icon: Sparkles, gradient: "linear-gradient(180deg,#C8F0D4,#5BB776)" },
  { id: "tired",   label: "Tired",   icon: Moon,     gradient: "linear-gradient(180deg,#B6BFD6,#5E6A8A)" },
  { id: "okay",    label: "Okay",    icon: Smile,    gradient: "linear-gradient(180deg,#FFE3B6,#E0A86A)" },
];

const PILL_W = 96;       // px
const PILL_GAP = 16;     // px

const MoodCheckIn = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(3); // "Loving" default

  // Sync active item with scroll snap position
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    const idx = Math.round((center - el.clientWidth / 2) / (PILL_W + PILL_GAP));
    setActiveIdx(Math.max(0, Math.min(MOODS.length - 1, idx)));
  }, []);

  // Snap to default on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = activeIdx * (PILL_W + PILL_GAP);
    el.scrollTo({ left: target, behavior: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  const active = MOODS[activeIdx];
  const ActiveIcon = active.icon;

  return (
    <section className="relative px-4 sm:px-5 pt-3 pb-2 lg:px-0">
      <div className="relative overflow-hidden calm-card px-2 py-6">
        {/* Soft multi-color aura backdrop */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 70% at 25% 40%, rgba(255,180,140,0.35) 0%, transparent 60%)," +
              "radial-gradient(55% 65% at 75% 55%, rgba(232,140,200,0.32) 0%, transparent 60%)," +
              "radial-gradient(50% 60% at 50% 80%, rgba(184,160,255,0.30) 0%, transparent 65%)",
          }}
        />

        <div className="relative">
          <h2 className="text-center font-display text-[22px] sm:text-[26px] leading-tight text-foreground">
            How are you feeling today?
          </h2>
          <p className="text-center text-[12px] text-muted-foreground mt-1">{today}</p>

          {/* Carousel */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="relative mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[calc(50%-48px)] pb-2 scrollbar-none [-webkit-overflow-scrolling:touch]"
            style={{ scrollbarWidth: "none" }}
          >
            {MOODS.map((m, i) => {
              const Icon = m.icon;
              const isActive = i === activeIdx;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    scrollRef.current?.scrollTo({
                      left: i * (PILL_W + PILL_GAP),
                      behavior: "smooth",
                    });
                  }}
                  className={cn(
                    "snap-center shrink-0 flex items-center justify-center rounded-full transition-all duration-300 ease-out",
                    isActive
                      ? "h-[124px] w-[96px] text-white shadow-[0_18px_40px_-12px_rgba(232,78,146,0.45)] scale-100"
                      : "h-[96px] w-[64px] bg-white/70 text-foreground/40 scale-90 opacity-60"
                  )}
                  style={isActive ? { background: m.gradient, width: PILL_W } : { width: 64 }}
                  aria-label={m.label}
                  aria-pressed={isActive}
                >
                  <Icon
                    className={cn(isActive ? "h-7 w-7" : "h-5 w-5")}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    fill={isActive ? "currentColor" : "none"}
                  />
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-center font-display text-[18px] text-foreground">
            {active.label}
          </p>
          <p className="text-center text-[11px] text-muted-foreground mt-0.5">
            scroll to choose another mood
          </p>
        </div>
      </div>
    </section>
  );
};

export default MoodCheckIn;
