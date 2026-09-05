import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise, ArrowLeft, ArrowRight, ArrowsOut, BookOpen, ChalkboardSimple, Check, Cube, GlobeHemisphereWest, Hand, Leaf, Minus, Moon, Plus, SpeakerHigh, Sun, SunHorizon, X, Armchair, Question, Compass, Bell, Footprints } from "@phosphor-icons/react";
import { createClassroom, type Discovery, type Lighting, type View } from "./scene";
import Joystick from "./Joystick";

const details = {
  globe: { title: "A world of possibilities.", text: "A tiny reminder of how much there is to explore. Give the globe a spin and see where your curiosity takes you.", icon: GlobeHemisphereWest },
  board: { title: "Big ideas start here.", text: "A fresh thought for a fresh perspective. Turn the page to put a new lesson on the chalkboard.", icon: ChalkboardSimple },
  books: { title: "Take the scenic route.", text: "The reading corner is a place to slow down. Every spine is a doorway; every good question is a beginning.", icon: BookOpen },
  plant: { title: "A little room to grow.", text: "Even the quietest corners have life. These broad leaves catch the light as the classroom moves from morning to evening.", icon: Leaf },
  bell: { title: "Class is in session.", text: "One little bell, a room full of possibilities. Tap below to hear its chime. Your device’s sound needs to be on.", icon: Bell },
};

