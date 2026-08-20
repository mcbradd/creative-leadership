export type CaseStudy = {
  id: string;
  title: string;
  owner: "Bradd" | "Stone";
  role: string;
  eyebrow: string;
  image: string;
  imagePosition?: string;
  alt: string;
  statement: string;
  brief: string;
  moves: string[];
  proof: string[];
  relevance: string;
  /** Attribution shown with the proof chips when the figures are self-reported. */
  sourceNote?: string;
};

export type Insight = {
  id: string;
  title: string;
  kicker: string;
  statement: string;
  brief: string;
  moves: string[];
  proof: string[];
  relevance: string;
  sourceNote?: string;
};

export type Partner = {
  name: string;
  category: "Platform" | "Franchise" | "Product" | "Entertainment";
  owner: "Bradd" | "Stone" | "Joint";
  relationship: string;
  note: string;
};

export const capabilityInsights: Insight[] = [
  {
    id: "ip-stewardship",
    title: "IP Stewardship",
    kicker: "Protect the center. Expand the edges.",
    statement: "We identify what audiences cannot afford to lose—then create room for everything the property can become.",
    brief: "Strong stewardship is not preservation by inertia. It is a clear set of creative rules that lets teams move faster while keeping character, tone, canon, and audience trust intact.",
    moves: ["Define the emotional promise the audience cannot afford to lose.", "Translate canon into practical creative guardrails for every discipline.", "Align licensors, makers, and commercial stakeholders around the same approval standard."],
    proof: ["On Tetris Beat, Stone established the visual grammar while Bradd connected it to the technical and production framework that carried the game to release.", "Stone's Warner Bros. / DC and Nickelodeon work applied licensed-character standards across cards, collectibles, animation art, and consumer products.", "Bradd's Disney work connected established character standards to reusable art and animation pipelines."],
    relevance: "Executives get a team that can expand a property without creating approval churn, visual drift, or a product that no longer feels true to its audience.",
  },
  {
    id: "game-design",
    title: "Game Design",
    kicker: "Make the promise playable.",
    statement: "The interaction should express the world—not merely sit inside it.",
    brief: "We move from audience fantasy to core loop, game feel, progression, and prototype. The goal is a product people understand with their hands before anyone has to explain it.",
    moves: ["Prototype the defining player fantasy before committing the full production.", "Tune feedback, rhythm, onboarding, and accessibility until the premise is clear in the player's hands.", "Connect progression and repeat play to the fantasy instead of layering retention mechanics on top of it."],
    proof: ["For Ultimate Rivals, Bradd turned a rare multi-league licensing premise into controller-ready prototypes used to make the product vision tangible in executive sessions.", "On Tetris Beat, Bradd and Stone helped align interaction, audio-synchronized visuals, technical systems, and content production around one readable rhythm-game experience.", "Bradd's Roblox technical-art direction connected recognizable entertainment properties to the performance and production realities of the platform."],
    relevance: "The product thesis becomes something a decision maker can see, play, budget, and evaluate before the organization takes on avoidable production risk.",
  },
  {
    id: "visual-systems",
    title: "Visual Systems",
    kicker: "Give the world a grammar.",
    statement: "A great visual language remains recognizable across artists, formats, and years.",
    brief: "We build systems—not isolated key art—so every UI state, card, collectible, environment, and marketing surface feels like it belongs to the same world.",
    moves: ["Establish the shape, color, material, typography, and motion logic that makes the world recognizable.", "Build modular templates that let many contributors work without flattening the original voice.", "Create review standards that make quality decisions faster and more consistent at scale."],
    proof: ["Stone directed Chaotic as one visual system spanning animation, a trading card game, digital play, packaging, and merchandise.", "For Court of the Dead, Stone helped turn an original mythology into design-bible foundations that could support collectibles, publishing, and tabletop play.", "On Tetris Beat, Stone created style guidance and song-specific visual breakdowns so multiple artists could build distinct levels inside one coherent game."],
    relevance: "A durable visual grammar reduces reinvention, protects recognition, and gives internal and external teams a shared standard they can actually use.",
  },
  {
    id: "product-strategy",
    title: "Product Strategy",
    kicker: "Connect creative ambition to durable value.",
    statement: "We help the strongest idea survive contact with schedule, platform, licensing, and market reality.",
    brief: "That means shaping the pitch, sequencing the product, defining the content architecture, and choosing where to invest so a launch can become an expandable business.",
    moves: ["Clarify the audience, product promise, and commercial thesis in the same language.", "Map one IP across the physical and digital surfaces that genuinely strengthen it.", "Build a credible sequence of prototypes, production decisions, and investment narratives around visible proof."],
    proof: ["At Bit Fry, Bradd helped shape and present the product vision behind a team financing outcome reported at $40M while the company scaled its licensed sports platform.", "At Sound Games, Bradd authored pitch and narrative materials associated with two successful seed rounds totaling more than $7M, according to the canonical employment record.", "Across Chaotic and Court of the Dead, Stone built visual rules that allowed one world to move between screen, shelf, publishing, and play without losing coherence."],
    relevance: "Creative ambition arrives with a sequence the business can fund, the team can produce, and partners can understand without separate competing stories.",
    sourceNote: "Funding figures describe team outcomes and Bradd's documented contribution; they are not claims of sole credit.",
  },
  {
    id: "team-building",
    title: "Team Building",
    kicker: "Build the team around the problem.",
    statement: "Creative leadership becomes real in the decisions a team can make without waiting for permission.",
    brief: "We create shared language, useful constraints, healthy critique, and production clarity across art, design, engineering, brand, and external partners.",
    moves: ["Align disciplines around one visible quality target and a shared definition of done.", "Mentor leads while removing the structural friction that makes good judgment hard to exercise.", "Scale culture, critique, and production practice with the work instead of adding process after problems appear."],
    proof: ["Bradd helped scale Bit Fry from four to 55+ full-time staff, plus roughly 30 external vendors, while connecting product vision to team structure.", "Stone has directed global art networks ranging from roughly 40 to more than 200 contributors around shared visual standards.", "During the Tetris Beat recovery, the wider team rebuilt a substantial body of work after Bradd helped establish a unified production framework and Stone established the visual direction."],
    relevance: "The organization gains clearer decisions, stronger leads, and a production system that keeps quality from depending on two people being in every room.",
    sourceNote: "Team sizes and recovery details are self-reported career and internal production records.",
  },
];

