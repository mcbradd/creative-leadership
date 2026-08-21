import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent, type ReactNode } from "react";
import { LazyMotion, MotionConfig, m, useReducedMotion } from "motion/react";
import { detectExperienceTier } from "./experience";
import { HERO_PARAMS, heroParams, setHeroParam, type HeroParamId } from "./hero/params";
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

const loadMotionFeatures = () => import("./motionFeatures").then((module) => module.default);
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const media = (file: string) => `${basePath}/media/${file}`;
const stylizeNames = (value: string) => value.replace(/\bBradd\b/g, "BRADD").replace(/\bStone\b/g, "STONE");

type Detail = (CaseStudy & { detailType: "case" }) | (Insight & { detailType: "insight" });
type RangeId = "play" | "collect" | "grow";
type Notice = { id: number; message: string; kind: "success" | "info" };

const navItems = [
  { href: "#team", index: "01", label: "The partnership", detail: "Why the two leaders are stronger as one system." },
  { href: "#proof", index: "02", label: "Proven together", detail: "The complete Tetris Beat recovery and release story." },
  { href: "#range", index: "03", label: "Play · Collect · Grow", detail: "How one idea moves across products and formats." },
  { href: "#work", index: "05", label: "Selected case files", detail: "Six contextual stories with roles, actions, and evidence." },
  { href: "#depth", index: "07", label: "Individual depth", detail: "Equal seniority, distinct proof, shared standards." },
] as const;

const presentationSlides = [
  { id: "top", label: "Opening" },
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

function trapDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== "Tab") return;
  const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>("a[href]:not([tabindex='-1']), button:not([disabled]):not([tabindex='-1']), [tabindex]:not([tabindex='-1'])")].filter((node) => node.getClientRects().length > 0);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return <m.div className={`reveal ${className}`} initial={reduceMotion ? false : { opacity: 0, y: 24 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</m.div>;
}

function FoilCard({ study, onOpen }: { study: CaseStudy; onOpen: () => void }) {
  const handlePointer = (event: PointerEvent<HTMLButtonElement>) => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
    event.currentTarget.style.setProperty("--rx", `${y * -3.5}deg`);
    event.currentTarget.style.setProperty("--ry", `${x * 4}deg`);
  };
  const resetPointer = (event: PointerEvent<HTMLButtonElement>) => { event.currentTarget.style.setProperty("--rx", "0deg"); event.currentTarget.style.setProperty("--ry", "0deg"); };

  return (
    <button className={`case-card owner-${study.owner.toLowerCase()}`} type="button" onPointerMove={handlePointer} onPointerLeave={resetPointer} onClick={onOpen} aria-label={`Open the complete ${study.title} case file`}>
      <img src={media(study.image)} alt={study.alt} loading="lazy" width="1280" height="720" style={{ objectPosition: study.imagePosition ?? "center" }} />
      <span className="case-wash" aria-hidden="true" />
      <span className="case-content"><span className="case-owner">{stylizeNames(study.owner)} · {study.role}</span><strong>{stylizeNames(study.title)}</strong><span className="case-statement">{stylizeNames(study.statement)}</span><span className="case-open">Open complete case file <b aria-hidden="true">↗</b></span></span>
    </button>
  );
}

function LeaderCard({ leader, onOpen }: { leader: "bradd" | "stone"; onOpen: () => void }) {
  const isBradd = leader === "bradd";
  const handlePointer = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty("--card-x", `${x * 4}deg`);
    event.currentTarget.style.setProperty("--card-y", `${y * -3.5}deg`);
    event.currentTarget.style.setProperty("--shine-x", `${(x + 0.5) * 100}%`);
    event.currentTarget.style.setProperty("--shine-y", `${(y + 0.5) * 100}%`);
  };

  return (
    <button className={`leader-card leader-${leader}`} type="button" onPointerMove={handlePointer} onPointerLeave={(event) => { event.currentTarget.style.setProperty("--card-x", "0deg"); event.currentTarget.style.setProperty("--card-y", "0deg"); event.currentTarget.style.setProperty("--shine-x", "50%"); event.currentTarget.style.setProperty("--shine-y", "20%"); }} onClick={onOpen} aria-label={`Open the complete ${isBradd ? "BRADD McBrearty" : "STONE Perales"} leadership profile`}>
      <span className="portrait-wrap"><img src={media(`${leader}-portrait.webp`)} alt={isBradd ? "BRADD McBrearty" : "STONE Perales"} width="1122" height="1402" /><span className="portrait-sheen" aria-hidden="true" /></span>
      <span className="leader-foil" aria-hidden="true" />
      <span className="leader-index">{isBradd ? "01" : "02"} / {isBradd ? "CREATIVE + PRODUCT" : "ART + FRANCHISE"}</span>
      <span className="leader-copy"><span className="leader-role">{isBradd ? "Creative Director" : "Art Director"}</span><strong>{isBradd ? "BRADD McBrearty" : "STONE Perales"}</strong><span>{isBradd ? "Game design · Product strategy · Technical direction · Production systems" : "Worldbuilding · Visual identity · Franchise systems · Licensed products"}</span><span className="leader-open">Open complete profile <b aria-hidden="true">↗</b></span></span>
    </button>
  );
}