export default function Classroom() {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<ReturnType<typeof createClassroom> | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [view, setView] = useState<View>("walk");
  const [lighting, setLighting] = useState<Lighting>("day");
  const [selected, setSelected] = useState<Discovery | null>(null);
  const [found, setFound] = useState<Discovery[]>([]);
  const [help, setHelp] = useState(false);
  const [lesson, setLesson] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [reducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [soundStatus, setSoundStatus] = useState("");
  const [notice, setNotice] = useState("");
  const focusReturn = useRef<HTMLElement | null>(null);
  const detailRef = useRef<HTMLElement>(null);
  const mapPlayer = useRef<SVGGElement>(null);
  const immersive = view !== "room";
  const movePlayer = useCallback((x: number, y: number) => api.current?.input(x, y), []);
  const stepPlayer = useCallback((x: number, y: number) => api.current?.step(x, y), []);

  useEffect(() => {
    if (!host.current) return;
    try {
      api.current = createClassroom(host.current, id => {
        focusReturn.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setSelected(id); setHelp(false); setFound(old => old.includes(id) ? old : [...old, id]);
      }, () => setReady(true), pose => {
        mapPlayer.current?.setAttribute("transform", `translate(${(pose.x + 5.2) * 10} ${(pose.z + 4.4) * 10}) rotate(${-pose.yaw * 180 / Math.PI})`);
      }, () => { setError(true); setReady(false); });
    } catch { queueMicrotask(() => setError(true)); }
    return () => { api.current?.dispose(); void audio.current?.close(); };
  }, []);
  useEffect(() => { if (selected || help) detailRef.current?.focus(); }, [selected, help]);
  useEffect(() => { api.current?.pause(Boolean(selected || help || error)); }, [selected, help, error]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setSelected(null); setHelp(false); focusReturn.current?.focus(); } };
    window.addEventListener("keydown", escape); return () => window.removeEventListener("keydown", escape);
  }, []);
  const changeView = (next: View) => { api.current?.view(next); setView(next); setSelected(null); setHelp(false); };
  const changeLight = (next: Lighting) => { api.current?.lighting(next); setLighting(next); };
  const discover = (id: Discovery) => {
    focusReturn.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(id); setHelp(false); setFound(old => old.includes(id) ? old : [...old, id]);
  };
  const close = () => { setSelected(null); setHelp(false); focusReturn.current?.focus(); };
  const ringBell = async () => {
    try {
      audio.current ??= new AudioContext(); await audio.current.resume();
      const ctx = audio.current, time = ctx.currentTime;
      for (const [frequency, volume] of [[1320, 0.18], [2640, 0.07], [3770, 0.025]]) {
        const oscillator = ctx.createOscillator(), gain = ctx.createGain(); oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, time); gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.8);
        oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(time); oscillator.stop(time + 1.9);
      }
      setSoundStatus("The bell is ringing.");
    } catch { setSoundStatus("Sound couldn’t start. Check your device’s audio settings and try again."); }
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      else setNotice("For a larger view, turn your phone sideways.");
    } catch { setNotice("For a larger view, turn your phone sideways."); }
  };
  const selectedDetail = selected ? details[selected] : null;
  const DetailIcon = selectedDetail?.icon ?? Hand;

  return <main className={`classroom light-${lighting}${immersive ? " immersive" : ""}`} data-revision="classroom-v2-first-person" aria-label="Room to Wonder classroom">
    <header className="room-header">
      <a href="./" className="room-brand" aria-label="Room to Wonder home"><span className="brand-symbol"><Cube size={23} weight="light" /></span><span>little<span className="brand-italic">spaces</span><span className="brand-dot">.</span></span></a>
      <div className="room-caption">{immersive ? "THE CURIOSITY CLASSROOM" : "A CLASSROOM, REIMAGINED"}</div>
      <button className="icon-button help-button" aria-label="How to explore" onClick={() => { focusReturn.current = document.activeElement as HTMLElement; setHelp(!help); setSelected(null); }}><Question size={23} /></button>
    </header>

    {!immersive && <section className="room-intro" aria-label="Welcome">
      <h1>Room to<br /><em>wonder.</em></h1>
      <p>A little space for big ideas.<br />Step inside. Look around. Stay curious.</p>
      <div className="interaction-hint"><Hand size={19} /><span>Drag to turn <span className="hint-divider">/</span> Pinch to zoom</span></div>
    </section>}
    {immersive && <div className="walk-welcome"><h1>Make yourself<br /><em>at home.</em></h1><p>Walk the aisles. Follow your curiosity.</p></div>}

    <div className="scene-shell"><div className="scene-canvas" ref={host} />
      {!ready && !error && <div className="scene-loading" role="status"><Cube size={30} /><span>Making room for wonder…</span></div>}
      {error && <div className="scene-error" role="alert"><h2>The classroom couldn’t open.</h2><p>This experience needs WebGL. Try a current browser with hardware acceleration enabled.</p><button className="solid-button" onClick={() => window.location.reload()}>Try again</button></div>}
    </div>

    <aside className="light-control" aria-label="Classroom atmosphere">
      <span className="control-caption">LET THE LIGHT IN</span>
      <div className="light-options">{([{ id: "day", label: "Daylight", icon: Sun }, { id: "golden", label: "Golden hour", icon: SunHorizon }, { id: "night", label: "After hours", icon: Moon }] as const).map(({ id, label, icon: Icon }) => <button key={id} disabled={!ready} aria-label={label} aria-pressed={lighting === id} onClick={() => changeLight(id)}><Icon size={20} /><span>{label}</span></button>)}</div>
    </aside>

    <div className="scene-tools" aria-label="Camera controls">
      {!immersive && <>
      <button className="icon-button" disabled={!ready} aria-label="Zoom in" onClick={() => api.current?.zoom(0.85)}><Plus size={20} /></button>
      <button className="icon-button" disabled={!ready} aria-label="Zoom out" onClick={() => api.current?.zoom(1.18)}><Minus size={20} /></button>
      <span className="tool-separator" /></>}
      <button className="icon-button" disabled={!ready} aria-label="Rotate left" onClick={() => api.current?.rotate(-0.22)}><ArrowLeft size={19} /></button>
      <button className="icon-button" disabled={!ready} aria-label="Rotate right" onClick={() => api.current?.rotate(0.22)}><ArrowRight size={19} /></button>
      <span className="tool-separator" />
      <button className="icon-button fullscreen-button" aria-label="Toggle fullscreen" onClick={() => void fullscreen()}><ArrowsOut size={19} /></button>
    </div>

    {(selectedDetail || help) && <aside ref={detailRef} tabIndex={-1} className="discovery-panel" aria-label={help ? "How to explore" : selectedDetail?.title}>
      <button className="icon-button panel-close" onClick={close} aria-label="Close panel"><X size={20} /></button>
      <DetailIcon size={29} weight="light" />
      <h2>{help ? "Make yourself at home." : selectedDetail?.title}</h2>
      {help ? <><p>Use the left thumb joystick to walk. Drag anywhere in the classroom with your other finger to look around. You can move and look at the same time.</p><p>On a computer, use W A S D to walk and drag to look. Arrow keys look around. The step buttons work with Tab and Enter.</p><p>Tap an object or use a discovery shortcut. Movement pauses while a panel is open. Escape closes it. Room overview gives you the original dollhouse view, with pinch-to-zoom.</p></> : <p>{selectedDetail?.text}</p>}
      {selected === "globe" && <button className="solid-button" onClick={() => setSpinning(api.current?.spin() ?? false)}><GlobeHemisphereWest size={18} />{reducedMotion ? "Turn the globe" : spinning ? "Stop the globe" : "Spin the globe"}</button>}
      {selected === "board" && <button className="solid-button" onClick={() => { const next = (lesson + 1) % 3; setLesson(next); api.current?.lesson(next); }}><ChalkboardSimple size={18} />Next lesson <span>{lesson + 1} / 3</span></button>}
      {selected === "bell" && <><button className="solid-button" onClick={() => void ringBell()}><SpeakerHigh size={18} />Ring the bell</button><span className="sound-status" role="status">{soundStatus}</span></>}
      {selected === "plant" && <button className="solid-button" onClick={() => changeLight(lighting === "golden" ? "day" : "golden")}><SunHorizon size={18} />{lighting === "golden" ? "Bring back daylight" : "Catch the golden hour"}</button>}
      {selected === "books" && <button className="solid-button" onClick={() => changeView("board")}><Armchair size={18} />Visit the reading corner</button>}
    </aside>}

    <footer className="room-footer">
      <div className="room-location"><span className="status-dot" /><span>THE CURIOSITY CLASSROOM</span><span className="location-sub">An interactive little world</span></div>
      <nav className="view-controls" aria-label="Choose a classroom view">
        {([{ id: "walk", label: "Walk inside", icon: Footprints }, { id: "room", label: "Room overview", icon: Cube }, { id: "seat", label: "Front row", icon: Armchair }] as const).map(({ id, label, icon: Icon }) => <button disabled={!ready} key={id} aria-pressed={view === id || (id === "walk" && view === "board")} onClick={() => changeView(id)}><Icon size={20} /><span>{label}</span></button>)}
        <span className="view-divider" /><button disabled={!ready} className="reset-button" aria-label="Return to entrance" onClick={() => changeView("walk")}><ArrowCounterClockwise size={20} /></button>
      </nav>
      <div className="discovery-count"><Compass size={19} /><span>{found.length} of 5 discoveries</span>{found.length === 5 && <Check size={16} />}</div>
    </footer>
    {immersive && ready && !selected && !help && <>
      <Joystick onInput={movePlayer} onStep={stepPlayer} />
      <div className="look-cue"><Hand size={22} /><span>DRAG TO LOOK</span><small>WASD to walk · Arrow keys to look</small></div>
      <div className="crosshair" aria-hidden="true" />
      <div className="room-map" role="img" aria-label="Classroom floor plan showing your position and facing direction"><svg viewBox="0 0 104 88"><rect x="1" y="1" width="102" height="86" rx="2" className="map-walls" /><path d="M25 3H65" className="map-board" />{Array.from({length:9}, (_, i) => <rect key={i} x={15 + i % 3 * 25.3} y={31.4 + Math.floor(i / 3) * 16.2} width="15.5" height="9.2" rx="1" className="map-desk" />)}<g ref={mapPlayer} className="map-player"><path d="M0 -6L4 4L0 2L-4 4Z" /></g></svg><span>YOU ARE HERE</span></div>
    </>}
    <div className="discover-shortcuts" aria-label="Explore classroom objects">{(Object.keys(details) as Discovery[]).map(id => { const Icon = details[id].icon; return <button key={id} aria-label={`Explore ${id}`} aria-pressed={selected === id} onClick={() => discover(id)}><Icon size={17} /><span>{id}</span>{found.includes(id) && <Check size={12} />}</button>; })}</div>
    <span className="room-notice" role="status">{notice}</span>
  </main>;
}
