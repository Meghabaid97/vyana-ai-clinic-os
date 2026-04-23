import { useReveal } from "@/hooks/use-reveal";

const stats = [
  {
    value: "75",
    unit: "pages",
    body: "of scattered prescriptions, labs, and discharge summaries no one ever reads",
  },
  {
    value: "5",
    unit: "minutes",
    body: "to explain a lifetime of medical history to a doctor who has never seen you before",
  },
  {
    value: "33+",
    unit: "vitals",
    body: "tracked across years, surfacing the slow signals a fifteen-minute consult cannot see",
  },
];

const StatsStrip = () => {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section className="relative -mt-8 lg:-mt-12 z-20">
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12">
        <div
          ref={ref}
          className={`reveal ${visible ? "is-visible" : ""} rounded-2xl backdrop-blur-md shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)] overflow-hidden`}
          style={{ background: "hsl(20 18% 10% / 0.82)" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {stats.map((s, i) => (
              <div
                key={i}
                className={`px-8 py-10 sm:px-10 sm:py-12 reveal reveal-delay-${i + 1} ${visible ? "is-visible" : ""}`}
              >
                <div className="font-serif text-[64px] sm:text-[76px] leading-none text-white tracking-[-0.02em]">
                  {s.value}
                </div>
                <div className="text-label text-primary mt-2">
                  {s.unit}
                </div>
                <p className="mt-5 text-caption text-[hsl(30_20%_82%)] max-w-[280px]">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsStrip;
