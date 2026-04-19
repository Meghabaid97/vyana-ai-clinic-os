// Generate voiceover MP3s — soothing Indian female voice, slower, breathier
import fs from "fs";
import path from "path";

const SUPABASE_URL = "https://gnfaxcdapizhfqloiajn.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZmF4Y2RhcGl6aGZxbG9pYWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTQ2NjcsImV4cCI6MjA3OTA3MDY2N30.k_odpJ27FfLU4fBl-01ilOCt1Jg-2Y4blvNJFuJVoq4";

// Sarah - warm, soothing, calm female. Slow + breathy = premium documentary feel.
const VOICE = "EXAVITQu4vr4xnSDxMaL";

// Modern Indian family opening. Warm, intimate, present-day. No drawer cliche.
const lines = [
  ["s1", "It's almost midnight. Meera is searching her phone. Her father has a check up tomorrow, and somewhere in this gallery, in some forwarded message, is the lab report he needs."],
  ["s2", "She finds it. A photograph of a photograph. Three years old. Half cut off. This is how most of us carry our health. In screenshots. In WhatsApp threads. In a parent's memory. In a daughter's worry."],
  ["s3", "But health isn't a single document. It's a story. Slow, layered, written across years. Across doctors. Across small moments that add up to something only you should own."],
  ["s4", "This is Vyana. A quiet, organised place for your family's health. Linked to your ABHA Health ID. Built for how India actually lives."],
  ["s5", "It begins with your story. Every visit, every report, every medicine, gathered into one warm, continuous record. Always with you. Even on the nights you forget it exists."],
  ["s6", "Upload anything. A prescription. A discharge summary. A lab PDF. Vyana reads it, understands it, and writes it back to you in plain words. No typing. No filing. No forgetting."],
  ["s7", "Every record becomes a vital. Sugar, pressure, thyroid, cholesterol. Quietly tracked over years, so trends become visible long before they become problems."],
  ["s8", "Even handwritten prescriptions, in Tamil, Hindi, Telugu, Bengali, English. Vyana reads them, translates them, and reminds you when to take what. Because medicine should never get lost in translation."],
  ["s9", "When a doctor needs to see your history, share securely with one tap. A link, valid for twenty four hours. No app needed on their side. Consent first. Yours, always."],
  ["s10", "And in the moment that matters most, when a parent is in the emergency room and someone asks, what's their blood group, are they on any medication, the answer is already there."],
  ["s11", "Vyana. The system that remembers, so your family doesn't have to."],
];

const outDir = path.resolve("public/audio");
fs.mkdirSync(outDir, { recursive: true });

for (const [name, text] of lines) {
  const out = path.join(outDir, `${name}.mp3`);
  console.log("generating", name);
  const r = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ text, voiceId: VOICE }),
  });
  if (!r.ok) { console.error(name, "FAIL", r.status, await r.text()); process.exit(1); }
  const j = await r.json();
  if (!j.audioContent) { console.error(name, "no audio", j); process.exit(1); }
  fs.writeFileSync(out, Buffer.from(j.audioContent, "base64"));
  console.log("  →", out, fs.statSync(out).size, "bytes");
}
console.log("done");
