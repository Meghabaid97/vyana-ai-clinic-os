import { createRoot } from "react-dom/client";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import App from "./App.tsx";
import { supabase } from "@/integrations/supabase/client";
import "./index.css";

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add("capacitor");
}

const handleOAuthCallback = async (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const hashParams = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
    const queryParams = parsedUrl.searchParams;

    const accessToken = hashParams.get("access_token") ?? queryParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token") ?? queryParams.get("refresh_token");

    if (accessToken && refreshToken) {
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    }
  } catch (error) {
    console.error("Failed to handle OAuth callback", error);
  }
};

void CapacitorApp.addListener("appUrlOpen", ({ url }) => {
  if (!url) return;
  if (url.startsWith("lovable://oauth-callback")) {
    void handleOAuthCallback(url);
  }
});

void CapacitorApp.getLaunchUrl().then((result) => {
  const url = result?.url;
  if (url?.startsWith("lovable://oauth-callback")) {
    void handleOAuthCallback(url);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
