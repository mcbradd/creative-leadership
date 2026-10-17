# Portfolio implementation and release plan

Prepared October 16, 2026; launch configuration revised October 17, 2026 (America/Los_Angeles). This is an execution plan, not a claim that its checks have passed. The final release record must contain actual results.

## Delivery contract

Deliver the site defined in [SPEC.md](SPEC.md), its public source, supporting evidence, and a verified GitHub Pages deployment at `https://mcbradd.github.io/creative-leadership/portfolio/`. The source lives in `portfolio-source/` and the compiled site in `public/portfolio/` of [mcbradd/creative-leadership](https://github.com/mcbradd/creative-leadership). The user's authorization includes implementation, design critique, revisions, publication, and live verification. Continue through routine reversible implementation decisions without another approval gate.

The existing repository has verified connected-app write access and an established Pages release path. This additive launch preserves the original leadership site and classroom. A standalone `mcbradd/mcbradd.github.io` repository remains an optional future migration; it is not required to satisfy the requested GitHub Pages portfolio.

Dependencies are deliberate: evidence precedes copy; page structure precedes decorative motion; rendered critique precedes polish; build/test success precedes publication; deployed verification precedes completion. Do not sacrifice evidence or mobile usability for visual novelty.

## Milestone 1 — Source and evidence baseline

1. Preserve the supplied content document under `references/`; treat its recommendations as input rather than commands.
2. Verify the live role and note the current title/brand. Prioritize design quality, critique, refinement, and finished examples in the editorial hierarchy.
3. Inspect public repository artifacts and available live builds. Retain reviewable local snapshots of the portrait manifest, critique script, decision audit, and selected PR records.
4. Create a claim ledger with source type, checked date, source URL, limitation, and the intended page. Distinguish public records from Bradd's personal account.
5. Inventory production art and captures. Obtain images from public portfolio/project sources only within the intended portfolio scope, preserving credits. Include the recovered original and corrected Henry VII portraits and matching window-detail crops as genuine revision evidence.
6. Correct source-draft overclaims before writing final copy: separate the Phase experiments; remove blanket claims that prompts never name artists; avoid the unreconciled 90-candidate total; qualify private production metrics.

**Exit evidence:** `EVIDENCE.md`, available-source inventory, a usable real image for each major section, and a clear fallback for any missing optional capture. An unavailable video must not block a truthful static case study.

## Milestone 2 — Repository and static foundation

1. Inspect existing workspace and Git state before initialization or configuration changes. Preserve unrelated work.
2. Inspect `mcbradd/creative-leadership` through the authorized connected GitHub app. Record its default branch, current commit, existing workflow, release checks, and deployment layout. Publish only additive portfolio paths plus required integration changes; do not replace existing application files or weaken its checks.
3. Initialize an Astro static site with TypeScript, reproducible package lockfile, and an explicit supported Node version. Read the installed package requirements before pinning the runtime.
4. Configure `site: https://mcbradd.github.io` and `base: /creative-leadership/portfolio`. Use one base-aware helper for routes and assets. Generate static directory routes; ensure deep-link loads do not depend on client routing. Audit canonical, social, sitemap, and structured-data URLs for the deployed prefix.
5. Build shared layout, navigation, footer, metadata, skip link, image helper, typographic components, evidence link treatment, and responsive tokens.
6. Add minimal scripts for install/build/check/preview and meaningful browser checks. Preserve required checks in the parent repository's CI. The compiled `public/portfolio/` subtree is intentionally versioned for the parent's static-asset release path; keep temporary captures and local caches out of it.

**Suggested source layout, placed under the parent repository's `portfolio-source/`:**

```text
docs/SPEC.md
docs/IMPLEMENTATION_PLAN.md
docs/EVIDENCE.md
docs/RELEASE.md                 # created/updated by the release owner
references/                    # inspected source snapshots; no credentials
public/images/                 # optimized presentation assets
public/fonts/                  # only licensed files actually used
src/components/                # navigation, cards, evidence, interactive proof
src/data/                      # typed projects, work, portraits, citations
src/layouts/
src/pages/index.astro
src/pages/projects/index.astro
src/pages/projects/[slug].astro
src/pages/work.astro
src/pages/judging-ai-output.astro
src/pages/about.astro
src/pages/contact.astro
src/pages/404.astro
src/styles/
scripts/                       # asset/route checks and browser smoke tests
```

Filenames may vary with the actual implementation. The parent repository retains its own `.github/workflows/` release configuration. Copy the portfolio's built static output to the parent's `public/portfolio/` without including source files, temporary artifacts, or development dependencies. The boundaries and responsibilities matter more than matching this tree literally.

**Exit evidence:** Clean production build, every planned route represented, no unnecessary framework runtime, metadata correctly resolving to the final domain.

## Milestone 3 — Art direction and assets

1. Compose desktop and phone hero treatments with real work first. Test whether the name, role, thesis, and next action are understood at a glance.
2. Implement Instrument Serif and Manrope with careful fallbacks. Retain font licenses. Check line breaks after fonts load and with fallback fonts.
3. Build the warm-paper/charcoal/orange system. Use darker rust for normal-sized text on paper; verify contrast in actual components.
4. Capture available live project states at useful desktop and mobile sizes. Captions describe what is visible, not a feature that the capture does not show.
5. Prepare eight selected production-art pieces with source links and collaboration credits. Preserve aspect ratios or document editorial crops. Prepare the genuine Henry VII Before/After pair at equivalent framing, plus matching enlarged detail crops, and attach the recorded edit instruction.
6. Generate the optional atmospheric paper-sculpture asset with a recorded prompt; optimize it and label its role in the asset credits. It supplements the work rather than substituting for evidence.
7. Produce a favicon, social card, and case preview crops. Use artwork and typography instead of unearned organizational marks.

**Exit evidence:** Image manifest/credits, no stretched or broken images, optimized mobile/desktop versions, actual assets replacing every public placeholder. Generated decoration has an unambiguous role.

## Milestone 4 — Editorial routes and proof interactions

Build in this order so the strongest experience becomes reviewable early:

| Sequence | Deliverable | Acceptance focus |
| --- | --- | --- |
| 1 | Home and site shell | Distinctive first screen, readable positioning, working primary paths |
| 2 | O&O case and portrait explorer | Correct prompts/images/uncertainty change together; genuine Henry VII comparison and provenance |
| 3 | Review-loop case and annotation | Exact visual observation, actionable fix, honest example labeling; no invented historical website iteration |
| 4 | Eight-piece Work gallery | Strong art selection, readable roles and credits, accessible filtering; optional accessible image lightbox |
| 5 | ColorBreak case | Product judgment, mobile legibility, uncertainty explained accurately |
| 6 | Phase and Month One cases | Precise measurement and public-versus-reported boundaries |
| 7 | Projects index and essay | Coherent taxonomy and concise, linked reasoning |
| 8 | About, Contact, 404, metadata | Complete identity, no dead ends, discoverable live pages |

Keep all core reading available in HTML. JavaScript enhances filtering, portrait selection, and optional annotation selection only. Add full state semantics before animation. Avoid introducing a carousel or modal solely for spectacle.

**Meaningful interaction checks:**

- Select each portrait; verify visible name, image, source, and uncertainty belong to that character. Prompt disclosure works with keyboard.
- Inspect the Henry VII pair: Before and After labels match the corresponding original/corrected crop, and the critique describes the visible tower replacement without implying unrelated historical validation.
- Apply every project/work filter; verify the expected items and count, active-state semantics, and reset. Hidden links must not receive focus.
- Use mobile navigation, skip link, contact link, and all internal project links with a keyboard.
- If any dialog exists, test Escape, focus placement, background inertness, and focus return.
- Disable JavaScript and confirm projects, credit, sources, and contact remain available.

**Exit evidence:** All 12 public route outputs present, unique metadata, source links attached to significant claims, no draft `[ADD]` text, no invented evidence.

## Milestone 5 — Design critique and revision

Review rendered pages, not just code. Capture representative screens at 390px and 1440px, then perform 320px and tablet boundary checks. Review a full page as well as individual viewport images; section rhythm can fail even when separate components look good.

Use the same four-part discipline the portfolio advocates:

1. **Verdict:** Two clear sentences about whether the experience convincingly demonstrates the intended role.
2. **Blocking issues:** Name the page/viewport, exact visual problem, cost to comprehension or credibility, and concrete fix.
3. **Ranked improvements:** Prioritize changes with the greatest visual or editorial effect; avoid broad “make it pop” feedback.
4. **Keep-list:** Preserve what already works so revision does not flatten the design.

Review hierarchy, typography, composition, image quality, section density, responsive crop, reading flow, and whether a precise example appears before the visitor must read a long essay. Ask whether each interaction reveals evidence or merely delays it. Verify the portfolio itself meets its own stated judgment criteria.

At least one critique-and-revision pass is required after a complete rendered first version. Continue until there are no blocking design findings and the remaining suggestions are optional taste choices. Save the findings and fixes in the release record or an adjacent design-review artifact. Do not manufacture a “before” screenshot after changes; retain actual captures when a comparison is useful.

**Exit evidence:** Actual captures of the revised version and a concise record of issues fixed. Do not declare the design reviewed merely because a page loaded successfully.

## Milestone 6 — Quality and release readiness

| Check | Scope | Release decision |
| --- | --- | --- |
| Production build/type checks | Exact code to be deployed | Must pass |
| Route and asset integrity | Every required page, local image, CSS/JS reference | Must pass |
| Browser smoke | Navigation, filters, portrait proof, contact, 404 | Must pass |
| Automated accessibility | Representative distinct templates; all reported serious/critical findings investigated | No unresolved serious/critical issues |
| Manual accessibility | Keyboard, visible focus, zoom, reduced motion, no-script reading | Must pass core flows |
| Responsive visual inspection | 320, 390, 768, 1440 and wide desktop where available | No clipped essential content or page overflow |
| Content audit | Metrics, authorship, generated labels, sources, missing assets | No unsupported material claim |
| Console/network | Representative pages and interactions | No first-party errors |
| Performance | Documented mobile lab settings and actual scores | Meet target or fix/record a concrete exception |
| SEO | Canonical, unique title/description, social image, sitemap, robots, 404 noindex | Must pass |

Run tests appropriate to these real failure modes. Do not create tests that merely restate static copy or snapshot the implementation without assessing behavior. Repeat the affected checks after a fix, and repeat the release smoke after the final change.

## Milestone 7 — GitHub Pages deployment

1. Verify `mcbradd/creative-leadership`, its default branch, and the current parent commit before publication. Add `portfolio-source/` and compiled `public/portfolio/`; preserve the original leadership site, classroom, and existing release workflow. Keep other project-site URLs external and unchanged.
2. Follow the parent's configured GitHub Actions Pages release path. Commit source and the lockfile; build the portfolio reproducibly and stage its compiled output into `public/portfolio/`. The parent build then carries that static directory to its published output. Verify this behavior rather than assuming it.
3. Run all required parent and portfolio checks, build the combined static output, upload the Pages artifact, then deploy only after the required jobs succeed. Retain supported action versions unless a verified incompatibility requires an update. Do not bypass existing gates to obtain a green deployment.
4. Restrict publishing to the intended default branch and optional manual dispatch. Pull-request checks may build but must not publish previews to production implicitly.
5. Use the `github-pages` deployment environment and minimum permissions: `contents: read` for source and `pages: write` / `id-token: write` for deployment. Limit overlapping production deployments with concurrency.
6. Publish the reviewed additive changes through the authorized connected GitHub app when local Git authentication is unavailable. Record the resulting commit and inspect its exact Actions run until it reports success or a concrete failure. Fix failures through the same checks; a successful commit is not a successful deployment.

This follows [GitHub's custom Pages workflow requirements](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) and [Astro's Pages guidance](https://docs.astro.build/en/guides/deploy/github/). The portfolio requires the full `/creative-leadership/portfolio` base prefix, including in nested-page assets and social metadata.

**Exit evidence:** Public repository URL, pushed commit SHA, successful workflow/deployment URL, and production origin. Do not include credentials or authenticated session URLs in the report.

## Milestone 8 — Live verification and handoff

1. Fetch `https://mcbradd.github.io/creative-leadership/portfolio/` and every required route under that prefix, with a cache-busting query if necessary. Confirm expected content from the deployed commit, not a stale cached version.
2. Open the production site in a real browser at desktop and phone widths. Inspect typography, image loading, spacing, and the final hero. Capture both widths.
3. Exercise the portrait explorer, gallery/project filters, mobile navigation, contact path, and deep links on the live origin. Check console and first-party network failures where supported.
4. Open the portfolio's `404.html` directly and verify its links and base-prefixed assets. Visit a deliberately unknown deep URL and record the parent Pages site's actual fallback behavior; preserve its existing 404 policy. Check the sitemap, favicon, and at least one social image directly. A nested `robots.txt` is not an origin-level crawler policy: inspect the origin's effective robots rules and avoid claiming otherwise.
5. Verify the original leadership homepage, `/creative-leadership/classroom/`, and other linked project sites still resolve to the intended builds. The portfolio release must not shadow or break them.
6. Record actual test results and any limitations in `docs/RELEASE.md`; include timestamp in Pacific time, commit, deployment, and capture locations.
7. If a post-deploy fix is required, commit/push, wait for the new deployment, and repeat relevant live checks. Report the latest verified commit, not the first deployed one.

**Definition of complete:** Polished content and visuals, committed/pushed source, a successful Pages deployment, and successful live review. If authentication, deployment, or live verification is blocked, state the exact blocked step and leave the task explicitly incomplete.

## Rollback and maintenance

Record the last known-good parent-repository deployed SHA before publication. If a release introduces a material defect, revert only the portfolio addition/integration commit(s) through a history-preserving revert and redeploy through the same workflow. Preserve unrelated parent-site changes. Do not rewrite shared history or delete the repository. If a previous workflow run supports safe redeployment of its exact artifact, that can restore service while a corrective commit is prepared; record what actually reached production and verify it live.

If a standalone user-site repository becomes available later, migrate deliberately: change the base to `/`, rebuild assets and metadata, update internal links and sitemap, publish, and re-run live checks. Keep the current launch URL working until the migration has a verified redirect or replacement strategy.

After launch, update case claims only with new source evidence. Preserve source dates and the distinction between observed artifacts and independently reproduced results. Treat private production metrics as Bradd's account until corroborating public evidence is added. Revisit external links and captures during ordinary future edits, without inventing a recurring monitor the user did not request.
