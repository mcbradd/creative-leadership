import * as THREE from "three";
import { moveWithCollisions, type Obstacle } from "./movement";

export function createWalker(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement, obstacles: Obstacle[], onTap: (x: number, y: number) => void) {
  let enabled = true, paused = false, yaw = 0, pitch = 0;
  let stickX = 0, stickY = 0, pointerId: number | null = null;
  let downX = 0, downY = 0, lastX = 0, lastY = 0, dragged = false;
  const keys = new Set<string>();
  const clear = () => { keys.clear(); stickX = stickY = 0; pointerId = null; };
  const orient = () => { camera.rotation.set(pitch, yaw, 0, "YXZ"); };
  const look = (dx: number, dy: number) => { yaw -= dx; pitch = THREE.MathUtils.clamp(pitch - dy, -1.15, 1.15); orient(); };
  const move = (x: number, y: number, distance: number) => {
    const length = Math.max(1, Math.hypot(x, y));
    const dx = (x * Math.cos(yaw) + y * Math.sin(yaw)) / length * distance;
    const dz = (-x * Math.sin(yaw) + y * Math.cos(yaw)) / length * distance;
    const p = moveWithCollisions(camera.position, dx, dz, obstacles);
    camera.position.set(p.x, 1.75, p.z);
  };
  const pointerDown = (e: PointerEvent) => {
    if (!enabled || paused || pointerId !== null || (e.pointerType === "mouse" && e.button !== 0)) return;
    pointerId = e.pointerId; downX = lastX = e.clientX; downY = lastY = e.clientY; dragged = false;
    canvas.setPointerCapture(e.pointerId);
  };
  const pointerMove = (e: PointerEvent) => {
    if (!enabled || paused || e.pointerId !== pointerId) return;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) dragged = true;
    look((e.clientX - lastX) * 0.0035, (e.clientY - lastY) * 0.0035);
    lastX = e.clientX; lastY = e.clientY;
  };
  const pointerUp = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (!dragged && enabled && !paused) onTap(e.clientX, e.clientY);
  };
  const pointerCancel = () => { pointerId = null; };
  const keyDown = (e: KeyboardEvent) => {
    if (!enabled || paused || e.ctrlKey || e.metaKey || e.altKey || (e.target instanceof HTMLElement && (e.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)))) return;
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) { e.preventDefault(); keys.add(e.code); }
  };
  const keyUp = (e: KeyboardEvent) => { keys.delete(e.code); };
  canvas.addEventListener("pointerdown", pointerDown); canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp); canvas.addEventListener("pointercancel", pointerCancel); canvas.addEventListener("lostpointercapture", pointerCancel);
  window.addEventListener("keydown", keyDown); window.addEventListener("keyup", keyUp); window.addEventListener("blur", clear); document.addEventListener("visibilitychange", clear);
  return {
    setEnabled: (value: boolean) => { enabled = value; clear(); },
    pause: (value: boolean) => { paused = value; clear(); },
    teleport: (x: number, z: number, direction = 0, tilt = 0) => { clear(); camera.position.set(x, 1.75, z); yaw = direction; pitch = tilt; orient(); canvas.dataset.position = `${x.toFixed(3)},${z.toFixed(3)}`; canvas.dataset.heading = yaw.toFixed(3); },
    input: (x: number, y: number) => { if (enabled && !paused) { stickX = x; stickY = y; } },
    step: (x: number, y: number) => { if (enabled && !paused) move(x, y, 0.42); },
    turn: (angle: number) => { if (enabled && !paused) look(angle, 0); },
    update: (dt: number) => {
      if (!enabled || paused) return;
      if (keys.has("ArrowLeft")) look(-dt * 1.5, 0);
      if (keys.has("ArrowRight")) look(dt * 1.5, 0);
      if (keys.has("ArrowUp")) look(0, -dt);
      if (keys.has("ArrowDown")) look(0, dt);
      const x = stickX + Number(keys.has("KeyD")) - Number(keys.has("KeyA"));
      const y = stickY + Number(keys.has("KeyS")) - Number(keys.has("KeyW"));
      if (x || y) move(x, y, dt * 1.85);
      // Readable diagnostics mirror the visible map; useful for verifying movement without pixel guesses.
      canvas.dataset.position = `${camera.position.x.toFixed(3)},${camera.position.z.toFixed(3)}`;
      canvas.dataset.heading = yaw.toFixed(3);
    },
    pose: () => ({ x: camera.position.x, z: camera.position.z, yaw }),
    dispose: () => {
      clear(); canvas.removeEventListener("pointerdown", pointerDown); canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp); canvas.removeEventListener("pointercancel", pointerCancel); canvas.removeEventListener("lostpointercapture", pointerCancel);
      window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); window.removeEventListener("blur", clear); document.removeEventListener("visibilitychange", clear);
    },
  };
}
