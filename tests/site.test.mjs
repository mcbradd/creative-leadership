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
  assert.match(app, /We turn IP into worlds people can/);
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

  assert.match(app, /href="#team"/);
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

test("ships a progressively enhanced single-canvas experience", async () => {
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
  assert.match(canvas, /progress/);
  assert.match(canvas, /target/);
  assert.match(canvas, /fragmentShader/);
  assert.doesNotMatch(canvas, /ParticleResolve|WorldSeed/);
  assert.match(app, /class HeroLazyBoundary/);
  assert.match(canvas, /gl\.debug\.onShaderError/);
  assert.match(canvas, /<FirstFrameReady/);
  assert.doesNotMatch(canvas, /gl\.compile\(scene, camera\)/);
});

test("keeps representation balanced in the featured case sequence", async () => {
  const content = await readFile(new URL("src/content.ts", root), "utf8");
  const caseBlock = content.split("export const caseStudies")[1].split("export const partners")[0];
  const owners = [...caseBlock.matchAll(/owner: "(Bradd|Stone)"/g)].map((match) => match[1]);
  assert.deepEqual(owners.slice(0, 6), ["Bradd", "Stone", "Bradd", "Stone", "Bradd", "Stone"]);
});

test("never derives hero-copy visibility from a restored scroll offset", async () => {
  const [app, css] = await Promise.all([
    readFile(new URL("src/App.tsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);

  assert.doesNotMatch(app, /window\.scrollY\s*\/\s*transitionDistance/);
  assert.doesNotMatch(app, /setHeroProgress/);
  assert.doesNotMatch(css, /\.hero-copy\s*\{[^}]*opacity:\s*calc/s);
});

test("drives the live shader materials instead of detached uniform descriptors", async () => {
  const canvas = await readFile(new URL("src/hero/HeroExperience.tsx", root), "utf8");

  assert.match(canvas, /particles\.current\.uniforms\.uProgress\.value/);
  assert.match(canvas, /backdrop\.current\.uniforms\.uProgress\.value/);
  assert.match(canvas, /remnant\.current\.uniforms\.uProgress\.value/);
  assert.match(canvas, /remnant\.current\.uniforms\.uAccretionMap\.value/);
  // Two clocks. The scroll-derived value arrives as a ref and is damped in the
  // frame loop; writing it into a uniform directly is what made the hero a flipbook.
  assert.match(canvas, /progressRef: MutableRefObject<number>/);
  assert.match(canvas, /narrative\.current = damp\(previous, goal, NARRATIVE_LAMBDA, dt\);/);
  assert.doesNotMatch(canvas, /uProgress\.value = progress/);
  assert.doesNotMatch(canvas, /uProgress\.value = clamped/);
  // \r?\n — the source-text contract must hold on CRLF checkouts too, not just CI's LF.
  assert.match(canvas, /const remnantUniforms = useMemo[\s\S]*?\[emptyTexture\],\r?\n\s*\);/);
});

test("keeps the particle field unbounded so its edge can never enter frame", async () => {
  const canvas = await readFile(new URL("src/hero/HeroExperience.tsx", root), "utf8");

  // The original defect: a bounded point cloud multiplied up to 3.1x, whose convex
  // hull crossed into the frustum as a hard, cropped edge.
  assert.doesNotMatch(canvas, /core \*= mix\(0\.72, 3\.1, swelling\)/);
  assert.doesNotMatch(canvas, /position \* mix\(1\.0, 0\.105, gravity\)/);

  // Position is derived from a cone seed and wrapped in a travelling depth slab.
  assert.match(canvas, /float slabZ = -uSpan \+ mod\(aCone\.z \* uSpan - uTravel - uAmbient\.z, uSpan\);/);
  assert.match(canvas, /float coneRadius = aCone\.x \* uConeSlope \* depth;/);
  // Approach is a camera move, not a multiplier on the geometry.
  assert.match(canvas, /float coreDistance = mix\(15\.0, 6\.6, approach\);/);
  // Both falloffs, or the wrap event and the dataset edge both become visible.
  assert.match(canvas, /1\.0 - smoothstep\(uRadialFade\.x, uRadialFade\.y, aCone\.x\)/);
  assert.match(canvas, /smoothstep\(0\.015, 0\.09, depthNormal\) \* \(1\.0 - smoothstep\(0\.8, 1\.0, depthNormal\)\)/);
});

test("cross-fades hero chapters on a continuous weight rather than an attribute swap", async () => {
  const [app, css] = await Promise.all([
    readFile(new URL("src/App.tsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);

  // Weights are written as custom properties from a rAF loop, not as React state,
  // so scrolling never re-renders the tree at frame rate.
  assert.match(app, /hero\.style\.setProperty\(`--w-\$\{id\}`/);
  assert.match(app, /narrative\.current = damp\(narrative\.current, scrollTarget\.current, lambda, dt\);/);
  assert.doesNotMatch(app, /setProgress/);

  assert.match(css, /\.hero-copy, \.hero-chapter \{[^}]*opacity: var\(--w\)/);
  assert.match(css, /\.hero-poster \{ --w: var\(--w-poster, 1\); \}/);
  // The old swap keyed six display-type blocks off one attribute, which is the
  // slideshow the sequence used to read as.
  assert.doesNotMatch(css, /\.hero\[data-phase="gravity"\] \.hero-gravity,[\s\S]*?\.hero\[data-phase="swelling"\]/);
  // A vignette pinned to a fixed point sat still while the field flew past it.
  assert.doesNotMatch(css, /radial-gradient\(circle at 76% 48%/);
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
