// Generate voiceover MP3s by calling the deployed elevenlabs-tts edge function
import fs from "fs";
import path from "path";

const SUPABASE_URL = "https://gnfaxcdapizhfqloiajn.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZmF4Y2RhcGl6aGZxbG9pYWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTQ2NjcsImV4cCI6MjA3OTA3MDY2N30.k_odpJ27FfLU4fBl-01ilOCt1Jg-2Y4blvNJFuJVoq4";

const lines = [
  ["s1", "In every Indian home, there is a drawer. Inside it, the shape of a life. Prescriptions. Lab reports. A folded ECG."],
  ["s2", "Our health lives in WhatsApp forwards. In gallery screenshots. In a daughter's memory. In a son's phone. In a father's worry. Always somewhere. Never together."],
  ["s3", "Every visit, the same questions. Any allergies? Last sugar reading? Still on the thyroid tablet? Every doctor hears the story for the very first time. And we, somehow, are expected to remember it all."],
  ["s4", "And then comes the moment that matters most. Two A M. Bright lights. A nurse asking, blood group? Any existing medication? In that moment, memory should not be a person's job. It should already be there."],
  ["s5", "This is Vyana. A longitudinal health memory layer, built for how India actually works. One ABHA Health ID. One quiet, organised place. For your whole family."],
  ["s6", "Upload anything. A photo of a prescription. A scan of a discharge summary. A lab PDF. Vyana reads it, understands it, and writes it back to you in plain words. No typing. No filing. No forgetting."],
  ["s7", "Every record becomes part of a timeline. Vitals over years. Diagnoses across doctors. Trends you can finally see. Your full health story, in one continuous line."],
  ["s8", "Even handwritten prescriptions. In Tamil. Hindi. Telugu. Bengali. English. Vyana reads, translates, and reminds. Because medicine should never get lost in translation."],
  ["s9", "When a doctor needs to see your history, share securely with one tap. Linked to your ABHA Health ID. Time-bound. Consent-first. Yours, always."],
  ["s10", "Vyana remembers, so your family doesn't have to."],
  ["s11", "Vyana. The system that remembers."],
];

const outDir = path.resolve("public/audio");
fs.mkdirSync(outDir, { recursive: true });

for (const [name, text] of lines) {
  const out = path.join(outDir, `${name}.mp3`);
  if (fs.existsSync(out) && fs.statSync(out).size > 5000) { console.log("skip", name); continue; }
  console.log("generating", name);
  const r = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) { console.error(name, "FAIL", r.status, await r.text()); process.exit(1); }
  const j = await r.json();
  if (!j.audioContent) { console.error(name, "no audio", j); process.exit(1); }
  fs.writeFileSync(out, Buffer.from(j.audioContent, "base64"));
  console.log("  →", out, fs.statSync(out).size, "bytes");
}
console.log("done");
