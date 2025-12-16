// Utility functions for formatting and masking sensitive data

/**
 * Masks a health ID showing only last 4 characters
 * Example: "1234567890" -> "******7890"
 */
export const maskHealthId = (healthId: string): string => {
  if (!healthId || healthId.length <= 4) return healthId;
  const visible = healthId.slice(-4);
  const masked = "*".repeat(healthId.length - 4);
  return `${masked}${visible}`;
};

/**
 * Generates catchy eco-impact messages
 */
export const getEcoMessage = (
  consultations: number,
  type: "doctor" | "patient" = "doctor"
): string => {
  const paperSaved = consultations * 5;
  const treeImpact = Math.floor(paperSaved / 8000); // ~8000 sheets per tree

  if (consultations === 0) {
    return type === "doctor"
      ? "Start your paperless journey! Every digital consultation saves 5 sheets 🌱"
      : "Go green with your health records! Join the digital revolution 🌿";
  }

  if (consultations < 5) {
    return `${consultations} digital records = ${paperSaved} sheets saved! You're an eco-starter 🌱`;
  }

  if (consultations < 20) {
    return `🎉 ${paperSaved} sheets saved! That's ${Math.round(paperSaved * 0.005)} kg of CO₂ prevented`;
  }

  if (consultations < 50) {
    return `🌳 Eco-champion! ${paperSaved} sheets = saving a small forest patch`;
  }

  if (treeImpact >= 1) {
    return `🏆 Legendary! You've saved the equivalent of ${treeImpact} tree${treeImpact > 1 ? "s" : ""}!`;
  }

  return `💚 ${paperSaved} sheets saved digitally — the planet thanks you!`;
};

/**
 * Format rating to display stars
 */
export const formatRating = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return "★".repeat(fullStars) + (hasHalf ? "½" : "") + "☆".repeat(5 - fullStars - (hasHalf ? 1 : 0));
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};