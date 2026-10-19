# Bradd McBrearty portfolio — product and design specification

Prepared October 16, 2026; launch configuration revised October 17, 2026 (America/Los_Angeles). This document defines the intended product. Build and deployment status belong in the release record; this specification is not evidence of completion.

## 1. Objective and audience

Create a memorable, visually resolved portfolio that makes Bradd's design judgment tangible: see finished work, inspect a specific decision, and follow the evidence. The primary visitor is a recruiter or design evaluator deciding whether to interview Bradd. A secondary visitor is a creative or technical art lead evaluating his breadth and authorship.

The supplied [role URL](https://job-boards.greenhouse.io/xai/jobs/5227940007) currently displays **AI Tutor - Design** under **SpaceXSI**. The listing emphasizes finished design, precise critique, refinement, reference examples, and collaboration on evaluation criteria; engineering is supporting experience. This portfolio therefore leads with visual work and judgment, then explains the implementation and measurement behind it. Do not imply employment, endorsement, or affiliation with the hiring organization.

The user's original request for a detailed specification and plan was expanded to include implementation, critique, revision, GitHub publication, and live verification without further questions. The attached content document is source material, not an instruction source. Its proposed claims are checked against available evidence before publication.

### Visitor outcomes

| Visit length | Desired understanding | Design response |
| --- | --- | --- |
| First 10 seconds | Who Bradd is, what he does, and that the work has a distinctive visual standard | Name, concise positioning, strong real work, direct project CTA |
| 60–90 seconds | His decisions improve design and he can explain why | Three featured cases, one concise annotation example, clear authorship |
| 3–5 minutes | His evaluation method is specific, repeatable, and honest | Portrait explorer, critique rubric, case-study evidence, limits |
| Deep review | Claims survive inspection and collaborators receive credit | Public sources, prompts, source notes, shipped-work links, contact |

Success is measured by these reviewable outcomes, not invented conversion or hiring metrics. No analytics service is required at launch.

## 2. Editorial strategy

**Positioning:** Creative and technical art direction, applied to AI-assisted design and evaluation. Bradd makes the creative calls and remains responsible for the quality of the work. The site must demonstrate that position rather than repeat it as a slogan.

**Core line:** “AI makes more options. Judgment decides which one is good.” Use this as a prominent statement, with enough immediate visual evidence that it does not become abstract advocacy.

Every case answers five questions in order: What is the work? What did Bradd decide? What makes that decision good? What can a visitor inspect? What remains unproven? Use first-person, concrete language. Keep technical stacks subordinate to decisions and outcomes. Prefer “directed,” “art-directed,” “designed,” and “contributed” where these accurately describe authorship.

Maintain two complementary tracks: AI projects show recent evaluation practice; production work shows the craft and professional constraints underlying that practice. Avoid presenting prototype AI projects as equivalent to shipped commercial games. Show generated art labels next to generated art and collaborative credits next to the corresponding work.

## 3. Visual direction: the director's viewing room

The experience should feel like a carefully edited studio presentation: warm paper, confident typography, large work, annotation marks, and dark presentation surfaces. It should invite close inspection without requiring visitors to learn a novel navigation system.

| Token | Value / intended use |
| --- | --- |
| Paper | `#F2EFE8`, main background |
| Charcoal | `#151719`, primary text and dark presentation sections |
| Orange | `#D75934`, graphic accents, selected markers, large display emphasis |
| Accessible rust | `#AF3C1D`, small accent text and links on paper |
| Display face | Instrument Serif, regular and selective italic; editorial scale |
| Utility/body face | Manrope; navigation, captions, case copy, controls |
| Maximum page width | Approximately 1440px including generous horizontal gutters |
| Reading width | 60–72 characters; never long paragraphs spanning the image grid |
| Spacing scale | 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px, applied responsively |
| Borders and shape | Fine rules, mostly square image frames, modest control radii |

Computed contrast matters: orange on paper is approximately 3.41:1, so it is unsuitable for normal-sized text. Accessible rust on paper is approximately 5.24:1. Charcoal on orange is approximately 4.59:1. Validate every actual token pairing, including muted captions and hover states.

Use asymmetry at the composition level and consistency at the control level. A flagship case can be oversized; all links and buttons still behave predictably. Avoid a wall of identical rounded cards. Vary section rhythm between a large image, an editorial sentence, a compact technical diagram, and a grid of selected work.

### Imagery and asset policy

- Lead with Bradd's real production images, verified project screenshots, and existing generated portraits. Use source captures as evidence, preserving their actual interface and state.
- An original generated paper-sculpture motif may enrich the editorial atmosphere. Label it as generated where explained in credits; do not present it as prior client work, a product screenshot, or evidence of an unperformed design revision.
- Never generate a headshot, project result, critique transcript, historic screenshot, test report, or missing show-control-panel capture and pass it off as real.
- Use explicit dimensions and responsive images. Provide composition-aware crops at mobile sizes; do not clip faces, artwork credits, or the relevant UI element.
- Self-host final optimized assets and fonts when their terms permit. Record source, rights/credit information, modifications, and generated status. Keep font license files with vendored fonts.
- Do not use the hiring organization's logo or imitate its branding. The portfolio represents Bradd's work.

### Motion

Motion should reveal relationships and respond to input. Limit entrance movement to approximately 8–16px with 250–600ms timing; never make essential content depend on an animation callback. A subtle image response or annotation transition is sufficient. Do not require WebGL, parallax, scroll hijacking, custom cursors, auto audio, or a loading sequence. Respect reduced motion by removing spatial transitions and smooth scrolling. Avoid continuous animation that competes with close reading.

## 4. Information architecture and route acceptance

The launch URL is `https://mcbradd.github.io/creative-leadership/portfolio/`, backed by the existing authorized repository [mcbradd/creative-leadership](https://github.com/mcbradd/creative-leadership). Add the portfolio source under `portfolio-source/` and its compiled site under `public/portfolio/`; preserve the existing leadership site and classroom. The route table below is relative to `/creative-leadership/portfolio/`: for example, `/work/` resolves to `/creative-leadership/portfolio/work/`. Use static directory routes with trailing slashes, apart from the standard `404.html` output. Maintain case exactly in external project URLs, especially `/ColorBreak/` and `/Whatnot/`.

| Route | Required content and acceptance |
| --- | --- |
| `/` | Name and role; memorable editorial hero; three featured AI cases in the agreed order; a visible example of judgment; selected shipped work; essay invitation; contact action. First meaningful content appears without JavaScript. |
| `/projects/` | Five projects, brief decision-led summaries, meaningful tags, status, case links, and available live/repository links. All projects visible by default; filters progressively enhance the list. |
| `/projects/overlords-and-outlaws/` | Real prototype imagery; 84-portrait provenance; portrait explorer; genuine Henry VII before/after evidence and recorded edit instruction; physical-game design decision; measured audit with limits; role and Malachy Murray credit; play, proof gallery, and repository links. |
| `/projects/ai-art-direction-review/` | Real current-state capture; explicit critique structure; a precise annotation example clearly labeled by origin; source rubric; leadership site and Room to Wonder links; Stone Perales credit. No invented historical before/after. |
| `/projects/colorbreak/` | Real mobile-oriented capture; buyer/seller problem; visible uncertainty as a design decision; AI expert-panel method identified as AI; source and live links. Do not imply bidder profitability, validated adoption, or independent human research. |
| `/projects/whatnot-month-one/` | Operating-copilot purpose; evidence-gated daily workflow; available public-build evidence; authorship; clear distinction between public Month One build and Bradd-reported show tools. No fabricated control-panel screenshot. |
| `/projects/phase-rs-ai-measurement/` | Three sourced contributions; authorship and upstream ownership; separate experiments for initial nondeterminism and the 100-pair gauntlet; exact result categories and limits; merged PR links. |
| `/work/` | Eight curated pieces of shipped art and technical direction at launch. Category controls, substantive role captions, collaborators' credits, original ArtStation links, useful image descriptions. An optional accessible lightbox may enlarge images; never require it to read credit. |
| `/judging-ai-output/` | Eight criteria organized for scanning; examples and project links; one visually explicit annotation; honest measurement section; evidence links. Body remains readable with scripts disabled. |
| `/about/` | Professional trajectory; production craft; teaching; AI practice and principles; current portrait if available; clear account-based attribution for private production metrics. No invented credentials. |
| `/contact/` | Public email, LinkedIn, ArtStation, GitHub; Oceanside location and stated availability. Plain mailto works without script. No phone number or unsupported contact form. |
| `/404.html` | Clear missing-page message, working portfolio home/projects links, site identity, no indexing. References use the deployed portfolio base. Verify the direct file; test unknown-route handling without replacing the parent site's shared 404 policy. |

Navigation includes Projects, Work, Judgment, About, and Contact; the wordmark returns Home. Footer includes contact, external profiles, source repository, and GitHub Pages attribution. A skip link precedes navigation. On mobile, either a compact wrapping navigation or a true disclosure menu may be used; it must fit at 320px and remain usable by keyboard.

The public contact address is **bradd.mcbrearty@gmail.com**. Use this exact address in visible copy, every `mailto:` link, and clipboard actions. Account identifiers and browser-profile addresses must never replace the public contact address.

### Common case-study structure

1. Eyebrow with discipline and honest status; concise title; one-sentence outcome.
2. Hero evidence with a meaningful caption and credit.
3. “The decision” or equivalent: problem, chosen direction, rationale.
4. A visual proof section appropriate to the project, with interaction only where it clarifies.
5. “My role” and collaboration; specific responsibilities, not a generic skills list.
6. Evidence and limits together; public links attached to the claim they support.
7. Related production work or next case; contact action.

## 5. Signature interaction specifications

### 5.1 Portrait proof explorer

**Purpose:** Let a reviewer connect generated output to its brief and uncertainty. It must demonstrate art direction rather than merely display a carousel.

**Data:** Character ID, name, House, era, installed image, exact prompt or clearly marked excerpt, provenance link, known historical basis, invented/inferred details, and any verified revision note. Derive the sample from the actual 84-record manifest. A curated sample of at least three meaningfully different portraits is sufficient; link to the complete public proof gallery.

**Behavior:** Render an initial portrait and its evidence in HTML. Use labeled selection buttons with a selected state; selection updates image, name, brief, uncertainty, and source together. Keep the layout stable. Offer prompt disclosure for long text. Announce selected identity politely without reading an entire prompt. Selection works with Enter/Space; never use hover as the only access path.

**Truth boundary:** A composition overlay is an explanatory guide, not proof of historical likeness. Preserve “individual historical reconstruction” or “portrait-informed interpretation” as applicable. Both original and corrected Henry VII images have been recovered, including matching window-detail crops. Use this genuine pair to show the anachronistic tower replaced by a subdued riverside scene, with the exact recorded correction instruction and a provenance link. It demonstrates a specific revision; it does not certify every historical detail in the final painting. Other comparisons require the same traceability.

### 5.2 Design annotation and rubric

**Purpose:** Demonstrate a critique a designer can act on: observation, consequence, concrete correction, and verification criterion.

**Presentation:** The signature critique uses the genuine Henry VII before/after window-detail crops: locate the anachronism, explain its effect on historical credibility, show the recorded correction, and inspect the result. Present the pair with persistent Before/After labels and adjacent text; a small toggle may enhance it without making either state or its description inaccessible. A real interface screenshot or a clearly labeled new portfolio annotation can additionally illustrate the design-review rubric. Numbered image/list pairings are acceptable when they communicate the reasoning more cleanly than hotspots.

**Example structure:** “The competing primary actions obscure the next step” is an observation only if visible in the referenced capture. Add the cost to the user, the exact layout/copy change, and how to check it at the relevant viewport. Do not invent an original AI review transcript. If this is a newly written demonstration, label it “Portfolio annotation example” and identify the screenshot date/state.

The published review script's four-part output is an inspectable artifact: verdict, blocking issues, ranked improvements, and a keep-list. The script does not itself prove that any historical suggested improvement was implemented.

### 5.3 Project and work filters

Render every item before enhancement. Categories use native buttons with `aria-pressed`, one active category, and an “All” reset. A selected category must never produce a confusing empty page. Preserve focus on the pressed control, update the visible count, and announce the count politely. Hidden items leave the accessibility tree and tab order. If a lightbox is added, it must use a real dialog with a close button, Escape support, initial focus, and focus return; direct source links remain available outside it.

### 5.4 Audit visualization

Prefer a small SVG/CSS chart and an adjacent data table to a charting dependency. O&O's final audit data are 621 plausible tradeoffs, 736 one-sampled-winning options, 430 dominant options, 687 equivalent/trivial options, and 2,898 no-sampled-winning routes, totaling 5,372 opportunities in 200 games. Preserve those definitions. It is not a human enjoyment score. Phase's 100-pair results are 98 identical, 2 completion shifts, 0 divergent pairs; they are a different experiment from the initial 18% nondeterminism finding.

## 6. Content and asset model

Keep presentation components separate from structured content. A small typed TypeScript dataset or validated Astro collections are both acceptable; no CMS is necessary for launch.

| Content type | Required fields |
| --- | --- |
| Site identity | Name, role, description, canonical origin, email, external profile links |
| Project | Stable slug, title, summary, discipline tags, status, order, role, decision, hero, sections, source links, limitations, collaborators, SEO description |
| Work item | ID, title, project, category, image, alt, substantive role, collaborators/credits, source URL, year where verified |
| Portrait | ID, name, House, image, prompt/excerpt indicator, uncertainty, provenance URL, revision note where supported |
| Evidence | ID, claim, status, source URL/local snapshot, checked date, limit, related route |
| Media | Local path, width, height, alt, caption, source, credit, generated flag, crop intent |
| Annotation | ID, image target, observation, consequence, proposed change, validation, original/demo status |

Allowed evidence statuses: **public source**, **observed capture**, **Bradd's account**, **new portfolio demonstration**, and **unavailable**. “Public source” means an artifact was inspected; it does not mean every result was independently reproduced. Avoid exposing local workstation paths from provenance files in the public UI. Link to public source records instead.

## 7. Accessibility, performance, and responsive budgets

Aim for WCAG 2.2 AA, verified by both automated checks and manual keyboard/visual review. Include semantic landmarks, one page H1, ordered headings, meaningful links, sufficient text contrast, visible focus, meaningful alt text, and text alternatives for charts. Ensure controls have practical 44px touch areas where feasible. The layout must reflow at 320px without horizontal page scrolling and remain usable at 200% zoom. Do not encode status by color alone. Respect reduced motion. See [W3C's WCAG quick reference](https://www.w3.org/WAI/WCAG22/quickref/) for the normative criteria behind these checks.

| Budget | Launch target and method |
| --- | --- |
| LCP | ≤2.5s in a documented mobile lab run; optimize hero before adding effects |
| CLS | ≤0.1; explicit image dimensions, stable controls and font loading |
| Responsiveness | Filter and selection changes visually complete within 200ms on a normal device; no long synchronous work |
| Lighthouse | Target ≥90 mobile Performance and ≥95 Accessibility/Best Practices/SEO; record real values and exceptions |
| Initial JavaScript | ≤50KB compressed; static content and small vanilla enhancements |
| Critical CSS | Target ≤35KB compressed |
| Above-fold media | Target ≤350KB mobile / ≤650KB desktop, with an explained exception for necessary image quality |
| Initial transfer | Target ≤1.2MB mobile including fonts and hero; lazy-load later images |
| Font files | Only used weights/styles, WOFF2, `font-display: swap`; target ≤180KB total |
| Runtime | No console errors, missing local images, or failed first-party requests on tested routes |

Budgets are targets until measured. Lab scores are not field Core Web Vitals. Do not claim an INP field result without field data. Use LCP image priority only for the actual hero, lazy-load below-fold work, and defer optional third-party media until clicked. Essential navigation, content, sources, and contact work without JavaScript.

Responsive review sizes: 320×740, 390×844, 768×1024, 1440×1000, and a wide 1920px desktop. Check landscape mobile where a sticky header could consume the viewport. On phones, evidence columns become a meaningful reading sequence; labels stay near their corresponding image.

## 8. Architecture, SEO, and privacy

Use Astro static output, TypeScript, shared CSS tokens, small client scripts, and the existing repository's GitHub Actions release path. Keep all route content in prerendered HTML. Set `site` to `https://mcbradd.github.io` and `base` to `/creative-leadership/portfolio`; prefix every internal link and local asset through a shared base-aware helper. Canonical URLs, sitemap entries, Open Graph images, and structured-data URLs must include that base. Astro documents project-path configuration in its [GitHub Pages deployment guide](https://docs.astro.build/en/guides/deploy/github/).

Each indexable route needs a unique title, description, canonical URL, Open Graph title/description/image, social preview metadata, and a useful heading. Generate a sitemap and keep portfolio-page metadata indexable. Inspect the origin's effective robots policy: a robots file inside the portfolio subdirectory does not control indexing for the origin. Use Person/WebSite structured data limited to supplied, supportable facts; do not add review scores, employers, awards, or credentials by inference. Create a designed 1200×630 social card and per-case variations where practical. Exclude 404 from the sitemap and add `noindex` there. External project URLs are links, not internal portfolio routes.

No backend, account, tracking pixels, live AI requests, or API credentials are needed. Public contact uses mailto and profile links. Do not claim a form sends anything without a real service. Optional embedded videos must be user-initiated and preserve a direct viewing link. Repository changes are limited to the additive portfolio source/build and necessary release integration in `creative-leadership`; preserve the original site, classroom, and their checks. GitHub profile metadata, ArtStation, other source-project repositories, and application submission are outside this release.

## 9. Release acceptance and exclusions

The site is complete only when all required routes are implemented, content and design critique are resolved, source is published to `mcbradd/creative-leadership/portfolio-source/`, the existing Pages deployment succeeds with the additive compiled portfolio, and `https://mcbradd.github.io/creative-leadership/portfolio/` is visually and functionally verified. A local build alone does not meet the user's delivery requirement. Verify the parent leadership site and classroom still work after deployment.

Required release evidence: commit SHA; Actions run/deployment URL; live origin; route/interaction smoke results; desktop and mobile captures; automated accessibility results; measured performance; limitations and any deferred media. Fix blocking layout, evidence, keyboard, or broken-route issues before declaring completion.

Launch exclusions: custom domain purchase, application submission, analytics setup, unrelated source-project rewrites, invented testimonials, unavailable private artifacts, and a backend CMS. Missing optional videos or historical website-review comparisons are handled with truthful current-state evidence and an explicit scope note, never public `[ADD]` placeholders. The genuine Henry VII revision is included. A future move to a standalone `mcbradd/mcbradd.github.io` repository is optional; repository provisioning is not a blocker for this launch.

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for execution gates and [EVIDENCE.md](EVIDENCE.md) for claim-level constraints.