function LeaderDeck({ onOpen }: { onOpen: (leader: "bradd" | "stone") => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeLeader, setActiveLeader] = useState(0);
  const reduceMotion = useReducedMotion();
  const moveTo = (index: number) => {
    const next = Math.max(0, Math.min(1, index));
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: next * (track.clientWidth + 12), behavior: reduceMotion ? "auto" : "smooth" });
    setActiveLeader(next);
  };

  return (
    <div className="leader-deck">
      <div ref={trackRef} className="leader-grid" role="region" aria-label="Leader profiles: BRADD McBrearty and STONE Perales" onScroll={(event) => setActiveLeader(event.currentTarget.scrollLeft > event.currentTarget.clientWidth * 0.5 ? 1 : 0)}>
        <Reveal><LeaderCard leader="bradd" onOpen={() => onOpen("bradd")} /></Reveal>
        <Reveal delay={0.08}><LeaderCard leader="stone" onOpen={() => onOpen("stone")} /></Reveal>
      </div>
      <div className="leader-deck-cue">
        <span>{String(activeLeader + 1).padStart(2, "0")} / 02</span>
        <p>{activeLeader === 0 ? "Next: STONE" : "Compare: BRADD"}</p>
        <div>
          <button type="button" onClick={() => moveTo(activeLeader - 1)} disabled={activeLeader === 0} aria-label="Show BRADD profile">←</button>
          <button type="button" onClick={() => moveTo(activeLeader + 1)} disabled={activeLeader === 1} aria-label="Show STONE profile">→</button>
        </div>
      </div>
    </div>
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
      requestAnimationFrame(() => dialog.querySelector<HTMLButtonElement>(".dialog-close")?.focus());
    } else if (!detail && dialog.open) dialog.close();
  }, [detail]);

  const restore = () => {
    document.body.classList.remove("modal-open");
    window.scrollTo({ top: savedScroll.current, behavior: "instant" });
    lastTrigger.current?.focus({ preventScroll: true });
  };

  return (
    <dialog ref={dialogRef} className="detail-dialog" aria-modal="true" aria-labelledby="detail-title" aria-describedby="detail-summary" onCancel={(event) => { event.preventDefault(); onDismiss(); }} onClose={restore} onKeyDown={trapDialogFocus}>
      {detail && (
        <article className="dialog-panel" data-fit-check>
          <header className="dialog-toolbar"><div><span>{detail.detailType === "case" ? "Complete case file" : "Complete leadership lens"}</span><small>{stylizeNames(detail.detailType === "case" ? `${detail.owner} · ${detail.role}` : detail.kicker)}</small></div><button className="dialog-close" type="button" onClick={onDismiss}>Close <span aria-hidden="true">×</span></button></header>
          {detail.detailType === "case" ? <div className="dialog-image"><img src={media(detail.image)} alt={stylizeNames(detail.alt)} width="1280" height="720" style={{ objectPosition: detail.imagePosition ?? "center" }} /><span>{stylizeNames(detail.eyebrow)}</span></div> : <div className="dialog-concept" aria-hidden="true"><span>{detail.title.slice(0, 1)}</span><i /><b /></div>}
          <div className="dialog-body">
            <p className="dialog-kicker">{stylizeNames(detail.detailType === "case" ? `${detail.owner} · ${detail.role}` : detail.kicker)}</p><h2 id="detail-title">{stylizeNames(detail.title)}</h2><p className="dialog-statement" id="detail-summary">{stylizeNames(detail.statement)}</p>
            <div className="dialog-context-grid"><section><h3>01 / The situation</h3><p>{stylizeNames(detail.brief)}</p></section><section><h3>02 / Why it matters</h3><p>{stylizeNames(detail.relevance)}</p></section></div>
            <section className="dialog-section"><h3>03 / {detail.detailType === "case" ? "What the leader did" : "How we lead it"}</h3><ol>{detail.moves.map((move) => <li key={move}>{stylizeNames(move)}</li>)}</ol></section>
            <section className="dialog-section dialog-evidence"><h3>04 / Evidence in context</h3><ul>{detail.proof.map((proof) => <li key={proof}>{stylizeNames(proof)}</li>)}</ul></section>
            <div className="dialog-end"><p>Situation, contribution, evidence, and relevance are kept together so this case can be understood without prior knowledge of either résumé.</p><button type="button" onClick={onDismiss}>Return to the story <span aria-hidden="true">↓</span></button></div>
          </div>
        </article>
      )}
      <button className="dialog-backdrop-close" type="button" tabIndex={-1} aria-label="Close detail dialog" onClick={onDismiss} />
    </dialog>
  );
}

