import { useEffect, useRef, useState, type PointerEvent } from "react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const media = (file: string) => `${basePath}/media/${file}`;

type CaseStudy = {
  id: string;
  title: string;
  owner: string;
  eyebrow: string;
  image: string;
  imagePosition?: string;
  alt: string;
  statement: string;
  brief: string;
  moves: string[];
  proof: string[];
};

const caseStudies: CaseStudy[] = [
  {
    id: "ultimate-rivals",
    title: "Ultimate Rivals",
    owner: "Bradd · Creative + Game Direction",
    eyebrow: "League-spanning play",
    image: "bradd-rink.jpg",
    alt: "Ultimate Rivals ice rink game artwork",
    statement: "One sports universe. Every league in play.",
    brief:
      "Translate a rare multi-league licensing opportunity into an ownable game universe—then make the idea tangible enough for partners, investors, and players to feel it.",
    moves: [
      "Defined the creative and gameplay vision across franchise, product, and pitch surfaces.",
      "Built playable controller prototypes for an executive working session with Apple.",
      "Aligned an expanding distributed team around a shared game-feel target.",
    ],
    proof: ["Multi-league IP system", "$40M+ studio investment narrative", "Team scaled from 4 to 55+"],
  },
  {
    id: "disney",
    title: "Disney Enchanted Tales",
    owner: "Bradd · Pipeline + Creative Leadership",
    eyebrow: "Story at production scale",
    image: "bradd-disney.jpg",
    alt: "Disney Enchanted Tales character animation production image",
    statement: "A beloved world needs a production system worthy of it.",
    brief:
      "Increase the velocity and consistency of a character-heavy Disney experience without flattening the personality that makes the IP matter.",
    moves: [
      "Redesigned the art and animation pipeline around clearer handoffs and reusable systems.",
      "Connected creative standards directly to technical constraints and team practice.",
      "Built a structure that let artists spend more time on performance and less on repetition.",
    ],
    proof: ["60% pipeline acceleration", "200+ minutes of animation", "60+ character rigs"],
  },
  {
    id: "emerging",
    title: "Emerging Production",
    owner: "Bradd · Technical + Creative Direction",
    eyebrow: "New tools, responsible leverage",
    image: "bradd-neighbor.jpg",
    alt: "Stylized game character artwork from Secret Neighbor",
    statement: "Use new technology to expand taste—not replace it.",
    brief:
      "Build practical, rights-cleared production approaches for Roblox-scale content and other fast-moving formats while protecting the human judgment at the center of the work.",
    moves: [
      "Designed production systems that connect creative intent, tool choice, and legal clarity.",
      "Mentored cross-disciplinary teams through unfamiliar technical and aesthetic territory.",
      "Turned experiments into repeatable workflows instead of isolated demos.",
    ],
    proof: ["2×+ output in tested workflows", "Rights-cleared approach", "Global team enablement"],
  },
  {
    id: "chaotic",
    title: "Chaotic",
    owner: "Stone · Franchise Art Direction",
    eyebrow: "A world built to travel",
    image: "stone-chaotic.jpg",
    alt: "Chaotic fantasy trading card artwork",
    statement: "A franchise language players can watch, play, and collect.",
    brief:
      "Create a coherent visual world that could hold together across television, a trading card game, digital play, packaging, and licensed merchandise.",
    moves: [
      "Established the art-direction language and systems for a growing transmedia property.",
      "Directed global contributors across illustration, animation, product, and marketing.",
      "Protected continuity while adapting the world to radically different formats.",
    ],
    proof: ["TCG + animation + games", "40–200+ global contributors", "Franchise-wide visual system"],
  },
  {
    id: "warner",
    title: "Warner Bros. + DC",
    owner: "Stone · Licensed-Product Art Direction",
    eyebrow: "Icons, many expressions",
    image: "stone-wb-dc.webp",
    alt: "DC Comics character style and product artwork",
    statement: "Make heritage IP feel current without losing its center.",
    brief:
      "Create adaptable style systems for globally recognized characters across trading cards, collectibles, animation art, and consumer products.",
    moves: [
      "Built modular visual languages that remain recognizable across artists and formats.",
      "Balanced licensor stewardship, audience expectations, and product-level originality.",
      "Guided art from early direction through production-ready execution.",
    ],
    proof: ["Batman + Harley Quinn", "Looney Tunes + Scooby-Doo", "Cards + collectibles + cel art"],
  },
  {
    id: "court",
    title: "Court of the Dead",
    owner: "Stone · Worldbuilding + Art Direction",
    eyebrow: "From mythology to play",
    image: "stone-court.jpg",
    alt: "Court of the Dead fantasy character artwork",
    statement: "Build the rules of a world before multiplying its surfaces.",
    brief:
      "Evolve an original mythology into a durable creative system spanning premium collectibles, comics, books, and the Mourners Call tabletop game.",
    moves: [
      "Developed visual and narrative systems that gave collaborators a common compass.",
      "Created design-bible foundations for characters, factions, environments, and products.",
      "Carried a premium collectible sensibility into story-rich and playable formats.",
    ],
    proof: ["Original IP development", "Premium collectibles + publishing", "Tabletop world expansion"],
  },
];

