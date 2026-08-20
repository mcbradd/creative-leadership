import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("publishes a private-by-convention executive artifact", async () => {
  const [html, app, content] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("src/App.tsx", root), "utf8"),
    readFile(new URL("src/content.ts", root), "utf8"),
  ]);

  assert.match(html, /noindex, nofollow, noarchive/);
  assert.match(html, /Bradd \+ Stone — Creative Leadership/);
  assert.match(app, /WE TURN IP INTO WORLDS PEOPLE CAN/);
  assert.match(app, /Not two résumés\. One shipped result\./);
  assert.match(app, /We build people who build worlds\./);
  assert.match(content, /Two successful funding rounds/);
  assert.match(app, /aria-modal="true"/);
  assert.match(app, /<main id="main-content" tabIndex=\{-1\}>/);
});

test("does not expose private opportunity language", async () => {
  const files = await Promise.all([
    readFile(new URL("src/App.tsx", root), "utf8"),
    readFile(new URL("src/content.ts", root), "utf8"),
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
  assert.match(css, /Mona Sans Variable/);
  assert.match(css, /Source Serif 4 Variable/);
  assert.doesNotMatch(css, /Inter Variable|Newsreader Variable/);
  assert.doesNotMatch(css, /Arial Narrow|Aptos Narrow/);
});

test("makes every visual affordance actionable and uses upgraded proof imagery", async () => {
  const [app, css] = await Promise.all([
    readFile(new URL("src/App.tsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);

  assert.match(app, /onClick=\{continueFromHero\}/);
  assert.match(app, /role="tablist"/);
  assert.match(app, /role="tabpanel"/);
  assert.match(app, /onClick=\{\(\) => openInsight\(insight\)\}/);
  assert.match(app, /target="_blank" rel="noopener noreferrer"/);
  assert.match(app, /tetris-beat-cover\.webp/);
  assert.match(app, /tetris-beat-gameplay\.webp/);
  assert.match(app, /crayola-funny-faces-front\.webp/);
  assert.match(app, /<dialog/);
  assert.match(css, /\.experience-canvas \{[^}]*pointer-events: none/s);
  assert.match(css, /\.social-button \{/);
});

test("ships a progressively enhanced, continuously alive archive experience", async () => {
  const [app, experience, canvas] = await Promise.all([
    readFile(new URL("src/App.tsx", root), "utf8"),
    readFile(new URL("src/experience.ts", root), "utf8"),
    readFile(new URL("src/hero/HeroExperience.tsx", root), "utf8"),
  ]);

  assert.match(app, /lazy\(\(\) => import\("\.\/hero\/HeroExperience"\)\)/);
  assert.match(experience, /"static" \| "motion" \| "webgl" \| "webgpu"/);
  assert.match(experience, /saveData/);
  assert.match(experience, /requestedCinematic/);
  assert.match(canvas, /frameloop=\{active \? "always" : "demand"\}/);
  assert.match(canvas, /powerPreference: "high-performance"/);
  assert.match(canvas, /sceneRef: MutableRefObject<number>/);
  assert.match(canvas, /useFrame\(\(\{ clock \}, delta\)/);
  assert.match(canvas, /THREE\.MathUtils\.damp/);
  assert.match(canvas, /bradd-portrait\.webp/);
  assert.match(canvas, /stone-portrait\.webp/);
  assert.match(canvas, /tetris-beat-gameplay\.webp/);
  assert.match(canvas, /stone-raid-hires\.webp/);
  assert.match(canvas, /stone-chaotic-hires\.webp/);
  assert.match(canvas, /<DepthArchitecture/);
  assert.doesNotMatch(canvas, /ParticleResolve|WorldSeed/);
  assert.doesNotMatch(canvas, /particle|starfield|black hole/i);
  assert.match(app, /class HeroLazyBoundary/);
  assert.match(canvas, /gl\.debug\.onShaderError/);
  assert.match(canvas, /<FirstFrameReady/);
  assert.match(canvas, /nearWhite \/ opaque > 0\.55/);
  assert.doesNotMatch(canvas, /gl\.compile\(scene, camera\)/);
});

test("keeps representation balanced in the featured case sequence", async () => {
  const content = await readFile(new URL("src/content.ts", root), "utf8");
  const caseBlock = content.split("export const caseStudies")[1].split("export const partners")[0];
  const owners = [...caseBlock.matchAll(/owner: "(Bradd|Stone)"/g)].map((match) => match[1]);
  assert.deepEqual(owners.slice(0, 6), ["Bradd", "Stone", "Bradd", "Stone", "Bradd", "Stone"]);
});

test("never binds hero visibility or animation time directly to scroll position", async () => {
  const [app, css] = await Promise.all([
    readFile(new URL("src/App.tsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);

  assert.doesNotMatch(app, /window\.scrollY\s*\/\s*transitionDistance/);
  assert.doesNotMatch(app, /setHeroProgress/);
  assert.doesNotMatch(app, /scrollTarget|progressRef|--hero-progress/);
  assert.doesNotMatch(css, /\.hero-copy\s*\{[^}]*opacity:\s*calc/s);
  assert.match(app, /const onWheel = \(event: WheelEvent\)/);
  assert.match(app, /goToScene\(current \+ direction\)/);
  assert.match(app, /touchend/);
  assert.match(app, /PageDown/);
  assert.match(app, /matchMedia\("\(max-width: 620px\)"\)/);
});

test("retargets every archive surface gracefully in either direction", async () => {
  const canvas = await readFile(new URL("src/hero/HeroExperience.tsx", root), "utf8");

  assert.match(canvas, /const target = POSES\[definition\.id\]\[scene\]/);
  assert.match(canvas, /group\.position\.x = THREE\.MathUtils\.damp/);
  assert.match(canvas, /group\.rotation\.y = THREE\.MathUtils\.damp/);
  assert.match(canvas, /currentOpacity\.current = THREE\.MathUtils\.damp/);
  assert.match(canvas, /clock\.elapsedTime/);
  assert.doesNotMatch(canvas, /uProgress|scrollY|wheel/i);
});

test("guarantees an editorial fallback and an unblankable chapter cross-fade", async () => {
  const [app, css] = await Promise.all([
    readFile(new URL("src/App.tsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);

  assert.match(app, /className="archive-poster"/);
  assert.match(app, /archive-poster-collect/);
  assert.match(app, /archive-poster-grow/);
  assert.match(app, /className="hero-running-promise"/);
  assert.match(css, /\.hero-scene \{[^}]*transition: opacity \.55s ease, transform \.9s/s);
  assert.match(css, /\.hero\[data-scene-index="0"\] \.hero-scene-proposition/);
  assert.match(css, /\.hero\[data-enhanced="true"\] \.hero-cinematic \{ opacity: 1; \}/);
  assert.match(css, /\.hero\[data-enhanced="true"\] \.archive-poster \{ opacity: 0; \}/);
  assert.doesNotMatch(app, /data-phase/);
  assert.doesNotMatch(css, /core \*=|scale\(3\.1\)|particle/i);
});

test("attributes self-reported figures and drops unconfirmed ones", async () => {
  const [app, content] = await Promise.all([
    readFile(new URL("src/App.tsx", root), "utf8"),
    readFile(new URL("src/content.ts", root), "utf8"),
  ]);
  const copy = `${app}
${content}`;

  // C09 is unresolved: the "over 250" figure is sourced to a different product line.
  assert.doesNotMatch(copy, /250\+|more than 250|over 250/i);
  // C05: the canonical scaling figure, in both the chips and the timeline.
  assert.doesNotMatch(copy, /5 to 80|5 → 80/);
  assert.match(content, /Teams from 4 to 55\+/);
  assert.match(content, /4 → 55\+/);
  // C02: never sole credit for the raise.
  assert.doesNotMatch(copy, /\$40M\+/);
  assert.match(content, /Team pitch behind a \$40M raise/);
  // C07: canonical internal wording, with the source named.
  assert.match(app, /at or near the top of Apple Arcade for 6\+ weeks/);
  // C08: name the institution instead of implying a credential level.
  assert.doesNotMatch(copy, /MFA-level/);
  assert.match(content, /Game Design MFA faculty, LCAD/);
  // C11: Stone's depth anchor, attributed.
  assert.match(content, /28 years/);
  assert.match(content, /per his public résumé/);
  // C15: a portfolio relationship, not a specific production credit.
  assert.doesNotMatch(copy, /Batman: The Animated Series/);
  // Self-reported production metrics carry their attribution into the dialog.
  assert.match(content, /sourceNote\?: string;/);
  assert.match(app, /detail\.sourceNote/);
});
