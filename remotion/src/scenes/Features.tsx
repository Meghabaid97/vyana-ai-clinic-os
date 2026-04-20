import React from "react";
import { COLORS } from "../theme";
import { FeatureScene } from "./FeatureScene";

export const K5Home = () => (
  <FeatureScene shot="home" eyebrow="One app · Your story"
    title="Your whole health story." accent="story." italicTitle
    body="Every prescription, every report, every visit — gathered in one warm, continuous record."
    palette={{ bg: COLORS.cream, blob1: COLORS.peach, blob2: COLORS.amber + "55", blob3: COLORS.coral + "33", ink: COLORS.coral }}
    seed={5} side="left" rotate={-3} scrollSpeed={18}
  />
);

export const K6Records = () => (
  <FeatureScene shot="records" eyebrow="Drop a report"
    title="We do the rest." accent="rest." italicTitle
    body="Snap a photo of any lab report. Vyana extracts vitals, dates, and trends — automatically."
    palette={{ bg: COLORS.mint, blob1: COLORS.sage + "55", blob2: COLORS.amber + "44", blob3: COLORS.coral + "33", ink: COLORS.sage }}
    seed={6} side="right" rotate={2} scrollSpeed={14}
  />
);

export const K7Trends = () => (
  <FeatureScene shot="trends" eyebrow="Vitals over years"
    title="See trends doctors miss." accent="miss." italicTitle
    body="Sugar, pressure, thyroid, cholesterol — quietly tracked across years, not just one visit."
    palette={{ bg: COLORS.sky, blob1: COLORS.navy + "33", blob2: COLORS.sage + "44", blob3: COLORS.coral + "33", ink: COLORS.navy }}
    seed={7} side="left" rotate={-3} scrollSpeed={20}
  />
);

export const K8Rx = () => (
  <FeatureScene shot="rx" eyebrow="5 Indian languages"
    title="Even handwritten." accent="handwritten." italicTitle
    body="Tamil, Hindi, Telugu, Bengali, English. Read, translated, reminded — every dose."
    palette={{ bg: COLORS.peach, blob1: COLORS.coral + "55", blob2: COLORS.amber + "55", blob3: COLORS.yellow + "44", ink: COLORS.coralDeep }}
    seed={8} side="right" rotate={3} scrollSpeed={12}
  />
);

export const K9Briefing = () => (
  <FeatureScene shot="briefing" eyebrow="Walk in prepared"
    title="Every visit, briefed." accent="briefed." italicTitle
    body="Vyana writes a one-page summary for your doctor — symptoms, history, medications, questions."
    palette={{ bg: COLORS.sand, blob1: COLORS.amber + "55", blob2: COLORS.coral + "44", blob3: COLORS.sage + "33", ink: COLORS.amber }}
    seed={9} side="left" rotate={-2} scrollSpeed={16}
  />
);

export const K10Share = () => (
  <FeatureScene shot="share" eyebrow="Secure sharing"
    title="One link. 24 hours." accent="hours." italicTitle
    body="Send your records to any specialist with a link that expires automatically. You stay in control."
    palette={{ bg: COLORS.mint, blob1: COLORS.sage + "55", blob2: COLORS.sky + "55", blob3: COLORS.amber + "33", ink: COLORS.sage }}
    seed={10} side="right" rotate={2} scrollSpeed={14}
  />
);

export const K11Timeline = () => (
  <FeatureScene shot="timeline" eyebrow="One timeline"
    title="Your life, in order." accent="order." italicTitle
    body="A chronological graph of everything that happened — visits, vitals, medications, milestones."
    palette={{ bg: COLORS.cream, blob1: COLORS.peach, blob2: COLORS.sage + "44", blob3: COLORS.amber + "44", ink: COLORS.coral }}
    seed={11} side="left" rotate={-3} scrollSpeed={22}
  />
);
