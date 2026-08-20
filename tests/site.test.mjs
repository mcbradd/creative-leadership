import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("publishes a private-by-convention executive artifact with an immediate proposition", async () => {
  const [html, app, content] = await Promise.all([
    source("index.html"),
    source("src/App.tsx"),
    source("src/content.ts"),
  ]);

  assert.match(html, /noindex, nofollow, noarchive/);
  assert.match(html, /Bradd \+ Stone — Creative Leadership/);
  assert.match(app, /We turn IP into worlds people can/);
  assert.match(app, /One accountable team from first idea to market-ready experience\./);
  assert.match(app, /Not two résumés\.[\s\S]*One shipped result\./);
  assert.match(content, /two successful seed rounds totaling more than \$7M/i);
  assert.match(app, /<main id="main-content" tabIndex=\{-1\}>/);
});

test("does not expose private opportunity language", async () => {
  const files = await Promise.all([
    source("src/App.tsx"),
    source("src/content.ts"),
    source("index.html"),
  ]);
  const publicCopy = files.join("\n");

  assert.doesNotMatch(publicCopy, /Upper Deck|Carlin|Danny Trejo|Year of (the )?Devil/i);
});

test("uses a mobile-first responsive shell with safe dynamic overlays", async () => {
  const css = await source("src/styles.css");

  assert.match(css, /@media \(min-width: 700px\)/);
  assert.match(css, /@media \(min-width: 1020px\)/);
  assert.match(css, /@media \(max-width: 699px\) and \(max-height: 650px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /100dvh/);
  assert.match(css, /env\(safe-area-inset-(?:top|right|bottom|left)\)/);
  assert.match(css, /font-kerning: normal/);
  assert.match(css, /Mona Sans Variable/);
  assert.match(css, /Source Serif 4 Variable/);
  assert.doesNotMatch(css, /Inter Variable|Newsreader Variable|Arial Narrow|Aptos Narrow/);
});

test("exposes four explicit hero chapters without trapping wheel scrolling", async () => {
  const app = await source("src/App.tsx");
  const chapterBlock = app.split("const heroChapters = [")[1].split("] as const;")[0];
  const ids = [...chapterBlock.matchAll(/id: "([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(ids, ["proposition", "partnership", "translation", "proof"]);
  assert.match(app, /className="hero-scene-nav"/);
  assert.match(app, /aria-pressed=\{scene === chapter\.id\}/);
  assert.match(app, /onClick=\{\(\) => setScene\(chapter\.id\)\}/);
  assert.match(app, /onKeyDown=\{\(event\) => handleChapterKey\(event, index\)\}/);
  assert.match(app, /event\.key === "ArrowRight" \|\| event\.key === "ArrowDown"/);
  assert.match(app, /event\.key === "ArrowLeft" \|\| event\.key === "ArrowUp"/);
  assert.match(app, /event\.key === "Home"/);
  assert.match(app, /event\.key === "End"/);
  assert.doesNotMatch(app, /addEventListener\("wheel"|onWheel|WheelEvent/);
});

test("renders complete situation, contribution, evidence, relevance, and attribution disclosures", async () => {
  const [app, content] = await Promise.all([
    source("src/App.tsx"),
    source("src/content.ts"),
  ]);

  for (const field of ["statement", "brief", "moves", "proof", "relevance", "sourceNote"]) {
    assert.match(content, new RegExp(`${field}\\??: `), `content schema must expose ${field}`);
  }
  assert.match(content, /owner: "Bradd" \| "Stone" \| "Joint"/);
  assert.match(content, /relationship: string/);
  assert.match(content, /export const jointInsights/);
  assert.match(app, /aria-describedby="detail-summary"/);
  assert.match(app, /01 \/ The situation/);
  assert.match(app, /02 \/ Why it matters/);
  assert.match(app, /detail\.relevance/);
  assert.match(app, /detail\.moves\.map/);
  assert.match(app, /detail\.proof\.map/);
  assert.match(app, /04 \/ Evidence in context/);
  assert.match(app, /detail\.sourceNote &&/);
  assert.match(app, /Attribution note/);
});

test("uses real evidence imagery for every range lens and removes the abstract seed", async () => {
  const [app, content, css] = await Promise.all([
    source("src/App.tsx"),
    source("src/content.ts"),
    source("src/styles.css"),
  ]);

  assert.match(content, /export const rangeVisuals/);
  assert.match(content, /play: \{ image: "ultimate-rivals-hires\.webp"/);
  assert.match(content, /collect: \{ image: "stone-raid-hires\.webp"/);
  assert.match(content, /grow: \{ image: "stone-chaotic-hires\.webp"/);
  assert.match(app, /className="range-visual"/);
  assert.match(app, /src=\{media\(rangeVisual\.image\)\}/);
  assert.match(app, /alt=\{rangeVisual\.alt\}/);
  assert.doesNotMatch(`${app}\n${css}`, /range-seed|data-mode=|WorldSeed/);
});

test("makes modal, navigation, toast, and visual-card affordances actionable", async () => {
  const [app, css] = await Promise.all([
    source("src/App.tsx"),
    source("src/styles.css"),
  ]);

  assert.match(app, /function DetailDialog/);
  assert.match(app, /function NavigationDialog/);
  assert.match(app, /function Toast/);
  assert.match(app, /dialog\.showModal\(\)/);
  assert.match(app, /className="detail-dialog" aria-modal="true"/);
  assert.match(app, /className="nav-dialog" aria-modal="true"/);
  assert.match(app, /aria-expanded=\{navOpen\}/);
  assert.match(app, /aria-label="Open presentation navigation"/);
  assert.match(app, /role="status" aria-live="polite"/);
  assert.match(app, /aria-label="Dismiss notification"/);
  assert.match(app, /showNotice\("Email copied\.[^\n]+"success"\)/);
  assert.match(app, /showNotice\(`Copy was unavailable\.[^\n]+"info"\)/);
  assert.match(app, /data-fit-check/);
  assert.match(app, /target="_blank" rel="noopener noreferrer"/);
  assert.match(app, /className="proof-visual"[^>]*onClick/s);
  assert.match(app, /className="collab-art"[^>]*onClick/s);
  assert.match(app, /className=\{`supporting-card[^>]*onClick=\{\(\) => openInsight\(item\)\}/s);
  assert.match(css, /\.detail-dialog, \.nav-dialog \{[^}]*100dvh/s);
  assert.match(css, /\.toast \{[^}]*position: fixed/s);
  assert.match(css, /\.toast button \{[^}]*min-width: 44px;[^}]*min-height: 44px/s);
});

test("keeps representation balanced in the featured case sequence", async () => {
  const content = await source("src/content.ts");
  const caseBlock = content.split("export const caseStudies")[1].split("export const partners")[0];
  const owners = [...caseBlock.matchAll(/owner: "(Bradd|Stone)"/g)].map((match) => match[1]);
  assert.deepEqual(owners.slice(0, 6), ["Bradd", "Stone", "Bradd", "Stone", "Bradd", "Stone"]);
});

test("attributes self-reported figures and drops unconfirmed ones", async () => {
  const [app, content] = await Promise.all([
    source("src/App.tsx"),
    source("src/content.ts"),
  ]);
  const copy = `${app}\n${content}`;

  // C09: the public mask count is not confirmed for this exact Crayola scope.
  assert.doesNotMatch(copy, /250\+|more than 250|over 250/i);
  // C05: canonical team scaling is four to 55+, never the earlier five-to-80 draft.
  assert.doesNotMatch(copy, /5 to 80|5 → 80/);
  assert.match(content, /4 → 55\+/);
  // C02: the raise remains a team outcome, not sole credit.
  assert.doesNotMatch(copy, /\$40M\+/);
  assert.match(content, /team financing outcome reported at \$40M/i);
  assert.match(content, /The raise was a team outcome/);
  // C07: internal chart-performance language remains visibly qualified.
  assert.match(app, /internal reporting says the game remained at or near the top of Apple Arcade for 6\+ weeks/);
  // C08: name the faculty context without inventing a credential.
  assert.doesNotMatch(copy, /MFA-level/);
  assert.match(copy, /Game Design MFA faculty at LCAD/);
  // C11: Stone's experience anchor remains attributed.
  assert.match(content, /28 years/);
  assert.match(content, /per his public résumé/);
  // C15: portfolio relationships never become an unsupported production credit.
  assert.doesNotMatch(copy, /Batman: The Animated Series/);
  // Self-reported evidence carries its attribution into the complete disclosure.
  assert.match(content, /sourceNote\?: string/);
  assert.match(app, /detail\.sourceNote/);
});
