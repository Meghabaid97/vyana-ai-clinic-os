import { Capacitor } from "@capacitor/core";
import { NativeBrowser } from "@/lib/nativeCapacitorPlugins";

const CUSTOMER_APP_ORIGIN = "https://vyana.care";

const openLegal = (section: "terms" | "privacy") => {
  const hash = section === "privacy" ? "#privacy" : "";
  const path = `/legal${hash}`;
  if (Capacitor.isNativePlatform()) {
    void NativeBrowser.open({
      url: `${CUSTOMER_APP_ORIGIN}${path}`,
      presentationStyle: "fullscreen",
    }).catch(() => {
      window.open(`${CUSTOMER_APP_ORIGIN}${path}`, "_blank", "noopener,noreferrer");
    });
  } else {
    window.open(path, "_blank", "noopener,noreferrer");
  }
};

export const LegalLink = ({
  section,
  children,
  className,
}: {
  section: "terms" | "privacy";
  children: React.ReactNode;
  className?: string;
}) => (
  <a
    href={section === "privacy" ? "/legal#privacy" : "/legal"}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => {
      e.preventDefault();
      openLegal(section);
    }}
    className={className ?? "text-primary underline cursor-pointer"}
  >
    {children}
  </a>
);
