// High-DPI capture of app screens at native 1170x2532 (3x retina-equivalent).
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const PREVIEW = process.env.PREVIEW_URL || "https://id-preview--7c435247-6dc0-4b68-9808-f61158e40739.lovable.app";
const EMAIL = process.env.DEMO_EMAIL;
const PASSWORD = process.env.DEMO_PASSWORD;

const SHOTS = [
  { name: "home",      path: "/app" },
  { name: "records",   path: "/app/records" },
  { name: "timeline",  path: "/app/timeline" },
  { name: "trends",    path: "/app/trends" },
  { name: "rx",        path: "/app/rx" },
  { name: "share",     path: "/app/share" },
  { name: "briefing",  path: "/app/briefing" },
  { name: "claims",    path: "/app/claims" },
  { name: "profile",   path: "/app/profile" },
  { name: "emergency", path: "/app/emergency" },
  { name: "meds",      path: "/app/meds" },
  { name: "vaccines",  path: "/app/vaccines" },
];

const outDir = path.resolve("public/shots");
fs.mkdirSync(outDir, { recursive: true });

// Native 1170x2532 by setting CSS viewport 1170x2532 and dSF=1; this avoids puppeteer dSF quirks.
const W = 1170, H = 2532;

const browser = await puppeteer.launch({
  executablePath: "/bin/chromium",
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", `--window-size=${W},${H}`],
  headless: "new",
});

const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
// Trick the app into mobile layout by emulating touch + UA
await page.emulate({
  viewport: { width: W, height: H, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
});
// Force the app to render as a phone column by zooming the document — most components are mobile-first by media query.
// We additionally inject a max-width wrapper after navigation to keep content phone-shaped.

if (EMAIL && PASSWORD) {
  try {
    console.log("logging in...");
    await page.goto(`${PREVIEW}/auth`, { waitUntil: "networkidle2", timeout: 45000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', EMAIL, { delay: 20 });
    await page.type('input[type="password"]', PASSWORD, { delay: 20 });
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 6000));
    console.log("login URL:", page.url());
  } catch (e) {
    console.warn("login failed:", e.message);
  }
}

for (const s of SHOTS) {
  const out = path.join(outDir, `${s.name}.png`);
  try {
    console.log("capturing", s.name);
    await page.goto(PREVIEW + s.path, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: out, type: "png", fullPage: false });
    const stat = fs.statSync(out);
    console.log("  →", out, stat.size, "bytes");
  } catch (e) {
    console.error("  FAIL", s.name, e.message);
  }
}

await browser.close();
console.log("done");
