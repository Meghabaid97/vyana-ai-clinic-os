import { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { LegalContent } from "@/components/LegalContent";

export const LegalLink = ({
  section,
  children,
  className,
}: {
  section: "terms" | "privacy";
  children: React.ReactNode;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <a
        href={section === "privacy" ? "/legal#privacy" : "/legal"}
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        className={className ?? "text-primary underline cursor-pointer"}
      >
        {children}
      </a>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="inset-x-4 bottom-4 top-12 flex flex-col gap-0 overflow-hidden rounded-2xl border border-border/60 p-0 [&>button]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <SheetTitle className="sr-only">Legal</SheetTitle>
          <LegalContent defaultSection={section} onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};
