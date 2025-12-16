import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ConsultationRatingProps {
  consultationId: string;
  doctorId: string;
  patientId: string;
  existingRating?: number;
  existingReview?: string;
  onRatingSubmit?: () => void;
}

const ConsultationRating = ({
  consultationId,
  doctorId,
  patientId,
  existingRating,
  existingReview,
  onRatingSubmit,
}: ConsultationRatingProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(existingRating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState(existingReview || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Please select a rating",
        description: "Tap on the stars to rate your consultation",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("doctor_ratings").insert({
        doctor_id: doctorId,
        patient_id: patientId,
        appointment_id: consultationId, // Using consultation ID as appointment reference
        rating,
        review: review.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Rating submitted!",
        description: "Thank you for your feedback",
      });
      setIsOpen(false);
      onRatingSubmit?.();
    } catch (error: any) {
      console.error("Rating error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={existingRating 
          ? "gap-1 bg-primary/10 border-primary/30 text-primary hover:bg-primary/20" 
          : "gap-1"
        }
      >
        {existingRating ? (
          <>
            <Star className="h-4 w-4 fill-primary text-primary" />
            {existingRating}
          </>
        ) : (
          <>
            <Star className="h-4 w-4" />
            Rate
          </>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Consultation</DialogTitle>
            <DialogDescription>
              How was your experience with this consultation?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Star Rating */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 transition-colors ${
                        star <= displayRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {displayRating === 1 && "Poor"}
                {displayRating === 2 && "Fair"}
                {displayRating === 3 && "Good"}
                {displayRating === 4 && "Very Good"}
                {displayRating === 5 && "Excellent"}
              </p>
            </div>

            {/* Review */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Review (optional)
              </label>
              <Textarea
                placeholder="Share your experience..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConsultationRating;
