import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const id = process.argv[2];
const out = process.argv[3];
const scale = parseFloat(process.argv[4] ?? "0.5");
const frameRange = process.argv[5]; // e.g. "0-1679"
if (!id || !out) { console.error("usage: render-part.mjs <id> <out> [scale] [frameRange]"); process.exit(1); }

const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  publicDir: path.resolve(__dirname, "../public"),
  webpackOverride: (c) => c,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({ serveUrl: bundled, id, puppeteerInstance: browser });

let fr;
if (frameRange) {
  const [a, b] = frameRange.split("-").map((n) => parseInt(n, 10));
  fr = [a, b];
}

await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: out,
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
  scale,
  jpegQuality: 85,
  crf: 20,
  ...(fr ? { frameRange: fr } : {}),
});

await browser.close({ silent: false });
console.log("done", out);