export const leaderInsights: Record<"bradd" | "stone", Insight> = {
  bradd: {
    id: "bradd-profile",
    title: "Bradd McBrearty",
    kicker: "Creative Director · Game + Product Leadership",
    statement: "He builds the bridge between an ambitious idea and the team, technology, and product logic required to ship it.",
    brief: "Bradd combines creative direction, game design, technical fluency, production recovery, product strategy, and executive communication—especially where a project needs a credible path through uncertainty.",
    moves: ["Turn audience fantasy into a playable product thesis that can be tested early.", "Connect creative standards to the technical and production systems required to ship them.", "Build teams, prototypes, and investment narratives around the same visible proof."],
    proof: ["Across more than 15 years in games and interactive entertainment, Bradd moved from technical art into creative, product, production, and executive leadership.", "At Bit Fry, he helped scale the organization from four to 55+ full-time staff, plus roughly 30 external vendors, while directing the product vision for Ultimate Rivals.", "He authored pitch and narrative materials associated with two successful Sound Games funding rounds and teaches in LCAD's Game Design MFA program."],
    relevance: "Bradd is most useful when an ambitious idea needs a credible product shape, a technical path, and an organization that can carry both to market.",
    sourceNote: "Experience, team-scale, funding, and teaching details come from Bradd's public résumé and canonical employment record.",
  },
  stone: {
    id: "stone-profile",
    title: "Stone Perales",
    kicker: "Art Director · Worlds + Franchise Systems",
    statement: "He gives worlds a visual grammar strong enough to survive the jump from screen to shelf to play.",
    brief: "Stone brings franchise art direction, collectible instincts, worldbuilding, licensed-product stewardship, and the ability to align large creative networks around a distinctive, repeatable visual standard.",
    moves: ["Find the visual idea an audience can recognize before it reads a logo.", "Translate that idea across cards, games, animation, collectibles, and consumer products.", "Direct contributors from early concept through production without diluting voice or quality."],
    proof: ["Across 28 years, per his public résumé, Stone has worked across games, comics, animation, trading cards, collectibles, toys, and licensed products.", "He directed Chaotic across animation, trading cards, online play, packaging, and merchandise, and helped build Court of the Dead across collectibles, publishing, and tabletop play.", "On Tetris Beat, he led the visual language, style guidance, audio-synchronized art direction, UI, marketing logo, team training, and approvals."],
    relevance: "Stone is most useful when a property needs a distinctive visual center that many contributors and product formats can extend without making it generic.",
    sourceNote: "Experience length and portfolio scope follow Stone's public ArtStation résumé and portfolio.",
  },
};

