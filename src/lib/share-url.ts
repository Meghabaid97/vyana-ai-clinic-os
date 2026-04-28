/**
 * Build a public share URL for a given record/emergency access token.
 *
 * We always anchor share links to the production customer domain so that
 * recipients (doctors, family) never see a Lovable preview/published URL.
 * In native (Capacitor) builds `window.location.origin` is the in-app shell
 * (e.g. `capacitor://localhost`) which is not a clickable web URL either.
 */
const PRODUCTION_ORIGIN = "https://www.vyana.care";

const isUsableWebOrigin = (origin: string | undefined | null): boolean => {
  if (!origin) return false;
  if (!origin.startsWith("http")) return false;
  if (origin.includes("lovable.app")) return false;
  if (origin.includes("lovableproject.com")) return false;
  return true;
};

export const getShareOrigin = (): string => {
  if (typeof window === "undefined") return PRODUCTION_ORIGIN;
  const origin = window.location?.origin;
  return isUsableWebOrigin(origin) ? origin! : PRODUCTION_ORIGIN;
};

export const buildEmergencyAccessUrl = (token: string): string =>
  `${getShareOrigin()}/emergency-access/${token}`;
