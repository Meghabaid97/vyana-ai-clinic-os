const DemoFilm = () => {
  return (
    <section id="story" className="py-24 lg:py-32 bg-background">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-12">
        <div className="max-w-[640px] mb-12">
          <p className="font-serif italic text-[15px] text-foreground/65 mb-4">
            A 90-second film
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl leading-[1.05] tracking-[-0.02em] text-foreground">
            What it feels like
            <br />
            <em className="italic text-primary font-normal">to be remembered.</em>
          </h2>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-border shadow-[0_30px_80px_-20px_rgba(0,0,0,0.25)] bg-muted/20">
          <video
            src="/vyana-demo.mp4"
            controls
            playsInline
            preload="metadata"
            poster=""
            className="w-full h-auto aspect-video object-cover"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        <p className="mt-6 text-[13px] text-muted-foreground italic max-w-[640px]">
          Every prescription, every lab, every visit, quietly stitched into one
          continuous health story.
        </p>
      </div>
    </section>
  );
};

export default DemoFilm;
