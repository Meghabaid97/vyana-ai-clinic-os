# Ask Vyana — Mobile QA Checklist

Quick smoke test to confirm the Ask Vyana modal (`src/components/AskVyanaModal.tsx`) renders correctly on phone browsers and inside the Capacitor WebView. Run before every release that touches `AskVyanaModal`, `AppShell` header, or root layout / safe-area CSS.

Test devices (minimum):
- iOS Safari on a notched iPhone (e.g. iPhone 13/14/15) — iOS 16+
- Android Chrome on a 360px-wide device — Android 12+
- Capacitor build on both platforms (only if shipping native)

---

## 1. Open & layout

- [ ] Tap the ✨ Sparkles icon in the mobile top bar — modal opens.
- [ ] Modal covers the full viewport (no gap at top, no gap at bottom).
- [ ] Top of the modal sits **below** the iOS notch / status bar (safe-area top respected).
- [ ] Bottom of the modal sits **above** the iOS home indicator (safe-area bottom respected).
- [ ] Backdrop is dim + blurred; tapping outside the panel closes the modal.
- [ ] X (close) button is fully tappable in the top-right corner.

## 2. Empty state

- [ ] "Answers are grounded in trusted medical sources…" disclaimer is fully visible.
- [ ] All 4 "Try asking" suggestion chips render and are tappable.
- [ ] No horizontal scroll anywhere in the modal.

## 3. Keyboard open (the regression we just fixed)

- [ ] Tap the input — keyboard slides up.
- [ ] The input field stays visible (does **not** get hidden behind the keyboard).
- [ ] The "Ask" button stays reachable on the same row as the input.
- [ ] Suggestion chips remain scrollable above the keyboard.
- [ ] On iOS Safari: no white bar appears between the modal and the keyboard.
- [ ] On Android Chrome: dismissing the keyboard restores full-height layout cleanly.

## 4. Loading & result

- [ ] Submitting a question shows the spinner + "Searching trusted medical sources…".
- [ ] Answer markdown renders with readable line-height; no text clipped at edges.
- [ ] Confidence pill (high / moderate / low) is visible above the answer.
- [ ] Citation cards are tappable and open in a new tab (or system browser on Capacitor).
- [ ] Long answers scroll **inside** the modal body — header (input) stays pinned.

## 5. Error state

- [ ] Force an error (airplane mode, then ask) — error card renders inside the modal, modal does not collapse.

## 6. Close & re-open

- [ ] Pressing the X clears the result.
- [ ] Re-opening from the Sparkles icon shows the empty state with input focused.
- [ ] Pressing browser/device Back does **not** navigate away from `/app` — it just closes the modal (Esc on desktop has the same effect).

## 7. Orientation & viewport

- [ ] Rotate to landscape — modal still fits, no clipped content.
- [ ] On a 320px-wide viewport (iPhone SE 1st gen), input + Ask + X all fit on one row without wrapping.

---

## Known-safe CSS contracts (do not regress)

These rules in `AskVyanaModal.tsx` are what make the above pass. Touch with care:

- Outer container uses `items-stretch sm:items-start` and `100svh` on mobile (`svh`, not `vh`, so the iOS keyboard does not break layout).
- Outer container applies `padding-top: env(safe-area-inset-top)` and `padding-bottom: env(safe-area-inset-bottom)` inline.
- Inner panel: `h-[100svh] sm:h-auto sm:max-h-[84vh]`, no rounded corners on mobile (`sm:rounded-2xl`), no border on mobile (`border-0 sm:border`).
- Body uses `flex-1 overflow-y-auto` so only the answer area scrolls — input row stays pinned.
