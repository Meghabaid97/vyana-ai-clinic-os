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

const isOAuthCallbackUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    return NATIVE_OAUTH_PROTOCOLS.has(parsedUrl.protocol) && parsedUrl.host === OAUTH_CALLBACK_HOST;
  } catch {
    return false;
  }
};

const closeInAppBrowser = async () => {
  try {
    await NativeBrowser.close();
  } catch {
    // Browser plugin not available — ignore.
  }
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
    const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
    const queryParams = parsedUrl.searchParams;

    const accessToken = hashParams.get("access_token") ?? queryParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token") ?? queryParams.get("refresh_token");
    const authCode = queryParams.get("code") ?? hashParams.get("code");
    const returnedState = hashParams.get("state") ?? queryParams.get("state");
    const expectedState = sessionStorage.getItem("vyana-oauth-state");

    if (expectedState && returnedState && returnedState !== expectedState) {
      throw new Error("OAuth state mismatch");
    }
    sessionStorage.removeItem("vyana-oauth-state");

    if (accessToken && refreshToken) {
      // Redirect immediately so the user sees the app, then set the session in
      // the background. AppShell's auth listener will pick it up.
      void supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      safeRedirect("/welcome");
      return;
    }

    if (authCode) {
      void supabase.auth.exchangeCodeForSession(authCode);
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
      safeRedirect("/auth");
    }
  } catch (error) {
    console.error("Failed to handle OAuth callback", error);
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
