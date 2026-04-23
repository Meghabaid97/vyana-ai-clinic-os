import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

/**
 * TabsList — also tracks the active trigger and renders a sliding pill
 * indicator behind it. The pill animates between options for a native feel.
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const localRef = React.useRef<HTMLDivElement | null>(null);
  const [pill, setPill] = React.useState<{ left: number; top: number; width: number; height: number } | null>(null);

  // Merge refs
  React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

  const measure = React.useCallback(() => {
    const list = localRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>('[data-state="active"]');
    if (!active) {
      setPill(null);
      return;
    }
    const listBox = list.getBoundingClientRect();
    const box = active.getBoundingClientRect();
    setPill({
      left: box.left - listBox.left + list.scrollLeft,
      top: box.top - listBox.top + list.scrollTop,
      width: box.width,
      height: box.height,
    });
  }, []);

  React.useEffect(() => {
    measure();
    const list = localRef.current;
    if (!list) return;

    // Re-measure when active state changes on triggers
    const mo = new MutationObserver(() => measure());
    list.querySelectorAll('[role="tab"]').forEach((el) => {
      mo.observe(el, { attributes: true, attributeFilter: ["data-state"] });
    });

    // Re-measure on resize
    const ro = new ResizeObserver(() => measure());
    ro.observe(list);

    window.addEventListener("resize", measure);
    return () => {
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, children]);

  return (
    <TabsPrimitive.List
      ref={localRef}
      className={cn(
        "relative inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...props}
    >
      {pill && (
        <span
          aria-hidden
          className="pointer-events-none absolute z-0 rounded-sm bg-background shadow-sm motion-reduce:transition-none"
          style={{
            left: pill.left,
            top: pill.top,
            width: pill.width,
            height: pill.height,
            transition: "left 320ms cubic-bezier(0.22, 1, 0.36, 1), top 320ms cubic-bezier(0.22, 1, 0.36, 1), width 320ms cubic-bezier(0.22, 1, 0.36, 1), height 320ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      )}
      {children}
    </TabsPrimitive.List>
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // The sliding pill renders the active background, so we make the
      // trigger's own active background transparent and just animate text color.
      "relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/**
 * TabsContent — cross-fades + slight rise when becoming active. Uses
 * data-state attribute from Radix; honors prefers-reduced-motion.
 */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "data-[state=inactive]:hidden",
      "data-[state=active]:animate-tab-content-in motion-reduce:animate-none",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
