import { createRoot } from "react-dom/client";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import { supabase } from "@/integrations/supabase/client";
import { NativeBrowser } from "@/lib/nativeCapacitorPlugins";
// Instrument Serif + Inter are loaded once via <link> in index.html.
// Don't re-import @fontsource/instrument-serif here — it ships the same
// font files a second time and blocks first paint.
import "./index.css";

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add("capacitor");
}

const OAUTH_CALLBACK_HOST = "oauth-callback";
const NATIVE_OAUTH_PROTOCOLS = new Set(["vyana:"]);
const NATIVE_BROWSER_OPEN_KEY = "vyana-native-oauth-browser-open";
const OAUTH_ERROR_KEY = "vyana-oauth-error";
const OAUTH_FAILED_EVENT = "vyana-oauth-failed";

const isOAuthCallbackUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    return NATIVE_OAUTH_PROTOCOLS.has(parsedUrl.protocol) && parsedUrl.host === OAUTH_CALLBACK_HOST;
  } catch {
    return false;
  }
};

const closeInAppBrowser = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (sessionStorage.getItem(NATIVE_BROWSER_OPEN_KEY) !== "1") return;
    sessionStorage.removeItem(NATIVE_BROWSER_OPEN_KEY);
  } catch {
    // If storage is unavailable, do not risk calling close on a missing window.
    return;
  }

  try {
    await NativeBrowser.close();
  } catch {
    // Browser plugin not available or no active SafariViewController — ignore.
  }
};

const notifyOAuthFailure = (message: string) => {
  try {
    sessionStorage.setItem(OAUTH_ERROR_KEY, message);
  } catch {
    // Ignore storage errors.
  }
  window.dispatchEvent(new CustomEvent(OAUTH_FAILED_EVENT, { detail: { message } }));
};

const parseCallbackParams = (parsedUrl: URL) => {
  const directHashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
  const directQueryParams = parsedUrl.searchParams;
  const payloadParams = new URLSearchParams();
  const payload = directQueryParams.get("payload");

  if (payload) {
    const trimmed = payload.trim();
    const hashIndex = trimmed.indexOf("#");
    const queryPart = (hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed).replace(/^\?/, "");
    const hashPart = hashIndex >= 0 ? trimmed.slice(hashIndex + 1) : trimmed.replace(/^#/, "");

    new URLSearchParams(queryPart).forEach((value, key) => payloadParams.set(key, value));
    new URLSearchParams(hashPart).forEach((value, key) => payloadParams.set(key, value));
  }

  return {
    get: (key: string) => payloadParams.get(key) ?? directHashParams.get(key) ?? directQueryParams.get(key),
  };
};

// Persist across WebView reloads so the same launch URL is never processed twice.
// (localStorage survives `window.location.replace`; a module-level flag would not.)
const HANDLED_URL_KEY = "vyana-oauth-handled-url";
const HANDLED_AT_KEY = "vyana-oauth-handled-at";
const HANDLE_DEDUPE_MS = 60_000;

const wasUrlAlreadyHandled = (url: string) => {
  try {
    const handledUrl = localStorage.getItem(HANDLED_URL_KEY);
    const handledAt = Number(localStorage.getItem(HANDLED_AT_KEY) ?? "0");
    if (handledUrl !== url) return false;
    return Date.now() - handledAt < HANDLE_DEDUPE_MS;
  } catch {
    return false;
  }
};

const markUrlHandled = (url: string) => {
  try {
    localStorage.setItem(HANDLED_URL_KEY, url);
    localStorage.setItem(HANDLED_AT_KEY, String(Date.now()));
  } catch {
    // Ignore storage errors (private mode, quota).
  }
};

const safeRedirect = (path: string) => {
  // Avoid replace() if we're already there — that would just retrigger reload.
  if (window.location.pathname === path) return;
  window.location.replace(path);
};

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Poll supabase.auth.getSession() until it returns a session or we exhaust
// the budget. This gives the Supabase client time to parse incoming OAuth
// tokens from storage / URL before we hard-redirect away from /auth.
const waitForSession = async (timeoutMs = 2500, intervalMs = 150) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session;
    await delay(intervalMs);
  }
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

const handleOAuthCallback = async (url: string) => {
  // Hard guard: never process the same launch URL twice in a row.
  if (wasUrlAlreadyHandled(url)) return;
  markUrlHandled(url);

  // Fire-and-forget close so a missing browser window can never halt the flow.
  void closeInAppBrowser();

  try {
    const parsedUrl = new URL(url);
    const params = parseCallbackParams(parsedUrl);

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const authCode = params.get("code");
    const returnedState = params.get("state");
    const callbackError = params.get("error_description") ?? params.get("error");
    const expectedState = sessionStorage.getItem("vyana-oauth-state");

    if (callbackError) {
      throw new Error(callbackError);
    }

    if (expectedState && returnedState && returnedState !== expectedState) {
      throw new Error("OAuth state mismatch");
    }
    sessionStorage.removeItem("vyana-oauth-state");

    if (accessToken && refreshToken) {
      // Set the session before redirecting. If we redirect first, the WebView
      // reload can interrupt token persistence and leave the user spinning.
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      safeRedirect("/welcome");
      return;
    }

    if (authCode) {
      await supabase.auth.exchangeCodeForSession(authCode);
      safeRedirect("/welcome");
      return;
    }

    // No tokens AND no code in the callback URL. Session may already be set by
    // the in-app browser. Wait briefly, then redirect regardless so the user
    // never sees an endless spinner.
    const session = await waitForSession(1500);
    if (session) {
      safeRedirect("/welcome");
    } else {
      notifyOAuthFailure("Google sign-in did not return a session. Please try again.");
      safeRedirect("/auth");
    }
  } catch (error) {
    console.error("Failed to handle OAuth callback", error);
    notifyOAuthFailure("Google sign-in could not be completed. Please try again.");
    safeRedirect("/auth");
  }
};


void CapacitorApp.addListener("appUrlOpen", ({ url }) => {
  if (!url || !isOAuthCallbackUrl(url)) return;
  void handleOAuthCallback(url);
});

void CapacitorApp.getLaunchUrl().then((result) => {
  const url = result?.url;
  if (!url || !isOAuthCallbackUrl(url)) return;
  void handleOAuthCallback(url);
});

// Safety net: on native, whenever a Supabase session is established
// (e.g. an OAuth flow that returned to the web URL inside the in-app Browser
// sheet), close the in-app browser so the user is not stuck looking at the
// vyana.care chrome inside an iOS browser sheet.
if (Capacitor.isNativePlatform()) {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      void closeInAppBrowser();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
