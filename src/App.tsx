import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent, type ReactNode } from "react";
import { LazyMotion, MotionConfig, m, useReducedMotion } from "motion/react";
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

type Detail = (CaseStudy & { detailType: "case" }) | (Insight & { detailType: "insight" });
type RangeId = "play" | "collect" | "grow";
type Notice = { id: number; message: string; kind: "success" | "info" };

type HeroScene = "proposition" | "partnership" | "translation" | "proof";
const heroChapters = [
  { id: "proposition", label: "The promise", title: "One accountable creative system.", body: "Bradd + Stone is a creative leadership team for games, brands, and entertainment—built to carry one strong idea from audience promise to market-ready experience." },
  { id: "partnership", label: "The partnership", title: "Two leaders. Equal weight.", body: "Stone establishes the visual truth and franchise grammar. Bradd connects that truth to play, product, technology, production, and the team required to ship it." },
  { id: "translation", label: "The value", title: "Play. Collect. Grow.", body: "Together they turn audience desire into a playable experience, a compelling object, and a durable creative system that can expand without losing its center." },
  { id: "proof", label: "The evidence", title: "Already proven under pressure.", body: "On Tetris Beat, complementary visual, technical, and production leadership helped a wider team turn fragmented work into one scalable game that shipped on Apple Arcade." },
] as const;

