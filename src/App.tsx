import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { LazyMotion, m, useReducedMotion } from "motion/react";
import {
  capabilityInsights,
  caseStudies,
  depthTimeline,
  leaderInsights,
  partners,
  rangeInsights,
  supportingProof,
  type CaseStudy,
  type Insight,
} from "./content";
import { detectExperienceTier, type ExperienceTier } from "./experience";

const HeroExperience = lazy(() => import("./hero/HeroExperience"));
const loadMotionFeatures = () => import("./motionFeatures").then((module) => module.default);
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const media = (file: string) => `${basePath}/media/${file}`;

type Detail = (CaseStudy & { detailType: "case" }) | (Insight & { detailType: "insight" });

type HeroLazyBoundaryProps = {
  children: ReactNode;
  onFailure: () => void;
};

class HeroLazyBoundary extends Component<HeroLazyBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <m.div
      className={`reveal ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}

function FoilCard({ study, onOpen }: { study: CaseStudy; onOpen: () => void }) {
  const handlePointer = (event: PointerEvent<HTMLButtonElement>) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
    event.currentTarget.style.setProperty("--rx", `${y * -4.5}deg`);
    event.currentTarget.style.setProperty("--ry", `${x * 5}deg`);
  };

  const resetPointer = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.setProperty("--rx", "0deg");
    event.currentTarget.style.setProperty("--ry", "0deg");
  };

  return (
    <button className={`case-card owner-${study.owner.toLowerCase()}`} type="button" onPointerMove={handlePointer} onPointerLeave={resetPointer} onClick={onOpen} aria-label={`Explore ${study.title} case study`}>
      <img src={media(study.image)} alt={study.alt} loading="lazy" width="1280" height="720" style={{ objectPosition: study.imagePosition ?? "center" }} />
      <span className="case-wash" aria-hidden="true" />
      <span className="case-content">
        <span className="case-owner">{study.owner} · {study.role}</span>
        <strong>{study.title}</strong>
        <span className="case-statement">{study.statement}</span>
        <span className="case-open">Open case file <b aria-hidden="true">↗</b></span>
      </span>
    </button>
  );
}

function LeaderCard({ leader, onOpen }: { leader: "bradd" | "stone"; onOpen: () => void }) {
  const isBradd = leader === "bradd";
  const handlePointer = (event: PointerEvent<HTMLButtonElement>) => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--card-x", `${x * 6}deg`);
    event.currentTarget.style.setProperty("--card-y", `${y * -5}deg`);
    event.currentTarget.style.setProperty("--shine-x", `${(x + 0.5) * 100}%`);
    event.currentTarget.style.setProperty("--shine-y", `${(y + 0.5) * 100}%`);
  };

  return (
    <button
      className={`leader-card leader-${leader}`}
      type="button"
      onPointerMove={handlePointer}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--card-x", "0deg");
        event.currentTarget.style.setProperty("--card-y", "0deg");
      }}
      onClick={onOpen}
      aria-label={`Open ${isBradd ? "Bradd McBrearty" : "Stone Perales"} profile`}
    >
      <span className="portrait-wrap">
        <img src={media(`${leader}-portrait.webp`)} alt={isBradd ? "Bradd McBrearty" : "Stone Perales"} width="1122" height="1402" />
        <span className="portrait-sheen" aria-hidden="true" />
      </span>
      <span className="chase-meta"><span>2026 / CURRENT SEASON</span><b>CHASE {isBradd ? "01" : "02"}</b></span>
      <span className="foil-corners" aria-hidden="true" />
      <span className="leader-copy">
        <span className="leader-role">{isBradd ? "Creative Director" : "Art Director"}</span>
        <strong>{isBradd ? "Bradd McBrearty" : "Stone Perales"}</strong>
        <span>{isBradd ? "Game design · Product strategy · Technical direction · Production systems" : "Worldbuilding · Visual identity · Franchise systems · Licensed products"}</span>
        <span className="leader-open">Open profile <b aria-hidden="true">↗</b></span>
      </span>
    </button>
  );
}

function DetailDialog({ detail, onDismiss }: { detail: Detail | null; onDismiss: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const savedScroll = useRef(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (detail && !dialog.open) {
      lastTrigger.current = document.activeElement as HTMLElement;
      savedScroll.current = window.scrollY;
      document.body.classList.add("modal-open");
      dialog.showModal();
      dialog.querySelector<HTMLButtonElement>(".dialog-close")?.focus();
    } else if (!detail && dialog.open) {
      dialog.close();
    }
  }, [detail]);

  const restore = () => {
    document.body.classList.remove("modal-open");
    window.scrollTo({ top: savedScroll.current, behavior: "instant" });
    lastTrigger.current?.focus({ preventScroll: true });
  };

  return (
    <dialog ref={dialogRef} className="detail-dialog" aria-modal="true" aria-labelledby="detail-title" onCancel={(event) => { event.preventDefault(); onDismiss(); }} onClose={restore}>
      {detail && (
        <article className="dialog-panel">
          <button className="dialog-close" type="button" onClick={onDismiss}>Close <span aria-hidden="true">×</span></button>
          {detail.detailType === "case" ? (
            <div className="dialog-image"><img src={media(detail.image)} alt={detail.alt} width="1280" height="720" style={{ objectPosition: detail.imagePosition ?? "center" }} /><span>{detail.eyebrow}</span></div>
          ) : (
            <div className="dialog-concept" aria-hidden="true"><span>{detail.title.slice(0, 1)}</span><i /></div>
          )}
          <div className="dialog-body">
            <p className="case-owner">{detail.detailType === "case" ? `${detail.owner} · ${detail.role}` : detail.kicker}</p>
            <h2 id="detail-title">{detail.title}</h2>
            <p className="dialog-statement">{detail.statement}</p>
            <p className="dialog-brief">{detail.brief}</p>
            <div className="dialog-columns">
              <div><h3>{detail.detailType === "case" ? "The creative moves" : "How we lead it"}</h3><ul>{detail.moves.map((move) => <li key={move}>{move}</li>)}</ul></div>
              <div><h3>{detail.detailType === "case" ? "Proof in the work" : "Evidence"}</h3><ul className="proof-list">{detail.proof.map((proof) => <li key={proof}>{proof}</li>)}</ul>{detail.detailType === "case" && detail.sourceNote && <p className="proof-source">{detail.sourceNote}</p>}</div>
            </div>
          </div>
        </article>
      )}
    </dialog>
  );
}

const HERO_SCENES = ["proposition", "partnership", "translation", "proof"] as const;

function HeroSection({ tier }: { tier: ExperienceTier }) {
  const heroRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const sceneRef = useRef(0);
  const [scene, setScene] = useState(0);
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 620px)").matches);
  const [cinematicReady, setCinematicReady] = useState(false);
  const [cinematicFailed, setCinematicFailed] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const canRender = !compact && !reduceMotion && (tier === "webgl" || tier === "webgpu") && !cinematicFailed;

  const goToScene = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(HERO_SCENES.length - 1, next));
    sceneRef.current = clamped;
    setScene(clamped);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 620px)");
    const sync = () => setCompact(query.matches);
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    let wheelTotal = 0;
    let lastStep = 0;
    let touchStart = 0;

    const heroOwnsViewport = () => {
      const rect = hero.getBoundingClientRect();
      const visible = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      return visible / Math.min(rect.height, window.innerHeight) > 0.82;
    };

    const step = (direction: -1 | 1) => {
      const current = sceneRef.current;
      if (direction > 0 && current === HERO_SCENES.length - 1) {
        document.getElementById("team")?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
        return;
      }
      if (direction < 0 && current === 0) return;
      goToScene(current + direction);
    };

    const onWheel = (event: WheelEvent) => {
      if (!heroOwnsViewport() || event.ctrlKey) return;
      const direction = Math.sign(event.deltaY) as -1 | 0 | 1;
      const atBoundary = (direction < 0 && sceneRef.current === 0) || (direction > 0 && sceneRef.current === HERO_SCENES.length - 1);
      if (atBoundary) {
        if (direction > 0) {
          event.preventDefault();
          step(1);
        }
        return;
      }
      event.preventDefault();
      if (Math.sign(wheelTotal) !== direction) wheelTotal = 0;
      wheelTotal += event.deltaY;
      const now = performance.now();
      if (Math.abs(wheelTotal) >= 28 && now - lastStep > 260) {
        lastStep = now;
        wheelTotal = 0;
        step(direction < 0 ? -1 : 1);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!heroOwnsViewport() || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, textarea, select, dialog")) return;
      const forward = event.key === "ArrowDown" || event.key === "ArrowRight" || event.key === "PageDown" || (event.key === " " && !event.shiftKey);
      const backward = event.key === "ArrowUp" || event.key === "ArrowLeft" || event.key === "PageUp" || (event.key === " " && event.shiftKey);
      if (event.key === "Home") { event.preventDefault(); goToScene(0); return; }
      if (event.key === "End") { event.preventDefault(); goToScene(HERO_SCENES.length - 1); return; }
      if (forward || backward) {
        event.preventDefault();
        step(forward ? 1 : -1);
      }
    };

    const onTouchStart = (event: TouchEvent) => { touchStart = event.touches[0]?.clientY ?? 0; };
    const onTouchEnd = (event: TouchEvent) => {
      if (!heroOwnsViewport()) return;
      const end = event.changedTouches[0]?.clientY ?? touchStart;
      const distance = touchStart - end;
      if (Math.abs(distance) > 36) step(distance > 0 ? 1 : -1);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    hero.addEventListener("touchstart", onTouchStart, { passive: true });
    hero.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      hero.removeEventListener("touchstart", onTouchStart);
      hero.removeEventListener("touchend", onTouchEnd);
    };
  }, [goToScene, reduceMotion]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin: "10%" });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const continueFromHero = () => document.getElementById("team")?.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });

  return (
    <section className="hero" id="top" ref={heroRef} data-scene={HERO_SCENES[scene]} data-scene-index={scene} data-enhanced={cinematicReady} data-static={!canRender}>
      <div className="hero-stage">
        <div className="archive-atmosphere" aria-hidden="true" />
        <div className="archive-poster" aria-hidden="true">
          <figure className="archive-poster-play"><img src={media("tetris-beat-gameplay.webp")} alt="" width="1280" height="720" /></figure>
          <figure className="archive-poster-collect"><img src={media("stone-raid-hires.webp")} alt="" width="1280" height="720" /></figure>
          <figure className="archive-poster-grow"><img src={media("stone-chaotic-hires.webp")} alt="" width="1280" height="720" /></figure>
          <figure className="archive-poster-bradd"><img src={media("bradd-portrait.webp")} alt="" width="1122" height="1402" /></figure>
          <figure className="archive-poster-stone"><img src={media("stone-portrait.webp")} alt="" width="1122" height="1402" /></figure>
        </div>
        {canRender && (
          <div className="hero-cinematic" aria-hidden="true">
            <HeroLazyBoundary onFailure={() => { setCinematicReady(false); setCinematicFailed(true); }}>
              <Suspense fallback={null}>
                <HeroExperience active={onScreen} sceneRef={sceneRef} onReady={() => setCinematicReady(true)} onFailure={() => { setCinematicReady(false); setCinematicFailed(true); }} />
              </Suspense>
            </HeroLazyBoundary>
          </div>
        )}

        <div className="hero-identity"><b>BRADD + STONE</b><span>CREATIVE LEADERSHIP</span></div>
        <p className="hero-running-promise">WE TURN IP INTO WORLDS PEOPLE CAN <em>PLAY, COLLECT, AND GROW.</em></p>

        <div className="hero-scene-stack" aria-live="polite">
          <article className="hero-scene hero-scene-proposition" aria-hidden={scene !== 0}>
            <p className="eyebrow">Creative leadership for games, brands &amp; entertainment</p>
            <h1>BRADD <i>+</i> STONE</h1>
            <p>One accountable team from first idea to market-ready experience.</p>
          </article>
          <article className="hero-scene hero-scene-partnership" aria-hidden={scene !== 1}>
            <p className="eyebrow">01 / THE PARTNERSHIP</p>
            <h2>Two leaders.<br /><em>One creative system.</em></h2>
            <p>Stone establishes the visual truth. Bradd builds the product and production path that carries it into play.</p>
          </article>
          <article className="hero-scene hero-scene-translation" aria-hidden={scene !== 2}>
            <p className="eyebrow">02 / THE VALUE</p>
            <h2>One idea.<br /><em>Every surface.</em></h2>
            <div className="hero-value-rail"><span><b>PLAY</b> Make the fantasy playable.</span><span><b>COLLECT</b> Make the world desirable in the hand.</span><span><b>GROW</b> Build rules that survive every format.</span></div>
          </article>
          <article className="hero-scene hero-scene-proof" aria-hidden={scene !== 3}>
            <p className="eyebrow">03 / PROVEN TOGETHER</p>
            <h2>Built to align.<br /><em>Built to ship.</em></h2>
            <p>Tetris Beat is the proof: complementary direction turned fragmented work into one scalable, released experience.</p>
            <button type="button" className="hero-primary-action" onClick={continueFromHero}>Meet the partnership <span aria-hidden="true">↘</span></button>
          </article>
        </div>

        <nav className="hero-scene-nav" aria-label="Intro chapters">
          {HERO_SCENES.map((id, index) => <button key={id} type="button" aria-label={`Show intro chapter ${index + 1}: ${id}`} aria-current={scene === index ? "step" : undefined} onClick={() => goToScene(index)}><span>{String(index + 1).padStart(2, "0")}</span><i /></button>)}
        </nav>
        <button className="hero-skip" type="button" onClick={continueFromHero}>Skip intro <span aria-hidden="true">↘</span></button>
        <div className="hero-input-cue" aria-hidden="true"><span>{scene === HERO_SCENES.length - 1 ? "SCROLL TO CONTINUE" : "SCROLL · SWIPE · KEYS"}</span><i /></div>
      </div>
    </section>
  );
}

export default function App() {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [activeRange, setActiveRange] = useState<"play" | "collect" | "grow">("play");
  const [activePartner, setActivePartner] = useState(partners[0]);
  const [tier] = useState<ExperienceTier>(() => detectExperienceTier());

  const openInsight = (insight: Insight) => setDetail({ ...insight, detailType: "insight" });
  const openStudy = (study: CaseStudy) => setDetail({ ...study, detailType: "case" });
  const range = rangeInsights.find((item) => item.id === activeRange) ?? rangeInsights[0];

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="ambient" aria-hidden="true" />
      <div className="scroll-progress" aria-hidden="true"><span /></div>

      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="Bradd and Stone, back to top">B<span>+</span>S</a>
        <p>Creative leadership for games, brands &amp; entertainment</p>
        <a className="top-cta" href="#contact">Build what&apos;s next <span aria-hidden="true">↘</span></a>
      </header>

      <main id="main-content" tabIndex={-1}>
        <HeroSection tier={tier} />
        <nav className="signal-strip" aria-label="Explore leadership capabilities">{capabilityInsights.map((insight) => <button key={insight.id} type="button" onClick={() => openInsight(insight)}>{insight.title}<span aria-hidden="true">↗</span></button>)}</nav>

        <section className="team-section" id="team">
          <Reveal className="section-intro"><p className="section-index">01 / The partnership</p><h2>Vision with a way through.</h2><p>Stone makes a world coherent, ownable, and unmistakable. Bradd makes it playable, scalable, and commercially real.</p></Reveal>
          <div className="leader-grid"><Reveal><LeaderCard leader="bradd" onOpen={() => openInsight(leaderInsights.bradd)} /></Reveal><Reveal delay={0.08}><LeaderCard leader="stone" onOpen={() => openInsight(leaderInsights.stone)} /></Reveal></div>
          <div className="partnership-line" aria-label="Different lenses, shared standards, one accountable team"><p>Different lenses.</p><i aria-hidden="true" /><p>Shared standards.</p><i aria-hidden="true" /><p>One accountable team.</p></div>
        </section>

        <section className="proof-section" id="proof">
          <Reveal className="proof-visual">
            <figure className="proof-cover"><img src={media("tetris-beat-cover.webp")} alt="Tetris Beat official cover artwork and logo" width="1080" height="1080" /><figcaption>Official brand mark · Stone Perales</figcaption></figure>
            <figure className="proof-gameplay"><img src={media("tetris-beat-gameplay.webp")} alt="Tetris Beat gameplay screen" width="1280" height="720" loading="lazy" /><figcaption>Shipped gameplay</figcaption></figure>
            <span className="proof-stamp">SHIPPED<br />TOGETHER</span>
          </Reveal>
          <Reveal className="proof-copy" delay={0.08}>
            <p className="section-index">02 / Proven together</p><p className="project-kicker">Apple Arcade · Tetris Beat</p><h2>Not two résumés. One shipped result.</h2>
            <p>An at-risk production needed one coherent creative and production system. Stone established its visual language and led the art vision. Bradd rebuilt the technical framework and production path. Together with the wider team, they turned fragmented work into a scalable, released game.</p>
            <div className="production-build" aria-label="Tetris Beat production transformation">{["5 DAYS", "20+ ARTISTS", "28 LIVE LEVELS"].map((label, index) => <div className="build-stage" key={label}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong><i aria-hidden="true">{Array.from({ length: index === 0 ? 5 : index === 1 ? 12 : 18 }, (_, cell) => <b key={cell} />)}</i></div>)}</div>
            <p className="proof-footnote">Shipped eight months later and held at or near the top of Apple Arcade for 6+ weeks. Internal production record.</p>
          </Reveal>
        </section>

        <section className="range-section" id="range">
          <Reveal className="range-head"><p className="section-index">03 / Built for the whole ecosystem</p><h2>One idea.<br /> <em>Every surface.</em></h2></Reveal>
          <div className="range-experience">
            <div className="range-tabs" role="tablist" aria-label="Explore play, collect, and grow">{rangeInsights.map((insight, index) => <button key={insight.id} id={`tab-${insight.id}`} role="tab" type="button" aria-selected={activeRange === insight.id} aria-controls={`panel-${insight.id}`} onClick={() => setActiveRange(insight.id as typeof activeRange)}><span>0{index + 1}</span><strong>{insight.title}</strong><small>{insight.kicker}</small></button>)}</div>
            <m.div key={range.id} id={`panel-${range.id}`} className="range-panel" role="tabpanel" aria-labelledby={`tab-${range.id}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="range-seed" data-mode={range.id} aria-hidden="true"><span /><i /><b /></div>
              <div><p className="project-kicker">{range.kicker}</p><h3>{range.statement}</h3><p>{range.brief}</p><ul>{range.proof.map((proof) => <li key={proof}>{proof}</li>)}</ul><button type="button" onClick={() => openInsight(range)}>Explore the full lens <span aria-hidden="true">↗</span></button></div>
            </m.div>
          </div>
        </section>

        <section className="industry-section" id="industry-proof">
          <Reveal className="industry-head"><p className="section-index">04 / Industry proof</p><h2>Trusted inside iconic worlds.</h2><p>Our range is not theoretical. We have earned trust across category-defining platforms, entertainment properties, consumer brands, and collectible ecosystems.</p></Reveal>
          <div className="partner-constellation">
            <div className="partner-core" aria-hidden="true"><b>B+S</b><span>ONE SYSTEM</span></div>
            <div className="partner-nodes" aria-label="Selected partners and properties">{partners.map((partner, index) => <button key={partner.name} type="button" className={activePartner.name === partner.name ? "active" : ""} data-category={partner.category} onMouseEnter={() => setActivePartner(partner)} onFocus={() => setActivePartner(partner)} onClick={() => setActivePartner(partner)}><span>{String(index + 1).padStart(2, "0")}</span>{partner.name}<small>{partner.category}</small></button>)}</div>
            <m.div className="partner-detail" key={activePartner.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} aria-live="polite"><span>{activePartner.category}</span><strong>{activePartner.name}</strong><p>{activePartner.note}</p></m.div>
          </div>
        </section>

        <section className="work-section" id="work">
          <Reveal className="work-head"><div><p className="section-index">05 / Selected case files</p><h2>Range is the proof.</h2></div><p>Six worlds. Six different constraints. One consistent instinct: find the defining idea, then build the system that protects it.</p></Reveal>
          <div className="case-grid">{caseStudies.map((study) => <FoilCard key={study.id} study={study} onOpen={() => openStudy(study)} />)}</div>
        </section>

        <section className="collab-section" id="collaboration">
          <Reveal className="collab-art">
            <img className="crayola-main" src={media("crayola-funny-faces-front.webp")} alt="Crayola Funny Faces Crazy Costumes product showing a virtual mask in use" width="1138" height="1480" loading="lazy" />
            <div className="mask-mosaic" aria-hidden="true">{Array.from({ length: 30 }, (_, index) => <i key={index} style={{ "--tile": index } as CSSProperties} />)}</div>
            <div className="crayola-inset"><img src={media("crayola-funny-faces-back.webp")} alt="Children mixing and wearing Crayola Color Alive virtual masks" width="1138" height="1480" loading="lazy" /></div>
            <span className="mask-count">LIVE<small>WEARABLE MASKS</small></span>
          </Reveal>
          <Reveal className="collab-copy" delay={0.08}><p className="section-index">06 / Physical becomes interactive</p><p className="project-kicker">Crayola Color Alive · Funny Faces—Crazy Costumes</p><h2>When the obvious route did not work, we made a new one.</h2><p>For this contract engagement, Stone translated supplied character assets into an interactive-ready art system. Bradd built the technical backbone for rigging, animation, and real-time behavior. Physical coloring became a playful app experience of scanned, animated, wearable virtual masks.</p><div className="role-pair"><p><b>STONE</b> art adaptation + visual continuity</p><p><b>BRADD</b> technical implementation + animation systems</p></div></Reveal>
        </section>

        <section className="depth-section" id="depth">
          <Reveal className="depth-head"><p className="section-index">07 / Individual depth</p><h2>Deep craft.<br /> Executive altitude.</h2></Reveal>
          <div className="dual-timeline" aria-label="Bradd and Stone leadership evidence">
            <div className="timeline-head"><button type="button" onClick={() => openInsight(leaderInsights.bradd)}><span>Creative Director</span><strong>BRADD</strong><small>Open profile ↗</small></button><i aria-hidden="true" /><button type="button" onClick={() => openInsight(leaderInsights.stone)}><span>Art Director</span><strong>STONE</strong><small>Open profile ↗</small></button></div>
            {depthTimeline.map((row, index) => <Reveal className="timeline-row" key={row.bradd.label}><article><span>{row.bradd.label}</span><strong>{row.bradd.value}</strong><p>{row.bradd.note}</p></article><div aria-hidden="true"><b>{String(index + 1).padStart(2, "0")}</b></div><article><span>{row.stone.label}</span><strong>{row.stone.value}</strong><p>{row.stone.note}</p></article></Reveal>)}
          </div>
          <div className="supporting-grid" aria-label="Additional selected projects">{supportingProof.map((item) => <article key={item.label} className={item.fit === "contain" ? "supporting-contain" : undefined}><img src={media(item.image)} alt={`${item.label} project artwork`} width="1280" height="720" loading="lazy" style={{ objectPosition: item.position }} /><div><strong>{item.label}</strong><span>{item.note}</span></div></article>)}</div>
        </section>

        <section className="mentorship-section" id="mentorship">
          <div className="mentorship-ripple" aria-hidden="true"><i /><i /><i /><b>B+S</b><span>TEAMS</span><span>STUDENTS</span><span>AUDIENCES</span></div>
          <Reveal className="mentorship-copy"><p className="section-index">08 / The work after the work</p><h2>We build people who build worlds.</h2><p className="mentorship-lede">Teaching keeps our point of view moving. Parenthood keeps the stakes human. Mentorship makes both visible in the way we lead.</p><div className="mentor-columns"><article><h3>BRADD / THE SYSTEM</h3><p>Adjunct professor in the Game Design MFA program at Laguna College of Art and Design, plus curriculum design and years developing artists, designers, and technical leaders inside production teams.</p></article><article><h3>STONE / THE PRACTICE</h3><p>Guest lectures, talks, mock interviews, and portfolio reviews that help emerging creators turn raw voice into professional momentum.</p></article></div><blockquote>“The next generation is not an audience we speculate about. It is one we teach, mentor, raise, and listen to.”</blockquote></Reveal>
        </section>

        <section className="contact-section" id="contact">
          <div className="final-seal" aria-hidden="true"><span>B+S</span><i>PLAY · COLLECT · GROW</i></div>
          <Reveal><p className="section-index">09 / A new world starts with a conversation</p><h2>Let&apos;s build<br /> <em>what&apos;s next.</em></h2><p>Bring us the property, the possibility, or the production problem that deserves a stronger creative system.</p><div className="contact-actions"><a className="primary-action" href="mailto:bradd.mcbrearty@gmail.com">Start a conversation <span>↗</span></a><div className="social-actions"><a className="social-button" href="https://www.linkedin.com/in/braddmcbrearty/" target="_blank" rel="noopener noreferrer"><span>Bradd on LinkedIn</span><b>↗</b></a><a className="social-button" href="https://www.linkedin.com/in/stone/" target="_blank" rel="noopener noreferrer"><span>Stone on LinkedIn</span><b>↗</b></a></div></div></Reveal>
          <footer><span>BRADD + STONE</span><span>Creative leadership for games, brands &amp; entertainment</span><span>2026</span></footer>
        </section>
      </main>

      <DetailDialog detail={detail} onDismiss={() => setDetail(null)} />
    </LazyMotion>
  );
}
