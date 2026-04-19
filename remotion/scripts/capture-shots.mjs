// High-DPI capture of app screens. Tries authenticated screens by reading a credentials env var.
// For protected pages, we fall back to public marketing or splash.
// We capture at deviceScaleFactor=3 (retina) so the phone preview in the video stays sharp.
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const PREVIEW = process.env.PREVIEW_URL || "https://id-preview--7c435247-6dc0-4b68-9808-f61158e40739.lovable.app";
const EMAIL = process.env.DEMO_EMAIL;
const PASSWORD = process.env.DEMO_PASSWORD;

const SHOTS = [
  { name: "home",     path: "/app" },
  { name: "records",  path: "/app/records" },
  { name: "timeline", path: "/app/timeline" },
  { name: "trends",   path: "/app/trends" },
  { name: "rx",       path: "/app/rx" },
  { name: "share",    path: "/app/share" },
  { name: "briefing", path: "/app/briefing" },
];

const outDir = path.resolve("public/shots");
fs.mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "/bin/chromium",
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  headless: "new",
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

// Try to log in if credentials provided
if (EMAIL && PASSWORD) {
  try {
    console.log("logging in...");
    await page.goto(`${PREVIEW}/auth`, { waitUntil: "networkidle2", timeout: 45000 });
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.type('input[type="email"]', EMAIL, { delay: 20 });
    await page.type('input[type="password"]', PASSWORD, { delay: 20 });
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 6000));
    console.log("login attempted, current URL:", page.url());
  } catch (e) {
    console.warn("login failed, will capture public pages:", e.message);
  }
}

for (const s of SHOTS) {
  const out = path.join(outDir, `${s.name}.png`);
  try {
    console.log("capturing", s.name, "→", PREVIEW + s.path);
    await page.goto(PREVIEW + s.path, { waitUntil: "networkidle2", timeout: 45000 });
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: out, type: "png", fullPage: false });
    const stat = fs.statSync(out);
    console.log("  →", out, stat.size, "bytes");
  } catch (e) {
    console.error("  FAIL", s.name, e.message);
  }
}

await browser.close();
console.log("done");
