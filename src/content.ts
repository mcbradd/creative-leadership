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
    statement: "We identify what audiences cannot afford to lose, then create room for everything the property can become.",
    brief: "Strong stewardship is not preservation by inertia. It is a clear set of creative rules that lets teams move faster while keeping character, tone, canon, and audience trust intact.",
    moves: ["Define the emotional promise the audience cannot afford to lose.", "Translate canon into practical creative guardrails for every discipline.", "Align licensors, makers, and commercial stakeholders around the same approval standard."],
    proof: ["On Tetris Beat, Stone established the visual grammar while Bradd connected it to the technical and production framework that carried the game to release.", "Stone's Warner Bros. / DC and Nickelodeon work applied licensed-character standards across cards, collectibles, animation art, and consumer products.", "Bradd's Disney work connected established character standards to reusable art and animation pipelines."],
    relevance: "Executives get a team that can expand a property without creating approval churn, visual drift, or a product that no longer feels true to its audience.",
  },
  {
    id: "game-design",
    title: "Game Design",
    kicker: "Make the promise playable.",
    statement: "The interaction should express the world, not merely sit inside it.",
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
    brief: "We build systems, not isolated key art, so every UI state, card, collectible, environment, and marketing surface feels like it belongs to the same world.",
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
    proof: ["At Bit Fry, Bradd helped shape and present the product vision behind $40M in funding while the company scaled its licensed sports platform.", "At Sound Games, Bradd authored pitch and narrative materials for two successful seed rounds totaling more than $7M.", "Across Chaotic and Court of the Dead, Stone built visual rules that allowed one world to move between screen, shelf, publishing, and play without losing coherence."],
    relevance: "Creative ambition arrives with a sequence the business can fund, the team can produce, and partners can understand without separate competing stories.",
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
  },
];

export const leaderInsights: Record<"bradd" | "stone", Insight> = {
  bradd: {
    id: "bradd-profile",
    title: "BRADD McBrearty",
    kicker: "Creative Director · Game + Product Leadership",
    statement: "He builds the bridge between an ambitious idea and the team, technology, and product logic required to ship it.",
    brief: "Bradd combines creative direction, game design, technical fluency, production recovery, product strategy, and executive communication, especially where a project needs a credible path through uncertainty.",
    moves: ["Turn audience fantasy into a playable product thesis that can be tested early.", "Connect creative standards to the technical and production systems required to ship them.", "Build teams, prototypes, and investment narratives around the same visible proof."],
    proof: ["Across more than 15 years in games and interactive entertainment, Bradd moved from technical art into creative, product, production, and executive leadership.", "At Bit Fry, he helped scale the organization from four to 55+ full-time staff, plus roughly 30 external vendors, while directing the product vision for Ultimate Rivals.", "He authored pitch and narrative materials associated with two successful Sound Games funding rounds and teaches in LCAD's Game Design MFA program."],
    relevance: "Bradd is most useful when an ambitious idea needs a credible product shape, a technical path, and an organization that can carry both to market.",
  },
  stone: {
    id: "stone-profile",
    title: "STONE Perales",
    kicker: "Art Director · Worlds + Franchise Systems",
    statement: "He gives worlds a visual grammar strong enough to survive the jump from screen to shelf to play.",
    brief: "Stone brings franchise art direction, collectible instincts, worldbuilding, licensed-product stewardship, and the ability to align large creative networks around a distinctive, repeatable visual standard.",
    moves: ["Find the visual idea an audience can recognize before it reads a logo.", "Translate that idea across cards, games, animation, collectibles, and consumer products.", "Direct contributors from early concept through production without diluting voice or quality."],
    proof: ["Across 28 years, Stone has worked across games, comics, animation, trading cards, collectibles, toys, and licensed products.", "He directed Chaotic across animation, trading cards, online play, packaging, and merchandise, and helped build Court of the Dead across collectibles, publishing, and tabletop play.", "On Tetris Beat, he led the visual language, style guidance, audio-synchronized art direction, UI, marketing logo, team training, and approvals."],
    relevance: "Stone is most useful when a property needs a distinctive visual center that many contributors and product formats can extend without making it generic.",
  },
};

