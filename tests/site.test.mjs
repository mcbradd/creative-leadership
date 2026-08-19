import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("publishes a private-by-convention executive artifact", async () => {
  const [html, app] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("src/App.tsx", root), "utf8"),
  ]);

  assert.match(html, /noindex, nofollow, noarchive/);
  assert.match(html, /Bradd \+ Stone — Creative Leadership/);
  assert.match(app, /We turn IP into worlds people can/);
  assert.match(app, /Not two résumés\. One shipped result\./);
  assert.match(app, /We build people who build worlds\./);
  assert.match(app, /aria-modal="true"/);
});

test("does not expose private opportunity language", async () => {
  const files = await Promise.all([
    readFile(new URL("src/App.tsx", root), "utf8"),
    readFile(new URL("index.html", root), "utf8"),
  ]);
  const publicCopy = files.join("\n");

  assert.doesNotMatch(publicCopy, /Upper Deck|Carlin|Danny Trejo|Year of (the )?Devil/i);
});

test("keeps the live artifact responsive and motion-aware", async () => {
  const css = await readFile(new URL("src/styles.css", root), "utf8");
  assert.match(css, /@media \(max-width: 620px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /font-kerning: normal/);
  assert.doesNotMatch(css, /Arial Narrow|Aptos Narrow/);
});

test("makes every visual affordance actionable and uses upgraded proof imagery", async () => {
  const [app, css] = await Promise.all([
    readFile(new URL("src/App.tsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);

  assert.match(app, /href="#team"/);
  assert.match(app, /onClick=\{\(\) => openInsight\(insight\)\}/);
  assert.match(app, /target="_blank" rel="noopener noreferrer"/);
  assert.match(app, /tetris-beat-cover\.webp/);
  assert.match(app, /crayola-funny-faces-front\.webp/);
  assert.match(css, /\.hero-orbit \{[^}]*pointer-events: none/s);
  assert.match(css, /\.social-button \{/);
});
