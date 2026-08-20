/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ExperienceTier } from "./experience";

type Props = {
  collapseProgress: number;
  onFailure: () => void;
  onReady: () => void;
  tier: ExperienceTier;
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uReveal;
  uniform float uExit;

  mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise21(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x), f.y);
  }

  float band(float value, float center, float softness) {
    return exp(-abs(value - center) / softness);
  }

  float fineRing(float value, float center, float width) {
    float edge = max(fwidth(value) * 1.25, 0.0008);
    return 1.0 - smoothstep(width, width + edge, abs(value - center));
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    float mobile = 1.0 - smoothstep(0.78, 1.02, aspect);
    vec2 uv = (vUv - 0.5) * vec2(aspect, 1.0);

    // Begin on the exact geometry of the original orbit mark, then let its
    // apparent simplicity pull inward and reveal the deeper system beneath it.
    float openingDiameterPx = min(uResolution.x * 0.52, 760.0);
    float openingRadius = openingDiameterPx / max(uResolution.y, 1.0) * 0.5;
    float openingCenterX = 1.18 - openingDiameterPx / max(uResolution.x, 1.0) * 0.5;
    vec2 openingCenter = vec2(aspect * (openingCenterX - 0.5), 0.43 - openingRadius);
    vec2 revealedCenter = vec2(aspect * mix(0.285, 0.225, mobile), mix(0.035, 0.3, mobile));

    float reveal = smoothstep(0.05, 0.98, uReveal);
    float physicsReveal = smoothstep(0.18, 0.88, reveal);
    vec2 center = mix(openingCenter, revealedCenter, physicsReveal);
    vec2 raw = uv - center;

    float collapse = smoothstep(0.02, 0.88, uExit);
    float collapseScale = mix(1.0, 8.5, collapse * collapse * collapse);
    vec2 p = raw * collapseScale;
    float r = length(p);
    float angle = atan(p.y, p.x);
    float holeScale = mix(1.0, 0.64, mobile);

    vec3 cyan = vec3(0.42, 0.93, 1.0);
    vec3 violet = vec3(0.48, 0.34, 1.0);
    vec3 amber = vec3(1.0, 0.62, 0.24);
    vec3 whiteHot = vec3(1.0, 0.93, 0.78);
    vec3 color = vec3(0.0);
    float alpha = 0.0;

    // A restrained editorial contour field makes the lensing legible.
    float lensStrength = physicsReveal * 0.034 / (r * r + 0.026);
    vec2 lensed = p * (1.0 + lensStrength);
    float contourCarrier = sin((lensed.y + sin(lensed.x * 3.7) * 0.035) * 18.0);
    float contour = 1.0 - smoothstep(0.0, 0.035, abs(contourCarrier));
    float contourWindow = (1.0 - smoothstep(0.16 * holeScale, 0.88 * holeScale, r)) * smoothstep(0.08 * holeScale, 0.15 * holeScale, r);
    float contentGuard = mix(smoothstep(0.52, 0.7, vUv.x), smoothstep(0.62, 0.76, vUv.y), mobile);
    float field = contour * contourWindow * contentGuard * physicsReveal;
    color += mix(vec3(0.82, 0.88, 0.9), cyan, 0.22) * field * 0.56;
    alpha = max(alpha, field * 0.068);

    // The original minimal orbit remains legible, then reveals itself as the photon sphere.
    float orbitRadius = mix(openingRadius, 0.116 * holeScale, physicsReveal);
    float orbitRing = fineRing(r, orbitRadius, mix(0.0012, 0.0028, physicsReveal));
    float orbitAngle = 2.753 - uTime * 0.349066 * (1.0 + collapse * 7.0);
    vec2 orbitPoint = vec2(cos(orbitAngle), sin(orbitAngle)) * orbitRadius;
    float dotDistance = length(p - orbitPoint);
    float orbitDot = exp(-dotDistance * 105.0);
    float orbitHalo = exp(-dotDistance * 28.0) * 0.35;
    vec3 orbitColor = mix(cyan, whiteHot, physicsReveal * 0.7);
    color += orbitColor * (orbitRing * mix(0.48, 0.2, physicsReveal) + orbitDot * 2.8 + orbitHalo);
    alpha = max(alpha, clamp(orbitRing * 0.72 + orbitDot + orbitHalo, 0.0, 1.0));

    // A physically suggestive accretion disk: flow, Doppler color split, and lensed back arc.
    vec2 diskP = rotate2d(-0.12) * p;
    float diskRadius = length(vec2(diskP.x, diskP.y * 5.4));
    float diskNoise = noise21(vec2(cos(angle), sin(angle)) * 3.2 + vec2(diskRadius * 20.0 - uTime * 0.045, uTime * 0.018));
    float diskCore = band(diskRadius, 0.255 * holeScale, 0.026 * holeScale) * smoothstep(0.105 * holeScale, 0.145 * holeScale, diskRadius);
    float diskTexture = mix(0.42, 1.15, diskNoise) * (0.84 + 0.16 * sin(angle * 18.0 - uTime * 0.16));
    float disk = diskCore * diskTexture * physicsReveal;
    float approaching = smoothstep(-0.34, 0.38, diskP.x);
    vec3 diskColor = mix(mix(violet, cyan, 0.58), whiteHot, approaching);
    diskColor = mix(diskColor, amber, smoothstep(0.62, 1.0, approaching) * 0.64);
    color += diskColor * disk * 2.05;
    alpha = max(alpha, clamp(disk * 0.82, 0.0, 0.92));

    float backArcMask = smoothstep(-0.015, 0.075, p.y);
    float backArcTaper = smoothstep(0.02, 0.52, max(sin(angle), 0.0));
    float backArc = fineRing(r, 0.146 * holeScale, 0.0045 * holeScale) * backArcMask * backArcTaper * physicsReveal;
    color += mix(cyan, whiteHot, smoothstep(-0.2, 0.35, p.x)) * backArc * 1.15;
    alpha = max(alpha, backArc * 0.82);

    // Electromagnetic radiation is expressed as controlled spectral scattering, not confetti.
    float beamShape = pow(max(0.0, cos(angle * 2.0 - 0.2)), 18.0);
    float radiation = beamShape * exp(-r * 3.6 / holeScale) * smoothstep(0.11 * holeScale, 0.17 * holeScale, r) * contentGuard * physicsReveal;
    color += mix(violet, cyan, 0.78) * radiation * 0.72;
    alpha = max(alpha, radiation * 0.082);

    float photonRing = fineRing(r, 0.116 * holeScale, 0.0024 * holeScale) * physicsReveal;
    float photonHalo = band(r, 0.116 * holeScale, 0.026 * holeScale) * physicsReveal * 0.32;
    float photonHot = pow(0.5 + 0.5 * cos(angle - 1.0), 2.35);
    color += mix(cyan, whiteHot, 0.7) * photonRing * (0.22 + photonHot * 2.2) + mix(violet, amber, 0.48) * photonHalo;
    alpha = max(alpha, clamp(photonRing + photonHalo * 0.44, 0.0, 1.0));

    // The event horizon is absolute: light exists because the center does not.
    float horizon = 1.0 - smoothstep(0.102 * holeScale, 0.116 * holeScale, r);
    color = mix(color, vec3(0.0), horizon * physicsReveal);
    alpha = max(alpha, horizon * physicsReveal * 0.98);

    // The near edge of the disk crosses in front of the horizon.
    float frontMask = 1.0 - smoothstep(-0.045, 0.018, diskP.y);
    float frontDisk = disk * frontMask * physicsReveal;
    color += diskColor * frontDisk * 0.72;
    alpha = max(alpha, frontDisk * 0.78);

    // Collapse: the visual system contracts to a single overexposed decision point.
    float flashLife = smoothstep(0.52, 0.7, collapse) * (1.0 - smoothstep(0.76, 0.94, collapse));
    float singularityFlash = exp(-length(raw) * 108.0) * flashLife;
    color += whiteHot * singularityFlash * 3.4;
    alpha = max(alpha, singularityFlash);

    float disappear = 1.0 - smoothstep(0.72, 0.98, collapse);
    color *= disappear;
    alpha *= disappear;

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.94));
  }
