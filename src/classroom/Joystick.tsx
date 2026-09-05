import { useEffect, useRef } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "@phosphor-icons/react";

export default function Joystick({ onInput, onStep }: { onInput: (x: number, y: number) => void; onStep: (x: number, y: number) => void }) {
  const stick = useRef<HTMLButtonElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const pointer = useRef<number | null>(null);
  useEffect(() => {
    const reset = () => { pointer.current = null; onInput(0, 0); if (thumb.current) thumb.current.style.transform = "translate(0, 0)"; };
    window.addEventListener("blur", reset); document.addEventListener("visibilitychange", reset);
    return () => { reset(); window.removeEventListener("blur", reset); document.removeEventListener("visibilitychange", reset); };
  }, [onInput]);
  const reset = () => { pointer.current = null; onInput(0, 0); if (thumb.current) thumb.current.style.transform = "translate(0, 0)"; };
  const update = (x: number, y: number) => {
    const rect = stick.current!.getBoundingClientRect();
    const dx = x - rect.left - rect.width / 2, dy = y - rect.top - rect.height / 2;
    const distance = Math.hypot(dx, dy), scale = distance > 32 ? 32 / distance : 1;
    if (thumb.current) thumb.current.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
    onInput(distance < 5 ? 0 : dx * scale / 32, distance < 5 ? 0 : dy * scale / 32);
  };
  return <div className="walk-pad" role="group" aria-label="Movement controls">
    <button className="walk-step step-up" aria-label="Step forward" onClick={() => onStep(0, -1)}><ArrowUp size={18} /></button>
    <button className="walk-step step-left" aria-label="Step left" onClick={() => onStep(-1, 0)}><ArrowLeft size={18} /></button>
    <button className="walk-step step-right" aria-label="Step right" onClick={() => onStep(1, 0)}><ArrowRight size={18} /></button>
    <button className="walk-step step-down" aria-label="Step backward" onClick={() => onStep(0, 1)}><ArrowDown size={18} /></button>
    <button ref={stick} className="joystick" aria-label="Movement joystick: drag to walk; use the four step buttons with a keyboard" onPointerDown={e => { if (pointer.current !== null) return; pointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); update(e.clientX, e.clientY); }} onPointerMove={e => { if (pointer.current === e.pointerId) update(e.clientX, e.clientY); }} onPointerUp={reset} onPointerCancel={reset} onLostPointerCapture={reset}><span ref={thumb} className="joystick-thumb" /></button>
    <span className="walk-pad-label">MOVE</span>
  </div>;
}