function NavigationDialog({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const destination = useRef<string | null>(null);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      destination.current = null;
      lastTrigger.current = document.activeElement as HTMLElement;
      document.body.classList.add("modal-open");
      dialog.showModal();
      requestAnimationFrame(() => dialog.querySelector<HTMLButtonElement>(".nav-close")?.focus());
    } else if (!open && dialog.open) dialog.close();
  }, [open]);
  const restore = () => {
    document.body.classList.remove("modal-open");
    const href = destination.current;
    destination.current = null;
    if (!href) { lastTrigger.current?.focus({ preventScroll: true }); return; }
    const section = document.querySelector<HTMLElement>(href);
    if (!section) return;
    window.history.pushState(null, "", href);
    section.scrollIntoView({ block: "start", behavior: reduceMotion ? "instant" : "smooth" });
    const focusTarget = section.querySelector<HTMLElement>("h2") ?? section;
    const previousTabIndex = focusTarget.getAttribute("tabindex");
    focusTarget.setAttribute("tabindex", "-1");
    requestAnimationFrame(() => {
      focusTarget.focus({ preventScroll: true });
      focusTarget.addEventListener("blur", () => {
        if (previousTabIndex === null) focusTarget.removeAttribute("tabindex");
        else focusTarget.setAttribute("tabindex", previousTabIndex);
      }, { once: true });
    });
  };
  const navigate = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    destination.current = href;
    onDismiss();
  };

  return (
    <dialog ref={dialogRef} id="presentation-navigation" className="nav-dialog" aria-modal="true" aria-labelledby="nav-title" onCancel={(event) => { event.preventDefault(); onDismiss(); }} onClose={restore} onKeyDown={trapDialogFocus}>
      <div className="nav-panel" data-fit-check><header><div><span>BRADD + STONE</span><h2 id="nav-title">Explore the story</h2></div><button className="nav-close" type="button" onClick={onDismiss}>Close <span aria-hidden="true">×</span></button></header><nav aria-label="Presentation chapters">{navItems.map((item) => <a key={item.href} href={item.href} onClick={(event) => navigate(event, item.href)}><span>{item.index}</span><strong>{item.label}</strong><small>{item.detail}</small><b aria-hidden="true">↘</b></a>)}</nav><a className="nav-contact" href="#contact" onClick={(event) => navigate(event, "#contact")}>Start a conversation <span aria-hidden="true">↗</span></a></div>
      <button className="dialog-backdrop-close" type="button" tabIndex={-1} aria-label="Close presentation navigation" onClick={onDismiss} />
    </dialog>
  );
}

function Toast({ notice, onDismiss }: { notice: Notice | null; onDismiss: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const dismissRef = useRef(onDismiss);
  useEffect(() => { dismissRef.current = onDismiss; }, [onDismiss]);
  useEffect(() => {
    if (!notice || hovered || focusWithin) return;
    const timeout = window.setTimeout(() => dismissRef.current(), 4200);
    return () => window.clearTimeout(timeout);
  }, [focusWithin, hovered, notice]);

  return <div className={`toast${notice ? " toast-visible" : ""}`} data-kind={notice?.kind ?? "info"} data-fit-check onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} onFocusCapture={() => setFocusWithin(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false); }}><span aria-hidden="true">{notice?.kind === "success" ? "✓" : "i"}</span><p role="status" aria-live="polite" aria-atomic="true">{notice && <span key={notice.id}>{notice.message}</span>}</p><button type="button" aria-label="Dismiss notification" aria-hidden={!notice} disabled={!notice} tabIndex={notice ? 0 : -1} onClick={onDismiss}>×</button></div>;
}

