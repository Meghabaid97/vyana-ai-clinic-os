import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches lazy-import failures (ChunkLoadError) that happen after a new
 * deployment invalidates old JS chunk filenames. Without this, a stale tab
 * navigating to a code-split route (e.g. /app/profile) would render a blank
 * white screen with no recovery. We reload once to fetch the new manifest.
 */
class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    const msg = error instanceof Error ? `${error.name} ${error.message}` : String(error);
    const isChunkError =
      /ChunkLoadError/i.test(msg) ||
      /Loading chunk [\d]+ failed/i.test(msg) ||
      /Failed to fetch dynamically imported module/i.test(msg) ||
      /Importing a module script failed/i.test(msg);

    if (isChunkError && typeof window !== "undefined") {
      // Auto-reload once to pick up the new build. Guard against reload loops
      // with a sessionStorage flag.
      const flag = "vyana-chunk-reloaded";
      if (!sessionStorage.getItem(flag)) {
        sessionStorage.setItem(flag, "1");
        window.location.reload();
        return { hasError: true };
      }
    }
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("ChunkErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] w-full flex items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">Something went wrong loading this page</h2>
            <p className="text-sm text-muted-foreground mb-4">
              A new version of Vyana may have been published. Reload to continue.
            </p>
            <button
              onClick={() => {
                sessionStorage.removeItem("vyana-chunk-reloaded");
                window.location.reload();
              }}
              className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ChunkErrorBoundary;
