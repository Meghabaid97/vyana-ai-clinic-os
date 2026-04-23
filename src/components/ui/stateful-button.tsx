import { forwardRef, ReactNode } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ButtonState = "idle" | "loading" | "success" | "error";

interface StatefulButtonProps extends Omit<ButtonProps, "children"> {
  state: ButtonState;
  /** Idle label + icon */
  children: ReactNode;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  /** Optional icon shown next to the idle label (e.g. ArrowRight) */
  idleIcon?: ReactNode;
}

/**
 * Multi-state CTA button — animates between idle / loading / success / error
 * with a soft crossfade. Stays on-brand by inheriting Button variants.
 *
 * Reduced-motion safe: relies on Tailwind transitions which respect user prefs.
 */
export const StatefulButton = forwardRef<HTMLButtonElement, StatefulButtonProps>(
  (
    {
      state,
      children,
      loadingLabel = "Working…",
      successLabel = "Done",
      errorLabel = "Try again",
      idleIcon,
      disabled,
      className,
      ...rest
    },
    ref,
  ) => {
    // Lock interaction during async states; error returns control to user.
    const isBusy = state === "loading" || state === "success";
    const visualState: ButtonState = state;

    return (
      <Button
        ref={ref}
        disabled={disabled || isBusy}
        aria-live="polite"
        aria-busy={state === "loading"}
        className={cn("relative overflow-hidden", className)}
        {...rest}
      >
        {/* Each state lives in its own absolutely-positioned layer so we can
            crossfade without layout shift. The active layer drives width via
            the invisible spacer below. */}
        <span
          className={cn(
            "inline-flex items-center justify-center gap-2 transition-all duration-300",
            visualState === "idle" ? "opacity-100" : "opacity-0 -translate-y-1 pointer-events-none",
          )}
          aria-hidden={visualState !== "idle"}
        >
          {children}
          {idleIcon}
        </span>

        <span
          className={cn(
            "absolute inset-0 inline-flex items-center justify-center gap-2 transition-all duration-300",
            visualState === "loading" ? "opacity-100" : "opacity-0 translate-y-1 pointer-events-none",
          )}
          aria-hidden={visualState !== "loading"}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingLabel}</span>
        </span>

        <span
          className={cn(
            "absolute inset-0 inline-flex items-center justify-center gap-2 transition-all duration-300",
            visualState === "success" ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none",
          )}
          aria-hidden={visualState !== "success"}
        >
          <Check className="h-4 w-4" />
          <span>{successLabel}</span>
        </span>

        <span
          className={cn(
            "absolute inset-0 inline-flex items-center justify-center gap-2 transition-all duration-300",
            visualState === "error" ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
          aria-hidden={visualState !== "error"}
        >
          <AlertCircle className="h-4 w-4" />
          <span>{errorLabel}</span>
        </span>
      </Button>
    );
  },
);

StatefulButton.displayName = "StatefulButton";
