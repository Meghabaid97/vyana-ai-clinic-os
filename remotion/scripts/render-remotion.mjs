import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (c) => c,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({ serveUrl: bundled, id: "main", puppeteerInstance: browser });

await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: "/tmp/vyana-silent.mp4",
  puppeteerInstance: browser,
  muted: true,
  concurrency: 6,
  scale: 0.5,
  jpegQuality: 80,
  crf: 26,
});

await browser.close({ silent: false });
console.log("Rendered to /mnt/documents/vyana-demo.mp4");
