export const CUSTOMER_WEB_ORIGIN = "https://www.vyana.care";
export const NATIVE_OAUTH_REDIRECT = "vyana://oauth-callback/";

export const buildCustomerWebUrl = (path = "/") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${CUSTOMER_WEB_ORIGIN}${normalizedPath}`;
};

export const buildEmergencyAccessUrl = (token: string) =>
  buildCustomerWebUrl(`/emergency-access/${token}`);