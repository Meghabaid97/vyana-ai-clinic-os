import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";

const WatchItWork = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const header = useReveal<HTMLDivElement>();
  const phone = useReveal<HTMLDivElement>();

  useEffect(() => {
    const el = sectionRef.current;
    const video = videoRef.current;
    if (!el || !video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.4) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: [0.4] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  return (
    <section
      ref={sectionRef}
      id="watch-it-work"
      className="relative bg-foreground text-background py-24 lg:py-32 overflow-hidden"
    >
      {/* Soft glow accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-[0.08]"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 60%)",
        }}
      />

      <div className="relative max-w-[1240px] mx-auto px-6 lg:px-12">
        {/* Caption */}
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} text-center mb-12 lg:mb-16`}
        >
          <p className="font-serif italic text-[14px] text-background/60 mb-4 tracking-wide">
            Watch it work
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl lg:text-[56px] leading-[1.05] tracking-[-0.02em] max-w-[820px] mx-auto">
            This is what living with{" "}
            <em className="italic text-primary font-normal">Vyana</em> feels like.
          </h2>
        </div>

        {/* Phone mockup */}
        <div
          ref={phone.ref}
          className={`reveal ${phone.visible ? "is-visible" : ""} relative mx-auto`}
          style={{ maxWidth: 320 }}
        >
          {/* Soft floor shadow */}
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 -bottom-8 w-[80%] h-12 rounded-full blur-2xl opacity-50"
            style={{ background: "hsl(var(--primary) / 0.35)" }}
          />

          {/* Phone bezel */}
          <div
            className="relative rounded-[44px] p-[10px] shadow-2xl"
            style={{
              background:
                "linear-gradient(160deg, hsl(var(--background) / 0.12), hsl(var(--background) / 0.04))",
              border: "1px solid hsl(var(--background) / 0.15)",
            }}
          >
            <div
              className="relative rounded-[36px] overflow-hidden bg-black"
              style={{ aspectRatio: "9 / 19.5" }}
            >
              {/* Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-black z-20" />

              <video
                ref={videoRef}
                src="/vyana-demo.mp4"
                playsInline
                muted
                loop
                preload="metadata"
                className="w-full h-full object-cover"
              />

              {/* Mute toggle */}
              <button
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="absolute bottom-3 right-3 z-20 h-9 w-9 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 flex items-center justify-center text-white hover:bg-black/75 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-12 text-center text-[13px] text-background/50 italic">
          Plays automatically. Tap the speaker for sound.
        </p>
      </div>
    </section>
  );
};

export default WatchItWork;
