// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://vyanacare.lovable.app";

// Public, indexable routes. Admin/auth pages are included so crawlers discover every linked route.
const entries = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/splash", changefreq: "monthly", priority: "0.6" },
  { path: "/auth", changefreq: "monthly", priority: "0.5" },
  { path: "/reset-password", changefreq: "yearly", priority: "0.3" },
  { path: "/why-vyana", changefreq: "monthly", priority: "0.8" },
  { path: "/request-access", changefreq: "monthly", priority: "0.7" },
  { path: "/access-pending", changefreq: "yearly", priority: "0.3" },
  { path: "/admin/waitlist", changefreq: "weekly", priority: "0.4" },
  { path: "/legal", changefreq: "yearly", priority: "0.3" },
];

const today = new Date().toISOString().slice(0, 10);

const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean).join("\n"),
  ),
  `</urlset>`,
].join("\n");

writeFileSync(resolve("public/sitemap.xml"), xml);
console.log(`sitemap.xml written (${entries.length} entries)`);
