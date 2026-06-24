import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

/**
 * Regression: even with a valid auth session, a user whose profile has
 * NOT accepted the required consents (age_18, terms_of_service, dpdpa)
 * must be hard-redirected to /welcome. They must never see /app, the
 * app home, or the bottom tab bar — reopening the app with a cached
 * session token must not bypass the consent gate.
 */

// Flexible chainable + thenable mock so any .from().select().eq().eq()...
// or .order() shape resolves to the data passed in.
function makeChain(data: unknown) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    neq: () => chain,
    is: () => chain,
    in: () => chain,
    not: () => chain,
    order: () => chain,
    update: () => chain,
    insert: () => chain,
    upsert: () => chain,
    delete: () => chain,
    limit: () => chain,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve: (v: { data: unknown; error: null }) => void) =>
      resolve({ data, error: null }),
  };
  return chain;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      // Valid signed-in session — bypasses the auth gate.
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "user-no-consent" } } },
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-no-consent" } },
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    // consent_log returns ZERO granted rows -> consent gate must fire.
    from: vi.fn().mockImplementation(() => makeChain([])),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    channel: vi.fn().mockReturnValue({
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
    }),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  },
}));

import AppShell from "./AppShell";

describe("AppShell consent gate — strict terms acceptance enforcement", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("redirects /app to /welcome when session exists but consents are missing", async () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <Routes>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<div data-testid="app-home">APP HOME</div>} />
            <Route
              path="trends"
              element={<div data-testid="app-trends">TRENDS</div>}
            />
          </Route>
          <Route
            path="/welcome"
            element={<div data-testid="welcome">WELCOME GATE</div>}
          />
          <Route path="/auth" element={<div data-testid="auth">AUTH</div>} />
        </Routes>
      </MemoryRouter>,
    );

    // Gate must intercept and land on /welcome
    await waitFor(() => {
      expect(screen.getByTestId("welcome")).toBeInTheDocument();
    });

    // App home content must NOT be reachable
    expect(screen.queryByTestId("app-home")).toBeNull();
    expect(screen.queryByTestId("app-trends")).toBeNull();

    // Bottom tab navigation (rendered by AppShell) must NOT be in the DOM
    expect(screen.queryByRole("navigation")).toBeNull();

    // The auth gate must NOT have fired (session was valid)
    expect(screen.queryByTestId("auth")).toBeNull();
  });
});
