import { Capacitor } from "@capacitor/core";

/**
 * Pick an image, preferring the native Capacitor Camera plugin on iOS/Android.
 *
 * Why this exists: on iOS, opening the system camera from a WebView <input type="file" capture>
 * triggers AVFoundation which REQUIRES NSCameraUsageDescription / NSPhotoLibraryUsageDescription
 * in Info.plist. Without them, iOS terminates the app instantly (Apple Review 2.1(a) crash).
 *
 * The @capacitor/camera plugin handles permission prompts and falls back gracefully.
 * On web, we fall back to the standard <input type="file"> chooser.
 */
export type PickSource = "camera" | "gallery" | "prompt";

export interface PickedImage {
  file: File;
  dataUrl: string;
}

const dataUrlToFile = (dataUrl: string, name: string, mime: string): File => {
  const [header, b64] = dataUrl.split(",");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: mime || header.match(/data:(.*);base64/)?.[1] || "image/jpeg" });
};

export async function pickImage(source: PickSource = "prompt"): Promise<PickedImage | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");

      // Ensure permissions are explicitly requested before opening the camera UI.
      try {
        const perm = await Camera.checkPermissions();
        const needsCamera = source !== "gallery" && perm.camera !== "granted";
        const needsPhotos = source !== "camera" && perm.photos !== "granted" && perm.photos !== "limited";
        if (needsCamera || needsPhotos) {
          await Camera.requestPermissions({
            permissions: [
              ...(needsCamera ? (["camera"] as const) : []),
              ...(needsPhotos ? (["photos"] as const) : []),
            ],
          });
        }
      } catch {
        // Older plugin versions may not support checkPermissions; ignore.
      }

      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source:
          source === "camera"
            ? CameraSource.Camera
            : source === "gallery"
            ? CameraSource.Photos
            : CameraSource.Prompt,
        promptLabelHeader: "Add prescription",
        promptLabelPhoto: "Choose from library",
        promptLabelPicture: "Take photo",
      });
      if (!photo.dataUrl) return null;
      const mime = `image/${photo.format || "jpeg"}`;
      const file = dataUrlToFile(photo.dataUrl, `capture-${Date.now()}.${photo.format || "jpg"}`, mime);
      return { file, dataUrl: photo.dataUrl };
    } catch (err: any) {
      // User cancelled or permission denied - swallow silently.
      if (typeof err?.message === "string" && /cancell?ed|denied/i.test(err.message)) return null;
      throw err;
    }
  }
  return null; // web caller should fall back to <input type="file">
}

export const isNativeApp = () => Capacitor.isNativePlatform();
