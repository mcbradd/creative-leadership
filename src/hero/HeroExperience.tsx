/* eslint-disable react-hooks/immutability, react/no-unknown-property */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, useCallback, useEffect, useMemo, useRef } from "react";
import type { MutableRefObject, ReactNode } from "react";
import * as THREE from "three";

import {
  CAMERA_FOV,
  CONE_SLOPE,
  FIELD_SPAN,
  NARRATIVE_LAMBDA,
  RADIAL_FADE_END,
  RADIAL_FADE_START,
  ambient,
  cameraZ,
  damp,
} from "./director";

/**
 * A DOM target measured in normalized viewport coordinates.
 *
 * x: horizontal center, 0 at the viewport's left edge and 1 at its right.
 * y: vertical center, 0 at the viewport's top edge and 1 at its bottom.
 * size: target diameter as a fraction of the viewport's shorter dimension.
 */
export type HeroTarget = {
  x: number;
  y: number;
  size: number;
};

export type HeroExperienceProps = {
  /**
   * True while the hero intersects the viewport. The render loop runs
   * continuously so the scene stays alive when the page is still, so it has to
   * be switched off the moment the hero leaves the screen.
   */
  active: boolean;
  className?: string;
  onFailure: () => void;
  onReady?: () => void;
  /**
   * The raw, scroll-derived director value from 0 through 1, read every frame
   * rather than passed as a prop so scrolling never triggers a React render and
   * never writes a uniform directly.
   */
  progressRef: MutableRefObject<number>;
  /** The O in WORLDS. Null resolves to the center of the viewport. */
  target: HeroTarget | null;
};

/**
 * Narrative beats, aligned to the chapter windows in `director.ts`. The
 * detonation deliberately lands in the dead zone between the swelling and field
 * chapters, so the loudest frame of the sequence is one where no copy competes
 * with it.
 */
const BEATS = {
  gatherStream: [0.16, 0.28],
  gatherCore: [0.32, 0.46],
  approach: [0.34, 0.55],
  release: [0.55, 0.68],
  remnant: [0.78, 0.9],
  payoff: [0.93, 0.99],
} as const;

