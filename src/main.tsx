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

const handleOAuthCallback = async (url: string) => {
  // Hard guard: never process the same launch URL twice in a row.
  if (wasUrlAlreadyHandled(url)) return;
  markUrlHandled(url);

  try {
    await closeInAppBrowser();

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
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      safeRedirect("/welcome");
      return;
    }

    if (authCode) {
      const { error } = await supabase.auth.exchangeCodeForSession(authCode);
      if (error) throw error;
      safeRedirect("/welcome");
      return;
    }

    // No tokens AND no code in the callback URL (the bare `vyana://oauth-callback/`
    // case from the logs). The session may already have been set by the in-app
    // browser before it closed — check before redirecting, otherwise just stay
    // put. Do NOT bounce to /splash, that re-triggers getLaunchUrl → loop.
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      safeRedirect("/welcome");
    }
    // Else: leave the user on whatever page they're on (typically /auth) and
    // let them retry. The Auth page already has a timeout + error UI.
  } catch (error) {
    console.error("Failed to handle OAuth callback", error);
    // Don't redirect on failure — that re-enters the loop. Surface via console.
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
