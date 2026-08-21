import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function webpDimensions(file) {
  const data = await readFile(new URL(`public/media/${file}`, root));
  assert.equal(data.subarray(0, 4).toString(), "RIFF", `${file}: invalid RIFF header`);
  assert.equal(data.subarray(8, 12).toString(), "WEBP", `${file}: invalid WebP header`);

  for (let offset = 12; offset + 8 <= data.length;) {
    const type = data.subarray(offset, offset + 4).toString();
    const size = data.readUInt32LE(offset + 4);
    const payload = offset + 8;
    if (type === "VP8 ") {
      assert.equal(data.subarray(payload + 3, payload + 6).toString("hex"), "9d012a", `${file}: invalid VP8 frame`);
      return {
        width: data.readUInt16LE(payload + 6) & 0x3fff,
        height: data.readUInt16LE(payload + 8) & 0x3fff,
      };
    }
    if (type === "VP8L") {
      const bits = data.readUInt32LE(payload + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
      };
    }
    if (type === "VP8X") {
      return {
        width: data.readUIntLE(payload + 4, 3) + 1,
        height: data.readUIntLE(payload + 7, 3) + 1,
      };
    }
    offset = payload + size + (size % 2);
  }
  assert.fail(`${file}: no WebP dimension chunk`);
}

test("publishes a private executive presentation with the approved proposition", async () => {
  const [html, app] = await Promise.all([source("index.html"), source("src/App.tsx")]);

  assert.match(html, /noindex, nofollow, noarchive/);
  assert.match(html, /Bradd \+ Stone: Creative Leadership/);
  assert.match(app, /WE TURN IP INTO/);
  assert.match(app, /PLAY,[\s\S]*COLLECT,[\s\S]*AND[\s\S]*GROW\./);
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

test("keeps the presentation cue label-only without a numeric slide counter", async () => {
  const app = await source("src/App.tsx");
  const cue = app.split("function PresentationCue")[1].split("function HeroControls")[0];
  const industry = app.split("function IndustrySlide")[1].split("function WorkSlide")[0];

  assert.match(cue, /className="cue-copy"[\s\S]*\{current\.label\}/);
  assert.doesNotMatch(cue, /String\(active \+ 1\)|padStart\(2, "0"\)[\s\S]*slides\.length/);
  assert.doesNotMatch(industry, /padStart\(2, "0"\)[\s\S]*partners\.length|partnerIndex \+ 1[\s\S]*\/\s*\{partners\.length\}/);
});

test("keeps visual affordances honest and clips the range shine to its text", async () => {
  const [app, css] = await Promise.all([source("src/App.tsx"), source("src/styles.css")]);

  assert.match(app, /className="sweep-label"/);
  assert.match(
    css,
    /\.sweep-label::after\s*\{[^}]*content:\s*attr\(data-text\);[^}]*background:[^}]*background-clip:\s*text;/s,
  );
  assert.doesNotMatch(css, /\.sweep-link::(?:before|after)/);
  assert.doesNotMatch(css, /\.range-stage:hover\s*>\s*img/);
  assert.doesNotMatch(css, /\.featured-case:hover\s*>\s*img/);
  assert.doesNotMatch(css, /\.detail-hero::(?:before|after)/);
});

test("uses real partner marks and the approved business-momentum language", async () => {
  const [app, content] = await Promise.all([source("src/App.tsx"), source("src/content.ts")]);

  assert.doesNotMatch(app, /partnerCodes/);
  assert.match(
    content,
    /label: "BUSINESS MOMENTUM",\s*value: "\$50,000,000\+",\s*note: "Across multiple funding rounds and Personal Pitches"/,
  );
  assert.doesNotMatch(content, /label: "BUSINESS MOMENTUM",\s*value: "2 rounds"/);
});

