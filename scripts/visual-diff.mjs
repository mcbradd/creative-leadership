/**
 * Pixel regression against a local baseline.
 *
 *   node scripts/shots.mjs --out=outputs/baseline   # record
 *   ...make changes...
 *   npm run shots && node scripts/visual-diff.mjs    # compare
 *
 * Baselines live under outputs/ (gitignored) — this is an iteration aid, not CI.
 * Exits non-zero if any shot moves more than --threshold (default 0.2% of pixels).
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const flags = Object.fromEntries(
  process.argv
    .slice(2)
    .map((arg) => /^--([^=]+)(?:=(.*))?$/.exec(arg))
    .filter(Boolean)
    .map((match) => [match[1], match[2] ?? true]),
);

const baselineRoot = path.resolve(String(flags.baseline ?? "outputs/baseline"));
const currentRoot = path.resolve(String(flags.current ?? "outputs/shots"));
const diffRoot = path.resolve(String(flags.diff ?? "outputs/diff"));
const threshold = Number(flags.threshold ?? 0.002);

async function pngsIn(root) {
  const found = new Map();
  const viewports = await readdir(root, { withFileTypes: true }).catch(() => {
    console.error(`Missing ${root}. Record a baseline first: node scripts/shots.mjs --out=outputs/baseline`);
    process.exit(1);
  });
  for (const viewport of viewports.filter((entry) => entry.isDirectory())) {
    for (const file of await readdir(path.join(root, viewport.name))) {
      if (file.endsWith(".png")) found.set(`${viewport.name}/${file}`, path.join(root, viewport.name, file));
    }
  }
  return found;
}

const baseline = await pngsIn(baselineRoot);
const current = await pngsIn(currentRoot);

let failures = 0;
let compared = 0;

for (const [key, currentPath] of current) {
  const basePath = baseline.get(key);
  if (!basePath) {
    console.log(`NEW      ${key}`);
    continue;
  }

  const a = PNG.sync.read(await readFile(basePath));
  const b = PNG.sync.read(await readFile(currentPath));

  if (a.width !== b.width || a.height !== b.height) {
    console.log(`SIZE     ${key}  ${a.width}x${a.height} → ${b.width}x${b.height}`);
    failures += 1;
    continue;
  }

  const diff = new PNG({ width: a.width, height: a.height });
  const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 });
  const ratio = changed / (a.width * a.height);
  compared += 1;

  if (ratio > threshold) {
    const out = path.join(diffRoot, key);
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, PNG.sync.write(diff));
    console.log(`CHANGED  ${key}  ${(ratio * 100).toFixed(2)}%  → ${path.relative(process.cwd(), out)}`);
    failures += 1;
  }
}

for (const key of baseline.keys()) {
  if (!current.has(key)) console.log(`MISSING  ${key}`);
}

console.log(`\n${compared} compared, ${failures} over threshold (${(threshold * 100).toFixed(2)}%)`);
process.exit(failures > 0 ? 1 : 0);