function PresentationCue() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const nodes = presentationSlides.map((slide) => document.getElementById(slide.id)).filter((node): node is HTMLElement => Boolean(node));
    const visibility = new Map<Element, number>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) visibility.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
      let bestIndex = 0;
      let bestRatio = -1;
      for (const [index, node] of nodes.entries()) {
        const ratio = visibility.get(node) ?? 0;
        if (ratio > bestRatio) { bestRatio = ratio; bestIndex = index; }
      }
      if (bestRatio > 0) setActive(bestIndex);
    }, { rootMargin: "-12% 0px -34% 0px", threshold: [0, 0.2, 0.4, 0.6, 0.8] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const moveTo = (index: number) => {
    const next = Math.max(0, Math.min(presentationSlides.length - 1, index));
    const slide = presentationSlides[next];
    const node = document.getElementById(slide.id);
    if (!node) return;
    node.scrollTop = 0;
    if (next === 0) window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    else node.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
    window.history.replaceState(null, "", `#${slide.id}`);
    setActive(next);
    const focusTarget = node.querySelector<HTMLElement>("h1, h2") ?? node;
    focusTarget.tabIndex = -1;
    focusTarget.focus({ preventScroll: true });
  };

  const slide = presentationSlides[active];
  const current = String(active + 1).padStart(2, "0");
  const total = String(presentationSlides.length).padStart(2, "0");
  return (
    <nav className="presentation-cue" aria-label="Presentation slide navigation" style={{ "--slide-progress": `${((active + 1) / presentationSlides.length) * 100}%` } as CSSProperties}>
      <button type="button" onClick={() => moveTo(active - 1)} disabled={active === 0} aria-label="Previous slide"><span className="cue-arrow cue-arrow-up" aria-hidden="true" /></button>
      <p aria-current="step"><span>{current} / {total}</span><strong>{slide.label}</strong></p>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">Slide {current} of {total}: {slide.label}</span>
      <i className="cue-meter" aria-hidden="true"><b /></i>
      <button type="button" onClick={() => moveTo(active + 1)} disabled={active === presentationSlides.length - 1} aria-label="Next slide"><span className="cue-arrow cue-arrow-down" aria-hidden="true" /></button>
    </nav>
  );
}

function useHeroMotionGate() {
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const hero = ref.current;
    if (!hero) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let intersects = false;
    let observer: IntersectionObserver | null = null;
    const sync = () => {
      const next = reduced.matches ? "reduced" : intersects && document.visibilityState === "visible" ? "active" : "paused";
      if (hero.dataset.motion !== next) hero.dataset.motion = next;
      setActive(next === "active");
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(([entry]) => { intersects = Boolean(entry?.isIntersecting); sync(); });
      observer.observe(hero);
    } else intersects = true;

    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer?.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return { ref, active };
}

const HeroVoid = lazy(() => import("./hero/HeroExperience"));

class HeroVoidBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

// The lensed backdrop is an upgrade over the CSS teaser, never a dependency of
// it: any probe failure, shader failure or lost context drops silently back.
function useLensedBackdrop() {
  const [tier] = useState(detectExperienceTier);
  const [failed, setFailed] = useState(false);
  const disable = useCallback(() => setFailed(true), []);
  return { enabled: !failed && (tier === "webgl" || tier === "webgpu"), disable };
}

function HeroInstruments() {
  const [values, setValues] = useState(() => ({ ...heroParams }));
  const set = (id: HeroParamId, next: number) => {
    // The renderer polls heroParams every frame; state only mirrors it for the
    // readouts, so the canvas never remounts mid-drag.
    setHeroParam(id, next);
    setValues((current) => ({ ...current, [id]: next }));
  };
  return (
    <div className="hero-instruments">
      <div className="hero-console">
        <p className="console-title">Simulation feed<span>Event horizon proximity</span></p>
        {HERO_PARAMS.map((param) => (
          // The bar itself is the control: the range input covers it invisibly,
          // so the fill is the only affordance and the handle is redundant.
          <label key={param.id} className="console-row" style={{ "--fill": `${((values[param.id] - param.min) / (param.max - param.min)) * 100}%` } as CSSProperties}>
            <span>{param.label}</span>
            <b>{param.format(values[param.id])}</b>
            <input type="range" min={param.min} max={param.max} step={param.step} value={values[param.id]} onChange={(event) => set(param.id, Number(event.target.value))} />
          </label>
        ))}
      </div>
      <div className="hero-readout" aria-hidden="true">
        <p className="console-title">Gravitational well<span>Sagittarius A*</span></p>
        <p><i>Distance</i><b>26,700 LY</b></p>
        <p><i>Diameter</i><b>~{Math.round(251 * values.gravity)} AU</b></p>
        <p><i>Mass</i><b>{(4.31 * values.gravity).toFixed(2)}M☉</b></p>
        <p><i>Spaghettification</i><b>{values.gravity > 1.4 ? "Active" : "Nominal"}</b></p>
      </div>
    </div>
  );
}

