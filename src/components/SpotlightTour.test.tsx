import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SpotlightTour from "./SpotlightTour";

/**
 * Regression: when a Radix Dialog (e.g. the "Finish profile" popup) is open
 * behind the tour, Radix sets `pointer-events: none` on <body>. If the tour
 * portal doesn't explicitly re-enable pointer events, the X / Skip tour /
 * Start tour buttons silently swallow clicks and the user has to dismiss
 * the background dialog first.
 *
 * These tests assert the tour stays interactive even while the body has
 * pointer-events disabled.
 */

const renderTour = (onClose = vi.fn()) => {
  render(
    <MemoryRouter initialEntries={["/app"]}>
      <SpotlightTour open onClose={onClose} />
    </MemoryRouter>,
  );
  return onClose;
};

describe("SpotlightTour — clickable above background modal", () => {
  beforeEach(() => {
    // Simulate Radix Dialog locking the body, as the profile dialog does.
    document.body.style.pointerEvents = "none";
  });

  afterEach(() => {
    document.body.style.pointerEvents = "";
    localStorage.clear();
    cleanup();
  });

  it("renders the tour overlay with pointer-events enabled", () => {
    renderTour();
    const dialog = screen.getByRole("dialog", { name: /your health home/i });
    // Walk up to the fixed overlay root and confirm pointer-events is auto.
    const overlay = dialog.parentElement as HTMLElement;
    expect(overlay).toBeTruthy();
    expect(overlay.style.pointerEvents).toBe("auto");
  });

  it("fires onClose when the X (Skip tour) icon is clicked", () => {
    const onClose = renderTour();
    const skipButtons = screen.getAllByRole("button", { name: /skip tour/i });
    fireEvent.click(skipButtons[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("fires onClose when the 'Skip tour' text link is clicked", () => {
    const onClose = renderTour();
    // There are two 'Skip tour' affordances (icon + text). The text one is
    // the second match.
    const skipButtons = screen.getAllByRole("button", { name: /skip tour/i });
    fireEvent.click(skipButtons[skipButtons.length - 1]);
    expect(onClose).toHaveBeenCalled();
  });

  it("'Start tour' button is clickable on the first step", () => {
    renderTour();
    const startBtn = screen.getByRole("button", { name: /start tour/i });
    expect(startBtn).toBeEnabled();
    // Should not throw and should advance internal step.
    fireEvent.click(startBtn);
  });
});
