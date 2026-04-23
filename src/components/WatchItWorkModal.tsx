import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Volume2, VolumeX, X, Play } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WatchItWorkModal = ({ open, onOpenChange }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (open) {
      setHasError(false);
      setShowControls(false);
      try { v.currentTime = 0; } catch {}
      v.muted = true;
      setIsMuted(true);
      // Try to autoplay muted (allowed on most browsers). Fall back to a
      // tap-to-play overlay if blocked (iOS native WebView, low-power mode).
      const p = v.play();
      if (p && typeof p.then === "function") {
        p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }, [open]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  const manualPlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    setIsMuted(true);
    v.play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        // Last-resort: expose native controls so the user can definitely play.
        setShowControls(true);
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden border-border bg-background">
        <DialogTitle className="sr-only">Watch Vyana in action</DialogTitle>
        <DialogDescription className="sr-only">
          A short demo video showing how Vyana organizes your health records.
        </DialogDescription>

        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          className="absolute right-3 top-3 z-30 h-8 w-8 rounded-full bg-background/80 hover:bg-muted flex items-center justify-center text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-5 pt-10">
          <div className="text-center mb-4">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-1">
              Watch it work
            </p>
            <h2 className="text-[18px] font-bold text-foreground leading-tight">
              This is what living with{" "}
              <span className="text-primary">Vyana</span> feels like.
            </h2>
          </div>

          {/* Phone mockup */}
          <div className="relative mx-auto" style={{ maxWidth: 240 }}>
            <div className="relative rounded-[36px] p-[8px] shadow-xl bg-foreground/90">
              <div
                className="relative rounded-[30px] overflow-hidden bg-black"
                style={{ aspectRatio: "9 / 19.5" }}
              >
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-black z-20" />
                <video
                  ref={videoRef}
                  src="/vyana-demo.mp4"
                  playsInline
                  muted
                  loop
                  autoPlay
                  preload="auto"
                  controls={showControls}
                  controlsList="nodownload noplaybackrate"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={() => setHasError(true)}
                  onLoadedData={() => {
                    const v = videoRef.current;
                    if (v && v.paused) v.play().catch(() => setShowControls(true));
                  }}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Tap-to-play overlay (autoplay blocked) */}
                {!isPlaying && !hasError && !showControls && (
                  <button
                    onClick={manualPlay}
                    aria-label="Play video"
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 text-white"
                  >
                    <span className="h-14 w-14 rounded-full bg-white/95 text-foreground flex items-center justify-center">
                      <Play className="h-6 w-6 fill-current ml-0.5" />
                    </span>
                  </button>
                )}

                {hasError && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black text-white text-[12px] px-4 text-center gap-3">
                    <span>Demo video could not load.</span>
                    <button
                      onClick={() => {
                        const v = videoRef.current;
                        if (!v) return;
                        setHasError(false);
                        v.load();
                        v.play().catch(() => setShowControls(true));
                      }}
                      className="rounded-full bg-white/15 hover:bg-white/25 px-3 py-1.5 text-[11px] font-medium"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!showControls && (
                  <button
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                    className="absolute bottom-2.5 right-2.5 z-30 h-8 w-8 rounded-full bg-black/55 border border-white/15 flex items-center justify-center text-white"
                  >
                    {isMuted ? (
                      <VolumeX className="h-3.5 w-3.5" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-[12px] text-muted-foreground">
            Tap the speaker for sound.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WatchItWorkModal;
