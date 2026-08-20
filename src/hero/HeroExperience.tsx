/* eslint-disable react-hooks/immutability, react/no-unknown-property */
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Component, useCallback, useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, ReactNode } from "react";
import * as THREE from "three";

export type HeroExperienceProps = {
  active: boolean;
  className?: string;
  sceneRef: MutableRefObject<number>;
  onFailure: () => void;
  onReady?: () => void;
};

type ArchiveCardId = "bradd" | "stone" | "play" | "collect" | "grow";
type Pose = { opacity: number; position: [number, number, number]; rotation: [number, number, number]; scale: number };
type ArchiveCardDefinition = { height: number; id: ArchiveCardId; image: string; width: number };

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const media = (file: string) => `${basePath}/media/${file}`;

const CARDS: readonly ArchiveCardDefinition[] = [
  { id: "bradd", image: media("bradd-portrait.webp"), width: 2.65, height: 3.32 },
  { id: "stone", image: media("stone-portrait.webp"), width: 2.65, height: 3.32 },
  { id: "play", image: media("tetris-beat-gameplay.webp"), width: 4.75, height: 2.67 },
  { id: "collect", image: media("stone-raid-hires.webp"), width: 2.75, height: 3.7 },
  { id: "grow", image: media("stone-chaotic-hires.webp"), width: 4.15, height: 2.85 },
] as const;

const POSES: Record<ArchiveCardId, readonly Pose[]> = {
  bradd: [
    { position: [0.65, -0.85, -1.55], rotation: [-0.02, 0.16, -0.018], scale: 0.78, opacity: 0.72 },
    { position: [0.7, -0.02, 0.15], rotation: [0, 0.08, -0.012], scale: 1.02, opacity: 1 },
    { position: [-5.2, 1.15, -5.2], rotation: [0, 0.28, -0.04], scale: 0.78, opacity: 0.32 },
    { position: [-4.8, -1.25, -5.8], rotation: [0, 0.2, -0.04], scale: 0.72, opacity: 0.22 },
  ],
  stone: [
    { position: [3.35, -0.42, -0.95], rotation: [0.02, -0.18, 0.02], scale: 0.9, opacity: 0.88 },
    { position: [3.35, -0.02, 0.25], rotation: [0, -0.08, 0.012], scale: 1.06, opacity: 1 },
    { position: [5.2, 1.05, -5.4], rotation: [0, -0.28, 0.04], scale: 0.78, opacity: 0.32 },
    { position: [4.9, 1.4, -6], rotation: [0, -0.2, 0.04], scale: 0.72, opacity: 0.22 },
  ],
  play: [
    { position: [2.2, 1.05, -3.4], rotation: [-0.06, -0.04, 0.015], scale: 1.05, opacity: 0.7 },
    { position: [0, 2.65, -5.8], rotation: [-0.08, 0, 0], scale: 0.78, opacity: 0.28 },
    { position: [-3.45, -0.05, 0.45], rotation: [0, 0.15, -0.025], scale: 0.93, opacity: 1 },
    { position: [1.55, 0.1, 1.2], rotation: [0, -0.055, 0.008], scale: 1.48, opacity: 1 },
  ],
  collect: [
    { position: [1.15, -2.35, -4.1], rotation: [0.08, 0.16, -0.06], scale: 0.75, opacity: 0.08 },
    { position: [-4.7, -1.9, -5.4], rotation: [0.05, 0.25, -0.06], scale: 0.72, opacity: 0.24 },
    { position: [0, -0.05, 0.75], rotation: [0, 0, 0], scale: 1.03, opacity: 1 },
    { position: [4.65, -1.6, -4.8], rotation: [0, -0.24, 0.055], scale: 0.76, opacity: 0.3 },
  ],
  grow: [
    { position: [3.75, -2.05, -3.6], rotation: [0.08, -0.16, 0.055], scale: 0.75, opacity: 0.08 },
    { position: [4.75, -1.95, -5.7], rotation: [0.04, -0.23, 0.05], scale: 0.72, opacity: 0.24 },
    { position: [3.45, -0.05, 0.35], rotation: [0, -0.15, 0.025], scale: 0.93, opacity: 1 },
    { position: [5.1, 1.75, -5.6], rotation: [0, -0.25, 0.04], scale: 0.75, opacity: 0.24 },
  ],
};

