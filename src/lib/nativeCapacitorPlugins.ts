import { registerPlugin } from "@capacitor/core";

export type CameraPermissionState = "prompt" | "prompt-with-rationale" | "granted" | "denied" | "limited";
export type CameraPermissionType = "camera" | "photos";

export type CameraPermissionStatus = {
  camera: CameraPermissionState;
  photos: CameraPermissionState;
};

export type CameraSourceValue = "CAMERA" | "PHOTOS" | "PROMPT";

export type CameraPhoto = {
  dataUrl?: string;
  format?: string;
};

export type NativeCameraPlugin = {
  checkPermissions(): Promise<CameraPermissionStatus>;
  requestPermissions(options?: { permissions: CameraPermissionType[] }): Promise<CameraPermissionStatus>;
  getPhoto(options: {
    quality?: number;
    allowEditing?: boolean;
    resultType: "dataUrl";
    source?: CameraSourceValue;
    promptLabelHeader?: string;
    promptLabelPhoto?: string;
    promptLabelPicture?: string;
  }): Promise<CameraPhoto>;
};

export type NativeBrowserPlugin = {
  open(options: { url: string; presentationStyle?: "fullscreen" | "popover" }): Promise<void>;
  close(): Promise<void>;
};

export const NativeCamera = registerPlugin<NativeCameraPlugin>("Camera");
export const NativeBrowser = registerPlugin<NativeBrowserPlugin>("Browser");

export const NativeCameraResultType = {
  DataUrl: "dataUrl" as const,
};

export const NativeCameraSource = {
  Camera: "CAMERA" as const,
  Photos: "PHOTOS" as const,
  Prompt: "PROMPT" as const,
};