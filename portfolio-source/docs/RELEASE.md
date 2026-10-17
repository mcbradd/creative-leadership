# Release record

Recorded October 17, 2026, approximately 00:30 Pacific time (America/Los_Angeles).

**Status: implemented, revised, and verified locally; NOT PUBLISHED.** GitHub write access is blocked. Public deployment and external-browser verification of that deployment remain incomplete. A local preview is supporting evidence only.

Target: https://mcbradd.github.io/creative-leadership/portfolio/

Source: https://github.com/mcbradd/creative-leadership/tree/main/portfolio-source

The portfolio is an additive subtree. The existing leadership and classroom release gates remain required. The pre-portfolio parent revision is `6313e7412ed4247c43f32aae46daf763e7d31810`.

## Release gates

- The combined `npm run gates` finished successfully: lint, portfolio type/build validation, parent TypeScript/Vite build, 28 core/interaction tests, 11 layout/presentation tests, 5 accessibility tests, and 3 classroom tests. Total: 47 tests passed.
- The final responsive-image adjustment was followed by another complete combined production build and portfolio type check: zero errors, warnings, or hints in the Astro check. All 11 content routes, the explicit 404, sitemap, headings, metadata, and referenced local assets passed validation.
- Two pre-existing tests intermittently inspected an intermediate state. The detail test now waits for the opener to regain focus after the existing `requestAnimationFrame`; the cue test waits for its destination to settle within the same two-pixel tolerance before asserting. These are bounded five-second condition waits, not arbitrary delays or removed assertions. The cue failure reproduced in a focused run; focused checks and the full suite passed after the change. All temporary diagnostics were removed. Parent application code was unchanged.

## Browser and design review

- Rendered desktop, tablet, and phone design critique produced the revisions in DESIGN_REVIEW.md.
- All 11 content routes were inspected at 320 px for horizontal document overflow and broken loaded images: none found. Composition was reviewed at 390, 768, 1440, and 1920 px as well.
- Axe checks using WCAG 2 A/AA, 2.1 AA and 2.2 AA tags collectively covered all 12 page outputs. The homepage opacity-transition contrast finding was corrected. All rechecks reported zero violations. The production homepage was rechecked after its final image change in external Chrome and still reported zero violations. This does not constitute complete WCAG certification.
- No-script mobile reading exposes navigation and all six portraits. Reduced-motion inspection reports no reveal initialization, `scroll-behavior: auto`, and zero portrait transition duration.
- External Chrome, against the local production artifact: mobile navigation, gallery filter, image dialog, Escape and focus return, both revision modes, portrait selection, and email copy were exercised successfully. The copy action displayed “Email address copied.” No messages were sent. The browser console reported no warnings/errors during the production template pass.
- Production source selection at 320 px chose the three 420 px portrait thumbnails, with all three images loaded and no horizontal overflow. Temporary browser viewport and script/media emulation overrides were reset.
- Captures are preserved in the local working package at `preview/portfolio-desktop.jpg`, `preview/portfolio-mobile.jpg`, and `preview/home-desktop-full.jpg`. The latter predates the final responsive-image metadata change but depicts the same composition. These files show the localhost preview, not a public deployment.

## Delivery size and performance limits

The prepared static portfolio contains approximately 5.2 MB across 82 files, including unused prepared image variants. Its homepage has approximately 8.2 KB of gzipped HTML, 7.4 KB of gzipped shared CSS, and 1.8 KB of inline script text (including structured metadata). The six WOFF2 font files total 173,108 bytes; source TTFs totaled roughly 507 KB. Images below the initial composition use native lazy loading.

One unthrottled, warm-cache localhost Chrome sample before the responsive-image adjustment reported 216 ms first contentful paint, a 216 ms largest-contentful-paint candidate, and approximately 795 ms load-event completion. These are local diagnostics, not mobile-network benchmarks, a Lighthouse score, final field Core Web Vitals, or a guarantee of GitHub Pages performance. Throttled production measurements remain part of the blocked public release verification.

The existing parent dependency tree reports three high-severity development-tool advisories (brace-expansion, js-yaml, source-map-js). They predate this addition; the parent application dependencies were not changed. The portfolio dependency audit reports zero vulnerabilities. The existing parent classroom bundle-size warning also remains. No unrelated dependency upgrade was used to broaden this portfolio task.

## Publication blocker

The connected GitHub app rejected blob creation with HTTP 403, `Resource not accessible by integration`. The stored GitHub CLI credential is invalid; noninteractive SSH authentication failed; browser sign-in requires a passkey interaction. No branch update or Pages deployment occurred. The remote main revision was rechecked and remained `6313e7412ed4247c43f32aae46daf763e7d31810`.

The local checkout contains the complete additive source, release integration, and bounded test-wait corrections. DEPLOYMENT_HANDOFF.md describes how to resume after ordinary write authentication is restored. The existing Pages workflow remains intact and will build the portfolio through the parent `prebuild` hook.

The task is incomplete until the reviewed commit is pushed, the Pages deployment succeeds, and the published URL is verified in an external browser.