function HeroSection() {
  const { ref: heroRef, active } = useHeroMotionGate();
  const { enabled, disable } = useLensedBackdrop();
  return (
    <section ref={heroRef} className="hero" id="top" data-motion="idle" data-static={enabled ? "false" : "true"} data-enhanced="true">
      {enabled && (
        <HeroVoidBoundary onFailure={disable}>
          <Suspense fallback={null}><HeroVoid active={active} onFailure={disable} /></Suspense>
        </HeroVoidBoundary>
      )}
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-light-field" aria-hidden="true"><i /><i /></div>
      <div className="hero-orbit" aria-hidden="true"><span /><i /></div>
      <div className="hero-shell">
        <div className="hero-copy">
          <p className="eyebrow">Two disciplines. One leadership system.</p>
          <h1>We turn IP into worlds people can <em className="hero-payoff" data-color-flow="payoff">play, collect, and grow.</em></h1>
          <div className="hero-footer"><p>Creative direction, art direction, game systems, and franchise thinking—built to move from first idea to market-ready experience.</p><a className="hero-enter" href="#team"><span>Super-Powers Combined</span></a></div>
          <div className="hero-signals" aria-hidden="true"><span>Original voice</span><i /><span>Product reality</span><i /><span>Durable world</span></div>
        </div>
        <HeroInstruments />
      </div>
    </section>
  );
}