export const rangeInsights: Insight[] = [
  {
    id: "play",
    title: "Play",
    kicker: "Story becomes agency.",
    statement: "We turn the premise of an IP into decisions, feedback, rhythm, and mastery.",
    brief: "From controller prototypes to tabletop loops, the work begins with the feeling the audience came to inhabit and the repeatable interaction that can deliver it.",
    moves: ["Prototype the core loop early enough to challenge the product thesis.", "Direct game feel, feedback, and technical implementation as one player-facing system.", "Design progression and live content so the experience stays legible as it grows."],
    proof: ["Bradd built controller-ready Ultimate Rivals prototypes that made a complex multi-league premise tangible for executive product discussions.", "Bradd and Stone helped turn Tetris Beat's rhythm premise into a shipped Apple Arcade experience with audio-synchronized visual direction and a rebuilt production framework.", "Their combined work spans digital games, Roblox experiences, and tabletop systems rather than treating play as a single platform format."],
    relevance: "Working interaction and shipped results let decision makers judge the player promise before the organization takes on avoidable production risk.",
  },
  {
    id: "collect",
    title: "Collect",
    kicker: "Desire becomes an object.",
    statement: "A collectible is concentrated worldbuilding: identity, story, scarcity, and craft in one surface.",
    brief: "We understand the system behind the object: visual hierarchy, variant logic, packaging, material cues, character appeal, and the ritual of discovery.",
    moves: ["Design trading-card and variant systems around recognition, hierarchy, and discovery.", "Carry a premium world through collectible form, packaging, and production constraints.", "Connect physical and digital product expression when each makes the other more meaningful."],
    proof: ["Stone directed Chaotic's visual system across the trading card game, animation, online play, packaging, and licensed merchandise.", "His card and collectible direction spans RAID, Warner Bros. / DC, and Sideshow's Court of the Dead.", "On the Crayola contract engagement, Stone adapted supplied visual assets while Bradd built the rigging, animation, and real-time backbone that carried physical coloring into wearable digital masks."],
    relevance: "The collectible is treated as a concentrated expression of the property, with a clear system behind variants, materials, packaging, and future extensions.",
  },
  {
    id: "grow",
    title: "Grow",
    kicker: "One launch becomes a world.",
    statement: "We design the creative operating system that lets an IP expand without becoming generic.",
    brief: "Franchise logic, pipelines, design bibles, content architecture, and team development create the conditions for growth across products and generations.",
    moves: ["Create franchise and style-guide systems that make future decisions easier.", "Build art and production pipelines that preserve quality as content volume increases.", "Develop leads and align partners so the system survives beyond its original authors."],
    proof: ["Bradd's Disney pipeline made animation production roughly 60% faster while supporting more than 200 minutes of animation and 60+ character rigs.", "Stone's Chaotic direction kept one visual world coherent across television, cards, online play, packaging, and merchandise.", "Tetris Beat grew from an original 12-song scope to 14 levels at launch, then added two funded 14-song seasons for 42 total live levels after the wider team aligned around Bradd's production framework and Stone's visual system."],
    relevance: "Growth becomes a governed creative system rather than a sequence of disconnected launches that slowly erase what made the property valuable.",
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
    proof: ["A five-day recovery sprint aligned more than 20 artists. Leadership in Southern California coordinated teams in Bucharest, Romania and Guadalajara, Mexico across two continents and multiple time zones, including training the Guadalajara VFX, 3D, and UI artists.", "The original scope covered 12 songs. Two songs were added before release for 14 levels at launch, then two funded postlaunch seasons of 14 songs each added 28 more for 42 total live levels.", "The title released eight months after the recovery sprint and remained at or near the top of Apple Arcade for more than six weeks."],
    relevance: "Bradd and Stone already operate as one accountable leadership system under pressure, joining creative direction, technical recovery, and production leadership around a shared standard.",
  },
  crayola: {
    id: "crayola-contract-proof",
    title: "Crayola Color Alive",
    kicker: "Joint contract case · Funny Faces: Crazy Costumes",
    statement: "Physical coloring became an animated, wearable digital play experience.",
    brief: "The contract engagement began after the existing technical approach failed to produce the required interactive result. Bradd and Stone turned supplied character artwork into a convincing scanned, animated app experience.",
    moves: ["Stone adapted the supplied visual assets for the interactive format and maintained continuity with the product's established character language.", "Bradd built the technical backbone for rigging, animation, and real-time behavior after the earlier implementation path was not working.", "Together, their work connected the physical coloring activity to animated virtual masks children could see and wear on screen."],
    proof: ["The delivered experience combined physical coloring, scanning, animation, and camera-based virtual-mask play.", "The retail package presents the complete physical-to-digital interaction.", "Stone adapted the character artwork for interactive use while Bradd created the rigging, animation, and real-time behavior system."],
    relevance: "Stone protects visual continuity while Bradd builds the system that lets the idea behave in a new medium.",
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
    image: "case-ultimate-rivals-restored.webp",
    imagePosition: "center",
    alt: "Ultimate Rivals ice rink game artwork",
    statement: "One sports universe. Every league in play.",
    brief: "Translate a rare multi-league licensing opportunity into an ownable game universe, then make the idea tangible enough for partners, investors, and players to feel it.",
    moves: ["Defined the creative and gameplay vision across franchise, product, and pitch surfaces.", "Built playable controller prototypes for an executive working session with Apple.", "Aligned an expanding distributed team around a shared game-feel target."],
    proof: ["The product organized athletes from multiple professional leagues inside one game universe rather than treating each license as a separate experience.", "Bradd built playable controller prototypes used to make the product vision tangible in executive working sessions.", "Bradd helped the wider team secure $40M in funding while the company scaled from four to 55+ full-time staff."],
    relevance: "Bradd connected an unusually complex licensing premise to a playable product, an executive narrative, and the team structure required to pursue it.",
  },
  {
    id: "chaotic",
    title: "Chaotic",
    owner: "Stone",
    role: "Franchise Art Direction",
    eyebrow: "A world built to travel",
    image: "case-chaotic-restored.webp",
    imagePosition: "center",
    alt: "Chaotic fantasy trading card artwork",
    statement: "A franchise language players can watch, play, and collect.",
    brief: "Create a coherent visual world that could hold together across television, a trading card game, digital play, packaging, and licensed merchandise.",
    moves: ["Established the art-direction language and systems for a growing transmedia property.", "Directed global contributors across illustration, animation, product, and marketing.", "Protected continuity while adapting the world to radically different formats."],
    proof: ["The same visual language supported the trading card game, animated series, online game, packaging, merchandise, toys, and clothing.", "Stone directed contributor networks ranging from roughly 40 to more than 200 people around shared visual standards.", "The result was a franchise-wide system rather than unrelated art direction for each format."],
    relevance: "Stone built the visual grammar that kept many teams, vendors, and product categories aligned around one recognizable property.",
  },
  {
    id: "disney",
    title: "Disney Enchanted Tales",
    owner: "Bradd",
    role: "Pipeline + Creative Leadership",
    eyebrow: "Story at production scale",
    image: "case-disney-restored.webp",
    imagePosition: "center",
    alt: "Disney Enchanted Tales character artwork",
    statement: "A beloved world needs a production system worthy of it.",
    brief: "Increase the velocity and consistency of a character-heavy Disney experience without flattening the personality that makes the IP matter.",
    moves: ["Redesigned the art and animation pipeline around clearer handoffs and reusable systems.", "Connected creative standards directly to technical constraints and team practice.", "Built a structure that let artists spend more time on performance and less on repetition."],
    proof: ["Bradd's pipeline redesign made animation production roughly 60% faster.", "The production system supported more than 200 minutes of animation and more than 60 character rigs.", "Reusable handoffs and technical standards shifted artist time away from repeated setup and toward character performance."],
    relevance: "Bradd made consistent character performance achievable at content scale by joining creative standards to a faster, reusable production system.",
  },
  {
    id: "warner",
    title: "Warner Bros. + DC",
    owner: "Stone",
    role: "Licensed-Product Art Direction",
    eyebrow: "Icons, many expressions",
    image: "case-warner-restored.webp",
    imagePosition: "center",
    alt: "DC Comics character style and product artwork",
    statement: "Make heritage IP feel current without losing its center.",
    brief: "Create adaptable style systems for globally recognized characters across trading cards, collectibles, animation art, and consumer products.",
    moves: ["Built modular visual languages that remain recognizable across artists and formats.", "Balanced licensor stewardship, audience expectations, and product-level originality.", "Guided art from early direction through production-ready execution."],
    proof: ["Stone built DC character-style and production-art systems for licensed products.", "The work spans trading cards, collectibles, animation art, and consumer-product applications.", "His direction connected early visual development to production-ready art across each format."],
    relevance: "Stone keeps heritage characters recognizable while giving each product enough visual flexibility to feel current and desirable.",
  },
  {
    id: "emerging",
    title: "Emerging Production",
    owner: "Bradd",
    role: "Technical + Creative Direction",
    eyebrow: "New tools, responsible leverage",
    image: "case-neighbor-restored.webp",
    imagePosition: "center",
    alt: "Secret Neighbor Roblox Edition key artwork",
    statement: "Use new technology to expand taste, not replace it.",
    brief: "Build practical, rights-cleared production approaches for Roblox-scale content and other fast-moving formats while protecting the human judgment at the center of the work.",
    moves: ["Designed production systems that connect creative intent, tool choice, and legal clarity.", "Mentored cross-disciplinary teams through unfamiliar technical and aesthetic territory.", "Turned experiments into repeatable workflows instead of isolated demos."],
    proof: ["The new workflow more than doubled contributor output.", "The system connected tool choice to explicit rights and production rules instead of treating experimentation as a legal or creative exception.", "Bradd used the workflow to enable a distributed team rather than keeping the new capability inside a small specialist group."],
    relevance: "Bradd evaluates emerging production tools through quality, rights, repeatability, and team adoption, then turns the strongest approach into a usable team system.",
  },
  {
    id: "court",
    title: "Court of the Dead",
    owner: "Stone",
    role: "Worldbuilding + Art Direction",
    eyebrow: "From mythology to play",
    image: "case-court-restored.webp",
    imagePosition: "center",
    alt: "Court of the Dead fantasy character artwork",
    statement: "Build the rules of a world before multiplying its surfaces.",
    brief: "Evolve an original mythology into a durable creative system spanning premium collectibles, comics, books, and the Mourners Call tabletop game.",
    moves: ["Developed visual and narrative systems that gave collaborators a common compass.", "Created design-bible foundations for characters, factions, environments, and products.", "Carried a premium collectible sensibility into story-rich and playable formats."],
    proof: ["Stone contributed conceptual design and worldbuilding to an original mythology rather than adapting an established licensed property.", "The visual system supported premium collectibles, comics, books, and other publishing surfaces.", "Mourners Call carried the same world into a credited tabletop-game expression."],
    relevance: "Stone defined the visual and narrative structure that moved an original world from premium objects into story and play without losing its center.",
  },
];

