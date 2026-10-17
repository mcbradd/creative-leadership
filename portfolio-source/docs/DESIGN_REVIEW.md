# Design critique and revisions

Reviewed October 17, 2026, in the rendered site. This record documents actual changes, rather than treating a successful build as a design review. Final deployment evidence is recorded separately in RELEASE.md.

## Direction

Warm paper, large editorial serif type, charcoal sections, restrained rust accents, and physically arranged portrait cards. The composition gives the visitor finished visual work immediately, then brings the reasoning and evidence into view. Self-hosted Instrument Serif and Manrope keep the typography consistent without a third-party font request.

## Findings and revisions

| Finding | Revision | Verification |
| --- | --- | --- |
| A generic critique sheet explained judgment but did not visibly demonstrate a real correction. | Replaced the centerpiece with the original and revised Henry VII outputs, matching detail crops, full-portrait mode, and the recorded edit instruction. | Inspected both source images and the rendered paired views. Preserved the actual differences. |
| Small copy and navigation felt too delicate beside the large headings. | Increased desktop body, card, and navigation sizes; increased the phone introduction and project copy. | Reviewed desktop, tablet, and phone compositions. |
| The first scroll treatment faded text through low-contrast intermediate states. | Removed opacity animation. Small vertical movement remains; content is readable throughout and reduced motion disables transitions. | Homepage axe recheck reports zero violations for the selected WCAG tags. |
| At 320 px the two hero actions broke into awkward multiline labels. | Reduced spacing and button padding only at the narrow breakpoint; kept labels on one line. | Rechecked the narrow layout. |
| The gallery needed closer image inspection without losing authorship. | Added native dialogs with image, credit, source link, close control, backdrop dismissal, Escape, and native focus restoration. Original ArtStation links remain available. | Phone filter and dialog interaction reviewed; gallery accessibility audit reports zero violations. |
| Mobile navigation and evidence selection depended on scripts. | Added explicit no-script styles: visible navigation, all six portrait panels, source links, and hidden nonfunctional controls. | JavaScript-disabled browser inspection shows six visible portrait panels and usable navigation without horizontal overflow. |
| Fonts were larger than necessary for delivery. | Converted the six licensed fonts to WOFF2 without changing their glyph content; retained license files. | Inspected rendered typography and local asset integrity. |
| The portrait fan loaded full-size sources on small screens. | Added responsive 420/840 pixel image candidates with an explicit rendered-size hint. | Production build and browser-selected source inspected after the change. |
| Some source statements overstated the evidence. | Removed the blanket no-artist-name claim and exact candidate count; separated Phase experiments; qualified human-test and Month One limitations. | Cross-checked published records and retained explicit evidence links. |

## Composition review

At 1440 px, the portrait fan balances the two-line headline without competing with the name or actions. The lead project receives a larger image and more space; supporting projects follow in a quieter two-column rhythm. The dark comparison section changes the pace while demonstrating a single precise judgment. The final paper sculpture is decorative and disclosed as generated art.

At 768 px, the hero remains a balanced two-column composition and the navigation collapses. At 390 px, the reading order becomes headline, actions, artwork, then evidence. At 320 px, all 11 content routes were checked for horizontal document overflow and broken loaded images: none were found. These are browser viewport checks, not claims of testing on every physical device.

The source includes graceful static reading, reduced-motion behavior, visible keyboard focus, native disclosures, pressed-state controls, and native modal semantics. Automated accessibility checks cover representative templates and supplement manual interaction review; they are not a certification of complete WCAG conformance.

## Accepted tradeoffs

- Some ArtStation video poster sources are modest resolution. Their framing is preserved and links lead to the full work and video; no AI detail has been invented.
- Project screenshots document current public builds. They are not presented as historical before-and-after evidence.
- The site has no autoplay audio, simulated loading sequence, or forced scroll narrative. The immersive quality comes from composition, materials, and useful inspection.
- Hiring and conversion effectiveness cannot be established by this design pass. The portfolio makes the work and reasoning easier to inspect.