export const rangeInsights: Insight[] = [
  {
    id: "play",
    title: "Play",
    kicker: "Story becomes agency.",
    statement: "We turn the premise of an IP into decisions, feedback, rhythm, and mastery.",
    brief: "From controller prototypes to tabletop loops, the work begins with the feeling the audience came to inhabit—and the repeatable interaction that can deliver it.",
    moves: ["Prototype the core loop early enough to challenge the product thesis.", "Direct game feel, feedback, and technical implementation as one player-facing system.", "Design progression and live content so the experience stays legible as it grows."],
    proof: ["Bradd built controller-ready Ultimate Rivals prototypes that made a complex multi-league premise tangible for executive product discussions.", "Bradd and Stone helped turn Tetris Beat's rhythm premise into a shipped Apple Arcade experience with audio-synchronized visual direction and a rebuilt production framework.", "Their combined work spans digital games, Roblox experiences, and tabletop systems rather than treating play as a single platform format."],
    relevance: "A viewer can judge the player promise through working interaction and shipped evidence, not a strategy deck that postpones the hardest product questions.",
  },
  {
    id: "collect",
    title: "Collect",
    kicker: "Desire becomes an object.",
    statement: "A collectible is concentrated worldbuilding—identity, story, scarcity, and craft in one surface.",
    brief: "We understand the system behind the object: visual hierarchy, variant logic, packaging, material cues, character appeal, and the ritual of discovery.",
    moves: ["Design trading-card and variant systems around recognition, hierarchy, and discovery.", "Carry a premium world through collectible form, packaging, and production constraints.", "Connect physical and digital product expression when each makes the other more meaningful."],
    proof: ["Stone directed Chaotic's visual system across the trading card game, animation, online play, packaging, and licensed merchandise.", "His portfolio includes card and collectible work associated with RAID, Warner Bros. / DC, and Sideshow's Court of the Dead.", "On the Crayola contract engagement, Stone adapted supplied visual assets while Bradd built the rigging, animation, and real-time backbone that carried physical coloring into wearable digital masks."],
    relevance: "The collectible is treated as a concentrated expression of the property—with a clear system behind variants, materials, packaging, and future extensions.",
  },
  {
    id: "grow",
    title: "Grow",
    kicker: "One launch becomes a world.",
    statement: "We design the creative operating system that lets an IP expand without becoming generic.",
    brief: "Franchise logic, pipelines, design bibles, content architecture, and team development create the conditions for growth across products and generations.",
    moves: ["Create franchise and style-guide systems that make future decisions easier.", "Build art and production pipelines that preserve quality as content volume increases.", "Develop leads and align partners so the system survives beyond its original authors."],
    proof: ["Bradd's Disney pipeline work is reported to have made animation production roughly 60% faster while supporting more than 200 minutes of animation and 60+ character rigs.", "Stone's Chaotic direction kept one visual world coherent across television, cards, online play, packaging, and merchandise.", "Tetris Beat shipped with an expanded live content set after the wider team aligned around Bradd's production framework and Stone's visual system."],
    relevance: "Growth becomes a governed creative system rather than a sequence of disconnected launches that slowly erase what made the property valuable.",
    sourceNote: "Disney production figures and Tetris recovery details are self-reported internal career records.",
  },
];

