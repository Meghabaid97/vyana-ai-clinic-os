import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import path from "path";

/**
 * Static regression: every lazy `import("./pages/X")` in App.tsx must point to a real file.
 * Catches orphan deletions that leave dangling routes (the bug class we just fixed).
 */
describe("App.tsx route integrity", () => {
  const appSrc = readFileSync(path.resolve(__dirname, "../App.tsx"), "utf8");

  const importPaths = [...appSrc.matchAll(/import\((["'])(\.\/pages\/[^"')]+)\1\)/g)].map(
    (m) => m[2],
  );

  it("finds at least the core /app routes", () => {
    expect(importPaths.length).toBeGreaterThan(15);
  });

  it.each(importPaths)("lazy import %s resolves to a real file", (rel) => {
    const candidates = [
      path.resolve(__dirname, "..", `${rel}.tsx`),
      path.resolve(__dirname, "..", `${rel}.ts`),
      path.resolve(__dirname, "..", rel, "index.tsx"),
    ];
    const found = candidates.some(existsSync);
    expect(found, `Missing file for lazy import: ${rel}`).toBe(true);
  });

  it("contains no references to removed orphan pages", () => {
    const orphans = [
      "Consultation",
      "ConsultationsList",
      "DoctorAppointments",
      "DoctorDashboard",
      "DoctorPatientView",
      "DoctorProfileSetup",
      "PatientAppointments",
      "SharedHealthRecords",
      "PatientMedicalHistory",
      "PatientProfilePage",
    ];
    for (const o of orphans) {
      expect(appSrc).not.toMatch(new RegExp(`pages/${o}\\b`));
    }
  });
});
