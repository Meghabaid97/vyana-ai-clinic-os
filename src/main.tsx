import { createRoot } from "react-dom/client";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import { supabase } from "@/integrations/supabase/client";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
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
    const { Browser } = await import("@capacitor/browser");
    await Browser.close();
  } catch {
    // Browser plugin not available — ignore.
  }
};

const handleOAuthCallback = async (url: string) => {
  try {
    await closeInAppBrowser();

    const parsedUrl = new URL(url);
    const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
    const queryParams = parsedUrl.searchParams;

    const accessToken = hashParams.get("access_token") ?? queryParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token") ?? queryParams.get("refresh_token");
    const authCode = queryParams.get("code") ?? hashParams.get("code");

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } else if (authCode) {
      const { error } = await supabase.auth.exchangeCodeForSession(authCode);
      if (error) throw error;
    }

    window.location.replace("/app");
  } catch (error) {
    console.error("Failed to handle OAuth callback", error);
    window.location.replace("/splash");
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