const particleVertexShader = /* glsl */ `
  precision highp float;

  // aCone is a seed, not a position: x is a sqrt-uniform radius in 0..1, y an
  // angle, z a depth seed in 0..1. The real position is derived in the shader so
  // the field can widen with distance and wrap without ever being rescaled.
  attribute vec3 aCone;
  attribute vec3 aStream;
  attribute vec3 aRemnant;
  attribute float aSeed;
  attribute float aHue;
  attribute float aSize;

  uniform float uProgress;
  uniform float uTime;
  uniform float uTravel;
  uniform float uVelocity;
  uniform float uPixelRatio;
  uniform float uSpan;
  uniform float uConeSlope;
  uniform float uStreamReach;
  uniform vec2 uRadialFade;
  uniform vec2 uPointer;
  uniform vec2 uTargetWorld;
  uniform vec2 uFocus;
  uniform vec3 uAmbient;

  varying float vAlpha;
  varying float vHue;
  varying float vSeed;
  varying float vBlast;

  mat2 rotate2d(float angle) {
    float sine = sin(angle);
    float cosine = cos(angle);
    return mat2(cosine, -sine, sine, cosine);
  }

  void main() {
    float gatherStream = smoothstep(${BEATS.gatherStream[0].toFixed(2)}, ${BEATS.gatherStream[1].toFixed(2)}, uProgress);
    float gatherCore = smoothstep(${BEATS.gatherCore[0].toFixed(2)}, ${BEATS.gatherCore[1].toFixed(2)}, uProgress);
    float approach = smoothstep(${BEATS.approach[0].toFixed(2)}, ${BEATS.approach[1].toFixed(2)}, uProgress);
    float release = smoothstep(${BEATS.release[0].toFixed(2)}, ${BEATS.release[1].toFixed(2)}, uProgress);
    float remnant = smoothstep(${BEATS.remnant[0].toFixed(2)}, ${BEATS.remnant[1].toFixed(2)}, uProgress);
    float payoff = smoothstep(${BEATS.payoff[0].toFixed(2)}, ${BEATS.payoff[1].toFixed(2)}, uProgress);

    // The field is a cone of particles that travels with the camera and wraps
    // inside its own depth. Nothing here scales a bounded cloud, so the dataset
    // has no boundary that can ever cross into frame.
    float slabZ = -uSpan + mod(aCone.z * uSpan - uTravel - uAmbient.z, uSpan);
    float depth = -slabZ;
    float depthNormal = depth / uSpan;

    // Radius grows with distance, which keeps screen-space density even and puts
    // the outermost particle outside the frustum at every depth, not just one.
    float coneRadius = aCone.x * uConeSlope * depth;
    vec2 coneXY = vec2(cos(aCone.y), sin(aCone.y)) * coneRadius;
    vec3 home = vec3(coneXY + uAmbient.xy * (0.4 + depthNormal * 1.6), slabZ);

    // The core sits a fixed distance ahead of the camera. Getting closer to it is
    // a camera move, never a multiplier on the geometry.
    float coreDistance = mix(15.0, 6.6, approach);
    // uFocus keeps the convergence clear of the copy column. Without it the streams
    // cross the headline, and no amount of scrim rescues type printed over motion.
    // uFocus is a tangent, not a distance, so the convergence holds the same screen
    // position while the camera closes on it.
    vec3 anchor = vec3(uFocus * coreDistance + uAmbient.xy * 0.25, -coreDistance);
    // The streams are sized to the frame rather than to world units. A fixed length
    // reaches past a narrow viewport's edge, and a stream cut off by the edge of the
    // frame is exactly the flat, cropped read the field is built to avoid.
    float streamNorm = length(aStream.xy) / 7.4;
    vec3 streams = vec3(aStream.xy / 7.4 * uStreamReach * coreDistance, aStream.z) + anchor;
    vec3 core = position + anchor;
    vec3 remnantHome = vec3(aRemnant.xy, aRemnant.z - 7.4);
    vec3 resolved = vec3(uTargetWorld, -7.4) + aRemnant * mix(0.095, 0.018, payoff);

    // Sequential because the beat windows are disjoint: by the time one mix is
    // ramping, the previous one has already fully resolved.
    vec3 transformed = home;
    transformed = mix(transformed, streams, gatherStream);
    transformed = mix(transformed, core, gatherCore);
    transformed = mix(transformed, home, release);
    transformed = mix(transformed, remnantHome, remnant);
    transformed = mix(transformed, resolved, payoff);

    // Pointer input rotates near and far strata at different rates, so the field
    // reads as navigable rather than as a flat plate.
    float fieldWindow = release * (1.0 - remnant);
    float depthResponse = clamp(depthNormal * 1.6, 0.0, 1.0);
    transformed.xz = rotate2d(uPointer.x * fieldWindow * mix(0.012, 0.05, depthResponse)) * transformed.xz;
    transformed.yz = rotate2d(-uPointer.y * fieldWindow * mix(0.009, 0.036, depthResponse)) * transformed.yz;

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    float perspective = 250.0 / max(2.0, -mvPosition.z);
    float heroStar = step(0.985, aSeed);
    float blast = sin(clamp((uProgress - 0.52) / 0.16, 0.0, 1.0) * 3.14159265);
    float pointSize = aSize * mix(0.72, 1.08, perspective / 20.0);
    pointSize *= mix(1.0, 2.8, heroStar);
    pointSize *= 1.0 + blast * 1.6;
    pointSize *= 1.0 + clamp(abs(uVelocity), 0.0, 1.2) * 0.28;
    gl_PointSize = clamp(pointSize * uPixelRatio, 0.8, 9.0);
    gl_Position = projectionMatrix * mvPosition;

    // Radial and depth falloff together mean the field dissolves rather than
    // ending, and a particle is always invisible at the moment it wraps.
    float radial = 1.0 - smoothstep(uRadialFade.x, uRadialFade.y, aCone.x);
    float depthFade = smoothstep(0.015, 0.09, depthNormal) * (1.0 - smoothstep(0.8, 1.0, depthNormal));
    float inField = max(1.0 - gatherStream, release * (1.0 - remnant));
    float payoffFade = 1.0 - smoothstep(0.955, 0.995, uProgress);

    // The streams are a bounded shape, so their far ends have to dissolve. A stream
    // that simply stops draws a straight cut across the frame and kills the depth.
    float streamEdge = 1.0 - smoothstep(0.62, 0.98, streamNorm);
    float gathered = mix(streamEdge, 1.0, max(gatherCore, max(remnant, payoff)));

    vAlpha = mix(gathered, radial * depthFade, inField) * payoffFade;
    vHue = aHue;
    vSeed = aSeed;
    vBlast = blast;
  }
`;

const particleFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  varying float vAlpha;
  varying float vHue;
  varying float vSeed;
  varying float vBlast;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float radius = length(point);
    float core = 1.0 - smoothstep(0.03, 0.44, radius);
    float halo = exp(-radius * 7.5) * 0.54;
    float horizontalRay = exp(-abs(point.y) * 46.0) * (1.0 - smoothstep(0.05, 0.5, abs(point.x)));
    float verticalRay = exp(-abs(point.x) * 58.0) * (1.0 - smoothstep(0.04, 0.38, abs(point.y)));
    float diffraction = (horizontalRay + verticalRay * 0.46) * mix(0.2, 0.82, vBlast);

    vec3 pearl = vec3(0.91, 0.96, 1.0);
    vec3 electric = vec3(0.33, 0.82, 1.0);
    vec3 warm = vec3(1.0, 0.60, 0.28);
    vec3 color = vHue < 0.36 ? mix(pearl, electric, vHue / 0.36) : mix(electric, warm, (vHue - 0.36) / 0.64);
    float restrainedTwinkle = 0.9 + 0.1 * sin(uTime * 0.85 + vSeed * 38.0);
    float alpha = (core + halo + diffraction) * vAlpha * restrainedTwinkle;
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(color * (core * 1.28 + halo + diffraction), clamp(alpha, 0.0, 0.94));
  }
`;

const screenVertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const backdropFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform vec2 uFocus;
  uniform vec3 uAmbient;
  uniform float uProgress;
  uniform float uTime;

  float hash21(vec2 point) {
    point = fract(point * vec2(123.34, 456.21));
    point += dot(point, point + 45.32);
    return fract(point.x * point.y);
  }

  float noise21(vec2 point) {
    vec2 index = floor(point);
    vec2 fraction = fract(point);
    fraction = fraction * fraction * (3.0 - 2.0 * fraction);
    return mix(
      mix(hash21(index), hash21(index + vec2(1.0, 0.0)), fraction.x),
      mix(hash21(index + vec2(0.0, 1.0)), hash21(index + vec2(1.0)), fraction.x),
      fraction.y
    );
  }

  float fbm(vec2 point) {
    float value = 0.0;
    value += noise21(point) * 0.55;
    point = mat2(0.8, -0.6, 0.6, 0.8) * point * 2.03 + 9.1;
    value += noise21(point) * 0.29;
    point = mat2(0.8, -0.6, 0.6, 0.8) * point * 2.11 + 4.7;
    value += noise21(point) * 0.16;
    return value;
  }

  float softBand(float value, float center, float width) {
    return exp(-abs(value - center) / max(width, 0.0001));
  }

  void main() {
    float minimumDimension = max(1.0, min(uResolution.x, uResolution.y));
    // Ambient drift moves the backdrop with the field, so the parallax between
    // the two layers stays consistent while the page is still.
    // Shifted by uFocus so the filaments and the core share the particle field's
    // convergence point rather than sitting behind the copy.
    vec2 point = (vUv - 0.5) * uResolution / minimumDimension - uAmbient.xy * 0.014 - uFocus;
    float radius = length(point);

    float swelling = smoothstep(0.34, 0.50, uProgress);
    float explosion = smoothstep(0.52, 0.60, uProgress);
    float field = smoothstep(0.58, 0.70, uProgress);
    float remnant = smoothstep(0.78, 0.90, uProgress);

    vec3 black = vec3(0.002, 0.003, 0.008);
    vec3 midnight = vec3(0.012, 0.016, 0.035);
    vec3 pearl = vec3(0.92, 0.97, 1.0);
    vec3 cyan = vec3(0.23, 0.78, 1.0);
    vec3 violet = vec3(0.25, 0.18, 0.62);
    vec3 amber = vec3(1.0, 0.42, 0.13);
    vec3 color = mix(black, midnight, max(0.0, 0.74 - radius) * 0.19);

    // In the field, atmosphere is broad and quiet enough to preserve typography.
    if (uProgress > 0.54 && uProgress < 0.92) {
      vec2 atmospherePoint = point * 2.3 + uPointer * 0.025 + vec2(uTime * 0.0035, uTime * -0.0021);
      float atmosphereNoise = fbm(atmospherePoint + vec2(-0.8, 0.22));
      float nebula = smoothstep(0.54, 0.88, atmosphereNoise) * field * (1.0 - remnant);
      color += mix(violet, cyan, smoothstep(-0.5, 0.7, point.x)) * nebula * 0.085;
    }

    // Two intentionally different spectral filaments converge on the same core.
    if (uProgress > 0.13 && uProgress < 0.53) {
      float leftCurve = 0.08 * sin((point.x + 0.15) * 5.0) - point.x * 0.075;
      float rightCurve = -0.065 * sin((point.x - 0.1) * 6.0) + point.x * 0.055;
      float leftWindow = smoothstep(-0.82, -0.04, point.x) * (1.0 - smoothstep(-0.02, 0.05, point.x));
      float rightWindow = smoothstep(0.02, 0.08, point.x) * (1.0 - smoothstep(0.7, 0.84, point.x));
      float leftFilament = exp(-abs(point.y - leftCurve) * 72.0) * leftWindow;
      float rightFilament = exp(-abs(point.y - rightCurve) * 78.0) * rightWindow;
      float filamentLife = smoothstep(0.16, 0.25, uProgress) * (1.0 - smoothstep(0.43, 0.51, uProgress));
      color += cyan * leftFilament * filamentLife * (0.38 + fbm(point * 10.0) * 0.78);
      color += mix(pearl, amber, 0.32) * rightFilament * filamentLife * (0.34 + fbm(point * 9.0 + 7.0) * 0.75);
    }

    if (uProgress > 0.18 && uProgress < 0.63) {
      float coreNoise = fbm(point * 12.0 + vec2(uTime * 0.025, -uTime * 0.018));
      float coreRadius = mix(0.028, 0.205, swelling);
      float turbulentRadius = coreRadius + (coreNoise - 0.5) * mix(0.008, 0.042, swelling);
      float coreBody = 1.0 - smoothstep(turbulentRadius * 0.48, turbulentRadius, radius);
      float corona = softBand(radius, turbulentRadius, mix(0.018, 0.055, swelling));
      float coreLife = smoothstep(0.2, 0.32, uProgress) * (1.0 - smoothstep(0.555, 0.615, uProgress));
      vec3 coreColor = mix(mix(cyan, pearl, 0.75), mix(amber, pearl, 0.36), swelling);
      color += coreColor * (coreBody * 1.8 + corona * 0.95) * coreLife;
    }

    // The transition is a change in scale, not decorative confetti: a compressed
    // white exposure, a camera-sized shock front, then the deep field is revealed.
    // It lands in the dead zone between two chapters, where no copy competes.
    float shockRadius = explosion * 1.18;
    float shockFront = softBand(radius, shockRadius, 0.018) * sin(explosion * 3.14159265);
    float exposure = exp(-pow((uProgress - 0.565) / 0.018, 2.0));
    float recoil = exp(-pow((uProgress - 0.595) / 0.012, 2.0));
    color += mix(pearl, cyan, 0.12) * shockFront * 2.3;
    color = mix(color, pearl, clamp(exposure * 1.08, 0.0, 1.0));
    color *= 1.0 - recoil * 0.64;

    float vignette = 1.0 - smoothstep(0.26, 0.95, radius);
    color *= mix(0.56, 1.0, vignette);
    float filmGrain = hash21(gl_FragCoord.xy + floor(uTime * 6.0)) - 0.5;
    color += filmGrain * 0.012 * (0.3 + field * 0.7);
    gl_FragColor = vec4(max(color, 0.0), 1.0);
  }
`;