function ArchiveCard({ definition, texture, sceneRef, index }: { definition: ArchiveCardDefinition; texture: THREE.Texture; sceneRef: MutableRefObject<number>; index: number }) {
  const narrative = useRef<THREE.Group>(null);
  const breathing = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const currentOpacity = useRef(POSES[definition.id][0].opacity);
  const currentScale = useRef(POSES[definition.id][0].scale);

  useFrame(({ clock }, delta) => {
    const group = narrative.current;
    const inner = breathing.current;
    const shader = material.current;
    if (!group || !inner || !shader) return;
    const dt = Math.min(delta, 0.05);
    const scene = Math.max(0, Math.min(3, Math.round(sceneRef.current)));
    const target = POSES[definition.id][scene];
    const lambda = 4.8;
    group.position.x = THREE.MathUtils.damp(group.position.x, target.position[0], lambda, dt);
    group.position.y = THREE.MathUtils.damp(group.position.y, target.position[1], lambda, dt);
    group.position.z = THREE.MathUtils.damp(group.position.z, target.position[2], lambda, dt);
    group.rotation.x = THREE.MathUtils.damp(group.rotation.x, target.rotation[0], lambda, dt);
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, target.rotation[1], lambda, dt);
    group.rotation.z = THREE.MathUtils.damp(group.rotation.z, target.rotation[2], lambda, dt);
    currentScale.current = THREE.MathUtils.damp(currentScale.current, target.scale, lambda, dt);
    currentOpacity.current = THREE.MathUtils.damp(currentOpacity.current, target.opacity, 6.5, dt);
    group.scale.setScalar(currentScale.current);
    shader.opacity = currentOpacity.current;
    const time = clock.elapsedTime;
    const phase = index * 1.73;
    inner.position.x = Math.sin(time * 0.16 + phase) * 0.035;
    inner.position.y = Math.sin(time * 0.12 + phase * 0.7) * 0.045;
    inner.position.z = Math.sin(time * 0.1 + phase) * 0.028;
    inner.rotation.y = Math.sin(time * 0.09 + phase) * 0.004;
  });

  const initial = POSES[definition.id][0];
  return (
    <group ref={narrative} position={initial.position} rotation={initial.rotation} scale={initial.scale}>
      <group ref={breathing}>
        <mesh>
          <planeGeometry args={[definition.width, definition.height, 1, 1]} />
          <meshBasicMaterial ref={material} map={texture} color="#ffffff" transparent opacity={initial.opacity} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function DepthArchitecture({ sceneRef }: { sceneRef: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const geometry = useMemo(() => {
    const points: number[] = [];
    for (let z = -16; z <= 2; z += 2) {
      points.push(-14, -3.9, z, 14, -3.9, z);
      points.push(-14, 3.9, z, 14, 3.9, z);
    }
    for (let x = -14; x <= 14; x += 2) points.push(x, -3.9, -16, x, -3.9, 2);
    return new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  }, []);
  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    const scene = Math.max(0, Math.min(3, Math.round(sceneRef.current)));
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, [-0.2, -0.65, -1.1, -1.6][scene], 3.2, Math.min(delta, 0.05));
    group.current.position.x = Math.sin(clock.elapsedTime * 0.045) * 0.08;
  });
  return <group ref={group} rotation={[-0.035, 0, 0]}><lineSegments geometry={geometry}><lineBasicMaterial color="#78cce0" transparent opacity={0.085} depthWrite={false} /></lineSegments></group>;
}

