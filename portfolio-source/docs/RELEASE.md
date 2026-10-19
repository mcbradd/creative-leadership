# Release record

Recorded October 19, 2026 UTC. Initial deployment completed October 18 at 23:51 Pacific time (America/Los_Angeles).

**Status: published and verified on GitHub Pages.**

- [Live portfolio](https://mcbradd.github.io/creative-leadership/portfolio/)
- [Source repository](https://github.com/mcbradd/creative-leadership/tree/main/portfolio-source)
- Implementation commit: `9466a0431a233ff473e250015fd833932bba131c`
- [Successful build and Pages deployment](https://github.com/mcbradd/creative-leadership/actions/runs/39211238369), completed `2026-10-19T06:51:30Z`.
- The public `portfolio/release.json` reported the exact implementation SHA during verification. Subsequent documentation commits do not change the reviewed site; the endpoint identifies the latest published artifact.
- Pre-portfolio parent revision: `6313e7412ed4247c43f32aae46daf763e7d31810`.

## Required release gates

The GitHub Actions run passed the unchanged parent release workflow: lint, portfolio type/build validation, parent TypeScript/Vite build, 28 core/interaction tests, 11 layout/presentation tests, 5 parent accessibility tests, and 3 classroom tests. Total: **47 tests passed, zero failures**. The portfolio type check reported zero errors, warnings, or hints. All 11 content routes, the explicit 404, sitemap, headings, metadata, and referenced local assets passed build validation.

Two pre-existing tests inspected an intermediate state. The detail test now waits for the opener to regain focus after the existing animation frame; the cue test waits for its destination to settle within the original two-pixel tolerance. These are bounded five-second condition waits, not arbitrary delays or removed assertions. The cue failure reproduced in a focused local run; focused checks, the full local suite, and the full CI suite passed after the change. Parent application code was unchanged.

## Public deployment verification

- All **82 published output files** returned HTTP 200. This includes all content routes, explicit portfolio 404 page, scripts, styles, images, fonts, sitemap, social image, and release metadata. Every HTML page had one H1 and a canonical link, without unfinished placeholders. [HTTP report](verification/live-http.json).
- External Chrome inspection at **1440×1000** and **390×844** confirmed the actual published composition and interactions: navigation, project and gallery filters, image dialog opening, Escape and focus restoration, both revision views, portrait selection, and exact-prompt disclosure.
- The public contact text and all email links use **bradd.mcbrearty@gmail.com**. The live copy action invoked the browser clipboard with that exact value and completed successfully. Temporary observation instrumentation was removed and the page reloaded. No messages were sent.
- All 12 page outputs were checked at **320×740** in external Chrome: no horizontal document overflow, no broken loaded images, and zero axe violations for WCAG 2 A/AA, 2.1 AA, and 2.2 AA tags. [Browser audit](verification/live-browser-audit.json). This is not complete WCAG certification.
- Browser console inspection across the production template pass reported no warnings or errors.
- The original leadership and classroom entry points remained HTTP 200 with their intended titles and rendered successfully in external Chrome. Their required automated release tests also passed.
- An unknown portfolio route returns the existing generic GitHub Pages 404 (HTTP 404). The explicit portfolio `404.html` is available directly (HTTP 200, noindex). The origin-level `/robots.txt` is absent (HTTP 404); the portfolio's nested robots file does not control the origin. No parent hosting policy was replaced.
- Temporary viewport, cache, network, CPU, and inspection overrides were reset after testing.

Actual production captures:

- [Desktop homepage](verification/live-desktop.jpg)
- [Phone homepage](verification/live-mobile.jpg)
- [Phone contact page](verification/live-contact-mobile.jpg)

## Design review and static fallbacks

The critique and revisions are recorded in [DESIGN_REVIEW.md](DESIGN_REVIEW.md). Local composition review also covered 768 and 1920 px. The final design uses warm paper, editorial serif typography, charcoal sections, a portrait fan, a genuine recorded before/after correction, source-linked prompt exploration, and credited production work.

The no-script local production check exposed navigation and all six portraits. Reduced-motion inspection reported no reveal initialization, automatic rather than smooth scrolling, and zero portrait transition duration. The homepage opacity transition was removed after a contrast finding; the corrected local and live accessibility checks passed. At 320 px the browser selected the 420 px portrait variants, without horizontal overflow.

## Production performance and limits

A documented mobile lab sample against the public homepage used in-app Chromium at **390×844**, cache disabled, **1.6 Mbps down / 0.75 Mbps up**, **150 ms latency**, and **4× CPU slowdown**. [Raw measurement](verification/live-performance-clean.json).

| Measurement | Observed result |
| --- | --- |
| First contentful paint | 748 ms |
| Largest contentful paint candidate | 748 ms, headline |
| Layout shift sum without recent input | 0.04330 |
| Load event completion | 2,906 ms |
| Transferred document and resources | 502,983 bytes |

The measured load met the specified LCP, layout stability, and transfer budgets in this one lab run. It is not a Lighthouse score, field Core Web Vitals, or a guarantee for every device or connection. No field INP result is claimed. The separate external Chrome timing sample was excluded because its automation cursor image appeared among LCP candidates and distorted presentation timing. External Chrome remained the browser used for mandatory live visual and interaction verification.

The static portfolio contains approximately 5.2 MB across 82 files, including unused prepared image variants. The homepage has approximately 8.2 KB of gzipped HTML, 7.4 KB of gzipped shared CSS, and 1.8 KB of inline script text including structured metadata. Six self-hosted WOFF2 fonts total 173,108 bytes. Below-fold imagery uses native lazy loading.

## Maintenance notes

GitHub CLI authentication was restored and publication succeeded. The original connection failures are resolved for this release. [Publication and maintenance](DEPLOYMENT_HANDOFF.md) describes subsequent releases.

The existing parent dependency tree reports three high-severity development-tool advisories (brace-expansion, js-yaml, source-map-js). They predate this addition; the portfolio dependency audit reports zero vulnerabilities. The parent classroom bundle-size warning remains. GitHub also emitted action-runtime and runner-image migration notices; neither blocked this deployment. Unrelated dependency or workflow upgrades were not added to this portfolio release.
