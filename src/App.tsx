import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Copy,
  X,
} from "@phosphor-icons/react";
import { siApple, siDcentertainment, siRoblox, siToyota } from "simple-icons";
import {
  capabilityInsights,
  caseStudies,
  depthTimeline,
  jointInsights,
  leaderInsights,
  partners,
  rangeInsights,
  rangeVisuals,
  supportingProof,
  type CaseStudy,
  type Insight,
} from "./content";
import { HERO_PARAMS, heroParams, setHeroParam, type HeroParamId } from "./hero/params";
import TetrisReel from "./TetrisReel";

const HeroExperience = lazy(() => import("./hero/HeroExperience"));
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const media = (file: string) => basePath + "/media/" + file;

type Detail = (CaseStudy & { detailType: "case" }) | (Insight & { detailType: "insight" });
type RangeId = "play" | "collect" | "grow";

const slides = [
  { id: "top", label: "Superpowers combined" },
  { id: "capabilities", label: "Leadership lenses" },
  { id: "team", label: "The partnership" },
  { id: "proof", label: "Proven together" },
  { id: "range", label: "The whole ecosystem" },
  { id: "industry-proof", label: "Industry proof" },
  { id: "work", label: "Selected case files" },
  { id: "collaboration", label: "Physical to interactive" },
  { id: "depth", label: "Individual depth" },
  { id: "mentorship", label: "Leadership after launch" },
  { id: "contact", label: "Start a conversation" },
] as const;

const navItems = [
  { id: "team", index: "01", label: "The partnership" },
  { id: "proof", index: "02", label: "Proven together" },
  { id: "range", index: "03", label: "Play · Collect · Grow" },
  { id: "work", index: "05", label: "Selected case files" },
  { id: "depth", index: "07", label: "Individual depth" },
  { id: "contact", index: "09", label: "Start a conversation" },
] as const;

const proofMetrics: Insight[] = [
  {
    id: "recovery-sprint",
    title: "5-day recovery sprint",
    kicker: "Production recovery",
    statement: "A shared standard turned five days into a credible path forward.",
    brief:
      "The work was at risk because visual direction, technical implementation, and production planning were being solved as separate problems. The recovery sprint created one operating picture for the wider team.",
    moves: [
      "Stone established the visual target and song-specific guidance.",
      "Bradd connected the creative target to a unified technical framework and milestone path.",
      "The wider team rebuilt priority work against one shared definition of done.",
    ],
    proof: [
      "The wider team completed a five-day recovery sprint.",
      "The rebuilt system carried the title through release eight months later.",
      "The game remained at or near the top of Apple Arcade for more than six weeks.",
    ],
    relevance: "The sprint matters because it changed the operating system, not just one deliverable.",
  },
  {
    id: "artists-aligned",
    title: "20+ artists aligned",
    kicker: "Distributed team leadership",
    statement: "One creative and production language connected three studios.",
    brief:
      "Southern California leadership coordinated contributors in Bucharest, Romania and Guadalajara, Mexico across two continents and multiple time zones.",
    moves: [
      "Created visual and technical standards that travelled clearly between locations.",
      "Trained the Guadalajara VFX, 3D, and UI group against the rebuilt production framework.",
      "Used song-specific guidance and review rhythms to keep parallel work coherent.",
    ],
    proof: [
      "More than 20 artists participated in the recovery effort.",
      "The work connected Southern California, Bucharest, and Guadalajara.",
      "The shared system supported both launch content and later live operations.",
    ],
    relevance: "The evidence is not headcount alone. It is distributed judgment becoming consistent output.",
  },
  {
    id: "live-levels",
    title: "42 live levels",
    kicker: "Launch plus live operations",
    statement: "The content system expanded the plan from 12 levels to 42 shipped levels.",
    brief:
      "The original scope was 12 songs. Two were added before launch, creating a 14-song release. Two funded postlaunch seasons then added 14 songs each, bringing the live total to 42.",
    moves: [
      "Built a repeatable framework before content volume increased.",
      "Preserved a coherent visual language while every song received its own identity.",
      "Carried the same standards from launch into two funded live-operations seasons.",
    ],
    proof: [
      "12 levels in the original scope.",
      "14 levels at launch after two prelaunch additions.",
      "28 more levels across two funded 14-song seasons, for 42 total.",
    ],
    relevance: "The final count shows that the recovery created a system capable of sustained expansion.",
  },
];

