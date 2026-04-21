import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Volume2, VolumeX, X } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WatchItWorkModal = ({ open, onOpenChange }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (open) {
      v.currentTime = 0;
      v.muted = true;
      setIsMuted(true);
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [open]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden border-border bg-background">
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
            <div
              className="relative rounded-[36px] p-[8px] shadow-xl bg-foreground/90"
            >
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
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  className="absolute bottom-2.5 right-2.5 z-20 h-8 w-8 rounded-full bg-black/55 border border-white/15 flex items-center justify-center text-white"
                >
                  {isMuted ? (
                    <VolumeX className="h-3.5 w-3.5" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </button>
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