test("makes the detail article the only scrollable content surface and closes it through history", async () => {
  const [app, css] = await Promise.all([source("src/App.tsx"), source("src/styles.css")]);

  assert.match(app, /className="detail-surface"[\s\S]*role="dialog"[\s\S]*aria-modal="true"/);
  assert.match(app, /className="detail-article"[\s\S]*tabIndex=\{-1\}/);
  for (const label of ["Situation", "How it was led", "Evidence and results", "Why it matters"]) {
    assert.match(app, new RegExp(label));
  }
  assert.doesNotMatch(app, /className="source-note"|Source context|detail\.sourceNote/);
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

test("uses the native-resolution Tetris stills, portrait poster, and restored Range artwork", async () => {
  const [app, content] = await Promise.all([source("src/App.tsx"), source("src/content.ts")]);
  const portfolioBlock = app.split("const tetrisPortfolioMedia = [")[1].split("];", 1)[0];
  const rangeBlock = content.split("export const rangeVisuals")[1].split("export const caseStudies", 1)[0];
  const gameplayStills = [
    "tetris-main-menu-vfx.webp",
    "tetris-summersalts.webp",
    "tetris-falling-fantasy.webp",
    "tetris-accidental-love.webp",
  ];

  for (const file of gameplayStills) assert.ok(portfolioBlock.includes(`image: "${file}"`), `${file}: missing from Tetris gallery`);
  assert.deepEqual(
    await Promise.all(gameplayStills.map(webpDimensions)),
    gameplayStills.map(() => ({ width: 2560, height: 1440 })),
  );

  assert.equal((app.match(/posterSrc=\{media\("tetris-reel-poster\.webp"\)\}/g) ?? []).length, 2);
  assert.deepEqual(await webpDimensions("tetris-reel-poster.webp"), { width: 1242, height: 2208 });

  const rangeArtwork = [
    ["play", "case-ultimate-rivals-restored.webp"],
    ["grow", "case-chaotic-restored.webp"],
  ];
  for (const [lens, file] of rangeArtwork) {
    assert.match(rangeBlock, new RegExp(`${lens}: \\{ image: "${file.replaceAll(".", "\\.")}"`));
    assert.deepEqual(await webpDimensions(file), { width: 1920, height: 1080 });
  }
});

test("keeps representation balanced and concrete", async () => {
  const [app, content] = await Promise.all([source("src/App.tsx"), source("src/content.ts")]);
  const caseBlock = content.split("export const caseStudies")[1].split("export const partners")[0];
  const owners = [...caseBlock.matchAll(/owner: "(Bradd|Stone)"/g)].map((match) => match[1]);
  const copy = `${app}\n${content}`;

  assert.deepEqual(owners.slice(0, 6), ["Bradd", "Stone", "Bradd", "Stone", "Bradd", "Stone"]);
  assert.doesNotMatch(copy, /250\+|more than 250|over 250/i);
  assert.doesNotMatch(copy, /5 to 80|5 → 80/);
  assert.match(copy, /4 → 55\+/);
  assert.match(copy, /\$50,000,000\+/);
  assert.match(copy, /Across multiple funding rounds and Personal Pitches/);
  assert.match(copy, /28 years/);
  assert.doesNotMatch(copy, /Batman: The Animated Series/);
});

test("removes qualifier language without dropping concrete factual evidence", async () => {
  const [app, content] = await Promise.all([source("src/App.tsx"), source("src/content.ts")]);
  const copy = `${app}\n${content}`;
  const stringLiterals = [...copy.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)]
    .map((match) => match[1])
    .join("\n");

  for (const phrase of [
    "self-reported",
    "internal production record",
    "public résumé",
    "no endorsement",
    "reported at",
  ]) {
    assert.doesNotMatch(stringLiterals, new RegExp(phrase, "i"));
  }
  assert.doesNotMatch(app, /Source context|className="source-note"|detail\.sourceNote/);

  for (const fact of [/42 live levels/i, /20\+ artists/i, /Bucharest[\s\S]*Guadalajara/i, /4 → 55\+/, /28 years/, /\$50,000,000\+/]) {
    assert.match(copy, fact);
  }
});
