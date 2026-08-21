import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("publishes a private executive presentation with the approved proposition", async () => {
  const [html, app] = await Promise.all([source("index.html"), source("src/App.tsx")]);

  assert.match(html, /noindex, nofollow, noarchive/);
  assert.match(html, /Bradd \+ Stone: Creative Leadership/);
  assert.match(app, /WE TURN IP INTO/);
  assert.match(app, /PLAY, COLLECT, AND GROW\./);
  assert.match(app, /NOT TWO RÉSUMÉS\.[\s\S]*ONE SHIPPED RESULT\./);
  assert.doesNotMatch(`${html}\n${app}`, /Upper Deck|Carlin|Danny Trejo|Year of (the )?Devil/i);
});

test("defines exactly eleven full-viewport overview slides in one presentation root", async () => {
  const [app, css] = await Promise.all([source("src/App.tsx"), source("src/styles.css")]);
  const ids = [
    "top",
    "capabilities",
    "team",
    "proof",
    "range",
    "industry-proof",
    "work",
    "collaboration",
    "depth",
    "mentorship",
    "contact",
  ];

  assert.equal((app.match(/<section\s+id=/g) ?? []).length, 11);
  for (const id of ids) assert.match(app, new RegExp(`<section\\s+id="${id}"`));
  assert.match(app, /<main[^>]*className="presentation"/s);
  assert.match(css, /\.presentation \{[^}]*height: 100dvh;[^}]*overflow-x: hidden;[^}]*overflow-y: auto;/s);
  assert.match(css, /\.presentation-slide \{[^}]*height: 100dvh;[^}]*min-height: 100dvh;[^}]*overflow: clip;/s);
  assert.doesNotMatch(css, /\.presentation-slide[^\{]*\{[^}]*overflow-y:\s*(?:auto|scroll)/s);
});

test("uses static overview cards and compact selectors instead of horizontal subdecks", async () => {
  const [app, css] = await Promise.all([source("src/App.tsx"), source("src/styles.css")]);

  assert.match(app, /className="leader-grid"/);
  assert.equal((app.match(/<LeaderCard leader=/g) ?? []).length, 2);
  assert.match(app, /className="partner-selector"/);
  assert.match(app, /partners\.map/);
  assert.match(app, /className="case-selector"/);
  assert.match(app, /caseStudies\.slice\(0, 6\)\.map/);
  assert.match(app, /className="depth-board"/);
  assert.doesNotMatch(`${app}\n${css}`, /leader-deck|leader-deck-cue|dual-timeline|timeline-track|scroll-snap-type:\s*x|overflow-x:\s*auto/);
});

test("keeps Connect, Explore, and the corrected first cue in the persistent header system", async () => {
  const app = await source("src/App.tsx");

  assert.match(app, />\s*CONNECT\s*<ArrowUpRight/);
  assert.match(app, />\s*EXPLORE\s*/);
  assert.match(app, /aria-expanded=\{exploreOpen\}/);
  assert.match(app, /aria-controls="explore-panel"/);
  assert.match(app, /\{ id: "top", label: "Superpowers combined" \}/);
  const navBlock = app.split("const navItems = [")[1].split("] as const;")[0];
  assert.equal((navBlock.match(/label: "/g) ?? []).length, 6);
  for (const label of ["The partnership", "Proven together", "Play · Collect · Grow", "Selected case files", "Individual depth", "Start a conversation"]) {
    assert.match(navBlock, new RegExp(`label: "${label.replace(/[·]/g, "\\·")}"`));
  }
  assert.doesNotMatch(app, /hamburger|menu-lines|Open presentation navigation/);
});

test("makes the detail article the only scrollable content surface and closes it through history", async () => {
  const [app, css] = await Promise.all([source("src/App.tsx"), source("src/styles.css")]);

  assert.match(app, /className="detail-surface"[\s\S]*role="dialog"[\s\S]*aria-modal="true"/);
  assert.match(app, /className="detail-article"[\s\S]*tabIndex=\{-1\}/);
  for (const label of ["Situation", "How it was led", "Evidence and results", "Why it matters", "Source context"]) {
    assert.match(app, new RegExp(label));
  }
  assert.match(app, /window\.history\.pushState\(\{ braddStoneDetail: true \}, ""\)/);
  assert.match(app, /window\.history\.back\(\)/);
  assert.match(app, /addEventListener\("popstate"/);
  assert.match(css, /\.detail-article \{[^}]*overflow-x: hidden;[^}]*overflow-y: auto;/s);
  assert.doesNotMatch(css, /\.(?:leader-grid|leader-card|depth-board|depth-row|supporting-grid|partner-selector|case-selector)[^\{]*\{[^}]*overflow-[xy]:\s*(?:auto|scroll)/s);
});

test("prevents automatic hyphenation while retaining keyboard-only focus treatment", async () => {
  const css = await source("src/styles.css");

  assert.match(css, /body \{[^}]*hyphens: none;[^}]*overflow-wrap: normal;[^}]*word-break: normal;/s);
  assert.match(css, /:focus-visible \{[^}]*outline:\s*2px solid var\(--cyan\);[^}]*outline-offset:\s*3px;/s);
  assert.doesNotMatch(css, /hyphens:\s*auto|word-break:\s*break-all/);
});

test("uses the current headshot and the corrected Tetris production record", async () => {
  const [app, content] = await Promise.all([source("src/App.tsx"), source("src/content.ts")]);
  const copy = `${app}\n${content}`;

  assert.match(app, /bradd-headshot-2026\.webp/);
  assert.match(copy, /42 live levels/i);
  assert.match(copy, /12 levels in the original scope/i);
  assert.match(copy, /14 levels at launch/i);
  assert.match(copy, /28 more levels[\s\S]*42 total/i);
  assert.doesNotMatch(app, />28<|28\s+LIVE LEVELS/i);
  assert.match(copy, /20\+ artists/i);
  assert.match(copy, /Bucharest[\s\S]*Guadalajara/i);
});

test("keeps representation balanced and claims visibly qualified", async () => {
  const [app, content] = await Promise.all([source("src/App.tsx"), source("src/content.ts")]);
  const caseBlock = content.split("export const caseStudies")[1].split("export const partners")[0];
  const owners = [...caseBlock.matchAll(/owner: "(Bradd|Stone)"/g)].map((match) => match[1]);
  const copy = `${app}\n${content}`;

  assert.deepEqual(owners.slice(0, 6), ["Bradd", "Stone", "Bradd", "Stone", "Bradd", "Stone"]);
  assert.doesNotMatch(copy, /250\+|more than 250|over 250/i);
  assert.doesNotMatch(copy, /5 to 80|5 → 80/);
  assert.match(copy, /4 → 55\+/);
  assert.match(copy, /team financing outcome reported at \$40M/i);
  assert.match(copy, /28 years/);
  assert.match(copy, /per his public résumé/);
  assert.doesNotMatch(copy, /Batman: The Animated Series/);
});
