/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ExperienceSection, ExperienceTier } from "./experience";

type Props = {
  activeSection: ExperienceSection;
  rangeMode: "play" | "collect" | "grow";
  tier: ExperienceTier;
};

const pseudoRandom = (index: number, salt: number) => {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

const sectionTargets: Record<ExperienceSection, [number, number, number, number]> = {
  top: [2.65, 0.1, 0, -0.12],
  team: [3.2, -0.1, -0.5, 0.18],
  proof: [-3.2, 0.15, -0.8, -0.28],
  range: [2.9, 0, -0.35, 0.35],
  "industry-proof": [-3.2, -0.25, -1.1, -0.45],
  work: [3.25, 0.2, -1, 0.2],
  collaboration: [-3.15, 0, -0.7, -0.18],
  depth: [3.25, -0.2, -1.25, 0.45],
  mentorship: [-3.05, 0, -0.9, -0.38],
  contact: [2.75, 0.1, -0.3, 0.08],
};

function ParticleResolve({ activeSection }: { activeSection: ExperienceSection }) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const { invalidate, size, viewport } = useThree();
  const startedAt = useRef(0);
  const target = sectionTargets[activeSection];
  const count = useMemo(() => (size.width < 700 ? 1800 : 6000), [size.width]);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const targets = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      const i = index * 3;
      const radius = 2.5 + pseudoRandom(index, 1) * 4.5;
      const angle = pseudoRandom(index, 2) * Math.PI * 2;
      positions[i] = Math.cos(angle) * radius;
      positions[i + 1] = (pseudoRandom(index, 3) - 0.5) * 8;
      positions[i + 2] = (pseudoRandom(index, 4) - 0.5) * 3;

      const edge = index % 4;
      const t = pseudoRandom(index, 5) * 2 - 1;
      targets[i] = edge < 2 ? t * 1.34 : edge === 2 ? -1.34 : 1.34;
      targets[i + 1] = edge < 2 ? (edge === 0 ? -1.9 : 1.9) : t * 1.9;
      targets[i + 2] = (pseudoRandom(index, 6) - 0.5) * 0.14;
      seeds[index] = pseudoRandom(index, 7);
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    buffer.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
    buffer.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return buffer;
  }, [count]);

  useEffect(() => {
    startedAt.current = performance.now();
    invalidate();
    return () => geometry.dispose();
  }, [activeSection, geometry, invalidate]);

  useFrame(({ clock }) => {
    if (!material.current || !points.current) return;
    const elapsed = Math.min((performance.now() - startedAt.current) / 1600, 1);
    material.current.uniforms.uProgress.value = THREE.MathUtils.smoothstep(elapsed, 0, 1);
    material.current.uniforms.uTime.value = clock.elapsedTime;
    points.current.position.x = THREE.MathUtils.lerp(points.current.position.x, target[0], 0.055);
    points.current.position.y = THREE.MathUtils.lerp(points.current.position.y, target[1], 0.055);
    points.current.position.z = THREE.MathUtils.lerp(points.current.position.z, target[2], 0.055);
    points.current.rotation.z = THREE.MathUtils.lerp(points.current.rotation.z, activeSection === "contact" ? Math.PI * 0.5 : 0, 0.04);
    if (elapsed < 1) invalidate();
  });

  return (
    <points ref={points} geometry={geometry} scale={Math.min(1, viewport.width / 10)}>
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uDpr: { value: Math.min(window.devicePixelRatio, 1.5) },
        }}
        vertexShader={`
          attribute vec3 aTarget;
          attribute float aSeed;
          uniform float uProgress;
          uniform float uTime;
          uniform float uDpr;
          varying float vSeed;
          void main() {
            float settle = smoothstep(0.0, 1.0, uProgress);
            vec3 p = mix(position, aTarget, settle);
            p += vec3(sin(uTime * 0.55 + aSeed * 16.0), cos(uTime * 0.4 + aSeed * 12.0), 0.0) * 0.018 * (1.0 - settle);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (1.1 + aSeed * 1.8) * uDpr;
            vSeed = aSeed;
          }
        `}
        fragmentShader={`
          varying float vSeed;
          void main() {
            vec2 p = gl_PointCoord - 0.5;
            if (dot(p, p) > 0.25) discard;
            vec3 cyan = vec3(0.27, 0.85, 1.0);
            vec3 violet = vec3(0.64, 0.54, 1.0);
            vec3 amber = vec3(1.0, 0.72, 0.36);
            vec3 color = mix(cyan, violet, smoothstep(0.12, 0.72, vSeed));
            color = mix(color, amber, smoothstep(0.82, 1.0, vSeed));
            gl_FragColor = vec4(color, 0.44 + vSeed * 0.35);
          }
        `}
      />
    </points>
  );
}

