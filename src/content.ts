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
};

export type Insight = {
  id: string;
  title: string;
  kicker: string;
  statement: string;
  brief: string;
  moves: string[];
  proof: string[];
};

export type Partner = {
  name: string;
  category: "Platform" | "Franchise" | "Product" | "Entertainment";
  note: string;
};

export const capabilityInsights: Insight[] = [
  {
    id: "ip-stewardship",
    title: "IP Stewardship",
    kicker: "Protect the center. Expand the edges.",
    statement: "We identify what audiences cannot afford to lose—then create room for everything the property can become.",
    brief: "Strong stewardship is not preservation by inertia. It is a clear set of creative rules that lets teams move faster while keeping character, tone, canon, and audience trust intact.",
    moves: ["Define the non-negotiable emotional promise", "Translate canon into practical creative guardrails", "Align licensors, makers, and commercial stakeholders"],
    proof: ["Tetris", "Disney", "Warner Bros. / DC", "Nickelodeon"],
  },
  {
    id: "game-design",
    title: "Game Design",
    kicker: "Make the promise playable.",
    statement: "The interaction should express the world—not merely sit inside it.",
    brief: "We move from audience fantasy to core loop, game feel, progression, and prototype. The goal is a product people understand with their hands before anyone has to explain it.",
    moves: ["Prototype the defining player fantasy", "Tune feedback, rhythm, onboarding, and accessibility", "Connect systems to retention without weakening the premise"],
    proof: ["Ultimate Rivals", "Tetris Beat", "Roblox", "Tabletop systems"],
  },
  {
    id: "visual-systems",
    title: "Visual Systems",
    kicker: "Give the world a grammar.",
    statement: "A great visual language remains recognizable across artists, formats, and years.",
    brief: "We build systems—not isolated key art—so every UI state, card, collectible, environment, and marketing surface feels like it belongs to the same world.",
    moves: ["Establish shape, color, material, and motion logic", "Build modular templates for many contributors", "Create review standards that protect quality at scale"],
    proof: ["Chaotic", "Batman: The Animated Series", "Court of the Dead", "Tetris Beat"],
  },
  {
    id: "product-strategy",
    title: "Product Strategy",
    kicker: "Connect creative ambition to durable value.",
    statement: "We help the strongest idea survive contact with schedule, platform, licensing, and market reality.",
    brief: "That means shaping the pitch, sequencing the product, defining the content architecture, and choosing where to invest so a launch can become an expandable business.",
    moves: ["Clarify the audience and commercial thesis", "Map one IP across physical and digital surfaces", "Build credible production and investment narratives"],
    proof: ["Two funding rounds", "$40M+ investment narrative", "Multi-league licensing", "Live-ops planning"],
  },
  {
    id: "team-building",
    title: "Team Building",
    kicker: "Build the team around the problem.",
    statement: "Creative leadership becomes real in the decisions a team can make without waiting for permission.",
    brief: "We create shared language, useful constraints, healthy critique, and production clarity across art, design, engineering, brand, and external partners.",
    moves: ["Align disciplines around one visible quality target", "Mentor leads and remove structural friction", "Scale culture and process with the work"],
    proof: ["Teams from 5 to 80", "Global art teams of 40–200+", "Teaching + mentorship", "At-risk production recovery"],
  },
];

export const leaderInsights: Record<"bradd" | "stone", Insight> = {
  bradd: {
    id: "bradd-profile",
    title: "Bradd McBrearty",
    kicker: "Creative Director · Game + Product Leadership",
    statement: "He builds the bridge between an ambitious idea and the team, technology, and product logic required to ship it.",
    brief: "Bradd combines creative direction, game design, technical fluency, production recovery, product strategy, and executive communication—especially where a project needs a credible path through uncertainty.",
    moves: ["Turn audience fantasy into a playable product thesis", "Connect creative standards to practical production systems", "Build teams and investment narratives around visible proof"],
    proof: ["15+ years across games and entertainment", "Teams from 5 to 80", "Two successful funding rounds", "MFA-level teaching + mentorship"],
  },
  stone: {
    id: "stone-profile",
    title: "Stone Perales",
    kicker: "Art Director · Worlds + Franchise Systems",
    statement: "He gives worlds a visual grammar strong enough to survive the jump from screen to shelf to play.",
    brief: "Stone brings franchise art direction, collectible instincts, worldbuilding, licensed-product stewardship, and the ability to align large creative networks around a distinctive, repeatable visual standard.",
    moves: ["Find the visual idea audiences recognize instantly", "Translate that idea across cards, games, animation, and product", "Direct contributors without diluting voice or quality"],
    proof: ["Original and licensed franchise systems", "Global teams from 40 to 200+", "Concept-through-production leadership", "Teaching + portfolio mentorship"],
  },
};

