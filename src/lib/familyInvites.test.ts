import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { inviteLink } from "./familyInvites";

const TOKEN = "11111111-2222-3333-4444-555555555555";

function setHostname(hostname: string, protocol = "https:") {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      hostname,
      protocol,
      origin: `${protocol}//${hostname}`,
      pathname: "/",
      search: "",
      hash: "",
      href: `${protocol}//${hostname}/`,
    },
  });
}

describe("inviteLink", () => {
  const originalLocation = window.location;
  afterEach(() => {
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("returns a vyana.care URL on a Lovable preview host", () => {
    setHostname("id-preview--abc.lovable.app");
    const link = inviteLink(TOKEN);
    expect(link).toBe(`https://vyana.care/app/accept-invite/${TOKEN}`);
  });

  it("returns a vyana.care URL on the lovable.app staging host", () => {
    setHostname("vyanacare.lovable.app");
    const link = inviteLink(TOKEN);
    expect(link.startsWith("https://vyana.care/")).toBe(true);
  });

  it("uses the current origin when already on vyana.care", () => {
    setHostname("vyana.care");
    expect(inviteLink(TOKEN)).toBe(`https://vyana.care/app/accept-invite/${TOKEN}`);
  });

  it("uses the current origin on a vyana.care subdomain (e.g. www)", () => {
    setHostname("www.vyana.care");
    expect(inviteLink(TOKEN)).toBe(`https://www.vyana.care/app/accept-invite/${TOKEN}`);
  });

  it("falls back to vyana.care on a Capacitor/native localhost host", () => {
    setHostname("localhost", "http:");
    const link = inviteLink(TOKEN);
    expect(link).toBe(`https://vyana.care/app/accept-invite/${TOKEN}`);
  });

  it("never produces a lovable.app URL across many hosts", () => {
    const hosts = [
      "id-preview--abc.lovable.app",
      "vyanacare.lovable.app",
      "some-project.lovable.dev",
      "localhost",
      "192.168.1.10",
      "vyana.care",
      "www.vyana.care",
      "app.vyana.care",
    ];
    for (const h of hosts) {
      setHostname(h, h === "localhost" ? "http:" : "https:");
      const link = inviteLink(TOKEN);
      expect(link).not.toMatch(/lovable\.(app|dev)/);
      expect(link).toMatch(/^https:\/\/[^/]*vyana\.care\//);
    }
  });
});
