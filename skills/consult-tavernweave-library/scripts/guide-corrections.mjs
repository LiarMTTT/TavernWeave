import fs from "node:fs";

const corrections = JSON.parse(fs.readFileSync(new URL("../references/guide-corrections.json", import.meta.url), "utf8"));

// Curated corrections survive refreshes without falsifying the upstream source hash.
export function correctGuide(filename, source) {
  let text = source;
  for (const { before, after } of corrections.guides[filename] || []) {
    if (text.includes(after)) continue;
    if (text.split(before).length !== 2) throw new Error(`Guide correction source drift: ${filename}`);
    text = text.replace(before, after);
  }
  return text;
}
