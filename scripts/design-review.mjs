/**
 * Art-direction critique loop. Feeds screenshots + the source copy to Claude and
 * writes a prioritised critique to outputs/.
 *
 *   npm run shots
 *   node scripts/design-review.mjs
 *   node scripts/design-review.mjs --dir=outputs/shots/mobile --max=8
 *   node scripts/design-review.mjs --focus="hero typography and contrast"
 *
 * Requires ANTHROPIC_API_KEY. Honours ANTHROPIC_BASE_URL if you route through a
 * local proxy (this repo's .claude/settings.local.json sets one for Claude Code
 * itself — it is not automatically inherited here).
 */
import Anthropic from "@anthropic-ai/sdk";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MEDIA_TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const flags = Object.fromEntries(
  process.argv
    .slice(2)
    .map((arg) => /^--([^=]+)(?:=(.*))?$/.exec(arg))
    .filter(Boolean)
    .map((match) => [match[1], match[2] ?? true]),
);

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set.");
  process.exit(1);
}

const dir = path.resolve(String(flags.dir ?? "outputs/shots/desktop"));
const max = Number(flags.max ?? 12);
const focus = flags.focus === undefined || flags.focus === true ? null : String(flags.focus);

const entries = (await readdir(dir).catch(() => {
  console.error(`No screenshots in ${dir}. Run: npm run shots`);
  process.exit(1);
}))
  .filter((file) => MEDIA_TYPES[path.extname(file).toLowerCase()])
  .sort();

if (entries.length === 0) {
  console.error(`No images in ${dir}. Run: npm run shots`);
  process.exit(1);
}

// Even sampling keeps the whole scroll represented when the cap bites.
const step = Math.max(1, Math.ceil(entries.length / max));
const selected = entries.filter((_, index) => index % step === 0).slice(0, max);

const images = await Promise.all(
  selected.map(async (file) => {
    const data = await readFile(path.join(dir, file));
    if (data.byteLength > MAX_IMAGE_BYTES) {
      throw new Error(`${file} is ${(data.byteLength / 1e6).toFixed(1)}MB — re-shoot with --dsf=1`);
    }
    return { file, data };
  }),
);

const copy = await readFile("src/content.ts", "utf8");

const content = [];
for (const { file, data } of images) {
  content.push({ type: "text", text: `Screenshot: ${file}` });
  content.push({
    type: "image",
    source: {
      type: "base64",
      media_type: MEDIA_TYPES[path.extname(file).toLowerCase()],
      data: data.toString("base64"),
    },
  });
}
content.push({
  type: "text",
  text: [
    "Source copy (src/content.ts) for reference:",
    "```ts",
    copy,
    "```",
    "",
    focus ? `Focus this review on: ${focus}` : "Review the page as a whole.",
  ].join("\n"),
});

const client = new Anthropic();
console.log(`Reviewing ${images.length} screenshots from ${dir}…`);

const stream = client.messages.stream({
  model: "claude-opus-5",
  max_tokens: 8000,
  thinking: { type: "adaptive" },
  system:
    "You are a senior art director reviewing an interactive executive one-pager that positions two creative leaders " +
    "(games, brands, entertainment). The screenshots are ordered: hero scroll phases first, then each section. " +
    "Judge it as a portfolio artifact whose job is to win senior creative-leadership roles.\n\n" +
    "Return markdown with exactly these sections:\n" +
    "1. **Verdict** — two sentences, blunt.\n" +
    "2. **Blocking issues** — things that actively undercut credibility. For each: what, which screenshot, why it costs, the fix.\n" +
    "3. **High-leverage improvements** — ranked, with the concrete CSS/copy/layout change.\n" +
    "4. **Working well** — keep-list so it does not get refactored away.\n\n" +
    "Be specific about type scale, contrast, rhythm, spacing, and hierarchy. Cite screenshot filenames. " +
    "No praise padding. If something is fine, say nothing about it.",
  messages: [{ role: "user", content }],
});

const message = await stream.finalMessage();
const text = message.content
  .filter((block) => block.type === "text")
  .map((block) => block.text)
  .join("\n");

await mkdir("outputs", { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const out = path.join("outputs", `design-review-${stamp}.md`);
await writeFile(out, `# Design review — ${dir}\n\nScreenshots: ${selected.join(", ")}\n\n${text}\n`);

console.log(`\n${text}\n`);
console.log(`Saved → ${out}`);
console.log(`Tokens: ${message.usage.input_tokens} in / ${message.usage.output_tokens} out`);
