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
  assert.match(canvas, /frameloop="demand"/);
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
  assert.match(canvas, /float gravity = smoothstep\(0\.14, 0\.32, uProgress\);/);
  assert.match(canvas, /const remnantUniforms = useMemo[\s\S]*?\[emptyTexture\],\n\s*\);/);
});
