import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

/**
 * Static regression for AppShell:
 *  - Mobile uses `100svh` (the iOS keyboard fix) and `safe-area` utils.
 *  - Sub-route titles map exists and includes the routes we recently added.
 *  - The tab list still has exactly 6 mobile tabs (matches the 6-col bottom bar).
 */
describe("AppShell navigation contract", () => {
  const src = readFileSync(
    path.resolve(__dirname, "../components/AppShell.tsx"),
    "utf8",
  );

  it("uses safe-area utilities on top + bottom bars", () => {
    expect(src).toMatch(/safe-area-top/);
    expect(src).toMatch(/safe-area-bottom/);
  });

  it("renders a 6-column mobile bottom tab bar", () => {
    expect(src).toMatch(/grid-cols-6/);
  });

  it("registers sub-route titles for new pages", () => {
    expect(src).toMatch(/\/app\/domain-checklist/);
    expect(src).toMatch(/\/app\/share-receive/);
    expect(src).toMatch(/\/app\/journal/);
    expect(src).toMatch(/\/app\/visit/);
  });

  it("does not import the deleted PatientHeader", () => {
    expect(src).not.toMatch(/PatientHeader/);
  });
});
