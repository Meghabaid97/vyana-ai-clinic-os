import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { startRazorpayCheckout, type RazorpayCheckoutOptions, type RazorpaySuccess } from "@/lib/razorpay";

interface Props extends Omit<ButtonProps, "onClick" | "onError"> {
  /** Checkout config (amount in paise). */
  options: RazorpayCheckoutOptions;
  /** Called after successful, signature-verified payment. */
  onSuccess?: (payment: RazorpaySuccess) => void;
  /** Called on cancel or failure. */
  onError?: (err: Error) => void;
  children?: React.ReactNode;
}

export function RazorpayCheckoutButton({
  options,
  onSuccess,
  onError,
  children = "Pay now",
  disabled,
  ...buttonProps
}: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await startRazorpayCheckout(options);
      onSuccess?.(result);
      toast({ title: "Payment successful", description: result.razorpay_payment_id });
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Payment failed");
      if (e.message !== "Payment cancelled") {
        toast({ title: "Payment failed", description: e.message, variant: "destructive" });
      }
      onError?.(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button {...buttonProps} disabled={disabled || loading} onClick={handleClick}>
      {loading ? "Opening checkout…" : children}
    </Button>
  );
}