export default function App() {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [activeRange, setActiveRange] = useState<RangeId>("play");
  const [activePartner, setActivePartner] = useState(partners[0]);
  const [navOpen, setNavOpen] = useState(false);
  const [toast, setToast] = useState<Notice | null>(null);
  const noticeId = useRef(0);
  const openInsight = (insight: Insight) => setDetail({ ...insight, detailType: "insight" });
  const openStudy = (study: CaseStudy) => setDetail({ ...study, detailType: "case" });
  const range = rangeInsights.find((item) => item.id === activeRange) ?? rangeInsights[0];
  const rangeVisual = rangeVisuals[activeRange];

  const showNotice = (message: string, kind: Notice["kind"]) => setToast({ id: ++noticeId.current, message, kind });
  const copyEmail = async () => {
    const email = "bradd.mcbrearty@gmail.com";
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(email);
      else {
        const field = document.createElement("textarea");
        field.value = email;
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.append(field);
        field.select();
        const copied = document.execCommand("copy");
        field.remove();
        if (!copied) throw new Error("Clipboard command was unavailable");
      }
      showNotice("Email copied. You can paste it into any message.", "success");
    } catch { showNotice(`Copy was unavailable. Email: ${email}`, "info"); }
  };
  const selectRangeFromKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % rangeInsights.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + rangeInsights.length) % rangeInsights.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = rangeInsights.length - 1;
    else return;
    event.preventDefault();
    setActiveRange(rangeInsights[next].id as RangeId);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  };
  const selectPartnerFromKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % partners.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + partners.length) % partners.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = partners.length - 1;
    else return;
    event.preventDefault();
    setActivePartner(partners[next]);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  };

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main-content">Skip to content</a><div className="ambient" aria-hidden="true" />
      <header className="topbar"><a className="wordmark" href="#top" aria-label="BRADD and STONE, back to top"><span className="wordmark-long">BRADD <i>+</i> STONE</span></a><nav className="desktop-nav" aria-label="Primary navigation"><a href="#team">Partnership</a><a href="#proof">Proof</a><a href="#work">Case files</a></nav><div className="top-actions"><a className="top-cta" href="#contact"><span className="cta-long">Start a project</span><span className="cta-short">Start</span> <b aria-hidden="true">↘</b></a><button className="menu-button" type="button" aria-label="Open presentation navigation" aria-expanded={navOpen} aria-controls="presentation-navigation" onClick={() => setNavOpen(true)}><span>Explore</span><i aria-hidden="true" /><i aria-hidden="true" /></button></div></header>
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <section className="capability-section" id="capabilities"><div className="section-shell capability-shell"><div className="capability-lead"><p className="section-index">What we lead</p><p>Each lens opens a complete explanation—not a résumé fragment.</p></div><nav className="signal-strip" aria-label="Explore leadership capabilities">{capabilityInsights.map((insight, index) => <button key={insight.id} type="button" onClick={() => openInsight(insight)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{insight.title}</strong><small>{insight.kicker}</small><b aria-hidden="true">↗</b></button>)}</nav></div></section>
        <section className="team-section" id="team"><div className="section-shell"><Reveal className="section-intro"><p className="section-index">01 / The partnership</p><h2>Two leaders.<br /><em className="lava-flow">One way through.</em></h2><p>STONE makes a world coherent, ownable, and unmistakable. BRADD makes it playable, scalable, and commercially real. Both lead systems, people, and the creative standard.</p></Reveal><LeaderDeck onOpen={(leader) => openInsight(leaderInsights[leader])} /><div className="partnership-line"><p>Different lenses.</p><i aria-hidden="true" /><p>Shared standards.</p><i aria-hidden="true" /><p>One accountable team.</p></div></div></section>
        <section className="proof-section" id="proof"><div className="section-shell proof-layout"><Reveal className="proof-copy"><p className="section-index">02 / Proven together</p><p className="project-kicker">Apple Arcade · Tetris Beat</p><h2>Not two résumés.<br /><em className="lava-flow">One shipped result.</em></h2><p>An at-risk production needed one coherent creative and production system. STONE established the visual language and led the art vision. BRADD helped rebuild the technical framework and production path. The wider team used those shared standards to turn fragmented work into a scalable, released game.</p><div className="production-build" role="group" aria-label="Internally reported Tetris Beat production context"><div><span>01</span><strong>5-day</strong><small>recovery sprint</small></div><div><span>02</span><strong>20+</strong><small>artists aligned</small></div><div><span>03</span><strong>28</strong><small>live levels</small></div></div><p className="proof-footnote">Internal production record. Shipped eight months later; internal reporting says the game remained at or near the top of Apple Arcade for 6+ weeks.</p><button className="text-action" type="button" onClick={() => openInsight(jointInsights.tetris)}>Open the complete joint case <span aria-hidden="true">↗</span></button></Reveal><Reveal delay={0.08}><button className="proof-visual" type="button" onClick={() => openInsight(jointInsights.tetris)} aria-label="Open the complete Tetris Beat joint case file"><span className="proof-cover"><img src={media("tetris-beat-cover.webp")} alt="Tetris Beat official cover artwork and logo" width="1080" height="1080" /><small>Official brand mark · STONE Perales</small></span><span className="proof-gameplay"><img src={media("tetris-beat-gameplay.webp")} alt="Tetris Beat shipped gameplay screen" width="1280" height="720" loading="lazy" /><small>Shipped gameplay</small></span><span className="proof-stamp">SHIPPED<br />TOGETHER</span><span className="proof-open">Open complete case ↗</span></button></Reveal></div></section>
        <section className="range-section" id="range"><div className="section-shell"><Reveal className="range-head"><p className="section-index">03 / Built for the whole ecosystem</p><h2>One idea.<br /> <em className="lava-flow">Every surface.</em></h2><p>Play makes the promise tangible. Collect makes it desirable in the hand. Grow gives the world rules strong enough to survive every new format.</p></Reveal><div className="range-experience"><div className="range-tabs" role="tablist" aria-label="Explore play, collect, and grow">{rangeInsights.map((insight, index) => <button key={insight.id} id={`tab-${insight.id}`} role="tab" type="button" tabIndex={activeRange === insight.id ? 0 : -1} aria-selected={activeRange === insight.id} aria-controls="range-panel" onClick={() => setActiveRange(insight.id as RangeId)} onKeyDown={(event) => selectRangeFromKey(event, index)}><span>0{index + 1}</span><strong>{stylizeNames(insight.title)}</strong><small>{stylizeNames(insight.kicker)}</small></button>)}</div><m.div key={range.id} id="range-panel" className="range-panel" role="tabpanel" aria-labelledby={`tab-${range.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}><button className="range-visual" type="button" onClick={() => openInsight(range)} aria-label={`Open the complete ${range.title} leadership lens`}><img src={media(rangeVisual.image)} alt={rangeVisual.alt} width="1280" height="720" style={{ objectPosition: rangeVisual.position }} /><span>{stylizeNames(rangeVisual.label)}</span><b aria-hidden="true">Open lens ↗</b></button><div className="range-copy"><p className="project-kicker">{stylizeNames(range.kicker)}</p><h3>{stylizeNames(range.statement)}</h3><p>{stylizeNames(range.brief)}</p><ul>{range.proof.slice(0, 2).map((proof) => <li key={proof}>{stylizeNames(proof)}</li>)}</ul><button className="text-action" type="button" onClick={() => openInsight(range)}>Read the complete {range.title.toLowerCase()} answer <span aria-hidden="true">↗</span></button></div></m.div></div></div></section>
        <section className="industry-section" id="industry-proof"><div className="section-shell"><Reveal className="industry-head"><p className="section-index">04 / Industry proof</p><h2>Recognizable worlds.<br /><em className="lava-flow">Specific contributions.</em></h2><p>Select any relationship to see who was involved, what kind of engagement it was, and the contribution the name is actually supporting.</p></Reveal><div className="partner-explorer"><div className="partner-nodes" role="tablist" aria-label="Selected partners, properties, and production contexts">{partners.map((partner, index) => <button key={partner.name} id={`partner-tab-${index}`} role="tab" type="button" tabIndex={activePartner.name === partner.name ? 0 : -1} className={activePartner.name === partner.name ? "active" : ""} data-category={partner.category} aria-selected={activePartner.name === partner.name} aria-controls="partner-detail" onClick={() => setActivePartner(partner)} onKeyDown={(event) => selectPartnerFromKey(event, index)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{partner.name}</strong><small>{stylizeNames(partner.owner)} · {partner.relationship}</small></button>)}</div><article className="partner-detail" id="partner-detail" role="tabpanel" aria-labelledby={`partner-tab-${partners.indexOf(activePartner)}`} aria-live="polite" aria-atomic="true"><m.div key={activePartner.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><span>{activePartner.category} / {stylizeNames(activePartner.owner)}</span><strong>{activePartner.name}</strong><small>{activePartner.relationship}</small><p>{stylizeNames(activePartner.note)}</p><em>Contribution shown in context—not an endorsement claim.</em></m.div></article></div></div></section>
        <section className="work-section" id="work"><div className="section-shell"><Reveal className="work-head"><div><p className="section-index">05 / Selected case files</p><h2>Range is<br /><em className="lava-flow">the proof.</em></h2></div><p>Six worlds. Six different constraints. Every card opens the full situation, individual contribution, evidence, and executive relevance.</p></Reveal><div className="case-grid">{caseStudies.map((study) => <FoilCard key={study.id} study={study} onOpen={() => openStudy(study)} />)}</div></div></section>
        <section className="collab-section" id="collaboration"><div className="section-shell collab-layout"><Reveal className="collab-copy"><p className="section-index">06 / Physical becomes interactive</p><p className="project-kicker">Crayola Color Alive · Funny Faces—Crazy Costumes</p><h2>When the obvious route failed,<br /><em className="lava-flow">they made a new one.</em></h2><p>In this uncredited contract engagement, STONE adapted supplied character assets for the interactive format. BRADD built the technical backbone for rigging, animation, and real-time behavior. Physical coloring became a scanned, animated, wearable virtual-mask experience.</p><div className="role-pair"><p><b>STONE</b><span>Art adaptation + visual continuity</span></p><p><b>BRADD</b><span>Technical implementation + animation systems</span></p></div><button className="text-action" type="button" onClick={() => openInsight(jointInsights.crayola)}>Open the complete contract case <span aria-hidden="true">↗</span></button></Reveal><Reveal delay={0.08}><button className="collab-art" type="button" onClick={() => openInsight(jointInsights.crayola)} aria-label="Open the complete Crayola contract case"><img className="crayola-main" src={media("crayola-funny-faces-front.webp")} alt="Crayola Funny Faces product showing a virtual mask in use" width="1138" height="1480" loading="lazy" /><div className="mask-mosaic" aria-hidden="true">{Array.from({ length: 30 }, (_, index) => <i key={index} style={{ "--tile": index } as CSSProperties} />)}</div><span className="crayola-inset"><img src={media("crayola-funny-faces-back.webp")} alt="Children mixing and wearing Crayola Color Alive virtual masks" width="1138" height="1480" loading="lazy" /></span><span className="mask-count">PHYSICAL<small>→ INTERACTIVE</small></span><span className="collab-open">Open complete case ↗</span></button></Reveal></div></section>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the horizontal evidence scroller needs a keyboard focus stop */}
        <section className="depth-section" id="depth"><div className="section-shell"><Reveal className="depth-head"><p className="section-index">07 / Individual depth</p><h2 id="depth-title">Deep craft.<br /> <em className="lava-flow">Executive altitude.</em></h2><p>Equal leadership weight does not require matching résumés. It requires equally specific evidence, complementary judgment, and the ability to operate at the same level.</p></Reveal><div className="depth-stage"><div className="dual-timeline" role="group" aria-label="BRADD and STONE leadership evidence"><div className="timeline-head"><button type="button" onClick={() => openInsight(leaderInsights.bradd)}><span>Creative Director</span><strong>BRADD</strong><small>Open complete profile ↗</small></button><button type="button" onClick={() => openInsight(leaderInsights.stone)}><span>Art Director</span><strong>STONE</strong><small>Open complete profile ↗</small></button></div><div className="timeline-track" role="region" aria-label="Paged leadership evidence" tabIndex={0}>{depthTimeline.map((row, index) => <Reveal className="timeline-row" key={row.bradd.label}><span className="timeline-index">{String(index + 1).padStart(2, "0")}</span><article><small className="timeline-owner">BRADD</small><span>{row.bradd.label}</span><strong>{row.bradd.value}</strong><p>{row.bradd.note}</p></article><article><small className="timeline-owner">STONE</small><span>{row.stone.label}</span><strong>{row.stone.value}</strong><p>{row.stone.note}</p></article></Reveal>)}</div></div><div className="supporting-grid" role="group" aria-label="Additional selected project evidence">{supportingProof.map((item) => <button key={item.id} type="button" className={`supporting-card${item.fit === "contain" ? " supporting-contain" : ""}`} onClick={() => openInsight(item)} aria-label={`Open complete context for ${stylizeNames(item.title)}`}><img src={media(item.image)} alt={`${stylizeNames(item.label)} project artwork`} width="1280" height="720" loading="lazy" style={{ objectPosition: item.position }} /><span className="supporting-caption"><strong>{stylizeNames(item.label)}</strong><span>{stylizeNames(item.note)}</span><em>Open complete context ↗</em></span></button>)}</div></div></div></section>
        <section className="mentorship-section" id="mentorship"><div className="section-shell mentorship-layout"><div className="mentorship-ripple" aria-hidden="true"><i /><i /><i /><span>JUDGMENT</span><span>TEAMS</span><span>AUDIENCES</span></div><Reveal className="mentorship-copy"><p className="section-index">08 / Leadership after the launch</p><h2>Leave the team<br /><em className="lava-flow">stronger.</em></h2><p className="mentorship-lede">Teaching, critique, and mentorship are not side notes. They show how BRADD and STONE transfer judgment so quality does not depend on their constant presence.</p><div className="mentor-columns"><button type="button" onClick={() => openInsight(leaderInsights.bradd)}><h3>BRADD / THE SYSTEM</h3><p>Game Design MFA faculty at LCAD, curriculum work, and years developing artists, designers, and technical leaders inside production teams.</p><span>Open BRADD&apos;s complete context ↗</span></button><button type="button" onClick={() => openInsight(leaderInsights.stone)}><h3>STONE / THE PRACTICE</h3><p>Teaching, guest lectures, talks, mock interviews, and portfolio reviews that help emerging creators turn raw voice into professional momentum.</p><span>Open STONE&apos;s complete context ↗</span></button></div><blockquote>Creative leadership succeeds when the team can make better decisions after the leaders leave the room.</blockquote></Reveal></div></section>
        <section className="contact-section" id="contact"><div className="section-shell"><Reveal><p className="section-index">09 / A new world starts with a conversation</p><h2>Let&apos;s build<br /> <em className="lava-flow">what&apos;s next.</em></h2><p>Bring us the property, product opportunity, or production problem that needs one coherent creative system.</p><div className="contact-actions"><a className="primary-action" href="mailto:bradd.mcbrearty@gmail.com">Start a conversation <span aria-hidden="true">↗</span></a><button className="copy-action" type="button" onClick={copyEmail}>Copy email <span aria-hidden="true">＋</span></button><div className="social-actions"><a className="social-button" href="https://www.linkedin.com/in/braddmcbrearty/" target="_blank" rel="noopener noreferrer"><span>BRADD on LinkedIn</span><b aria-hidden="true">↗</b></a><a className="social-button" href="https://www.linkedin.com/in/stone/" target="_blank" rel="noopener noreferrer"><span>STONE on LinkedIn</span><b aria-hidden="true">↗</b></a></div></div></Reveal><footer><span>BRADD + STONE</span><span>Creative leadership for games, brands &amp; entertainment</span><span>2026</span></footer></div></section>
      </main>
      <PresentationCue />
      <DetailDialog detail={detail} onDismiss={() => setDetail(null)} /><NavigationDialog open={navOpen} onDismiss={() => setNavOpen(false)} /><Toast notice={toast} onDismiss={() => setToast(null)} />
      </MotionConfig>
    </LazyMotion>
  );
}
