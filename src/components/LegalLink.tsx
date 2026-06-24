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
            flex flex-col max-w-none w-full h-full p-0 gap-0 overflow-hidden rounded-none border-0
            sm:max-w-2xl sm:h-[85vh] sm:max-h-[85vh] sm:rounded-xl sm:border sm:border-border/60
            inset-0 translate-x-0 translate-y-0
            sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]
          "
        >
          <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
            <DialogTitle className="text-lg font-bold text-foreground">Legal</DialogTitle>
          </DialogHeader>
          <div
            className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <LegalContent defaultSection={section} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