const partnerLogoFiles: Record<string, string> = {
  Tetris: "brand-logos/tetris.svg",
  Disney: "brand-logos/disney.svg",
  Crayola: "brand-logos/crayola.png",
  "Nickelodeon / SpongeBob": "brand-logos/nickelodeon.svg",
  Sideshow: "brand-logos/sideshow.svg",
  "Ultimate Rivals": "brand-logos/ultimate-rivals.png",
  "Sound Games": "brand-logos/sound-games.png",
  "Bit Fry": "brand-logos/bit-fry.png",
};

const tetrisPortfolioMedia = [
  {
    image: "tetris-brand-mark-final.webp",
    alt: "Rainbow Tetris Beat logo on a purple concert-light background",
    label: "STONE · FINAL BRAND MARK",
    href: "https://www.artstation.com/artwork/vbvKvD",
  },
  {
    image: "tetris-brand-mark-process.webp",
    alt: "Tetris Beat logo development sheet with six colorful wordmark iterations",
    label: "STONE · BRAND SYSTEM DEVELOPMENT",
    href: "https://www.artstation.com/artwork/vbvKvD",
  },
  {
    image: "tetris-main-menu-vfx.webp",
    alt: "Tetris Beat main menu with neon red, cyan, and violet reactive effects",
    label: "BRADD · MAIN MENU VISUAL EFFECTS",
    href: "https://www.artstation.com/artwork/JvqJ6A",
  },
  {
    image: "tetris-summersalts.webp",
    alt: "Tetris Beat Summersalts level with bright audio-reactive geometry",
    label: "BRADD · SUMMERSALTS",
    href: "https://www.artstation.com/artwork/NyLJAN",
  },
  {
    image: "tetris-falling-fantasy.webp",
    alt: "Tetris Beat Falling Fantasy level with layered neon reactive geometry",
    label: "BRADD · FALLING FANTASY",
    href: "https://www.artstation.com/artwork/qe5BrP",
  },
  {
    image: "tetris-accidental-love.webp",
    alt: "Tetris Beat Accidental Love level with vivid pink and blue music-reactive visuals",
    label: "BRADD · ACCIDENTAL LOVE",
    href: "https://www.artstation.com/artwork/JvqJLd",
  },
];

function Signal({ children }: { children: ReactNode }) {
  return <em className="signal-flow">{children}</em>;
}

function Kicker({ children }: { children: ReactNode }) {
  return <p className="section-kicker">{children}</p>;
}

function openDetailValue(value: Insight | CaseStudy): Detail {
  return "owner" in value
    ? { ...value, detailType: "case" }
    : { ...value, detailType: "insight" };
}

