import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "text-primary-foreground rounded-full font-semibold bg-[image:var(--gradient-primary)] shadow-[var(--shadow-cta)] hover:brightness-[1.03] active:scale-[0.98] transition-all",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full",
        outline:
          "border border-border bg-card hover:bg-muted text-foreground rounded-full shadow-[var(--shadow-card)]",
        secondary:
          "bg-card text-foreground rounded-full shadow-[var(--shadow-card)] hover:bg-muted/40",
        ghost: "hover:bg-muted hover:text-foreground rounded-full",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "text-primary-foreground rounded-full font-semibold bg-[image:var(--gradient-primary)] shadow-[var(--shadow-cta)] hover:brightness-[1.03]",
        premium:
          "text-primary-foreground rounded-full font-semibold bg-[image:var(--gradient-primary)] shadow-[var(--shadow-cta)] hover:brightness-[1.05] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300 ease-out motion-reduce:transform-none motion-reduce:transition-none",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-4 text-[13px]",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
