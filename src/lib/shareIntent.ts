import { Capacitor } from "@capacitor/core";

/**
 * Wires up the native Share Intent listener (iOS Share Extension / Android intent filter).
 * When a user shares a PDF/image to Vyana from another app (e.g. WhatsApp),
 * we navigate to /app/share-receive with the file payload in sessionStorage.
 *
 * Web/preview: no-op. Only fires on native iOS/Android builds.
 */
export async function initShareIntent(navigate: (path: string) => void) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { SendIntent } = await import("@mindlib-capacitor/send-intent");

    const handle = async (result: any) => {
      if (!result?.url) return;
      try {
        // result.url is a content:// or file:// URI on Android, or a file path on iOS
        // result.type is the MIME type
        const payload = {
          url: result.url as string,
          type: (result.type as string) || "",
          title: (result.title as string) || "Shared file",
          receivedAt: Date.now(),
        };
        sessionStorage.setItem("vyana_pending_shared_file", JSON.stringify(payload));
        navigate("/app/share-receive");
      } catch (e) {
        console.error("Failed to handle share intent payload", e);
      }
    };

    // Cold start: app was launched by the share
    try {
      const initial = await SendIntent.checkSendIntentReceived();
      if (initial) await handle(initial);
    } catch {
      // no pending intent, ignore
    }

    // Warm: app already open, new share arrives
    window.addEventListener("sendIntentReceived", async () => {
      try {
        const result = await SendIntent.checkSendIntentReceived();
        if (result) await handle(result);
      } catch (e) {
        console.error("sendIntentReceived handler failed", e);
      }
    });
  } catch (e) {
    console.error("send-intent plugin not available", e);
  }
}

/**
 * Reads native file URI into a browser File object.
 * Uses fetch() which works for content://, file://, and http(s):// URIs in Capacitor WebView.
 */
export async function readSharedFile(url: string, mimeType: string, fileName: string): Promise<File> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], fileName, { type: mimeType || blob.type || "application/octet-stream" });
}