const remnantFragmentShader = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform vec2 uTarget;
  uniform float uTargetSize;
  uniform float uProgress;
  uniform float uTime;
  uniform sampler2D uAccretionMap;
  uniform float uPlateReady;

  mat2 rotate2d(float angle) {
    float sine = sin(angle);
    float cosine = cos(angle);
    return mat2(cosine, -sine, sine, cosine);
  }

  float hash21(vec2 point) {
    point = fract(point * vec2(123.34, 456.21));
    point += dot(point, point + 45.32);
    return fract(point.x * point.y);
  }

  float noise21(vec2 point) {
    vec2 index = floor(point);
    vec2 fraction = fract(point);
    fraction = fraction * fraction * (3.0 - 2.0 * fraction);
    return mix(
      mix(hash21(index), hash21(index + vec2(1.0, 0.0)), fraction.x),
      mix(hash21(index + vec2(0.0, 1.0)), hash21(index + vec2(1.0)), fraction.x),
      fraction.y
    );
  }

  float softBand(float value, float center, float width) {
    return exp(-abs(value - center) / max(width, 0.0001));
  }

  void main() {
    if (uProgress < 0.75) {
      gl_FragColor = vec4(0.0);
      return;
    }
    float minimumDimension = max(1.0, min(uResolution.x, uResolution.y));
    float reveal = smoothstep(0.78, 0.895, uProgress);
    float payoff = smoothstep(0.93, 0.99, uProgress);
    vec2 center = mix(vec2(0.5), uTarget, payoff);
    vec2 point = (vUv - center) * uResolution / minimumDimension;
    point = rotate2d(-0.11 * (1.0 - payoff)) * point;
    float targetRadius = max(0.012, uTargetSize * 0.5);
    float horizonRadius = mix(0.112, targetRadius, payoff);
    float radius = length(point);
    float angle = atan(point.y, point.x);

    vec3 cyan = vec3(0.28, 0.83, 1.0);
    vec3 violet = vec3(0.32, 0.19, 0.73);
    vec3 amber = vec3(1.0, 0.48, 0.15);
    vec3 whiteHot = vec3(1.0, 0.94, 0.78);
    vec3 color = vec3(0.0);
    float alpha = 0.0;

    // A custom-painted transparent plate supplies the irregular, photographic
    // mass. The shader retains responsibility for its lensing and exact handoff.
    float plateExtent = horizonRadius * mix(7.2, 2.25, pow(payoff, 0.72));
    vec2 plateUv = point / max(plateExtent, 0.001) + 0.5;
    vec4 plate = texture2D(uAccretionMap, plateUv);
    float plateBounds = step(0.0, plateUv.x) * step(plateUv.x, 1.0) * step(0.0, plateUv.y) * step(plateUv.y, 1.0);
    float plateHandoff = 1.0 - smoothstep(0.9, 0.96, uProgress);
    float plateAlpha = plate.a * plateBounds * uPlateReady * plateHandoff;
    color += plate.rgb * plateAlpha * 1.22;
    alpha = max(alpha, plateAlpha * 0.91);

    // Turbulence is confined to the accretion flow; the silhouette stays exact.
    float flowNoise = noise21(vec2(angle * 3.2 - uTime * 0.026, radius * 38.0));
    float diskRadius = length(vec2(point.x, point.y * 5.6));
    float diskCenter = horizonRadius * 2.18;
    float disk = softBand(diskRadius, diskCenter, horizonRadius * 0.26);
    disk *= smoothstep(horizonRadius * 1.07, horizonRadius * 1.45, diskRadius);
    disk *= mix(0.42, 1.28, flowNoise);
    float approaching = smoothstep(-horizonRadius * 3.0, horizonRadius * 2.0, point.x);
    vec3 diskColor = mix(mix(violet, cyan, 0.68), whiteHot, approaching);
    diskColor = mix(diskColor, amber, approaching * approaching * 0.58);
    color += diskColor * disk * 1.85;
    alpha = max(alpha, disk * 0.82);

    // The far edge is lensed over the horizon, giving the photographic vertical arc.
    float backArcMask = smoothstep(-horizonRadius * 0.12, horizonRadius * 0.72, point.y);
    float backArcTaper = smoothstep(0.04, 0.55, max(sin(angle), 0.0));
    float backArc = softBand(radius, horizonRadius * 1.32, horizonRadius * 0.036);
    backArc *= backArcMask * backArcTaper;
    color += mix(cyan, whiteHot, approaching) * backArc * 1.32;
    alpha = max(alpha, backArc * 0.92);

    float photonRing = softBand(radius, horizonRadius * 1.075, horizonRadius * 0.024);
    float photonHalo = softBand(radius, horizonRadius * 1.08, horizonRadius * 0.19) * 0.35;
    float doppler = pow(0.5 + 0.5 * cos(angle - 0.4), 2.6);
    color += mix(cyan, whiteHot, doppler) * photonRing * (0.46 + doppler * 2.0);
    color += mix(violet, amber, doppler) * photonHalo * 0.66;
    alpha = max(alpha, photonRing + photonHalo * 0.5);

    // Soft electromagnetic scattering suggests immense power without lens-flare styling.
    float radiation = pow(max(0.0, cos(angle * 2.0 - 0.24)), 24.0);
    radiation *= exp(-radius / max(horizonRadius * 3.6, 0.001));
    radiation *= smoothstep(horizonRadius * 1.1, horizonRadius * 1.55, radius);
    color += mix(violet, cyan, 0.72) * radiation * 0.52;
    alpha = max(alpha, radiation * 0.11);

    float horizon = 1.0 - smoothstep(horizonRadius * 0.91, horizonRadius * 1.05, radius);
    color = mix(color, vec3(0.0), horizon);
    alpha = max(alpha, horizon);

    // The visual remnant yields to the typographic O in the final few percent.
    float typographicHandoff = 1.0 - smoothstep(0.978, 1.0, uProgress);
    color *= reveal;
    alpha *= reveal * typographicHandoff;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createParticleGeometry(count: number) {
  const random = seededRandom(0xb5a17e);
  const core = new Float32Array(count * 3);
  const cone = new Float32Array(count * 3);
  const stream = new Float32Array(count * 3);
  const remnant = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const hues = new Float32Array(count);
  const sizes = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const seed = random();

    // The cone seed. sqrt keeps the disc uniform by area rather than by radius,
    // so density does not pile up on the view axis.
    cone[offset] = Math.sqrt(random());
    cone[offset + 1] = random() * Math.PI * 2;
    cone[offset + 2] = random();

    // Two authored streams, which is what makes the convergence read as two
    // disciplines meeting rather than as a generic particle gather.
    const side = index % 2 === 0 ? -1 : 1;
    const distance = 0.08 + Math.pow(random(), 0.66) * 7.4;
    stream[offset] = side * distance;
    stream[offset + 1] = side * Math.sin(distance * 0.74 + seed * 2.2) * (0.16 + distance * 0.022);
    stream[offset + 2] = (random() - 0.5) * (0.18 + distance * 0.05);

    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const radius = 0.18 + Math.pow(random(), 1.8) * 0.72;
    core[offset] = Math.sin(phi) * Math.cos(theta) * radius;
    core[offset + 1] = Math.sin(phi) * Math.sin(theta) * radius;
    core[offset + 2] = Math.cos(phi) * radius;

    const arm = index % 3;
    const spiralT = Math.pow(random(), 0.72);
    const remnantRadius = 0.25 + spiralT * 6.3;
    const remnantAngle = arm * ((Math.PI * 2) / 3) + spiralT * 9.2 + (random() - 0.5) * 0.34;
    const remnantX = Math.cos(remnantAngle) * remnantRadius;
    const remnantY = Math.sin(remnantAngle) * remnantRadius * 0.17;
    remnant[offset] = remnantX * 0.985 - remnantY * 0.17;
    remnant[offset + 1] = remnantX * 0.17 + remnantY * 0.985;
    remnant[offset + 2] = (random() - 0.5) * 0.22;

    seeds[index] = seed;
    hues[index] = index % 11 === 0 ? 0.92 : index % 4 === 0 ? 0.25 : random() * 0.18;
    sizes[index] = 0.75 + Math.pow(random(), 5.2) * 4.1;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(core, 3));
  geometry.setAttribute("aCone", new THREE.BufferAttribute(cone, 3));
  geometry.setAttribute("aStream", new THREE.BufferAttribute(stream, 3));
  geometry.setAttribute("aRemnant", new THREE.BufferAttribute(remnant, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aHue", new THREE.BufferAttribute(hues, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

/** Particle budget per tier. `compact` covers phones and coarse pointers. */
export const PARTICLE_BUDGET = { compact: 11000, full: 24000 } as const;

type SceneProps = {
  compact: boolean;
  progressRef: MutableRefObject<number>;
  target: HeroTarget | null;
};

function HeroScene({ compact, progressRef, target }: SceneProps) {
  const particles = useRef<THREE.ShaderMaterial>(null);
  const backdrop = useRef<THREE.ShaderMaterial>(null);
  const remnant = useRef<THREE.ShaderMaterial>(null);
  const pointer = useRef(new THREE.Vector2());
  const pointerGoal = useRef(new THREE.Vector2());
  const narrative = useRef(0);
  const velocity = useRef(0);
  const { camera, gl, invalidate, size, viewport } = useThree();
  const geometry = useMemo(
    () => createParticleGeometry(compact ? PARTICLE_BUDGET.compact : PARTICLE_BUDGET.full),
    [compact],
  );
  const emptyTexture = useMemo(() => {
    const texture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  }, []);

  const particleUniforms = useMemo(
    () => ({
      uAmbient: { value: new THREE.Vector3() },
      uConeSlope: { value: CONE_SLOPE },
      uFocus: { value: new THREE.Vector2() },
      uPixelRatio: { value: gl.getPixelRatio() },
      uPointer: { value: new THREE.Vector2() },
      uProgress: { value: 0 },
      uRadialFade: { value: new THREE.Vector2(RADIAL_FADE_START, RADIAL_FADE_END) },
      uSpan: { value: FIELD_SPAN },
      uStreamReach: { value: 1 },
      uTargetWorld: { value: new THREE.Vector2() },
      uTime: { value: 0 },
      uTravel: { value: 0 },
      uVelocity: { value: 0 },
    }),
    [gl],
  );
  const backdropUniforms = useMemo(
    () => ({
      uAmbient: { value: new THREE.Vector3() },
      uFocus: { value: new THREE.Vector2() },
      uPointer: { value: new THREE.Vector2() },
      uProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
    }),
    [],
  );
  const remnantUniforms = useMemo(
    () => ({
      uAccretionMap: { value: emptyTexture as THREE.Texture },
      uPlateReady: { value: 0 },
      uProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTarget: { value: new THREE.Vector2(0.5, 0.5) },
      uTargetSize: { value: 0.09 },
      uTime: { value: 0 },
    }),
    [emptyTexture],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => emptyTexture.dispose(), [emptyTexture]);

  useEffect(() => {
    let disposed = false;
    let loadedTexture: THREE.Texture | null = null;
    const loader = new THREE.TextureLoader();
    loader.load(
      `${import.meta.env.BASE_URL}media/remnant-accretion.webp`,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        loadedTexture = texture;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        remnantUniforms.uAccretionMap.value = texture;
        remnantUniforms.uPlateReady.value = 1;
        if (remnant.current) {
          remnant.current.uniforms.uAccretionMap.value = texture;
          remnant.current.uniforms.uPlateReady.value = 1;
        }
        invalidate();
      },
      undefined,
      () => {
        // The analytic photon ring remains a complete fallback if media fails.
      },
    );
    return () => {
      disposed = true;
      loadedTexture?.dispose();
    };
  }, [emptyTexture, invalidate, remnantUniforms]);

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      pointerGoal.current.set(
        (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2,
        (0.5 - event.clientY / Math.max(1, window.innerHeight)) * 2,
      );
    };
    window.addEventListener("pointermove", handlePointer, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointer);
  }, []);

  // Resolution and the DOM target change rarely, so they stay in an effect. The
  // narrative value never does: writing it here would tie the scene back to the
  // scroll event and reintroduce the flipbook.
  useEffect(() => {
    const pixelRatio = gl.getPixelRatio();
    const targetX = target?.x ?? 0.5;
    const targetY = target?.y ?? 0.5;
    const targetSize = target?.size ?? 0.09;
    const resolution = new THREE.Vector2(size.width * pixelRatio, size.height * pixelRatio);
    const world = new THREE.Vector2((targetX - 0.5) * viewport.width, (0.5 - targetY) * viewport.height);

    // Where the convergence sits, expressed as a fraction of the frame so it stays
    // clear of the copy at every size: right of the column on desktop, above it on
    // phones, where the copy runs full width.
    const aspect = size.width / Math.max(1, size.height);
    const halfTan = Math.tan((((compact ? 58 : CAMERA_FOV) * Math.PI) / 360));
    const focusFractionX = compact ? 0 : 0.3;
    const focusFractionY = compact ? 0.3 : 0.26;
    const focus = new THREE.Vector2(halfTan * aspect * focusFractionX, halfTan * focusFractionY);
    // The backdrop's own coordinate space is normalized by the shorter side, so the
    // same screen fraction is a different number there.
    const minimumSide = Math.max(1, Math.min(size.width, size.height));
    const focusUv = new THREE.Vector2(
      (focusFractionX * 0.5 * size.width) / minimumSide,
      (focusFractionY * 0.5 * size.height) / minimumSide,
    );
    // Just past the frame's half-width, where the stream's own falloff has it at zero.
    const streamReach = halfTan * aspect * 1.05;

    particleUniforms.uPixelRatio.value = pixelRatio;
    particleUniforms.uTargetWorld.value.copy(world);
    particleUniforms.uFocus.value.copy(focus);
    particleUniforms.uStreamReach.value = streamReach;
    backdropUniforms.uFocus.value.copy(focusUv);
    backdropUniforms.uResolution.value.copy(resolution);
    remnantUniforms.uResolution.value.copy(resolution);
    remnantUniforms.uTarget.value.set(targetX, 1 - targetY);
    remnantUniforms.uTargetSize.value = targetSize;

    if (particles.current) {
      particles.current.uniforms.uPixelRatio.value = pixelRatio;
      particles.current.uniforms.uTargetWorld.value.copy(world);
      particles.current.uniforms.uFocus.value.copy(focus);
      particles.current.uniforms.uStreamReach.value = streamReach;
    }
    if (backdrop.current) {
      backdrop.current.uniforms.uResolution.value.copy(resolution);
      backdrop.current.uniforms.uFocus.value.copy(focusUv);
    }
    if (remnant.current) {
      remnant.current.uniforms.uResolution.value.copy(resolution);
      remnant.current.uniforms.uTarget.value.set(targetX, 1 - targetY);
      remnant.current.uniforms.uTargetSize.value = targetSize;
    }
    invalidate();
  }, [
    backdropUniforms,
    compact,
    gl,
    invalidate,
    particleUniforms,
    remnantUniforms,
    size.height,
    size.width,
    target,
    viewport.height,
    viewport.width,
  ]);

  useFrame(({ clock }, delta) => {
    // Two clocks. `elapsed` never stops, which is what keeps the scene alive when
    // the reader is not scrolling. `narrative` chases the scroll target through a
    // frame-rate independent damper, which is what stops discrete wheel notches
    // from becoming discrete frames.
    const dt = Math.min(0.05, Math.max(delta, 1 / 240));
    const elapsed = clock.getElapsedTime();
    const goal = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const previous = narrative.current;
    narrative.current = damp(previous, goal, NARRATIVE_LAMBDA, dt);
    velocity.current = damp(velocity.current, (narrative.current - previous) / dt, 8, dt);

    const drift = ambient(elapsed);
    const travel = cameraZ(narrative.current);
    pointer.current.lerp(pointerGoal.current, 0.115);

    // Written straight onto the mounted materials. Uniform objects built beside
    // the material and never attached to it are the failure this spells out.
    if (particles.current) {
      particles.current.uniforms.uProgress.value = narrative.current;
      particles.current.uniforms.uTime.value = elapsed;
      particles.current.uniforms.uTravel.value = travel;
      particles.current.uniforms.uVelocity.value = velocity.current;
      particles.current.uniforms.uPointer.value.copy(pointer.current);
      particles.current.uniforms.uAmbient.value.set(drift.driftX, drift.driftY, drift.dolly);
    }
    if (backdrop.current) {
      backdrop.current.uniforms.uProgress.value = narrative.current;
      backdrop.current.uniforms.uTime.value = elapsed;
      backdrop.current.uniforms.uPointer.value.copy(pointer.current);
      backdrop.current.uniforms.uAmbient.value.set(drift.driftX, drift.driftY, drift.dolly);
    }
    if (remnant.current) {
      remnant.current.uniforms.uProgress.value = narrative.current;
      remnant.current.uniforms.uTime.value = elapsed;
    }

    // The camera pans and rolls; it does not look at a point, because a lookAt
    // would cancel the roll every frame.
    const fieldWindow = THREE.MathUtils.smoothstep(narrative.current, 0.58, 0.72) * (1 - THREE.MathUtils.smoothstep(narrative.current, 0.8, 0.9));
    camera.position.set(
      pointer.current.x * fieldWindow * 0.34 + drift.driftX * 0.35,
      pointer.current.y * fieldWindow * 0.22 + drift.driftY * 0.35,
      0,
    );
    camera.rotation.set(0, 0, drift.roll);
  });

  return (
    <>
      <mesh frustumCulled={false} renderOrder={-20}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={backdrop}
          depthTest={false}
          depthWrite={false}
          fragmentShader={backdropFragmentShader}
          toneMapped={false}
          uniforms={backdropUniforms}
          vertexShader={screenVertexShader}
        />
      </mesh>

      <points geometry={geometry} frustumCulled={false} renderOrder={0}>
        <shaderMaterial
          ref={particles}
          blending={THREE.AdditiveBlending}
          depthTest
          depthWrite={false}
          fragmentShader={particleFragmentShader}
          toneMapped={false}
          transparent
          uniforms={particleUniforms}
          vertexShader={particleVertexShader}
        />
      </points>

      <mesh frustumCulled={false} renderOrder={20}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={remnant}
          blending={THREE.NormalBlending}
          depthTest={false}
          depthWrite={false}
          fragmentShader={remnantFragmentShader}
          toneMapped={false}
          transparent
          uniforms={remnantUniforms}
          vertexShader={screenVertexShader}
        />
      </mesh>
    </>
  );
}

