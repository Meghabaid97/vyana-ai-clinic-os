import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="
            flex flex-col max-w-none w-full h-full p-0 gap-0 overflow-y-auto rounded-none border-0
            sm:max-w-2xl sm:h-[85vh] sm:max-h-[85vh] sm:rounded-xl sm:border sm:border-border/60
            inset-0 translate-x-0 translate-y-0
            sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]
          "
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <DialogHeader className="sticky top-0 z-10 px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
            <DialogTitle className="text-lg font-bold text-foreground">Legal</DialogTitle>
          </DialogHeader>
          <div className="p-4 sm:p-6">
            <LegalContent defaultSection={section} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