function CameraRig({ sceneRef }: { sceneRef: MutableRefObject<number> }) {
  const { camera } = useThree();
  useFrame(({ clock }, delta) => {
    const scene = Math.max(0, Math.min(3, Math.round(sceneRef.current)));
    const dt = Math.min(delta, 0.05);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, [0, 0, 0, -0.45][scene], 3.6, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, [0, 0.05, 0, 0.04][scene], 3.6, dt);
    camera.position.z = 9.3 + Math.sin(clock.elapsedTime * 0.08) * 0.055;
    camera.rotation.z = Math.sin(clock.elapsedTime * 0.055) * 0.0015;
  });
  return null;
}

function FirstFrameReady({ failed, onFailure, onReady }: { failed: MutableRefObject<boolean>; onFailure: () => void; onReady: () => void }) {
  const reported = useRef(false);
  const frames = useRef(0);
  const { gl } = useThree();
  useFrame(() => {
    if (reported.current || failed.current) return;
    frames.current += 1;
    if (frames.current < 20) return;
    const context = gl.getContext();
    const size = gl.getDrawingBufferSize(new THREE.Vector2());
    const pixel = new Uint8Array(4);
    let opaque = 0;
    let nearWhite = 0;
    for (const xRatio of [0.44, 0.58, 0.72, 0.86]) {
      for (const yRatio of [0.22, 0.4, 0.58, 0.76]) {
        context.readPixels(Math.floor(size.x * xRatio), Math.floor(size.y * yRatio), 1, 1, context.RGBA, context.UNSIGNED_BYTE, pixel);
        if (pixel[3] < 12) continue;
        opaque += 1;
        if (pixel[0] > 220 && pixel[1] > 220 && pixel[2] > 220) nearWhite += 1;
      }
    }
    // Some software rasterizers accept texture uploads but render every image
    // plane white. Never promote that frame over the guaranteed archive poster.
    if (opaque >= 4 && nearWhite / opaque > 0.55) {
      failed.current = true;
      onFailure();
      return;
    }
    reported.current = true;
    onReady();
  });
  return null;
}

function ArchiveScene({ sceneRef, onFailure, onReady }: { sceneRef: MutableRefObject<number>; onFailure: () => void; onReady: () => void }) {
  const textures = useLoader(THREE.TextureLoader, CARDS.map((card) => card.image));
  const { gl } = useThree();
  const failed = useRef(false);
  useEffect(() => {
    for (const texture of textures) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;
    }
  }, [gl, textures]);
  useEffect(() => {
    gl.debug.onShaderError = () => {
      if (failed.current) return;
      failed.current = true;
      onFailure();
    };
    return () => { gl.debug.onShaderError = null; };
  }, [gl, onFailure]);
  return (
    <>
      <fog attach="fog" args={["#04060b", 16, 34]} />
      <CameraRig sceneRef={sceneRef} />
      <DepthArchitecture sceneRef={sceneRef} />
      {CARDS.map((definition, index) => <ArchiveCard key={definition.id} definition={definition} texture={textures[index]} sceneRef={sceneRef} index={index} />)}
      <FirstFrameReady failed={failed} onFailure={onFailure} onReady={onReady} />
    </>
  );
}

class HeroErrorBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function HeroExperience({ active, className, sceneRef, onFailure, onReady }: HeroExperienceProps) {
  const failed = useRef(false);
  const fail = useCallback(() => {
    if (failed.current) return;
    failed.current = true;
    onFailure();
  }, [onFailure]);
  const ready = useCallback(() => { if (!failed.current) onReady?.(); }, [onReady]);
  return (
    <HeroErrorBoundary onFailure={fail}>
      <Canvas
        className={className ? `experience-canvas ${className}` : "experience-canvas"}
        camera={{ fov: 42, near: 0.1, far: 40, position: [0, 0, 9.3] }}
        dpr={[1, 1.5]}
        frameloop={active ? "always" : "demand"}
        gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => { gl.outputColorSpace = THREE.SRGBColorSpace; gl.setClearColor(0x03050a, 1); }}
      >
        <ArchiveScene sceneRef={sceneRef} onFailure={fail} onReady={ready} />
      </Canvas>
    </HeroErrorBoundary>
  );
}
