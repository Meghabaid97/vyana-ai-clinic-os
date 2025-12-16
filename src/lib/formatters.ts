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
 * Encodes a health ID for URL usage (base64)
 */
export const encodePatientId = (healthId: string): string => {
  return btoa(healthId).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

/**
 * Decodes a patient ID from URL back to health ID
 */
export const decodePatientId = (encodedId: string): string => {
  try {
    const base64 = encodedId.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    const paddedBase64 = padding ? base64 + '='.repeat(4 - padding) : base64;
    return atob(paddedBase64);
  } catch {
    return encodedId;
  }
};

/**
 * Generates catchy eco-impact messages with tree/nature focus
 */
export const getEcoMessage = (
  consultations: number,
  type: "doctor" | "patient" = "doctor"
): string => {
  const paperSaved = consultations * 5;
  const treesContribution = (paperSaved / 8000); // ~8000 sheets = 1 tree
  const waterSavedLiters = (paperSaved * 0.01).toFixed(1); // ~10ml per sheet = 0.01L
  const co2SavedGrams = Math.round(paperSaved * 5); // ~5g CO2 per sheet

  if (consultations === 0) {
    return type === "doctor"
      ? "🌱 Start your green healthcare journey! Each digital consultation saves 5 sheets of paper. Plant the seed of change!"
      : "🌿 Join the GREEN HEALTH REVOLUTION! Go paperless, save trees, heal the planet! 🌍";
  }

  if (consultations < 5) {
    return `🌱 ${paperSaved} sheets saved = ${treesContribution.toFixed(4)} trees protected! Every sheet counts toward a greener future! 🌿`;
  }

  if (consultations < 10) {
    return `🌿 ${paperSaved} sheets saved = ${treesContribution.toFixed(3)} trees + ${waterSavedLiters}L water + ${co2SavedGrams}g CO₂ prevented! Growing green! 🌍`;
  }

  if (consultations < 25) {
    return `🌳 ECO-WARRIOR! ${paperSaved} sheets = ${treesContribution.toFixed(3)} trees protected + ${co2SavedGrams}g CO₂ stopped! Keep growing the forest! 💚`;
  }

  if (consultations < 50) {
    return `🌲 FOREST GUARDIAN! ${paperSaved} sheets = ${treesContribution.toFixed(2)} trees saved + ${waterSavedLiters}L water preserved! You're a PLANET HERO! 🏆`;
  }

  if (consultations < 100) {
    return `🏆 GREEN CHAMPION! ${paperSaved} sheets = ${treesContribution.toFixed(2)} trees protected! Leading the GREEN REVOLUTION! 🌍💚`;
  }

  return `🌍 PLANET HERO! ${paperSaved}+ sheets = ${treesContribution.toFixed(1)}+ trees saved! You're LEADING the GREEN HEALTHCARE REVOLUTION! 💚🌳🏆`;
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