export const jointInsights: Record<"tetris" | "crayola", Insight> = {
  tetris: {
    id: "tetris-beat-proof",
    title: "Tetris Beat",
    kicker: "Joint case file · Apple Arcade",
    statement: "A fragmented production became one coherent, shipped experience.",
    brief: "Tetris Beat was an at-risk rhythm-game production with creative, technical, and delivery problems that could not be solved independently. Bradd and Stone joined the work in complementary leadership roles and helped the wider team establish one visual and production system.",
    moves: ["Stone established the visual language, created style guidance and song-specific breakdowns, directed audio-synchronized visuals, mentored artists, and contributed the marketing logo and UI.", "Bradd identified the leadership and systems gap, helped establish a unified technical framework and milestone path, and connected the rebuild to a practical production plan.", "The wider team used those shared standards to rebuild a substantial body of work rapidly and continue toward release."],
    proof: ["The internal production record describes a five-day recovery sprint involving more than 20 artists.", "The shipped title expanded to 28 live levels and released eight months after the recovery period described by the team.", "Internal performance reporting says the game remained at or near the top of Apple Arcade for more than six weeks."],
    relevance: "This is evidence that Bradd and Stone have already operated as one accountable leadership system under pressure—not a proposal that they might collaborate well in the future.",
    sourceNote: "Recovery timing, team size, level count, ship interval, and chart performance are user-verified internal records rather than independently audited product claims.",
  },
  crayola: {
    id: "crayola-contract-proof",
    title: "Crayola Color Alive",
    kicker: "Joint contract case · Funny Faces—Crazy Costumes",
    statement: "Physical coloring became an animated, wearable digital play experience.",
    brief: "The contract engagement began after the existing technical approach was not producing the required interactive result. The assignment was not to author the underlying Crayola property; it was to make supplied character artwork work convincingly inside a scanned, animated app experience.",
    moves: ["Stone adapted the supplied visual assets for the interactive format and maintained continuity with the product's established character language.", "Bradd built the technical backbone for rigging, animation, and real-time behavior after the earlier implementation path was not working.", "Together, their work connected the physical coloring activity to animated virtual masks children could see and wear on screen."],
    proof: ["The delivered experience combined physical coloring, scanning, animation, and camera-based virtual-mask play.", "Front and back retail-package imagery documents the intended physical-to-digital interaction.", "The engagement is presented as uncredited contract work so the contribution is clear without implying authorship of the Crayola property."],
    relevance: "The case shows how the partnership handles an unfamiliar product constraint: Stone protects visual continuity while Bradd builds the system that lets the idea behave in a new medium.",
    sourceNote: "No mask-count claim is included because the available public number could not be confirmed for this exact product and delivered scope.",
  },
};

export const rangeVisuals: Record<"play" | "collect" | "grow", { image: string; alt: string; label: string; position: string }> = {
  play: { image: "ultimate-rivals-hires.webp", alt: "Ultimate Rivals gameplay in a multi-league sports arena", label: "Playable multi-league product vision", position: "33% center" },
  collect: { image: "stone-raid-hires.webp", alt: "RAID fantasy card artwork from Stone's portfolio", label: "Card and collectible direction", position: "center 52%" },
  grow: { image: "stone-chaotic-hires.webp", alt: "Chaotic trading card artwork from the transmedia franchise", label: "A visual system built across formats", position: "center" },
};