export const rangeInsights: Insight[] = [
  {
    id: "play",
    title: "Play",
    kicker: "Story becomes agency.",
    statement: "We turn the premise of an IP into decisions, feedback, rhythm, and mastery.",
    brief: "From controller prototypes to tabletop loops, the work begins with the feeling the audience came to inhabit—and the repeatable interaction that can deliver it.",
    moves: ["Core loops and rapid prototypes", "Game feel, feedback, and technical direction", "Progression, live content, and player clarity"],
    proof: ["Ultimate Rivals", "Tetris Beat", "Roblox", "Mourners Call"],
  },
  {
    id: "collect",
    title: "Collect",
    kicker: "Desire becomes an object.",
    statement: "A collectible is concentrated worldbuilding—identity, story, scarcity, and craft in one surface.",
    brief: "We understand the system behind the object: visual hierarchy, variant logic, packaging, material cues, character appeal, and the ritual of discovery.",
    moves: ["Trading-card and variant systems", "Premium collectibles and packaging", "Physical-to-digital product expression"],
    proof: ["Chaotic TCG", "RAID", "WB / DC", "Court of the Dead"],
  },
  {
    id: "grow",
    title: "Grow",
    kicker: "One launch becomes a world.",
    statement: "We design the creative operating system that lets an IP expand without becoming generic.",
    brief: "Franchise logic, pipelines, design bibles, content architecture, and team development create the conditions for growth across products and generations.",
    moves: ["Franchise and style-guide systems", "Scalable art and production pipelines", "Talent development and partner alignment"],
    proof: ["Disney pipeline +60%", "Chaotic transmedia system", "Tetris Beat live levels", "Global production teams"],
  },
];

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
    proof: ["Multi-league IP system", "$40M+ studio investment narrative", "Team scaled from 4 to 55+"],
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
    proof: ["TCG + animation + games", "40–200+ global contributors", "Franchise-wide visual system"],
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
    proof: ["60% pipeline acceleration", "200+ minutes of animation", "60+ character rigs"],
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
    proof: ["Batman + Harley Quinn", "Looney Tunes + Scooby-Doo", "Cards + collectibles + cel art"],
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
    proof: ["2×+ output in tested workflows", "Rights-cleared approach", "Global team enablement"],
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
    proof: ["Original IP development", "Premium collectibles + publishing", "Tabletop world expansion"],
  },
];

export const partners: Partner[] = [
  { name: "Apple", category: "Platform", note: "Executive prototypes and an Apple Arcade launch." },
  { name: "Tetris", category: "Franchise", note: "A shipped rhythm-game visual and production system." },
  { name: "Disney", category: "Entertainment", note: "Character pipelines and production leadership at story scale." },
  { name: "Warner Bros.", category: "Entertainment", note: "Licensed visual systems across globally recognized characters." },
  { name: "DC", category: "Franchise", note: "Trading cards, collectibles, and character art direction." },
  { name: "PlayStation", category: "Platform", note: "Console products and platform-facing creative work." },
  { name: "Xbox", category: "Platform", note: "Console products and platform-facing creative work." },
  { name: "Roblox", category: "Platform", note: "Fast-moving interactive production and responsible new workflows." },
  { name: "EA", category: "Entertainment", note: "Games and entertainment production experience." },
  { name: "Crayola", category: "Product", note: "A physical-to-digital play experience with 250+ masks." },
  { name: "Toyota", category: "Product", note: "North American brand identity and visual direction." },
  { name: "Nickelodeon", category: "Entertainment", note: "Character-driven entertainment and licensed worlds." },
  { name: "SpongeBob", category: "Franchise", note: "Audience-first stewardship of a globally loved character world." },
  { name: "Niantic", category: "Platform", note: "Location-aware and emerging interactive ecosystems." },
  { name: "Sideshow", category: "Product", note: "Premium collectibles and original worldbuilding." },
];

export const depthTimeline = [
  {
    bradd: { label: "PLAYABLE PROOF", value: "15+ years", note: "Games, entertainment, and interactive products" },
    stone: { label: "VISUAL WORLDS", value: "Original + licensed", note: "Franchise systems across screens and shelves" },
  },
  {
    bradd: { label: "TEAM SYSTEMS", value: "5 → 80", note: "Creative, technical, and production leadership" },
    stone: { label: "GLOBAL DIRECTION", value: "40 → 200+", note: "Contributors aligned around one visual grammar" },
  },
  {
    bradd: { label: "BUSINESS MOMENTUM", value: "2 rounds", note: "Successful funding rounds closed" },
    stone: { label: "FORMAT RANGE", value: "Screen → shelf → play", note: "Cards, collectibles, animation, games, and brand" },
  },
];

export const supportingProof = [
  { label: "RAID", note: "Stone · card game direction", image: "stone-raid-hires.webp", position: "center 52%" },
  { label: "TOYOTA", note: "Stone · North American identity", image: "stone-toyota-hires.webp", position: "center", fit: "contain" },
  { label: "SAW X", note: "Bradd · playable brand experience", image: "saw-hires.webp", position: "center" },
];