const supportingProof = [
  { label: "RAID", note: "Card game direction", image: "stone-raid.jpg" },
  { label: "TOYOTA", note: "North American identity", image: "stone-toyota.jpg" },
  { label: "SAW X", note: "Playable brand experience", image: "bradd-saw.jpg" },
];

function FoilCard({ study, onOpen }: { study: CaseStudy; onOpen: () => void }) {
  const handlePointer = (event: PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <button
      className="case-card"
      type="button"
      onPointerMove={handlePointer}
      onClick={onOpen}
      aria-label={`Explore ${study.title} case study`}
    >
      <img
        src={media(study.image)}
        alt={study.alt}
        loading="lazy"
        style={{ objectPosition: study.imagePosition ?? "center" }}
      />
      <span className="case-wash" aria-hidden="true" />
      <span className="case-content">
        <span className="case-owner">{study.owner}</span>
        <strong>{study.title}</strong>
        <span className="case-statement">{study.statement}</span>
        <span className="case-open">Explore case <b aria-hidden="true">↗</b></span>
      </span>
    </button>
  );
}

export default function App() {
  const [activeStudy, setActiveStudy] = useState<CaseStudy | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const updateProgress = () => {
      const available = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(available > 0 ? (window.scrollY / available) * 100 : 0);
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  useEffect(() => {
    if (!activeStudy) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveStudy(null);
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKeyDown);
    closeButton.current?.focus();
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKeyDown);
      lastTrigger.current?.focus();
    };
  }, [activeStudy]);

  const openStudy = (study: CaseStudy) => {
    lastTrigger.current = document.activeElement as HTMLElement;
    setActiveStudy(study);
  };

  return (
    <>
      <div className="ambient" aria-hidden="true" />
      <div className="scroll-progress" aria-hidden="true">
        <span style={{ width: `${scrollProgress}%` }} />
      </div>

      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Bradd and Stone, back to top">
          B<span>+</span>S
        </a>
        <p>Creative leadership for games, brands &amp; entertainment</p>
        <a className="top-cta" href="#contact">Build what&apos;s next ↘</a>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero-orbit" aria-hidden="true">
            <span />
          </div>
          <p className="eyebrow">Two disciplines. One leadership system.</p>
          <h1>
            We turn IP into worlds people can <em>play, collect, and grow.</em>
          </h1>
          <div className="hero-footer">
            <p>
              Creative direction, art direction, game systems, and franchise thinking—
              built to move from first idea to market-ready experience.
            </p>
            <a className="text-link" href="#team">
              Meet the partnership <span aria-hidden="true">↘</span>
            </a>
          </div>
          <div className="signal-strip" aria-label="Selected capabilities">
            <span>IP stewardship</span><span>Game design</span><span>Visual systems</span>
            <span>Product strategy</span><span>Team building</span>
          </div>
        </section>

        <section className="team-section" id="team">
          <div className="section-intro">
            <p className="section-index">01 / The partnership</p>
            <h2>Vision with a way through.</h2>
            <p>
              Stone makes a world coherent, ownable, and unmistakable. Bradd makes it
              playable, scalable, and commercially real.
            </p>
          </div>

          <div className="leader-grid">
            <article className="leader-card leader-bradd">
              <div className="portrait-wrap">
                <img src={media("bradd.jpg")} alt="Bradd McBrearty" />
                <div className="portrait-sheen" aria-hidden="true" />
              </div>
              <div className="leader-copy">
                <p className="leader-role">Creative Director</p>
                <h3>Bradd McBrearty</h3>
                <p>Game design · Product strategy · Technical direction · Production systems</p>
              </div>
            </article>

            <div className="plus-mark" aria-hidden="true"><span>+</span></div>

            <article className="leader-card leader-stone">
              <div className="portrait-wrap">
                <img src={media("stone.jpg")} alt="Stone Perales" />
                <div className="portrait-sheen" aria-hidden="true" />
              </div>
              <div className="leader-copy">
                <p className="leader-role">Art Director</p>
                <h3>Stone Perales</h3>
                <p>Worldbuilding · Visual identity · Franchise systems · Licensed products</p>
              </div>
            </article>
          </div>

          <div className="partnership-line">
            <p>Different lenses.</p><i aria-hidden="true" /><p>Shared standards.</p><i aria-hidden="true" />
            <p>One accountable team.</p>
          </div>
        </section>

        <section className="proof-section" id="proof">
          <div className="proof-visual" aria-hidden="true">
            <div className="proof-image proof-image-a"><img src={media("bradd-tetris.jpg")} alt="" /></div>
            <div className="proof-image proof-image-b"><img src={media("stone-tetris.webp")} alt="" /></div>
            <div className="foil-plane" />
            <span className="proof-stamp">SHIPPED<br />TOGETHER</span>
          </div>
          <div className="proof-copy">
            <p className="section-index">02 / Proven together</p>
            <p className="project-kicker">Apple Arcade · Tetris Beat</p>
            <h2>Not two résumés. One shipped result.</h2>
            <p>
              An at-risk production needed one coherent creative and production system.
              Stone established its visual language and led the art vision. Bradd rebuilt
              the technical framework and production path. Together with the wider team,
              they turned fragmented work into a scalable, released game.
            </p>
            <dl className="metric-row">
              <div><dt>5 days</dt><dd>to reset the production framework</dd></div>
              <div><dt>20+</dt><dd>artists aligned to one visual system</dd></div>
              <div><dt>28</dt><dd>live levels delivered after launch</dd></div>
            </dl>
            <p className="proof-footnote">
              Shipped eight months later and ranked near the top of Apple Arcade for weeks.
            </p>
          </div>
        </section>

        <section className="range-section" id="range">
          <div className="range-head">
            <p className="section-index">03 / Built for the whole ecosystem</p>
            <h2>One idea.<br /><em>Every surface.</em></h2>
          </div>
          <div className="range-grid">
            <article><span>01</span><h3>Play</h3><p>Game loops, interaction, technical frameworks, and the systems that turn story into agency.</p></article>
            <article><span>02</span><h3>Collect</h3><p>Cards, premium objects, characters, packaging, and visual languages people want to own.</p></article>
            <article><span>03</span><h3>Grow</h3><p>Franchise logic, product strategy, pipelines, and teams built to carry an IP beyond one launch.</p></article>
          </div>
          <p className="range-note">We connect the emotional promise of a world to the practical system that lets it expand.</p>
        </section>

        <section className="work-section" id="work">
          <div className="work-head">
            <div>
              <p className="section-index">04 / Selected case files</p>
              <h2>Range is the proof.</h2>
            </div>
            <p>Six worlds. Six different constraints. One consistent instinct: find the defining idea, then build the system that protects it.</p>
          </div>
          <div className="case-grid">
            {caseStudies.map((study) => (
              <FoilCard key={study.id} study={study} onOpen={() => openStudy(study)} />
            ))}
          </div>
        </section>

        <section className="collab-section" id="collaboration">
          <div className="collab-art" aria-hidden="true">
            <span className="mask mask-a" /><span className="mask mask-b" />
            <span className="mask mask-c" /><span className="color-field" />
          </div>
          <div className="collab-copy">
            <p className="section-index">05 / Physical becomes interactive</p>
            <p className="project-kicker">Crayola Color Alive · Funny Faces—Crazy Costumes</p>
            <h2>When the obvious route did not work, we made a new one.</h2>
            <p>
              For this contract engagement, Stone translated supplied character assets into
              an interactive-ready art system. Bradd built the technical backbone for rigging,
              animation, and real-time behavior. Physical coloring became a playful app
              experience with more than 250 virtual masks.
            </p>
            <div className="role-pair">
              <p><b>STONE</b> art adaptation + visual continuity</p>
              <p><b>BRADD</b> technical implementation + animation systems</p>
            </div>
          </div>
        </section>

        <section className="depth-section" id="depth">
          <div className="depth-head">
            <p className="section-index">06 / Individual depth</p>
            <h2>Deep craft.<br />Executive altitude.</h2>
          </div>

          <div className="profile-block bradd-block">
            <div className="profile-name">
              <span>Creative Director</span><h3>BRADD</h3>
            </div>
            <div className="profile-thesis">
              <p>He builds the bridge between an ambitious idea and the team, technology, and product logic required to ship it.</p>
              <ul><li>15+ years across games and entertainment</li><li>Teams from 5 to 80</li><li>Two successful funding rounds closed</li></ul>
            </div>
            <div className="profile-image"><img src={media("bradd-saw.jpg")} alt="Saw X playable brand experience artwork" loading="lazy" /></div>
          </div>

          <div className="profile-block stone-block">
            <div className="profile-name">
              <span>Art Director</span><h3>STONE</h3>
            </div>
            <div className="profile-thesis">
              <p>He gives worlds a visual grammar—one strong enough to survive the jump from screen to shelf to play.</p>
              <ul><li>Franchise systems across original and licensed IP</li><li>Global teams from 40 to 200+</li><li>Visual leadership from concept through production</li></ul>
            </div>
            <div className="profile-image"><img src={media("stone-wb-dc.webp")} alt="Licensed DC character art direction" loading="lazy" /></div>
          </div>

          <div className="supporting-grid" aria-label="Additional selected projects">
            {supportingProof.map((item) => (
              <article key={item.label}>
                <img src={media(item.image)} alt="" loading="lazy" />
                <div><strong>{item.label}</strong><span>{item.note}</span></div>
              </article>
            ))}
          </div>
        </section>

        <section className="mentorship-section" id="mentorship">
          <div className="mentorship-kicker">
            <p className="section-index">07 / The work after the work</p>
            <span aria-hidden="true">∞</span>
          </div>
          <div className="mentorship-copy">
            <h2>We build people who build worlds.</h2>
            <p className="mentorship-lede">
              Teaching keeps our point of view moving. Parenthood keeps the stakes human.
              Mentorship makes both visible in the way we lead.
            </p>
            <div className="mentor-columns">
              <article>
                <h3>BRADD / THE SYSTEM</h3>
                <p>MFA-level teaching, curriculum design, and years developing artists, designers, and technical leaders inside production teams.</p>
              </article>
              <article>
                <h3>STONE / THE PRACTICE</h3>
                <p>Guest lectures, talks, mock interviews, and portfolio reviews that help emerging creators turn raw voice into professional momentum.</p>
              </article>
            </div>
            <blockquote>“The next generation is not an audience we speculate about. It is one we teach, mentor, raise, and listen to.”</blockquote>
          </div>
        </section>

        <section className="contact-section" id="contact">
          <p className="section-index">08 / A new world starts with a conversation</p>
          <h2>Let&apos;s build<br /><em>what&apos;s next.</em></h2>
          <p>Bring us the property, the possibility, or the production problem that deserves a stronger creative system.</p>
          <div className="contact-actions">
            <a className="primary-action" href="mailto:bradd.mcbrearty@gmail.com">Start a conversation <span>↗</span></a>
            <div className="social-actions">
              <a href="https://www.linkedin.com/in/braddmcbrearty/" target="_blank" rel="noreferrer">Bradd on LinkedIn ↗</a>
              <a href="https://www.linkedin.com/in/stone/" target="_blank" rel="noreferrer">Stone on LinkedIn ↗</a>
            </div>
          </div>
          <footer><span>BRADD + STONE</span><span>Creative leadership for games, brands &amp; entertainment</span><span>2026</span></footer>
        </section>
      </main>

      {activeStudy && (
        <div className="case-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveStudy(null); }}>
          <article className="case-dialog" role="dialog" aria-modal="true" aria-labelledby="case-title">
            <button ref={closeButton} className="dialog-close" type="button" onClick={() => setActiveStudy(null)} aria-label="Close case study">Close <span>×</span></button>
            <div className="dialog-image">
              <img src={media(activeStudy.image)} alt={activeStudy.alt} />
              <span>{activeStudy.eyebrow}</span>
            </div>
            <div className="dialog-body">
              <p className="case-owner">{activeStudy.owner}</p>
              <h2 id="case-title">{activeStudy.title}</h2>
              <p className="dialog-statement">{activeStudy.statement}</p>
              <p className="dialog-brief">{activeStudy.brief}</p>
              <div className="dialog-columns">
                <div><h3>The creative moves</h3><ul>{activeStudy.moves.map((move) => <li key={move}>{move}</li>)}</ul></div>
                <div><h3>Proof in the work</h3><ul className="proof-list">{activeStudy.proof.map((proof) => <li key={proof}>{proof}</li>)}</ul></div>
              </div>
            </div>
          </article>
        </div>
      )}
    </>
  );
}
