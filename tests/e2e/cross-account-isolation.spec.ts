/**
 * End-to-end test: cross-account data isolation.
 *
 * Signs in as User A, captures a fingerprint of every health record title
 * rendered in their Records tab, signs out inside the same browser tab,
 * signs in as User B, and asserts that NONE of User A's record titles
 * ever appear in User B's DOM — during the sign-in transition, after the
 * initial load, or after switching tabs / refocusing.
 *
 * This guards the regression from the "AuthScopedTree remount on auth.uid
 * change" fix: without the fix, User A's records briefly (or permanently)
 * flashed inside User B's session because the routed React tree stayed
 * mounted with stale state and stale realtime subscriptions.
 *
 * Run with:
 *   TEST_USER_A_EMAIL=... TEST_USER_A_PASSWORD=... \
 *   TEST_USER_B_EMAIL=... TEST_USER_B_PASSWORD=... \
 *   bunx playwright test tests/e2e/cross-account-isolation.spec.ts
 *
 * Both accounts must already exist in Lovable Cloud and User A must have
 * at least one uploaded health record; User B ideally has zero (or at
 * least a disjoint set of titles) so leakage is unambiguous.
 */

import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:8080";

const USER_A = {
  email: requireEnv("TEST_USER_A_EMAIL"),
  password: requireEnv("TEST_USER_A_PASSWORD"),
};
const USER_B = {
  email: requireEnv("TEST_USER_B_EMAIL"),
  password: requireEnv("TEST_USER_B_PASSWORD"),
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Set both TEST_USER_A_* and TEST_USER_B_* before running this test.`,
    );
  }
  return value;
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/auth`, { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: /^log in$/i }).click();
  // Land on the authenticated shell.
  await page.waitForURL(/\/app(\/|$)/, { timeout: 20_000 });
}

async function signOutInTab(page: Page) {
  // Nuke the client-side session without navigating away first, so we
  // exercise the same "in-tab account switch" the bug reproduced under.
  await page.evaluate(async () => {
    // @ts-expect-error — pulled from the app's own bundle at runtime.
    const mod = await import("/src/integrations/supabase/client.ts");
    await mod.supabase.auth.signOut();
  });
  await page.waitForURL(/\/auth(\?|$|\/)/, { timeout: 10_000 }).catch(() => {
    // Some routes redirect via the AuthScopedTree remount instead of a
    // hard nav — fall back to an explicit visit.
    return page.goto(`${BASE_URL}/auth`, { waitUntil: "domcontentloaded" });
  });
}

async function openRecordsTab(page: Page) {
  // The Records tab lives inside the app shell. Prefer role-based
  // navigation; fall back to a direct route if the label ever changes.
  const tab = page.getByRole("tab", { name: /records/i }).or(
    page.getByRole("link", { name: /records/i }),
  );
  if (await tab.first().isVisible().catch(() => false)) {
    await tab.first().click();
  } else {
    await page.goto(`${BASE_URL}/app/records`, { waitUntil: "domcontentloaded" });
  }
  // Give the list a beat to hydrate from Lovable Cloud.
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function collectRecordTitles(page: Page): Promise<string[]> {
  // HealthRecordsTab renders each record's title inside the list. We grab
  // every visible non-empty string in the records surface and normalize.
  const titles = await page.evaluate(() => {
    const root =
      document.querySelector('[data-testid="health-records-list"]') ??
      document.body;
    const raw = Array.from(root.querySelectorAll("h1,h2,h3,h4,button,li,a,p"))
      .map((el) => (el.textContent ?? "").trim())
      .filter((t) => t.length > 2 && t.length < 200);
    return Array.from(new Set(raw));
  });
  return titles;
}

async function assertNoneOfTitlesVisible(page: Page, forbidden: string[]) {
  if (forbidden.length === 0) return;
  const leaked = await page.evaluate((needles) => {
    const haystack = document.body.innerText;
    return needles.filter((n) => haystack.includes(n));
  }, forbidden);
  expect(
    leaked,
    `User A record titles leaked into User B session: ${JSON.stringify(leaked)}`,
  ).toEqual([]);
}

test("User A records never appear in User B session after in-tab switch", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  // 1. Sign in as User A, capture their record titles.
  await signIn(page, USER_A.email, USER_A.password);
  await openRecordsTab(page);
  const userATitles = await collectRecordTitles(page);
  expect(
    userATitles.length,
    "User A must have at least one visible record for this test to be meaningful",
  ).toBeGreaterThan(0);

  // 2. Sign out inside the same tab (does NOT reload the page).
  await signOutInTab(page);

  // 3. Sign in as User B.
  await signIn(page, USER_B.email, USER_B.password);

  // 4a. Immediately after landing on the app shell, before Records opens,
  //     no User A title should be present anywhere in the DOM.
  await assertNoneOfTitlesVisible(page, userATitles);

  // 4b. Open Records tab — the surface most prone to leakage.
  await openRecordsTab(page);
  await assertNoneOfTitlesVisible(page, userATitles);

  // 4c. Simulate returning to the app (fires the visibilitychange +
  //     focus refetch path in useHealthRecordsSync).
  await page.evaluate(() => {
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));
  });
  await page.waitForTimeout(1500);
  await assertNoneOfTitlesVisible(page, userATitles);

  // 4d. Hard reload to make sure nothing persisted to storage bleeds back.
  await page.reload({ waitUntil: "domcontentloaded" });
  await openRecordsTab(page);
  await assertNoneOfTitlesVisible(page, userATitles);

  expect(consoleErrors, `Runtime errors during switch: ${consoleErrors.join(" | ")}`).toEqual([]);
});