const navItems = [
  { href: "#team", index: "01", label: "The partnership", detail: "Why the two leaders are stronger as one system." },
  { href: "#proof", index: "02", label: "Proven together", detail: "The complete Tetris Beat recovery and release story." },
  { href: "#range", index: "03", label: "Play · Collect · Grow", detail: "How one idea moves across products and formats." },
  { href: "#work", index: "05", label: "Selected case files", detail: "Six contextual stories with roles, actions, and evidence." },
  { href: "#depth", index: "07", label: "Individual depth", detail: "Equal seniority, distinct proof, shared standards." },
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
      <span className="case-content"><span className="case-owner">{study.owner} · {study.role}</span><strong>{study.title}</strong><span className="case-statement">{study.statement}</span><span className="case-open">Open complete case file <b aria-hidden="true">↗</b></span></span>
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
    event.currentTarget.style.setProperty("--card-x", `${x * 4}deg`);
    event.currentTarget.style.setProperty("--card-y", `${y * -3.5}deg`);
    event.currentTarget.style.setProperty("--shine-x", `${(x + 0.5) * 100}%`);
    event.currentTarget.style.setProperty("--shine-y", `${(y + 0.5) * 100}%`);
  };

  return (
    <button className={`leader-card leader-${leader}`} type="button" onPointerMove={handlePointer} onPointerLeave={(event) => { event.currentTarget.style.setProperty("--card-x", "0deg"); event.currentTarget.style.setProperty("--card-y", "0deg"); }} onClick={onOpen} aria-label={`Open the complete ${isBradd ? "Bradd McBrearty" : "Stone Perales"} leadership profile`}>
      <span className="portrait-wrap"><img src={media(`${leader}-portrait.webp`)} alt={isBradd ? "Bradd McBrearty" : "Stone Perales"} width="1122" height="1402" /><span className="portrait-sheen" aria-hidden="true" /></span>
      <span className="leader-index">{isBradd ? "01" : "02"} / {isBradd ? "CREATIVE + PRODUCT" : "ART + FRANCHISE"}</span>
      <span className="leader-copy"><span className="leader-role">{isBradd ? "Creative Director" : "Art Director"}</span><strong>{isBradd ? "Bradd McBrearty" : "Stone Perales"}</strong><span>{isBradd ? "Game design · Product strategy · Technical direction · Production systems" : "Worldbuilding · Visual identity · Franchise systems · Licensed products"}</span><span className="leader-open">Open complete profile <b aria-hidden="true">↗</b></span></span>
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
      <button className="dialog-backdrop-close" type="button" tabIndex={-1} aria-label="Close detail dialog" onClick={onDismiss} />
      {detail && (
        <article className="dialog-panel" data-fit-check>
          <header className="dialog-toolbar"><div><span>{detail.detailType === "case" ? "Complete case file" : "Complete leadership lens"}</span><small>{detail.detailType === "case" ? `${detail.owner} · ${detail.role}` : detail.kicker}</small></div><button className="dialog-close" type="button" onClick={onDismiss}>Close <span aria-hidden="true">×</span></button></header>
          {detail.detailType === "case" ? <div className="dialog-image"><img src={media(detail.image)} alt={detail.alt} width="1280" height="720" style={{ objectPosition: detail.imagePosition ?? "center" }} /><span>{detail.eyebrow}</span></div> : <div className="dialog-concept" aria-hidden="true"><span>{detail.title.slice(0, 1)}</span><i /><b /></div>}
          <div className="dialog-body">
            <p className="dialog-kicker">{detail.detailType === "case" ? `${detail.owner} · ${detail.role}` : detail.kicker}</p><h2 id="detail-title">{detail.title}</h2><p className="dialog-statement" id="detail-summary">{detail.statement}</p>
            <div className="dialog-context-grid"><section><h3>01 / The situation</h3><p>{detail.brief}</p></section><section><h3>02 / Why it matters</h3><p>{detail.relevance}</p></section></div>
            <section className="dialog-section"><h3>03 / {detail.detailType === "case" ? "What the leader did" : "How we lead it"}</h3><ol>{detail.moves.map((move) => <li key={move}>{move}</li>)}</ol></section>
            <section className="dialog-section dialog-evidence"><h3>04 / Evidence in context</h3><ul>{detail.proof.map((proof) => <li key={proof}>{proof}</li>)}</ul>{detail.sourceNote && <aside><b>Attribution note</b><p>{detail.sourceNote}</p></aside>}</section>
            <div className="dialog-end"><p>Situation, contribution, evidence, and relevance are kept together so this case can be understood without prior knowledge of either résumé.</p><button type="button" onClick={onDismiss}>Return to the story <span aria-hidden="true">↓</span></button></div>
          </div>
        </article>
      )}
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
      <button className="dialog-backdrop-close" type="button" tabIndex={-1} aria-label="Close presentation navigation" onClick={onDismiss} />
      <div className="nav-panel" data-fit-check><header><div><span>BRADD + STONE</span><h2 id="nav-title">Explore the story</h2></div><button className="nav-close" type="button" onClick={onDismiss}>Close <span aria-hidden="true">×</span></button></header><nav aria-label="Presentation chapters">{navItems.map((item) => <a key={item.href} href={item.href} onClick={(event) => navigate(event, item.href)}><span>{item.index}</span><strong>{item.label}</strong><small>{item.detail}</small><b aria-hidden="true">↘</b></a>)}</nav><a className="nav-contact" href="#contact" onClick={(event) => navigate(event, "#contact")}>Start a conversation <span aria-hidden="true">↗</span></a></div>
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

function HeroSection({ onOpenLeader, onOpenProof }: { onOpenLeader: (leader: "bradd" | "stone") => void; onOpenProof: () => void }) {
  const [scene, setScene] = useState<HeroScene>("proposition");
  const artRef = useRef<HTMLDivElement>(null);
  const activeChapter = heroChapters.find((chapter) => chapter.id === scene) ?? heroChapters[0];

  const handlePointer = (event: PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--hero-x", `${((event.clientX - rect.left) / rect.width - 0.5) * 7}px`);
    event.currentTarget.style.setProperty("--hero-y", `${((event.clientY - rect.top) / rect.height - 0.5) * 6}px`);
  };
  const handleChapterKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % heroChapters.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + heroChapters.length) % heroChapters.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = heroChapters.length - 1;
    else return;
    event.preventDefault();
    setScene(heroChapters[next].id);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  };

  return (
    <section className="hero" id="top" data-scene={scene} data-static="true" data-enhanced="false">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-shell">
        <div className="hero-copy"><p className="eyebrow">Creative leadership for games, brands &amp; entertainment</p><h1><span>BRADD</span><i>+</i><span>STONE</span></h1><p className="hero-promise">We turn IP into worlds people can <em>play, collect, and grow.</em></p><p className="hero-support">One accountable team from first idea to market-ready experience.</p><div className="hero-actions"><a className="primary-action" href="#proof">See the joint proof <span aria-hidden="true">↘</span></a><button type="button" className="secondary-action" onClick={onOpenProof}>Open the case file <span aria-hidden="true">↗</span></button></div></div>
        <div className="hero-art" ref={artRef} onPointerMove={handlePointer} onPointerLeave={() => { artRef.current?.style.setProperty("--hero-x", "0px"); artRef.current?.style.setProperty("--hero-y", "0px"); }}>
          <div className="hero-axis" aria-hidden="true"><span>VISUAL TRUTH</span><i /><b>ONE SHARED STANDARD</b><i /><span>PRODUCT REALITY</span></div>
          <button className="hero-art-card hero-art-bradd" type="button" onClick={() => onOpenLeader("bradd")} aria-label="Open Bradd McBrearty's complete leadership profile"><img src={media("bradd-portrait.webp")} alt="Bradd McBrearty" width="1122" height="1402" /><span><b>BRADD</b><small>Creative + product direction</small><em>Open profile ↗</em></span></button>
          <button className="hero-art-card hero-art-proof" type="button" onClick={onOpenProof} aria-label="Open the complete Tetris Beat joint case file"><img src={media("tetris-beat-gameplay.webp")} alt="Tetris Beat gameplay" width="1280" height="720" /><span><b>SHIPPED TOGETHER</b><small>Tetris Beat · Apple Arcade</small><em>Open case ↗</em></span></button>
          <button className="hero-art-card hero-art-stone" type="button" onClick={() => onOpenLeader("stone")} aria-label="Open Stone Perales's complete leadership profile"><img src={media("stone-portrait.webp")} alt="Stone Perales" width="1122" height="1402" /><span><b>STONE</b><small>Art + franchise direction</small><em>Open profile ↗</em></span></button>
          <div className="hero-art-caption" aria-live="polite"><span>{activeChapter.label}</span><strong>{activeChapter.title}</strong><p>{activeChapter.body}</p></div>
        </div>
        <nav className="hero-scene-nav" aria-label="Explore the opening argument">{heroChapters.map((chapter, index) => <button key={chapter.id} type="button" aria-label={`Show ${chapter.label}: ${chapter.title}`} aria-pressed={scene === chapter.id} onClick={() => setScene(chapter.id)} onKeyDown={(event) => handleChapterKey(event, index)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{chapter.label}</strong></button>)}</nav>
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
      <header className="topbar"><a className="wordmark" href="#top" aria-label="Bradd and Stone, back to top"><span className="wordmark-long">BRADD <i>+</i> STONE</span><span className="wordmark-short">B<i>+</i>S</span></a><nav className="desktop-nav" aria-label="Primary navigation"><a href="#team">Partnership</a><a href="#proof">Proof</a><a href="#work">Case files</a></nav><div className="top-actions"><a className="top-cta" href="#contact"><span className="cta-long">Start a project</span><span className="cta-short">Start</span> <b aria-hidden="true">↘</b></a><button className="menu-button" type="button" aria-label="Open presentation navigation" aria-expanded={navOpen} aria-controls="presentation-navigation" onClick={() => setNavOpen(true)}><span>Explore</span><i aria-hidden="true" /><i aria-hidden="true" /></button></div></header>
      <main id="main-content" tabIndex={-1}>
        <HeroSection onOpenLeader={(leader) => openInsight(leaderInsights[leader])} onOpenProof={() => openInsight(jointInsights.tetris)} />
        <section className="capability-section" id="capabilities"><div className="section-shell capability-shell"><div className="capability-lead"><p className="section-index">What we lead</p><p>Each lens opens a complete explanation—not a résumé fragment.</p></div><nav className="signal-strip" aria-label="Explore leadership capabilities">{capabilityInsights.map((insight, index) => <button key={insight.id} type="button" onClick={() => openInsight(insight)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{insight.title}</strong><small>{insight.kicker}</small><b aria-hidden="true">↗</b></button>)}</nav></div></section>
        <section className="team-section" id="team"><div className="section-shell"><Reveal className="section-intro"><p className="section-index">01 / The partnership</p><h2>Two leaders.<br /><em>One way through.</em></h2><p>Stone makes a world coherent, ownable, and unmistakable. Bradd makes it playable, scalable, and commercially real. Both lead systems, people, and the creative standard.</p></Reveal><div className="leader-grid"><Reveal><LeaderCard leader="bradd" onOpen={() => openInsight(leaderInsights.bradd)} /></Reveal><Reveal delay={0.08}><LeaderCard leader="stone" onOpen={() => openInsight(leaderInsights.stone)} /></Reveal></div><div className="partnership-line"><p>Different lenses.</p><i aria-hidden="true" /><p>Shared standards.</p><i aria-hidden="true" /><p>One accountable team.</p></div></div></section>
        <section className="proof-section" id="proof"><div className="section-shell proof-layout"><Reveal className="proof-copy"><p className="section-index">02 / Proven together</p><p className="project-kicker">Apple Arcade · Tetris Beat</p><h2>Not two résumés.<br /><em>One shipped result.</em></h2><p>An at-risk production needed one coherent creative and production system. Stone established the visual language and led the art vision. Bradd helped rebuild the technical framework and production path. The wider team used those shared standards to turn fragmented work into a scalable, released game.</p><div className="production-build" role="group" aria-label="Internally reported Tetris Beat production context"><div><span>01</span><strong>5-day</strong><small>recovery sprint</small></div><div><span>02</span><strong>20+</strong><small>artists aligned</small></div><div><span>03</span><strong>28</strong><small>live levels</small></div></div><p className="proof-footnote">Internal production record. Shipped eight months later; internal reporting says the game remained at or near the top of Apple Arcade for 6+ weeks.</p><button className="text-action" type="button" onClick={() => openInsight(jointInsights.tetris)}>Open the complete joint case <span aria-hidden="true">↗</span></button></Reveal><Reveal delay={0.08}><button className="proof-visual" type="button" onClick={() => openInsight(jointInsights.tetris)} aria-label="Open the complete Tetris Beat joint case file"><span className="proof-cover"><img src={media("tetris-beat-cover.webp")} alt="Tetris Beat official cover artwork and logo" width="1080" height="1080" /><small>Official brand mark · Stone Perales</small></span><span className="proof-gameplay"><img src={media("tetris-beat-gameplay.webp")} alt="Tetris Beat shipped gameplay screen" width="1280" height="720" loading="lazy" /><small>Shipped gameplay</small></span><span className="proof-stamp">SHIPPED<br />TOGETHER</span><span className="proof-open">Open complete case ↗</span></button></Reveal></div></section>
        <section className="range-section" id="range"><div className="section-shell"><Reveal className="range-head"><p className="section-index">03 / Built for the whole ecosystem</p><h2>One idea.<br /> <em>Every surface.</em></h2><p>Play makes the promise tangible. Collect makes it desirable in the hand. Grow gives the world rules strong enough to survive every new format.</p></Reveal><div className="range-experience"><div className="range-tabs" role="tablist" aria-label="Explore play, collect, and grow">{rangeInsights.map((insight, index) => <button key={insight.id} id={`tab-${insight.id}`} role="tab" type="button" tabIndex={activeRange === insight.id ? 0 : -1} aria-selected={activeRange === insight.id} aria-controls="range-panel" onClick={() => setActiveRange(insight.id as RangeId)} onKeyDown={(event) => selectRangeFromKey(event, index)}><span>0{index + 1}</span><strong>{insight.title}</strong><small>{insight.kicker}</small></button>)}</div><m.div key={range.id} id="range-panel" className="range-panel" role="tabpanel" aria-labelledby={`tab-${range.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}><button className="range-visual" type="button" onClick={() => openInsight(range)} aria-label={`Open the complete ${range.title} leadership lens`}><img src={media(rangeVisual.image)} alt={rangeVisual.alt} width="1280" height="720" style={{ objectPosition: rangeVisual.position }} /><span>{rangeVisual.label}</span><b aria-hidden="true">Open lens ↗</b></button><div className="range-copy"><p className="project-kicker">{range.kicker}</p><h3>{range.statement}</h3><p>{range.brief}</p><ul>{range.proof.slice(0, 2).map((proof) => <li key={proof}>{proof}</li>)}</ul><button className="text-action" type="button" onClick={() => openInsight(range)}>Read the complete {range.title.toLowerCase()} answer <span aria-hidden="true">↗</span></button></div></m.div></div></div></section>
        <section className="industry-section" id="industry-proof"><div className="section-shell"><Reveal className="industry-head"><p className="section-index">04 / Industry proof</p><h2>Recognizable worlds.<br /><em>Specific contributions.</em></h2><p>Select any relationship to see who was involved, what kind of engagement it was, and the contribution the name is actually supporting.</p></Reveal><div className="partner-explorer"><div className="partner-nodes" role="tablist" aria-label="Selected partners, properties, and production contexts">{partners.map((partner, index) => <button key={partner.name} id={`partner-tab-${index}`} role="tab" type="button" tabIndex={activePartner.name === partner.name ? 0 : -1} className={activePartner.name === partner.name ? "active" : ""} data-category={partner.category} aria-selected={activePartner.name === partner.name} aria-controls="partner-detail" onClick={() => setActivePartner(partner)} onKeyDown={(event) => selectPartnerFromKey(event, index)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{partner.name}</strong><small>{partner.owner} · {partner.relationship}</small></button>)}</div><article className="partner-detail" id="partner-detail" role="tabpanel" aria-labelledby={`partner-tab-${partners.indexOf(activePartner)}`} aria-live="polite" aria-atomic="true"><m.div key={activePartner.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><span>{activePartner.category} / {activePartner.owner}</span><strong>{activePartner.name}</strong><small>{activePartner.relationship}</small><p>{activePartner.note}</p><em>Contribution shown in context—not an endorsement claim.</em></m.div></article></div></div></section>
        <section className="work-section" id="work"><div className="section-shell"><Reveal className="work-head"><div><p className="section-index">05 / Selected case files</p><h2>Range is<br /><em>the proof.</em></h2></div><p>Six worlds. Six different constraints. Every card opens the full situation, individual contribution, evidence, attribution, and executive relevance.</p></Reveal><div className="case-grid">{caseStudies.map((study) => <FoilCard key={study.id} study={study} onOpen={() => openStudy(study)} />)}</div></div></section>
        <section className="collab-section" id="collaboration"><div className="section-shell collab-layout"><Reveal className="collab-copy"><p className="section-index">06 / Physical becomes interactive</p><p className="project-kicker">Crayola Color Alive · Funny Faces—Crazy Costumes</p><h2>When the obvious route failed,<br /><em>they made a new one.</em></h2><p>In this uncredited contract engagement, Stone adapted supplied character assets for the interactive format. Bradd built the technical backbone for rigging, animation, and real-time behavior. Physical coloring became a scanned, animated, wearable virtual-mask experience.</p><div className="role-pair"><p><b>STONE</b><span>Art adaptation + visual continuity</span></p><p><b>BRADD</b><span>Technical implementation + animation systems</span></p></div><button className="text-action" type="button" onClick={() => openInsight(jointInsights.crayola)}>Open the complete contract case <span aria-hidden="true">↗</span></button></Reveal><Reveal delay={0.08}><button className="collab-art" type="button" onClick={() => openInsight(jointInsights.crayola)} aria-label="Open the complete Crayola contract case"><img className="crayola-main" src={media("crayola-funny-faces-front.webp")} alt="Crayola Funny Faces product showing a virtual mask in use" width="1138" height="1480" loading="lazy" /><div className="mask-mosaic" aria-hidden="true">{Array.from({ length: 30 }, (_, index) => <i key={index} style={{ "--tile": index } as CSSProperties} />)}</div><span className="crayola-inset"><img src={media("crayola-funny-faces-back.webp")} alt="Children mixing and wearing Crayola Color Alive virtual masks" width="1138" height="1480" loading="lazy" /></span><span className="mask-count">PHYSICAL<small>→ INTERACTIVE</small></span><span className="collab-open">Open complete case ↗</span></button></Reveal></div></section>
        <section className="depth-section" id="depth"><div className="section-shell"><Reveal className="depth-head"><p className="section-index">07 / Individual depth</p><h2 id="depth-title">Deep craft.<br /> <em>Executive altitude.</em></h2><p>Equal leadership weight does not require matching résumés. It requires equally specific evidence, complementary judgment, and the ability to operate at the same level.</p></Reveal><div className="dual-timeline" role="group" aria-label="Bradd and Stone leadership evidence"><div className="timeline-head"><button type="button" onClick={() => openInsight(leaderInsights.bradd)}><span>Creative Director</span><strong>BRADD</strong><small>Open complete profile ↗</small></button><button type="button" onClick={() => openInsight(leaderInsights.stone)}><span>Art Director</span><strong>STONE</strong><small>Open complete profile ↗</small></button></div>{depthTimeline.map((row, index) => <Reveal className="timeline-row" key={row.bradd.label}><span className="timeline-index">{String(index + 1).padStart(2, "0")}</span><article><span>{row.bradd.label}</span><strong>{row.bradd.value}</strong><p>{row.bradd.note}</p></article><article><span>{row.stone.label}</span><strong>{row.stone.value}</strong><p>{row.stone.note}</p></article></Reveal>)}</div><div className="supporting-grid" role="group" aria-label="Additional selected project evidence">{supportingProof.map((item) => <button key={item.id} type="button" className={`supporting-card${item.fit === "contain" ? " supporting-contain" : ""}`} onClick={() => openInsight(item)} aria-label={`Open complete context for ${item.title}`}><img src={media(item.image)} alt={`${item.label} project artwork`} width="1280" height="720" loading="lazy" style={{ objectPosition: item.position }} /><span className="supporting-caption"><strong>{item.label}</strong><span>{item.note}</span><em>Open complete context ↗</em></span></button>)}</div></div></section>
        <section className="mentorship-section" id="mentorship"><div className="section-shell mentorship-layout"><div className="mentorship-ripple" aria-hidden="true"><i /><i /><i /><b>B+S</b><span>JUDGMENT</span><span>TEAMS</span><span>AUDIENCES</span></div><Reveal className="mentorship-copy"><p className="section-index">08 / Leadership after the launch</p><h2>Leave the team<br /><em>stronger.</em></h2><p className="mentorship-lede">Teaching, critique, and mentorship are not side notes. They show how Bradd and Stone transfer judgment so quality does not depend on their constant presence.</p><div className="mentor-columns"><button type="button" onClick={() => openInsight(leaderInsights.bradd)}><h3>BRADD / THE SYSTEM</h3><p>Game Design MFA faculty at LCAD, curriculum work, and years developing artists, designers, and technical leaders inside production teams.</p><span>Open Bradd&apos;s complete context ↗</span></button><button type="button" onClick={() => openInsight(leaderInsights.stone)}><h3>STONE / THE PRACTICE</h3><p>Teaching, guest lectures, talks, mock interviews, and portfolio reviews that help emerging creators turn raw voice into professional momentum.</p><span>Open Stone&apos;s complete context ↗</span></button></div><blockquote>Creative leadership succeeds when the team can make better decisions after the leaders leave the room.</blockquote></Reveal></div></section>
        <section className="contact-section" id="contact"><div className="final-seal" aria-hidden="true"><span>B+S</span><i>PLAY · COLLECT · GROW</i></div><div className="section-shell"><Reveal><p className="section-index">09 / A new world starts with a conversation</p><h2>Let&apos;s build<br /> <em>what&apos;s next.</em></h2><p>Bring us the property, product opportunity, or production problem that needs one coherent creative system.</p><div className="contact-actions"><a className="primary-action" href="mailto:bradd.mcbrearty@gmail.com">Start a conversation <span aria-hidden="true">↗</span></a><button className="copy-action" type="button" onClick={copyEmail}>Copy email <span aria-hidden="true">＋</span></button><div className="social-actions"><a className="social-button" href="https://www.linkedin.com/in/braddmcbrearty/" target="_blank" rel="noopener noreferrer"><span>Bradd on LinkedIn</span><b aria-hidden="true">↗</b></a><a className="social-button" href="https://www.linkedin.com/in/stone/" target="_blank" rel="noopener noreferrer"><span>Stone on LinkedIn</span><b aria-hidden="true">↗</b></a></div></div></Reveal><footer><span>BRADD + STONE</span><span>Creative leadership for games, brands &amp; entertainment</span><span>2026</span></footer></div></section>
      </main>
      <DetailDialog detail={detail} onDismiss={() => setDetail(null)} /><NavigationDialog open={navOpen} onDismiss={() => setNavOpen(false)} /><Toast notice={toast} onDismiss={() => setToast(null)} />
      </MotionConfig>
    </LazyMotion>
  );
}
