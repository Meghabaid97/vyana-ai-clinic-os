import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";

const DemoFilm = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const header = useReveal<HTMLDivElement>();
  const frame = useReveal<HTMLDivElement>();

  // Auto-play muted when scrolled into view; pause when out of view
  useEffect(() => {
    const el = sectionRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: [0.5] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  return (
    <section
      ref={sectionRef}
      id="demo"
      className="relative bg-background py-28 lg:py-36"
    >
      <div className="max-w-[1240px] mx-auto px-6 lg:px-12">
        <div
          ref={header.ref}
          className={`reveal ${header.visible ? "is-visible" : ""} max-w-[760px] mb-14`}
        >
          <p className="font-serif italic text-[15px] text-primary/90 mb-5">
            See it in motion
          </p>
          <h2 className="font-serif text-4xl sm:text-6xl lg:text-[68px] leading-[1.02] tracking-[-0.02em] text-foreground">
            Ninety seconds.
            <br />
            <em className="italic text-primary font-normal">The whole product.</em>
          </h2>
          <p className="mt-6 text-[17px] leading-[1.65] text-foreground/75 max-w-[560px]">
            Watch a real prescription become a doctor-ready briefing, with
            trends, medications and flags surfaced along the way.
          </p>
        </div>

        <div
          ref={frame.ref}
          className={`reveal ${frame.visible ? "is-visible" : ""} relative rounded-2xl overflow-hidden glass-card group`}
        >
          <video
            ref={videoRef}
            src="/vyana-demo.mp4"
            playsInline
            muted
            loop
            preload="metadata"
            className="w-full h-auto aspect-video object-cover block"
            onClick={togglePlay}
          />

          {/* Bottom controls bar, minimal, only on hover */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 py-4 bg-gradient-to-t from-black/55 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="w-10 h-10 rounded-full bg-white/95 text-foreground flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>
            <button
              onClick={toggleMute}
              className="text-[12px] tracking-[0.2em] uppercase text-white/85 hover:text-white px-3 py-1.5 rounded-full bg-black/30 border border-white/15"
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
          </div>
        </div>

        <p className="mt-5 text-[13px] text-muted-foreground italic">
          Demo plays automatically when in view. Tap to pause, unmute for the founder narration.
        </p>
      </div>
    </section>
  );
};

export default DemoFilm;
