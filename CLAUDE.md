# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page interactive executive one-pager ("Bradd + Stone — Creative Leadership"). Vite + React 19 + TypeScript, no router, no backend. Deployed to GitHub Pages from `main` via `.github/workflows/deploy-pages.yml`.

The empty top-level dirs (`app/`, `db/`, `drizzle/`, `worker/`, `examples/`, `.openai/`, `.vinext/`) are leftovers from a prior Next.js scaffold. Everything live is in `src/`, `index.html`, `public/`, `tests/`.

## Commands

```bash
npm run dev            # vite dev server
npm run build          # tsc --noEmit && vite build
npm test               # node --test tests/site.test.mjs
npm run lint           # eslint src --max-warnings=0
node --test --test-name-pattern="responsive" tests/site.test.mjs   # single test
```

`npm run build` is the only typecheck — Vite doesn't typecheck on `dev`.

## Architecture

- `src/App.tsx` — the whole page. Section components + `HeroSection` + `DetailDialog` (native `<dialog>` modal driven by a `Detail` union of `CaseStudy | Insight`). Media paths go through `media()`, which honors `import.meta.env.BASE_URL` — never hardcode `/media/...` or production breaks under the `/creative-leadership/` base.
- `src/content.ts` — all copy and data (case studies, insights, partners, timeline). Text edits belong here, not in JSX, unless the string is structural.
- `src/experience.ts` — `detectExperienceTier()` returns `static | motion | webgl | webgpu` from reduced-motion, `saveData`, `deviceMemory`/`hardwareConcurrency`, and a WebGL2 probe. Override in dev with `?fx=static|motion|webgl|webgpu`.
- `src/hero/HeroExperience.tsx` — react-three-fiber cinematic, lazy-loaded and only mounted for the `webgl`/`webgpu` tiers. Inline GLSL shaders (particles / backdrop / remnant) driven by a single `progress` scalar; `frameloop="demand"`.
- `src/styles.css` — hand-written CSS, no framework. Tokens in `:root`, hero state driven off `data-phase` / `data-enhanced` / `data-static` attributes and the `--hero-progress` custom property.

### Hero progression (the fragile part)

Scroll progress is computed in `HeroSection` from `heroRef.getBoundingClientRect()` — the element's own position, never `window.scrollY`. This is deliberate: deriving copy visibility from a restored scroll offset made hero text invisible on back-navigation, and `tests/site.test.mjs` asserts the broken patterns stay absent. `progress` flows to both CSS (`--hero-progress`) and the shader uniforms; keep them fed from the same value.

Every cinematic path has to degrade: `HeroLazyBoundary` (chunk load failure) and `HeroErrorBoundary` + `gl.debug.onShaderError` (GPU/shader failure) both fall back to the static poster hero. Don't remove a fallback to simplify a change.

Shader uniforms must be mutated on the live material (`particles.current.uniforms.uProgress.value = …`) inside `useFrame`, not by rebuilding uniform objects.

### Tests

`tests/site.test.mjs` is a source-text contract, not a DOM test suite — it regex-matches `App.tsx`, `content.ts`, `styles.css`, `index.html`, and `HeroExperience.tsx`. So it enforces things like: the `noindex, nofollow, noarchive` meta tag, specific headline copy, ARIA attributes (`role="tablist"`, `aria-modal`, `#main-content`), the Mona Sans / Source Serif font stack, alternating `owner: "Bradd" | "Stone"` in the first six case studies, and an embargo list of private client names that must never appear in shipped copy. Editing copy or markup will often mean editing the corresponding assertion — read the failing assertion before changing it, since several encode a real past bug.

`debug/repro-hero-text-scroll-restoration.mjs` drives real Chrome over CDP against the deployed URL; it's a manual repro tool, not part of `npm test`.

## Conventions

- The page ships `noindex, nofollow, noarchive` on purpose until positioning is approved. Leave it.
- Accessibility is lint-enforced (`eslint-plugin-jsx-a11y`) and test-enforced; `--max-warnings=0` means an a11y warning fails the build.
- Long single-line ternaries and dense JSX are the existing style — match it rather than reformatting.