export const caseStudies: CaseStudy[] = [
  {
    id: "ultimate-rivals",
    title: "Ultimate Rivals",
    owner: "Bradd",
    role: "Creative + Game Direction",
    eyebrow: "League-spanning play",
    image: "ultimate-rivals-hires.webp",
    imagePosition: "33% center",
    alt: "Ultimate Rivals ice rink game artwork",
    statement: "One sports universe. Every league in play.",
    brief: "Translate a rare multi-league licensing opportunity into an ownable game universe—then make the idea tangible enough for partners, investors, and players to feel it.",
    moves: ["Defined the creative and gameplay vision across franchise, product, and pitch surfaces.", "Built playable controller prototypes for an executive working session with Apple.", "Aligned an expanding distributed team around a shared game-feel target."],
    proof: ["The product organized athletes from multiple professional leagues inside one game universe rather than treating each license as a separate experience.", "Bradd built playable controller prototypes used to make the product vision tangible in executive working sessions.", "The wider team helped secure a financing outcome reported at $40M while the company scaled from four to 55+ full-time staff."],
    relevance: "The case shows Bradd connecting an unusually complex licensing premise to a playable product, an executive narrative, and the team structure required to pursue it.",
    sourceNote: "The raise was a team outcome; Bradd pitched and contributed to it.",
  },
  {
    id: "chaotic",
    title: "Chaotic",
    owner: "Stone",
    role: "Franchise Art Direction",
    eyebrow: "A world built to travel",
    image: "stone-chaotic-hires.webp",
    alt: "Chaotic fantasy trading card artwork",
    statement: "A franchise language players can watch, play, and collect.",
    brief: "Create a coherent visual world that could hold together across television, a trading card game, digital play, packaging, and licensed merchandise.",
    moves: ["Established the art-direction language and systems for a growing transmedia property.", "Directed global contributors across illustration, animation, product, and marketing.", "Protected continuity while adapting the world to radically different formats."],
    proof: ["The same visual language supported the trading card game, animated series, online game, packaging, merchandise, toys, and clothing.", "Stone directed contributor networks ranging from roughly 40 to more than 200 people around shared visual standards.", "The result was a franchise-wide system rather than unrelated art direction for each format."],
    relevance: "The case shows Stone building the kind of visual grammar a growing property needs before many teams, vendors, and product categories begin interpreting it.",
    sourceNote: "Contributor ranges and role scope follow Stone's public résumé and portfolio.",
  },
  {
    id: "disney",
    title: "Disney Enchanted Tales",
    owner: "Bradd",
    role: "Pipeline + Creative Leadership",
    eyebrow: "Story at production scale",
    image: "disney-hires.webp",
    alt: "Disney Enchanted Tales character artwork",
    statement: "A beloved world needs a production system worthy of it.",
    brief: "Increase the velocity and consistency of a character-heavy Disney experience without flattening the personality that makes the IP matter.",
    moves: ["Redesigned the art and animation pipeline around clearer handoffs and reusable systems.", "Connected creative standards directly to technical constraints and team practice.", "Built a structure that let artists spend more time on performance and less on repetition."],
    proof: ["Bradd's internal career record reports an animation-production improvement of roughly 60% after the pipeline redesign.", "The production system supported more than 200 minutes of animation and more than 60 character rigs.", "Reusable handoffs and technical standards shifted artist time away from repeated setup and toward character performance."],
    relevance: "The case shows that protecting a beloved IP is not only an art-direction problem; the production system must make consistent character performance achievable at content scale.",
    sourceNote: "Production figures are internal, self-reported career metrics.",
  },
  {
    id: "warner",
    title: "Warner Bros. + DC",
    owner: "Stone",
    role: "Licensed-Product Art Direction",
    eyebrow: "Icons, many expressions",
    image: "stone-wb-hires.webp",
    imagePosition: "center 24%",
    alt: "DC Comics character style and product artwork",
    statement: "Make heritage IP feel current without losing its center.",
    brief: "Create adaptable style systems for globally recognized characters across trading cards, collectibles, animation art, and consumer products.",
    moves: ["Built modular visual languages that remain recognizable across artists and formats.", "Balanced licensor stewardship, audience expectations, and product-level originality.", "Guided art from early direction through production-ready execution."],
    proof: ["Stone's portfolio shows DC character-style and production-art systems designed for licensed product contexts.", "The work spans trading cards, collectibles, animation art, and consumer-product applications.", "His role connected early visual direction to production-ready art instead of ending at a single presentation image."],
    relevance: "The case shows how Stone keeps heritage characters recognizable while giving different products enough visual flexibility to feel current and desirable.",
    sourceNote: "Relationship and scope follow Stone's public portfolio; the work is not presented as one identical role across every Warner Bros. or DC product.",
  },
  {
    id: "emerging",
    title: "Emerging Production",
    owner: "Bradd",
    role: "Technical + Creative Direction",
    eyebrow: "New tools, responsible leverage",
    image: "neighbor-hires.webp",
    imagePosition: "center 38%",
    alt: "Secret Neighbor Roblox Edition key artwork",
    statement: "Use new technology to expand taste—not replace it.",
    brief: "Build practical, rights-cleared production approaches for Roblox-scale content and other fast-moving formats while protecting the human judgment at the center of the work.",
    moves: ["Designed production systems that connect creative intent, tool choice, and legal clarity.", "Mentored cross-disciplinary teams through unfamiliar technical and aesthetic territory.", "Turned experiments into repeatable workflows instead of isolated demos."],
    proof: ["Internal workflow testing reported more than double the contributor output after the new approach was introduced.", "The system connected tool choice to explicit rights and production rules instead of treating experimentation as a legal or creative exception.", "Bradd used the workflow to enable a distributed team rather than keeping the new capability inside a small specialist group."],
    relevance: "The case shows Bradd evaluating emerging production tools through quality, rights, repeatability, and team adoption—not novelty alone.",
    sourceNote: "Output figure is an internal measurement from tested workflows.",
  },
  {
    id: "court",
    title: "Court of the Dead",
    owner: "Stone",
    role: "Worldbuilding + Art Direction",
    eyebrow: "From mythology to play",
    image: "stone-court-hires.webp",
    imagePosition: "65% center",
    alt: "Court of the Dead fantasy character artwork",
    statement: "Build the rules of a world before multiplying its surfaces.",
    brief: "Evolve an original mythology into a durable creative system spanning premium collectibles, comics, books, and the Mourners Call tabletop game.",
    moves: ["Developed visual and narrative systems that gave collaborators a common compass.", "Created design-bible foundations for characters, factions, environments, and products.", "Carried a premium collectible sensibility into story-rich and playable formats."],
    proof: ["Stone contributed conceptual design and worldbuilding to an original mythology rather than adapting an established licensed property.", "The visual system supported premium collectibles, comics, books, and other publishing surfaces.", "Mourners Call carried the same world into a credited tabletop-game expression."],
    relevance: "The case shows Stone defining enough visual and narrative structure for an original world to move from premium objects into story and play without losing its center.",
    sourceNote: "Stone is named in published Mourners Call credits; broader scope follows his public portfolio.",
  },
];

