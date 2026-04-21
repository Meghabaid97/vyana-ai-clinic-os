---
name: Wedge Positioning
description: One-liner positioning, briefing-as-hero strategy, and what to keep/kill on home and landing
type: feature
---

## Wedge (locked)
**Tagline:** "Never explain your medical history again."
**Promise:** Upload reports → doctor-ready summary in 30 seconds → share via WhatsApp/PDF/link.

## Hero element
The **briefing** is the product hero, not records or trends. Home (`/app`) and landing (`/`) both lead with the briefing CTA.

## Home screen (/app, AppHome.tsx) order
1. Soft opener: "Welcome back, {name}. Your health story. Always with you." (KEEP — user love)
2. Briefing hero card: "Seeing a doctor? Get ready in 30 seconds." → Generate / Upload / Try sample
3. "Your story so far. Every detail matters." beats (KEEP — user love)
4. **What changed since your last visit** diff card (vital deltas, new meds, recent uploads). Falls back to SAMPLE_CHANGES for empty state.
5. Slim 2-up: Share with doctor · Emergency access
6. Why Vyana / Tirupur story
7. ABHA prompt (conditional)

## Landing hero (EditorialHero.tsx)
- H1: "Never explain your medical history again."
- Subtext: "Upload your reports. Get a doctor-ready summary in 30 seconds."
- Primary CTA: "Try it free" → /auth
- Secondary: "See a sample brief" → opens demo modal

## Activation
- `/app/briefing?demo=1` and "Try sample data" load `SAMPLE_BRIEFING` (Ramesh, 58, T2 diabetic). Yellow demo banner with "Exit demo" button.
- `DashboardChangesCard` shows `SAMPLE_CHANGES` when no real data exists.

## Killed / removed
- `DashboardActions.tsx` 6-card "Promises" grid (dilutes focus)
- Orphaned `PatientDashboard.tsx`, `DashboardStory.tsx`, `DashboardHero.tsx`, `DashboardStats.tsx`, `DashboardFooter.tsx`
- Old AppHome "Promises" grid section
- Health Trends opens with vitals — now opens with "What changed" diff

## Helpers
- `src/lib/sampleBriefingData.ts` — SAMPLE_BRIEFING (Ramesh persona)
- `src/lib/changesSinceLastVisit.ts` — `computeChangesSinceLastVisit(patientId)` compares two latest `vital_history` snapshots + new meds (30d) + new records (14d). Severity: alert/monitor/info.
