# Bradd McBrearty — design judgment portfolio

[Open the portfolio](https://mcbradd.github.io/creative-leadership/portfolio/) · [Source repository](https://github.com/mcbradd/creative-leadership/tree/main/portfolio-source)

**Release status:** published on GitHub Pages and verified in external Chrome at desktop and phone sizes. The release passed all 47 repository tests, live route/asset checks, and the selected accessibility checks. See [RELEASE.md](docs/RELEASE.md) for the deployed commit, workflow, screenshots, measurements, and limitations.

An editorial portfolio about making, judging, and refining visual work. Built for the AI Tutor – Design opportunity, with five evidence-led project studies, an eight-piece production gallery, a genuine historical-portrait revision, six explorable prompt records, and an essay on design judgment.

The site uses Astro and small native JavaScript enhancements. Content is rendered as static HTML; no API keys, accounts, analytics, paid services, or runtime backend are required. Navigation, project reading, and source links work without JavaScript. Motion respects the visitor's reduced-motion preference.

## Documents

- [Product and design specification](docs/SPEC.md)
- [Implementation and release plan](docs/IMPLEMENTATION_PLAN.md)
- [Evidence and claims audit](docs/EVIDENCE.md)
- [Design critique and revisions](docs/DESIGN_REVIEW.md)
- [Asset notes and generation prompt](docs/ASSETS.md)
- [Machine-readable asset provenance](docs/ASSET_MANIFEST.json)
- [Release and verification record](docs/RELEASE.md)

## Local development

Use Node 22.22 or newer and npm 9.6.5 or newer. From this directory:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4321/creative-leadership/portfolio/`. Before release:

```sh
npm run check
npm run build
```

The build synchronizes prepared assets, renders the pages, then validates all 11 content routes, the 404 page, sitemap, headings, metadata, and local links/assets. `npm run preview` serves the production output at the configured base path.

## Publication

This directory lives at `portfolio-source/` inside `mcbradd/creative-leadership`. The parent's `prebuild` invokes `scripts/build-portfolio.mjs`: install this lockfile, run the type check and production build, then stage the result into the generated `public/portfolio/` directory. The existing Vite build carries that subtree into `dist/portfolio/`.

Run `npm run gates` from the repository root. Push validated changes to `main`; the existing GitHub Actions Pages workflow runs the full gates and deploys the combined artifact. Verify the live `portfolio/release.json` commit, then check desktop and phone interactions in an external browser. A push alone is not a verified release.

The original leadership site and classroom remain separate entry points. GitHub Pages serves its existing parent-level 404 policy for unknown URLs; the portfolio's own `404.html` is available directly. Its nested `robots.txt` documents the sitemap but does not override origin-wide crawler policy.

## Editing

- Project copy, roles, evidence links, and production credits: `src/data/projects.ts`.
- Recorded portrait prompts and source links: `src/data/portraits.json`.
- Visual system and responsive rules: `src/styles/global.css`.
- Shared metadata, navigation, and footer: `src/layouts/Base.astro`.
- Prepared, licensed or credited images and fonts: `assets/`.

Retain the distinction between generated art, shipped collaborative work, public code evidence, and candidate-reported experience. Do not turn research metrics into unverified claims about human play, conversion, or hiring outcomes. Prepared web assets are included so ordinary builds require no regeneration. Raw source captures, original downloaded masters, and one-off preparation tooling are not required for deployment.