export const partners: Partner[] = [
  { name: "Apple", category: "Platform", owner: "Joint", relationship: "Prototype + shipped platform title", note: "Bradd built controller-ready product prototypes for executive working sessions; Bradd and Stone later led complementary production and visual work on Tetris Beat for Apple Arcade." },
  { name: "Tetris", category: "Franchise", owner: "Joint", relationship: "Shipped game leadership", note: "On Tetris Beat, Stone established the visual language while Bradd helped rebuild the technical and production framework used by the wider team to carry the game to release." },
  { name: "Disney", category: "Entertainment", owner: "Bradd", relationship: "Technical art + production systems", note: "Bradd led technical-art, animation, and outsource-production systems for character-heavy Disney work, including the pipeline improvements reported in his career record." },
  { name: "Warner Bros. / DC", category: "Franchise", owner: "Stone", relationship: "Licensed-product art direction", note: "Stone developed adaptable character-style and production-art systems used across trading cards, collectibles, animation art, and consumer-product contexts." },
  { name: "Roblox", category: "Platform", owner: "Bradd", relationship: "Technical art direction", note: "Bradd's public résumé credits him as Technical Art Director on Saw X: Survive the Obby and Secret Neighbor: Roblox Edition." },
  { name: "Crayola", category: "Product", owner: "Joint", relationship: "Uncredited contract engagement", note: "Stone adapted supplied character assets and Bradd built the rigging, animation, and real-time system that connected physical coloring to animated, wearable virtual masks." },
  { name: "Toyota", category: "Product", owner: "Stone", relationship: "Brand identity + visual direction", note: "Stone's public portfolio documents Toyota Trucks identity and visual-direction work for a North American brand context." },
  { name: "Nickelodeon / SpongeBob", category: "Franchise", owner: "Stone", relationship: "Licensed toy production", note: "Stone's portfolio documents character-driven toy and licensed-product work associated with SpongeBob and Nickelodeon." },
  { name: "Sideshow", category: "Product", owner: "Stone", relationship: "Original world + premium collectibles", note: "Stone contributed conceptual design and worldbuilding to Court of the Dead, which expanded across premium collectibles, publishing, and the credited Mourners Call tabletop game." },
  { name: "Ultimate Rivals", category: "Entertainment", owner: "Bradd", relationship: "Creative + game direction", note: "Bradd shaped the multi-league product vision, built playable controller prototypes, and aligned product, pitch, and team development around one sports-game universe." },
  { name: "Sound Games", category: "Product", owner: "Bradd", relationship: "Product narrative + funding materials", note: "Bradd authored pitch and narrative materials associated with two successful seed rounds totaling more than $7M, according to the canonical employment record." },
  { name: "Bit Fry", category: "Entertainment", owner: "Bradd", relationship: "Product + organizational leadership", note: "Bradd helped scale the company from four to 55+ full-time staff, plus roughly 30 external vendors, while contributing to the product vision and a team financing outcome." },
];