function trapFocus(event: globalThis.KeyboardEvent, root: HTMLElement) {
  if (event.key !== "Tab") return;
  const focusable = Array.from(
    root.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])",
    ),
  ).filter((node) => node.getClientRects().length > 0);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (document.activeElement === root) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function DetailArticle({ detail, onClose }: { detail: Detail; onClose: () => void }) {
  const articleRef = useRef<HTMLElement>(null);
  const isTetrisDetail = detail.id === "tetris-beat-proof";
  const profileImage = detail.id === "bradd-profile"
    ? { file: "bradd-headshot-2026.webp", alt: "BRADD McBrearty" }
    : detail.id === "stone-profile"
      ? { file: "stone-portrait.webp", alt: "STONE Perales" }
      : null;

  useEffect(() => {
    const article = articleRef.current;
    article?.focus({ preventScroll: true });
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!article) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else {
        trapFocus(event, article);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <aside
      className="detail-surface"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
    >
      <article
        ref={articleRef}
        className="detail-article"
        tabIndex={-1}
      >
        <header className="detail-bar">
          <button type="button" className="text-button" onClick={onClose}>
            <ArrowLeft weight="bold" aria-hidden="true" />
            Back to presentation
          </button>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close article">
            <X weight="bold" aria-hidden="true" />
          </button>
        </header>
        {isTetrisDetail ? (
          <div className="tetris-detail-media">
            <TetrisReel
              active
              posterSrc={media("tetris-reel-poster.webp")}
              posterAlt="Portrait Tetris Beat key art with the game logo above a neon geometric world"
            />
            <div className="tetris-art-grid" aria-label="Tetris Beat portfolio artwork">
              {tetrisPortfolioMedia.map((item) => (
                <a key={item.image} href={item.href} target="_blank" rel="noreferrer">
                  <img src={media(item.image)} alt={item.alt} />
                  <span>{item.label}</span>
                  <ArrowUpRight weight="bold" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        ) : "image" in detail ? (
          <figure className="detail-hero">
            <img
              src={media(detail.image)}
              alt={detail.alt}
              style={{ objectPosition: detail.imagePosition ?? "center" }}
            />
          </figure>
        ) : profileImage ? (
          <figure className="detail-hero profile-portrait">
            <img src={media(profileImage.file)} alt={profileImage.alt} />
          </figure>
        ) : null}
        <div className="detail-copy">
          <Kicker>{detail.detailType === "case" ? detail.eyebrow + " · " + detail.owner : detail.kicker}</Kicker>
          <h1 id="detail-title">{detail.title}</h1>
          <p className="detail-statement">{detail.statement}</p>
          <section>
            <p className="detail-label">Situation</p>
            <p>{detail.brief}</p>
          </section>
          <section>
            <p className="detail-label">How it was led</p>
            <ol>
              {detail.moves.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>
          <section>
            <p className="detail-label">Evidence and results</p>
            <ul>
              {detail.proof.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <p className="detail-label">Why it matters</p>
            <p>{detail.relevance}</p>
          </section>
        </div>
      </article>
    </aside>
  );
}

function ExplorePanel({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate: (id: string) => void;
}) {
  return (
    <div className={"explore-rollout" + (open ? " is-open" : "")} aria-hidden={!open}>
      <nav aria-label="Explore the presentation">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={() => onNavigate(item.id)}
          >
            <span>{item.index}</span>
            <strong>{item.label}</strong>
            <ArrowUpRight weight="bold" aria-hidden="true" />
          </button>
        ))}
      </nav>
    </div>
  );
}

function Header({
  exploreOpen,
  onExplore,
  onNavigate,
}: {
  exploreOpen: boolean;
  onExplore: () => void;
  onNavigate: (id: string) => void;
}) {
  return (
    <header className="topbar">
      <button className="wordmark" type="button" onClick={() => onNavigate("top")}>
        BRADD <span>+</span> STONE
      </button>
      <div className="header-actions">
        <button className="header-link" type="button" onClick={() => onNavigate("contact")}>
          CONNECT <ArrowUpRight weight="bold" aria-hidden="true" />
        </button>
        <button
          className="header-link explore-trigger"
          type="button"
          aria-expanded={exploreOpen}
          aria-controls="explore-panel"
          onClick={onExplore}
        >
          EXPLORE
          <span className="explore-state" aria-hidden="true">{exploreOpen ? "−" : "+"}</span>
        </button>
      </div>
    </header>
  );
}

function PresentationCue({
  active,
  onMove,
}: {
  active: number;
  onMove: (index: number) => void;
}) {
  const current = slides[active];
  return (
    <nav className="presentation-cue" aria-label="Presentation slides">
      <button
        type="button"
        className="cue-button"
        disabled={active === 0}
        onClick={() => onMove(active - 1)}
        aria-label={active === 0 ? "First slide" : "Previous slide: " + slides[active - 1].label}
      >
        <ArrowUp weight="regular" aria-hidden="true" />
      </button>
      <div className="cue-copy">
        <strong>{current.label}</strong>
      </div>
      <div className="cue-track" aria-hidden="true">
        <span style={{ transform: "scaleX(" + (active + 1) / slides.length + ")" }} />
      </div>
      <button
        type="button"
        className="cue-button"
        disabled={active === slides.length - 1}
        onClick={() => onMove(active + 1)}
        aria-label={
          active === slides.length - 1 ? "Last slide" : "Next slide: " + slides[active + 1].label
        }
      >
        <ArrowDown weight="regular" aria-hidden="true" />
      </button>
    </nav>
  );
}

function HeroControls() {
  const [values, setValues] = useState<Record<HeroParamId, number>>({ ...heroParams });
  return (
    <div className="hero-controls" aria-label="Black hole simulation controls">
      <div className="control-heading">
        <span>SIMULATION FEED</span>
        <strong>LIVE</strong>
      </div>
      {HERO_PARAMS.map((param) => (
        <label key={param.id}>
          <span>{param.label}</span>
          <output>{param.format(values[param.id])}</output>
          <input
            type="range"
            min={param.min}
            max={param.max}
            step={param.step}
            value={values[param.id]}
            aria-valuetext={param.format(values[param.id])}
            onChange={(event) => {
              const value = Number(event.currentTarget.value);
              setHeroParam(param.id, value);
              setValues((current) => ({ ...current, [param.id]: value }));
            }}
          />
        </label>
      ))}
    </div>
  );
}

function HeroSlide({ active, exiting }: { active: boolean; exiting: boolean }) {
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);
  return (
    <section
      id="top"
      className={"presentation-slide hero hero-slide" + (simulationOpen ? " simulation-open" : "") + (exiting ? " is-exiting" : "")}
      data-motion={window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "active"}
    >
      <div className="hero-universe" aria-hidden="true">
        {heroFailed ? <img className="hero-fallback" src={media("remnant-accretion.webp")} alt="" /> : null}
        <Suspense fallback={<div className="hero-loading" />}>
          {!heroFailed ? (
            <HeroExperience
              active={active}
              className="hero-canvas"
              onFailure={() => setHeroFailed(true)}
            />
          ) : null}
        </Suspense>
      </div>
      <div className="front-particles" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="slide-shell hero-shell">
        <div className="hero-story">
          <Kicker>TWO DISCIPLINES. ONE LEADERSHIP SYSTEM.</Kicker>
          <h1>
            WE TURN IP INTO{" "}
            <br />
            WORLDS PEOPLE CAN{" "}
            <br />
            <span className="hero-payoff" aria-label="Play, collect, and grow.">
              <Signal>
                <span className="hero-payoff-line">PLAY, COLLECT, </span>
                <span className="hero-payoff-line">AND GROW.</span>
              </Signal>
            </span>
          </h1>
          <p>
            Creative direction, art direction, game systems, and franchise thinking, built to move
            from first idea to market-ready experience.
          </p>
        </div>
        <div id="simulation-stage" className="simulation-stage">
          <HeroControls />
        </div>
        <button
          className="simulation-toggle"
          type="button"
          aria-expanded={simulationOpen}
          aria-controls="simulation-stage"
          onClick={() => setSimulationOpen((value) => !value)}
        >
          {simulationOpen ? "RETURN TO THE STORY" : "PLAY WITH THE SIMULATION"}
          {simulationOpen ? <ArrowLeft weight="bold" aria-hidden="true" /> : <ArrowRight weight="bold" aria-hidden="true" />}
        </button>
      </div>
    </section>
  );
}

function CapabilitiesSlide({ onOpen }: { onOpen: (detail: Detail) => void }) {
  return (
    <section id="capabilities" className="presentation-slide capabilities-slide">
      <div className="slide-shell">
        <div className="slide-heading capability-heading">
          <Kicker>WHAT WE LEAD</Kicker>
          <h2>FIVE LENSES.<br /><Signal>ONE COMPLETE SYSTEM.</Signal></h2>
          <p>Each lens opens a complete explanation, not a résumé fragment.</p>
        </div>
        <div className="capability-list">
          {capabilityInsights.map((item, index) => (
            <button key={item.id} type="button" onClick={() => onOpen(openDetailValue(item))}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.title}</strong>
              <small>{item.kicker}</small>
              <ArrowUpRight weight="bold" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function LeaderCard({
  leader,
  onOpen,
}: {
  leader: "bradd" | "stone";
  onOpen: () => void;
}) {
  const bradd = leader === "bradd";
  const fullName = bradd ? "BRADD McBrearty" : "STONE Perales";
  return (
    <article className={"leader-card leader-" + leader} aria-labelledby={`${leader}-card-title`}>
      <img
        src={media(bradd ? "bradd-headshot-2026.webp" : "stone-portrait.webp")}
        alt={fullName}
      />
      <div className="leader-card-copy">
        <p>{bradd ? "CREATIVE DIRECTOR" : "ART DIRECTOR"}</p>
        <h3 id={`${leader}-card-title`}><b>{bradd ? "BRADD" : "STONE"}</b><span>{bradd ? "McBrearty" : "Perales"}</span></h3>
        <small>
          {bradd
            ? "Game design · Product strategy · Technical direction"
            : "Worldbuilding · Visual systems · Franchise direction"}
        </small>
        <span className="article-link" aria-hidden="true">
          OPEN COMPLETE PROFILE <ArrowUpRight weight="bold" aria-hidden="true" />
        </span>
      </div>
      <button
        type="button"
        className="leader-card-trigger"
        aria-label={`Open complete profile for ${fullName}`}
        onClick={onOpen}
      />
    </article>
  );
}

function PartnershipSlide({ onOpen }: { onOpen: (detail: Detail) => void }) {
  return (
    <section id="team" className="presentation-slide partnership-slide">
      <div className="slide-shell">
        <div className="slide-heading">
          <Kicker>01 / THE PARTNERSHIP</Kicker>
          <h2>TWO LEADERS.<br /><Signal>ONE WAY THROUGH.</Signal></h2>
          <p>STONE makes the world coherent. BRADD makes it playable. Both lead the system.</p>
        </div>
        <div className="leader-grid">
          <LeaderCard leader="stone" onOpen={() => onOpen(openDetailValue(leaderInsights.stone))} />
          <LeaderCard leader="bradd" onOpen={() => onOpen(openDetailValue(leaderInsights.bradd))} />
        </div>
      </div>
    </section>
  );
}

function ProofSlide({ active, onOpen }: { active: boolean; onOpen: (detail: Detail) => void }) {
  const [activeMetric, setActiveMetric] = useState(0);
  const metric = proofMetrics[activeMetric];
  return (
    <section id="proof" className="presentation-slide proof-slide">
      <div className="slide-shell">
        <div className="proof-grid">
          <div className="slide-heading">
            <Kicker>02 / PROVEN TOGETHER · APPLE ARCADE · TETRIS BEAT</Kicker>
            <h2>NOT TWO RÉSUMÉS.<br /><Signal>ONE SHIPPED RESULT.</Signal></h2>
            <p>An at-risk production became one coherent creative and production system.</p>
          </div>
          <TetrisReel
            active={active}
            compact
            className="proof-reel"
            posterSrc={media("tetris-reel-poster.webp")}
            posterAlt="Portrait Tetris Beat key art with the game logo above a neon geometric world"
          />
          <div className="proof-metrics">
            {proofMetrics.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={activeMetric === index ? "is-active" : ""}
                aria-pressed={activeMetric === index}
                onClick={() => setActiveMetric(index)}
              >
                <strong>{item.title.split(" ")[0]}</strong>
                <span>{item.title.slice(item.title.indexOf(" ") + 1)}</span>
              </button>
            ))}
          </div>
          <div className="metric-story">
            <span>{metric.kicker}</span>
            <p>{metric.statement}</p>
            <button type="button" className="article-link" onClick={() => onOpen(openDetailValue(metric))}>
              READ THIS RESULT <ArrowUpRight weight="bold" aria-hidden="true" />
            </button>
          </div>
          <button type="button" className="article-link proof-case-link" onClick={() => onOpen(openDetailValue(jointInsights.tetris))}>
            OPEN COMPLETE JOINT CASE <ArrowUpRight weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function RangeSlide({ onOpen }: { onOpen: (detail: Detail) => void }) {
  const [activeRange, setActiveRange] = useState<RangeId>("play");
  const insight = rangeInsights.find((item) => item.id === activeRange) ?? rangeInsights[0];
  const visual = rangeVisuals[activeRange];
  return (
    <section id="range" className="presentation-slide range-slide">
      <div className="slide-shell">
        <div className="slide-heading">
          <Kicker>03 / BUILT FOR THE WHOLE ECOSYSTEM</Kicker>
          <h2>ONE IDEA.<br /><Signal>EVERY SURFACE.</Signal></h2>
          <p>Play makes the promise tangible. Collect makes it desirable. Grow makes it durable.</p>
        </div>
        <div className="range-tabs" role="tablist" aria-label="Ecosystem lenses">
          {rangeInsights.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeRange === item.id}
              onClick={() => setActiveRange(item.id as RangeId)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
        </div>
        <article className="range-stage" role="tabpanel">
          <img src={media(visual.image)} alt={visual.alt} style={{ objectPosition: visual.position }} />
          <div>
            <Kicker>{insight.kicker}</Kicker>
            <h3>{insight.statement}</h3>
            <p>{insight.brief}</p>
            <button type="button" className="article-link sweep-link" onClick={() => onOpen(openDetailValue(insight))}>
              <span className="sweep-label" data-text="HERE'S HOW">HERE&apos;S HOW</span>
              <ArrowUpRight weight="bold" aria-hidden="true" />
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

function BrandMark({ name }: { name: string }) {
  const icon = name === "Apple"
    ? siApple
    : name === "Roblox"
      ? siRoblox
      : name === "Toyota"
        ? siToyota
        : name === "Warner Bros. / DC"
          ? siDcentertainment
          : null;
  if (icon) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={icon.path} />
      </svg>
    );
  }
  const logo = partnerLogoFiles[name];
  return logo ? <img src={media(logo)} alt="" aria-hidden="true" /> : null;
}

function IndustrySlide() {
  const [partnerIndex, setPartnerIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const partner = partners[partnerIndex];
  const move = (direction: number) => {
    setPartnerIndex((current) => (current + direction + partners.length) % partners.length);
  };
  return (
    <section id="industry-proof" className="presentation-slide industry-slide">
      <div className="slide-shell">
        <div className="slide-heading">
          <Kicker>04 / INDUSTRY PROOF</Kicker>
          <h2>RECOGNIZABLE WORLDS.<br /><Signal>SPECIFIC CONTRIBUTIONS.</Signal></h2>
          <p>Select a relationship to see the work the name is actually supporting.</p>
        </div>
        <div className="partner-selector" aria-label="Select an industry relationship">
          {partners.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className={partnerIndex === index ? "is-active" : ""}
              aria-label={item.name}
              aria-pressed={partnerIndex === index}
              onClick={() => setPartnerIndex(index)}
            >
              <BrandMark name={item.name} />
            </button>
          ))}
        </div>
        <article
          className="partner-detail"
          onPointerDown={(event) => {
            touchStart.current = event.clientX;
          }}
          onPointerUp={(event) => {
            if (touchStart.current === null) return;
            const delta = event.clientX - touchStart.current;
            touchStart.current = null;
            if (Math.abs(delta) > 48) move(delta < 0 ? 1 : -1);
          }}
        >
          <Kicker>{partner.category} / {partner.owner}</Kicker>
          <h3>{partner.name}</h3>
          <strong>{partner.relationship}</strong>
          <p>{partner.note}</p>
        </article>
        <div className="partner-controls">
          <button type="button" onClick={() => move(-1)}>
            <ArrowLeft weight="bold" aria-hidden="true" /> BACK
          </button>
          <button type="button" onClick={() => move(1)}>
            NEXT <ArrowRight weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function WorkSlide({ onOpen }: { onOpen: (detail: Detail) => void }) {
  const [caseIndex, setCaseIndex] = useState(0);
  const study = caseStudies[caseIndex];
  return (
    <section id="work" className="presentation-slide work-slide">
      <div className="slide-shell">
        <div className="slide-heading">
          <Kicker>05 / SELECTED CASE FILES</Kicker>
          <h2>RANGE IS<br /><Signal>THE PROOF.</Signal></h2>
          <p>Six worlds. Six constraints. Select one, then open its complete context.</p>
        </div>
        <div className="case-selector" aria-label="Select a case file">
          {caseStudies.slice(0, 6).map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={caseIndex === index ? "is-active" : ""}
              aria-label={item.title}
              aria-pressed={caseIndex === index}
              onClick={() => setCaseIndex(index)}
            >
              <img src={media(item.image)} alt="" style={{ objectPosition: item.imagePosition ?? "center" }} />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </div>
        <article className="featured-case">
          <img src={media(study.image)} alt={study.alt} style={{ objectPosition: study.imagePosition ?? "center" }} />
          <div>
            <Kicker>{study.owner.toUpperCase()} · {study.role}</Kicker>
            <h3>{study.title}</h3>
            <p>{study.statement}</p>
            <button type="button" className="article-link" onClick={() => onOpen(openDetailValue(study))}>
              OPEN COMPLETE CASE FILE <ArrowUpRight weight="bold" aria-hidden="true" />
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

function CollaborationSlide({ onOpen }: { onOpen: (detail: Detail) => void }) {
  return (
    <section id="collaboration" className="presentation-slide collaboration-slide">
      <div className="slide-shell">
        <div className="slide-heading">
          <Kicker>06 / PHYSICAL BECOMES INTERACTIVE</Kicker>
          <p className="warm-kicker">CRAYOLA COLOR ALIVE · FUNNY FACES, CRAZY COSTUMES</p>
          <h2>WHEN THE OBVIOUS ROUTE FAILED,<br /><Signal>THEY MADE A NEW ONE.</Signal></h2>
          <p>Physical coloring became a scanned, animated, wearable virtual-mask experience.</p>
        </div>
        <div className="collab-roles">
          <div><strong>STONE</strong><span>Art adaptation + visual continuity</span></div>
          <div><strong>BRADD</strong><span>Technical implementation + animation systems</span></div>
        </div>
        <button type="button" className="article-link collab-link" onClick={() => onOpen(openDetailValue(jointInsights.crayola))}>
          OPEN COMPLETE CASE <ArrowUpRight weight="bold" aria-hidden="true" />
        </button>
        <figure className="collab-art">
          <img src={media("crayola-funny-faces-front-cutout.png")} alt="Front of Crayola Funny Faces Crazy Costumes packaging" />
          <img src={media("crayola-funny-faces-back-cutout.png")} alt="Back of Crayola Funny Faces Crazy Costumes packaging" />
        </figure>
      </div>
    </section>
  );
}

function DepthSlide({ onOpen }: { onOpen: (detail: Detail) => void }) {
  return (
    <section id="depth" className="presentation-slide depth-slide">
      <div className="slide-shell">
        <div className="slide-heading">
          <Kicker>07 / INDIVIDUAL DEPTH</Kicker>
          <h2>DEEP CRAFT.<br /><Signal>EXECUTIVE ALTITUDE.</Signal></h2>
          <p>Equal leadership weight, complementary judgment, and specific evidence.</p>
        </div>
        <div className="depth-board">
          <div className="depth-person">
            <span>CREATIVE DIRECTOR</span><strong>BRADD</strong>
            <button type="button" onClick={() => onOpen(openDetailValue(leaderInsights.bradd))}>OPEN PROFILE <ArrowUpRight aria-hidden="true" /></button>
          </div>
          <div className="depth-person">
            <span>ART DIRECTOR</span><strong>STONE</strong>
            <button type="button" onClick={() => onOpen(openDetailValue(leaderInsights.stone))}>OPEN PROFILE <ArrowUpRight aria-hidden="true" /></button>
          </div>
          {depthTimeline.map((row, index) => (
            <div className="depth-row" key={String(index)}>
              <div><span>{row.bradd.label}</span><strong>{row.bradd.value}</strong><small>{row.bradd.note}</small></div>
              <div><span>{row.stone.label}</span><strong>{row.stone.value}</strong><small>{row.stone.note}</small></div>
            </div>
          ))}
        </div>
        <div className="supporting-grid">
          {supportingProof.slice(0, 3).map((item) => (
            <button type="button" key={item.id} onClick={() => onOpen(openDetailValue(item))}>
              <img src={media(item.image)} alt="" style={{ objectPosition: item.position, objectFit: item.fit ?? "cover" }} />
              <span>{item.label}</span>
              <ArrowUpRight weight="bold" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function MentorshipSlide({ onOpen }: { onOpen: (detail: Detail) => void }) {
  return (
    <section id="mentorship" className="presentation-slide mentorship-slide">
      <div className="slide-shell">
        <div className="slide-heading">
          <Kicker>08 / EDUCATE · SPEAK · MENTOR</Kicker>
          <h2>KNOWLEDGE SHARED.<br /><Signal>LEADERSHIP MULTIPLIED.</Signal></h2>
          <p>They make hard-won creative judgment useful in classrooms, executive rooms, and the daily development of teams.</p>
        </div>
        <div className="leadership-practices">
          <article>
            <span>01</span>
            <Kicker>EDUCATORS</Kicker>
            <h3>TURN PRACTICE INTO A SYSTEM PEOPLE CAN USE.</h3>
            <p>Bradd teaches in LCAD&apos;s Game Design MFA program. Together, they translate complex creative and production judgment into practical frameworks.</p>
          </article>
          <article>
            <span>02</span>
            <Kicker>PUBLIC SPEAKERS</Kicker>
            <h3>MAKE THE ROOM SEE THE SAME DECISION.</h3>
            <p>They clarify creative, product, and franchise complexity for pitches, working sessions, classrooms, and team reviews.</p>
          </article>
          <article>
            <span>03</span>
            <Kicker>MENTORS</Kicker>
            <h3>BUILD JUDGMENT, NOT DEPENDENCE.</h3>
            <p>They train artists and leads to make stronger calls, give sharper critique, and carry the standard forward.</p>
          </article>
        </div>
        <div className="mentorship-actions">
          <button type="button" className="article-link" onClick={() => onOpen(openDetailValue(leaderInsights.bradd))}>
            BRADD PROFILE <ArrowUpRight weight="bold" aria-hidden="true" />
          </button>
          <button type="button" className="article-link" onClick={() => onOpen(openDetailValue(leaderInsights.stone))}>
            STONE PROFILE <ArrowUpRight weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function ContactSlide({ onCopy }: { onCopy: () => void }) {
  return (
    <section id="contact" className="presentation-slide contact-slide">
      <div className="slide-shell">
        <div className="slide-heading">
          <Kicker>09 / A NEW WORLD STARTS WITH A CONVERSATION</Kicker>
          <h2>LET&apos;S BUILD<br /><Signal>WHAT&apos;S NEXT.</Signal></h2>
          <p>Bring us the property, product opportunity, or production problem that needs one coherent creative system.</p>
        </div>
        <div className="contact-actions">
          <a className="contact-primary" href="mailto:bradd.mcbrearty@gmail.com">
            START A CONVERSATION <ArrowUpRight weight="bold" aria-hidden="true" />
          </a>
          <button type="button" onClick={onCopy}>
            COPY EMAIL <Copy weight="bold" aria-hidden="true" />
          </button>
          <a href="https://www.linkedin.com/in/braddmcbrearty/" target="_blank" rel="noopener noreferrer">
            BRADD ON LINKEDIN <ArrowUpRight weight="bold" aria-hidden="true" />
          </a>
          <a href="https://www.linkedin.com/in/stone/" target="_blank" rel="noopener noreferrer">
            STONE ON LINKEDIN <ArrowUpRight weight="bold" aria-hidden="true" />
          </a>
        </div>
        <footer><span>BRADD + STONE</span><span>CREATIVE LEADERSHIP</span><span>2026</span></footer>
      </div>
    </section>
  );
}

export default function App() {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLElement>(null);
  const detailTrigger = useRef<HTMLElement | null>(null);
  const activeSlideRef = useRef(0);
  const heroTransitionRef = useRef(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [heroTransitioning, setHeroTransitioning] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    activeSlideRef.current = activeSlide;
  }, [activeSlide]);

  const moveTo = useCallback((index: number) => {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    document.getElementById(slides[next].id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setExploreOpen(false);
  }, []);

  const navigateTo = useCallback(
    (id: string) => {
      const index = slides.findIndex((slide) => slide.id === id);
      if (index >= 0) moveTo(index);
    },
    [moveTo],
  );

  const openDetail = useCallback((value: Detail) => {
    detailTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    window.history.pushState({ braddStoneDetail: true }, "");
    setDetail(value);
    setExploreOpen(false);
  }, []);

  const requestDetailClose = useCallback(() => {
    if (window.history.state?.braddStoneDetail) {
      window.history.back();
    } else {
      setDetail(null);
      requestAnimationFrame(() => detailTrigger.current?.focus({ preventScroll: true }));
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setDetail(null);
      requestAnimationFrame(() => detailTrigger.current?.focus({ preventScroll: true }));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (backgroundRef.current) backgroundRef.current.inert = Boolean(detail);
  }, [detail]);

  useEffect(() => {
    const root = deckRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = slides.findIndex((slide) => slide.id === visible.target.id);
        if (index >= 0) setActiveSlide(index);
      },
      { root, threshold: [0.55, 0.75, 0.95] },
    );
    slides.forEach((slide) => {
      const node = document.getElementById(slide.id);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = deckRef.current;
    if (!root) return;
    let moveTimer = 0;
    let clearTimer = 0;
    const onWheel = (event: WheelEvent) => {
      const desktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!desktop || reduced || activeSlideRef.current !== 0 || event.deltaY <= 16) return;
      event.preventDefault();
      if (heroTransitionRef.current) return;
      heroTransitionRef.current = true;
      setHeroTransitioning(true);
      moveTimer = window.setTimeout(() => {
        root.style.scrollSnapType = "none";
        root.scrollTop = root.clientHeight;
        window.requestAnimationFrame(() => root.style.removeProperty("scroll-snap-type"));
      }, 430);
      clearTimer = window.setTimeout(() => {
        heroTransitionRef.current = false;
        setHeroTransitioning(false);
      }, 980);
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      root.removeEventListener("wheel", onWheel);
      window.clearTimeout(moveTimer);
      window.clearTimeout(clearTimer);
    };
  }, []);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && exploreOpen) setExploreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exploreOpen]);

  const copyEmail = async () => {
    const email = "bradd.mcbrearty@gmail.com";
    try {
      await navigator.clipboard.writeText(email);
      setNotice("EMAIL COPIED");
    } catch {
      window.location.href = "mailto:" + email;
      setNotice("OPENING EMAIL");
    }
    window.setTimeout(() => setNotice(""), 2400);
  };

  return (
    <div className="site">
      <div ref={backgroundRef} className="site-chrome">
        <Header
          exploreOpen={exploreOpen}
          onExplore={() => setExploreOpen((value) => !value)}
          onNavigate={navigateTo}
        />
        <div id="explore-panel">
          <ExplorePanel open={exploreOpen} onNavigate={navigateTo} />
        </div>
        {exploreOpen ? <button className="menu-scrim" type="button" aria-label="Close Explore menu" onClick={() => setExploreOpen(false)} /> : null}
        <main ref={deckRef} className="presentation" aria-label="BRADD and STONE creative leadership presentation">
          <HeroSlide active={activeSlide === 0} exiting={heroTransitioning} />
          <CapabilitiesSlide onOpen={openDetail} />
          <PartnershipSlide onOpen={openDetail} />
          <ProofSlide active={activeSlide === 3 && !detail} onOpen={openDetail} />
          <RangeSlide onOpen={openDetail} />
          <IndustrySlide />
          <WorkSlide onOpen={openDetail} />
          <CollaborationSlide onOpen={openDetail} />
          <DepthSlide onOpen={openDetail} />
          <MentorshipSlide onOpen={openDetail} />
          <ContactSlide onCopy={copyEmail} />
        </main>
        <PresentationCue active={activeSlide} onMove={moveTo} />
        {heroTransitioning ? <div className="hero-transition-veil" aria-hidden="true" /> : null}
      </div>
      {detail ? <DetailArticle detail={detail} onClose={requestDetailClose} /> : null}
      <div className={"notice" + (notice ? " is-visible" : "")} role="status" aria-live="polite">{notice}</div>
    </div>
  );
}
