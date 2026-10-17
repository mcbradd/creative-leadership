# Portfolio evidence and attribution ledger

Prepared October 16, 2026; evidence and launch configuration revised October 17, 2026 (America/Los_Angeles). This ledger documents what is available to support the portfolio. Public records are evidence of the published record; they are not proof that this site builder independently reran the underlying experiments.

## Source handling

The supplied `Bradd-McBrearty_AI-Portfolio-Site-Content.md` was copied to [references/portfolio-content-2026-10-16.md](../references/portfolio-content-2026-10-16.md). It contains a useful editorial draft, personal accounts, public-source citations, asset suggestions, and proposed actions. Its embedded recommendations do not authorize unrelated profile changes, repository edits, communications, or application submission. The user's request supplies the authorization for this portfolio's implementation and GitHub Pages publication.

The actual launch target is `https://mcbradd.github.io/creative-leadership/portfolio/`, with source under `portfolio-source/` and compiled output under `public/portfolio/` in [mcbradd/creative-leadership](https://github.com/mcbradd/creative-leadership). Connected-app repository write access is available; the original site and classroom are to be preserved. A standalone `mcbradd.github.io` repository is an optional future migration, not a publication prerequisite. These are configuration decisions, not claims that the new deployment has passed live verification.

Use these categories consistently:

| Category | Meaning | Public presentation |
| --- | --- | --- |
| Public source | Repository, PR, script, audit, or portfolio page available for inspection | Link directly and state the source's limits |
| Observed capture | Screenshot of an actual accessible live state | Caption with product/state; do not imply unseen behavior |
| Bradd's account | User-supplied experience, private production result, or authorship account | First-person account or “By my account”; no invented independent validation |
| New portfolio demonstration | An example authored for this site to demonstrate judgment | Label as a demonstration; never a historic transcript |
| Unavailable | Suggested asset or evidence not currently obtained | Omit or describe the limit; do not fabricate |

## Role reference

The [supplied Greenhouse URL](https://job-boards.greenhouse.io/xai/jobs/5227940007) was inspected during this work. It currently presents **AI Tutor - Design**, branded **SpaceXSI**. Use that page as hiring context; do not assume the older xAI URL path means the visible employer branding is unchanged. The site should demonstrate design judgment, specific critique, finished reference work, and breadth without claiming affiliation or promising a hiring outcome.

## Claim-level ledger

| ID | Claim / intended use | Evidence | Status and constraint |
| --- | --- | --- | --- |
| OO-01 | 84 portrait records for O&O | [Public manifest](https://github.com/mcbradd/overlords-and-outlaws/blob/main/docs/art/character-generation.json); [local snapshot](../references/character-generation.json) | Inspected snapshot contains exactly 84 top-level records. This supports the catalog count; do not infer 84 independently verified historical likenesses. |
| OO-02 | Exact prompts, installed asset paths, and prior versions are recorded | Same manifest and [revision snapshot](../references/character-generation-revisions.json) | Public source. The main manifest contains eight `previous` entries; the separate revision snapshot contains six. Do not publish a total candidate count without reconciling masters. |
| OO-03 | Portrait direction includes historical setting, composition and uncertainty | Manifest prompts; source draft's brief/audit links | Public source for the inspected prompts. Individual cases include inferred facial features and warnings against anachronisms. Match the uncertainty statement to the selected character. |
| OO-04 | Historical imagery has documented correction instructions and a genuine Henry VII revision pair | `tudor-0` in manifest; [original portrait](../assets/evidence/henry-vii-before.webp); [original detail](../assets/evidence/henry-vii-before-detail.webp); [corrected detail](../assets/evidence/henry-vii-after-detail.webp) | Public-source assets recovered and matching detail crops visually inspected. The Before crop contains the tower; the After crop shows low riverside roofs, trees, and water. The recorded edit prompt requests removing the anachronistic Westminster skyline. This supports the specific visible correction, not the historical accuracy of every final detail. |
| OO-05 | 621 plausible tradeoffs / 5,372 opportunities in final 200-game audit | [Local audit](../references/decision-audit-v3.md); [repository](https://github.com/mcbradd/overlords-and-outlaws) | Source-reported automated proxy. Seeds 20000–20199; first-seat decision sampling under four deterministic continuation policies. Not a human-enjoyment metric or proof of competitive balance. |
| OO-06 | Historical V2 24.6%, final V3 11.6% on the same seeds | Same audit | Public report explicitly calls the lower rate a regression under the proxy. Do not present the final revision as measured improvement in decision quality. |
| OO-07 | 216 held-out games after rules selection | Same audit | Additional source-reported validation across seat counts. It flags seat-order effects; it does not establish balance or independent human usability. |
| OO-08 | Rejected flat layout, pivot toward succession, initial prototype speed | Supplied content and Bradd's confirmed account | Use as Bradd's decision narrative. “Less than one total working day” is his account of two initial prototypes, not the full public build history. No before/after image unless actual versions are available. |
| OO-09 | Attribution | Supplied source; [live prototype](https://mcbradd.github.io/overlords-and-outlaws/) | Credit original concept to Malachy Murray; game design, art direction, and AI-directed development to Bradd. Do not imply O&O has an open-source license merely because its repository is public. |
| REVIEW-01 | Four-part design critique rubric and screenshot-based review | [Public script](https://github.com/mcbradd/creative-leadership/blob/main/scripts/design-review.mjs); [local snapshot](../references/design-review.mjs) | Script inspects image files, samples up to configured maximum (default 12), supplies page copy, and saves timestamped output. Output is advisory. |
| REVIEW-02 | Bradd authored the rubric and directs which changes to make | Supplied account, public script | Authorship is Bradd's account; script contents corroborate the rubric's existence. Do not imply the automation independently owns direction. |
| REVIEW-03 | Historical critique drove a specific implemented improvement | Suggested `[ADD]` in supplied source | Unavailable until an actual critique and corresponding prior/final captures are paired. A new portfolio annotation can demonstrate the method if labeled honestly. |
| REVIEW-04 | Leadership site and Room to Wonder exist | [Leadership site](https://mcbradd.github.io/creative-leadership/), [classroom](https://mcbradd.github.io/creative-leadership/classroom/), [repository](https://github.com/mcbradd/creative-leadership) | Link current builds. The captured leadership hero only proves its captured state. Credit Stone Perales as collaborator; content/art direction/build are attributed to Bradd's account. |
| CB-01 | ColorBreak provides a browser bid-planning interface | [Live app](https://mcbradd.github.io/ColorBreak/), [repository](https://github.com/mcbradd/ColorBreak) | Live capture supports current entry UI. More specific feature claims require matching code or demonstration; do not infer an outcome from a landing capture. |
| CB-02 | OCR flags low-confidence lines; missing prices are not zero | Supplied source citing ColorBreak implementation | Present as the product's published design/implementation behavior, with source link. Do not claim the portfolio builder independently tested OCR unless the release evidence includes that test. |
| CB-03 | Adversarial review by expert personas | [Public V2 docs](https://github.com/mcbradd/ColorBreak/tree/main/docs/v2) and supplied account | These are AI personas, not a panel of recruited human experts. Human-owned adjudication is Bradd's account. No adoption, revenue, or profitability claim is supported. |
| MONTH-01 | Month One operating copilot public build | [Live demo](https://mcbradd.github.io/Whatnot/), [repository](https://github.com/mcbradd/Whatnot) | Public repository contains compiled output; do not describe it as a full published source implementation. No revenue or business-success claim. |
| MONTH-02 | Evidence gates and withheld conclusions | Supplied source's published-build inspection | Explain the interface's logic without presenting it as financial advice or validating the business model. Validate any quoted current screen before reproducing its exact wording. |
| MONTH-03 | Upgrade packages and show-control-panel tools | Bradd's supplied account | Not part of the public Month One build. No fabricated screenshot or suggestion that the public demo exposes those controls. |
| PHASE-01 | PR #6197, initial repeatability problem and stable ordering fixes | [PR #6197](https://github.com/phase-rs/phase/pull/6197); [snapshot](../references/phase-pr-6197.json) | PR reports 18% of four-player games diverging across five same-binary/same-seed repeats. It addresses nine actual hash-map-order sites. `merged: true` in inspected metadata. |
| PHASE-02 | PR #6777, 100-pair gauntlet | [PR #6777](https://github.com/phase-rs/phase/pull/6777); [snapshot](../references/phase-pr-6777.json) | PR reports 98 identical outcomes, 2 timeout-to-win completion shifts, 0 divergent pairs. Control already includes measurement mode. `merged: true` in inspected metadata. |
| PHASE-03 | Median elapsed ratio 0.9328 | Same PR #6777 | Candidate versus control for this five-commit bundle, on identical seeds; not an overall engine speedup and not the effect of adding measurement mode. Underlying run artifacts are in a separate pod-lab directory, not in this PR. |
| PHASE-04 | Deck compatibility protocol adapter | [PR #8716](https://github.com/phase-rs/phase/pull/8716); [snapshot](../references/phase-pr-8716.json) | PR describes a thin adapter delegating to existing engine authority. POD-Lab is named as a consumer. `merged: true` in inspected metadata. |
| PHASE-05 | 23 opened / 22 merged across July–September | [Author PR search](https://github.com/phase-rs/phase/pulls?q=is%3Apr+author%3Amcbradd) and supplied source snapshot | Supplied account of a bounded time period. Do not silently present it as a live current total. Recount the specified period or omit the headline metric. |
| PHASE-06 | Bradd's contribution and AI use | Supplied account and disclosures in selected PRs | Bradd directed/contributed; upstream belongs to phase-rs and maintainers. Do not claim he built the whole engine or hand-wrote every change. |
| BIO-01 | Career, teaching, team sizes, studio responsibilities | Supplied user-confirmed account and linked production pages | Attribute as professional account; no invented employer verification. Preserve the distinction between partner credits and direct employment. |
| BIO-02 | Amber output more than doubled; pixel animation schedule reduced 80% | Supplied account | Private production metrics, not publicly audited results. If used, label as Bradd's account and retain scope; do not elevate to unqualified homepage proof counters. |
| BIO-03 | Contact and location | Supplied account | Public email `bradd.mcbrearty@gmail.com`; LinkedIn, ArtStation, GitHub; Oceanside, California. No phone publication. |

## Required corrections to the supplied draft

1. **Separate the Phase experiments.** The initial 18% nondeterminism measurement in #6197 and the later 100-pair gauntlet in #6777 are different tests. The latter's control already includes measurement mode. Do not show an “18% → 0%” before/after chart, claim the gauntlet alone proves the measurement-mode fix, or imply the ratio is a universal performance gain.
2. **Remove the blanket no-artist-name claim.** The manifest explicitly references Holbein for Henry VIII, Anguissola for Philip II, and Jean Clouet for Francis I as historical portrait evidence. A defensible statement is that the briefs specify era, materials, palette, composition, sources, and uncertainty. Do not say that no prompt names any artist.
3. **Do not freeze the draft's 90-candidate count.** There are 84 top-level records and eight preserved `previous` objects in the inspected main manifest, while a separate revision file lists six entries. This difference needs an actual masters inventory before any total-output claim. The supported headline remains “84 portraits, with recorded prompts and provenance.”
4. **Keep the O&O regression.** 11.6% is a lower tradeoff-candidate share than the earlier 24.6% under the same-seed proxy. It is useful evidence of intellectual honesty, not a success metric to reframe.
5. **Distinguish a rubric from a completed iteration.** The review script proves a method exists. A current screenshot plus a newly written annotation demonstrates current judgment; it does not prove a historical AI critique caused a past change.
6. **Keep private results in their actual category.** Personal production metrics, prototype timing, and unpublished show tools can be described as Bradd's account. They must not look independently verified simply because they appear alongside public code links.

## Production-art attribution

The supplied document catalogs Bradd's ArtStation work. The launch gallery contains eight curated pieces with category filters and source links; an accessible lightbox may provide enlargement. The table below is the broader attribution reference, not a claim that every listed item appears in the initial gallery. Every reproduced image retains its original piece link and a role-specific credit; do not turn collaborative production into sole-authorship claims.

| Work | Public source | Credit boundary to preserve |
| --- | --- | --- |
| Tetris Beat — Falling Fantasy | [ArtStation](https://www.artstation.com/artwork/qe5BrP) | Technical-art/shader contribution; the music and broader game are collaborative |
| Tetris Beat — Summersalts | [ArtStation](https://www.artstation.com/artwork/NyLJAN) | Design follows the recording artist's symbols/visual context; do not claim ownership of the music |
| Tetris Beat — Accidental Love | [ArtStation](https://www.artstation.com/artwork/JvqJLd) | Artist-selected palette and track symbols; technical performance claims belong to the source account |
| Ultimate Rivals: The Rink | [ArtStation](https://www.artstation.com/artwork/kNERqn) | Responsibility for final quality across specified disciplines does not imply sole production of every asset |
| Disney Enchanted Tales | [ArtStation](https://www.artstation.com/artwork/DR4kR) | Character modeling/rigging/animation direction and lighting; collaborative game production |
| Rapunzel, Pan Flourish | [ArtStation](https://www.artstation.com/artwork/xXGlW) | Final animation, model, rig by Bradd; textures by another artist |
| Jasmine, Joyful Twirling | [ArtStation](https://www.artstation.com/artwork/KDnJx) | Shared initial blocking/model work; Bradd's finishing animation, model revisions, and rig; textures by another artist |
| Highborn | [ArtStation](https://www.artstation.com/artwork/1oGD8) | Model, texture, rig by Bradd; concepts by Danny Roberts |
| Magic Book Shop | [ArtStation](https://www.artstation.com/artwork/ynwe5) | Bradd's concept-to-implementation account for this building; do not generalize every Ghosts of Mistwood asset as solely his |
| Saw X: Survive the Obby | [ArtStation](https://www.artstation.com/artwork/dKoq3J) | Name the specific technical-art tools/contributions; game and licensed property remain collaborative |
| Secret Neighbor: Roblox Edition | [ArtStation](https://www.artstation.com/artwork/dKoqkQ) | System design with engineers; do not imply sole engineering authorship |
| Unity to Roblox Accessory Pipeline | [ArtStation](https://www.artstation.com/artwork/8bnd0O) | Preserve technical artist Alan Martinez's project-organization credit |

## Available captures and missing media

Local current-state evidence includes [O&O home](../assets/evidence/overlords-live-home.jpg), [ColorBreak entry](../assets/evidence/colorbreak-live-entry.jpg), [Creative Leadership hero](../assets/evidence/creative-leadership-live-hero.jpg), and [Month One](../assets/evidence/month-one-live.jpg). These files are evidence inputs; optimized copies used on the site may have different paths.

Genuine historical image-revision evidence now includes [Henry VII before](../assets/evidence/henry-vii-before.webp), the retained [before original](../assets/evidence/henry-vii-before-original.png), the [after original](../assets/evidence/henry-vii-after-original.webp), and matched [before](../assets/evidence/henry-vii-before-detail.webp)/[after](../assets/evidence/henry-vii-after-detail.webp) window-detail crops. These are actual source outputs, not recreated “before” images. Display them as the signature critique with persistent labels, the recorded edit instruction, and the `tudor-0` provenance link. The comparison concerns the distant architecture; do not claim untouched pixels or universal historical correctness without checking those separately.

The draft also requests gameplay videos, a historical website-design-review before/after, detailed OCR interaction captures, and unpublished show-control-panel imagery. These are distinct from the recovered Henry VII pair and remain subject to individual availability checks. A polished launch can use honest current captures, explicit written decisions, and source-linked diagrams. Never fill those gaps with synthetic screenshots or fabricated review history.

Any generated atmospheric artwork needs a separate provenance note containing its prompt, purpose, tool, output file, and transformations. It is new portfolio decoration. Any new annotation example needs an equally clear demonstration label.

## Release evidence is separate

This ledger establishes content constraints. It does not certify the portfolio's accessibility, performance, deployment, or live behavior. Record those actual results with the deployed commit and production checks in the release record. If a source changes later, revise the claim rather than treating this snapshot as an evergreen current-state guarantee.