export const depthTimeline = [
  {
    bradd: { label: "PLAYABLE PROOF", value: "15+ years", note: "Games, entertainment, and interactive products" },
    stone: { label: "INDUSTRY DEPTH", value: "28 years", note: "Games, comics, collectibles, and animation, per his public résumé" },
  },
  {
    bradd: { label: "TEAM SYSTEMS", value: "4 → 55+", note: "Plus roughly 30 external vendors" },
    stone: { label: "GLOBAL DIRECTION", value: "40 → 200+", note: "Contributors aligned around one visual grammar" },
  },
  {
    bradd: { label: "BUSINESS MOMENTUM", value: "2 rounds", note: "Successful funding rounds closed" },
    stone: { label: "FORMAT RANGE", value: "Screen → shelf → play", note: "Cards, collectibles, animation, games, and brand" },
  },
];

export const supportingProof: Array<Insight & { label: string; note: string; image: string; position: string; fit?: "contain" }> = [
  {
    id: "raid-card-direction",
    label: "RAID",
    note: "Stone · card-game direction",
    image: "stone-raid-hires.webp",
    position: "center 52%",
    title: "RAID Card Direction",
    kicker: "Stone · Supporting portfolio evidence",
    statement: "An established fantasy property still needs a clear collectible hierarchy on every card-sized surface.",
    brief: "Stone's public portfolio includes RAID work identified as card-game direction. This artifact is presented as evidence of visual-system judgment in a collectible context—not as a claim that he created the RAID property or directed its entire franchise.",
    moves: [
      "Applied card-game art-direction judgment to recognizable fantasy characters inside a repeatable collectible format.",
      "Balanced high-impact character presentation with the hierarchy and consistency a multi-card system requires.",
      "Kept the contribution scoped to the documented card-game work rather than implying ownership of the underlying property.",
    ],
    proof: [
      "The displayed RAID artifact appears in Stone's public portfolio and is identified there as card-game direction.",
      "The stronger end-to-end franchise case elsewhere in this presentation is Chaotic; RAID is included as adjacent evidence in an established fantasy-product context.",
      "The credit is deliberately limited to the documented portfolio relationship and does not imply endorsement or sole authorship.",
    ],
    relevance: "An executive can see specific evidence that Stone has worked within an established fantasy property while still creating the clarity and collectible appeal a card system needs.",
    sourceNote: "Role and relationship follow Stone's public portfolio; no broader RAID franchise claim is being made.",
  },
  {
    id: "toyota-trucks-identity",
    label: "TOYOTA",
    note: "Stone · North American identity",
    image: "stone-toyota-hires.webp",
    position: "center",
    fit: "contain",
    title: "Toyota Trucks Identity",
    kicker: "Stone · Supporting portfolio evidence",
    statement: "A product-line identity has to feel specific while remaining unmistakably part of a global brand.",
    brief: "Stone's public portfolio documents Toyota Trucks identity and visual-direction work in a North American context. The evidence demonstrates brand-system range beyond entertainment properties without claiming authorship of Toyota's corporate identity.",
    moves: [
      "Focused the documented work on identity and visual direction for Toyota Trucks in a North American brand context.",
      "Worked inside an established global marque while giving the truck product line a coherent visual expression.",
      "Connected product imagery and graphic language as one recognizable brand presentation rather than a set of unrelated assets.",
    ],
    proof: [
      "The displayed Toyota Trucks artifact is drawn from Stone's public portfolio.",
      "The portfolio identifies the relationship as identity and visual-direction work in a North American context.",
      "The project is presented as a scoped brand contribution, not as ownership of Toyota's global identity system.",
    ],
    relevance: "The work shows that Stone's system thinking can operate inside a mature consumer brand where recognition, product specificity, and stewardship must coexist.",
    sourceNote: "Relationship and regional context follow Stone's public portfolio.",
  },
  {
    id: "saw-x-roblox",
    label: "SAW X",
    note: "Bradd · Roblox technical art direction",
    image: "saw-hires.webp",
    position: "center",
    title: "Saw X: Survive the Obby",
    kicker: "Bradd · Supporting résumé credit",
    statement: "A recognizable horror property had to become a playable Roblox experience inside real platform constraints.",
    brief: "Bradd's public résumé credits him as Technical Art Director on Saw X: Survive the Obby. This artifact supports that precise platform-and-property relationship; it is not presented as a claim that he created the Saw franchise or directed the film campaign.",
    moves: [
      "Led technical-art direction within the Roblox experience, connecting the licensed visual target to platform production realities.",
      "Helped translate recognizable franchise material into an interactive brand surface rather than a static adaptation.",
      "Worked within the constraints of an established property and platform while keeping the contribution clearly attributed.",
    ],
    proof: [
      "Bradd's public résumé names Saw X: Survive the Obby and credits him as Technical Art Director.",
      "The displayed project artwork identifies the specific licensed Roblox experience being referenced.",
      "His résumé also credits Secret Neighbor: Roblox Edition, providing a second documented example of technical-art direction in a licensed Roblox context.",
    ],
    relevance: "The credit shows Bradd operating where IP stewardship, real-time art, platform constraints, and a shipped interactive expression have to be solved together.",
    sourceNote: "Title and role follow Bradd's public résumé; the scope is limited to the credited Roblox experience.",
  },
];