export const partners: Partner[] = [
  { name: "Apple", category: "Platform", owner: "Joint", relationship: "Prototype + shipped platform title", note: "Bradd built controller-ready product prototypes for executive working sessions; Bradd and Stone later led complementary production and visual work on Tetris Beat for Apple Arcade." },
  { name: "Tetris", category: "Franchise", owner: "Joint", relationship: "Shipped game leadership", note: "On Tetris Beat, Stone established the visual language while Bradd helped rebuild the technical and production framework used by the wider team to carry the game to release." },
  { name: "Disney", category: "Entertainment", owner: "Bradd", relationship: "Technical art + production systems", note: "Bradd led technical-art, animation, and outsource-production systems for character-heavy Disney work, including a pipeline redesign that made animation production roughly 60% faster." },
  { name: "Warner Bros. / DC", category: "Franchise", owner: "Stone", relationship: "Licensed-product art direction", note: "Stone developed adaptable character-style and production-art systems used across trading cards, collectibles, animation art, and consumer-product contexts." },
  { name: "Roblox", category: "Platform", owner: "Bradd", relationship: "Technical art direction", note: "Bradd served as Technical Art Director on Saw X: Survive the Obby and Secret Neighbor: Roblox Edition." },
  { name: "Crayola", category: "Product", owner: "Joint", relationship: "Interactive contract engagement", note: "Stone adapted supplied character assets and Bradd built the rigging, animation, and real-time system that connected physical coloring to animated, wearable virtual masks." },
  { name: "Toyota", category: "Product", owner: "Stone", relationship: "Brand identity + visual direction", note: "Stone led Toyota Trucks identity and visual direction for North America." },
  { name: "Nickelodeon / SpongeBob", category: "Franchise", owner: "Stone", relationship: "Licensed toy production", note: "Stone directed character-driven toy and licensed-product work for SpongeBob and Nickelodeon." },
  { name: "Sideshow", category: "Product", owner: "Stone", relationship: "Original world + premium collectibles", note: "Stone contributed conceptual design and worldbuilding to Court of the Dead, which expanded across premium collectibles, publishing, and the credited Mourners Call tabletop game." },
  { name: "Ultimate Rivals", category: "Entertainment", owner: "Bradd", relationship: "Creative + game direction", note: "Bradd shaped the multi-league product vision, built playable controller prototypes, and aligned product, pitch, and team development around one sports-game universe." },
  { name: "Sound Games", category: "Product", owner: "Bradd", relationship: "Product narrative + funding materials", note: "Bradd authored pitch and narrative materials for two successful seed rounds totaling more than $7M." },
  { name: "Bit Fry", category: "Entertainment", owner: "Bradd", relationship: "Product + organizational leadership", note: "Bradd helped scale the company from four to 55+ full-time staff, plus roughly 30 external vendors, while shaping the product vision and helping secure $40M in funding." },
];