type BoundaryProps = {
  children: ReactNode;
  onFailure: () => void;
};

class HeroErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
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

function FirstFrameReady({ failed, onReady }: { failed: React.MutableRefObject<boolean>; onReady: () => void }) {
  const reported = useRef(false);

  useFrame(() => {
    if (reported.current) return;
    reported.current = true;
    requestAnimationFrame(() => {
      if (!failed.current) onReady();
    });
  });

  return null;
}

/**
 * Decorative WebGL layer for the pinned hero. All meaning and typography must
 * remain in the DOM above or beneath this cover so failure is automatically safe.
 */
export default function HeroExperience({
  active,
  className,
  onFailure,
  onReady,
  progressRef,
  target,
}: HeroExperienceProps) {
  const compact = typeof window !== "undefined" && window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  const failed = useRef(false);
  const ready = useRef(false);
  const fail = useCallback(() => {
    if (failed.current) return;
    failed.current = true;
    onFailure();
  }, [onFailure]);
  const reportReady = useCallback(() => {
    if (failed.current || ready.current) return;
    ready.current = true;
    onReady?.();
  }, [onReady]);

  return (
    <div aria-hidden="true" className={className} style={{ inset: 0, overflow: "hidden", position: "absolute" }}>
      <HeroErrorBoundary onFailure={fail}>
        <Canvas
          camera={{ far: 140, fov: compact ? 58 : CAMERA_FOV, near: 0.1, position: [0, 0, 0] }}
          dpr={[0.72, compact ? 1.25 : 1.5]}
          frameloop={active ? "always" : "demand"}
          gl={{ alpha: false, antialias: false, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            try {
              gl.outputColorSpace = THREE.SRGBColorSpace;
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.0;
              gl.setClearColor(0x010208, 1);
              gl.debug.checkShaderErrors = true;
              gl.debug.onShaderError = () => fail();
              gl.domElement.addEventListener(
                "webglcontextlost",
                (event) => {
                  event.preventDefault();
                  fail();
                },
                { once: true },
              );
            } catch {
              fail();
            }
          }}
        >
          <HeroScene compact={compact} progressRef={progressRef} target={target} />
          <FirstFrameReady failed={failed} onReady={reportReady} />
        </Canvas>
      </HeroErrorBoundary>
    </div>
  );
}