function WorldSeed({ activeSection, rangeMode }: Omit<Props, "tier">) {
  const group = useRef<THREE.Group>(null);
  const card = useRef<THREE.Mesh>(null);
  const { invalidate } = useThree();
  const startedAt = useRef(0);
  const target = sectionTargets[activeSection];

  useEffect(() => {
    startedAt.current = performance.now();
    invalidate();
  }, [activeSection, rangeMode, invalidate]);

  useFrame(({ pointer }) => {
    if (!group.current || !card.current) return;
    const elapsed = performance.now() - startedAt.current;
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, target[0], 0.055);
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, target[1], 0.055);
    group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, target[2], 0.055);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, target[3], 0.045);
    card.current.rotation.y = THREE.MathUtils.lerp(card.current.rotation.y, pointer.x * 0.16 + (rangeMode === "collect" ? 0.22 : 0), 0.06);
    card.current.rotation.x = THREE.MathUtils.lerp(card.current.rotation.x, -pointer.y * 0.1 + (rangeMode === "play" ? -0.08 : 0.02), 0.06);
    const scale = rangeMode === "grow" ? 1.12 : rangeMode === "collect" ? 1.02 : 0.94;
    group.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.04);
    if (elapsed < 1800) invalidate();
  });

  return (
    <group ref={group} position={[target[0], target[1], target[2]]} rotation={[0, 0, target[3]]}>
      <mesh ref={card}>
        <boxGeometry args={[2.66, 3.8, 0.14, 12, 12, 2]} />
        <meshPhysicalMaterial
          color={rangeMode === "play" ? "#10213e" : rangeMode === "collect" ? "#241d45" : "#142f2f"}
          metalness={0.62}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.12}
          iridescence={1}
          iridescenceIOR={1.65}
          iridescenceThicknessRange={[180, 520]}
          emissive="#162552"
          emissiveIntensity={0.14}
        />
      </mesh>
      <mesh position={[0, 0, 0.081]}>
        <planeGeometry args={[2.18, 3.25]} />
        <meshStandardMaterial color="#070b17" metalness={0.34} roughness={0.34} transparent opacity={0.94} />
      </mesh>
      <mesh position={[0, 0, 0.09]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.68, 0.018, 8, 96]} />
        <meshBasicMaterial color="#85eaff" transparent opacity={0.72} />
      </mesh>
    </group>
  );
}

function Scene(props: Props) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 6]} intensity={2.8} color="#ddf8ff" />
      <pointLight position={[-5, -2, 4]} intensity={24} distance={12} color="#8f6fff" />
      <pointLight position={[5, 0, 3]} intensity={18} distance={10} color="#ffc178" />
      <ParticleResolve activeSection={props.activeSection} />
      <WorldSeed activeSection={props.activeSection} rangeMode={props.rangeMode} />
    </>
  );
}

export default function ExperienceCanvas(props: Props) {
  return (
    <div className="experience-canvas" data-tier={props.tier} data-section={props.activeSection} aria-hidden="true">
      <Canvas
        dpr={[0.75, window.matchMedia("(max-width: 700px)").matches ? 1.25 : 1.5]}
        frameloop="demand"
        camera={{ position: [0, 0, 8.5], fov: 42 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
