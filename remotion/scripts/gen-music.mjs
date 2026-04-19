// Generate ambient electronic background bed via ElevenLabs Music API
import fs from "fs";
import path from "path";

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error("ELEVENLABS_API_KEY missing"); process.exit(1); }

const out = path.resolve("public/audio/bed.mp3");
if (fs.existsSync(out) && fs.statSync(out).size > 100000) {
  console.log("bed exists, skip"); process.exit(0);
}

const prompt = "Soft cinematic ambient electronic underscore, warm analog pads, gentle glassy piano notes drifting, hopeful and minimal, like a Notion or Linear product film, no drums, no vocals, calm and slow, contemplative, in the key of C major, room to breathe under a soft female voiceover";

console.log("generating music bed...");
const r = await fetch("https://api.elevenlabs.io/v1/music", {
  method: "POST",
  headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ prompt, music_length_ms: 195000 }),
});
if (!r.ok) { console.error("FAIL", r.status, await r.text()); process.exit(1); }
const buf = Buffer.from(await r.arrayBuffer());
fs.writeFileSync(out, buf);
console.log("→", out, buf.length, "bytes");
