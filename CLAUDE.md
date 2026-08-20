# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page interactive executive one-pager ("Bradd + Stone — Creative Leadership"). Vite + React 19 + TypeScript, no router, no backend. Deployed to GitHub Pages from `main` via `.github/workflows/deploy-pages.yml`.

The empty top-level dirs (`app/`, `db/`, `drizzle/`, `worker/`, `examples/`, `.openai/`, `.vinext/`) are leftovers from a prior Next.js scaffold. Everything live is in `src/`, `index.html`, `public/`, `tests/`.

## Commands

```bash
npm run dev            # vite dev server
npm run build          # tsc --noEmit && vite build
npm test               # node --test tests/site.test.mjs (source-text contract)
npm run test:a11y      # axe against the rendered page (boots vite in-process)
npm run lint           # eslint src --max-warnings=0
node --test --test-name-pattern="responsive" tests/site.test.mjs   # single test
```

`npm run build` is the only typecheck — Vite doesn't typecheck on `dev`.

### Visual iteration

```bash
npm run shots            # 40 PNGs across 4 viewports → outputs/shots/
npm run shots:cinematic  # WebGL hero, all 6 scroll phases → outputs/cinematic/
npm run shots:baseline   # record outputs/baseline/
npm run visual-diff      # pixelmatch current vs baseline, non-zero exit on drift
npm run review           # Claude Opus 5 art-direction critique of outputs/shots/desktop
```

`outputs/` is gitignored — baselines are a local iteration aid, not CI. `SITE_URL=https://… ` points any of these at a deployed build instead of booting Vite.

`npm run review` needs `ANTHROPIC_API_KEY`.

`npm run verify:hero` drives a **GPU-backed** Chromium against the real hero and fails if the canvas is missing, blank or under 24fps. The shared capture harness forces SwiftShader for `fx=webgl`, which the renderer refuses on purpose, so this is the only check that proves the backdrop draws. Manual only — stock CI runners have no GPU. It also inherits `ANTHROPIC_BASE_URL` if set (this repo's `.claude/settings.local.json` sets one for Claude Code itself, which is a different process).

Desktop automation for anything outside the browser: `powershell -File scripts/desktop.ps1 <screenshot|windows|focus|click|type|keys|scroll|cursor>` (Windows-only, .NET, no dependencies).

## Architecture

- `src/App.tsx` — the whole page. Section components + `HeroSection` + `DetailDialog` (native `<dialog>` modal driven by a `Detail` union of `CaseStudy | Insight`). Media paths go through `media()`, which honors `import.meta.env.BASE_URL` — never hardcode `/media/...` or production breaks under the `/creative-leadership/` base.
- `src/content.ts` — all copy and data (case studies, insights, partners, timeline). Text edits belong here, not in JSX, unless the string is structural.
- `src/experience.ts` — `detectExperienceTier()` returns `static | motion | webgl | webgpu` from reduced-motion, `saveData`, `deviceMemory`/`hardwareConcurrency`, and a WebGL2 probe. Override in dev with `?fx=static|motion|webgl|webgpu`.
- `src/hero/HeroExperience.tsx` — the hero backdrop, lazy-loaded and only mounted for the `webgl`/`webgpu` tiers. Dependency-free raw WebGL2 (no three.js, no react-three-fiber): a fullscreen triangle from `gl_VertexID` and one fragment shader that raytraces Schwarzschild photon geodesics (RK4 over the Binet equation) for real gravitational lensing, plus Doppler beaming, gravitational redshift and Keplerian shear on the accretion disk.
  - The payoff line is a **cutout**: a glyph alpha mask is rasterised from per-character `Range` rects of `.hero-payoff` (so wrapped lines land exactly), uploaded as a texture, and the shader raymarches lava-lamp metaballs lit from a strip below wherever the mask is set. `.hero[data-static="false"] h1 em` goes transparent so the wax reads through the type; solid `--paper` is the fallback.
  - `QUALITY_TIERS` + a frame-time governor drop and restore steps/octaves/DPR. The climb-back bound must stay **above** a 60Hz vsync frame (16.7ms) or it can never fire on an ordinary display.
  - Never call `loseContext()` on unmount: `getContext()` returns the same object to the next mount, and StrictMode's remount then gets a dead context where every compile fails with a *null* info log.
  - Any failure (context, compile, link, lost context) calls `onFailure`, and `HeroVoidBoundary` in `App.tsx` drops silently back to the CSS hero.
- `src/styles.css` — hand-written CSS, no framework. Tokens in `:root`, hero state driven off `data-phase` / `data-enhanced` / `data-static` attributes and the `--hero-progress` custom property.

### Hero progression (the fragile part)

Scroll progress is computed in `HeroSection` from `heroRef.getBoundingClientRect()` — the element's own position, never `window.scrollY`. This is deliberate: deriving copy visibility from a restored scroll offset made hero text invisible on back-navigation, and `tests/site.test.mjs` asserts the broken patterns stay absent. `progress` flows to CSS (`--hero-progress`); the backdrop shader animates entirely off its own `uTime`, deliberately, because `tests/hero-interaction.test.mjs` pins the hero's running animation-name set to exactly `hero-orbit-settle`, `hero-payoff-flow`, `hero-trace-x`, `hero-trace-y` — adding a CSS animation in the hero breaks that contract.

Every cinematic path has to degrade: `HeroLazyBoundary` (chunk load failure) and `HeroErrorBoundary` + `gl.debug.onShaderError` (GPU/shader failure) both fall back to the static poster hero. Don't remove a fallback to simplify a change.

Shader uniforms must be mutated on the live material (`particles.current.uniforms.uProgress.value = …`) inside `useFrame`, not by rebuilding uniform objects.

### Tests

`tests/site.test.mjs` is a source-text contract, not a DOM test suite — it regex-matches `App.tsx`, `content.ts`, `styles.css`, `index.html`, and `HeroExperience.tsx`. So it enforces things like: the `noindex, nofollow, noarchive` meta tag, specific headline copy, ARIA attributes (`role="tablist"`, `aria-modal`, `#main-content`), the Mona Sans / Source Serif font stack, alternating `owner: "Bradd" | "Stone"` in the first six case studies, and an embargo list of private client names that must never appear in shipped copy. Editing copy or markup will often mean editing the corresponding assertion — read the failing assertion before changing it, since several encode a real past bug.

`tests/a11y.test.mjs` is the runtime counterpart: it boots Vite in-process, drives Playwright, and runs axe (WCAG 2.0/2.1 A+AA) at rest, through every hero scroll phase, and with the detail dialog open. It caught the original `--faint` token failing contrast at 9px.

Both `tests/` and `scripts/` share `scripts/lib/capture.mjs` (viewports, hero scrolling, phase detection) and `scripts/lib/site-server.mjs` (in-process Vite).

`debug/repro-hero-text-scroll-restoration.mjs` drives real Chrome over CDP against the deployed URL; it's a manual repro tool, not part of `npm test`. Playwright now covers most of what it did.

Source-text regexes in `tests/site.test.mjs` must tolerate CRLF (`\r?\n`, or `[\s\S]`) — CI checks out LF, Windows dev machines check out CRLF, and a bare `\n` passes in CI while failing locally.

## Conventions

- The page ships `noindex, nofollow, noarchive` on purpose until positioning is approved. Leave it.
- Accessibility is lint-enforced (`eslint-plugin-jsx-a11y`) and test-enforced; `--max-warnings=0` means an a11y warning fails the build.
- Long single-line ternaries and dense JSX are the existing style — match it rather than reformatting.