export const depthTimeline = [
  {
    bradd: { label: "PLAYABLE PROOF", value: "15+ years", note: "Games, entertainment, and interactive products" },
    stone: { label: "INDUSTRY DEPTH", value: "28 years", note: "Games, comics, collectibles, and animation" },
  },
  {
    bradd: { label: "TEAM SYSTEMS", value: "4 → 55+", note: "Plus roughly 30 external vendors" },
    stone: { label: "GLOBAL DIRECTION", value: "40 → 200+", note: "Contributors aligned around one visual grammar" },
  },
  {
    bradd: { label: "BUSINESS MOMENTUM", value: "$50,000,000+", note: "Across multiple funding rounds and Personal Pitches" },
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
    kicker: "Stone · Card-game direction",
    statement: "An established fantasy property still needs a clear collectible hierarchy on every card-sized surface.",
    brief: "Stone directed card-game artwork for RAID, bringing recognizable fantasy characters into a repeatable collectible system with clarity, impact, and a consistent visual hierarchy.",
    moves: [
      "Applied card-game art-direction judgment to recognizable fantasy characters inside a repeatable collectible format.",
      "Balanced high-impact character presentation with the hierarchy and consistency a multi-card system requires.",
      "Connected character illustration, card framing, and information hierarchy across the collectible system.",
    ],
    proof: [
      "Stone led card-game direction for the displayed RAID artwork.",
      "The work combines high-impact fantasy characters with the structure and consistency of a multi-card system.",
      "His Chaotic direction applies the same collectible-system judgment across an entire transmedia franchise.",
    ],
    relevance: "Stone brings established fantasy properties the clarity, impact, and collectible appeal a card system needs.",
  },
  {
    id: "toyota-trucks-identity",
    label: "TOYOTA",
    note: "Stone · North American identity",
    image: "stone-toyota-hires.webp",
    position: "center",
    fit: "contain",
    title: "Toyota Trucks Identity",
    kicker: "Stone · Brand identity direction",
    statement: "A product-line identity has to feel specific while remaining unmistakably part of a global brand.",
    brief: "Stone led Toyota Trucks identity and visual direction for North America, giving the product line a distinct visual expression inside an established global brand.",
    moves: [
      "Directed the identity and visual language for Toyota Trucks in North America.",
      "Gave the truck product line a coherent visual expression inside the established global marque.",
      "Connected product imagery and graphic language as one recognizable brand presentation rather than a set of unrelated assets.",
    ],
    proof: [
      "Stone led the identity and visual direction represented by the displayed Toyota Trucks work.",
      "The system combines product imagery, typography, and graphic language for the North American truck line.",
      "The result gives a specific product category its own character while remaining unmistakably Toyota.",
    ],
    relevance: "Stone's system thinking gives mature consumer brands product specificity while preserving recognition and stewardship.",
  },
  {
    id: "saw-x-roblox",
    label: "SAW X",
    note: "Bradd · Roblox technical art direction",
    image: "saw-hires.webp",
    position: "center",
    title: "Saw X: Survive the Obby",
    kicker: "Bradd · Roblox technical art direction",
    statement: "A recognizable horror property had to become a playable Roblox experience inside real platform constraints.",
    brief: "Bradd served as Technical Art Director on Saw X: Survive the Obby, translating a recognizable horror property into a playable Roblox experience within the platform's production constraints.",
    moves: [
      "Led technical-art direction within the Roblox experience, connecting the licensed visual target to platform production realities.",
      "Helped translate recognizable franchise material into an interactive brand surface rather than a static adaptation.",
      "Built a production path that carried the licensed visual target through a real-time platform and a shipped experience.",
    ],
    proof: [
      "Bradd served as Technical Art Director on Saw X: Survive the Obby.",
      "The shipped Roblox experience translated the franchise's recognizable horror language into interactive play.",
      "Bradd also served as Technical Art Director on Secret Neighbor: Roblox Edition.",
    ],
    relevance: "Bradd operates where IP stewardship, real-time art, platform constraints, and a shipped interactive expression have to be solved together.",
  },
];