`;

function BlackHoleField({ collapseProgress }: { collapseProgress: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { invalidate, size, viewport } = useThree();
  const reducedRate = size.width < 700;

  const uniforms = useMemo(
    () => ({
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uExit: { value: 0 },
    }),
    [size.height, size.width],
  );

  useEffect(() => {
    let animationFrame = 0;
    let lastFrame = 0;
    const interval = 1000 / (reducedRate ? 24 : 30);

    const requestFrame = (now: number) => {
      if (now - lastFrame >= interval) {
        lastFrame += Math.floor((now - lastFrame) / interval) * interval;
        invalidate();
      }
      animationFrame = requestAnimationFrame(requestFrame);
    };

    animationFrame = requestAnimationFrame(requestFrame);
    return () => cancelAnimationFrame(animationFrame);
  }, [invalidate, reducedRate]);

  useEffect(() => {
    if (!material.current) return;
    material.current.uniforms.uExit.value = collapseProgress;
    material.current.uniforms.uResolution.value.set(size.width, size.height);
    invalidate();
  }, [collapseProgress, invalidate, size.height, size.width]);

  useFrame(({ clock }) => {
    if (!material.current) return;
    const elapsed = clock.getElapsedTime();
    material.current.uniforms.uTime.value = elapsed;
    material.current.uniforms.uReveal.value = THREE.MathUtils.smoothstep(elapsed / 4.2, 0, 1);
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.NormalBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function ExperienceCanvas({ collapseProgress, onFailure, onReady, tier }: Props) {
  return (
    <div className="experience-canvas" data-tier={tier} aria-hidden="true">
      <Canvas
        dpr={[0.7, window.matchMedia("(max-width: 700px)").matches ? 0.9 : 1.1]}
        frameloop="demand"
        orthographic
        camera={{ position: [0, 0, 1], zoom: 1 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.setClearColor(0x000000, 0);
          gl.domElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            onFailure();
          }, { once: true });
          onReady();
        }}
      >
        <BlackHoleField collapseProgress={collapseProgress} />
      </Canvas>
    </div>
  );
}
